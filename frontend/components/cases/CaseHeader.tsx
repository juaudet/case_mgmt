'use client'
import Link from 'next/link'
import type { Case, CaseStatus } from '@/types'
import { SeverityBadge, StatusBadge } from './StatusBadge'
import { useUpdateCase } from '@/lib/api'
import { formatDate } from '@/lib/utils'

const STATUS_OPTIONS: CaseStatus[] = ['open', 'in_progress', 'closed', 'false_positive']

function ActionBtn({
  children,
  danger,
  href,
  onClick,
}: {
  children: React.ReactNode
  danger?: boolean
  href?: string
  onClick?: () => void
}) {
  const className = "text-[12px] font-semibold px-3.5 py-2 rounded-md border transition-colors"
  const style = danger
    ? {
        borderColor: '#F09595',
        background: 'rgba(226,75,74,0.1)',
        color: '#E24B4A',
      }
    : {
        borderColor: '#2C4664',
        background: '#1A3A5C',
        color: '#D7ECFF',
      }

  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {children}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      className={className}
      style={style}
    >
      {children}
    </button>
  )
}

export function CaseHeader({ caseData }: { caseData: Case }) {
  const updateCase = useUpdateCase(caseData.id)

  function handleStatus(status: CaseStatus) {
    updateCase.mutate({ status })
  }

  const mitrePrimary = caseData.mitre_techniques[0] ?? caseData.mitre_tactics[0] ?? ''

  return (
    <div
      className="border-b px-5 py-3.5 shrink-0"
      style={{ background: '#0F1923', borderColor: '#1E3048' }}
    >
      {/* ID + title row */}
      <div className="mb-2">
        <div
          className="text-[11px] font-mono mb-0.5"
          style={{ color: '#4A6080' }}
        >
          {caseData.case_number}
          {mitrePrimary && (
            <span>
              {' '}
              &nbsp;·&nbsp; {mitrePrimary}
            </span>
          )}
        </div>
        <div className="text-[15px] font-medium text-white leading-snug">
          {caseData.title}
        </div>
      </div>

      {/* Badge row */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
        <SeverityBadge severity={caseData.severity} />
        <StatusBadge status={caseData.status} />
        {caseData.mitre_tactics.map((t) => (
          <span
            key={t}
            className="text-[11px] font-medium px-2 py-0.5 rounded"
            style={{ background: '#1A3A5C', color: '#7AB8F5' }}
          >
            {t}
          </span>
        ))}
        {caseData.assigned_to && (
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded"
            style={{ background: '#162030', color: '#7A9BB5', border: '0.5px solid #1E3048' }}
          >
            Assigned: {caseData.assigned_to}
          </span>
        )}
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded"
          style={{ background: '#162030', color: '#7A9BB5', border: '0.5px solid #1E3048' }}
        >
          Created {formatDate(caseData.created_at)}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <ActionBtn>↑ Escalate</ActionBtn>
        <ActionBtn>⊞ Summary</ActionBtn>
        <ActionBtn danger onClick={() => handleStatus('false_positive')}>
          ⊘ False Positive
        </ActionBtn>
        {/* Hidden status select for full control */}
        <select
          value={caseData.status}
          onChange={(e) => handleStatus(e.target.value as CaseStatus)}
          disabled={updateCase.isPending}
          className="ml-1 text-[11px] rounded border px-2 py-2 focus:outline-none disabled:opacity-50"
          style={{
            background: '#162030',
            borderColor: '#1E3048',
            color: '#7A9BB5',
          }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
