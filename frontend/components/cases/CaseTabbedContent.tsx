'use client'
import { useState } from 'react'
import type { Case } from '@/types'
import { MCPIntegrationPanel } from '@/components/enrichment/MCPIntegrationPanel'
import { PlaybookRunner } from '@/components/playbooks/PlaybookRunner'
import { usePlaybook, useCompletePlaybookStep } from '@/lib/api'

const TABS = ['Enrichment', 'Playbook', 'Raw Logs'] as const
type Tab = (typeof TABS)[number]

function PlaybookTab({ caseData }: { caseData: Case }) {
  const { data: playbook, isLoading } = usePlaybook(caseData.playbook_id ?? '')
  const completeStep = useCompletePlaybookStep(caseData.id)

  if (!caseData.playbook_id) {
    return (
      <div className="p-4">
        <p className="font-mono text-[10px] text-muted">No playbook assigned to this case.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="font-mono text-[10px] text-muted">Loading playbook...</p>
      </div>
    )
  }

  if (!playbook) {
    return (
      <div className="p-4">
        <p className="font-mono text-[10px] text-muted">Playbook not found.</p>
      </div>
    )
  }

  return (
    <PlaybookRunner
      playbook={playbook}
      caseData={caseData}
      onStepComplete={(stepId, resultData) => completeStep.mutate({ stepId, resultData })}
    />
  )
}

export function CaseTabbedContent({ caseData }: { caseData: Case }) {
  const [tab, setTab] = useState<Tab>('Enrichment')

  return (
    <div className="flex flex-col flex-1 overflow-hidden border-r border-subtle">
      {/* Tab bar */}
      <div className="flex border-b border-subtle bg-panel">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'font-mono text-[10px] px-3 py-2 border-b-2 transition-colors',
              tab === t
                ? 'text-accent-blue border-accent-blue'
                : 'text-dim border-transparent hover:text-muted',
            ].join(' ')}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="flex-1 overflow-y-auto p-4 pb-6">
        {tab === 'Enrichment' && (
          <MCPIntegrationPanel caseData={caseData} caseId={caseData.id} />
        )}

        {tab === 'Playbook' && <PlaybookTab caseData={caseData} />}

        {tab === 'Raw Logs' && (
          <div className="p-4">
            <pre className="font-mono text-[9px] text-muted whitespace-pre-wrap">
              {JSON.stringify(caseData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
