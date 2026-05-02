'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { CaseQueue } from '@/components/workspace/CaseQueue'
import { CaseOverview } from '@/components/workspace/CaseOverview'
import { AnalystConsole } from '@/components/console/AnalystConsole'

export function WorkspaceClient() {
  const searchParams    = useSearchParams()
  const router          = useRouter()
  const selectedCaseId  = searchParams.get('case')

  function handleSelectCase(id: string) {
    router.push(`/dashboard?case=${id}`)
  }

  return (
    <div className="flex flex-col h-screen bg-base overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <CaseQueue
          selectedCaseId={selectedCaseId}
          onSelectCase={handleSelectCase}
        />

        <main className="flex-1 flex overflow-hidden border-x border-subtle">
          {selectedCaseId ? (
            <CaseOverview caseId={selectedCaseId} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="font-mono text-[11px] text-dim">
                ← select a case to begin investigation
              </p>
            </div>
          )}
        </main>

        <AnalystConsole caseId={selectedCaseId} />
      </div>
    </div>
  )
}
