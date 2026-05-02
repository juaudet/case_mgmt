'use client'
import { useState } from 'react'
import { Send, Sparkles, Trash2 } from 'lucide-react'
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
  crowdstrike: false,
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
    <div className="flex flex-col gap-5 text-[#F4F1E8]">
      <div className="rounded-2xl border border-[#2D2D2A] bg-[#171714] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#97C459]">Analyst AI console</p>
            <h2 className="mt-2 text-2xl font-semibold">Analyst AI console — {caseId}</h2>
          </div>
          <span className="rounded-full border border-[#464641] bg-[#22221F] px-3 py-1 text-xs text-[#C9C3B4]">
            Persisted history enabled
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {activeContextLabels.map((label) => (
          <span
            key={label}
            className="rounded-full border border-[#97C459] bg-[#DFF0CC] px-3 py-1 text-xs font-medium text-[#3B6D11]"
          >
            Context injected: {label}
          </span>
        ))}
      </div>

      <section className="rounded-2xl border border-[#2D2D2A] bg-[#171714] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#9B9A92]">Analyst prompt</p>
            <h3 className="mt-1 text-lg font-semibold">Ask the case copilot</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {MODES.map((modeLabel) => (
              <button
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  mode === modeLabel
                    ? 'border-[#97C459] bg-[#DFF0CC] text-[#3B6D11]'
                    : 'border-[#464641] bg-[#2D2D2A] text-[#9B9A92]'
                }`}
                key={modeLabel}
                onClick={() => setMode(modeLabel)}
                type="button"
              >
                {modeLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {TEMPLATES.map((item) => (
            <button
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                template === item.key
                  ? 'border-[#97C459] bg-[#DFF0CC] text-[#3B6D11]'
                  : 'border-[#464641] bg-[#2D2D2A] text-[#C9C3B4] hover:border-[#686862]'
              }`}
              key={item.label}
              onClick={() => setTemplate(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask about initial access, lateral movement, blast radius, or response actions..."
          rows={3}
          className="mt-5 w-full resize-none rounded-2xl border border-[#464641] bg-[#22221F] px-4 py-3 text-sm text-[#F4F1E8] placeholder-[#77766F] outline-none transition focus:border-[#97C459]"
        />

        <div className="mt-2 flex justify-between text-xs text-[#9B9A92]">
          <span>{template ? `Template: ${template}` : 'Template: custom'}</span>
          <span>{prompt.length} characters</span>
        </div>

        <div className="mt-5">
          <ContextToggles flags={contextFlags} onChange={setContextFlags} />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-full border border-[#464641] bg-[#2D2D2A] px-4 py-2 text-sm font-medium text-[#C9C3B4] transition hover:border-[#686862]"
            onClick={handleClear}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full bg-[#DFF0CC] px-5 py-2 text-sm font-semibold text-[#3B6D11] transition hover:bg-[#CFE8B5] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={submitPrompt.isPending || (!prompt.trim() && !template)}
            onClick={handleSubmit}
            type="button"
          >
            {submitPrompt.isPending ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
            {submitPrompt.isPending ? 'Submitting...' : 'Submit prompt'}
          </button>
        </div>
      </section>

      {consoleHistory.isLoading ? (
        <div className="rounded-2xl border border-[#2D2D2A] bg-[#171714] p-5 text-sm text-[#9B9A92]">
          Loading persisted prompt history...
        </div>
      ) : (
        <PromptHistory turns={turns} onReuse={handleReuse} />
      )}
    </div>
  )
}
