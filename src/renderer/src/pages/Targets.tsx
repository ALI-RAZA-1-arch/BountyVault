import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent } from "@renderer/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@renderer/components/ui/table"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import { Textarea } from "@renderer/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@renderer/components/ui/dialog"
import { LoadingSpinner } from "@renderer/components/shared/LoadingSpinner"
import { EmptyState } from "@renderer/components/shared/EmptyState"
import { formatCurrency } from "@renderer/lib/utils"
import { Target, Plus, Pencil, Trash, ExternalLink } from "lucide-react"
import { toast } from "sonner"

const TARGET_TYPES = ["Self-Hosted", "Private", "Public", "Platform", "VDP", "Other"]

export function Targets() {
  const [targets, setTargets] = useState<any[]>([])
  const [platforms, setPlatforms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTarget, setSelectedTarget] = useState<any>(null)

  const { register, handleSubmit, reset, setValue } = useForm()

  const loadData = async () => {
    const targetRes = await window.api.companies.list()
    if (targetRes.data) setTargets(targetRes.data)

    const platRes = await window.api.platforms.list()
    if (platRes.data) setPlatforms(platRes.data)

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenDialog = (target: any = null) => {
    setSelectedTarget(target)
    if (target) {
      setValue("name", target.name)
      setValue("website", target.website)
      setValue("target_type", target.target_type || "Self-Hosted")
      setValue("platform_id", target.platform_id ? String(target.platform_id) : "")
      setValue("notes", target.notes)
    } else {
      reset({ target_type: "Self-Hosted" })
    }
    setIsDialogOpen(true)
  }

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      platform_id: data.platform_id ? Number(data.platform_id) : null,
    }

    if (selectedTarget) {
      window.api.companies.update(selectedTarget.id, payload).then((res: any) => {
        if (res.error) toast.error("Error: " + res.error)
        else {
          toast.success("Target updated successfully")
          setIsDialogOpen(false)
          loadData()
        }
      })
    } else {
      window.api.companies.create(payload).then((res: any) => {
        if (res.error) toast.error("Error: " + res.error)
        else {
          toast.success("Target added successfully")
          setIsDialogOpen(false)
          loadData()
        }
      })
    }
  }

  const handleDelete = (id: number) => {
    window.api.companies.delete(id).then((res: any) => {
      if (res.error) toast.error("Error: " + res.error)
      else {
        toast.success("Target deleted successfully")
        loadData()
      }
    })
  }

  const filteredTargets = targets.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Filter targets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs bg-card"
        />
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Target
        </Button>
      </div>

      {filteredTargets.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead className="text-center">Reports</TableHead>
                  <TableHead className="text-center">Accepted</TableHead>
                  <TableHead className="text-right">Total Bounty</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTargets.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold">{c.name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        c.target_type === "Self-Hosted" ? "bg-blue-500/10 text-blue-500" :
                        c.target_type === "Private" ? "bg-purple-500/10 text-purple-500" :
                        c.target_type === "Public" ? "bg-green-500/10 text-green-500" :
                        c.target_type === "Platform" ? "bg-amber-500/10 text-amber-500" :
                        "bg-gray-500/10 text-gray-500"
                      }`}>
                        {c.target_type || "Self-Hosted"}
                      </span>
                    </TableCell>
                    <TableCell>{c.platform_name || "Direct"}</TableCell>
                    <TableCell>
                      {c.website ? (
                        <a
                          href={c.website}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center text-primary hover:underline space-x-1"
                        >
                          <span className="truncate max-w-[160px]">{c.website}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-center">{c.report_count}</TableCell>
                    <TableCell className="text-center">{c.accepted_count}</TableCell>
                    <TableCell className="text-right font-medium text-emerald-500">
                      {formatCurrency(c.total_bounty || 0)}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-destructive hover:bg-destructive/10">
                        <Trash className="h-4 w-4" />
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
          icon={<Target className="h-8 w-8" />}
          title="No Targets Found"
          description="Add your bug-bounty targets: self-hosted programs, private programs, or platform-based programs."
          actionLabel="Add Target"
          onAction={() => handleOpenDialog()}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTarget ? "Edit Target" : "Add Target"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="name">Target Name *</Label>
                <Input id="name" {...register("name", { required: true })} placeholder="e.g. Example Corp / self-hosted app" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="target_type">Target Type</Label>
                <select id="target_type" {...register("target_type")} className="flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  {TARGET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="platform_id">Platform (optional)</Label>
                <select id="platform_id" {...register("platform_id")} className="flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">Direct / None</option>
                  {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="website">Website</Label>
                <Input id="website" {...register("website")} placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">Private Notes</Label>
              <Textarea id="notes" {...register("notes")} placeholder="Contact info, program details, testing notes..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
