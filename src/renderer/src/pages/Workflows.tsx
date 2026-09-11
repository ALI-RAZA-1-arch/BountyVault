import { useEffect, useState, useRef } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@renderer/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@renderer/components/ui/table"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import { Textarea } from "@renderer/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@renderer/components/ui/dialog"
import { LoadingSpinner } from "@renderer/components/shared/LoadingSpinner"
import { EmptyState } from "@renderer/components/shared/EmptyState"
import { formatDate } from "@renderer/lib/utils"
import { Play, StopCircle, Plus, Trash2, AlertTriangle, ShieldCheck, FileText, FolderOpen, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useWorkflowRunStore } from "@renderer/store/workflow"

export function Workflows() {
  const [activeTab, setActiveTab] = useState("workflows")
  const [definitions, setDefinitions] = useState<any[]>([])
  const [runs, setRuns] = useState<any[]>([])
  const [txtFiles, setTxtFiles] = useState<any[]>([])
  const [workflowsDir, setWorkflowsDir] = useState("")
  const [wslStatus, setWslStatus] = useState<any>(null)
  const [preferredDistro, setPreferredDistro] = useState("kali-linux")
  const [loading, setLoading] = useState(true)

  // Modals
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [isRunnerOpen, setIsRunnerOpen] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null)

  // Global workflow run state — persists across pages
  const { activeRun, logs, startRun, clearLogs, finishRun } = useWorkflowRunStore()
  const terminalEndRef = useRef<HTMLDivElement>(null)

  const { register: regBuild, handleSubmit: subBuild, control, reset: resetBuild } = useForm({
    defaultValues: {
      name: "",
      description: "",
      category: "web recon",
      inputs: [{ name: "TARGET", type: "text", description: "Target Domain or IP", required: true }],
      steps: [{ name: "Ping check", command: "ping -c 3 $TARGET", description: "Basic ping availability check", continue_on_error: false }]
    }
  })

  const { fields: inputFields, append: appendInput, remove: removeInput } = useFieldArray({ control, name: "inputs" })
  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({ control, name: "steps" })

  const { register: regRun, handleSubmit: subRun, reset: resetRun } = useForm()

  const loadData = async () => {
    const defRes = await window.api.workflows.listDefs()
    if (defRes.data) setDefinitions(defRes.data)

    const runRes = await window.api.workflows.listRuns()
    if (runRes.data) setRuns(runRes.data)

    const wslRes = await window.api.workflows.checkWsl()
    if (wslRes.data) setWslStatus(wslRes.data)

    const txtRes = await window.api.workflows.listTxt()
    if (txtRes.data) setTxtFiles(txtRes.data)

    const dirRes = await window.api.workflows.getDir()
    if (dirRes.data) setWorkflowsDir(dirRes.data)

    const setRes = await window.api.settings.getAll()
    if (setRes.data && setRes.data.wsl_distro) setPreferredDistro(setRes.data.wsl_distro)

    setLoading(false)
  }

  const loadTxtFiles = async () => {
    const txtRes = await window.api.workflows.listTxt()
    if (txtRes.data) setTxtFiles(txtRes.data)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  const onSubmitBuild = (data: any) => {
    window.api.workflows.createDef(data).then((res: any) => {
      if (res.error) toast.error("Error: " + res.error)
      else {
        toast.success("Workflow definition saved")
        setIsBuilderOpen(false)
        resetBuild()
        loadData()
      }
    })
  }

  const handleOpenRunner = (workflow: any) => {
    setSelectedWorkflow(workflow)
    resetRun()
    setIsRunnerOpen(true)
  }

  const onSubmitRun = async (data: any) => {
    setIsRunnerOpen(false)
    clearLogs()
    
    // Create new workflow run in db
    const runPayload = {
      workflow_id: selectedWorkflow.id,
      workflow_name: selectedWorkflow.name,
      target_input: data.TARGET || "",
      inputs: data,
    }

    const runRes = await window.api.workflows.createRun(runPayload)
    if (runRes.error) {
      toast.error("Failed to queue workflow: " + runRes.error)
      return
    }

    const runId = runRes.data.id
    startRun({ id: runId, name: selectedWorkflow.name })
    toast.info("Starting execution inside Kali WSL...")

    window.api.workflows.run(runId, selectedWorkflow, data, preferredDistro || wslStatus?.distros?.[0] || "kali-linux")
  }

  const handleStopWorkflow = () => {
    if (activeRun) {
      window.api.workflows.stop(activeRun.id).then(() => {
        toast.warning("Termination signal sent to WSL process")
        finishRun()
        loadData()
      })
    }
  }

  const handleDeleteDef = (id: number) => {
    window.api.workflows.deleteDef(id).then(() => {
      toast.success("Definition deleted")
      loadData()
    })
  }

  const handleImportTxt = async (filePath: string, runAfter = false) => {
    const res = await window.api.workflows.importTxt(filePath)
    if (res.error) {
      toast.error("Import failed: " + res.error)
      return null
    }
    toast.success("Workflow imported: " + res.data.name)
    await loadData()
    if (runAfter) {
      const defRes = await window.api.workflows.getDef(res.data.id)
      if (defRes.data) handleOpenRunner(defRes.data)
    }
    return res.data
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Safety check warning */}
      {!wslStatus?.available && (
        <Card className="bg-red-500/10 border-red-500/20 text-red-500">
          <CardContent className="flex items-center space-x-3 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div className="text-sm">
              <span className="font-bold">WSL/Kali Linux not detected:</span> Workflow automation commands will fail to execute. Please ensure WSL2 and Kali Linux distribution are properly configured in Settings.
            </div>
          </CardContent>
        </Card>
      )}

      {wslStatus?.available && (
        <Card className="bg-green-500/10 border-green-500/20 text-green-500">
          <CardContent className="flex items-center space-x-3 p-4">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <div className="text-sm">
              <span className="font-bold">WSL connected:</span> Ready to automate using distro <span className="font-mono bg-green-500/20 px-1 rounded">{preferredDistro || wslStatus.distros[0] || 'kali-linux'}</span>. Outputs are saved in <span className="font-mono bg-green-500/20 px-1 rounded">/home/kali/bounty/&lt;target&gt;</span> inside Kali.
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab("workflows")}
          className={`pb-2 px-1 text-sm font-semibold capitalize border-b-2 transition-all ${
            activeTab === "workflows" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Workflows
        </button>
        <button
          onClick={() => setActiveTab("runs")}
          className={`pb-2 px-1 text-sm font-semibold capitalize border-b-2 transition-all ${
            activeTab === "runs" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Run History
        </button>
        <button
          onClick={() => setActiveTab("files")}
          className={`pb-2 px-1 text-sm font-semibold capitalize border-b-2 transition-all ${
            activeTab === "files" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Workflow Files
        </button>
      </div>

      {activeTab === "workflows" && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setIsBuilderOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Workflow
            </Button>
          </div>

          {definitions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {definitions.map((def) => {
                const steps = JSON.parse(def.steps_json || "[]")
                return (
                  <Card key={def.id} className="hover:shadow-md transition-all flex flex-col justify-between">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary capitalize">
                          {def.category}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDef(def.id)} className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardTitle className="mt-2">{def.name}</CardTitle>
                      <CardDescription>{def.description || "No description provided."}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-xs text-muted-foreground">
                        Steps: <span className="font-bold text-foreground">{steps.length}</span>
                      </div>
                      <Button className="w-full" onClick={() => handleOpenRunner(def)} disabled={!wslStatus?.available}>
                        <Play className="mr-2 h-4 w-4" />
                        Configure & Run
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Play className="h-8 w-8" />}
              title="No Workflows Found"
              description="Build reusable commands to run security scripts inside Kali Linux."
              actionLabel="New Workflow"
              onAction={() => setIsBuilderOpen(true)}
            />
          )}
        </>
      )}

      {activeTab === "runs" && (
        <Card>
          <CardContent className="p-0">
            {runs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Ended</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-semibold">{run.workflow_name}</TableCell>
                      <TableCell className="font-mono text-xs">{run.target_input || "-"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          run.status === "Completed" ? "bg-green-500/10 text-green-500" : run.status === "Running" ? "bg-blue-500/10 text-blue-500 animate-pulse" : "bg-red-500/10 text-red-500"
                        }`}>
                          {run.status}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(run.started_at)}</TableCell>
                      <TableCell>{formatDate(run.ended_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">No workflow runs recorded yet.</div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "files" && (
        <div className="space-y-4">
          <Card className="bg-muted/20">
            <CardContent className="flex items-center justify-between p-4 flex-wrap gap-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <FolderOpen className="h-4 w-4 shrink-0" />
                <span className="font-mono text-xs">{workflowsDir || "Loading workflows folder..."}</span>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => window.api.workflows.openWorkflowsDir()}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Open Folder
                </Button>
                <Button variant="outline" size="sm" onClick={loadTxtFiles}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {txtFiles.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workflow (.txt)</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Steps</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {txtFiles.map((file) => (
                      <TableRow key={file.path}>
                        <TableCell className="font-semibold flex items-center">
                          <FileText className="h-4 w-4 text-primary mr-2" />
                          {file.name}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary capitalize">
                            {file.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{file.steps}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleImportTxt(file.path)}>
                            Import
                          </Button>
                          <Button size="sm" onClick={() => handleImportTxt(file.path, true)} disabled={!wslStatus?.available}>
                            <Play className="mr-1 h-3.5 w-3.5" />
                            Import & Run
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="No Workflow Files Found"
              description="Save your .txt workflow files in the workflows folder. Each line like '1. command' is a step, and <example.com> is replaced by your target."
              actionLabel="Open Workflows Folder"
              onAction={() => window.api.workflows.openWorkflowsDir()}
            />
          )}
        </div>
      )}

      {/* Live Terminal Log Screen */}
      {activeRun && (
        <Card className="bg-zinc-950 border-zinc-800 text-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <CardTitle className="text-zinc-50 flex items-center">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping mr-2" />
                Active Run: {activeRun.name}
              </CardTitle>
              <CardDescription className="text-zinc-400">Streaming execution output lines from Kali Linux WSL</CardDescription>
            </div>
            <Button variant="destructive" size="sm" onClick={handleStopWorkflow}>
              <StopCircle className="mr-2 h-4 w-4" /> Stop Workflow
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-96 overflow-y-auto font-mono text-xs p-4 bg-black rounded-lg space-y-1 scroll-smooth">
              {logs.length > 0 ? (
                logs.map((line, index) => <div key={index} className="whitespace-pre-wrap">{line}</div>)
              ) : (
                <div className="text-zinc-500">Waiting for output...</div>
              )}
              <div ref={terminalEndRef} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Run Configuration Dialog */}
      <Dialog open={isRunnerOpen} onOpenChange={setIsRunnerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Workflow Run</DialogTitle>
            <DialogDescription>Provide values for the defined variables required by this workflow.</DialogDescription>
          </DialogHeader>
          {selectedWorkflow && (
            <form onSubmit={subRun(onSubmitRun)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="run_target">Target (e.g. example.com) *</Label>
                <Input id="run_target" {...regRun("TARGET", { required: true })} placeholder="example.com" />
              </div>
              {JSON.parse(selectedWorkflow.inputs_json || "[]")
                .filter((input: any) => input.name !== "TARGET")
                .map((input: any) => (
                  <div key={input.name} className="space-y-1">
                    <Label htmlFor={input.name}>{input.name} {input.required && "*"}</Label>
                    <Input id={input.name} {...regRun(input.name, { required: input.required })} placeholder={input.description} />
                  </div>
                ))}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsRunnerOpen(false)}>Cancel</Button>
                <Button type="submit"><Play className="mr-2 h-4 w-4" /> Run Workflow</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Workflow Builder Dialog */}
      <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Workflow Definition</DialogTitle>
            <DialogDescription>Add variables and order steps of shell commands to execute.</DialogDescription>
          </DialogHeader>
          <form onSubmit={subBuild(onSubmitBuild)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="name">Workflow Name *</Label>
                <Input id="name" {...regBuild("name", { required: true })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="category">Category</Label>
                <select id="category" {...regBuild("category")} className="flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="web recon">Web Recon</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...regBuild("description")} />
            </div>

            {/* Inputs Section */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm">Defined Inputs (Variables)</h4>
                <Button type="button" size="sm" variant="outline" onClick={() => appendInput({ name: "", type: "text", description: "", required: true })}><Plus className="h-4 w-4" /></Button>
              </div>
              {inputFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-3 gap-2 items-center">
                  <Input {...regBuild(`inputs.${index}.name` as const, { required: true })} placeholder="Variable Name" />
                  <Input {...regBuild(`inputs.${index}.description` as const)} placeholder="Description" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeInput(index)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>

            {/* Steps Section */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm">Ordered Shell Commands</h4>
                <Button type="button" size="sm" variant="outline" onClick={() => appendStep({ name: "", command: "", description: "", continue_on_error: false })}><Plus className="h-4 w-4" /></Button>
              </div>
              {stepFields.map((field, index) => (
                <div key={field.id} className="border p-4 rounded-lg space-y-3 relative">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeStep(index)} className="absolute right-2 top-2 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  <div className="space-y-1">
                    <Label>Step {index + 1} Name *</Label>
                    <Input {...regBuild(`steps.${index}.name` as const, { required: true })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Bash Command * (use $VAR for variables)</Label>
                    <Input {...regBuild(`steps.${index}.command` as const, { required: true })} placeholder="e.g. nmap -F $TARGET" />
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsBuilderOpen(false)}>Cancel</Button>
              <Button type="submit">Save Workflow</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
