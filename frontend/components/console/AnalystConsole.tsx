'use client'
import { useState } from 'react'
import { useConsoleHistory, useStreamConsolePrompt } from '@/lib/api'
import { ContextToggles, CONTEXT_LABELS, type ContextFlags } from './ContextToggles'
import { PromptHistory } from './PromptHistory'

const TEMPLATES = [
  { key: 'attribution', label: 'Attribution analysis' },
  { key: 'exfil', label: 'Exfil scope check' },
  { key: 'blast_radius', label: 'Blast radius' },
  { key: 'hunt_iocs', label: 'Hunt new IOCs' },
  { key: 'exec_summary', label: 'Exec summary' },
  { key: 'remediation', label: 'Remediation steps' },
  { key: 'timeline', label: 'Reconstruct timeline' },
  { key: '', label: 'Custom' },
]

const DEFAULT_CONTEXT_FLAGS: ContextFlags = {
  case_details: true,
  ldap: true,
  ioc_data: true,
  virustotal: false,
  abuseipdb: false,
  mcp_findings: true,
  playbook_state: true,
}

const MODES = ['Free-form', 'Structured', 'Chain-of-thought']

const TOOL_LABELS: Record<string, string> = {
  search_for_files_urls_domains_ips_and_comments: 'VirusTotal',
  search_for_an_ip_address: 'AbuseIPDB check',
  get_reports_for_an_ip_address: 'AbuseIPDB reports',
}

export function AnalystConsole({ caseId }: { caseId: string | null }) {
  const [prompt, setPrompt] = useState('')
  const [template, setTemplate] = useState('')
  const [mode, setMode] = useState(MODES[0])
  const [contextFlags, setContextFlags] = useState<ContextFlags>(DEFAULT_CONTEXT_FLAGS)

  const consoleHistory = useConsoleHistory(caseId ?? '')
  const { submit, isPending, activeToolCall, streamingText } = useStreamConsolePrompt(caseId ?? '')
  const turns = consoleHistory.data?.history ?? []

  function handleSubmit() {
    if (!caseId || (!prompt.trim() && !template)) return
    submit({
      prompt,
      template: template || undefined,
      context_flags: contextFlags,
    })
    setPrompt('')
    setTemplate('')
  }

  function handleReuse(reusedPrompt: string) {
    setPrompt(reusedPrompt)
    setTemplate('')
  }

  return (
    <aside className="w-[35%] flex-shrink-0 bg-panel border-l border-subtle flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-3 pt-2 pb-1 border-b border-subtle">
        <p className="font-mono text-[9px] text-accent-blue tracking-widest">AI CONSOLE</p>
        {!caseId && (
          <p className="font-mono text-[8px] text-dim mt-1">select a case to enable</p>
        )}
      </div>

      {/* History + streaming area */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        {/* Active tool-call chip */}
        {activeToolCall && (
          <div className="flex items-center gap-1 px-2 py-1 bg-elevated rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
            <span className="font-mono text-[8px] text-accent-blue">
              Checking {TOOL_LABELS[activeToolCall] ?? activeToolCall}…
            </span>
          </div>
        )}

        {/* Streaming response bubble */}
        {isPending && streamingText && (
          <div className="px-2 py-1.5 bg-elevated rounded">
            <p className="font-mono text-[9px] text-primary whitespace-pre-wrap">{streamingText}</p>
            <span className="inline-block w-1 h-3 bg-accent-blue animate-pulse ml-0.5" />
          </div>
        )}

        {consoleHistory.isLoading ? (
          <p className="font-mono text-[9px] text-dim">Loading history...</p>
        ) : (
          <PromptHistory turns={turns} onReuse={handleReuse} />
        )}
      </div>

      {/* Template chips + input */}
      <div className="flex-shrink-0 border-t border-subtle px-2 py-2">
        <p className="font-mono text-[8px] text-dim uppercase tracking-widest mb-1">Analyst prompt</p>
        <ContextToggles flags={contextFlags} onChange={setContextFlags} />

        <div className="flex flex-wrap gap-1 mt-2">
          {MODES.map((modeLabel) => (
            <button
              key={modeLabel}
              onClick={() => setMode(modeLabel)}
              type="button"
              className={`font-mono text-[8px] px-1.5 py-0.5 rounded transition ${
                mode === modeLabel
                  ? 'bg-accent-blue text-white'
                  : 'bg-elevated text-muted hover:text-primary'
              }`}
            >
              {modeLabel}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          {TEMPLATES.map((item) => (
            <button
              key={item.label}
              onClick={() => setTemplate(item.key)}
              type="button"
              className={`font-mono text-[8px] px-1.5 py-0.5 rounded transition ${
                template === item.key
                  ? 'bg-accent-blue text-white'
                  : 'bg-elevated text-muted hover:text-primary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 mt-2">
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
            placeholder={caseId ? 'ask anything...' : 'no case selected'}
          />
          <button
            disabled={!caseId || isPending || (!prompt.trim() && !template)}
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
