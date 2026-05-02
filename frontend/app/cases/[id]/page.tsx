import { redirect } from 'next/navigation'

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  redirect(`/dashboard?case=${params.id}`)
}
