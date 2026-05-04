export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type CaseStatus = 'open' | 'in_progress' | 'closed' | 'false_positive'
export type IOCType = 'ipv4' | 'sha256' | 'domain' | 'url' | 'email'
export type Role = 'analyst' | 'tier2' | 'admin'

export interface TimelineEvent {
  timestamp: string
  actor: string
  action: string
  detail: string
}

export interface IOCRef {
  type: IOCType
  value: string
  score?: number
  label?: string
}

export interface MCPCallRecord {
  id: string
  provider: string
  tool_name: string
  params: Record<string, unknown>
  status: 'completed' | 'failed' | 'running' | string
  duration_ms?: number
  result_summary: Record<string, unknown>
  raw_result: Record<string, unknown>
  created_at: string
  actor: string
}

export interface MCPFinding {
  id: string
  source: string
  title: string
  severity: Severity | 'info' | string
  fields: Record<string, unknown>
  created_at: string
}

export interface ToolCallRecord {
  tool: string
  args: Record<string, unknown>
  result_summary: Record<string, unknown>
}

export type ConsoleSSEEvent =
  | { type: 'tool_call'; tool: string; args: Record<string, unknown>; status: 'running' }
  | { type: 'tool_result'; tool: string; status: 'done' }
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

export interface ConsoleHistoryTurn {
  id: string
  prompt: string
  response: string
  template?: string | null
  context_flags: Record<string, boolean>
  sources_used: string[]
  tool_calls_used: ToolCallRecord[]
  created_at: string
  actor: string
}

export interface MCPState {
  mcp_calls: MCPCallRecord[]
  mcp_findings: MCPFinding[]
}

export interface Case {
  id: string
  case_number: string
  title: string
  description: string
  severity: Severity
  status: CaseStatus
  assigned_to?: string
  mitre_tactics: string[]
  mitre_techniques: string[]
  tags: string[]
  created_at: string
  updated_at: string
  created_by: string
  timeline: TimelineEvent[]
  iocs: IOCRef[]
  mcp_calls: MCPCallRecord[]
  mcp_findings: MCPFinding[]
  console_history: ConsoleHistoryTurn[]
  sla_deadline?: string
  ldap_context?: Record<string, unknown>
  vt_results?: Record<string, unknown>
  abuseipdb_results?: Record<string, unknown>
  parent_case_id?: string
}

export interface CaseListItem {
  id: string
  case_number: string
  title: string
  severity: Severity
  status: CaseStatus
  assigned_to?: string
  created_at: string
  updated_at: string
  ioc_count: number
  sla_deadline?: string
}

export interface User {
  id: string
  email: string
  full_name: string
  role: Role
}
