interface ContextFlags {
  case_details: boolean
  ldap: boolean
  ioc_data: boolean
  virustotal: boolean
  crowdstrike: boolean
  playbook_state: boolean
}

export function ContextToggles({
  flags,
  onChange,
}: {
  flags: ContextFlags
  onChange: (flags: ContextFlags) => void
}) {
  const labels: Record<keyof ContextFlags, string> = {
    case_details: 'Case Details',
    ldap: 'LDAP',
    ioc_data: 'IOCs',
    virustotal: 'VirusTotal',
    crowdstrike: 'CrowdStrike',
    playbook_state: 'Playbook',
  }

  return (
    <div>
      <p className="text-xs text-slate-500 mb-2">Context</p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(flags) as Array<keyof ContextFlags>).map((key) => (
          <button
            key={key}
            onClick={() => onChange({ ...flags, [key]: !flags[key] })}
            className={`px-2.5 py-1 rounded text-xs transition ${
              flags[key]
                ? 'bg-[#1A3A5C] text-blue-300 border border-blue-700'
                : 'bg-[#162030] text-slate-500 border border-[#1E3048]'
            }`}
          >
            {labels[key]}
          </button>
        ))}
      </div>
    </div>
  )
}
