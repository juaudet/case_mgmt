'use client'

import type { Case } from '@/types'
import { useRunMCPTool } from '@/lib/api'
import { MCPConnectorGrid } from './MCPConnectorGrid'
import { MCPToolCallCard } from './MCPToolCallCard'
import { ConsolidatedFindings } from './ConsolidatedFindings'
import { CrowdStrikeIOCSearch } from './CrowdStrikeIOCSearch'

export function MCPIntegrationPanel({ caseData, caseId }: { caseData: Case; caseId: string }) {
  const runTool = useRunMCPTool(caseId)
  const ip = caseData.iocs.find((ioc) => ioc.type === 'ipv4')?.value
  const hash = caseData.iocs.find((ioc) => ioc.type === 'sha256')?.value
  const domain = caseData.iocs.find((ioc) => ioc.type === 'domain')?.value
  const buttonClass =
    'rounded border border-[#5B5B54] px-3 py-1.5 text-[11px] font-semibold text-[#F5F2E8] transition hover:border-[#378ADD] hover:text-[#D7ECFF] disabled:cursor-not-allowed disabled:opacity-45'

  return (
    <div className="space-y-5">
      <MCPConnectorGrid activeProvider="VirusTotal" />
      <div className="rounded-lg border border-[#464641] bg-[#2D2D2A]">
        <div className="border-b border-[#464641] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9B9A92]">
          Live MCP tool calls — {caseData.case_number}
        </div>
        <div className="space-y-3 p-3">
          <div className="flex flex-wrap gap-2">
            <button
              className={buttonClass}
              disabled={!ip || runTool.isPending}
              onClick={() =>
                ip &&
                runTool.mutate({
                  tool_name: 'vt_ip_report',
                  params: { ip, include_resolutions: true },
                })
              }
            >
              Run vt_ip_report ↗
            </button>
            <button
              className={buttonClass}
              disabled={!hash || runTool.isPending}
              onClick={() =>
                hash &&
                runTool.mutate({
                  tool_name: 'vt_hash_lookup',
                  params: { hash },
                })
              }
            >
              Run vt_hash_lookup ↗
            </button>
            <button
              className={buttonClass}
              disabled={!domain || runTool.isPending}
              onClick={() =>
                domain &&
                runTool.mutate({
                  tool_name: 'vt_domain_scan',
                  params: { domain },
                })
              }
            >
              Run vt_domain_scan ↗
            </button>
          </div>
          {caseData.mcp_calls.length ? (
            caseData.mcp_calls.map((call) => <MCPToolCallCard key={call.id} call={call} />)
          ) : (
            <div className="rounded border border-[#3B3B37] bg-[#242421] p-3 text-[11px] text-[#9B9A92]">
              No live MCP calls recorded yet.
            </div>
          )}
        </div>
      </div>
      <ConsolidatedFindings findings={caseData.mcp_findings} />
      <CrowdStrikeIOCSearch caseData={caseData} />
    </div>
  )
}
