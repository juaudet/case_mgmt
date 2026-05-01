import type { TimelineEvent } from '@/types'

type DotColor = 'red' | 'amber' | 'blue' | 'green' | 'default'

const DOT_STYLES: Record<DotColor, { border: string; background: string }> = {
  red:     { border: '#E24B4A', background: '#FCEBEB' },
  amber:   { border: '#BA7517', background: '#FAEEDA' },
  blue:    { border: '#378ADD', background: '#1A3A5C' },
  green:   { border: '#639922', background: '#EAF3DE' },
  default: { border: '#1E3048', background: '#162030' },
}

function dotColor(action: string): DotColor {
  const a = action.toLowerCase()
  if (/alert|critical|impossible|travel|pass.the.hash|lateral/.test(a)) return 'red'
  if (/escalat|bypass|enumerat|brute|malwar|phish/.test(a)) return 'amber'
  if (/analyst|enrich|console|assign|investigat|open/.test(a)) return 'blue'
  if (/contain|resolv|close|creat|disabled|revoke|patch|remediat/.test(a)) return 'green'
  return 'default'
}

function formatTs(ts: string): string {
  try {
    return new Date(ts).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
  } catch {
    return ts
  }
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  if (sorted.length === 0) {
    return <p className="text-[12px] py-4" style={{ color: '#4A6080' }}>No timeline events</p>
  }

  return (
    <ul className="relative list-none" style={{ paddingLeft: 0 }}>
      {/* Vertical line */}
      <div
        className="absolute"
        style={{
          left: 6,
          top: 6,
          bottom: 6,
          width: 1,
          background: '#1E3048',
        }}
      />

      {sorted.map((event, i) => {
        const color = dotColor(event.action)
        const dot = DOT_STYLES[color]
        return (
          <li key={i} className="flex gap-3.5 pb-3.5 relative">
            {/* Dot */}
            <div
              className="shrink-0 rounded-full border-2 z-10 mt-0.5"
              style={{
                width: 13,
                height: 13,
                borderColor: dot.border,
                background: dot.background,
              }}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div
                className="text-[12px] font-medium mb-0.5 leading-snug"
                style={{ color: '#D1E0F0' }}
              >
                {event.action.replace(/_/g, ' ')}
              </div>
              {event.detail && (
                <div
                  className="text-[11px] leading-relaxed mb-0.5"
                  style={{ color: '#4A6080' }}
                >
                  {event.detail}
                </div>
              )}
              <div
                className="text-[10px] font-mono"
                style={{ color: '#4A6080' }}
              >
                {formatTs(event.timestamp)}
                {event.actor && (
                  <span>
                    {' '}
                    &nbsp;·&nbsp; {event.actor}
                  </span>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
