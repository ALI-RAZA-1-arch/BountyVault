import { Badge } from "@renderer/components/ui/badge"
import { Severity } from "@renderer/types"
import { getSeverityColor } from "@renderer/lib/utils"

interface SeverityBadgeProps {
  severity: Severity
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <Badge variant="outline" className={getSeverityColor(severity)}>
      {severity}
    </Badge>
  )
}
