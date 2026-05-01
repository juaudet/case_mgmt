'use client'
import { useState } from 'react'
import type { Case } from '@/types'
import { Timeline } from './Timeline'
import { IOCTable } from './IOCTable'
import { MCPIntegrationPanel } from '@/components/enrichment/MCPIntegrationPanel'
import { AnalystConsole } from '@/components/console/AnalystConsole'

const TABS = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'ioc', label: 'IOC Analysis' },
  { id: 'mcp', label: 'MCP Findings' },
  { id: 'console', label: 'Analyst Console' },
  { id: 'logs', label: 'Raw Logs' },
] as const

type TabId = (typeof TABS)[number]['id']

export function CaseTabbedContent({ caseData }: { caseData: Case }) {
  const [active, setActive] = useState<TabId>('timeline')

  return (
    <div
      className="flex flex-col flex-1 overflow-hidden border-r"
      style={{ borderColor: '#1E3048' }}
    >
      {/* Tab bar */}
      <div
        className="flex shrink-0 border-b"
        style={{ borderColor: '#1E3048' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className="text-[11px] font-medium px-3 py-[7px] border-b-2 transition-colors"
            style={
              active === tab.id
                ? { color: '#D1E0F0', borderColor: '#E24B4A', marginBottom: -1 }
                : { color: '#4A6080', borderColor: 'transparent' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="flex-1 overflow-y-auto p-4 pb-6">
        {active === 'timeline' && <Timeline events={caseData.timeline} />}

        {active === 'ioc' && (
          <div
            className="rounded border"
            style={{ background: '#0F1923', borderColor: '#1E3048' }}
          >
            <IOCTable iocs={caseData.iocs} />
          </div>
        )}

        {active === 'mcp' && <MCPIntegrationPanel caseData={caseData} caseId={caseData.id} />}

        {active === 'console' && <AnalystConsole caseId={caseData.id} />}

        {active === 'logs' && (
          <p className="text-[12px] py-4" style={{ color: '#4A6080' }}>
            Raw log ingestion not available in this view.
          </p>
        )}
      </div>
    </div>
  )
}
