import { render, screen } from '@testing-library/react'
import { CaseCard } from '@/components/cases/CaseCard'
import type { CaseListItem } from '@/types'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>,
}))

const mockCase: CaseListItem = {
  id: 'abc123',
  case_number: 'CASE-2024-0847',
  title: 'Credential Stuffing',
  severity: 'critical',
  status: 'in_progress',
  assigned_to: 'lead.reyes@corp.local',
  created_at: new Date().toISOString(),
  updated_at: new Date(Date.now() - 60000).toISOString(),
  ioc_count: 3,
}

describe('CaseCard', () => {
  it('renders case number', () => {
    render(<CaseCard case={mockCase} />)
    expect(screen.getByText('CASE-2024-0847')).toBeInTheDocument()
  })
  it('renders case title', () => {
    render(<CaseCard case={mockCase} />)
    expect(screen.getByText('Credential Stuffing')).toBeInTheDocument()
  })
  it('renders IOC count', () => {
    render(<CaseCard case={mockCase} />)
    expect(screen.getByText('3 IOCs')).toBeInTheDocument()
  })
  it('links to case detail page', () => {
    render(<CaseCard case={mockCase} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/cases/abc123')
  })
})
