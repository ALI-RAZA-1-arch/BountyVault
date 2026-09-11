import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { Card, CardContent } from "@renderer/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@renderer/components/ui/table"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import { Textarea } from "@renderer/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@renderer/components/ui/dialog"
import { SeverityBadge } from "@renderer/components/shared/SeverityBadge"
import { StatusBadge } from "@renderer/components/shared/StatusBadge"
import { LoadingSpinner } from "@renderer/components/shared/LoadingSpinner"
import { EmptyState } from "@renderer/components/shared/EmptyState"
import { formatDate, formatCurrency } from "@renderer/lib/utils"
import { FileText, Plus, Pencil } from "lucide-react"
import { toast } from "sonner"

export function Reports() {
  const [reports, setReports] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [platforms, setPlatforms] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // Filter states
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [severityFilter, setSeverityFilter] = useState("")
  const [companyFilter, setCompanyFilter] = useState("")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingReport, setEditingReport] = useState<any>(null)
  const { register, handleSubmit, reset } = useForm()
  const { register: regEdit, handleSubmit: subEdit, setValue: setEditVal } = useForm()

  const loadData = async () => {
    const compRes = await window.api.companies.list()
    if (compRes.data) setCompanies(compRes.data)

    const platRes = await window.api.platforms.list()
    if (platRes.data) setPlatforms(platRes.data)

    const filters = {
      search: search || undefined,
      status: statusFilter || undefined,
      severity: severityFilter || undefined,
      company_id: companyFilter ? Number(companyFilter) : undefined
    }

    const repRes = await window.api.reports.list(filters)
    if (repRes.data) setReports(repRes.data)

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [search, statusFilter, severityFilter, companyFilter])

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsDialogOpen(true)
      setSearchParams({}) // Clear query parameter
    }
  }, [searchParams])

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      company_id: data.company_id ? Number(data.company_id) : null,
      platform_id: data.platform_id ? Number(data.platform_id) : null,
    }

    window.api.reports.create(payload).then((res: any) => {
      if (res.error) toast.error("Error: " + res.error)
      else {
        const reportId = res.data.id
        if (data.bounty_amount) {
          window.api.bounties.save(reportId, {
            amount: Number(data.bounty_amount) || 0,
            currency: data.bounty_currency || "USD",
            status: data.bounty_status || "Pending",
            notes: "Set from report creation",
          })
        }
        toast.success("Report created successfully")
        setIsDialogOpen(false)
        reset()
        loadData()
      }
    })
  }

  const handleOpenEdit = (report: any) => {
    setEditingReport(report)
    setEditVal("title", report.title || "")
    setEditVal("company_id", report.company_id ? String(report.company_id) : "")
    setEditVal("platform_id", report.platform_id ? String(report.platform_id) : "")
    setEditVal("severity", report.severity || "Medium")
    setEditVal("status", report.status || "Draft")
    setEditVal("target", report.target || "")
    setEditVal("url", report.url || "")
    setEditVal("date_discovered", report.date_discovered || "")
    setEditVal("date_submitted", report.date_submitted || "")
    setEditVal("description", report.description || "")
    setEditVal("impact", report.impact || "")
    setEditVal("steps", report.steps || "")
    setEditVal("notes", report.notes || "")
    setEditVal("bounty_amount", report.bounty_amount || "")
    setIsEditOpen(true)
  }

  const onSaveEdit = (data: any) => {
    const payload = {
      ...data,
      company_id: data.company_id ? Number(data.company_id) : null,
      platform_id: data.platform_id ? Number(data.platform_id) : null,
    }
    window.api.reports.update(editingReport.id, payload).then((res: any) => {
      if (res.error) toast.error("Error: " + res.error)
      else {
        if (data.bounty_amount) {
          window.api.bounties.save(editingReport.id, {
            amount: Number(data.bounty_amount) || 0,
            currency: "USD",
            status: "Pending",
            notes: "Updated from report edit",
          })
        }
        toast.success("Report saved successfully")
        setIsEditOpen(false)
        setEditingReport(null)
        loadData()
      }
    })
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px] max-w-xs">
          <Input
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-card border rounded p-1.5 text-sm">
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Accepted">Accepted</option>
            <option value="Resolved">Resolved</option>
            <option value="Duplicate">Duplicate</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="bg-card border rounded p-1.5 text-sm">
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Informative">Informative</option>
          </select>

