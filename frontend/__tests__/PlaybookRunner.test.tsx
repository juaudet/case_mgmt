import { render, screen } from '@testing-library/react'
import { PlaybookRunner } from '@/components/playbooks/PlaybookRunner'
import type { Case, Playbook, PlaybookStep } from '@/types'

const steps: PlaybookStep[] = [
  {
    step_id: 'identify-account',
    title: 'Identify affected account',
    description: 'Confirm the principal account and blast radius.',
    auto: false,
    mcp_tools: ['ldap_user_lookup'],
    branches: [],
    mitre_technique: 'T1078',
  },
  {
    step_id: 'collect-auth-events',
    title: 'Collect authentication events',
    description: 'Pull recent authentication activity.',
    auto: false,
    mcp_tools: [],
    branches: [],
  },
  {
    step_id: 'review-iocs',
    title: 'Review suspicious IOCs',
    description: 'Review known indicators associated with the alert.',
    auto: false,
    mcp_tools: [],
    branches: [],
  },
  {
    step_id: 'scope-hosts',
    title: 'Scope affected hosts',
    description: 'Identify impacted hosts and sessions.',
    auto: false,
    mcp_tools: [],
    branches: [],
  },
]

const caseData: Case = {
  id: 'case-id',
  case_number: 'CASE-2026-0001',
  title: 'Suspicious credential activity',
  description: 'Demo case',
  severity: 'high',
  status: 'in_progress',
  assigned_to: 'analyst.kim@corp.local',
  mitre_tactics: ['Credential Access'],
  mitre_techniques: ['T1078'],
  tags: [],
  created_at: '2026-04-30T10:00:00Z',
  updated_at: '2026-04-30T10:05:00Z',
  created_by: 'analyst.kim@corp.local',
  timeline: [],
  iocs: [],
  mcp_calls: [],
  mcp_findings: [],
  console_history: [],
  playbook_id: 'pb-credential-triage',
  playbook_state: {
    playbook_id: 'pb-credential-triage',
    current_step_id: 'collect-auth-events',
    completed_steps: ['identify-account'],
    step_results: {},
    started_at: '2026-04-30T10:01:00Z',
  },
}

const playbook: Playbook = {
  id: 'pb-credential-triage',
  name: 'Credential Triage',
  description: 'Triage suspected credential compromise.',
  mitre_tactics: ['Credential Access'],
  steps,
}

test('renders phase progress for playbook steps', () => {
  render(<PlaybookRunner playbook={playbook} caseData={caseData} onStepComplete={jest.fn()} />)

  expect(screen.getByText('Phase 1 — Initial triage & scoping')).toBeInTheDocument()
  expect(screen.getByText('1 / 4')).toBeInTheDocument()
  expect(screen.getByText('Identify affected account')).toBeInTheDocument()
})
