import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CaseDetailClient } from './CaseDetailClient'

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) redirect('/login')
  return <CaseDetailClient id={params.id} />
}
