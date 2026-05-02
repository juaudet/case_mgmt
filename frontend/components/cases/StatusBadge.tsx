import { cn } from '@/lib/utils'
import type { Severity, CaseStatus } from '@/types'

const STATUS_STYLES: Record<string, string> = {
  open:           'bg-[#1e3a5f] text-accent-blue',
  in_progress:    'bg-[#3d3200] text-severity-medium',
  closed:         'bg-elevated text-muted',
  false_positive: 'bg-elevated text-dim',
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-[#490202] text-severity-critical',
  high:     'bg-[#4a2500] text-severity-high',
  medium:   'bg-[#3d3200] text-severity-medium',
  low:      'bg-[#0d2a10] text-severity-low',
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={cn(
        'font-mono text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wide',
        SEVERITY_STYLES[severity] ?? 'bg-elevated text-dim'
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
        'font-mono text-[8px] px-1.5 py-0.5 rounded',
        STATUS_STYLES[status] ?? 'bg-elevated text-dim'
      )}
    >
      {label}
    </span>
  )
}
