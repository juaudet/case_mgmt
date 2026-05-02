'use client'
import { useRef, useEffect } from 'react'
import type { IOCRef } from '@/types'
import { animateCounter } from '@/lib/animations'

function iocSeverity(score?: number): 'malicious' | 'suspicious' | 'clean' | 'unknown' {
  if (score === undefined) return 'unknown'
  if (score >= 50) return 'malicious'
  if (score >= 20) return 'suspicious'
  return 'clean'
}

const CARD_STYLES = {
  malicious:  { card: 'bg-[#1a0505] border-[#490202]', badge: 'bg-severity-critical', dot: 'text-severity-critical' },
  suspicious: { card: 'bg-[#1a0e00] border-[#4a2500]', badge: 'bg-severity-high',     dot: 'text-severity-high' },
  clean:      { card: 'bg-[#0d1a10] border-[#1a3a20]', badge: 'bg-accent-green',       dot: 'text-severity-low' },
  unknown:    { card: 'bg-panel border-subtle',          badge: 'bg-elevated',           dot: 'text-muted' },
}

export function IOCCard({ ioc }: { ioc: IOCRef }) {
  const severity = iocSeverity(ioc.score)
  const styles   = CARD_STYLES[severity]
  const scoreRef = useRef<HTMLSpanElement>(null)
  const barRef   = useRef<SVGRectElement>(null)

  // anime.js animations wired in Task 11
  useEffect(() => {
    if (ioc.score === undefined) return
    if (scoreRef.current) {
      animateCounter(scoreRef.current, ioc.score)
    }
    if (barRef.current) {
      import('animejs/lib/anime.es.js').then(mod => {
        const anime = (mod.default ?? mod) as any
        anime({ targets: barRef.current, width: [0, ioc.score!], duration: 1200, easing: 'easeOutExpo' })
      })
    }
  }, [ioc.score])

  return (
    <div className={`rounded border ${styles.card} p-2 flex flex-col gap-1`}>
      <div className="flex justify-between items-center">
        <span className="font-mono text-[8px] text-dim tracking-wider">
          {ioc.type.toUpperCase()}
        </span>
        <span
          ref={scoreRef}
          className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${styles.badge}`}
        >
          {ioc.score !== undefined ? `${ioc.score}/100` : 'N/A'}
        </span>
      </div>

      <span className="font-mono text-[10px] text-primary truncate">{ioc.value}</span>

      {ioc.score !== undefined && (
        <svg className="w-full" height="4" viewBox="0 0 100 4">
          <rect width="100" height="4" rx="2" fill="#21262d" />
          <rect
            ref={barRef}
            width={ioc.score}
            height="4"
            rx="2"
            fill={severity === 'malicious' ? '#f85149' : severity === 'suspicious' ? '#f0883e' : '#3fb950'}
          />
        </svg>
      )}

      {ioc.label && (
        <span className="text-[8px] text-dim">{ioc.label}</span>
      )}
    </div>
  )
}
