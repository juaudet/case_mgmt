'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const SEVERITY_DOTS: Record<string, string> = {
  critical: '#E24B4A',
  high: '#BA7517',
  medium: '#378ADD',
  low: '#639922',
}

const queueItems = [
  { label: 'Open Cases', status: 'open', icon: '◉', count: null },
  { label: 'In Progress', status: 'in_progress', icon: '○', count: null },
  { label: 'Closed', status: 'closed', icon: '✓', count: null },
  { label: 'False Positives', status: 'false_positive', icon: '⊘', count: null },
]

const playbookItems = [
  { label: 'Phishing Response', href: '/playbooks' },
  { label: 'Credential Theft', href: '/playbooks' },
  { label: 'Lateral Movement', href: '/playbooks' },
]

const enrichmentItems = [
  { label: 'LDAP Lookup', icon: '⊞' },
  { label: 'IOC Feed', icon: '⊡' },
  { label: 'GeoIP Intel', icon: '⊟' },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-3.5 mb-1"
      style={{
        fontSize: 10,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#4A6080',
      }}
    >
      {children}
    </div>
  )
}

function SidebarItem({
  active,
  href,
  children,
}: {
  active?: boolean
  href?: string
  children: React.ReactNode
}) {
  const base =
    'flex items-center gap-2 px-3.5 py-[7px] text-[12px] cursor-pointer transition-colors duration-100 relative'
  const cls = cn(
    base,
    active
      ? 'bg-[#162030] text-white font-medium border-r-2 border-[#E24B4A]'
      : 'text-[#7A9BB5] hover:bg-[#162030] hover:text-white'
  )
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    )
  }
  return <div className={cls}>{children}</div>
}

function CountBadge({ n }: { n: number }) {
  return (
    <span
      className="ml-auto rounded-full px-1.5 py-[1px]"
      style={{
        fontSize: 10,
        background: 'rgba(226,75,74,0.15)',
        color: '#E24B4A',
      }}
    >
      {n}
    </span>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status')
  const currentSeverity = searchParams.get('severity')

  return (
    <aside
      className="overflow-y-auto border-r"
      style={{
        background: '#0B1520',
        borderColor: '#1E3048',
        gridRow: '2',
        paddingTop: 12,
        paddingBottom: 12,
      }}
    >
      {/* Queue */}
      <div className="mb-5">
        <SectionLabel>Queue</SectionLabel>
        {queueItems.map((item) => {
          const href = `/cases?status=${item.status}`
          const active = pathname.startsWith('/cases') && currentStatus === item.status
          return (
            <SidebarItem key={item.status} href={href} active={active}>
              <span className="w-3.5 text-center text-[13px]">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.status === 'open' && <CountBadge n={12} />}
            </SidebarItem>
          )
        })}
      </div>

      {/* Severity */}
      <div className="mb-5">
        <SectionLabel>Severity</SectionLabel>
        {(['critical', 'high', 'medium', 'low'] as const).map((sev) => {
          const href = `/cases?severity=${sev}`
          const active = pathname.startsWith('/cases') && currentSeverity === sev
          return (
            <SidebarItem key={sev} href={href} active={active}>
              <span
                className="w-3.5 text-center text-[13px]"
                style={{ color: SEVERITY_DOTS[sev] }}
              >
                ●
              </span>
              <span className="flex-1 capitalize">{sev}</span>
              {sev === 'critical' && <CountBadge n={3} />}
              {sev === 'high' && <CountBadge n={5} />}
            </SidebarItem>
          )
        })}
      </div>

      {/* Enrichment */}
      <div className="mb-5">
        <SectionLabel>Enrichment</SectionLabel>
        {enrichmentItems.map((item) => (
          <SidebarItem key={item.label}>
            <span className="w-3.5 text-center text-[13px]">{item.icon}</span>
            <span>{item.label}</span>
          </SidebarItem>
        ))}
      </div>

      {/* Playbooks */}
      <div className="mb-5">
        <SectionLabel>Playbooks</SectionLabel>
        {playbookItems.map((item) => (
          <SidebarItem key={item.label} href={item.href}>
            <span className="w-3.5 text-center text-[13px]">▷</span>
            <span>{item.label}</span>
          </SidebarItem>
        ))}
      </div>
    </aside>
  )
}
