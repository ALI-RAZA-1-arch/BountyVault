import { contextBridge, ipcRenderer } from 'electron'

const api = {
  companies: {
    list: () => ipcRenderer.invoke('companies:list'),
    get: (id: number) => ipcRenderer.invoke('companies:get', id),
    create: (data: any) => ipcRenderer.invoke('companies:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('companies:update', { id, data }),
    delete: (id: number) => ipcRenderer.invoke('companies:delete', id),
  },
  programs: {
    list: (filters?: any) => ipcRenderer.invoke('programs:list', filters),
    get: (id: number) => ipcRenderer.invoke('programs:get', id),
    create: (data: any) => ipcRenderer.invoke('programs:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('programs:update', { id, data }),
    delete: (id: number) => ipcRenderer.invoke('programs:delete', id),
  },
  reports: {
    list: (filters?: any) => ipcRenderer.invoke('reports:list', filters),
    get: (id: number) => ipcRenderer.invoke('reports:get', id),
    create: (data: any) => ipcRenderer.invoke('reports:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('reports:update', { id, data }),
    delete: (id: number) => ipcRenderer.invoke('reports:delete', id),
  },
  timeline: {
    list: (reportId: number) => ipcRenderer.invoke('timeline:list', reportId),
    add: (data: any) => ipcRenderer.invoke('timeline:add', data),
  },
  responses: {
    list: (reportId?: number) => ipcRenderer.invoke('responses:list', reportId),
    create: (data: any) => ipcRenderer.invoke('responses:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('responses:update', { id, data }),
    delete: (id: number) => ipcRenderer.invoke('responses:delete', id),
  },
  bounties: {
    list: (filters?: any) => ipcRenderer.invoke('bounties:list', filters),
    getByReport: (reportId: number) => ipcRenderer.invoke('bounties:get-by-report', reportId),
    save: (reportId: number, data: any) => ipcRenderer.invoke('bounties:save', { reportId, data }),
  },
  attachments: {
    list: (reportId: number) => ipcRenderer.invoke('attachments:list', reportId),
    create: (data: any) => ipcRenderer.invoke('attachments:create', data),
    delete: (id: number) => ipcRenderer.invoke('attachments:delete', id),
  },
  notes: {
    list: (reportId?: number) => ipcRenderer.invoke('notes:list', reportId),
    create: (data: any) => ipcRenderer.invoke('notes:create', data),
    update: (id: number, data: any) => ipcRenderer.invoke('notes:update', { id, data }),
    delete: (id: number) => ipcRenderer.invoke('notes:delete', id),
  },
  retests: {
    list: (reportId: number) => ipcRenderer.invoke('retests:list', reportId),
    create: (data: any) => ipcRenderer.invoke('retests:create', data),
  },
  workflows: {
    listDefs: () => ipcRenderer.invoke('workflows:list-defs'),
    getDef: (id: number) => ipcRenderer.invoke('workflows:get-def', id),
    createDef: (data: any) => ipcRenderer.invoke('workflows:create-def', data),
    updateDef: (id: number, data: any) => ipcRenderer.invoke('workflows:update-def', { id, data }),
    deleteDef: (id: number) => ipcRenderer.invoke('workflows:delete-def', id),
    listRuns: (filters?: any) => ipcRenderer.invoke('workflows:list-runs', filters),
    getRun: (id: number) => ipcRenderer.invoke('workflows:get-run', id),
    createRun: (data: any) => ipcRenderer.invoke('workflows:create-run', data),
    updateRun: (id: number, data: any) => ipcRenderer.invoke('workflows:update-run', { id, data }),
    listOutputs: (runId: number) => ipcRenderer.invoke('workflows:list-outputs', runId),
    run: (runId: number, workflowDef: any, inputs: any, distro: string) => ipcRenderer.invoke('workflow:run', { runId, workflowDef, inputs, distro }),
    stop: (runId: number) => ipcRenderer.invoke('workflow:stop', runId),
    checkWsl: () => ipcRenderer.invoke('workflow:check-wsl'),
    listDistros: () => ipcRenderer.invoke('workflow:list-distros'),
    getDir: () => ipcRenderer.invoke('workflows:get-dir'),
    setDir: (dir: string) => ipcRenderer.invoke('workflows:set-dir', dir),
    openWorkflowsDir: () => ipcRenderer.invoke('workflows:open-workflows-dir'),
    listTxt: () => ipcRenderer.invoke('workflows:list-txt'),
    readTxt: (filePath: string) => ipcRenderer.invoke('workflows:read-txt', filePath),
    importTxt: (filePath: string) => ipcRenderer.invoke('workflows:import-txt', filePath),
  },
  platforms: {
    list: () => ipcRenderer.invoke('platforms:list'),
  },
  vulnTypes: {
    list: () => ipcRenderer.invoke('vuln-types:list'),
    createCustom: (name: string) => ipcRenderer.invoke('vuln-types:create', name),
  },
  settings: {
    getAll: () => ipcRenderer.invoke('settings:get-all'),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', { key, value }),
  },
  stats: {
    dashboard: () => ipcRenderer.invoke('stats:dashboard'),
    monthly: () => ipcRenderer.invoke('stats:monthly'),
  },
  search: {
    global: (query: string) => ipcRenderer.invoke('search:global', query),
  },
  files: {
    getAppPaths: () => ipcRenderer.invoke('files:get-app-paths'),
    saveAttachment: (reportId: number, srcPath: string) => ipcRenderer.invoke('files:save-attachment', { reportId, srcPath }),
    openFile: (path: string) => ipcRenderer.invoke('files:open-file', path),
    openFolder: (path: string) => ipcRenderer.invoke('files:open-folder', path),
    exportJson: (data: any, filename: string) => ipcRenderer.invoke('files:export-json', { data, filename }),
    exportCsv: (rows: any[], headers: string[], filename: string) => ipcRenderer.invoke('files:export-csv', { rows, headers, filename }),
    backupDb: () => ipcRenderer.invoke('files:backup-db'),
  },
  dialog: {
    openFile: (options?: any) => ipcRenderer.invoke('dialog:open-file', options),
    openFolder: () => ipcRenderer.invoke('dialog:open-folder'),
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args))
  },
  off: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback)
  },
}

contextBridge.exposeInMainWorld('api', api)
