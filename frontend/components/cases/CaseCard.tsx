import Link from 'next/link'
import { Clock, AlertCircle } from 'lucide-react'
import type { CaseListItem } from '@/types'
import { SeverityBadge, StatusBadge } from './StatusBadge'
import { relativeTime } from '@/lib/utils'

export function CaseCard({ case: c }: { case: CaseListItem }) {
  return (
    <Link href={`/dashboard?case=${c.id}`}>
      <div className="bg-[#162030] border border-[#1E3048] rounded-lg p-4 hover:border-blue-700 hover:bg-[#1A2A3E] transition cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-blue-400">{c.case_number}</span>
              <SeverityBadge severity={c.severity} />
              <StatusBadge status={c.status} />
            </div>
            <h3 className="text-sm font-medium text-white truncate">{c.title}</h3>
            {c.assigned_to && (
              <p className="text-xs text-slate-500 mt-0.5">{c.assigned_to}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {c.ioc_count > 0 && (
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <AlertCircle className="w-3 h-3" />
                {c.ioc_count} IOC{c.ioc_count > 1 ? 's' : ''}
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              {relativeTime(c.updated_at)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
