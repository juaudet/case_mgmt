'use client'
import type { IOCRef } from '@/types'

function scoreBarColor(score: number): string {
  if (score >= 80) return '#E24B4A'
  if (score >= 50) return '#BA7517'
  return '#639922'
}

function scoreTextColor(score: number): string {
  if (score >= 80) return '#A32D2D'
  if (score >= 50) return '#854F0B'
  return '#3A6011'
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    ipv4:   { bg: '#1A3A5C', color: '#7AB8F5' },
    sha256: { bg: '#162030', color: '#7A9BB5' },
    domain: { bg: '#162030', color: '#7A9BB5' },
    url:    { bg: '#162030', color: '#7A9BB5' },
    email:  { bg: '#1A3A5C', color: '#7AB8F5' },
  }
  const style = colors[type] ?? { bg: '#162030', color: '#7A9BB5' }
  return (
    <span
      className="text-[11px] font-medium px-2 py-0.5 rounded uppercase"
      style={{ background: style.bg, color: style.color }}
    >
      {type === 'ipv4' ? 'IP' : type === 'sha256' ? 'Hash' : type}
    </span>
  )
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="rounded overflow-hidden"
        style={{ width: 36, height: 4, background: '#1E3048' }}
      >
        <div
          className="h-full rounded"
          style={{
            width: `${Math.min(score, 100)}%`,
            background: scoreBarColor(score),
          }}
        />
      </div>
      <span
        className="text-[10px] font-medium"
        style={{ color: scoreTextColor(score) }}
      >
        {score}
      </span>
    </div>
  )
}

export function IOCTable({
  iocs,
  onEnrich,
}: {
  iocs: IOCRef[]
  onEnrich?: (ioc: IOCRef) => void
}) {
  if (!iocs.length) {
    return (
      <p className="text-[12px] py-4" style={{ color: '#4A6080' }}>
        No IOCs recorded
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: '0.5px solid #1E3048' }}>
            {['Type', 'Value', 'Threat Score', 'Label'].map((h) => (
              <th
                key={h}
                className="text-left py-[5px] px-2 font-medium"
                style={{ color: '#4A6080' }}
              >
                {h}
              </th>
            ))}
            {onEnrich && (
              <th className="text-left py-[5px] px-2 font-medium" style={{ color: '#4A6080' }}>
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {iocs.map((ioc, i) => (
            <tr
              key={i}
              className="transition-colors"
              style={{ borderBottom: '0.5px solid #1E3048' }}
            >
              <td className="py-[6px] px-2 align-top">
                <TypeBadge type={ioc.type} />
              </td>
              <td className="py-[6px] px-2 align-top">
                <span
                  className="font-mono break-all"
                  style={{ fontSize: 10, color: '#D1E0F0' }}
                >
                  {ioc.value}
                </span>
              </td>
              <td className="py-[6px] px-2 align-top">
                {ioc.score != null ? (
                  <ScoreBar score={ioc.score} />
                ) : (
                  <span style={{ color: '#4A6080' }}>—</span>
                )}
              </td>
              <td className="py-[6px] px-2 align-top">
                {ioc.label ? (
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={
                      (ioc.score ?? 0) >= 80
                        ? { background: 'rgba(226,75,74,0.15)', color: '#E24B4A' }
                        : { background: 'rgba(186,117,23,0.15)', color: '#BA7517' }
                    }
                  >
                    {ioc.label}
                  </span>
                ) : (
                  <span style={{ color: '#4A6080' }}>—</span>
                )}
              </td>
              {onEnrich && (
                <td className="py-[6px] px-2 align-top">
                  <button
                    onClick={() => onEnrich(ioc)}
                    className="text-[11px] transition-colors"
                    style={{ color: '#378ADD' }}
                  >
                    Enrich
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
