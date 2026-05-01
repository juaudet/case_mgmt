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
      <section className="rounded-2xl border border-[#2D2D2A] bg-[#171714] p-5">
        <p className="text-sm font-semibold text-[#F4F1E8]">Prompt history</p>
        <p className="mt-2 text-sm text-[#9B9A92]">No persisted prompts yet.</p>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9B9A92]">Persisted history</p>
          <h3 className="mt-1 text-lg font-semibold text-[#F4F1E8]">Prompt history</h3>
        </div>
        <span className="rounded-full border border-[#464641] bg-[#22221F] px-3 py-1 text-xs text-[#C9C3B4]">
          {turns.length} turns
        </span>
      </div>

      <div className="space-y-3">
        {turns.map((turn) => (
          <article key={turn.id} className="rounded-2xl border border-[#2D2D2A] bg-[#171714] p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#9B9A92]">Prompt</p>
                <p className="mt-1 text-sm font-medium text-[#F4F1E8]">{turn.prompt}</p>
              </div>
              <div className="text-right text-xs text-[#9B9A92]">
                <p>{formatDate(turn.created_at)}</p>
                <p>{turn.actor}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#2D2D2A] bg-[#22221F] p-3 text-sm leading-6 text-[#D8D2C3]">
              {turn.response}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {turn.sources_used.map((source) => (
                  <span
                    key={source}
                    className="rounded-full border border-[#464641] bg-[#2D2D2A] px-2.5 py-1 text-xs text-[#D8D2C3]"
                  >
                    {source}
                  </span>
                ))}
              </div>
              {onReuse && (
                <button
                  className="rounded-full border border-[#97C459] px-3 py-1 text-xs font-medium text-[#DFF0CC] transition hover:bg-[#2B3B1B]"
                  onClick={() => onReuse(turn.prompt)}
                  type="button"
                >
                  Reuse prompt
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
