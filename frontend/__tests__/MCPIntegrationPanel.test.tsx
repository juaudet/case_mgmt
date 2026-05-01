import { render, screen } from '@testing-library/react'
import { MCPIntegrationPanel } from '@/components/enrichment/MCPIntegrationPanel'
import type { Case } from '@/types'

jest.mock('@/lib/api', () => ({
  useRunMCPTool: () => ({ mutate: jest.fn(), isPending: false }),
}))

const caseData = {
  id: 'case-id',
  case_number: 'CASE-2024-0847',
  title: 'Suspected credential stuffing and lateral movement — finance domain',
  description: 'Demo',
  severity: 'critical',
  status: 'in_progress',
  assigned_to: 'analyst.kim@corp.local',
  mitre_tactics: ['Credential Access', 'Lateral Movement'],
  mitre_techniques: ['T1078', 'T1550.002'],
  tags: [],
  created_at: '2024-11-14T09:41:00Z',
  updated_at: '2024-11-14T10:14:02Z',
  created_by: 'analyst.kim@corp.local',
  timeline: [],
  iocs: [
    { type: 'ipv4', value: '185.220.101.47', score: 92, label: 'malicious C2' },
    { type: 'sha256', value: 'a3f1c9b2e847d6f0391cc52a4e1b7f3d', score: 78, label: 'Mimikatz' },
    { type: 'domain', value: 'corp-mail-auth.ru', score: 88, label: 'EvilProxy' },
  ],
  mcp_calls: [
    {
      id: 'call-1',
      provider: 'VirusTotal',
      tool_name: 'vt_ip_report',
      params: { ip: '185.220.101.47' },
      status: 'completed',
      duration_ms: 842,
      result_summary: { malicious: 47 },
      raw_result: {},
      created_at: '2024-11-14T10:13:44Z',
      actor: 'analyst.kim@corp.local',
    },
  ],
  mcp_findings: [
    {
      id: 'finding-1',
      source: 'VirusTotal',
      title: 'IP + hash confirmed malicious',
      severity: 'critical',
      fields: { detections: '47 / 94 engines' },
      created_at: '2024-11-14T10:14:02Z',
    },
  ],
  console_history: [],
} satisfies Case

test('renders MCP integration cards and findings', () => {
  render(<MCPIntegrationPanel caseData={caseData} caseId="case-id" />)
  expect(screen.getByText('MCP integration layer — connected tools')).toBeInTheDocument()
  expect(screen.getAllByText('VirusTotal').length).toBeGreaterThan(0)
  expect(screen.getByText('IP + hash confirmed malicious')).toBeInTheDocument()
  expect(screen.getByText('Run vt_ip_report ↗')).toBeInTheDocument()
})