<select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="bg-card border rounded p-1.5 text-sm">
            <option value="">All Targets</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </div>
      </div>

      {reports.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Bounty</TableHead>
                  <TableHead>Discovered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id} onClick={() => navigate(`/reports/${r.id}`)} className="cursor-pointer">
                    <TableCell className="font-semibold">#{r.id}</TableCell>
                    <TableCell className="font-semibold text-primary">{r.title}</TableCell>
                    <TableCell>{r.company_name || "-"}</TableCell>
                    <TableCell><SeverityBadge severity={r.severity} /></TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-right font-medium text-emerald-500">
                      {r.bounty_amount ? formatCurrency(r.bounty_amount, r.bounty_currency) : "-"}
                    </TableCell>
                    <TableCell>{formatDate(r.date_discovered)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(r)}>
                        <Pencil className="h-4 w-4" />
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
          title="No Reports Found"
          description="Create your first vulnerability report to track the triaging and bounty progress."
          actionLabel="New Report"
          onAction={() => setIsDialogOpen(true)}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Vuln Report</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <Label htmlFor="title">Report Title *</Label>
                <Input id="title" {...register("title", { required: true })} placeholder="e.g. CSRF Token Bypass on /settings" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="company_id">Target *</Label>
                <select id="company_id" {...register("company_id", { required: true })} className="flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">Select Target</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="platform_id">Platform</Label>
                <select id="platform_id" {...register("platform_id")} className="flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">Direct/None</option>
                  {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="severity">Severity</Label>
                <select id="severity" {...register("severity")} className="flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                  <option value="Informative">Informative</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="status">Status</Label>
                <select id="status" {...register("status")} className="flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="Draft">Draft</option>
                  <option value="Ready to Submit">Ready to Submit</option>
                  <option value="Pending">Pending</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Triaged">Triaged</option>
                  <option value="Accepted">Accepted</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="bounty_amount">Bounty Amount ($)</Label>
                <Input type="number" id="bounty_amount" {...register("bounty_amount")} placeholder="e.g. 500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="target">Target Domain/IP</Label>
                <Input id="target" {...register("target")} placeholder="e.g. api.target.com" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="url">Vulnerable URL/Endpoint</Label>
                <Input id="url" {...register("url")} placeholder="https://..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="date_discovered">Date Discovered</Label>
                <Input type="date" id="date_discovered" {...register("date_discovered")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="date_submitted">Date Submitted</Label>
                <Input type="date" id="date_submitted" {...register("date_submitted")} />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Vulnerability Description</Label>
              <Textarea id="description" {...register("description")} rows={4} placeholder="Describe the vulnerability..." />
            </div>

            <div className="space-y-1">
              <Label htmlFor="impact">Impact</Label>
              <Textarea id="impact" {...register("impact")} rows={2} placeholder="Explain the potential impact..." />
            </div>

            <div className="space-y-1">
              <Label htmlFor="steps">Reproduction Steps</Label>
              <Textarea id="steps" {...register("steps")} rows={4} placeholder="1. Go to URL... \n2. Click..." />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Report</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Report Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Report #{editingReport?.id}</DialogTitle>
          </DialogHeader>
          <form onSubmit={subEdit(onSaveEdit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="edit_title">Report Title *</Label>
              <Input id="edit_title" {...regEdit("title", { required: true })} placeholder="e.g. CSRF Token Bypass on /settings" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit_company_id">Target *</Label>
                <select id="edit_company_id" {...regEdit("company_id")} className="flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">Select Target</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit_platform_id">Platform</Label>
                <select id="edit_platform_id" {...regEdit("platform_id")} className="flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">Direct/None</option>
                  {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit_severity">Severity</Label>
                <select id="edit_severity" {...regEdit("severity")} className="flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                  <option value="Informative">Informative</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit_status">Status</Label>
                <select id="edit_status" {...regEdit("status")} className="flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="Draft">Draft</option>
                  <option value="Ready to Submit">Ready to Submit</option>
                  <option value="Pending">Pending</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Triaged">Triaged</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Duplicate">Duplicate</option>
                  <option value="Informative">Informative</option>
                  <option value="Not Applicable">Not Applicable</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit_bounty_amount">Bounty Amount ($)</Label>
                <Input type="number" id="edit_bounty_amount" {...regEdit("bounty_amount")} placeholder="e.g. 500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit_target">Target Domain/IP</Label>
                <Input id="edit_target" {...regEdit("target")} placeholder="e.g. api.target.com" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit_url">Vulnerable URL/Endpoint</Label>
                <Input id="edit_url" {...regEdit("url")} placeholder="https://..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit_date_discovered">Date Discovered</Label>
                <Input type="date" id="edit_date_discovered" {...regEdit("date_discovered")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit_date_submitted">Date Submitted</Label>
                <Input type="date" id="edit_date_submitted" {...regEdit("date_submitted")} />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit_description">Vulnerability Description</Label>
              <Textarea id="edit_description" {...regEdit("description")} rows={4} placeholder="Describe the vulnerability..." />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit_impact">Impact</Label>
              <Textarea id="edit_impact" {...regEdit("impact")} rows={2} placeholder="Explain the potential impact..." />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit_steps">Reproduction Steps</Label>
              <Textarea id="edit_steps" {...regEdit("steps")} rows={4} placeholder="1. Go to URL... \n2. Click..." />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit_notes">Private Notes</Label>
              <Textarea id="edit_notes" {...regEdit("notes")} rows={2} placeholder="Internal notes..." />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit"><Pencil className="mr-2 h-4 w-4" /> Save Report</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
