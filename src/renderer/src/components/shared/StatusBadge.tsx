import { Badge } from "@renderer/components/ui/badge"
import { ReportStatus } from "@renderer/types"
import { getStatusColor } from "@renderer/lib/utils"

interface StatusBadgeProps {
  status: ReportStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={getStatusColor(status)}>
      {status}
    </Badge>
  )
}
