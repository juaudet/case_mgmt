'use client'
import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Send, Cpu } from 'lucide-react'
import { ContextToggles } from './ContextToggles'
import { PromptHistory } from './PromptHistory'

const TEMPLATES = [
  { key: 'attribution', label: 'Attribution Analysis' },
  { key: 'exfil', label: 'Exfil Scope Check' },
  { key: 'blast_radius', label: 'Blast Radius' },
  { key: 'hunt_iocs', label: 'Hunt New IOCs' },
  { key: 'exec_summary', label: 'Exec Summary' },
  { key: 'remediation', label: 'Remediation Steps' },
  { key: 'timeline', label: 'Reconstruct Timeline' },
]

interface ConsoleTurn {
  prompt: string
  response: string
  template?: string
  timestamp: string
}

export function AnalystConsole({ caseId }: { caseId: string }) {
  const { data: session } = useSession()
  const [prompt, setPrompt] = useState('')
  const [template, setTemplate] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [currentResponse, setCurrentResponse] = useState('')
  const [history, setHistory] = useState<ConsoleTurn[]>([])
  const [contextFlags, setContextFlags] = useState({
    case_details: true,
    ldap: true,
    ioc_data: true,
    virustotal: false,
    crowdstrike: false,
    playbook_state: true,
  })
  const responseRef = useRef<HTMLDivElement>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  async function handleSubmit() {
    if (!prompt.trim() && !template) return
    setStreaming(true)
    setCurrentResponse('')
    let full = ''

    try {
      const res = await fetch(`${API_URL}/api/v1/cases/${caseId}/console/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.user?.accessToken ?? ''}`,
        },
        body: JSON.stringify({
          prompt,
          template: template || undefined,
          context_flags: contextFlags,
        }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.delta) {
                full += data.delta
                setCurrentResponse(full)
                responseRef.current?.scrollIntoView({ behavior: 'smooth' })
              }
            } catch {
              // skip malformed SSE lines
            }
          }
        }
      }
    } finally {
      setStreaming(false)
      if (full) {
        setHistory((h) => [
          {
            prompt: template ? `[Template: ${template}]` : prompt,
            response: full,
            template,
            timestamp: new Date().toISOString(),
          },
          ...h,
        ])
        setCurrentResponse('')
        setPrompt('')
        setTemplate('')
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Cpu className="w-4 h-4 text-blue-400" />
        <h2 className="text-sm font-semibold text-white">Analyst AI Console</h2>
        <span className="text-xs text-slate-500 ml-auto">claude-sonnet-4-6</span>
      </div>

      <ContextToggles flags={contextFlags} onChange={setContextFlags} />

      {/* Template selector */}
      <div>
        <label className="text-xs text-slate-500 block mb-1">Prompt Template</label>
        <select
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          className="w-full bg-[#162030] border border-[#1E3048] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none"
        >
          <option value="">Custom prompt...</option>
          {TEMPLATES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Custom prompt textarea */}
      {!template && (
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask about this case..."
          rows={3}
          className="w-full bg-[#162030] border border-[#1E3048] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
        />
      )}

      <button
        onClick={handleSubmit}
        disabled={streaming || (!prompt.trim() && !template)}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1A3A5C] hover:bg-[#2A5A8C] disabled:opacity-50 text-white text-sm rounded-lg transition"
      >
        <Send className="w-3.5 h-3.5" />
        {streaming ? 'Streaming...' : 'Send'}
      </button>

      {/* Streaming response */}
      {(streaming || currentResponse) && (
        <div className="bg-[#1E2A38] border border-[#2A3A4E] rounded-lg p-4 text-xs text-slate-200 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
          {currentResponse}
          {streaming && <span className="animate-pulse text-blue-400">▊</span>}
          <div ref={responseRef} />
        </div>
      )}

      <PromptHistory turns={history} />
    </div>
  )
}
