import { render, screen } from '@testing-library/react'
import { SeverityBadge, StatusBadge } from '@/components/cases/StatusBadge'

describe('SeverityBadge', () => {
  it('renders critical badge', () => {
    render(<SeverityBadge severity="critical" />)
    expect(screen.getByText('critical')).toBeInTheDocument()
  })
  it('renders high badge', () => {
    render(<SeverityBadge severity="high" />)
    expect(screen.getByText('high')).toBeInTheDocument()
  })
  it('renders low badge', () => {
    render(<SeverityBadge severity="low" />)
    expect(screen.getByText('low')).toBeInTheDocument()
  })
})

describe('StatusBadge', () => {
  it('renders open status', () => {
    render(<StatusBadge status="open" />)
    expect(screen.getByText('open')).toBeInTheDocument()
  })
  it('renders in_progress as "in progress"', () => {
    render(<StatusBadge status="in_progress" />)
    expect(screen.getByText('in progress')).toBeInTheDocument()
  })
})
