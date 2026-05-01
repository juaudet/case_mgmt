'use client'
import type { Case } from '@/types'
import { LDAPPanel } from '@/components/enrichment/LDAPPanel'
import { GeoIPPanel } from '@/components/enrichment/GeoIPPanel'
import { useEnrichLDAP, useEnrichGeoIP } from '@/lib/api'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-2 mb-2.5"
      style={{
        fontSize: 11,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        color: '#4A6080',
      }}
    >
      {children}
      <div className="flex-1" style={{ height: 0.5, background: '#1E3048' }} />
    </div>
  )
}

function EnrichRow({ label, value, highlight }: { label: string; value: string; highlight?: 'red' | 'green' }) {
  const valueColor = highlight === 'red' ? '#E24B4A' : highlight === 'green' ? '#639922' : '#D1E0F0'
  return (
    <div
      className="flex justify-between items-start gap-2 py-[5px] border-b"
      style={{ borderColor: '#1E3048', fontSize: 11 }}
    >
      <span style={{ color: '#4A6080', flexShrink: 0 }}>{label}</span>
      <span className="font-mono text-right break-all" style={{ color: valueColor, maxWidth: 160 }}>
        {value}
      </span>
    </div>
  )
}

function MiniButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-2 w-full rounded border px-2 py-1.5 text-[11px] font-medium transition disabled:opacity-50"
      style={{ background: '#1A3A5C', borderColor: '#2C4664', color: '#D7ECFF' }}
    >
      {children}
    </button>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded p-2.5" style={{ background: '#162030' }}>
      <div className="mb-0.5" style={{ fontSize: 10, color: '#4A6080' }}>{label}</div>
      <div className="font-medium" style={{ fontSize: 15, color: '#D1E0F0' }}>{value}</div>
    </div>
  )
}

function hoursOpen(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime()
  const h = ms / 3600000
  return h < 1 ? `${Math.round(h * 60)}m` : `${h.toFixed(1)}h`
}

function slaProgress(deadline?: string): number {
  if (!deadline) return 0
  const total = new Date(deadline).getTime() - Date.now()
  // assume 4h SLA window
  const windowMs = 4 * 3600 * 1000
  const used = windowMs - total
  return Math.min(100, Math.max(0, Math.round((used / windowMs) * 100)))
}

function slaRemaining(deadline?: string): string {
  if (!deadline) return '—'
  const ms = new Date(deadline).getTime() - Date.now()
  if (ms <= 0) return 'Expired'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function stringValue(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return undefined
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => stringValue(item)).filter((item): item is string => Boolean(item))
  }
  const single = stringValue(value)
  return single ? [single] : []
}

function collectAffectedAssets(caseData: Case): string[] {
  const assets = new Set<string>()

  caseData.mcp_findings.forEach((finding) => {
    stringList(finding.fields.affected_hosts).forEach((asset) => assets.add(asset))
    stringList(finding.fields.hosts).forEach((asset) => assets.add(asset))
  })

  caseData.mcp_calls.forEach((call) => {
    stringList(call.result_summary.affected_hosts).forEach((asset) => assets.add(asset))
    stringList(call.raw_result.affected_hosts).forEach((asset) => assets.add(asset))
    stringList(call.raw_result.hosts).forEach((asset) => assets.add(asset))
    const rootCause = stringValue(call.raw_result.root_cause)
    rootCause?.match(/\b[A-Z]{2,}(?:-[A-Z0-9]+)+\b/g)?.forEach((asset) => assets.add(asset))
  })

  return Array.from(assets)
}

function LDAPContextRows({
  data,
  onEnrich,
  loading,
}: {
  data?: Record<string, unknown>
  onEnrich?: () => void
  loading?: boolean
}) {
  if (!data || Object.keys(data).length === 0) {
    return <LDAPPanel data={data} onEnrich={onEnrich} loading={loading} />
  }

  const fields = [
    ['Display name', stringValue(data.display_name)],
    ['Title', stringValue(data.title)],
    ['SAM account', stringValue(data.sam_account)],
    ['Department', stringValue(data.department)],
    ['Manager', stringValue(data.manager)],
  ] as const
  const groups = stringList(data.groups)

  return (
    <div>
      {fields.map(([label, value]) =>
        value ? <EnrichRow key={label} label={label} value={value} /> : null
      )}
      {groups.length > 0 && (
        <div className="pt-2">
          <div className="mb-1.5 text-[10px]" style={{ color: '#4A6080' }}>
            Groups
          </div>
          <div className="flex flex-wrap gap-1">
            {groups.map((group) => (
              <span
                key={group}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: '#1A3A5C', color: '#7AB8F5' }}
              >
                {group}
              </span>
            ))}
          </div>
        </div>
      )}
      {onEnrich && (
        <MiniButton onClick={onEnrich} disabled={loading}>
          {loading ? 'Refreshing LDAP...' : 'Refresh LDAP'}
        </MiniButton>
      )}
    </div>
  )
}

