import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getDb } from './db'
import { mkdirSync } from 'fs'
import { setupDbHandlers } from './ipc/db-handlers'
import { setupFileHandlers } from './ipc/file-handlers'
import { setupWorkflowHandlers } from './ipc/workflow-handlers'

let mainWindow: BrowserWindow | null = null

function createDirectories(): void {
  const userData = app.getPath('userData')
  const dirs = [
    'data', 'uploads', 'outputs', 'logs', 'exports', 'backups',
    'workflows/recon', 'workflows/web-recon', 'workflows/vulnerability-scanning', 'workflows/custom'
  ]
  dirs.forEach(dir => mkdirSync(join(userData, dir), { recursive: true }))
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    frame: false,
    backgroundColor: '#09090b',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Window control IPC
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => { mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize() })
ipcMain.on('window:close', () => mainWindow?.close())

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.bountyvault.clean')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  createDirectories()
  getDb() // Initialize DB

  setupDbHandlers()
  setupFileHandlers()
  setupWorkflowHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
