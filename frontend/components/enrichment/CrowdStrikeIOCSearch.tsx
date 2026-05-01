import type { Case } from '@/types'

function numberFromSummary(summary: Record<string, unknown>, keys: string[], fallback: number) {
  for (const key of keys) {
    const value = summary[key]
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = Number(value)
      if (!Number.isNaN(parsed)) return parsed
    }
  }
  return fallback
}

function stringFromSummary(summary: Record<string, unknown>, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = summary[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return fallback
}

export function CrowdStrikeIOCSearch({ caseData }: { caseData: Case }) {
  const latestSearch = [...caseData.mcp_calls]
    .reverse()
    .find((call) => call.tool_name === 'cs_ioc_search')
  const summary = latestSearch?.result_summary ?? {}
  const suspiciousIocs = caseData.iocs.filter((ioc) => (ioc.score ?? 0) >= 70)
  const hashIocs = caseData.iocs.filter((ioc) => ioc.type === 'sha256')
  const hostsScanned = numberFromSummary(summary, ['hosts_scanned', 'hostsScanned', 'hosts'], 128)
  const hashDetections = numberFromSummary(
    summary,
    ['hash_detections', 'hashDetections', 'detections'],
    Math.max(hashIocs.length, 1)
  )
  const suspiciousActivity = numberFromSummary(
    summary,
    ['suspicious_activity', 'suspiciousActivity', 'suspicious'],
    suspiciousIocs.length
  )
  const clean = numberFromSummary(
    summary,
    ['clean', 'clean_hosts', 'cleanHosts'],
    Math.max(hostsScanned - suspiciousActivity, 0)
  )
  const scanSummary = stringFromSummary(
    summary,
    ['scan_summary', 'scanSummary', 'summary'],
    `${hashDetections} hash detections across ${hostsScanned} hosts scanned`
  )

  return (
    <div className="rounded-lg border border-[#464641] bg-[#2D2D2A]">
      <div className="border-b border-[#464641] px-3 py-2">
        <div className="font-mono text-[11px] font-semibold text-[#7AB8F5]">
          MCP tool call — cs_ioc_search
        </div>
        <div className="mt-1 text-[10px] text-[#9B9A92]">
          CrowdStrike Falcon IOC sweep scoped to this case
        </div>
      </div>
      <div className="space-y-3 p-3">
        <div className="rounded border border-[#3B3B37] bg-[#242421] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6F7D8D]">
            Scan summary
          </div>
          <p className="mt-1 text-[12px] text-[#F5F2E8]">{scanSummary}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            ['Hosts scanned', hostsScanned],
            ['Hash detections', hashDetections],
            ['Suspicious activity', suspiciousActivity],
            ['Clean', clean],
          ].map(([label, value]) => (
            <div key={label} className="rounded border border-[#3B3B37] bg-[#242421] p-3">
              <div className="text-[10px] text-[#9B9A92]">{label}</div>
              <div className="mt-1 font-mono text-[18px] font-semibold text-[#F5F2E8]">
                {value}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {caseData.iocs.slice(0, 6).map((ioc) => (
            <span
              key={`${ioc.type}-${ioc.value}`}
              className="rounded bg-[#1E3048] px-2 py-1 font-mono text-[10px] text-[#C7C2B5]"
            >
              {ioc.type}:{ioc.value}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
