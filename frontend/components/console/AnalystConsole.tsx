'use client'
import { useState } from 'react'
import { useConsoleHistory, useSubmitConsolePrompt } from '@/lib/api'
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

export function AnalystConsole({ caseId }: { caseId: string | null }) {
  const [prompt, setPrompt] = useState('')
  const [template, setTemplate] = useState('')
  const [mode, setMode] = useState(MODES[0])
  const [contextFlags, setContextFlags] = useState<ContextFlags>(DEFAULT_CONTEXT_FLAGS)
  const consoleHistory = useConsoleHistory(caseId ?? '')
  const submitPrompt = useSubmitConsolePrompt(caseId ?? '')
  const turns = consoleHistory.data?.history ?? []
  const activeContextLabels = (Object.keys(contextFlags) as Array<keyof ContextFlags>)
    .filter((key) => contextFlags[key])
    .map((key) => CONTEXT_LABELS[key])

  function handleSubmit() {
    if (!prompt.trim() && !template) return
    submitPrompt.mutate({
      prompt,
      template: template || undefined,
      context_flags: contextFlags,
    })
  }

  function handleClear() {
    setPrompt('')
    setTemplate('')
  }

  function handleReuse(reusedPrompt: string) {
    setPrompt(reusedPrompt)
    setTemplate('')
  }

  return (
    <aside className="w-[240px] flex-shrink-0 bg-panel border-l border-subtle flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-3 pt-2 pb-1 border-b border-subtle">
        <p className="font-mono text-[9px] text-accent-blue tracking-widest">AI CONSOLE</p>
        {!caseId && (
          <p className="font-mono text-[8px] text-dim mt-1">select a case to enable</p>
        )}
      </div>

      {/* History scrollable area */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        {consoleHistory.isLoading ? (
          <p className="font-mono text-[9px] text-dim">Loading history...</p>
        ) : (
          <PromptHistory turns={turns} onReuse={handleReuse} />
        )}
      </div>

      {/* Template chips + input */}
      <div className="flex-shrink-0 border-t border-subtle px-2 py-2">
        <p className="font-mono text-[8px] text-dim uppercase tracking-widest mb-1">Analyst prompt</p>
        {/* Context toggles */}
        <ContextToggles flags={contextFlags} onChange={setContextFlags} />

        {/* Mode chips */}
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

        {/* Template chips */}
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

        {/* Input row */}
        <div className="flex gap-1.5 mt-2">
          <input
            disabled={!caseId}
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
            disabled={!caseId || submitPrompt.isPending || (!prompt.trim() && !template)}
            onClick={handleSubmit}
            type="button"
            className="bg-accent-green px-2 py-1 rounded font-mono text-[9px] text-white disabled:opacity-40 hover:opacity-80 transition-opacity"
          >
            →
          </button>
        </div>
      </div>
    </aside>
  )
}
