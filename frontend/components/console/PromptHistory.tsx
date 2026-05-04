'use client'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { formatDate } from '@/lib/utils'
import type { ConsoleHistoryTurn } from '@/types'

function MdResponse({ text }: { text: string }) {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw]}
      components={{
        p: ({ children }) => (
          <p className="font-mono text-[9px] text-muted leading-relaxed mb-1 last:mb-0">{children}</p>
        ),
        h1: ({ children }) => (
          <p className="font-mono text-[9px] font-bold text-primary leading-relaxed mb-1">{children}</p>
        ),
        h2: ({ children }) => (
          <p className="font-mono text-[9px] font-bold text-primary leading-relaxed mb-1">{children}</p>
        ),
        h3: ({ children }) => (
          <p className="font-mono text-[9px] font-semibold text-primary leading-relaxed mb-0.5">{children}</p>
        ),
        ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 mb-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 mb-1">{children}</ol>,
        li: ({ children }) => (
          <li className="font-mono text-[9px] text-muted leading-relaxed">{children}</li>
        ),
        code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
          inline ? (
            <code className="font-mono text-[9px] bg-base text-accent-blue px-0.5 rounded">{children}</code>
          ) : (
            <pre className="font-mono text-[9px] bg-base text-primary p-1.5 rounded overflow-x-auto mb-1 whitespace-pre-wrap">
              <code>{children}</code>
            </pre>
          ),
        strong: ({ children }) => (
          <strong className="font-bold text-primary">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-accent-blue pl-2 my-1">{children}</blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-blue underline hover:opacity-80"
          >
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  )
}

export function PromptHistory({
  turns,
  onReuse,
}: {
  turns: ConsoleHistoryTurn[]
  onReuse?: (prompt: string) => void
}) {
  if (!turns.length) {
    return (
      <p className="font-mono text-[9px] text-dim text-center py-4">No history yet. Ask anything below.</p>
    )
  }

  return (
    <div className="space-y-3">
      {turns.map((turn) => (
        <article key={turn.id} className="space-y-1">
          {/* User message — right aligned */}
          <div className="flex justify-end">
            <div className="max-w-[85%] bg-accent-blue/10 border border-accent-blue/20 rounded-lg px-2.5 py-1.5">
              <p className="font-mono text-[9px] text-primary leading-relaxed">{turn.prompt}</p>
              <p className="font-mono text-[8px] text-dim mt-0.5 text-right">
                {turn.actor} · {formatDate(turn.created_at)}
              </p>
            </div>
          </div>

          {/* AI response — left aligned */}
          <div className="flex justify-start">
            <div className="max-w-[90%] bg-panel border border-subtle rounded-lg px-2.5 py-1.5">
              <MdResponse text={turn.response} />

              {(turn.sources_used.length > 0 || onReuse) && (
                <div className="flex flex-wrap gap-1 items-center mt-1.5 pt-1 border-t border-subtle">
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
                      reuse ↑
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
