import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PlaybookPageClient } from './PlaybookPageClient'

export default async function PlaybookPage({
  params,
}: {
  params: { id: string; pbId: string }
}) {
  const session = await auth()
  if (!session) redirect('/login')
  return <PlaybookPageClient caseId={params.id} playbookId={params.pbId} />
}
