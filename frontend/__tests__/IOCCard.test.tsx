import { render, screen } from '@testing-library/react'
import { IOCCard } from '@/components/workspace/IOCCard'
import type { IOCRef } from '@/types'

const maliciousIOC: IOCRef = { type: 'ipv4', value: '185.220.101.47', score: 89 }
const cleanIOC: IOCRef    = { type: 'ipv4', value: '10.0.1.45', score: 2 }
const noScoreIOC: IOCRef  = { type: 'domain', value: 'example.com' }

describe('IOCCard', () => {
  it('renders the IOC value', () => {
    render(<IOCCard ioc={maliciousIOC} />)
    expect(screen.getByText('185.220.101.47')).toBeInTheDocument()
  })
  it('renders the IOC type label', () => {
    render(<IOCCard ioc={maliciousIOC} />)
    expect(screen.getByText('IPV4')).toBeInTheDocument()
  })
  it('renders VT score when present', () => {
    render(<IOCCard ioc={maliciousIOC} />)
    expect(screen.getByText('89/100')).toBeInTheDocument()
  })
  it('renders N/A when no score', () => {
    render(<IOCCard ioc={noScoreIOC} />)
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })
  it('applies malicious styles when score >= 50', () => {
    const { container } = render(<IOCCard ioc={maliciousIOC} />)
    expect(container.firstChild).toHaveClass('border-[#490202]')
  })
  it('applies clean styles when score < 20', () => {
    const { container } = render(<IOCCard ioc={cleanIOC} />)
    expect(container.firstChild).toHaveClass('border-[#1a3a20]')
  })
})
