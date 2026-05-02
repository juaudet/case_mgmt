'use client'
import { formatDate } from '@/lib/utils'
import type { ConsoleHistoryTurn } from '@/types'

export function PromptHistory({
  turns,
  onReuse,
}: {
  turns: ConsoleHistoryTurn[]
  onReuse?: (prompt: string) => void
}) {
  if (!turns.length) {
    return (
      <p className="font-mono text-[9px] text-dim">No history yet.</p>
    )
  }

  return (
    <div className="space-y-2">
      {turns.map((turn) => (
        <article key={turn.id} className="space-y-1">
          {/* User message */}
          <div className="bg-elevated rounded px-2 py-1">
            <p className="font-mono text-[9px] text-primary leading-relaxed">{turn.prompt}</p>
            <p className="font-mono text-[8px] text-dim mt-0.5">{turn.actor} · {formatDate(turn.created_at)}</p>
          </div>

          {/* AI response */}
          <div className="bg-panel border border-subtle rounded px-2 py-1">
            <p className="font-mono text-[9px] text-muted leading-relaxed">{turn.response}</p>
          </div>

          {/* Sources + reuse */}
          <div className="flex flex-wrap gap-1 items-center">
            {turn.sources_used.map((source) => (
              <span
                key={source}
                className="font-mono text-[8px] text-dim bg-elevated px-1 py-0.5 rounded"
              >
                {source}
              </span>
            ))}
            {onReuse && (
              <button
                className="font-mono text-[8px] text-accent-blue hover:opacity-80 transition-opacity ml-auto"
                onClick={() => onReuse(turn.prompt)}
                type="button"
              >
                reuse
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
