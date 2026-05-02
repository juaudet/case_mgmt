const connectors = [
  {
    provider: 'VirusTotal',
    initials: 'VT',
    subtitle: 'Via Tines MCP',
    tools: ['vt_ip_report', 'vt_hash_lookup', 'vt_domain_scan', 'vt_file_submit'],
    connected: true,
  },
  {
    provider: 'AbuseIPDB',
    initials: 'AI',
    subtitle: 'Via Tines MCP',
    tools: ['abuseipdb_check_ip', 'abuseipdb_ip_reports'],
    connected: true,
  },
]

export function MCPConnectorGrid({ activeProvider }: { activeProvider?: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.08em] text-[#6F7D8D]">
        Tines MCP — enrichment tools
        <span className="h-px flex-1 bg-[#3B3B37]" />
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {connectors.map((connector) => (
          <div
            key={connector.provider}
            className={`rounded-lg border bg-[#2D2D2A] p-3 ${
              activeProvider === connector.provider ? 'border-[#185FA5]' : 'border-[#464641]'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#185FA5] text-[10px] font-semibold text-[#D7ECFF]">
                {connector.initials}
              </div>
              <div>
                <div className="text-[12px] font-semibold text-[#F5F2E8]">
                  {connector.provider}
                </div>
                <div className="text-[10px] text-[#9B9A92]">{connector.subtitle}</div>
              </div>
            </div>
            <div
              className={`mt-2 inline-flex rounded px-2 py-0.5 text-[10px] ${
                connector.connected
                  ? 'bg-[#DFF0CC] text-[#3B6D11]'
                  : 'bg-[#3A3A36] text-[#9B9A92]'
              }`}
            >
              {connector.connected ? 'Connected' : 'Available'}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {connector.tools.map((tool) => (
                <span
                  key={tool}
                  className="rounded bg-[#242421] px-1.5 py-0.5 font-mono text-[9px] text-[#C7C2B5]"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
