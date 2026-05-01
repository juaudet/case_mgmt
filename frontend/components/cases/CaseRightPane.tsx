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
          <StatCard label="Assets affected" value="—" />
          <StatCard label="Hours open" value={hoursOpen(caseData.created_at)} />
        </div>

        {/* MITRE / Kill chain / SLA rows */}
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
      </div>

      {/* LDAP enrichment */}
      <div className="mb-4">
        <SectionTitle>LDAP enrichment</SectionTitle>
        <div
          className="rounded border p-2.5"
          style={{ background: '#162030', borderColor: '#1E3048' }}
        >
          <LDAPPanel
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
