'use client'
import type { Case, CaseStatus } from '@/types'
import { SeverityBadge, StatusBadge } from './StatusBadge'
import { useUpdateCase } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Clock, Shield, User } from 'lucide-react'

const STATUS_OPTIONS: CaseStatus[] = ['open', 'in_progress', 'closed', 'false_positive']

export function CaseHeader({ caseData }: { caseData: Case }) {
  const updateCase = useUpdateCase(caseData.id)

  function handleStatusChange(status: CaseStatus) {
    updateCase.mutate({ status })
  }

  return (
    <div className="bg-[#162030] border border-[#1E3048] rounded-xl p-5 space-y-4">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-blue-400">{caseData.case_number}</span>
            <SeverityBadge severity={caseData.severity} />
          </div>
          <h1 className="text-xl font-bold text-white">{caseData.title}</h1>
        </div>

        {/* Status updater */}
        <div className="shrink-0">
          <select
            value={caseData.status}
            onChange={(e) => handleStatusChange(e.target.value as CaseStatus)}
            disabled={updateCase.isPending}
            className="bg-[#0F1923] border border-[#1E3048] rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-slate-400">{caseData.description}</p>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
        {caseData.assigned_to && (
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {caseData.assigned_to}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Created {formatDate(caseData.created_at)}
        </div>
        {caseData.sla_deadline && (
          <div className="flex items-center gap-1.5 text-amber-400">
            <Shield className="w-3.5 h-3.5" />
            SLA: {formatDate(caseData.sla_deadline)}
          </div>
        )}
        <StatusBadge status={caseData.status} />
      </div>

      {/* MITRE tags */}
      {(caseData.mitre_tactics.length > 0 || caseData.mitre_techniques.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {caseData.mitre_tactics.map((t) => (
            <span key={t} className="px-2 py-0.5 bg-red-900/30 text-red-300 text-xs rounded font-mono border border-red-900/50">
              {t}
            </span>
          ))}
          {caseData.mitre_techniques.map((t) => (
            <span key={t} className="px-2 py-0.5 bg-[#1A3A5C] text-blue-300 text-xs rounded font-mono">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
