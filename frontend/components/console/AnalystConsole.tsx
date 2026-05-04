'use client'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useConsoleHistory, useStreamConsolePrompt } from '@/lib/api'
import { PromptHistory } from './PromptHistory'

const TOOL_LABELS: Record<string, string> = {
  search_for_files_urls_domains_ips_and_comments: 'VirusTotal',
  search_for_an_ip_address: 'AbuseIPDB',
  get_reports_for_an_ip_address: 'AbuseIPDB',
}

function MdStream({ text }: { text: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => (
          <p className="font-mono text-[9px] text-primary leading-relaxed mb-1 last:mb-0">{children}</p>
        ),
        ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 mb-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 mb-1">{children}</ol>,
        li: ({ children }) => (
          <li className="font-mono text-[9px] text-primary leading-relaxed">{children}</li>
        ),
        code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
          inline ? (
            <code className="font-mono text-[9px] bg-base text-accent-blue px-0.5 rounded">{children}</code>
          ) : (
            <pre className="font-mono text-[9px] bg-base text-primary p-1.5 rounded overflow-x-auto mb-1 whitespace-pre-wrap">
              <code>{children}</code>
            </pre>
          ),
        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
      }}
    >
      {text}
    </ReactMarkdown>
  )
}

export function AnalystConsole({ caseId }: { caseId: string | null }) {
  const [prompt, setPrompt] = useState('')
  const [pendingPrompt, setPendingPrompt] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const consoleHistory = useConsoleHistory(caseId ?? '')
  const { submit, isPending, activeToolCall, streamingText } = useStreamConsolePrompt(caseId ?? '')
  const turns = [...(consoleHistory.data?.history ?? [])].reverse()
  const initialScrollDone = useRef(false)

  // Snap to bottom on first load, smooth-scroll on subsequent updates
  useEffect(() => {
    if (!bottomRef.current) return
    if (!initialScrollDone.current && turns.length > 0) {
      bottomRef.current.scrollIntoView({ behavior: 'instant' })
      initialScrollDone.current = true
    } else {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [turns, streamingText, isPending])

  function handleSubmit() {
    if (!caseId || !prompt.trim()) return
    setPendingPrompt(prompt)
    submit({ prompt, context_flags: {} })
    setPrompt('')
  }

  function handleReuse(reusedPrompt: string) {
    setPrompt(reusedPrompt)
  }

  // Clear pending prompt once history refreshes with the new turn
  useEffect(() => {
    if (!isPending && pendingPrompt) {
      setPendingPrompt('')
    }
  }, [isPending, pendingPrompt])

  const toolLabel = activeToolCall
    ? (TOOL_LABELS[activeToolCall] ?? activeToolCall.replace(/_/g, ' '))
    : null

  return (
    <aside className="w-[35%] flex-shrink-0 bg-panel border-l border-subtle flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-3 pt-2 pb-1 border-b border-subtle">
        <p className="font-mono text-[9px] text-accent-blue tracking-widest">AI CONSOLE</p>
        {!caseId && (
          <p className="font-mono text-[8px] text-dim mt-1">select a case to enable</p>
        )}
      </div>

      {/* Message feed — scrollable, newest at bottom */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {consoleHistory.isLoading ? (
          <p className="font-mono text-[9px] text-dim text-center py-4">Loading history…</p>
        ) : (
          <PromptHistory turns={turns} onReuse={handleReuse} />
        )}

        {/* Optimistic user bubble while waiting */}
        {isPending && pendingPrompt && (
          <div className="mt-3 flex justify-end">
            <div className="max-w-[85%] bg-accent-blue/10 border border-accent-blue/20 rounded-lg px-2.5 py-1.5">
              <p className="font-mono text-[9px] text-primary leading-relaxed">{pendingPrompt}</p>
            </div>
          </div>
        )}

        {/* Tool-call loading chip */}
        {isPending && (
          <div className="mt-2 flex items-center gap-1.5 px-2 py-1.5 bg-elevated border border-subtle rounded-lg w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse flex-shrink-0" />
            <span className="font-mono text-[8px] text-accent-blue">
              {toolLabel ? `Querying ${toolLabel}…` : 'Thinking…'}
            </span>
          </div>
        )}

        {/* Streaming response bubble */}
        {isPending && streamingText && (
          <div className="mt-1 flex justify-start">
            <div className="max-w-[90%] bg-panel border border-subtle rounded-lg px-2.5 py-1.5">
              <MdStream text={streamingText} />
              <span className="inline-block w-1 h-3 bg-accent-blue animate-pulse ml-0.5 align-middle" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-subtle px-2 py-2">
        <div className="flex gap-1.5">
          <input
            disabled={!caseId || isPending}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            className="flex-1 bg-base border border-subtle rounded font-mono text-[9px] text-primary px-2 py-1 outline-none focus:border-accent-blue disabled:opacity-40 placeholder:text-dim"
            placeholder={caseId ? 'ask anything…' : 'no case selected'}
          />
          <button
            disabled={!caseId || isPending || !prompt.trim()}
            onClick={handleSubmit}
            type="button"
            className="bg-accent-green px-2 py-1 rounded font-mono text-[9px] text-white disabled:opacity-40 hover:opacity-80 transition-opacity"
          >
            {isPending ? '…' : '→'}
          </button>
        </div>
      </div>
    </aside>
  )
}
