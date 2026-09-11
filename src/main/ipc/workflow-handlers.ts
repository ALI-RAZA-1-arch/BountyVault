import { ipcMain, BrowserWindow, shell } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import { app } from 'electron'
import { join, dirname, basename } from 'path'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'fs'
import { run as dbRun, selectObjects, selectValue } from '../db'

const runningProcesses = new Map<number, ChildProcess>()
const cancelledRuns = new Set<number>()

function resolveWorkflowsDir(): string {
  const settings = selectObjects('SELECT * FROM settings') as any[]
  const map: Record<string, string> = {}
  settings.forEach((r: any) => { map[r.key] = r.value })
  if (map['workflows_dir'] && existsSync(map['workflows_dir'])) return map['workflows_dir']

  const candidates = [
    join(process.cwd(), 'workflows'),
    join(dirname(process.execPath), 'workflows'),
    join(app.getAppPath(), 'workflows'),
    join(app.getPath('userData'), 'workflows')
  ]
  for (const dir of candidates) {
    if (existsSync(dir)) return dir
  }
  return join(app.getPath('userData'), 'workflows')
}

function ensureWorkflowsDir(): string {
  const dir = resolveWorkflowsDir()
  mkdirSync(dir, { recursive: true })
  return dir
}

function sanitizeTarget(input: string): string {
  return String(input || 'target')
    .trim()
    .replace(/^\.+/, '')
    .replace(/[\\/\s]+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 80)
}

function execWsl(distro: string, command: string, runId?: number): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn('wsl.exe', ['-d', distro || 'kali-linux', '--', 'bash', '-l', '-c', command], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    })
    if (runId !== undefined) runningProcesses.set(runId, proc)
    let stdout = ''
    let stderr = ''
    proc.stdout?.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.stderr?.on('data', (d: Buffer) => { stderr += d.toString() })
    proc.on('close', (code) => {
      if (runId !== undefined) runningProcesses.delete(runId)
      resolve({ code, stdout, stderr })
    })
    proc.on('error', (err) => {
      if (runId !== undefined) runningProcesses.delete(runId)
      resolve({ code: null, stdout, stderr: err.message })
    })
  })
}

interface ParsedTxtWorkflow {
  name: string
  description: string
  category: string
  inputs: { name: string; type: string; description: string; required: boolean }[]
  steps: { name: string; command: string; description: string; continue_on_error: boolean }[]
}

function parseTxtWorkflow(content: string, filename: string, category: string): ParsedTxtWorkflow {
  const lines = content.split(/\r?\n/)
  const steps: ParsedTxtWorkflow['steps'] = []
  const placeholders = new Set<string>()
  const placeholderRegex = /<([^>]+)>/g

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('#') || line.startsWith('//')) continue
    const match = line.match(/^\d+[.)]?\s+(.+)$/)
    const command = match ? match[1].trim() : line
    if (!command) continue

    let nameMatch = command.match(placeholderRegex)
    while (nameMatch) {
      nameMatch.forEach((m) => {
        const inner = m.slice(1, -1).trim()
        if (inner) placeholders.add(inner)
      })
      break
    }

    steps.push({
      name: `Step ${steps.length + 1}`,
      command,
      description: '',
      continue_on_error: true
    })
  }

  const inputs: ParsedTxtWorkflow['inputs'] = []
  const placeholderToVar = new Map<string, string>()
  placeholders.forEach((ph) => {
    const name = ph === 'example.com' ? 'TARGET' : ph.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase()
    placeholderToVar.set(`<${ph}>`, `$${name}`)
    if (!inputs.some((i) => i.name === name)) {
      inputs.push({ name, type: 'text', description: ph, required: true })
    }
  })
  if (inputs.length === 0) {
    inputs.push({ name: 'TARGET', type: 'text', description: 'Target domain or IP', required: true })
  }

  steps.forEach((s) => {
    placeholderToVar.forEach((v, k) => {
      s.command = s.command.split(k).join(v)
    })
  })

  const base = basename(filename, '.txt').replace(/[-_]+/g, ' ').trim()
  return {
    name: base || 'Imported Workflow',
    description: `Imported from ${filename}${category ? ` (${category})` : ''}`,
    category: category || 'custom',
    inputs,
    steps
  }
}

