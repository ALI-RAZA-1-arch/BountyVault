import { Database } from 'node-sqlite3-wasm'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync, existsSync } from 'fs'

let db: Database | null = null

export function getDb(): Database {
  if (db && db.isOpen) return db

  const dataDir = join(app.getPath('userData'), 'data')
  mkdirSync(dataDir, { recursive: true })

  db = new Database(join(dataDir, 'bountyvault.db'))
  db.exec('PRAGMA journal_mode = WAL;')
  db.exec('PRAGMA foreign_keys = ON;')

  initSchema(db)
  migrate(db)
  seedData(db)
  renumberReports()

  return db
}

export function selectObjects(sql: string, params: any[] = []): any[] {
  return getDb().all(sql, params as any) as any[]
}

export function selectValue(sql: string, params: any[] = []): any {
  const row = getDb().get(sql, params as any)
  if (!row) return null
  return Object.values(row)[0]
}

export function run(sql: string, params: any[] = []): any {
  return getDb().run(sql, params as any)
}

const CHILD_TABLES = ['report_timeline', 'responses', 'bounties', 'attachments', 'notes', 'retests', 'workflow_runs']

// Reassign sequential ids (1,2,3...) to remaining reports after a delete,
// keeping all child references consistent.
export function renumberReports(): void {
  const d = getDb()
  const rows = d.all('SELECT id FROM reports ORDER BY id ASC') as any[]

  d.exec('PRAGMA foreign_keys = OFF')
  d.exec('BEGIN')
  try {
    if (rows.length === 0) {
      d.run("DELETE FROM sqlite_sequence WHERE name='reports'" as any)
      d.exec('COMMIT')
      return
    }
    rows.forEach((r: any, i: number) => {
      const tempId = 1000000 + i
      CHILD_TABLES.forEach((t) => d.run(`UPDATE ${t} SET report_id=? WHERE report_id=?`, [tempId, r.id] as any))
      d.run('UPDATE reports SET id=? WHERE id=?', [tempId, r.id] as any)
    })
    rows.forEach((_r: any, i: number) => {
      const tempId = 1000000 + i
      const newId = i + 1
      CHILD_TABLES.forEach((t) => d.run(`UPDATE ${t} SET report_id=? WHERE report_id=?`, [newId, tempId] as any))
      d.run('UPDATE reports SET id=? WHERE id=?', [newId, tempId] as any)
    })
    d.run("UPDATE sqlite_sequence SET seq = (SELECT COALESCE(MAX(id),0) FROM reports) WHERE name='reports'" as any)
    d.exec('COMMIT')
  } catch (err) {
    d.exec('ROLLBACK')
    throw err
  } finally {
    d.exec('PRAGMA foreign_keys = ON')
  }
}

function initSchema(d: Database): void {
  d.exec(`
    CREATE TABLE IF NOT EXISTS platforms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS vulnerability_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      is_custom INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      website TEXT,
      notes TEXT,
      target_type TEXT DEFAULT 'Self-Hosted',
      platform_id INTEGER REFERENCES platforms(id) ON DELETE SET NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      website TEXT,
      program_url TEXT,
      platform_id INTEGER REFERENCES platforms(id) ON DELETE SET NULL,
      type TEXT DEFAULT 'BBP',
      scope TEXT,
      out_of_scope TEXT,
      rules TEXT,
      notes TEXT,
      status TEXT DEFAULT 'Active',
      start_date TEXT,
      end_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
      program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
      target TEXT,
      vuln_type_id INTEGER REFERENCES vulnerability_types(id) ON DELETE SET NULL,
      severity TEXT DEFAULT 'Medium',
      cvss TEXT,
      url TEXT,
      description TEXT,
      impact TEXT,
      steps TEXT,
      source TEXT,
      status TEXT DEFAULT 'Draft',
      platform_id INTEGER REFERENCES platforms(id) ON DELETE SET NULL,
      external_id TEXT,
      external_url TEXT,
      date_discovered TEXT,
      date_submitted TEXT,
      notes TEXT,
      is_duplicate INTEGER DEFAULT 0,
      duplicate_of TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS report_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      description TEXT,
      event_date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
      response_date TEXT NOT NULL,
      response_text TEXT,
      response_type TEXT DEFAULT 'Other',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS bounties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
      amount REAL DEFAULT 0,
      currency TEXT DEFAULT 'USD',
      status TEXT DEFAULT 'None',
      date_awarded TEXT,
      date_paid TEXT,
      payment_method TEXT,
      platform TEXT,
      reference_id TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      filetype TEXT,
      filesize INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
      title TEXT,
      content TEXT,
      note_type TEXT DEFAULT 'general',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS retests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
      retest_date TEXT NOT NULL,
      result TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS workflow_definitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'custom',
      inputs_json TEXT DEFAULT '[]',
      steps_json TEXT DEFAULT '[]',
      filename TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS workflow_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workflow_id INTEGER REFERENCES workflow_definitions(id) ON DELETE SET NULL,
      workflow_name TEXT NOT NULL,
      target_input TEXT,
      inputs_json TEXT DEFAULT '{}',
      company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
      program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
      report_id INTEGER REFERENCES reports(id) ON DELETE SET NULL,
      status TEXT DEFAULT 'Queued',
      started_at TEXT,
      ended_at TEXT,
      logs TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS workflow_outputs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id INTEGER NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `)
}

