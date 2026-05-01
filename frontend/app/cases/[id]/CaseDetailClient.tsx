'use client'
import { useCase, usePlaybook } from '@/lib/api'
import { AppShell } from '@/components/layout/AppShell'
import { Timeline } from '@/components/cases/Timeline'
import { IOCTable } from '@/components/cases/IOCTable'
import { SeverityBadge, StatusBadge } from '@/components/cases/StatusBadge'
import { PlaybookRunner } from '@/components/playbooks/PlaybookRunner'
import { AnalystConsole } from '@/components/console/AnalystConsole'

export function CaseDetailClient({ id }: { id: string }) {
  const { data: caseData, isLoading } = useCase(id)
  const { data: playbook } = usePlaybook(caseData?.playbook_id ?? '')

  if (isLoading)
    return (
      <AppShell title="Case">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-[#162030] rounded-xl" />
          <div className="h-64 bg-[#162030] rounded-xl" />
        </div>
      </AppShell>
    )

  if (!caseData)
    return (
      <AppShell title="Case">
        <p className="text-slate-400">Case not found</p>
      </AppShell>
    )

  return (
    <AppShell title={caseData.case_number}>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main (left) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-[#162030] border border-[#1E3048] rounded-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h1 className="text-lg font-semibold text-white flex-1">{caseData.title}</h1>
              <div className="flex items-center gap-2 shrink-0">
                <SeverityBadge severity={caseData.severity} />
                <StatusBadge status={caseData.status} />
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-3">{caseData.description}</p>
            {caseData.assigned_to && (
              <p className="text-xs text-slate-500 mb-3">
                Assigned to:{' '}
                <span className="text-slate-300">{caseData.assigned_to}</span>
              </p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {[...caseData.mitre_tactics, ...caseData.mitre_techniques].map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 bg-[#1A3A5C] text-blue-300 text-xs rounded font-mono"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* IOCs */}
          <div className="bg-[#162030] border border-[#1E3048] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Indicators of Compromise</h2>
            <IOCTable iocs={caseData.iocs} />
          </div>

          {/* Timeline */}
          <div className="bg-[#162030] border border-[#1E3048] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Timeline</h2>
            <Timeline events={caseData.timeline} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {playbook && (
            <div className="bg-[#162030] border border-[#1E3048] rounded-xl p-5">
              <PlaybookRunner
                playbook={playbook}
                caseData={caseData}
                onStepComplete={(stepId, data) => {
                  console.log('step complete', stepId, data)
                }}
              />
            </div>
          )}

          <div className="bg-[#162030] border border-[#1E3048] rounded-xl p-5">
            <AnalystConsole caseId={id} />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
