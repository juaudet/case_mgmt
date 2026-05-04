'use client'
import type { Case, CaseStatus } from '@/types'
import { LDAPPanel } from '@/components/enrichment/LDAPPanel'
import { useUpdateCase } from '@/lib/api'

const STATUS_OPTIONS: CaseStatus[] = ['open', 'in_progress', 'closed', 'false_positive']

// ── helpers ───────────────────────────────────────────────────────────────────

function hoursOpen(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime()
  const h = ms / 3600000
  return h < 1 ? `${Math.round(h * 60)}m` : `${h.toFixed(1)}h`
}

function slaRemaining(deadline?: string): string {
  if (!deadline) return '—'
  const ms = new Date(deadline).getTime() - Date.now()
  if (ms <= 0) return 'BREACHED'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function slaProgress(deadline?: string): number {
  if (!deadline) return 0
  const total = new Date(deadline).getTime() - Date.now()
  const windowMs = 4 * 3600 * 1000
  const used = windowMs - total
  return Math.min(100, Math.max(0, Math.round((used / windowMs) * 100)))
}

function stringValue(v: unknown): string | undefined {
  if (typeof v === 'string' && v.trim()) return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return undefined
}

function stringList(v: unknown): string[] {
  if (Array.isArray(v)) return v.flatMap((x) => stringValue(x) ?? [])
  const s = stringValue(v)
  return s ? [s] : []
}

function collectAffectedAssets(c: Case): string[] {
  const assets = new Set<string>()
  c.mcp_findings.forEach((f) => {
    stringList(f.fields.affected_hosts).forEach((a) => assets.add(a))
    stringList(f.fields.hosts).forEach((a) => assets.add(a))
  })
  c.mcp_calls.forEach((call) => {
    stringList(call.result_summary.affected_hosts).forEach((a) => assets.add(a))
    stringList(call.raw_result.affected_hosts).forEach((a) => assets.add(a))
    stringList(call.raw_result.hosts).forEach((a) => assets.add(a))
    stringValue(call.raw_result.root_cause)
      ?.match(/\b[A-Z]{2,}(?:-[A-Z0-9]+)+\b/g)
      ?.forEach((a) => assets.add(a))
  })
  return Array.from(assets)
}

function formatTs(ts: string) {
  return new Date(ts).toLocaleString()
}

// ── color maps ────────────────────────────────────────────────────────────────

const SEVERITY_DOT: Record<string, string> = {
  critical: '#E24B4A',
  high:     '#D97706',
  medium:   '#CA8A04',
  low:      '#16A34A',
}
const SEVERITY_BG: Record<string, string> = {
  critical: 'rgba(226,75,74,0.15)',
  high:     'rgba(217,119,6,0.15)',
  medium:   'rgba(202,138,4,0.15)',
  low:      'rgba(22,163,74,0.15)',
}
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  open:           { bg: 'rgba(122,184,245,0.15)', text: '#7AB8F5' },
  in_progress:    { bg: 'rgba(202,138,4,0.15)',   text: '#E6C84A' },
  closed:         { bg: 'rgba(80,80,80,0.2)',      text: '#888' },
  false_positive: { bg: 'rgba(80,80,80,0.2)',      text: '#666' },
}

// ── sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-4 py-2 font-mono text-[10px] tracking-widest uppercase"
      style={{ color: '#4A9EBF', borderBottom: '1px solid #1E3048' }}
    >
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-start gap-4 px-4 py-2"
      style={{ borderBottom: '1px solid #141E2A', fontSize: 12 }}
    >
      <span
        className="font-mono text-[10px] tracking-wider uppercase shrink-0 pt-0.5"
        style={{ color: '#4A6080', width: 96 }}
      >
        {label}
      </span>
      <span style={{ color: '#C0D4E8' }}>{children}</span>
    </div>
  )
}

function StatTile({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-4" style={{ borderRight: '1px solid #1E3048' }}>
      <span className="font-mono font-semibold text-[22px] leading-none" style={{ color: accent ?? '#C0D4E8' }}>
        {value}
      </span>
      <span className="font-mono text-[9px] tracking-widest mt-1.5 uppercase" style={{ color: '#4A6080' }}>
        {label}
      </span>
    </div>
  )
}

