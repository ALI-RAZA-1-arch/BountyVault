import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { CommandPalette } from "@renderer/components/shared/CommandPalette"
import { useWorkflowRunStore } from "@renderer/store/workflow"
import { Toaster, toast } from "sonner"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate()
  const { activeRun } = useWorkflowRunStore()

  // Global IPC listeners for workflow output — stay alive across page navigation
  useEffect(() => {
    const handleOutput = ({ runId, line }: any) => {
      const state = useWorkflowRunStore.getState()
      if (state.activeRun && state.activeRun.id === runId) {
        state.appendLog(line)
      }
    }

    const handleDone = ({ runId, status }: any) => {
      const state = useWorkflowRunStore.getState()
      if (state.activeRun && state.activeRun.id === runId) {
        toast.success(`Workflow completed with status: ${status}`)
        state.finishRun()
      }
    }

    window.api.on("workflow:output", handleOutput)
    window.api.on("workflow:done", handleDone)

    return () => {
      window.api.off("workflow:output", handleOutput)
      window.api.off("workflow:done", handleDone)
    }
  }, [])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-6 bg-muted/20">
          {children}
        </main>
        {/* Floating workflow terminal indicator */}
        {activeRun && (
          <div className="fixed bottom-4 right-4 z-50">
            <button
              onClick={() => navigate("/workflows")}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg shadow-lg bg-zinc-950 border border-zinc-700 text-zinc-200 hover:bg-zinc-900 transition-all"
            >
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-semibold">{activeRun.name}</span>
              <span className="text-xs text-zinc-400">Running…</span>
            </button>
          </div>
        )}
      </div>
      <CommandPalette />
      <Toaster position="bottom-right" richColors theme="dark" />
    </div>
  )
}