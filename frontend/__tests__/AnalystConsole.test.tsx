import { render, screen } from '@testing-library/react'
import { AnalystConsole } from '@/components/console/AnalystConsole'

jest.mock('@/lib/api', () => ({
  useConsoleHistory: () => ({
    data: {
      history: [
        {
          id: 'turn-1',
          prompt: 'What is the likely initial access vector?',
          response: 'Initial access was spearphishing with high confidence.',
          template: null,
          context_flags: { case_details: true },
          sources_used: ['case_details', 'ioc_data'],
          created_at: '2024-11-14T09:54:00Z',
          actor: 'analyst.kim@corp.local',
        },
      ],
    },
    isLoading: false,
  }),
  useSubmitConsolePrompt: () => ({ mutate: jest.fn(), isPending: false }),
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null }),
}))

test('renders persisted analyst console history and prompt controls', () => {
  render(<AnalystConsole caseId="CASE-2024-0847" />)

  expect(screen.getByText('Analyst prompt')).toBeInTheDocument()
  expect(screen.getByText('Attribution analysis')).toBeInTheDocument()
  expect(screen.getByText('What is the likely initial access vector?')).toBeInTheDocument()
  expect(screen.getByText('case_details')).toBeInTheDocument()
})
