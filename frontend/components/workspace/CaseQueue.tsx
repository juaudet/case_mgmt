'use client'
import { useState, useRef, useEffect } from 'react'
import { useCases, usePlaybooks } from '@/lib/api'
import type { CaseListItem } from '@/types'

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#f85149',
  high:     '#f0883e',
  medium:   '#eab308',
  low:      '#3fb950',
}

function QueueCard({
  item,
  selected,
  onClick,
  cardRef,
}: {
  item: CaseListItem
  selected: boolean
  onClick: () => void
  cardRef?: React.Ref<HTMLButtonElement>
}) {
  const isCritical = item.severity === 'critical'
  return (
    <button
      ref={cardRef}
      onClick={onClick}
      style={{ borderLeftColor: SEVERITY_COLOR[item.severity] }}
      className={[
        'w-full text-left rounded border border-subtle border-l-2 px-2 py-1.5 mb-1 transition-colors',
        selected ? 'bg-elevated' : 'bg-panel hover:bg-elevated/60',
        isCritical ? 'animate-critical-pulse' : '',
      ].join(' ')}
    >
      <div className="flex justify-between items-center">
        <span className={`font-mono text-[10px] font-semibold ${selected ? 'text-primary' : 'text-muted'}`}>
          {item.case_number}
        </span>
        <span style={{ color: SEVERITY_COLOR[item.severity] }} className="font-mono text-[8px] uppercase">
          {item.severity.slice(0, 4)}
        </span>
      </div>
      <p className="text-[9px] text-dim mt-0.5 truncate">{item.title}</p>
    </button>
  )
}

export function CaseQueue({
  selectedCaseId,
  onSelectCase,
}: {
  selectedCaseId: string | null
  onSelectCase: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const { data: cases = [] } = useCases()
  const { data: playbooks = [] } = usePlaybooks()
  const prevCountRef = useRef(0)
  const firstCardRef = useRef<HTMLButtonElement>(null)

  const filtered = cases.filter(c =>
    c.case_number.toLowerCase().includes(search.toLowerCase()) ||
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  // spring entrance animation wired in Task 13
  useEffect(() => {
    prevCountRef.current = filtered.length
  }, [filtered.length])

  return (
    <aside className="w-[200px] flex-shrink-0 bg-panel border-r border-subtle flex flex-col overflow-hidden">
      <div className="px-2 pt-2 pb-1 flex-shrink-0">
        <p className="font-mono text-[9px] text-accent-blue tracking-widest mb-2">CASE QUEUE</p>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="filter cases..."
          className="w-full bg-base text-dim font-mono text-[9px] px-2 py-1 rounded border border-subtle outline-none focus:border-accent-blue placeholder:text-dim"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1">
        {filtered.map((c, i) => (
          <QueueCard
            key={c.id}
            item={c}
            selected={c.id === selectedCaseId}
            onClick={() => onSelectCase(c.id)}
            cardRef={i === 0 ? firstCardRef : undefined}
          />
        ))}
        {filtered.length === 0 && (
          <p className="font-mono text-[9px] text-dim text-center mt-4">no cases match</p>
        )}
      </div>

      {playbooks.length > 0 && (
        <div className="flex-shrink-0 border-t border-subtle px-2 py-2">
          <p className="font-mono text-[9px] text-accent-blue tracking-widest mb-1">PLAYBOOKS</p>
          {playbooks.slice(0, 4).map((pb) => (
            <button
              key={pb.id}
              type="button"
              className="w-full text-left font-mono text-[9px] text-muted hover:text-accent-blue mb-0.5 truncate"
            >
              → {pb.name}
            </button>
          ))}
        </div>
      )}
    </aside>
  )
}
