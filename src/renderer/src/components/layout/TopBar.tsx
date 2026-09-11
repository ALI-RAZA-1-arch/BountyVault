import { useLocation, useNavigate } from "react-router-dom"
import { useThemeStore } from "@renderer/store/theme"
import { useAppStore } from "@renderer/store/app"
import { useWorkflowRunStore } from "@renderer/store/workflow"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Sun, Moon, Minus, Square, X, Search, Plus, Terminal } from "lucide-react"

export function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useThemeStore()
  const { setCommandPaletteOpen } = useAppStore()
  const { activeRun } = useWorkflowRunStore()

  // Get dynamic page title
  const getPageTitle = () => {
    const path = location.pathname
if (path === "/") return "Dashboard"
    if (path.startsWith("/targets")) return "Targets"
    if (path.startsWith("/reports")) return "Reports"
    if (path.startsWith("/bounties")) return "Bounties"
    if (path.startsWith("/monthly")) return "Monthly Earnings"
    if (path.startsWith("/workflows")) return "Workflows"
    if (path.startsWith("/statistics")) return "Statistics"
    if (path.startsWith("/settings")) return "Settings"
    return "BountyVault"
  }

  const handleMinimize = () => window.api.window.minimize()
  const handleMaximize = () => window.api.window.maximize()
  const handleClose = () => window.api.window.close()

  return (
    <header className="border-b bg-card flex flex-col select-none">
      {/* Electron Custom Titlebar Window Controls */}
      <div className="titlebar-drag h-8 w-full flex items-center justify-between px-4 bg-muted/40 text-muted-foreground text-xs border-b">
        <span>BountyVault Desktop</span>
        <div className="titlebar-nodrag flex items-center space-x-1">
          <button onClick={handleMinimize} className="p-1 hover:bg-accent rounded text-muted-foreground transition-all">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleMaximize} className="p-1 hover:bg-accent rounded text-muted-foreground transition-all">
            <Square className="h-3 w-3" />
          </button>
          <button onClick={handleClose} className="p-1 hover:bg-red-500 hover:text-white rounded text-muted-foreground transition-all">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Primary TopBar Layout */}
      <div className="h-16 px-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">{getPageTitle()}</h1>

        <div className="flex items-center space-x-4 flex-1 max-w-md mx-6">
          <div className="relative w-full cursor-pointer" onClick={() => setCommandPaletteOpen(true)}>
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              readOnly
              placeholder="Search or command... (Ctrl+K)"
              className="pl-9 pr-4 cursor-pointer bg-muted/40 hover:bg-muted/80 transition-all border-none"
            />
          </div>
        </div>

<div className="flex items-center space-x-2">
          {activeRun && (
            <Button variant="outline" size="sm" onClick={() => navigate("/workflows")} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse mr-2" />
              <Terminal className="mr-1 h-4 w-4" />
              {activeRun.name}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate("/reports?action=new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
