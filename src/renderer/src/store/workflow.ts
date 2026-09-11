import { create } from 'zustand'

interface WorkflowRunState {
  activeRun: { id: number; name: string } | null
  logs: string[]
  startRun: (run: { id: number; name: string }) => void
  appendLog: (line: string) => void
  clearLogs: () => void
  finishRun: () => void
}

export const useWorkflowRunStore = create<WorkflowRunState>((set) => ({
  activeRun: null,
  logs: [],
  startRun: (run) => set({ activeRun: run, logs: [] }),
  appendLog: (line) => set((s) => ({ logs: [...s.logs, line] })),
  clearLogs: () => set({ logs: [] }),
  finishRun: () => set({ activeRun: null }),
}))
