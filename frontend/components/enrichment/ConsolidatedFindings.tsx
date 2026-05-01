import type { MCPFinding } from '@/types'

export function ConsolidatedFindings({ findings }: { findings: MCPFinding[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6F7D8D]">
        Consolidated MCP findings
        <span className="h-px flex-1 bg-[#3B3B37]" />
      </div>
      {findings.length ? (
        <div className="grid gap-2 md:grid-cols-2">
          {findings.map((finding) => (
            <div key={finding.id} className="rounded-lg border border-[#464641] bg-[#2D2D2A] p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-[#E6F1FB] px-2 py-0.5 text-[10px] font-semibold text-[#185FA5]">
                  {finding.source}
                </span>
                <span className="text-[12px] font-semibold text-[#F5F2E8]">{finding.title}</span>
              </div>
              {Object.entries(finding.fields).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between gap-3 border-b border-[#3B3B37] py-1 text-[11px] last:border-b-0"
                >
                  <span className="text-[#9B9A92]">{key.replaceAll('_', ' ')}</span>
                  <span className="break-all text-right font-mono text-[10px] text-[#F5F2E8]">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-[#464641] bg-[#2D2D2A] p-3 text-[11px] text-[#9B9A92]">
          No consolidated MCP findings yet.
        </div>
      )}
    </div>
  )
}
