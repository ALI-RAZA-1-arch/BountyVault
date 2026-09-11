import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@renderer/components/ui/card"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Label } from "@renderer/components/ui/label"
import { Textarea } from "@renderer/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@renderer/components/ui/dialog"
import { SeverityBadge } from "@renderer/components/shared/SeverityBadge"
import { StatusBadge } from "@renderer/components/shared/StatusBadge"
import { LoadingSpinner } from "@renderer/components/shared/LoadingSpinner"
import { formatDate, formatCurrency } from "@renderer/lib/utils"
import { ArrowLeft, Plus, Trash, ExternalLink, Calendar, DollarSign, Pencil } from "lucide-react"
import { toast } from "sonner"

export function ReportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [bounty, setBounty] = useState<any>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [platforms, setPlatforms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Modal dialog states
  const [isTimelineOpen, setIsTimelineOpen] = useState(false)
  const [isBountyOpen, setIsBountyOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const { register: regTimeline, handleSubmit: subTimeline, reset: resetTimeline } = useForm()
  const { register: regBounty, handleSubmit: subBounty, reset: resetBounty, setValue: setBountyVal } = useForm()
  const { register: regEdit, handleSubmit: subEdit, setValue: setEditVal } = useForm()

  const loadData = async () => {
    const reportId = Number(id)
    const repRes = await window.api.reports.get(reportId)
    if (repRes.data) setReport(repRes.data)

    const compRes = await window.api.companies.list()
    if (compRes.data) setCompanies(compRes.data)

    const platRes = await window.api.platforms.list()
    if (platRes.data) setPlatforms(platRes.data)

    const timelineRes = await window.api.timeline.list(reportId)
    if (timelineRes.data) setTimeline(timelineRes.data)

    const bountyRes = await window.api.bounties.getByReport(reportId)
    if (bountyRes.data) {
      setBounty(bountyRes.data)
      setBountyVal("amount", bountyRes.data.amount)
      setBountyVal("currency", bountyRes.data.currency)
      setBountyVal("status", bountyRes.data.status)
      setBountyVal("date_awarded", bountyRes.data.date_awarded)
      setBountyVal("date_paid", bountyRes.data.date_paid)
      setBountyVal("payment_method", bountyRes.data.payment_method)
      setBountyVal("reference_id", bountyRes.data.reference_id)
    } else {
      setBounty(null)
      resetBounty({
        currency: "USD",
        status: "None"
      })
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleOpenEdit = () => {
    if (!report) return
    setEditVal("title", report.title || "")
    setEditVal("company_id", report.company_id ? String(report.company_id) : "")
    setEditVal("platform_id", report.platform_id ? String(report.platform_id) : "")
    setEditVal("severity", report.severity || "Medium")
    setEditVal("status", report.status || "Draft")
    setEditVal("target", report.target || "")
    setEditVal("url", report.url || "")
    setEditVal("cvss", report.cvss || "")
    setEditVal("date_discovered", report.date_discovered || "")
    setEditVal("date_submitted", report.date_submitted || "")
    setEditVal("external_id", report.external_id || "")
    setEditVal("external_url", report.external_url || "")
    setEditVal("description", report.description || "")
    setEditVal("impact", report.impact || "")
    setEditVal("steps", report.steps || "")
    setEditVal("notes", report.notes || "")
    setIsEditOpen(true)
  }

  const onSaveEdit = (data: any) => {
    const payload = {
      ...data,
      company_id: data.company_id ? Number(data.company_id) : null,
      platform_id: data.platform_id ? Number(data.platform_id) : null,
    }
    window.api.reports.update(Number(id), payload).then((res: any) => {
      if (res.error) toast.error("Error: " + res.error)
      else {
        toast.success("Report saved successfully")
        setIsEditOpen(false)
        loadData()
      }
    })
  }

  const onAddTimeline = (data: any) => {
    window.api.timeline.add({ ...data, report_id: Number(id) }).then((res: any) => {
      if (res.error) toast.error("Error: " + res.error)
      else {
        toast.success("Timeline event added")
        setIsTimelineOpen(false)
        resetTimeline()
        loadData()
      }
    })
  }

  const onSaveBounty = (data: any) => {
    window.api.bounties.save(Number(id), data).then((res: any) => {
      if (res.error) toast.error("Error: " + res.error)
      else {
        toast.success("Bounty information updated")
        setIsBountyOpen(false)
        loadData()
      }
    })
  }

  const handleDeleteReport = () => {
    window.api.reports.delete(Number(id)).then(() => {
      toast.success("Report deleted successfully")
      navigate("/reports")
    })
  }

  if (loading) return <LoadingSpinner />
  if (!report) return <div className="p-8 text-center text-red-500">Report not found.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Report #{report.id}</span>
              <SeverityBadge severity={report.severity} />
              <StatusBadge status={report.status} />
            </div>
            <h2 className="text-2xl font-bold">{report.title}</h2>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleOpenEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsBountyOpen(true)}>
            <DollarSign className="mr-2 h-4 w-4" />
            Bounty
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteReport}>
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="flex space-x-4 border-b">
        {["overview", "timeline"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-1 text-sm font-semibold capitalize border-b-2 transition-all ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Details & Description</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase">Target</h4>
                  <p className="mt-1">{report.target || "-"}</p>
                </div>
                {report.url && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase">Vulnerable URL</h4>
                    <a href={report.url} target="_blank" rel="noreferrer" className="flex items-center space-x-1 text-primary hover:underline mt-1">
                      <span>{report.url}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase">Description</h4>
                  <p className="mt-1 whitespace-pre-wrap">{report.description || "No description provided."}</p>
                </div>
                {report.impact && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase">Potential Impact</h4>
                    <p className="mt-1 whitespace-pre-wrap">{report.impact}</p>
                  </div>
                )}
                {report.steps && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase">Reproduction Steps</h4>
                    <p className="mt-1 whitespace-pre-wrap bg-muted/20 p-3 rounded-lg font-mono text-sm border">{report.steps}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Metadata</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Target</span>
                  <span className="font-semibold">{report.company_name || "-"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Source</span>
                  <span className="font-semibold">{report.source || "Manual"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Discovered</span>
                  <span>{formatDate(report.date_discovered)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>{formatDate(report.date_submitted)}</span>
                </div>
                {bounty && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Bounty awarded</span>
                    <span className="font-bold text-emerald-500">{formatCurrency(bounty.amount, bounty.currency)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Timeline Event Logs</CardTitle>
            <Button size="sm" onClick={() => setIsTimelineOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Event</Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {timeline.length > 0 ? (
              <div className="relative border-l pl-6 ml-3 space-y-6">
                {timeline.map((event) => (
                  <div key={event.id} className="relative">
                    <span className="absolute -left-[31px] top-0 bg-primary/20 text-primary p-1 rounded-full border border-primary">
                      <Calendar className="h-3 w-3" />
                    </span>
                    <div>
                      <span className="text-xs text-muted-foreground">{formatDate(event.event_date)}</span>
                      <p className="font-semibold capitalize text-sm">{event.event_type.replace('_', ' ')}</p>
                      {event.description && <p className="text-muted-foreground text-sm mt-0.5">{event.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">No timeline events recorded.</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline Event Dialog */}
      <Dialog open={isTimelineOpen} onOpenChange={setIsTimelineOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Timeline Event</DialogTitle></DialogHeader>
          <form onSubmit={subTimeline(onAddTimeline)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="event_type">Event Type *</Label>
              <select id="event_type" {...regTimeline("event_type", { required: true })} className="flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="discovered">Discovered</option>
                <option value="created">Created</option>
                <option value="submitted">Submitted</option>
                <option value="triaged">Triaged</option>
                <option value="accepted">Accepted</option>
                <option value="bounty_awarded">Bounty Awarded</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="event_date">Event Date *</Label>
              <Input type="date" id="event_date" {...regTimeline("event_date", { required: true })} defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...regTimeline("description")} placeholder="Details of what occurred..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsTimelineOpen(false)}>Cancel</Button>
              <Button type="submit">Add Event</Button>
            </DialogFooter>
          </form>
        </DialogContent>
</Dialog>

      {/* Edit Report Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Report #{report?.id}</DialogTitle></DialogHeader>
          <form onSubmit={subEdit(onSaveEdit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="title">Report Title *</Label>
              <Input id="title" {...regEdit("title", { required: true })} placeholder="e.g. CSRF Token Bypass on /settings" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="company_id">Target</Label>
                <select id="company_id" {...regEdit("company_id")} className="flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">Select Target</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="platform_id">Platform</Label>
                <select id="platform_id" {...regEdit("platform_id")} className="flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">Direct/None</option>
                  {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="severity">Severity</Label>
                <select id="severity" {...regEdit("severity")} className="flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                  <option value="Informative">Informative</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="status">Status</Label>
                <select id="status" {...regEdit("status")} className="flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm">
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
                <Label htmlFor="cvss">CVSS (optional)</Label>
                <Input id="cvss" {...regEdit("cvss")} placeholder="e.g. 7.5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="target">Target Domain/IP</Label>
                <Input id="target" {...regEdit("target")} placeholder="e.g. api.target.com" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="url">Vulnerable URL/Endpoint</Label>
                <Input id="url" {...regEdit("url")} placeholder="https://..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="date_discovered">Date Discovered</Label>
                <Input type="date" id="date_discovered" {...regEdit("date_discovered")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="date_submitted">Date Submitted</Label>
                <Input type="date" id="date_submitted" {...regEdit("date_submitted")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="external_id">External Report ID</Label>
                <Input id="external_id" {...regEdit("external_id")} placeholder="e.g. 123456" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="external_url">External Report URL</Label>
                <Input id="external_url" {...regEdit("external_url")} placeholder="https://..." />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Vulnerability Description</Label>
              <Textarea id="description" {...regEdit("description")} rows={4} placeholder="Describe the vulnerability..." />
            </div>

            <div className="space-y-1">
              <Label htmlFor="impact">Impact</Label>
              <Textarea id="impact" {...regEdit("impact")} rows={2} placeholder="Explain the potential impact..." />
            </div>

            <div className="space-y-1">
              <Label htmlFor="steps">Reproduction Steps</Label>
              <Textarea id="steps" {...regEdit("steps")} rows={4} placeholder="1. Go to URL... \n2. Click..." />
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Private Notes</Label>
              <Textarea id="notes" {...regEdit("notes")} rows={2} placeholder="Internal notes..." />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit"><Pencil className="mr-2 h-4 w-4" /> Save Report</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bounty Dialog */}
      <Dialog open={isBountyOpen} onOpenChange={setIsBountyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bounty Details</DialogTitle></DialogHeader>
          <form onSubmit={subBounty(onSaveBounty)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="amount">Amount *</Label>
                <Input type="number" id="amount" {...regBounty("amount", { required: true })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" {...regBounty("currency")} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="status">Bounty Status</Label>
              <select id="status" {...regBounty("status")} className="flex h-9 w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="None">None</option>
                <option value="Pending">Pending</option>
                <option value="Awarded">Awarded</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="date_awarded">Date Awarded</Label>
                <Input type="date" id="date_awarded" {...regBounty("date_awarded")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="date_paid">Date Paid</Label>
                <Input type="date" id="date_paid" {...regBounty("date_paid")} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Input id="payment_method" {...regBounty("payment_method")} placeholder="PayPal, Bank Transfer, Payoneer..." />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reference_id">Transaction Reference / ID</Label>
              <Input id="reference_id" {...regBounty("reference_id")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsBountyOpen(false)}>Cancel</Button>
              <Button type="submit">Save Bounty</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
