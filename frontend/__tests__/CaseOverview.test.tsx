import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CaseOverview } from '@/components/workspace/CaseOverview'
import type { Case } from '@/types'

const mockCase: Case = {
  id: 'case-1',
  case_number: 'CASE-001',
  title: 'Lateral Movement',
  description: 'Suspicious lateral movement detected across internal hosts.',
  severity: 'critical',
  status: 'in_progress',
  assigned_to: 'analyst.kim@corp.local',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'system',
  iocs: [{ type: 'ipv4', value: '185.220.101.47', score: 89 }],
  timeline: [{ timestamp: new Date().toISOString(), actor: 'system', action: 'ALERT_CREATED', detail: 'Alert triggered' }],
  mitre_tactics: [],
  mitre_techniques: [],
  tags: [],
  mcp_calls: [],
  mcp_findings: [],
  console_history: [],
}

jest.mock('@/lib/api', () => ({
  useCase: () => ({ data: mockCase, isLoading: false }),
}))

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient()
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('CaseOverview', () => {
  it('renders case number in header', () => {
    wrap(<CaseOverview caseId="case-1" />)
    expect(screen.getByText('CASE-001')).toBeInTheDocument()
  })
  it('renders case title in header', () => {
    wrap(<CaseOverview caseId="case-1" />)
    expect(screen.getByText('Lateral Movement')).toBeInTheDocument()
  })
  it('renders IOC value', () => {
    wrap(<CaseOverview caseId="case-1" />)
    expect(screen.getByText('185.220.101.47')).toBeInTheDocument()
  })
  it('renders IOC section label', () => {
    wrap(<CaseOverview caseId="case-1" />)
    expect(screen.getByText('IOC ANALYSIS')).toBeInTheDocument()
  })
  it('renders timeline section label', () => {
    wrap(<CaseOverview caseId="case-1" />)
    expect(screen.getByText('TIMELINE')).toBeInTheDocument()
  })
  it('renders IOC count pill', () => {
    wrap(<CaseOverview caseId="case-1" />)
    // MetaPill with label "IOCs" and value "1"
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
