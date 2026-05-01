'use client'
import type { PlaybookBranch } from '@/types'
import { GitBranch, ChevronRight } from 'lucide-react'

interface BranchDecisionProps {
  branches: PlaybookBranch[]
  conditionField?: string
  onSelect: (branch: PlaybookBranch) => void
}

export function BranchDecision({ branches, conditionField, onSelect }: BranchDecisionProps) {
  if (branches.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <GitBranch className="w-3.5 h-3.5 text-blue-400" />
        <p className="text-xs text-slate-400">
          {conditionField ? `Branch on: ${conditionField}` : 'Select next step'}
        </p>
      </div>
      <div className="space-y-1.5">
        {branches.map((branch) => (
          <button
            key={branch.when}
            onClick={() => onSelect(branch)}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#0F1923] border border-[#1E3048] rounded-lg hover:border-blue-700 hover:bg-[#1A2A3E] transition text-left group"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-blue-400 bg-[#1A3A5C] px-1.5 py-0.5 rounded">
                {branch.when}
              </span>
              <span className="text-xs text-slate-300">{branch.label}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition" />
          </button>
        ))}
      </div>
    </div>
  )
}