export function CaseRightPane({
  caseData,
  caseId,
}: {
  caseData: Case
  caseId: string
}) {
  const enrichLDAP = useEnrichLDAP(caseId)
  const enrichGeoIP = useEnrichGeoIP(caseId)

  const firstIPv4 = caseData.iocs.find((ioc) => ioc.type === 'ipv4')?.value
  const progress = slaProgress(caseData.sla_deadline)
  const isSlaCritical = progress >= 60

  const mitreTactics = caseData.mitre_tactics.join(' / ') || '—'
  const mitreKillChain = caseData.mitre_techniques.join(' → ') || '—'
  const affectedAssets = collectAffectedAssets(caseData)
  const principal =
    stringValue(caseData.ldap_context?.user_principal_name) ??
    stringValue(caseData.ldap_context?.sam_account) ??
    stringValue(caseData.ldap_context?.display_name)

  return (
    <aside
      className="overflow-y-auto shrink-0 border-l"
      style={{
        width: 280,
        background: '#0F1923',
        borderColor: '#1E3048',
        padding: '14px 16px',
      }}
    >
      {/* Stats grid */}
      <div className="mb-4">
        <SectionTitle>Case details</SectionTitle>
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          <StatCard label="Alerts linked" value={caseData.timeline.length} />
          <StatCard label="IOCs" value={caseData.iocs.length} />
          <StatCard label="Assets affected" value={affectedAssets.length || '—'} />
          <StatCard label="Hours open" value={hoursOpen(caseData.created_at)} />
        </div>

        {/* MITRE / Kill chain / SLA rows */}
        {principal && <EnrichRow label="Principal" value={principal} />}
        <EnrichRow label="MITRE Tactic" value={mitreTactics} />
        <EnrichRow label="Kill chain" value={mitreKillChain} />
        <EnrichRow
          label="SLA remaining"
          value={slaRemaining(caseData.sla_deadline)}
          highlight={isSlaCritical ? 'red' : undefined}
        />

        {/* SLA progress bar */}
        {caseData.sla_deadline && (
          <div className="mt-2">
            <div
              className="text-[10px] mb-1"
              style={{ color: '#4A6080' }}
            >
              SLA progress
            </div>
            <div
              className="rounded overflow-hidden"
              style={{ height: 4, background: '#1E3048' }}
            >
              <div
                className="h-full rounded"
                style={{
                  width: `${progress}%`,
                  background: '#E24B4A',
                }}
              />
            </div>
          </div>
        )}
        {affectedAssets.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {affectedAssets.slice(0, 4).map((asset) => (
              <span
                key={asset}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: '#2B2118', color: '#F0B35D' }}
              >
                {asset}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* LDAP enrichment */}
      <div className="mb-4">
        <SectionTitle>LDAP enrichment</SectionTitle>
        <div
          className="rounded border p-2.5"
          style={{ background: '#162030', borderColor: '#1E3048' }}
        >
          <LDAPContextRows
            data={caseData.ldap_context}
            onEnrich={() => enrichLDAP.mutate()}
            loading={enrichLDAP.isPending}
          />
        </div>
      </div>

      {/* GeoIP */}
      <div className="mb-4">
        <SectionTitle>
          GeoIP{firstIPv4 ? ` — ${firstIPv4}` : ''}
        </SectionTitle>
        <div
          className="rounded border p-2.5"
          style={{ background: '#162030', borderColor: '#1E3048' }}
        >
          <GeoIPPanel
            ip={firstIPv4}
            onEnrich={firstIPv4 ? () => enrichGeoIP.mutate({ ip: firstIPv4 }) : undefined}
            loading={enrichGeoIP.isPending}
          />
        </div>
      </div>

      {/* Responders */}
      <div>
        <SectionTitle>Responders</SectionTitle>
        <div className="flex flex-col gap-2">
          {caseData.assigned_to ? (
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0"
                style={{ background: '#1A3A5C', color: '#7AB8F5' }}
              >
                {caseData.assigned_to
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium" style={{ color: '#D1E0F0' }}>
                  {caseData.assigned_to}
                </div>
                <div className="text-[10px]" style={{ color: '#4A6080' }}>
                  Lead analyst
                </div>
              </div>
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded"
                style={{ background: 'rgba(186,117,23,0.15)', color: '#BA7517' }}
              >
                Active
              </span>
            </div>
          ) : (
            <p className="text-[12px]" style={{ color: '#4A6080' }}>
              Unassigned
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}
