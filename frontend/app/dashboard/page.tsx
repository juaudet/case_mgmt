import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { WorkspaceClient } from './WorkspaceClient'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-base">
          <div className="w-[200px] bg-panel border-r border-subtle animate-pulse" />
          <div className="flex-1 bg-base animate-pulse" />
          <div className="w-[240px] bg-panel border-l border-subtle animate-pulse" />
        </div>
      }
    >
      <WorkspaceClient />
    </Suspense>
  )
}
