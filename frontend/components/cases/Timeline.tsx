import type { TimelineEvent } from '@/types'
import { formatDate } from '@/lib/utils'
import { AlertCircle, Settings, CheckCircle } from 'lucide-react'

function actionIcon(action: string) {
  if (action === 'created') return <CheckCircle className="w-4 h-4 text-green-400" />
  if (action === 'alert_triggered') return <AlertCircle className="w-4 h-4 text-red-400" />
  if (action.includes('escalat')) return <AlertCircle className="w-4 h-4 text-orange-400" />
  if (action.includes('resolv')) return <CheckCircle className="w-4 h-4 text-blue-400" />
  return <Settings className="w-4 h-4 text-slate-400" />
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  if (sorted.length === 0) {
    return <p className="text-sm text-slate-500 py-4">No timeline events</p>
  }

  return (
    <div className="space-y-0">
      {sorted.map((event, i) => (
        <div key={i} className="flex gap-3 pb-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1E3048] shrink-0">
              {actionIcon(event.action)}
            </div>
            {i < sorted.length - 1 && <div className="w-px flex-1 bg-[#1E3048] my-1" />}
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white capitalize">
                {event.action.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-slate-500">{formatDate(event.timestamp)}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{event.detail}</p>
            <p className="text-xs text-slate-600 mt-0.5">by {event.actor}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
