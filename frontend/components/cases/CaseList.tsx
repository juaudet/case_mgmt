'use client'
import { useState } from 'react'
import { useCases } from '@/lib/api'
import { CaseCard } from './CaseCard'
import { Search } from 'lucide-react'

export function CaseList() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  const {
    data: cases,
    isLoading,
    error,
  } = useCases({
    status: statusFilter || undefined,
    severity: severityFilter || undefined,
  })

  const filtered =
    cases?.filter(
      (c) =>
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.case_number.includes(search)
    ) ?? []

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cases..."
            className="w-full bg-[#162030] border border-[#1E3048] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#162030] border border-[#1E3048] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
          <option value="false_positive">False Positive</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-[#162030] border border-[#1E3048] rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none"
        >
          <option value="">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <p className="text-xs text-slate-500">{filtered.length} cases</p>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-[#162030] border border-[#1E3048] rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}
      {error && <p className="text-sm text-red-400">Failed to load cases</p>}
      {!isLoading && filtered.map((c) => <CaseCard key={c.id} case={c} />)}
      {!isLoading && filtered.length === 0 && !error && (
        <div className="text-center py-12 text-slate-500 text-sm">No cases found</div>
      )}
    </div>
  )
}
