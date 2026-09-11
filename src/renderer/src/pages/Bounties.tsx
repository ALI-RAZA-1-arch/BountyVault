import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader } from "@renderer/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@renderer/components/ui/table"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { LoadingSpinner } from "@renderer/components/shared/LoadingSpinner"
import { EmptyState } from "@renderer/components/shared/EmptyState"
import { formatCurrency, formatDate } from "@renderer/lib/utils"
import { DollarSign, ExternalLink } from "lucide-react"

export function Bounties() {
  const [bounties, setBounties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    window.api.bounties.list().then((res: any) => {
      if (res.data) setBounties(res.data)
      setLoading(false)
    })
  }, [])

  const totals = bounties.reduce(
    (acc, curr) => {
      if (curr.status === "Paid" || curr.status === "Awarded") acc.earned += curr.amount
      else if (curr.status === "Pending") acc.pending += curr.amount
      return acc
    },
    { earned: 0, pending: 0 }
  )

  const filteredBounties = bounties.filter((b) =>
    b.report_title?.toLowerCase().includes(search.toLowerCase()) ||
    b.company_name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold text-emerald-500 uppercase">Total Earned</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-500">{formatCurrency(totals.earned)}</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold text-amber-500 uppercase">Pending Bounties</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-500">{formatCurrency(totals.pending)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <Input
          placeholder="Filter bounties..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs bg-card"
        />
      </div>

      {filteredBounties.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Awarded</TableHead>
                  <TableHead>Date Paid</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBounties.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-semibold text-primary">{b.report_title}</TableCell>
                    <TableCell>{b.company_name || "-"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        b.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : b.status === 'Awarded' ? 'bg-green-500/10 text-green-500' : b.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {b.status}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(b.date_awarded)}</TableCell>
                    <TableCell>{formatDate(b.date_paid)}</TableCell>
                    <TableCell>{b.payment_method || "-"}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-500">{formatCurrency(b.amount, b.currency)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/reports/${b.report_id}`)}>
                        View Report
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
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
          icon={<DollarSign className="h-8 w-8" />}
          title="No Bounties Found"
          description="Bounties awarded or pending for your reports will show up here."
        />
      )}
    </div>
  )
}
