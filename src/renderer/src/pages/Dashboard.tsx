import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardContent } from "@renderer/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@renderer/components/ui/table"
import { SeverityBadge } from "@renderer/components/shared/SeverityBadge"
import { StatusBadge } from "@renderer/components/shared/StatusBadge"
import { LoadingSpinner } from "@renderer/components/shared/LoadingSpinner"
import { formatCurrency, formatDate } from "@renderer/lib/utils"
import { Shield, Target, FileText, DollarSign, BarChart3 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

export function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [monthly, setMonthly] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      window.api.stats.dashboard(),
      window.api.stats.monthly(),
    ]).then(([statRes, monRes]: any[]) => {
      if (statRes.data) setStats(statRes.data)
      if (monRes.data) setMonthly(monRes.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingSpinner />

  const statCards = [
    { title: "Total Reports", value: stats?.totalReports || 0, icon: FileText, color: "text-blue-500 bg-blue-500/10" },
    { title: "Accepted Reports", value: stats?.accepted || 0, icon: Shield, color: "text-green-500 bg-green-500/10" },
    { title: "Total Bounty Earned", value: formatCurrency(stats?.totalBounty || 0), icon: DollarSign, color: "text-emerald-500 bg-emerald-500/10" },
    { title: "Pending Bounty", value: formatCurrency(stats?.pendingBounty || 0), icon: DollarSign, color: "text-amber-500 bg-amber-500/10" },
    { title: "Targets", value: stats?.companies || 0, icon: Target, color: "text-indigo-500 bg-indigo-500/10" },
    { title: "This Month", value: formatCurrency(monthly?.currentMonthTotal || 0), icon: BarChart3, color: "text-purple-500 bg-purple-500/10" },
  ]

  const chartData = stats?.statusBreakdown?.map((item: any) => ({
    name: item.status,
    count: item.count,
  })) || []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <Card key={i} className="hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-medium text-muted-foreground uppercase">{card.title}</span>
              <div className={`p-2 rounded-lg ${card.color}`}><card.icon className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Reports by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No reports created yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bounty Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/20">
              <span className="text-xs text-muted-foreground uppercase">Accepted Rate</span>
              <div className="text-2xl font-bold">
                {stats?.totalReports ? Math.round((stats.accepted / stats.totalReports) * 100) : 0}%
              </div>
            </div>
            <div className="border rounded-lg p-4 bg-muted/20">
              <span className="text-xs text-muted-foreground uppercase">Average Bounty</span>
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.accepted ? stats.totalBounty / stats.accepted : 0)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentReports?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentReports.map((report: any) => (
                    <TableRow key={report.id} onClick={() => navigate(`/reports/${report.id}`)} className="cursor-pointer">
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell>{report.company_name || '-'}</TableCell>
                      <TableCell><SeverityBadge severity={report.severity} /></TableCell>
                      <TableCell><StatusBadge status={report.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">No recent reports.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent WSL Workflow Runs</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentRuns?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentRuns.map((run: any) => (
                    <TableRow key={run.id} onClick={() => navigate('/workflows')} className="cursor-pointer">
                      <TableCell className="font-medium">{run.workflow_name}</TableCell>
                      <TableCell>{run.target_input || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${run.status === 'Completed' ? 'bg-green-500/10 text-green-500' : run.status === 'Running' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                          {run.status}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(run.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">No recent workflow runs.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
