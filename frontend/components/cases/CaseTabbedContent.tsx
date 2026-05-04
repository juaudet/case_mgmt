'use client'
import { useState } from 'react'
import type { Case } from '@/types'
import { MCPIntegrationPanel } from '@/components/enrichment/MCPIntegrationPanel'
import { CaseDetailTab } from '@/components/cases/CaseDetailTab'

const TABS = ['Detail', 'Enrichment', 'Raw Logs'] as const
type Tab = (typeof TABS)[number]

export function CaseTabbedContent({ caseData }: { caseData: Case }) {
  const [tab, setTab] = useState<Tab>('Detail')

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
        {tab === 'Detail' && <CaseDetailTab caseData={caseData} />}

        {tab === 'Enrichment' && (
          <MCPIntegrationPanel caseData={caseData} caseId={caseData.id} />
        )}

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
