import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PlaybooksClient } from './PlaybooksClient'

export default async function PlaybooksPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return <PlaybooksClient />
}
