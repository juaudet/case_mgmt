'use client'
import { useCase } from '@/lib/api'
import { AppShell } from '@/components/layout/AppShell'
import { CaseHeader } from '@/components/cases/CaseHeader'
import { CaseTabbedContent } from '@/components/cases/CaseTabbedContent'
import { CaseRightPane } from '@/components/cases/CaseRightPane'

export function CaseDetailClient({ id }: { id: string }) {
  const { data: caseData, isLoading } = useCase(id)

  if (isLoading) {
    return (
      <AppShell noPadding>
        <div className="p-6 space-y-4 animate-pulse">
          <div className="h-20 rounded" style={{ background: '#162030' }} />
          <div className="h-64 rounded" style={{ background: '#162030' }} />
        </div>
      </AppShell>
    )
  }

  if (!caseData) {
    return (
      <AppShell noPadding>
        <p className="p-6 text-[13px]" style={{ color: '#4A6080' }}>
          Case not found.
        </p>
      </AppShell>
    )
  }

  return (
    <AppShell noPadding>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Full-width case header */}
        <CaseHeader caseData={caseData} />

        {/* Body: tabbed center + right pane */}
        <div className="flex flex-1 overflow-hidden">
          <CaseTabbedContent caseData={caseData} />
          <CaseRightPane caseData={caseData} caseId={id} />
        </div>
      </div>
    </AppShell>
  )
}
