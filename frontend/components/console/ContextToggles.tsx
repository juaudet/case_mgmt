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
      <p className="font-mono text-[8px] text-dim uppercase tracking-widest mb-1">Context</p>
      <div className="flex flex-wrap gap-1">
        {(Object.keys(CONTEXT_LABELS) as Array<keyof typeof CONTEXT_LABELS>).map((key) => (
          <button
            key={key}
            onClick={() => onChange({ ...flags, [key]: !flags[key] })}
            className={`font-mono text-[8px] px-1.5 py-0.5 rounded transition ${
              flags[key]
                ? 'bg-accent-blue text-white'
                : 'bg-elevated text-muted hover:text-primary'
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
