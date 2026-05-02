'use client'

import { useRouter } from 'next/navigation'
import type { CaseListItem, CaseStatus, Severity } from '@/types'
import { cn } from '@/lib/utils'

const SEVERITY_DOT: Record<Severity, string> = {
  critical: 'bg-[#8A1F1F]',
  high: 'bg-[#FF8A8A]',
  medium: 'bg-[#7AB8F5]',
  low: 'bg-[#A8C997]',
}

const CLOSURE_DOT: Partial<Record<CaseStatus, string>> = {
  closed: 'bg-[#5CAD3B]',
  false_positive: 'bg-[#B794F4]',
}

export function DashboardCaseRail({ cases, selectedId }: { cases: CaseListItem[]; selectedId: string }) {
  const router = useRouter()

  return (
    <aside className="flex h-full min-h-0 w-[188px] shrink-0 flex-col border-r border-[#1E3048] bg-[#0B1520]">
      <div className="shrink-0 border-b border-[#1E3048] px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4A6080]">Cases</p>
        <p className="mt-0.5 font-mono text-[13px] font-semibold leading-none text-white">{cases.length}</p>
        <p className="mt-1 text-[10px] leading-snug text-[#5C7494]">Live queue · updates automatically</p>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {cases.map((c) => {
          const sel = selectedId === c.id
          const railDot = CLOSURE_DOT[c.status] ?? SEVERITY_DOT[c.severity]
          return (
            <button
              key={c.id}
              type="button"
              onClick={() =>
                router.push(`/dashboard?case=${encodeURIComponent(c.id)}`, { scroll: false })
              }
              className={cn(
                'w-full rounded border px-2 py-2 text-left transition-colors',
                sel
                  ? 'border-[#378ADD] bg-[#15283a]'
                  : 'border-transparent bg-[#0F1923] hover:border-[#2C4664] hover:bg-[#132235]'
              )}
            >
              <div className="flex gap-2">
                <span
                  className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', railDot)}
                  aria-hidden
                  title={CLOSURE_DOT[c.status] ? c.status.replace('_', ' ') : c.severity}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[10px] text-[#7AB8F5]">{c.case_number}</p>
                  <p className="mt-0.5 truncate text-[11px] font-medium leading-snug text-[#D1E0F0]">{c.title}</p>
                </div>
              </div>
            </button>
          )
        })}
      </nav>
      {cases.length === 0 && (
        <p className="px-3 py-4 text-center text-[11px] text-[#4A6080]">No cases match filters</p>
      )}
    </aside>
  )
}
