import { ipcMain, dialog, shell, BrowserWindow } from 'electron'
import { app } from 'electron'
import { join, basename, extname } from 'path'
import { copyFileSync, mkdirSync, writeFileSync, readdirSync, statSync, unlinkSync } from 'fs'
import { format } from 'date-fns'

export function setupFileHandlers(): void {
  const userData = app.getPath('userData')

  ipcMain.handle('files:get-app-paths', async () => {
    return {
      data: {
        userData,
        uploadsDir: join(userData, 'uploads'),
        outputsDir: join(userData, 'outputs'),
        workflowsDir: join(userData, 'workflows'),
        exportsDir: join(userData, 'exports'),
        backupsDir: join(userData, 'backups'),
        logsDir: join(userData, 'logs'),
      }
    }
  })

  ipcMain.handle('files:save-attachment', async (_, { reportId, srcPath }: { reportId: number; srcPath: string }) => {
    try {
      const destDir = join(userData, 'uploads', String(reportId))
      mkdirSync(destDir, { recursive: true })
      const filename = basename(srcPath)
      const destPath = join(destDir, filename)
      copyFileSync(srcPath, destPath)
      const stat = statSync(destPath)
      return { data: { filename, filepath: destPath, filesize: stat.size, filetype: extname(filename).replace('.', '') } }
    } catch (error) { return { error: String(error) } }
  })

  ipcMain.handle('files:open-file', async (_, path: string) => {
    try { await shell.openPath(path); return { data: true } }
    catch (error) { return { error: String(error) } }
  })

  ipcMain.handle('files:open-folder', async (_, path: string) => {
    try { shell.showItemInFolder(path); return { data: true } }
    catch (error) { return { error: String(error) } }
  })

  ipcMain.handle('files:export-json', async (_, { data, filename }: { data: any; filename: string }) => {
    try {
      const exportsDir = join(userData, 'exports')
      mkdirSync(exportsDir, { recursive: true })
      const filePath = join(exportsDir, filename)
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
      return { data: filePath }
    } catch (error) { return { error: String(error) } }
  })

  ipcMain.handle('files:export-csv', async (_, { rows, headers, filename }: { rows: any[]; headers: string[]; filename: string }) => {
    try {
      const exportsDir = join(userData, 'exports')
      mkdirSync(exportsDir, { recursive: true })
      const filePath = join(exportsDir, filename)
      const csvLines = [headers.join(','), ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))]
      writeFileSync(filePath, csvLines.join('\n'), 'utf-8')
      return { data: filePath }
    } catch (error) { return { error: String(error) } }
  })

  ipcMain.handle('files:backup-db', async () => {
    try {
      const dbPath = join(userData, 'data', 'bountyvault.db')
      const backupsDir = join(userData, 'backups')
      mkdirSync(backupsDir, { recursive: true })
      const filename = `bountyvault-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.db`
      const destPath = join(backupsDir, filename)
      copyFileSync(dbPath, destPath)
      // Keep only last 7 backups
      const backups = readdirSync(backupsDir).filter(f => f.endsWith('.db')).sort()
      while (backups.length > 7) {
        const oldest = backups.shift()!
        try { unlinkSync(join(backupsDir, oldest)) } catch {}
      }
      return { data: destPath }
    } catch (error) { return { error: String(error) } }
  })

  ipcMain.handle('dialog:open-file', async (_, options?: Electron.OpenDialogOptions) => {
    try {
      const win = BrowserWindow.getFocusedWindow()
      const result = await dialog.showOpenDialog(win!, { properties: ['openFile'], ...(options || {}) })
      return { data: result.canceled ? null : result.filePaths[0] }
    } catch (error) { return { error: String(error) } }
  })

  ipcMain.handle('dialog:open-folder', async () => {
    try {
      const win = BrowserWindow.getFocusedWindow()
      const result = await dialog.showOpenDialog(win!, { properties: ['openDirectory'] })
      return { data: result.canceled ? null : result.filePaths[0] }
    } catch (error) { return { error: String(error) } }
  })
}
