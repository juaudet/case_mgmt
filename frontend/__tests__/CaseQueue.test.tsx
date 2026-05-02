import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CaseQueue } from '@/components/workspace/CaseQueue'

jest.mock('@/lib/api', () => ({
  useCases: () => ({
    data: [
      { id: '1', case_number: 'CASE-001', title: 'Lateral Movement', severity: 'critical', status: 'open', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ioc_count: 3 },
      { id: '2', case_number: 'CASE-002', title: 'Phishing Attempt',  severity: 'high',     status: 'open', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ioc_count: 1 },
    ]
  }),
  usePlaybooks: () => ({ data: [] }),
}))

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient()
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('CaseQueue', () => {
  it('renders case numbers', () => {
    wrap(<CaseQueue selectedCaseId={null} onSelectCase={jest.fn()} />)
    expect(screen.getByText('CASE-001')).toBeInTheDocument()
    expect(screen.getByText('CASE-002')).toBeInTheDocument()
  })
  it('highlights the selected case', () => {
    wrap(<CaseQueue selectedCaseId="1" onSelectCase={jest.fn()} />)
    const btn = screen.getByText('CASE-001').closest('button')
    expect(btn).toHaveClass('bg-elevated')
  })
  it('calls onSelectCase with case id on click', () => {
    const onSelect = jest.fn()
    wrap(<CaseQueue selectedCaseId={null} onSelectCase={onSelect} />)
    fireEvent.click(screen.getByText('CASE-002').closest('button')!)
    expect(onSelect).toHaveBeenCalledWith('2')
  })
  it('filters cases by search input', () => {
    wrap(<CaseQueue selectedCaseId={null} onSelectCase={jest.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('filter cases...'), { target: { value: 'lateral' } })
    expect(screen.getByText('CASE-001')).toBeInTheDocument()
    expect(screen.queryByText('CASE-002')).not.toBeInTheDocument()
  })
})
