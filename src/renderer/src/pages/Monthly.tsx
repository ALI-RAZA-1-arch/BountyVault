import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@renderer/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@renderer/components/ui/table"
import { LoadingSpinner } from "@renderer/components/shared/LoadingSpinner"
import { EmptyState } from "@renderer/components/shared/EmptyState"
import { formatCurrency } from "@renderer/lib/utils"
import { Calendar, DollarSign } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function formatMonth(month: string): string {
  const [y, m] = month.split("-")
  return `${MONTH_NAMES[Number(m) - 1] || m} ${y}`
}

export function Monthly() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.stats.monthly().then((res: any) => {
      if (res.data) setData(res.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingSpinner />

  const months = data?.months || []
  const chartData = [...months].reverse().slice(-12).map((m: any) => ({
    name: formatMonth(m.month),
    total: m.total,
  }))

  const prevMonths = months.filter((m: any) => m.month !== data.currentMonth)
  const prevTotal = prevMonths.reduce((s: number, m: any) => s + m.total, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">This Month</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-purple-500">{formatCurrency(data?.currentMonthTotal || 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">{formatMonth(data?.currentMonth || "")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Previous Months</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-blue-500">{formatCurrency(prevTotal)}</div>
            <div className="text-xs text-muted-foreground mt-1">{prevMonths.length} month(s) recorded</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Total Earnings</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-500">{formatCurrency(months.reduce((s: number, m: any) => s + m.total, 0))}</div>
            <div className="text-xs text-muted-foreground mt-1">All time</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Monthly Earnings (Last 12 Months)</CardTitle></CardHeader>
        <CardContent className="h-80">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
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
        <CardHeader><CardTitle>Earnings by Month</CardTitle></CardHeader>
        <CardContent className="p-0">
          {months.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-center">Reports</TableHead>
                  <TableHead className="text-right">Total Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {months.map((m: any) => (
                  <TableRow key={m.month} className={m.month === data.currentMonth ? "bg-primary/5" : ""}>
                    <TableCell className="font-semibold flex items-center">
                      {m.month === data.currentMonth && <span className="h-2 w-2 rounded-full bg-purple-500 mr-2" />}
                      <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                      {formatMonth(m.month)}
                      {m.month === data.currentMonth && (
                        <span className="ml-2 px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-500 font-semibold">This Month</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{m.count}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-500">{formatCurrency(m.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={<DollarSign className="h-8 w-8" />}
              title="No Earnings Yet"
              description="Awarded or paid bounties will be grouped here by month."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
