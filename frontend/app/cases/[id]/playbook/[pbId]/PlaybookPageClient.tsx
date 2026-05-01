'use client'
import { useCase, useCompletePlaybookStep, usePlaybook } from '@/lib/api'
import { AppShell } from '@/components/layout/AppShell'
import { PlaybookRunner } from '@/components/playbooks/PlaybookRunner'
import Link from 'next/link'

function stringValue(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value
  return undefined
}

export function PlaybookPageClient({
  caseId,
  playbookId,
}: {
  caseId: string
  playbookId: string
}) {
  const { data: caseData, isLoading: caseLoading } = useCase(caseId)
  const { data: playbook, isLoading: pbLoading } = usePlaybook(playbookId)
  const completeStep = useCompletePlaybookStep(caseId)

  const isLoading = caseLoading || pbLoading
  const completedCount = caseData?.playbook_state?.completed_steps.length ?? 0
  const totalSteps = playbook?.steps.length ?? 0
  const principal =
    stringValue(caseData?.ldap_context?.user_principal_name) ??
    stringValue(caseData?.ldap_context?.sam_account) ??
    stringValue(caseData?.ldap_context?.display_name)

  return (
    <AppShell noPadding>
      <div className="h-full overflow-y-auto bg-[#20201D] p-4">
        <Link
          href={`/cases/${caseId}`}
          className="mb-3 inline-flex text-[12px] text-[#9B9A92] transition hover:text-[#F5F2E8]"
        >
          ← Back to case
        </Link>

        {isLoading && (
          <div className="animate-pulse space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-[#162030] border border-[#1E3048] rounded-lg" />
            ))}
          </div>
        )}

        {!isLoading && playbook && caseData && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#464641] bg-[#171714] p-4 text-[#F4F1E8]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] text-[#9B9A92]">{caseData.case_number}</p>
                  <h1 className="mt-1 text-lg font-semibold text-white">{caseData.title}</h1>
                  {principal && (
                    <p className="mt-1 text-[12px] text-[#C9C3B4]">Principal account: {principal}</p>
                  )}
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  <span className="rounded-full border border-[#5B5B54] bg-[#242421] px-3 py-1 text-[11px] font-semibold text-[#D7ECFF]">
                    {caseData.status.replace('_', ' ')}
                  </span>
                  <span className="rounded-full border border-[#5B5B54] bg-[#242421] px-3 py-1 text-[11px] font-semibold text-[#F5F2E8]">
                    {completedCount} / {totalSteps} complete
                  </span>
                </div>
              </div>
              {caseData.mitre_techniques.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {caseData.mitre_techniques.map((technique) => (
                    <span
                      key={technique}
                      className="rounded border border-[#5B5B54] bg-[#242421] px-2 py-0.5 font-mono text-[10px] text-[#9B9A92]"
                    >
                      {technique}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <PlaybookRunner
              playbook={playbook}
              caseData={caseData}
              onStepComplete={(stepId, resultData) => completeStep.mutate({ stepId, resultData })}
            />
          </div>
        )}

        {!isLoading && (!playbook || !caseData) && (
          <p className="text-slate-400 text-sm">Playbook or case not found.</p>
        )}
      </div>
    </AppShell>
  )
}
