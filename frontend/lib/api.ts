import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useState, useCallback } from 'react'
import type { Case, CaseListItem, ConsoleHistoryTurn, MCPState, Playbook } from '@/types'

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
    // List must stay fresh for mock feed / other writers; global staleTime would block interval refetch.
    staleTime: 0,
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
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

export function useMCPState(caseId: string) {
  const headers = useAuthHeaders()
  return useQuery<MCPState>({
    queryKey: ['case', caseId, 'mcp'],
    queryFn: () => apiFetch(`/api/v1/cases/${caseId}/mcp`, headers),
    enabled: !!caseId,
  })
}

export function useRunMCPTool(caseId: string) {
  const headers = useAuthHeaders()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { tool_name: string; params: Record<string, unknown> }) =>
      apiFetch(`/api/v1/cases/${caseId}/mcp/run`, headers, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['case', caseId] })
      qc.invalidateQueries({ queryKey: ['case', caseId, 'mcp'] })
    },
  })
}

export function useConsoleHistory(caseId: string) {
  const headers = useAuthHeaders()
  return useQuery<{ history: ConsoleHistoryTurn[] }>({
    queryKey: ['case', caseId, 'console-history'],
    queryFn: () => apiFetch(`/api/v1/cases/${caseId}/console/history`, headers),
    enabled: !!caseId,
  })
}

async function* _streamConsoleEvents(
  url: string,
  headers: Record<string, string>,
  body: object
): AsyncGenerator<import('@/types').ConsoleSSEEvent> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (!data) continue
      try {
        yield JSON.parse(data) as import('@/types').ConsoleSSEEvent
      } catch {
        // ignore malformed lines
      }
    }
  }
}

export function useStreamConsolePrompt(caseId: string) {
  const headers = useAuthHeaders()
  const qc = useQueryClient()
  const [isPending, setIsPending] = useState(false)
  const [activeToolCall, setActiveToolCall] = useState<string | null>(null)
  const [streamingText, setStreamingText] = useState('')

  const submit = useCallback(
    async (data: { prompt: string; template?: string; context_flags: Record<string, boolean> }) => {
      setIsPending(true)
      setStreamingText('')
      setActiveToolCall(null)
      try {
        const url = `${API_URL}/api/v1/cases/${caseId}/console/stream`
        for await (const event of _streamConsoleEvents(url, headers, data)) {
          if (event.type === 'tool_call') setActiveToolCall(event.tool)
          if (event.type === 'tool_result') setActiveToolCall(null)
          if (event.type === 'delta') setStreamingText((prev) => prev + event.text)
          if (event.type === 'done') {
            qc.invalidateQueries({ queryKey: ['case', caseId, 'console-history'] })
            qc.invalidateQueries({ queryKey: ['case', caseId] })
          }
          if (event.type === 'error') throw new Error(event.message)
        }
      } finally {
        setIsPending(false)
        setActiveToolCall(null)
      }
    },
    [caseId, headers, qc]
  )

  return { submit, isPending, activeToolCall, streamingText }
}

export function useCompletePlaybookStep(caseId: string) {
  const headers = useAuthHeaders()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { stepId: string; resultData: Record<string, unknown> }) =>
      apiFetch(`/api/v1/cases/${caseId}/playbook/step/${data.stepId}/complete`, headers, {
        method: 'POST',
        body: JSON.stringify({ result_data: data.resultData }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['case', caseId] })
    },
  })
}
