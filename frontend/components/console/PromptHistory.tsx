'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Turn {
  prompt: string
  response: string
  timestamp: string
}

export function PromptHistory({ turns }: { turns: Turn[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  if (!turns.length) return null

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">History ({turns.length})</p>
      {turns.map((turn, i) => (
        <div key={i} className="border border-[#1E3048] rounded-lg overflow-hidden">
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#162030] hover:bg-[#1A2A3E] transition text-left"
          >
            <span className="text-xs text-slate-300 truncate flex-1">{turn.prompt}</span>
            <span className="text-xs text-slate-600 ml-2 shrink-0">
              {formatDate(turn.timestamp)}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-500 ml-2 transition-transform ${
                openIdx === i ? 'rotate-180' : ''
              }`}
            />
          </button>
          {openIdx === i && (
            <div className="bg-[#1E2A38] text-xs text-slate-300 p-3 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
              {turn.response}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
