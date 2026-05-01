import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import type { Case, CaseListItem, Playbook } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function useAuthHeaders() {
  const { data: session } = useSession()
  return { Authorization: `Bearer ${session?.user?.accessToken ?? ''}` }
}

async function apiFetch<T>(
  url: string,
  headers: Record<string, string>,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...headers, ...options?.headers },
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export function useCases(params?: { status?: string; severity?: string }) {
  const headers = useAuthHeaders()
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.severity) searchParams.set('severity', params.severity)
  return useQuery<CaseListItem[]>({
    queryKey: ['cases', params],
    queryFn: () => apiFetch(`/api/v1/cases?${searchParams}`, headers),
  })
}

export function useCase(id: string) {
  const headers = useAuthHeaders()
  return useQuery<Case>({
    queryKey: ['case', id],
    queryFn: () => apiFetch(`/api/v1/cases/${id}`, headers),
    enabled: !!id,
  })
}

export function useCreateCase() {
  const headers = useAuthHeaders()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Case>) =>
      apiFetch('/api/v1/cases', headers, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cases'] }),
  })
}

export function useUpdateCase(id: string) {
  const headers = useAuthHeaders()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Case>) =>
      apiFetch(`/api/v1/cases/${id}`, headers, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['case', id] })
      qc.invalidateQueries({ queryKey: ['cases'] })
    },
  })
}

export function usePlaybooks() {
  const headers = useAuthHeaders()
  return useQuery<Playbook[]>({
    queryKey: ['playbooks'],
    queryFn: () => apiFetch('/api/v1/playbooks', headers),
  })
}

export function usePlaybook(id: string) {
  const headers = useAuthHeaders()
  return useQuery<Playbook>({
    queryKey: ['playbook', id],
    queryFn: () => apiFetch(`/api/v1/playbooks/${id}`, headers),
    enabled: !!id,
  })
}

export function useEnrichIOC(caseId: string) {
  const headers = useAuthHeaders()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { type: string; value: string }) =>
      apiFetch(`/api/v1/cases/${caseId}/enrich/ioc`, headers, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['case', caseId] }),
  })
}
