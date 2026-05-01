'use client'
import { useState } from 'react'
import type { PlaybookStep } from '@/types'
import { CheckCircle, Circle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepCardProps {
  step: PlaybookStep
  isDone: boolean
  isCurrent: boolean
  onComplete: (data: Record<string, unknown>) => void
}

export function StepCard({ step, isDone, isCurrent, onComplete }: StepCardProps) {
  const [expanded, setExpanded] = useState(isCurrent)
  const [resultInput, setResultInput] = useState('')

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition',
        isDone
          ? 'border-green-900/50 bg-green-900/10'
          : isCurrent
          ? 'border-blue-700 bg-[#1A2A3E]'
          : 'border-[#1E3048] bg-[#162030]'
      )}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        {isDone ? (
          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
        ) : (
          <Circle className="w-4 h-4 text-slate-500 shrink-0" />
        )}
        <span
          className={cn(
            'text-sm flex-1',
            isDone
              ? 'text-slate-400 line-through'
              : isCurrent
              ? 'text-white font-medium'
              : 'text-slate-400'
          )}
        >
          {step.title}
        </span>
        {step.mitre_technique && (
          <span className="text-xs font-mono text-slate-500">{step.mitre_technique}</span>
        )}
        <ChevronRight
          className={cn('w-4 h-4 text-slate-500 transition-transform', expanded && 'rotate-90')}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-slate-400">{step.description}</p>
          {step.mcp_tools.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {step.mcp_tools.map((tool) => (
                <span
                  key={tool}
                  className="px-2 py-0.5 bg-[#1A3A5C] text-blue-300 text-xs rounded font-mono"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}
          {isCurrent && !isDone && (
            <div className="space-y-2">
              {step.condition_field && (
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    {step.condition_field}
                  </label>
                  <input
                    value={resultInput}
                    onChange={(e) => setResultInput(e.target.value)}
                    className="w-full bg-[#0F1923] border border-[#1E3048] rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder={`Enter ${step.condition_field}`}
                  />
                </div>
              )}
              <button
                onClick={() =>
                  onComplete(step.condition_field ? { [step.condition_field]: resultInput } : {})
                }
                className="px-4 py-1.5 bg-[#1A3A5C] hover:bg-[#2A5A8C] text-white text-xs rounded transition"
              >
                Mark Complete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
