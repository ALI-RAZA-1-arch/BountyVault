export interface ElectronAPI {
  companies: {
    list: () => Promise<{ data?: any[]; error?: string }>
    get: (id: number) => Promise<{ data?: any; error?: string }>
    create: (data: any) => Promise<{ data?: any; error?: string }>
    update: (id: number, data: any) => Promise<{ data?: any; error?: string }>
    delete: (id: number) => Promise<{ data?: any; error?: string }>
  }
  programs: {
    list: (filters?: any) => Promise<{ data?: any[]; error?: string }>
    get: (id: number) => Promise<{ data?: any; error?: string }>
    create: (data: any) => Promise<{ data?: any; error?: string }>
    update: (id: number, data: any) => Promise<{ data?: any; error?: string }>
    delete: (id: number) => Promise<{ data?: any; error?: string }>
  }
  reports: {
    list: (filters?: any) => Promise<{ data?: any[]; error?: string }>
    get: (id: number) => Promise<{ data?: any; error?: string }>
    create: (data: any) => Promise<{ data?: any; error?: string }>
    update: (id: number, data: any) => Promise<{ data?: any; error?: string }>
    delete: (id: number) => Promise<{ data?: any; error?: string }>
  }
  timeline: { list: (reportId: number) => Promise<any>; add: (data: any) => Promise<any> }
  responses: { list: (reportId?: number) => Promise<any>; create: (data: any) => Promise<any>; update: (id: number, data: any) => Promise<any>; delete: (id: number) => Promise<any> }
  bounties: { list: (filters?: any) => Promise<any>; getByReport: (reportId: number) => Promise<any>; save: (reportId: number, data: any) => Promise<any> }
  attachments: { list: (reportId: number) => Promise<any>; create: (data: any) => Promise<any>; delete: (id: number) => Promise<any> }
  notes: { list: (reportId?: number) => Promise<any>; create: (data: any) => Promise<any>; update: (id: number, data: any) => Promise<any>; delete: (id: number) => Promise<any> }
  retests: { list: (reportId: number) => Promise<any>; create: (data: any) => Promise<any> }
  workflows: {
    listDefs: () => Promise<any>; getDef: (id: number) => Promise<any>
    createDef: (data: any) => Promise<any>; updateDef: (id: number, data: any) => Promise<any>; deleteDef: (id: number) => Promise<any>
    listRuns: (filters?: any) => Promise<any>; getRun: (id: number) => Promise<any>
    createRun: (data: any) => Promise<any>; updateRun: (id: number, data: any) => Promise<any>; listOutputs: (runId: number) => Promise<any>
    run: (runId: number, workflowDef: any, inputs: any, distro: string) => Promise<any>
    stop: (runId: number) => Promise<any>; checkWsl: () => Promise<any>; listDistros: () => Promise<any>
    getDir: () => Promise<any>; setDir: (dir: string) => Promise<any>; openWorkflowsDir: () => Promise<any>
    listTxt: () => Promise<any>; readTxt: (filePath: string) => Promise<any>; importTxt: (filePath: string) => Promise<any>
  }
  platforms: { list: () => Promise<any> }
  vulnTypes: { list: () => Promise<any>; createCustom: (name: string) => Promise<any> }
  settings: { getAll: () => Promise<any>; set: (key: string, value: string) => Promise<any> }
  stats: { dashboard: () => Promise<any>; monthly: () => Promise<any> }
  search: { global: (query: string) => Promise<any> }
  files: { getAppPaths: () => Promise<any>; saveAttachment: (reportId: number, srcPath: string) => Promise<any>; openFile: (path: string) => Promise<any>; openFolder: (path: string) => Promise<any>; exportJson: (data: any, filename: string) => Promise<any>; exportCsv: (rows: any[], headers: string[], filename: string) => Promise<any>; backupDb: () => Promise<any> }
  dialog: { openFile: (options?: any) => Promise<any>; openFolder: () => Promise<any> }
  window: { minimize: () => void; maximize: () => void; close: () => void }
  on: (channel: string, callback: (...args: any[]) => void) => void
  off: (channel: string, callback: (...args: any[]) => void) => void
}
declare global {
  interface Window { api: ElectronAPI }
}
