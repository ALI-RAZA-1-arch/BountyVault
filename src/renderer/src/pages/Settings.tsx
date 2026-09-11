import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@renderer/components/ui/card"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import { LoadingSpinner } from "@renderer/components/shared/LoadingSpinner"
import { useThemeStore } from "@renderer/store/theme"
import { Sun, Moon, Database, FolderOpen, Download, Terminal, Info, FileText } from "lucide-react"
import { toast } from "sonner"

export function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [paths, setPaths] = useState<any>(null)
  const [workflowsDir, setWorkflowsDir] = useState("")
  const [loading, setLoading] = useState(true)
  const [wslStatus, setWslStatus] = useState<any>(null)
  const { theme, setTheme } = useThemeStore()
  const { register, handleSubmit } = useForm()

  const loadData = async () => {
    const res = await window.api.settings.getAll()
    if (res.data) {
      setSettings(res.data)
    }

    const pathRes = await window.api.files.getAppPaths()
    if (pathRes.data) setPaths(pathRes.data)

    const wslRes = await window.api.workflows.checkWsl()
    if (wslRes.data) setWslStatus(wslRes.data)

    const dirRes = await window.api.workflows.getDir()
    if (dirRes.data) setWorkflowsDir(dirRes.data)

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handlePickWorkflowsDir = async () => {
    const res = await window.api.dialog.openFolder()
    if (res.data) {
      const setRes = await window.api.workflows.setDir(res.data)
      if (setRes.error) toast.error("Error: " + setRes.error)
      else {
        setWorkflowsDir(setRes.data)
        toast.success("Workflows folder updated")
      }
    }
  }

  const onSubmit = (data: any) => {
    const keys = ["theme", "wsl_distro", "default_currency", "auto_backup"]
    const promises = keys
      .filter((k) => data[k] !== undefined && data[k] !== null)
      .map((k) => window.api.settings.set(k, String(data[k])))

    Promise.all(promises).then(() => {
      if (data.theme === "light" || data.theme === "dark") setTheme(data.theme)
      toast.success("Settings saved successfully")
    })
  }

  const handleBackup = () => {
    window.api.files.backupDb().then((res: any) => {
      if (res.error) toast.error("Backup failed: " + res.error)
      else {
        toast.success("Database backup created")
        window.api.files.openFolder(res.data)
      }
    })
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose the color theme used across the application.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center space-x-4">
          <Button
            variant={theme === "dark" ? "default" : "outline"}
            onClick={() => { setTheme("dark"); window.api.settings.set("theme", "dark") }}
          >
            <Moon className="mr-2 h-4 w-4" /> Dark
          </Button>
          <Button
            variant={theme === "light" ? "default" : "outline"}
            onClick={() => { setTheme("light"); window.api.settings.set("theme", "light") }}
          >
            <Sun className="mr-2 h-4 w-4" /> Light
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2"><Terminal className="h-4 w-4" /> WSL / Kali Integration</CardTitle>
          <CardDescription>
            {wslStatus?.available
              ? "WSL detected. Workflows will execute in your Kali distribution."
              : "WSL was not detected. Workflows require WSL2 with a Kali Linux distribution."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wslStatus?.available && wslStatus.distros?.length > 0 && (
            <div className="mb-4">
              <span className="text-sm font-semibold">Detected distros:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {wslStatus.distros.map((d: string) => (
                  <span key={d} className="px-2 py-1 rounded bg-green-500/10 text-green-500 text-xs font-mono">{d}</span>
                ))}
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="wsl_distro">Default WSL Distribution</Label>
              <Input id="wsl_distro" {...register("wsl_distro")} defaultValue={settings.wsl_distro || "kali-linux"} placeholder="kali-linux" />
            </div>
            <Button type="submit">Save Settings</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2"><FileText className="h-4 w-4" /> Workflows Folder</CardTitle>
          <CardDescription>
            Save your .txt workflow files here. Lines like "1. subfinder -d &lt;example.com&gt; ..." become steps and &lt;example.com&gt; is replaced by your target when running.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm bg-muted/20 rounded-lg p-4 border font-mono text-xs break-all">
            {workflowsDir || "Loading..."}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => window.api.workflows.openWorkflowsDir()}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Open Folder
            </Button>
            <Button variant="outline" onClick={handlePickWorkflowsDir}>
              Change Folder
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Default currency and automatic backup behavior.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="default_currency">Default Currency</Label>
                <Input id="default_currency" {...register("default_currency")} defaultValue={settings.default_currency || "USD"} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="auto_backup">Auto Backup on Exit</Label>
                <select id="auto_backup" {...register("auto_backup")} defaultValue={settings.auto_backup || "1"} className="flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="1">Enabled</option>
                  <option value="0">Disabled</option>
                </select>
              </div>
            </div>
            <Button type="submit">Save Settings</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2"><Database className="h-4 w-4" /> Data & Storage</CardTitle>
          <CardDescription>All data is stored locally on this machine.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paths && (
            <div className="text-sm space-y-2 bg-muted/20 rounded-lg p-4 border">
              {Object.entries(paths).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4">
                  <span className="text-muted-foreground capitalize">{key}</span>
                  <span className="font-mono text-xs text-foreground truncate">{String(value)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleBackup}>
              <Download className="mr-2 h-4 w-4" />
              Create Backup Now
            </Button>
            {paths && (
              <Button variant="outline" onClick={() => window.api.files.openFolder(paths.data ? paths.data : paths.userData)}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Open Data Folder
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2"><Info className="h-4 w-4" /> About</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p><span className="font-semibold text-foreground">BountyVault</span> v1.0.0</p>
          <p className="mt-1">Bug-bounty management and Kali WSL automation. Local-first and offline by design.</p>
          <p className="mt-2 text-xs">For authorized security testing only. Data never leaves your machine automatically.</p>
        </CardContent>
      </Card>
    </div>
  )
}