function SLABar({ progress, breached }: { progress: number; breached: boolean }) {
  const color = breached ? '#E24B4A' : progress >= 75 ? '#D97706' : progress >= 50 ? '#CA8A04' : '#16A34A'
  return (
    <div className="rounded-full overflow-hidden" style={{ height: 4, background: '#1A2C3F' }}>
      <div className="h-full rounded-full" style={{ width: `${progress}%`, background: color }} />
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: '#0D1A26', border: '1px solid #1E3048' }}>
      {children}
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

export function CaseDetailTab({ caseData: c }: { caseData: Case }) {
  const updateCase = useUpdateCase(c.id)
  const affectedAssets = collectAffectedAssets(c)
  const remaining = slaRemaining(c.sla_deadline)
  const breached = remaining === 'BREACHED'
  const progress = slaProgress(c.sla_deadline)
  const slaColor = breached ? '#E24B4A' : progress >= 75 ? '#D97706' : progress >= 50 ? '#CA8A04' : '#5DBF6A'

  const sevDot   = SEVERITY_DOT[c.severity]  ?? '#888'
  const sevBg    = SEVERITY_BG[c.severity]   ?? 'rgba(80,80,80,0.15)'
  const statSt   = STATUS_COLOR[c.status]    ?? STATUS_COLOR.closed

  const ldapFields: [string, string | undefined][] = [
    ['Display name', stringValue(c.ldap_context?.display_name)],
    ['Title',        stringValue(c.ldap_context?.title)],
    ['SAM account',  stringValue(c.ldap_context?.sam_account)],
    ['Department',   stringValue(c.ldap_context?.department)],
    ['Manager',      stringValue(c.ldap_context?.manager)],
  ]
  const ldapGroups = stringList(c.ldap_context?.groups)

  return (
    <div className="space-y-3">

      {/* ── Stats bar ── */}
      <Card>
        <div className="flex divide-x divide-[#1E3048]">
          <StatTile label="IOCs"     value={c.iocs.length}           accent="#7AB8F5" />
          <StatTile label="Findings" value={c.mcp_findings.length}   accent={c.mcp_findings.length ? '#F0A857' : undefined} />
          <StatTile label="Events"   value={c.timeline.length} />
        </div>
      </Card>

      {/* ── Case info ── */}
      <Card>
        <SectionHeader>Case Info</SectionHeader>
        <Row label="Case #">{c.case_number}</Row>
        <Row label="Title">
          <span style={{ color: '#E8F0F8' }}>{c.title}</span>
        </Row>
        <Row label="Status">
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[10px] px-2 py-0.5 rounded uppercase tracking-wide"
              style={{ background: statSt.bg, color: statSt.text }}
            >
              {c.status.replace('_', ' ')}
            </span>
            <select
              value={c.status}
              onChange={(e) => updateCase.mutate({ status: e.target.value as CaseStatus })}
              disabled={updateCase.isPending}
              className="font-mono text-[10px] rounded border px-1.5 py-0.5 focus:outline-none disabled:opacity-50"
              style={{ background: '#0D1A26', borderColor: '#1E3048', color: '#4A6080' }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </Row>
        <Row label="Severity">
          <span
            className="font-mono text-[10px] px-2 py-0.5 rounded inline-flex items-center gap-1.5 uppercase tracking-wide"
            style={{ background: sevBg, color: sevDot }}
          >
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: sevDot }} />
            {c.severity}
          </span>
        </Row>
        <Row label="Created by">{c.created_by}</Row>
        <Row label="Created">{formatTs(c.created_at)}</Row>
        <Row label="Updated">{formatTs(c.updated_at)}</Row>
        {c.assigned_to && <Row label="Assigned to">{c.assigned_to}</Row>}
        {c.description && (
          <Row label="Description">
            <span style={{ color: '#9AB4C8' }}>{c.description}</span>
          </Row>
        )}
      </Card>

      {/* ── SLA ── */}
      {c.sla_deadline && (
        <Card>
          <SectionHeader>SLA</SectionHeader>
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: '#4A6080' }}>
                Remaining
              </span>
              <span className="font-mono text-[13px] font-semibold" style={{ color: slaColor }}>
                {remaining}
              </span>
            </div>
            <SLABar progress={progress} breached={breached} />
          </div>
        </Card>
      )}

      {/* ── Tags ── */}
      {(c.tags.length > 0 || c.mitre_tactics.length > 0) && (
        <Card>
          <SectionHeader>Tags</SectionHeader>
          <div className="px-4 py-3 flex flex-wrap gap-1.5">
            {c.tags.map((t) => (
              <span
                key={t}
                className="font-mono text-[10px] px-2 py-0.5 rounded"
                style={{ background: '#111D2B', color: '#7A9BB5', border: '1px solid #1E3048' }}
              >
                #{t}
              </span>
            ))}
            {c.mitre_tactics.map((t) => (
              <span
                key={t}
                className="font-mono text-[10px] px-2 py-0.5 rounded"
                style={{ background: 'rgba(122,184,245,0.1)', color: '#7AB8F5', border: '1px solid #1E3A5C' }}
              >
                {t}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* ── MITRE ATT&CK ── */}
      {(c.mitre_tactics.length > 0 || c.mitre_techniques.length > 0) && (
        <Card>
          <SectionHeader>MITRE ATT&amp;CK</SectionHeader>
          {c.mitre_tactics.length > 0 && (
            <Row label="Tactics">
              <div className="flex flex-wrap gap-1">
                {c.mitre_tactics.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[10px] px-2 py-0.5 rounded"
                    style={{ background: 'rgba(122,184,245,0.1)', color: '#7AB8F5' }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Row>
          )}
          {c.mitre_techniques.length > 0 && (
            <Row label="Kill chain">
              <span style={{ color: '#9AB4C8' }}>{c.mitre_techniques.join(' → ')}</span>
            </Row>
          )}
        </Card>
      )}

      {/* ── Affected assets ── */}
      {affectedAssets.length > 0 && (
        <Card>
          <SectionHeader>Affected Assets</SectionHeader>
          <div className="px-4 py-3 flex flex-wrap gap-1.5">
            {affectedAssets.map((a) => (
              <span
                key={a}
                className="font-mono text-[10px] px-2 py-0.5 rounded"
                style={{ background: '#2B2118', color: '#F0A857', border: '1px solid #3A2D18' }}
              >
                {a}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* ── LDAP enrichment ── */}
      <Card>
        <SectionHeader>LDAP Enrichment</SectionHeader>
        {c.ldap_context && Object.keys(c.ldap_context).length > 0 ? (
          <div>
            {ldapFields.map(([label, value]) =>
              value ? <Row key={label} label={label}>{value}</Row> : null
            )}
            {ldapGroups.length > 0 && (
              <Row label="Groups">
                <div className="flex flex-wrap gap-1">
                  {ldapGroups.map((g) => (
                    <span
                      key={g}
                      className="font-mono text-[10px] px-2 py-0.5 rounded"
                      style={{ background: 'rgba(122,184,245,0.1)', color: '#7AB8F5' }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </Row>
            )}
          </div>
        ) : (
          <div className="px-4 py-3">
            <LDAPPanel data={c.ldap_context} />
          </div>
        )}
      </Card>

      {/* ── Responder ── */}
      <Card>
        <SectionHeader>Responder</SectionHeader>
        <div className="px-4 py-3">
          {c.assigned_to ? (
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-[11px] font-semibold shrink-0"
                style={{ background: '#1A3A5C', color: '#7AB8F5' }}
              >
                {c.assigned_to.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium" style={{ color: '#D1E0F0' }}>
                  {c.assigned_to}
                </div>
                <div className="font-mono text-[10px]" style={{ color: '#4A6080' }}>Lead analyst</div>
              </div>
              <span
                className="font-mono text-[10px] px-2 py-0.5 rounded"
                style={{ background: 'rgba(186,117,23,0.15)', color: '#BA7517' }}
              >
                Active
              </span>
            </div>
          ) : (
            <p className="text-[12px]" style={{ color: '#4A6080' }}>Unassigned</p>
          )}
        </div>
      </Card>

    </div>
  )
}