export function setupWorkflowHandlers(): void {
  ipcMain.handle('workflow:check-wsl', async () => {
    try {
      return await new Promise((resolve) => {
        const proc = spawn('wsl.exe', ['--list', '--quiet'], { shell: true })
        let output = ''
        proc.stdout?.on('data', (d) => output += d.toString())
        proc.on('close', (code) => resolve({ data: { available: code === 0, distros: output.split('\n').map(s => s.replace(/\0/g, '').trim()).filter(Boolean) } }))
        proc.on('error', () => resolve({ data: { available: false, distros: [] } }))
      })
    } catch (error) { return { error: String(error) } }
  })

  ipcMain.handle('workflow:list-distros', async () => {
    try {
      return await new Promise((resolve) => {
        const proc = spawn('wsl.exe', ['--list', '--quiet'], { shell: true })
        let output = ''
        proc.stdout?.on('data', (d) => output += d.toString())
        proc.on('close', () => resolve({ data: output.split('\n').map(s => s.replace(/\0/g, '').trim()).filter(Boolean) }))
        proc.on('error', () => resolve({ data: [] }))
      })
    } catch (error) { return { error: String(error) } }
  })

  // Resolve/ensure the workflows folder (project folder in dev, alongside exe or userData in production)
  ipcMain.handle('workflows:get-dir', async () => {
    try {
      const dir = ensureWorkflowsDir()
      return { data: dir }
    } catch (error) { return { error: String(error) } }
  })

  ipcMain.handle('workflows:set-dir', async (_, dir: string) => {
    try {
      if (!dir || !existsSync(dir)) return { error: 'Folder does not exist' }
      dbRun(`INSERT INTO settings (key, value, updated_at) VALUES ('workflows_dir', ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`, [dir])
      return { data: dir }
    } catch (error) { return { error: String(error) } }
  })

  ipcMain.handle('workflows:open-workflows-dir', async () => {
    try {
      const dir = ensureWorkflowsDir()
      shell.openPath(dir)
      return { data: dir }
    } catch (error) { return { error: String(error) } }
  })

  // List all .txt workflow files in the workflows folder (auto-detects any .txt you add)
  ipcMain.handle('workflows:list-txt', async () => {
    try {
      const root = ensureWorkflowsDir()
      const results: { path: string; name: string; category: string; steps: number }[] = []

      let entries: any[] = []
      try { entries = readdirSync(root) } catch { return { data: [] } }
      entries.forEach((entry: any) => {
        const full = join(root, entry)
        let stat: any = null
        try { stat = statSync(full) } catch { return }
        if (!stat.isFile()) return
        if (!entry.toLowerCase().endsWith('.txt')) return
        let steps = 0
        try {
          steps = parseTxtWorkflow(readFileSync(full, 'utf-8'), entry, 'web recon').steps.length
        } catch { /* ignore */ }
        results.push({ path: full, name: basename(entry, '.txt'), category: 'web recon', steps })
      })
      return { data: results.sort((a, b) => a.name.localeCompare(b.name)) }
    } catch (error) { return { error: String(error) } }
  })

  // Read and parse a .txt workflow file
  ipcMain.handle('workflows:read-txt', async (_, filePath: string) => {
    try {
      const content = readFileSync(filePath, 'utf-8')
      const parsed = parseTxtWorkflow(content, basename(filePath), 'web recon')
      return { data: parsed }
    } catch (error) { return { error: String(error) } }
  })

  // Import a .txt workflow file into workflow_definitions and return the new id
  ipcMain.handle('workflows:import-txt', async (_, filePath: string) => {
    try {
      const content = readFileSync(filePath, 'utf-8')
      const parsed = parseTxtWorkflow(content, basename(filePath), 'web recon')
      dbRun('INSERT INTO workflow_definitions (name, description, category, inputs_json, steps_json) VALUES (?,?,?,?,?)',
        [parsed.name, parsed.description, parsed.category, JSON.stringify(parsed.inputs), JSON.stringify(parsed.steps)])
      const id = selectValue('SELECT last_insert_rowid()') as number
      return { data: { id, ...parsed } }
    } catch (error) { return { error: String(error) } }
  })

  ipcMain.handle('workflow:run', async (_, { runId, workflowDef, inputs, distro }: { runId: number; workflowDef: any; inputs: Record<string, string>; distro: string }) => {
    try {
      const steps = JSON.parse(workflowDef.steps_json || '[]')
      const allWindows = BrowserWindow.getAllWindows()
      const win = allWindows[0]

      const target = sanitizeTarget(inputs['TARGET'] || inputs['target'] || String(runId))
      const kaliOutputDir = `/home/kali/bounty/${target}`

      dbRun(`UPDATE workflow_runs SET status='Running', started_at=datetime('now') WHERE id=?`, [runId])

      let allLogs = ''
      let stepIndex = 0

      const sendOutput = (line: string, isError = false) => {
        allLogs += line + '\n'
        win?.webContents.send('workflow:output', { runId, line, isError, stepIndex })
      }

      const substituteVars = (cmd: string) => {
        let result = cmd
        Object.entries(inputs).forEach(([k, v]) => {
          result = result.replace(new RegExp(`\\$${k}|\\$\\{${k}\\}`, 'g'), v)
          result = result.replace(new RegExp(`<${k}>`, 'gi'), v)
        })
        // Fallback: any leftover <placeholder> becomes the target input value
        const targetValue = inputs['TARGET'] || inputs['target'] || ''
        if (targetValue) {
          result = result.replace(/<[^>]+>/g, targetValue)
        }
        return result
      }

      // Ensure output directory exists inside Kali
      sendOutput(`Creating output directory in Kali: ${kaliOutputDir}`)
      const mkdirRes = await execWsl(distro, `mkdir -p '${kaliOutputDir}'`)
      if (mkdirRes.code !== 0) {
        sendOutput(`[Failed to create output dir: ${mkdirRes.stderr || mkdirRes.stdout}]`, true)
        dbRun(`UPDATE workflow_runs SET status='Failed', ended_at=datetime('now'), logs=? WHERE id=?`, [allLogs, runId])
        win?.webContents.send('workflow:done', { runId, status: 'Failed' })
        return { data: true }
      }

      let anyStepFailed = false
      let failedStepIndex = -1

      for (stepIndex = 0; stepIndex < steps.length; stepIndex++) {
        const step = steps[stepIndex]
        if (cancelledRuns.has(runId)) break

        const cmd = substituteVars(step.command)
        sendOutput(`\n[Step ${stepIndex + 1}/${steps.length}] ${step.name}`)
        sendOutput(`$ ${cmd}`)
        sendOutput(`  (running in ${kaliOutputDir})`)

        const runResult = await execWsl(distro, `cd '${kaliOutputDir}' && export PATH="$PATH:$HOME/go/bin" && ${cmd}`, runId)
        if (runResult.stdout) {
          runResult.stdout.split('\n').filter(Boolean).forEach((line) => sendOutput(line))
        }
        if (runResult.stderr) {
          runResult.stderr.split('\n').filter(Boolean).forEach((line) => sendOutput(line, true))
        }
        sendOutput(`[Exit code: ${runResult.code}]`, runResult.code !== 0)

        if (runResult.code !== 0) {
          anyStepFailed = true
          if (failedStepIndex === -1) failedStepIndex = stepIndex
          sendOutput(`[ERROR] Step ${stepIndex + 1} returned exit code ${runResult.code}`, true)
        }
      }

      if (cancelledRuns.has(runId)) {
        dbRun(`UPDATE workflow_runs SET status='Cancelled', ended_at=datetime('now'), logs=? WHERE id=?`, [allLogs, runId])
        win?.webContents.send('workflow:done', { runId, status: 'Cancelled' })
        cancelledRuns.delete(runId)
        return { data: true }
      }

      // Capture output files written by the workflow inside Kali
      try {
        const lsRes = await execWsl(distro, `ls -1 '${kaliOutputDir}' 2>/dev/null | grep -v '^$'`)
        if (lsRes.code === 0) {
          const files = lsRes.stdout.split('\n').map(s => s.trim()).filter(Boolean)
          if (files.length) {
            sendOutput(`\n[Output files in ${kaliOutputDir}]`)
            files.forEach((f) => {
              sendOutput(`✓ ${f}`)
              dbRun('INSERT INTO workflow_outputs (run_id, filename, filepath) VALUES (?,?,?)', [runId, f, `${kaliOutputDir}/${f}`])
            })
          }
        }
      } catch { /* non-fatal */ }

      const finalStatus = anyStepFailed
        ? `Completed with warnings (error at step ${failedStepIndex + 1})`
        : 'Completed'
      dbRun(`UPDATE workflow_runs SET status='Completed', ended_at=datetime('now'), logs=? WHERE id=?`, [allLogs, runId])
      win?.webContents.send('workflow:done', { runId, status: finalStatus })

      return { data: true }
    } catch (error) {
      return { error: String(error) }
    }
  })

  ipcMain.handle('workflow:stop', async (_, runId: number) => {
    try {
      cancelledRuns.add(runId)
      const proc = runningProcesses.get(runId)
      if (proc) {
        proc.kill('SIGTERM')
        runningProcesses.delete(runId)
      }
      dbRun(`UPDATE workflow_runs SET status='Cancelled', ended_at=datetime('now') WHERE id=?`, [runId])
      return { data: true }
    } catch (error) { return { error: String(error) } }
  })
}
