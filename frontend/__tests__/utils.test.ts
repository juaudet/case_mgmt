import { severityColor, statusColor, formatDate, relativeTime } from '@/lib/utils'

describe('severityColor', () => {
  it('returns red classes for critical', () => {
    expect(severityColor('critical')).toContain('red')
  })
  it('returns orange classes for high', () => {
    expect(severityColor('high')).toContain('orange')
  })
  it('returns yellow classes for medium', () => {
    expect(severityColor('medium')).toContain('yellow')
  })
  it('returns blue classes for low', () => {
    expect(severityColor('low')).toContain('blue')
  })
})

describe('statusColor', () => {
  it('returns blue for open', () => {
    expect(statusColor('open')).toContain('blue')
  })
  it('returns amber for in_progress', () => {
    expect(statusColor('in_progress')).toContain('amber')
  })
  it('returns green for closed', () => {
    expect(statusColor('closed')).toContain('green')
  })
})

describe('formatDate', () => {
  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatDate('2024-11-15T08:23:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('relativeTime', () => {
  it('returns minutes for recent timestamps', () => {
    const recent = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(relativeTime(recent)).toMatch(/m ago/)
  })
  it('returns hours for older timestamps', () => {
    const older = new Date(Date.now() - 3 * 3600 * 1000).toISOString()
    expect(relativeTime(older)).toMatch(/h ago/)
  })
})