function migrate(d: Database): void {
  const cols = d.all('PRAGMA table_info(companies)') as any[]
  const names = cols.map(c => c.name)
  if (!names.includes('target_type')) {
    d.exec(`ALTER TABLE companies ADD COLUMN target_type TEXT DEFAULT 'Self-Hosted'`)
  }
  if (!names.includes('platform_id')) {
    d.exec('ALTER TABLE companies ADD COLUMN platform_id INTEGER REFERENCES platforms(id) ON DELETE SET NULL')
  }
  const existing = selectValue("SELECT value FROM settings WHERE key='workflows_dir'")
  if (!existing) {
    const projectDir = join(process.cwd(), 'workflows')
    const defaultDir = existsSync(projectDir) ? projectDir : join(app.getAppPath(), 'workflows')
    d.run("INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('workflows_dir', ?, datetime('now'))", [defaultDir] as any)
  }
}

function seedData(d: Database): void {
  const platformCount = selectValue('SELECT COUNT(*) FROM platforms')
  if (!platformCount) {
    const ins = d.prepare('INSERT OR IGNORE INTO platforms (name, url) VALUES (?, ?)')
    ;[
      ['HackerOne', 'https://hackerone.com'],
      ['Bugcrowd', 'https://bugcrowd.com'],
      ['Intigriti', 'https://intigriti.com'],
      ['YesWeHack', 'https://yeswehack.com'],
      ['Synack', 'https://synack.com'],
      ['Direct', ''],
      ['Custom', '']
    ].forEach(([n, u]) => ins.run([n, u] as any))
    ins.finalize()
  }

  const vulnCount = selectValue('SELECT COUNT(*) FROM vulnerability_types')
  if (!vulnCount) {
    const ins = d.prepare('INSERT OR IGNORE INTO vulnerability_types (name) VALUES (?)')
    ;[
      'XSS', 'SQL Injection', 'IDOR', 'SSRF', 'LFI', 'RFI', 'RCE',
      'Authentication Bypass', 'Authorization Flaw', 'CSRF',
      'Open Redirect', 'Information Disclosure', 'Security Misconfiguration',
      'Account Takeover', 'Business Logic', 'Path Traversal',
      'XXE', 'SSTI', 'Mass Assignment', 'Rate Limiting',
      'Subdomain Takeover', 'CORS Misconfiguration', 'Clickjacking', 'Other'
    ].forEach(n => ins.run([n] as any))
    ins.finalize()
  }

  const settingsCount = selectValue('SELECT COUNT(*) FROM settings')
  if (!settingsCount) {
    const ins = d.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
    ;[
      ['theme', 'dark'],
      ['wsl_distro', 'kali-linux'],
      ['default_currency', 'USD'],
      ['auto_backup', '1'],
      ['app_version', '1.0.0'],
      ['workflows_dir', join(app.getAppPath(), 'workflows')]
    ].forEach(([k, v]) => ins.run([k, v] as any))
    ins.finalize()
  }
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
