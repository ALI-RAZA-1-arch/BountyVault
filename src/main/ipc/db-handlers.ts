import { ipcMain } from 'electron'
import { selectObjects, selectValue, run, renumberReports } from '../db'

export function setupDbHandlers(): void {
  // companies
  ipcMain.handle('companies:list', async () => {
    try {
      const data = selectObjects(`
        SELECT c.*, pl.name as platform_name,
          (SELECT COUNT(*) FROM reports WHERE company_id = c.id) as report_count,
          (SELECT COUNT(*) FROM reports WHERE company_id = c.id AND status = 'Accepted') as accepted_count,
          (SELECT COALESCE(SUM(b.amount),0) FROM bounties b JOIN reports r ON b.report_id = r.id WHERE r.company_id = c.id AND b.status IN ('Awarded','Paid')) as total_bounty
        FROM companies c LEFT JOIN platforms pl ON c.platform_id=pl.id ORDER BY c.name ASC
      `)
      return { data }
    } catch (error) { return { error: String(error) } }
  })
  
  ipcMain.handle('companies:get', async (_, id: number) => {
    try {
      const data = selectObjects('SELECT * FROM companies WHERE id = ?', [id])[0]
      return { data }
    } catch (error) { return { error: String(error) } }
  })
  
  ipcMain.handle('companies:create', async (_, data: any) => {
    try {
      run('INSERT INTO companies (name, website, notes, target_type, platform_id) VALUES (?, ?, ?, ?, ?)', [data.name, data.website || '', data.notes || '', data.target_type || 'Self-Hosted', data.platform_id || null])
      const id = selectValue('SELECT last_insert_rowid()')
      return { data: { id } }
    } catch (error) { return { error: String(error) } }
  })
  
  ipcMain.handle('companies:update', async (_, { id, data }: { id: number; data: any }) => {
    try {
      run(`UPDATE companies SET name=?, website=?, notes=?, target_type=?, platform_id=?, updated_at=datetime('now') WHERE id=?`, [data.name, data.website || '', data.notes || '', data.target_type || 'Self-Hosted', data.platform_id || null, id])
      return { data: true }
    } catch (error) { return { error: String(error) } }
  })
  
  ipcMain.handle('companies:delete', async (_, id: number) => {
    try {
      run('DELETE FROM companies WHERE id = ?', [id])
      return { data: true }
    } catch (error) { return { error: String(error) } }
  })

  // programs
  ipcMain.handle('programs:list', async (_, filters?: { company_id?: number }) => {
    try {
      let sql = `SELECT p.*, c.name as company_name, pl.name as platform_name,
        (SELECT COUNT(*) FROM reports WHERE program_id = p.id) as report_count,
        (SELECT COUNT(*) FROM reports WHERE program_id = p.id AND status='Accepted') as accepted_count,
        (SELECT COALESCE(SUM(b.amount),0) FROM bounties b JOIN reports r ON b.report_id=r.id WHERE r.program_id=p.id AND b.status IN ('Awarded','Paid')) as total_bounty
        FROM programs p LEFT JOIN companies c ON p.company_id=c.id LEFT JOIN platforms pl ON p.platform_id=pl.id`
      const params: any[] = []
      if (filters?.company_id) { sql += ' WHERE p.company_id = ?'; params.push(filters.company_id) }
      sql += ' ORDER BY p.name ASC'
      return { data: selectObjects(sql, params) }
    } catch (error) { return { error: String(error) } }
  })
  
  ipcMain.handle('programs:get', async (_, id: number) => {
    try {
      const data = selectObjects(`SELECT p.*, c.name as company_name, pl.name as platform_name FROM programs p LEFT JOIN companies c ON p.company_id=c.id LEFT JOIN platforms pl ON p.platform_id=pl.id WHERE p.id=?`, [id])[0]
      return { data }
    } catch (error) { return { error: String(error) } }
  })
  
  ipcMain.handle('programs:create', async (_, data: any) => {
    try {
      run(`INSERT INTO programs (company_id,name,website,program_url,platform_id,type,scope,out_of_scope,rules,notes,status,start_date,end_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [data.company_id||null, data.name, data.website||'', data.program_url||'', data.platform_id||null, data.type||'BBP', data.scope||'', data.out_of_scope||'', data.rules||'', data.notes||'', data.status||'Active', data.start_date||'', data.end_date||''])
      const id = selectValue('SELECT last_insert_rowid()')
      return { data: { id } }
    } catch (error) { return { error: String(error) } }
  })
  
  ipcMain.handle('programs:update', async (_, { id, data }: { id: number; data: any }) => {
    try {
      run(`UPDATE programs SET company_id=?,name=?,website=?,program_url=?,platform_id=?,type=?,scope=?,out_of_scope=?,rules=?,notes=?,status=?,start_date=?,end_date=?,updated_at=datetime('now') WHERE id=?`,
        [data.company_id||null, data.name, data.website||'', data.program_url||'', data.platform_id||null, data.type||'BBP', data.scope||'', data.out_of_scope||'', data.rules||'', data.notes||'', data.status||'Active', data.start_date||'', data.end_date||'', id])
      return { data: true }
    } catch (error) { return { error: String(error) } }
  })
  
  ipcMain.handle('programs:delete', async (_, id: number) => {
    try { run('DELETE FROM programs WHERE id=?', [id]); return { data: true } }
    catch (error) { return { error: String(error) } }
  })

  // reports
  ipcMain.handle('reports:list', async (_, filters?: any) => {
    try {
      let sql = `SELECT r.*, c.name as company_name, p.name as program_name, vt.name as vuln_type_name, pl.name as platform_name,
        b.amount as bounty_amount, b.currency as bounty_currency, b.status as bounty_status
        FROM reports r
        LEFT JOIN companies c ON r.company_id=c.id
        LEFT JOIN programs p ON r.program_id=p.id
        LEFT JOIN vulnerability_types vt ON r.vuln_type_id=vt.id
        LEFT JOIN platforms pl ON r.platform_id=pl.id
        LEFT JOIN bounties b ON b.report_id=r.id`
      const conditions: string[] = []
      const params: any[] = []
      if (filters?.company_id) { conditions.push('r.company_id=?'); params.push(filters.company_id) }
      if (filters?.program_id) { conditions.push('r.program_id=?'); params.push(filters.program_id) }
      if (filters?.severity) { conditions.push('r.severity=?'); params.push(filters.severity) }
      if (filters?.status) { conditions.push('r.status=?'); params.push(filters.status) }
      if (filters?.vuln_type_id) { conditions.push('r.vuln_type_id=?'); params.push(filters.vuln_type_id) }
      if (filters?.search) { conditions.push('(r.title LIKE ? OR r.target LIKE ? OR r.external_id LIKE ?)'); params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`) }
      if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ')
      sql += ' ORDER BY r.created_at DESC'
      if (filters?.limit) { sql += ' LIMIT ?'; params.push(filters.limit) }
      if (filters?.offset) { sql += ' OFFSET ?'; params.push(filters.offset) }
      return { data: selectObjects(sql, params) }
    } catch (error) { return { error: String(error) } }
  })
  
  ipcMain.handle('reports:get', async (_, id: number) => {
    try {
      const data = selectObjects(`SELECT r.*, c.name as company_name, p.name as program_name, vt.name as vuln_type_name, pl.name as platform_name FROM reports r LEFT JOIN companies c ON r.company_id=c.id LEFT JOIN programs p ON r.program_id=p.id LEFT JOIN vulnerability_types vt ON r.vuln_type_id=vt.id LEFT JOIN platforms pl ON r.platform_id=pl.id WHERE r.id=?`, [id])[0]
      return { data }
    } catch (error) { return { error: String(error) } }
  })
  
  ipcMain.handle('reports:create', async (_, data: any) => {
    try {
      run(`INSERT INTO reports (title,company_id,program_id,target,vuln_type_id,severity,cvss,url,description,impact,steps,source,status,platform_id,external_id,external_url,date_discovered,date_submitted,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [data.title, data.company_id||null, data.program_id||null, data.target||'', data.vuln_type_id||null, data.severity||'Medium', data.cvss||'', data.url||'', data.description||'', data.impact||'', data.steps||'', data.source||'', data.status||'Draft', data.platform_id||null, data.external_id||'', data.external_url||'', data.date_discovered||'', data.date_submitted||'', data.notes||''])
      const id = selectValue('SELECT last_insert_rowid()') as number
      // Auto-add timeline event
      run(`INSERT INTO report_timeline (report_id, event_type, description, event_date) VALUES (?, 'created', 'Report created', datetime('now'))`, [id])
      return { data: { id } }
    } catch (error) { return { error: String(error) } }
  })
  
  ipcMain.handle('reports:update', async (_, { id, data }: { id: number; data: any }) => {
    try {
      run(`UPDATE reports SET title=?,company_id=?,program_id=?,target=?,vuln_type_id=?,severity=?,cvss=?,url=?,description=?,impact=?,steps=?,source=?,status=?,platform_id=?,external_id=?,external_url=?,date_discovered=?,date_submitted=?,notes=?,updated_at=datetime('now') WHERE id=?`,
        [data.title, data.company_id||null, data.program_id||null, data.target||'', data.vuln_type_id||null, data.severity||'Medium', data.cvss||'', data.url||'', data.description||'', data.impact||'', data.steps||'', data.source||'', data.status||'Draft', data.platform_id||null, data.external_id||'', data.external_url||'', data.date_discovered||'', data.date_submitted||'', data.notes||'', id])
      return { data: true }
    } catch (error) { return { error: String(error) } }
  })
  
  ipcMain.handle('reports:delete', async (_, id: number) => {
    try { run('DELETE FROM reports WHERE id=?', [id]); renumberReports(); return { data: true } }
    catch (error) { return { error: String(error) } }
  })

  // timeline
  ipcMain.handle('timeline:list', async (_, reportId: number) => {
    try { return { data: selectObjects('SELECT * FROM report_timeline WHERE report_id=? ORDER BY event_date ASC', [reportId]) }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('timeline:add', async (_, data: any) => {
    try {
      run('INSERT INTO report_timeline (report_id,event_type,description,event_date) VALUES (?,?,?,?)', [data.report_id, data.event_type, data.description||'', data.event_date||new Date().toISOString()])
      return { data: true }
    } catch (error) { return { error: String(error) } }
  })

  // responses
  ipcMain.handle('responses:list', async (_, reportId?: number) => {
    try {
      let sql = `SELECT r.*, rep.title as report_title FROM responses r LEFT JOIN reports rep ON r.report_id=rep.id`
      const params: any[] = []
      if (reportId) { sql += ' WHERE r.report_id=?'; params.push(reportId) }
      sql += ' ORDER BY r.response_date DESC'
      return { data: selectObjects(sql, params) }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('responses:create', async (_, data: any) => {
    try {
      run('INSERT INTO responses (report_id,response_date,response_text,response_type,notes) VALUES (?,?,?,?,?)', [data.report_id, data.response_date, data.response_text||'', data.response_type||'Other', data.notes||''])
      return { data: true }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('responses:update', async (_, { id, data }: any) => {
    try {
      run('UPDATE responses SET response_date=?,response_text=?,response_type=?,notes=? WHERE id=?', [data.response_date, data.response_text||'', data.response_type||'Other', data.notes||'', id])
      return { data: true }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('responses:delete', async (_, id: number) => {
    try { run('DELETE FROM responses WHERE id=?', [id]); return { data: true } }
    catch (error) { return { error: String(error) } }
  })

  // bounties
  ipcMain.handle('bounties:list', async (_, filters?: any) => {
    try {
      let sql = `SELECT b.*, r.title as report_title, c.name as company_name FROM bounties b LEFT JOIN reports r ON b.report_id=r.id LEFT JOIN companies c ON r.company_id=c.id`
      const conditions: string[] = []
      const params: any[] = []
      if (filters?.status) { conditions.push('b.status=?'); params.push(filters.status) }
      if (filters?.company_id) { conditions.push('r.company_id=?'); params.push(filters.company_id) }
      if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ')
      sql += ' ORDER BY b.created_at DESC'
      return { data: selectObjects(sql, params) }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('bounties:get-by-report', async (_, reportId: number) => {
    try { return { data: selectObjects('SELECT * FROM bounties WHERE report_id=?', [reportId])[0] || null }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('bounties:save', async (_, { reportId, data }: { reportId: number; data: any }) => {
    try {
      const existing = selectValue('SELECT id FROM bounties WHERE report_id=?', [reportId])
      if (existing) {
        run(`UPDATE bounties SET amount=?,currency=?,status=?,date_awarded=?,date_paid=?,payment_method=?,platform=?,reference_id=?,notes=?,updated_at=datetime('now') WHERE report_id=?`,
          [data.amount||0, data.currency||'USD', data.status||'None', data.date_awarded||'', data.date_paid||'', data.payment_method||'', data.platform||'', data.reference_id||'', data.notes||'', reportId])
      } else {
        run('INSERT INTO bounties (report_id,amount,currency,status,date_awarded,date_paid,payment_method,platform,reference_id,notes) VALUES (?,?,?,?,?,?,?,?,?,?)',
          [reportId, data.amount||0, data.currency||'USD', data.status||'None', data.date_awarded||'', data.date_paid||'', data.payment_method||'', data.platform||'', data.reference_id||'', data.notes||''])
      }
      return { data: true }
    } catch (error) { return { error: String(error) } }
  })

  // attachments
  ipcMain.handle('attachments:list', async (_, reportId: number) => {
    try { return { data: selectObjects('SELECT * FROM attachments WHERE report_id=? ORDER BY created_at DESC', [reportId]) }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('attachments:create', async (_, data: any) => {
    try {
      run('INSERT INTO attachments (report_id,filename,filepath,filetype,filesize) VALUES (?,?,?,?,?)', [data.report_id, data.filename, data.filepath, data.filetype||'', data.filesize||0])
      return { data: true }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('attachments:delete', async (_, id: number) => {
    try { run('DELETE FROM attachments WHERE id=?', [id]); return { data: true } }
    catch (error) { return { error: String(error) } }
  })

  // notes
  ipcMain.handle('notes:list', async (_, reportId?: number) => {
    try {
      if (reportId) return { data: selectObjects('SELECT * FROM notes WHERE report_id=? ORDER BY created_at DESC', [reportId]) }
      return { data: selectObjects('SELECT * FROM notes ORDER BY created_at DESC') }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('notes:create', async (_, data: any) => {
    try {
      run('INSERT INTO notes (report_id,title,content,note_type) VALUES (?,?,?,?)', [data.report_id||null, data.title||'', data.content||'', data.note_type||'general'])
      return { data: true }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('notes:update', async (_, { id, data }: any) => {
    try {
      run(`UPDATE notes SET title=?,content=?,note_type=?,updated_at=datetime('now') WHERE id=?`, [data.title||'', data.content||'', data.note_type||'general', id])
      return { data: true }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('notes:delete', async (_, id: number) => {
    try { run('DELETE FROM notes WHERE id=?', [id]); return { data: true } }
    catch (error) { return { error: String(error) } }
  })

  // retests
  ipcMain.handle('retests:list', async (_, reportId: number) => {
    try { return { data: selectObjects('SELECT * FROM retests WHERE report_id=? ORDER BY retest_date DESC', [reportId]) }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('retests:create', async (_, data: any) => {
    try {
      run('INSERT INTO retests (report_id,retest_date,result,notes) VALUES (?,?,?,?)', [data.report_id, data.retest_date, data.result, data.notes||''])
      return { data: true }
    } catch (error) { return { error: String(error) } }
  })

  // workflow definitions
  ipcMain.handle('workflows:list-defs', async () => {
    try { return { data: selectObjects('SELECT * FROM workflow_definitions ORDER BY name ASC') }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('workflows:get-def', async (_, id: number) => {
    try { return { data: selectObjects('SELECT * FROM workflow_definitions WHERE id=?', [id])[0] }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('workflows:create-def', async (_, data: any) => {
    try {
      run('INSERT INTO workflow_definitions (name,description,category,inputs_json,steps_json) VALUES (?,?,?,?,?)',
        [data.name, data.description||'', data.category||'custom', JSON.stringify(data.inputs||[]), JSON.stringify(data.steps||[])])
      const id = selectValue('SELECT last_insert_rowid()')
      return { data: { id } }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('workflows:update-def', async (_, { id, data }: any) => {
    try {
      run(`UPDATE workflow_definitions SET name=?,description=?,category=?,inputs_json=?,steps_json=?,updated_at=datetime('now') WHERE id=?`,
        [data.name, data.description||'', data.category||'custom', JSON.stringify(data.inputs||[]), JSON.stringify(data.steps||[]), id])
      return { data: true }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('workflows:delete-def', async (_, id: number) => {
    try { run('DELETE FROM workflow_definitions WHERE id=?', [id]); return { data: true } }
    catch (error) { return { error: String(error) } }
  })

  // workflow runs
  ipcMain.handle('workflows:list-runs', async (_, filters?: any) => {
    try {
      let sql = `SELECT wr.*, wd.name as workflow_def_name FROM workflow_runs wr LEFT JOIN workflow_definitions wd ON wr.workflow_id=wd.id`
      const conditions: string[] = []
      const params: any[] = []
      if (filters?.workflow_id) { conditions.push('wr.workflow_id=?'); params.push(filters.workflow_id) }
      if (filters?.status) { conditions.push('wr.status=?'); params.push(filters.status) }
      if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ')
      sql += ' ORDER BY wr.created_at DESC LIMIT 100'
      return { data: selectObjects(sql, params) }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('workflows:get-run', async (_, id: number) => {
    try { return { data: selectObjects('SELECT * FROM workflow_runs WHERE id=?', [id])[0] }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('workflows:create-run', async (_, data: any) => {
    try {
      run('INSERT INTO workflow_runs (workflow_id,workflow_name,target_input,inputs_json,company_id,program_id,status) VALUES (?,?,?,?,?,?,?)',
        [data.workflow_id||null, data.workflow_name, data.target_input||'', JSON.stringify(data.inputs||{}), data.company_id||null, data.program_id||null, 'Queued'])
      const id = selectValue('SELECT last_insert_rowid()')
      return { data: { id } }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('workflows:update-run', async (_, { id, data }: any) => {
    try {
      run(`UPDATE workflow_runs SET status=?,started_at=?,ended_at=?,logs=? WHERE id=?`, [data.status, data.started_at||'', data.ended_at||'', data.logs||'', id])
      return { data: true }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('workflows:list-outputs', async (_, runId: number) => {
    try { return { data: selectObjects('SELECT * FROM workflow_outputs WHERE run_id=?', [runId]) }
    } catch (error) { return { error: String(error) } }
  })

  // platforms
  ipcMain.handle('platforms:list', async () => {
    try { return { data: selectObjects('SELECT * FROM platforms ORDER BY name') }
    } catch (error) { return { error: String(error) } }
  })

  // vulnerability types
  ipcMain.handle('vuln-types:list', async () => {
    try { return { data: selectObjects('SELECT * FROM vulnerability_types ORDER BY name') }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('vuln-types:create', async (_, name: string) => {
    try {
      run('INSERT INTO vulnerability_types (name, is_custom) VALUES (?, 1)', [name])
      return { data: true }
    } catch (error) { return { error: String(error) } }
  })

  // settings
  ipcMain.handle('settings:get-all', async () => {
    try {
      const rows = selectObjects('SELECT * FROM settings')
      const settings: Record<string, string> = {}
      rows.forEach((r: any) => { settings[r.key] = r.value })
      return { data: settings }
    } catch (error) { return { error: String(error) } }
  })
  ipcMain.handle('settings:set', async (_, { key, value }: { key: string; value: string }) => {
    try {
      run(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`, [key, value])
      return { data: true }
    } catch (error) { return { error: String(error) } }
  })

  // dashboard stats
  ipcMain.handle('stats:dashboard', async () => {
    try {
      const totalReports = selectValue('SELECT COUNT(*) FROM reports') as number
      const accepted = selectValue("SELECT COUNT(*) FROM reports WHERE status='Accepted'") as number
      const submitted = selectValue("SELECT COUNT(*) FROM reports WHERE status='Submitted'") as number
      const resolved = selectValue("SELECT COUNT(*) FROM reports WHERE status='Resolved'") as number
      const duplicates = selectValue("SELECT COUNT(*) FROM reports WHERE status='Duplicate'") as number
      const rejected = selectValue("SELECT COUNT(*) FROM reports WHERE status='Rejected'") as number
      const totalBounty = selectValue("SELECT COALESCE(SUM(amount),0) FROM bounties WHERE status IN ('Awarded','Paid')") as number
      const pendingBounty = selectValue("SELECT COALESCE(SUM(amount),0) FROM bounties WHERE status='Pending'") as number
      const companies = selectValue('SELECT COUNT(*) FROM companies') as number
      const programs = selectValue('SELECT COUNT(*) FROM programs') as number
      const recentReports = selectObjects(`SELECT r.*, c.name as company_name, vt.name as vuln_type_name FROM reports r LEFT JOIN companies c ON r.company_id=c.id LEFT JOIN vulnerability_types vt ON r.vuln_type_id=vt.id ORDER BY r.created_at DESC LIMIT 5`)
      const recentRuns = selectObjects('SELECT * FROM workflow_runs ORDER BY created_at DESC LIMIT 5')
      const statusBreakdown = selectObjects("SELECT status, COUNT(*) as count FROM reports GROUP BY status")
      const bountyByMonth = selectObjects("SELECT strftime('%Y-%m', COALESCE(date_awarded, created_at)) as month, SUM(amount) as total FROM bounties WHERE status IN ('Awarded','Paid') GROUP BY month ORDER BY month DESC LIMIT 12")
      return { data: { totalReports, accepted, submitted, resolved, duplicates, rejected, totalBounty, pendingBounty, companies, programs, recentReports, recentRuns, statusBreakdown, bountyByMonth } }
    } catch (error) { return { error: String(error) } }
  })

  // monthly earnings
  ipcMain.handle('stats:monthly', async () => {
    try {
      const rows = selectObjects("SELECT strftime('%Y-%m', COALESCE(date_awarded, created_at)) as month, SUM(amount) as total, COUNT(*) as count FROM bounties WHERE status IN ('Awarded','Paid') GROUP BY month ORDER BY month DESC")
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const current = rows.find((r: any) => r.month === currentMonth)
      return { data: { currentMonth, currentMonthTotal: current?.total || 0, currentMonthCount: current?.count || 0, months: rows } }
    } catch (error) { return { error: String(error) } }
  })

  // global search
  ipcMain.handle('search:global', async (_, query: string) => {
    try {
      const q = `%${query}%`
      const reports = selectObjects(`SELECT id, title, status, severity, 'report' as type FROM reports WHERE title LIKE ? OR target LIKE ? OR external_id LIKE ? OR notes LIKE ? LIMIT 10`, [q,q,q,q])
      const companies = selectObjects(`SELECT id, name as title, '' as status, '' as severity, 'company' as type FROM companies WHERE name LIKE ? LIMIT 5`, [q])
      const programs = selectObjects(`SELECT id, name as title, status, '' as severity, 'program' as type FROM programs WHERE name LIKE ? LIMIT 5`, [q])
      return { data: [...reports, ...companies, ...programs] }
    } catch (error) { return { error: String(error) } }
  })
}
