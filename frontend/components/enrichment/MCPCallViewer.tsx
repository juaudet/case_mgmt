'use client'
import { useState } from 'react'
import { ChevronDown, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MCPCallViewer({
  toolName,
  data,
}: {
  toolName: string
  data: Record<string, unknown>
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-[#1E3048] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-[#0B1520] hover:bg-[#1A2A3E] transition"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-mono text-blue-400">{toolName}</span>
        </div>
        <ChevronDown
          className={cn('w-4 h-4 text-slate-500 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <pre className="bg-[#1E2A38] text-[#A8D4F5] text-xs p-4 overflow-x-auto font-mono">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}
