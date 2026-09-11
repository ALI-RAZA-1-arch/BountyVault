import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Command } from "cmdk"
import { useAppStore } from "@renderer/store/app"
import { Dialog, DialogContent } from "@renderer/components/ui/dialog"
import { Shield, Target, FileText, Settings, Play, Plus, Search, Calendar } from "lucide-react"

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore()
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<any[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [commandPaletteOpen])

  useEffect(() => {
    if (!search.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(() => {
      window.api.search.global(search).then((res: any) => {
        if (res.data) {
          setResults(res.data)
        }
      })
    }, 200)
    return () => clearTimeout(timer)
  }, [search])

  const runAction = (action: () => void) => {
    action()
    setCommandPaletteOpen(false)
    setSearch("")
  }

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl border bg-background max-w-2xl">
        <Command className="flex h-full w-full flex-col overflow-hidden bg-popover text-popover-foreground">
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Type a command or search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
            <Command.Empty className="py-6 text-center text-sm">No results found.</Command.Empty>

            {results.length > 0 && (
              <Command.Group heading="Search Results" className="overflow-hidden p-1 text-xs font-medium text-muted-foreground">
                {results.map((item) => (
                  <Command.Item
                    key={`${item.type}-${item.id}`}
                    value={item.title}
                    onSelect={() => runAction(() => {
                      if (item.type === 'report') navigate(`/reports/${item.id}`)
                      else if (item.type === 'company') navigate(`/targets`)
                    })}
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-foreground"
                  >
                    {item.type === 'report' && <FileText className="mr-2 h-4 w-4 text-muted-foreground" />}
                    {item.type === 'company' && <Target className="mr-2 h-4 w-4 text-muted-foreground" />}
                    <span>{item.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground capitalize">{item.type}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {!search && (
              <>
                <Command.Group heading="Navigation" className="overflow-hidden p-1 text-xs font-medium text-muted-foreground">
                  <Command.Item
                    value="Dashboard"
                    onSelect={() => runAction(() => navigate("/"))}
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground text-foreground"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Go to Dashboard</span>
                  </Command.Item>
                  <Command.Item
                    value="Targets"
                    onSelect={() => runAction(() => navigate("/targets"))}
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground text-foreground"
                  >
                    <Target className="mr-2 h-4 w-4" />
                    <span>Go to Targets</span>
                  </Command.Item>
                  <Command.Item
                    value="Reports"
                    onSelect={() => runAction(() => navigate("/reports"))}
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground text-foreground"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Go to Reports</span>
                  </Command.Item>
                  <Command.Item
                    value="Monthly Earnings"
                    onSelect={() => runAction(() => navigate("/monthly"))}
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground text-foreground"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Go to Monthly Earnings</span>
                  </Command.Item>
                  <Command.Item
                    value="Settings"
                    onSelect={() => runAction(() => navigate("/settings"))}
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground text-foreground"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Command.Item>
                </Command.Group>
                
                <Command.Group heading="Quick Actions" className="overflow-hidden p-1 text-xs font-medium text-muted-foreground mt-2">
                  <Command.Item
                    value="New Report"
                    onSelect={() => runAction(() => navigate("/reports?action=new"))}
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground text-foreground"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Create New Report</span>
                  </Command.Item>
                  <Command.Item
                    value="Run Workflow"
                    onSelect={() => runAction(() => navigate("/workflows"))}
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground text-foreground"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    <span>Run Automation Workflow</span>
                  </Command.Item>
                </Command.Group>
              </>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
