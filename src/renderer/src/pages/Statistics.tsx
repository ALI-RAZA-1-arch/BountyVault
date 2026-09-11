import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@renderer/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@renderer/components/ui/table"
import { LoadingSpinner } from "@renderer/components/shared/LoadingSpinner"
import { formatCurrency } from "@renderer/lib/utils"
import { DollarSign, TrendingUp, Award, Wallet, BarChart3 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

const CHART_COLORS = ["hsl(var(--primary))", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"]

export function Statistics() {
  const [bounties, setBounties] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([window.api.bounties.list(), window.api.reports.list()]).then(([bRes, rRes]: any[]) => {
      if (bRes.data) setBounties(bRes.data)
      if (rRes.data) setReports(rRes.data)
      setLoading(false)
    })
  }, [])

  const earned = bounties.filter((b) => b.status === "Awarded" || b.status === "Paid")
  const paid = bounties.filter((b) => b.status === "Paid")
  const pending = bounties.filter((b) => b.status === "Pending")

  const totalEarned = earned.reduce((s, b) => s + (b.amount || 0), 0)
  const totalPaid = paid.reduce((s, b) => s + (b.amount || 0), 0)
  const totalPending = pending.reduce((s, b) => s + (b.amount || 0), 0)
  const avgBounty = earned.length ? totalEarned / earned.length : 0
  const highestBounty = earned.length ? Math.max(...earned.map((b) => b.amount || 0)) : 0
  const acceptedCount = reports.filter((r) => r.status === "Accepted").length

  const reportMap = useMemo(() => {
    const m = new Map<number, any>()
    reports.forEach((r) => m.set(r.id, r))
    return m
  }, [reports])

  const byCompany = useMemo(() => {
    const m = new Map<string, number>()
    earned.forEach((b) => {
      const key = b.company_name || "Unknown"
      m.set(key, (m.get(key) || 0) + (b.amount || 0))
    })
    return Array.from(m.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total)
  }, [earned])

  const bySeverity = useMemo(() => {
    const m = new Map<string, number>()
    earned.forEach((b) => {
      const rep = reportMap.get(b.report_id)
      const key = rep?.severity || "Unknown"
      m.set(key, (m.get(key) || 0) + (b.amount || 0))
    })
    return Array.from(m.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total)
  }, [earned, reportMap])

  const byVulnType = useMemo(() => {
    const m = new Map<string, number>()
    earned.forEach((b) => {
      const rep = reportMap.get(b.report_id)
      const key = rep?.vuln_type_name || "Other"
      m.set(key, (m.get(key) || 0) + (b.amount || 0))
    })
    return Array.from(m.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 8)
  }, [earned, reportMap])

  const byMonth = useMemo(() => {
    const m = new Map<string, number>()
    earned.forEach((b) => {
      const dateStr = b.date_awarded || b.created_at
      if (!dateStr) return
      const d = new Date(dateStr)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      m.set(key, (m.get(key) || 0) + (b.amount || 0))
    })
    return Array.from(m.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
  }, [earned])

  if (loading) return <LoadingSpinner />

  const statCards = [
    { title: "Total Bounty Earned", value: formatCurrency(totalEarned), icon: DollarSign, color: "text-emerald-500 bg-emerald-500/10" },
    { title: "Total Paid", value: formatCurrency(totalPaid), icon: Wallet, color: "text-green-500 bg-green-500/10" },
    { title: "Total Pending", value: formatCurrency(totalPending), icon: TrendingUp, color: "text-amber-500 bg-amber-500/10" },
    { title: "Average Bounty", value: formatCurrency(avgBounty), icon: BarChart3, color: "text-blue-500 bg-blue-500/10" },
    { title: "Highest Bounty", value: formatCurrency(highestBounty), icon: Award, color: "text-purple-500 bg-purple-500/10" },
    { title: "Accepted Reports", value: String(acceptedCount), icon: Award, color: "text-indigo-500 bg-indigo-500/10" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-medium text-muted-foreground uppercase">{card.title}</span>
              <div className={`p-2 rounded-lg ${card.color}`}><card.icon className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Earnings by Month</CardTitle></CardHeader>
          <CardContent className="h-72">
            {byMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMonth}>
                  <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No earnings recorded yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Bounty by Company</CardTitle></CardHeader>
          <CardContent className="h-72">
            {byCompany.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCompany} dataKey="total" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {byCompany.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No company data yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Bounty by Severity</CardTitle></CardHeader>
          <CardContent className="h-64">
            {bySeverity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bySeverity} dataKey="total" nameKey="name" outerRadius={80} paddingAngle={2}>
                    {bySeverity.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No severity data yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Bounty by Vulnerability Type</CardTitle></CardHeader>
          <CardContent>
            {byVulnType.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vulnerability Type</TableHead>
                    <TableHead className="text-right">Total Bounty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byVulnType.map((v) => (
                    <TableRow key={v.name}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-500">{formatCurrency(v.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">No vulnerability data yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
