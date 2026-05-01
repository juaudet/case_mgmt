import { cn, severityColor, statusColor } from '@/lib/utils'
import type { Severity, CaseStatus } from '@/types'

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wide',
        severityColor(severity)
      )}
    >
      {severity}
    </span>
  )
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  const label = status.replace('_', ' ')
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize',
        statusColor(status)
      )}
    >
      {label}
    </span>
  )
}
