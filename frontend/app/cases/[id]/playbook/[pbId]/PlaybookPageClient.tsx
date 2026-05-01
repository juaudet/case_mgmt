'use client'
import { useCase, usePlaybook } from '@/lib/api'
import { AppShell } from '@/components/layout/AppShell'
import { PlaybookRunner } from '@/components/playbooks/PlaybookRunner'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function PlaybookPageClient({
  caseId,
  playbookId,
}: {
  caseId: string
  playbookId: string
}) {
  const { data: caseData, isLoading: caseLoading } = useCase(caseId)
  const { data: playbook, isLoading: pbLoading } = usePlaybook(playbookId)

  const isLoading = caseLoading || pbLoading

  return (
    <AppShell title="Playbook Runner">
      <div className="max-w-2xl mx-auto space-y-4">
        <Link
          href={`/cases/${caseId}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to case
        </Link>

        {isLoading && (
          <div className="animate-pulse space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-[#162030] border border-[#1E3048] rounded-lg" />
            ))}
          </div>
        )}

        {!isLoading && playbook && caseData && (
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

        {!isLoading && (!playbook || !caseData) && (
          <p className="text-slate-400 text-sm">Playbook or case not found.</p>
        )}
      </div>
    </AppShell>
  )
}
