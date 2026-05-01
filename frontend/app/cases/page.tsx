import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { CaseList } from '@/components/cases/CaseList'

export default async function CasesPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return (
    <AppShell title="Cases">
      <CaseList />
    </AppShell>
  )
}
