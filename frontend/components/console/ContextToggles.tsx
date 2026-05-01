export const CONTEXT_LABELS = {
  case_details: 'Case details',
  ldap: 'LDAP enrichment',
  ioc_data: 'IOC data',
  virustotal: 'VirusTotal results',
  crowdstrike: 'CrowdStrike telemetry',
  playbook_state: 'Playbook state',
} satisfies Record<string, string>

export type ContextFlags = Record<keyof typeof CONTEXT_LABELS, boolean>

export function ContextToggles({
  flags,
  onChange,
}: {
  flags: ContextFlags
  onChange: (flags: ContextFlags) => void
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-[#9B9A92] mb-2">Context sources</p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(CONTEXT_LABELS) as Array<keyof typeof CONTEXT_LABELS>).map((key) => (
          <button
            key={key}
            onClick={() => onChange({ ...flags, [key]: !flags[key] })}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              flags[key]
                ? 'bg-[#DFF0CC] border-[#97C459] text-[#3B6D11]'
                : 'bg-[#2D2D2A] border-[#464641] text-[#9B9A92]'
            }`}
            type="button"
          >
            {CONTEXT_LABELS[key]}
          </button>
        ))}
      </div>
    </div>
  )
}
