'use client'
import { useRef, useEffect } from 'react'
import { useCase } from '@/lib/api'
import { orchestrateCaseLoad } from '@/lib/animations'
import { IOCCard } from './IOCCard'
import { Timeline } from '@/components/cases/Timeline'
import { CaseTabbedContent } from '@/components/cases/CaseTabbedContent'
import { StatusBadge } from '@/components/cases/StatusBadge'

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-[#490202] text-severity-critical',
  high:     'bg-[#4a2500] text-severity-high',
  medium:   'bg-[#3d3200] text-severity-medium',
  low:      'bg-[#0d2a10] text-severity-low',
}

function MetaPill({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <span className="bg-elevated text-[8px] px-2 py-0.5 rounded-full font-mono">
      <span className="text-dim">{label} </span>
      <span className={`text-muted ${valueClass}`}>{value}</span>
    </span>
  )
}

export function CaseOverview({ caseId }: { caseId: string }) {
  const { data: c, isLoading } = useCase(caseId)
  const iocGridRef = useRef<HTMLDivElement>(null)
  const headerRef  = useRef<HTMLDivElement>(null)

  // anime.js orchestration hooked up in Task 12
  useEffect(() => {
    if (!c) return
    orchestrateCaseLoad(headerRef.current, iocGridRef.current)
  }, [c?.id])

  if (isLoading || !c) {
    return (
      <div data-loading className="flex-1 p-4 animate-pulse space-y-3">
        <div className="h-10 rounded bg-panel" />
        <div className="h-6 rounded bg-panel w-2/3" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-16 rounded bg-panel" />
          <div className="h-16 rounded bg-panel" />
        </div>
      </div>
    )
  }

  const slaLabel = c.sla_deadline
    ? new Date(c.sla_deadline) > new Date()
      ? `SLA ${Math.round((new Date(c.sla_deadline).getTime() - Date.now()) / 60000)}m left`
      : 'SLA BREACHED'
    : null

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header strip */}
      <div ref={headerRef} className="flex-shrink-0 bg-panel border-b border-subtle px-4 py-2" style={{ willChange: 'transform, opacity' }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold text-primary">{c.case_number}</span>
            <span className="text-[11px] text-muted">{c.title}</span>
          </div>
          <div className="flex gap-1.5">
            <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded ${SEVERITY_BADGE[c.severity] ?? ''}`}>
              {c.severity.toUpperCase()}
            </span>
            <StatusBadge status={c.status} />
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {c.assigned_to && <MetaPill label="ASSIGNEE" value={c.assigned_to} />}
          {slaLabel && (
            <MetaPill
              label="SLA"
              value={slaLabel}
              valueClass={slaLabel === 'SLA BREACHED' ? 'text-severity-critical' : 'text-severity-high'}
            />
          )}
          {c.mitre_tactics.length > 0 && (
            <MetaPill label="TACTIC" value={c.mitre_tactics[0]} />
          )}
          <MetaPill label="IOCs" value={String(c.iocs.length)} />
        </div>
      </div>

      {/* Body: IOC grid + timeline strip */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center: IOC grid + tabs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {c.iocs.length > 0 && (
            <div className="flex-shrink-0 border-b border-subtle px-3 py-2">
              <p className="font-mono text-[9px] text-accent-blue tracking-widest mb-2">IOC ANALYSIS</p>
              <div ref={iocGridRef} className="grid grid-cols-2 gap-2" style={{ willChange: 'transform, opacity' }}>
                {c.iocs.map((ioc) => (
                  <IOCCard key={`${ioc.type}-${ioc.value}`} ioc={ioc} />
                ))}
              </div>
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <CaseTabbedContent caseData={c} />
          </div>
        </div>

        {/* Right: timeline strip */}
        {/* TODO Task 8: Timeline tab removed when CaseTabbedContent is restyled — currently Timeline renders twice (right strip + CaseTabbedContent default tab) */}
        <div className="w-[160px] flex-shrink-0 border-l border-subtle bg-panel flex flex-col overflow-hidden">
          <p className="font-mono text-[9px] text-accent-blue tracking-widest px-2 pt-2 pb-1 flex-shrink-0">
            TIMELINE
          </p>
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            <Timeline events={c.timeline} />
          </div>
        </div>
      </div>
    </div>
  )
}
