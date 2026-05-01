# Frontend Restructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the fragmented multi-page frontend into a single unified analyst workspace with a GitHub-dark terminal aesthetic, IOC-first center column, and orchestrated anime.js animations.

**Architecture:** Single `/dashboard` route renders a three-column `WorkspaceClient` (case queue · case detail · AI console). Case selection is URL-driven via `?case=[id]` query param. Dead code (~1,100 lines) is deleted before new components are built.

**Tech Stack:** Next.js 14, React 18, TypeScript, TanStack React Query, Tailwind CSS, anime.js 3.x, Jest + Testing Library.

---

## File Map

### Create
- `frontend/app/dashboard/WorkspaceClient.tsx` — three-column shell, owns URL-driven case selection
- `frontend/components/workspace/CaseQueue.tsx` — left column: list, search, severity filters
- `frontend/components/workspace/CaseOverview.tsx` — center column: header + IOC grid + timeline strip
- `frontend/components/workspace/IOCCard.tsx` — single IOC card with VT score badge + anime.js animations
- `frontend/lib/animations.ts` — anime.js helper functions (orchestration, arc, counter, spring)

### Delete
- `frontend/components/layout/Sidebar.tsx`
- `frontend/components/ui/` (entire directory — 12 files)
- `frontend/lib/store.ts`
- `frontend/app/dashboard/DashboardClient.tsx`
- `frontend/app/cases/[id]/CaseDetailClient.tsx`
- `frontend/app/playbooks/PlaybooksClient.tsx`

### Modify
- `frontend/tailwind.config.ts` — add design tokens + CSS keyframes
- `frontend/app/globals.css` — CSS animations + reduced-motion + scrollbar restyle
- `frontend/app/dashboard/page.tsx` — swap to `WorkspaceClient`
- `frontend/app/cases/page.tsx` — redirect to `/dashboard`
- `frontend/app/cases/[id]/page.tsx` — redirect to `/dashboard?case=[id]`
- `frontend/app/playbooks/page.tsx` — redirect to `/dashboard`
- `frontend/components/layout/TopBar.tsx` — restyle to GitHub dark
- `frontend/components/cases/StatusBadge.tsx` — use design tokens
- `frontend/components/cases/Timeline.tsx` — compact strip variant + critical dot pulse
- `frontend/components/cases/CaseTabbedContent.tsx` — tabs become: Enrichment · Playbook · Raw Logs
- `frontend/components/console/AnalystConsole.tsx` — accept `caseId` prop, restyle
- `frontend/components/playbooks/PlaybookRunner.tsx` — add anime.js progress bar
- `frontend/components/playbooks/StepCard.tsx` — add anime.js checkmark draw
- `frontend/package.json` — add `animejs` + `@types/animejs`
- `frontend/__tests__/CaseCard.test.tsx` — update link href expectation

---

## Task 1: Design Tokens + CSS Animations

**Files:**
- Modify: `frontend/tailwind.config.ts`
- Modify: `frontend/app/globals.css`

- [ ] **Step 1: Replace tailwind.config.ts with design tokens and keyframes**

```typescript
// frontend/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base:     '#0d1117',
        panel:    '#161b22',
        elevated: '#21262d',
        subtle:   '#21262d',
        primary:  '#f0f6fc',
        muted:    '#8b949e',
        dim:      '#6e7681',
        'accent-blue':  '#58a6ff',
        'accent-green': '#238636',
        severity: {
          critical: '#f85149',
          high:     '#f0883e',
          medium:   '#eab308',
          low:      '#3fb950',
        },
        ioc: {
          malicious: { bg: '#1a0505', border: '#490202' },
          suspicious: { bg: '#1a0e00', border: '#4a2500' },
          clean: { bg: '#0d1a10', border: '#1a3a20' },
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      keyframes: {
        criticalPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(248,81,73,0)', borderColor: '#490202' },
          '50%':       { boxShadow: '0 0 8px 3px rgba(248,81,73,0.35)', borderColor: '#f85149' },
        },
        dotPulse: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(248,81,73,0.4)' },
          '50%':       { transform: 'scale(1.4)', boxShadow: '0 0 0 5px rgba(248,81,73,0)' },
        },
      },
      animation: {
        'critical-pulse': 'criticalPulse 2s ease-in-out infinite',
        'dot-pulse':      'dotPulse 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2: Replace globals.css with dark theme + animations + reduced-motion**

```css
/* frontend/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #0d1117;
  --foreground: #f0f6fc;
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: 'Inter', ui-sans-serif, system-ui;
}

/* Scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #0d1117; }
::-webkit-scrollbar-thumb { background: #21262d; border-radius: 2px; }

/* Reduced motion — disable all animations */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

- [ ] **Step 3: Verify Tailwind picks up new tokens**

Run: `cd frontend && npx tailwindcss --content "./app/**/*.tsx" --dry-run 2>&1 | head -5`
Expected: No errors printed.

- [ ] **Step 4: Commit**

```bash
git add frontend/tailwind.config.ts frontend/app/globals.css
git commit -m "style: add GitHub-dark design tokens and CSS animation keyframes"
```

---

## Task 2: Delete Dead Code

**Files:** See list below — all deleted.

- [ ] **Step 1: Delete unused components and store**

```bash
rm frontend/components/layout/Sidebar.tsx
rm frontend/lib/store.ts
rm -rf frontend/components/ui
```

- [ ] **Step 2: Delete page components being replaced**

```bash
rm frontend/app/dashboard/DashboardClient.tsx
rm frontend/app/cases/[id]/CaseDetailClient.tsx
rm frontend/app/playbooks/PlaybooksClient.tsx
```

- [ ] **Step 3: Verify no broken imports remain**

```bash
cd frontend && grep -r "from '@/components/layout/Sidebar'" . --include="*.tsx"
grep -r "from '@/lib/store'" . --include="*.tsx" --include="*.ts"
grep -r "from '@/components/ui/" . --include="*.tsx"
grep -r "DashboardClient\|CaseDetailClient\|PlaybooksClient" . --include="*.tsx"
```
Expected: All return empty (no matches).

- [ ] **Step 4: Commit**

```bash
git add -u
git commit -m "chore: delete unused Sidebar, Radix UI wrappers, Zustand store, and replaced page clients"
```

---

## Task 3: Redirect Old Routes

**Files:**
- Modify: `frontend/app/cases/page.tsx`
- Modify: `frontend/app/cases/[id]/page.tsx`
- Modify: `frontend/app/playbooks/page.tsx`

- [ ] **Step 1: Redirect /cases to /dashboard**

```typescript
// frontend/app/cases/page.tsx
import { redirect } from 'next/navigation'

export default function CasesPage() {
  redirect('/dashboard')
}
```

- [ ] **Step 2: Redirect /cases/[id] to /dashboard?case=[id]**

```typescript
// frontend/app/cases/[id]/page.tsx
import { redirect } from 'next/navigation'

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/dashboard?case=${id}`)
}
```

- [ ] **Step 3: Redirect /playbooks to /dashboard**

```typescript
// frontend/app/playbooks/page.tsx
import { redirect } from 'next/navigation'

export default function PlaybooksPage() {
  redirect('/dashboard')
}
```

- [ ] **Step 4: Update CaseCard link — it linked to /cases/[id], now links to /dashboard?case=[id]**

Open `frontend/components/cases/CaseCard.tsx`. Find the `href` prop. Change:
```tsx
// Before
href={`/cases/${c.id}`}
// After
href={`/dashboard?case=${c.id}`}
```

- [ ] **Step 5: Update CaseCard test to match new href**

```typescript
// frontend/__tests__/CaseCard.test.tsx
// Change the last test:
it('links to workspace with case param', () => {
  render(<CaseCard case={mockCase} />)
  expect(screen.getByRole('link')).toHaveAttribute('href', '/dashboard?case=abc123')
})
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
cd frontend && npx jest __tests__/CaseCard.test.tsx --no-coverage
```
Expected: 5 tests pass.

- [ ] **Step 7: Commit**

```bash
git add frontend/app/cases/page.tsx "frontend/app/cases/[id]/page.tsx" \
  frontend/app/playbooks/page.tsx \
  frontend/components/cases/CaseCard.tsx \
  frontend/__tests__/CaseCard.test.tsx
git commit -m "feat: redirect /cases and /playbooks routes to unified /dashboard workspace"
```

---

## Task 4: IOCCard Component

**Files:**
- Create: `frontend/components/workspace/IOCCard.tsx`
- Create: `frontend/__tests__/IOCCard.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// frontend/__tests__/IOCCard.test.tsx
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npx jest __tests__/IOCCard.test.tsx --no-coverage
```
Expected: FAIL — `Cannot find module '@/components/workspace/IOCCard'`

- [ ] **Step 3: Create the workspace directory and implement IOCCard**

```bash
mkdir -p frontend/components/workspace
```

```typescript
// frontend/components/workspace/IOCCard.tsx
'use client'
import { useRef, useEffect } from 'react'
import type { IOCRef } from '@/types'

function iocSeverity(score?: number): 'malicious' | 'suspicious' | 'clean' | 'unknown' {
  if (score === undefined) return 'unknown'
  if (score >= 50) return 'malicious'
  if (score >= 20) return 'suspicious'
  return 'clean'
}

const CARD_STYLES = {
  malicious:  { card: 'bg-[#1a0505] border-[#490202]', badge: 'bg-severity-critical', dot: 'text-severity-critical' },
  suspicious: { card: 'bg-[#1a0e00] border-[#4a2500]', badge: 'bg-severity-high',     dot: 'text-severity-high' },
  clean:      { card: 'bg-[#0d1a10] border-[#1a3a20]', badge: 'bg-accent-green',       dot: 'text-severity-low' },
  unknown:    { card: 'bg-panel border-subtle',          badge: 'bg-elevated',           dot: 'text-muted' },
}

export function IOCCard({ ioc }: { ioc: IOCRef }) {
  const severity = iocSeverity(ioc.score)
  const styles   = CARD_STYLES[severity]
  const scoreRef = useRef<HTMLSpanElement>(null)
  const arcRef   = useRef<SVGCircleElement>(null)

  // anime.js animations are applied in Task 12
  // refs are attached here so the DOM is ready
  useEffect(() => {
    if (typeof window === 'undefined') return
    // animations wired in animations.ts helpers (Task 12)
  }, [])

  const circ = 2 * Math.PI * 35 // ≈ 219.9

  return (
    <div className={`rounded border ${styles.card} p-2 flex flex-col gap-1`}>
      <div className="flex justify-between items-center">
        <span className="font-mono text-[8px] text-dim tracking-wider">
          {ioc.type.toUpperCase()}
        </span>
        <span
          ref={scoreRef}
          className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${styles.badge}`}
        >
          {ioc.score !== undefined ? `${ioc.score}/100` : 'N/A'}
        </span>
      </div>

      <span className="font-mono text-[10px] text-primary truncate">{ioc.value}</span>

      {ioc.score !== undefined && (
        <svg
          ref={el => { if (el) { const c = el.querySelector('.arc-fill'); if (c) (c as SVGCircleElement & { _arcRef?: boolean })._arcRef = true } }}
          className="w-full"
          height="4"
          viewBox="0 0 100 4"
        >
          <rect width="100" height="4" rx="2" fill="#21262d" />
          <rect
            className="arc-fill"
            width={`${ioc.score}`}
            height="4"
            rx="2"
            fill={severity === 'malicious' ? '#f85149' : severity === 'suspicious' ? '#f0883e' : '#3fb950'}
          />
        </svg>
      )}

      {ioc.label && (
        <span className="text-[8px] text-dim">{ioc.label}</span>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx jest __tests__/IOCCard.test.tsx --no-coverage
```
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/components/workspace/IOCCard.tsx frontend/__tests__/IOCCard.test.tsx
git commit -m "feat: add IOCCard component with severity-coded borders and VT score badge"
```

---

## Task 5: CaseQueue Component

**Files:**
- Create: `frontend/components/workspace/CaseQueue.tsx`
- Create: `frontend/__tests__/CaseQueue.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// frontend/__tests__/CaseQueue.test.tsx
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npx jest __tests__/CaseQueue.test.tsx --no-coverage
```
Expected: FAIL — `Cannot find module '@/components/workspace/CaseQueue'`

- [ ] **Step 3: Implement CaseQueue**

```typescript
// frontend/components/workspace/CaseQueue.tsx
'use client'
import { useState, useRef } from 'react'
import { useCases, usePlaybooks } from '@/lib/api'
import type { CaseListItem } from '@/types'

const SEVERITY_BORDER: Record<string, string> = {
  critical: 'border-l-severity-critical',
  high:     'border-l-severity-high',
  medium:   'border-l-severity-medium',
  low:      'border-l-severity-low',
}
const SEVERITY_TEXT: Record<string, string> = {
  critical: 'text-severity-critical',
  high:     'text-severity-high',
  medium:   'text-severity-medium',
  low:      'text-severity-low',
}

function QueueCard({
  item,
  selected,
  onClick,
  cardRef,
}: {
  item: CaseListItem
  selected: boolean
  onClick: () => void
  cardRef?: React.Ref<HTMLButtonElement>
}) {
  const isCritical = item.severity === 'critical'
  return (
    <button
      ref={cardRef}
      onClick={onClick}
      className={[
        'w-full text-left rounded border border-subtle border-l-2 px-2 py-1.5 mb-1 transition-colors',
        SEVERITY_BORDER[item.severity],
        selected ? 'bg-elevated' : 'bg-panel hover:bg-elevated/60',
        isCritical ? 'animate-critical-pulse' : '',
      ].join(' ')}
    >
      <div className="flex justify-between items-center">
        <span className={`font-mono text-[10px] font-semibold ${selected ? 'text-primary' : 'text-muted'}`}>
          {item.case_number}
        </span>
        <span className={`font-mono text-[8px] uppercase ${SEVERITY_TEXT[item.severity]}`}>
          {item.severity.slice(0, 4)}
        </span>
      </div>
      <p className="text-[9px] text-dim mt-0.5 truncate">{item.title}</p>
    </button>
  )
}

export function CaseQueue({
  selectedCaseId,
  onSelectCase,
}: {
  selectedCaseId: string | null
  onSelectCase: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const { data: cases = [] } = useCases()
  const { data: playbooks = [] } = usePlaybooks()
  const newCardRef = useRef<HTMLButtonElement>(null)

  const filtered = cases.filter(c =>
    c.case_number.toLowerCase().includes(search.toLowerCase()) ||
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <aside className="w-[200px] flex-shrink-0 bg-panel border-r border-subtle flex flex-col overflow-hidden">
      <div className="px-2 pt-2 pb-1 flex-shrink-0">
        <p className="font-mono text-[9px] text-accent-blue tracking-widest mb-2">CASE QUEUE</p>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="filter cases..."
          className="w-full bg-base text-dim font-mono text-[9px] px-2 py-1 rounded border border-subtle outline-none focus:border-accent-blue placeholder:text-dim"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1">
        {filtered.map(c => (
          <QueueCard
            key={c.id}
            item={c}
            selected={c.id === selectedCaseId}
            onClick={() => onSelectCase(c.id)}
            cardRef={c.id === filtered[0]?.id ? newCardRef : undefined}
          />
        ))}
        {filtered.length === 0 && (
          <p className="font-mono text-[9px] text-dim text-center mt-4">no cases match</p>
        )}
      </div>

      {playbooks.length > 0 && (
        <div className="flex-shrink-0 border-t border-subtle px-2 py-2">
          <p className="font-mono text-[9px] text-accent-blue tracking-widest mb-1">PLAYBOOKS</p>
          {playbooks.slice(0, 4).map(pb => (
            <p key={pb.id} className="font-mono text-[9px] text-muted hover:text-accent-blue cursor-pointer mb-0.5 truncate">
              → {pb.name}
            </p>
          ))}
        </div>
      )}
    </aside>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx jest __tests__/CaseQueue.test.tsx --no-coverage
```
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/components/workspace/CaseQueue.tsx frontend/__tests__/CaseQueue.test.tsx
git commit -m "feat: add CaseQueue left column with search, severity borders, and playbook links"
```

---

## Task 6: CaseOverview Component

**Files:**
- Create: `frontend/components/workspace/CaseOverview.tsx`
- Create: `frontend/__tests__/CaseOverview.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// frontend/__tests__/CaseOverview.test.tsx
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CaseOverview } from '@/components/workspace/CaseOverview'
import type { Case } from '@/types'

const mockCase: Partial<Case> = {
  id: 'case-1',
  case_number: 'CASE-001',
  title: 'Lateral Movement',
  severity: 'critical',
  status: 'in_progress',
  assigned_to: 'analyst.kim@corp.local',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
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
  it('shows loading skeleton when isLoading', () => {
    jest.resetModules()
    jest.doMock('@/lib/api', () => ({ useCase: () => ({ data: undefined, isLoading: true }) }))
    // Snapshot test for loading state
    const { container } = wrap(<CaseOverview caseId="case-1" />)
    expect(container.querySelector('[data-loading]')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npx jest __tests__/CaseOverview.test.tsx --no-coverage
```
Expected: FAIL — `Cannot find module '@/components/workspace/CaseOverview'`

- [ ] **Step 3: Implement CaseOverview**

```typescript
// frontend/components/workspace/CaseOverview.tsx
'use client'
import { useRef, useEffect } from 'react'
import { useCase } from '@/lib/api'
import { IOCCard } from './IOCCard'
import { Timeline } from '@/components/cases/Timeline'
import { CaseTabbedContent } from '@/components/cases/CaseTabbedContent'
import { StatusBadge } from '@/components/cases/StatusBadge'

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-[#490202] text-severity-critical',
  high:     'bg-[#4a2500] text-severity-high',
  medium:   'bg-[#3d3200] text-severity-medium',
  low:      'bg-[#0d2a10] text-severity-low',
}

function MetaPill({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
  return (
    <span className="bg-elevated text-[8px] px-2 py-0.5 rounded-full font-mono">
      <span className="text-dim">{label} </span>
      <span className={`text-muted ${valueClass}`}>{value}</span>
    </span>
  )
}

export function CaseOverview({ caseId }: { caseId: string }) {
  const { data: c, isLoading } = useCase(caseId)
  const iocGridRef = useRef<HTMLDivElement>(null)
  const headerRef  = useRef<HTMLDivElement>(null)

  // anime.js orchestration hooked up in Task 13
  useEffect(() => {
    if (!c) return
    // orchestrateCase(headerRef.current, iocGridRef.current) — wired in Task 13
  }, [c?.id])

  if (isLoading || !c) {
    return (
      <div data-loading className="flex-1 p-4 animate-pulse space-y-3">
        <div className="h-10 rounded bg-panel" />
        <div className="h-6 rounded bg-panel w-2/3" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-16 rounded bg-panel" />
          <div className="h-16 rounded bg-panel" />
        </div>
      </div>
    )
  }

  const slaLabel = c.sla_deadline
    ? new Date(c.sla_deadline) > new Date()
      ? `SLA ${Math.round((new Date(c.sla_deadline).getTime() - Date.now()) / 60000)}m left`
      : 'SLA BREACHED'
    : null

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header strip */}
      <div ref={headerRef} className="flex-shrink-0 bg-panel border-b border-subtle px-4 py-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold text-primary">{c.case_number}</span>
            <span className="text-[11px] text-muted">{c.title}</span>
          </div>
          <div className="flex gap-1.5">
            <span className={`font-mono text-[8px] px-1.5 py-0.5 rounded ${SEVERITY_BADGE[c.severity] ?? ''}`}>
              {c.severity.toUpperCase()}
            </span>
            <StatusBadge status={c.status} />
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {c.assigned_to && <MetaPill label="ASSIGNEE" value={c.assigned_to} />}
          {slaLabel && (
            <MetaPill
              label="SLA"
              value={slaLabel}
              valueClass={slaLabel === 'SLA BREACHED' ? 'text-severity-critical' : 'text-severity-high'}
            />
          )}
          {c.mitre_tactics.length > 0 && (
            <MetaPill label="TACTIC" value={c.mitre_tactics[0]} />
          )}
          <MetaPill label="IOCs" value={String(c.iocs.length)} />
        </div>
      </div>

      {/* Body: IOC grid + timeline strip */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center: IOC grid + tabs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {c.iocs.length > 0 && (
            <div className="flex-shrink-0 border-b border-subtle px-3 py-2">
              <p className="font-mono text-[9px] text-accent-blue tracking-widest mb-2">IOC ANALYSIS</p>
              <div ref={iocGridRef} className="grid grid-cols-2 gap-2">
                {c.iocs.map((ioc, i) => (
                  <IOCCard key={`${ioc.value}-${i}`} ioc={ioc} />
                ))}
              </div>
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <CaseTabbedContent case={c} />
          </div>
        </div>

        {/* Right: timeline strip */}
        <div className="w-[160px] flex-shrink-0 border-l border-subtle bg-panel flex flex-col overflow-hidden">
          <p className="font-mono text-[9px] text-accent-blue tracking-widest px-2 pt-2 pb-1 flex-shrink-0">
            TIMELINE
          </p>
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            <Timeline events={c.timeline} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx jest __tests__/CaseOverview.test.tsx --no-coverage
```
Expected: 5 of 6 pass (the loading test may need adjustment — fix any snapshot mismatch by ensuring `data-loading` attr is present on the skeleton div).

- [ ] **Step 5: Commit**

```bash
git add frontend/components/workspace/CaseOverview.tsx frontend/__tests__/CaseOverview.test.tsx
git commit -m "feat: add CaseOverview center column with IOC grid and timeline right strip"
```

---

## Task 7: WorkspaceClient Shell

**Files:**
- Create: `frontend/app/dashboard/WorkspaceClient.tsx`
- Modify: `frontend/app/dashboard/page.tsx`

- [ ] **Step 1: Implement WorkspaceClient**

```typescript
// frontend/app/dashboard/WorkspaceClient.tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { CaseQueue } from '@/components/workspace/CaseQueue'
import { CaseOverview } from '@/components/workspace/CaseOverview'
import { AnalystConsole } from '@/components/console/AnalystConsole'

export function WorkspaceClient() {
  const searchParams    = useSearchParams()
  const router          = useRouter()
  const selectedCaseId  = searchParams.get('case')

  function handleSelectCase(id: string) {
    router.push(`/dashboard?case=${id}`)
  }

  return (
    <div className="flex flex-col h-screen bg-base overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <CaseQueue
          selectedCaseId={selectedCaseId}
          onSelectCase={handleSelectCase}
        />

        <main className="flex-1 flex overflow-hidden border-x border-subtle">
          {selectedCaseId ? (
            <CaseOverview caseId={selectedCaseId} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="font-mono text-[11px] text-dim">
                ← select a case to begin investigation
              </p>
            </div>
          )}
        </main>

        <AnalystConsole caseId={selectedCaseId} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update dashboard page to use WorkspaceClient**

```typescript
// frontend/app/dashboard/page.tsx
import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { WorkspaceClient } from './WorkspaceClient'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-base">
          <div className="w-[200px] bg-panel border-r border-subtle animate-pulse" />
          <div className="flex-1 bg-base animate-pulse" />
          <div className="w-[240px] bg-panel border-l border-subtle animate-pulse" />
        </div>
      }
    >
      <WorkspaceClient />
    </Suspense>
  )
}
```

- [ ] **Step 3: Check AnalystConsole accepts caseId prop**

Open `frontend/components/console/AnalystConsole.tsx`. If it doesn't accept a `caseId?: string | null` prop, add it to the props interface. The console should pass `caseId` to `useConsoleHistory` and `useSubmitConsolePrompt` calls.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/dashboard/WorkspaceClient.tsx frontend/app/dashboard/page.tsx \
  frontend/components/console/AnalystConsole.tsx
git commit -m "feat: implement unified WorkspaceClient three-column analyst workspace"
```

---

## Task 8: Restyle Existing Components

**Files:**
- Modify: `frontend/components/layout/TopBar.tsx`
- Modify: `frontend/components/cases/StatusBadge.tsx`
- Modify: `frontend/components/cases/Timeline.tsx`
- Modify: `frontend/components/cases/CaseTabbedContent.tsx`

- [ ] **Step 1: Restyle TopBar to GitHub dark**

Open `frontend/components/layout/TopBar.tsx`. Replace the render output with:

```tsx
export function TopBar() {
  // keep existing signOut / session logic unchanged
  return (
    <header className="flex-shrink-0 h-10 flex items-center justify-between px-4 bg-base border-b border-subtle">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] text-accent-blue font-semibold tracking-wide">⬡ CASEMGMT</span>
        <CriticalCount />  {/* keep existing critical count logic, just restyle */}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-muted">{session?.user?.email}</span>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="font-mono text-[10px] text-accent-blue hover:text-primary transition-colors"
        >
          logout
        </button>
      </div>
    </header>
  )
}
```

Preserve all existing auth logic (signOut, session). Only update className strings.

- [ ] **Step 2: Restyle StatusBadge to use design tokens**

Open `frontend/components/cases/StatusBadge.tsx`. Replace color maps with token-based classes:

```tsx
const STATUS_STYLES: Record<CaseStatus, string> = {
  open:            'bg-[#1e3a5f] text-accent-blue',
  in_progress:     'bg-[#3d3200] text-severity-medium',
  closed:          'bg-elevated text-muted',
  false_positive:  'bg-elevated text-dim',
}

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: 'bg-[#490202] text-severity-critical',
  high:     'bg-[#4a2500] text-severity-high',
  medium:   'bg-[#3d3200] text-severity-medium',
  low:      'bg-[#0d2a10] text-severity-low',
}
// Apply in render: className={`font-mono text-[8px] px-1.5 py-0.5 rounded ${STYLES[value]}`}
```

- [ ] **Step 3: Add `compact` variant to Timeline for the right strip**

Open `frontend/components/cases/Timeline.tsx`. Add a `compact` boolean prop. When `compact` is true, render a narrower layout:

```tsx
export function Timeline({
  events,
  compact = false,
  selectedIndex,
  onSelectIncident,
}: {
  events: TimelineEvent[]
  compact?: boolean
  selectedIndex?: number | null
  onSelectIncident?: (index: number | null) => void
}) {
```

In the dot render, when `compact` add `animate-dot-pulse` class for critical actions:

```tsx
const isCriticalAction = /alert|critical|lateral|credential|dump/i.test(event.action)
<div
  className={[
    'shrink-0 rounded-full border-2 z-10 mt-0.5',
    isCriticalAction && color === 'red' ? 'animate-dot-pulse' : '',
  ].join(' ')}
  style={{ width: compact ? 8 : 13, height: compact ? 8 : 13, borderColor: dot.border, background: dot.background }}
/>
```

In compact mode, hide `event.detail` and show only timestamp + action label.

- [ ] **Step 4: Update CaseTabbedContent tabs**

Open `frontend/components/cases/CaseTabbedContent.tsx`. The tabs were: Timeline, IOC Analysis, MCP Findings, Analyst Console, Raw Logs.

Remove Timeline tab (now in the right strip) and Analyst Console tab (now in the right column). Rename "MCP Findings" to "Enrichment". Result:

```tsx
const TABS = ['Enrichment', 'Playbook', 'Raw Logs'] as const
type Tab = typeof TABS[number]
```

Restyle tab bar using design tokens:
```tsx
<div className="flex border-b border-subtle bg-panel">
  {TABS.map(t => (
    <button
      key={t}
      onClick={() => setTab(t)}
      className={[
        'font-mono text-[10px] px-3 py-2 border-b-2 transition-colors',
        tab === t
          ? 'text-accent-blue border-accent-blue'
          : 'text-dim border-transparent hover:text-muted',
      ].join(' ')}
    >
      {t}
    </button>
  ))}
</div>
```

Move PlaybookRunner render into the Playbook tab. Move MCP/enrichment content into Enrichment tab. Move raw logs content into Raw Logs tab.

- [ ] **Step 5: Run existing test suite to catch regressions**

```bash
cd frontend && npx jest --no-coverage
```
Expected: All previously passing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add frontend/components/layout/TopBar.tsx \
  frontend/components/cases/StatusBadge.tsx \
  frontend/components/cases/Timeline.tsx \
  frontend/components/cases/CaseTabbedContent.tsx
git commit -m "style: apply GitHub-dark theme to TopBar, StatusBadge, Timeline, and CaseTabbedContent"
```

---

## Task 9: Restyle AnalystConsole

**Files:**
- Modify: `frontend/components/console/AnalystConsole.tsx`

- [ ] **Step 1: Update AnalystConsole to accept caseId and apply dark theme**

Open `frontend/components/console/AnalystConsole.tsx`. Ensure the props interface includes `caseId: string | null`:

```tsx
export function AnalystConsole({ caseId }: { caseId: string | null }) {
```

Pass `caseId` into `useConsoleHistory(caseId ?? '')` and `useSubmitConsolePrompt()`. Guard submit with `if (!caseId) return`.

Restyle the outer wrapper:
```tsx
<aside className="w-[240px] flex-shrink-0 bg-panel border-l border-subtle flex flex-col overflow-hidden">
  <div className="flex-shrink-0 px-3 pt-2 pb-1 border-b border-subtle">
    <p className="font-mono text-[9px] text-accent-blue tracking-widest">AI CONSOLE</p>
    {!caseId && (
      <p className="font-mono text-[8px] text-dim mt-1">select a case to enable</p>
    )}
  </div>
  {/* history scrollable area */}
  <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
    {/* PromptHistory renders here */}
  </div>
  {/* template chips + input */}
  <div className="flex-shrink-0 border-t border-subtle px-2 py-2">
    <ContextToggles ... />
    {/* chips */}
    <div className="flex flex-wrap gap-1 mb-2">
      {TEMPLATES.map(t => (
        <button key={t} className="bg-elevated font-mono text-[8px] text-muted px-1.5 py-0.5 rounded hover:text-primary transition-colors">
          {t}
        </button>
      ))}
    </div>
    {/* input row */}
    <div className="flex gap-1.5">
      <input
        disabled={!caseId}
        className="flex-1 bg-base border border-subtle rounded font-mono text-[9px] text-primary px-2 py-1 outline-none focus:border-accent-blue disabled:opacity-40 placeholder:text-dim"
        placeholder={caseId ? 'ask anything...' : 'no case selected'}
      />
      <button
        disabled={!caseId}
        className="bg-accent-green px-2 py-1 rounded font-mono text-[9px] text-white disabled:opacity-40"
      >
        →
      </button>
    </div>
  </div>
</aside>
```

Keep all existing data-fetching hooks and submit logic — only update className strings and prop interface.

- [ ] **Step 2: Run test suite**

```bash
cd frontend && npx jest --no-coverage
```
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/console/AnalystConsole.tsx
git commit -m "style: restyle AnalystConsole to GitHub-dark and accept caseId prop"
```

---

## Task 10: Install Anime.js

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/lib/animations.ts`

- [ ] **Step 1: Install anime.js**

```bash
cd frontend && npm install animejs && npm install --save-dev @types/animejs
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('./node_modules/animejs/lib/anime.min.js'); console.log('ok')"
```
Expected: prints `ok`

- [ ] **Step 3: Create animations.ts with all anime.js helpers**

```typescript
// frontend/lib/animations.ts
// Only import anime client-side — never on the server
import type AnimeInstance from 'animejs'

async function anime(): Promise<typeof import('animejs').default> {
  const mod = await import('animejs')
  return mod.default ?? (mod as unknown as { default: typeof import('animejs').default }).default
}

/** Counts an element's text content from 0 to `target` */
export async function animateCounter(el: HTMLElement, target: number, duration = 1200) {
  const a = await anime()
  const obj = { val: 0 }
  a({
    targets: obj,
    val: target,
    duration,
    easing: 'easeOutExpo',
    round: 1,
    update: () => { el.textContent = String(Math.floor(obj.val)) },
  })
}

/** Animates a horizontal bar's width from 0 to `pct`% and syncs a label element */
export async function animateProgressBar(
  barEl: HTMLElement,
  labelEl: HTMLElement,
  pct: number,
  duration = 800,
) {
  const a = await anime()
  const obj = { val: 0 }
  a({ targets: barEl, width: [`0%`, `${pct}%`], duration, easing: 'easeOutExpo' })
  a({
    targets: obj,
    val: pct,
    duration,
    easing: 'easeOutExpo',
    round: 1,
    update: () => { labelEl.textContent = `${Math.floor(obj.val)}%` },
  })
}

/** Orchestrates case load: header → meta pills → IOC cards stagger */
export async function orchestrateCaseLoad(
  headerEl: HTMLElement | null,
  iocGridEl: HTMLElement | null,
) {
  if (!headerEl && !iocGridEl) return
  const a = await anime()
  const tl = a.timeline({ easing: 'easeOutExpo' })

  if (headerEl) {
    headerEl.style.opacity = '0'
    headerEl.style.transform = 'translateY(-6px)'
    tl.add({ targets: headerEl, opacity: [0, 1], translateY: [-6, 0], duration: 350 })
  }

  if (iocGridEl) {
    const cards = Array.from(iocGridEl.children) as HTMLElement[]
    cards.forEach(c => { c.style.opacity = '0'; c.style.transform = 'translateX(-10px)' })
    tl.add(
      {
        targets: cards,
        opacity: [0, 1],
        translateX: [-10, 0],
        duration: 300,
        delay: a.stagger(80),
      },
      '-=200',
    )
  }
}

/** Spring entrance for a new queue card */
export async function animateSpringEntrance(el: HTMLElement) {
  const a = await anime()
  el.style.opacity = '0'
  el.style.transform = 'translateY(-20px) scale(0.95)'
  a({
    targets: el,
    opacity: [0, 1],
    translateY: [-20, 0],
    scale: [0.95, 1],
    duration: 600,
    easing: 'spring(1, 80, 10, 0)',
  })
}

/** Draws an SVG polyline checkmark (stroke-dashoffset from full to 0) */
export async function animateCheckmark(polylineEl: SVGPolylineElement) {
  const a = await anime()
  const len = (polylineEl as SVGGeometryElement).getTotalLength?.() ?? 30
  polylineEl.style.strokeDasharray  = String(len)
  polylineEl.style.strokeDashoffset = String(len)
  a({
    targets: polylineEl,
    strokeDashoffset: [len, 0],
    duration: 350,
    easing: 'easeOutCubic',
  })
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/lib/animations.ts
git commit -m "feat: install animejs and create animation helper library"
```

---

## Task 11: IOCCard Anime.js Animations (Counter + Progress Bar)

**Files:**
- Modify: `frontend/components/workspace/IOCCard.tsx`

- [ ] **Step 1: Wire counter and progress bar animations into IOCCard**

Open `frontend/components/workspace/IOCCard.tsx`. Replace the `useEffect` and add refs:

```tsx
'use client'
import { useRef, useEffect } from 'react'
import type { IOCRef } from '@/types'
import { animateCounter } from '@/lib/animations'

// ... (keep iocSeverity, CARD_STYLES unchanged)

export function IOCCard({ ioc }: { ioc: IOCRef }) {
  const severity  = iocSeverity(ioc.score)
  const styles    = CARD_STYLES[severity]
  const scoreRef  = useRef<HTMLSpanElement>(null)
  const barRef    = useRef<HTMLRectElement>(null)  // SVG rect

  useEffect(() => {
    if (ioc.score === undefined) return
    if (scoreRef.current) {
      scoreRef.current.textContent = '0'
      animateCounter(scoreRef.current, ioc.score)
    }
    if (barRef.current) {
      // animate the progress bar width
      import('animejs').then(mod => {
        const a = mod.default
        a({ targets: barRef.current, width: [0, ioc.score!], duration: 1200, easing: 'easeOutExpo' })
      })
    }
  }, [ioc.score])

  return (
    <div className={`rounded border ${styles.card} p-2 flex flex-col gap-1`}>
      <div className="flex justify-between items-center">
        <span className="font-mono text-[8px] text-dim tracking-wider">
          {ioc.type.toUpperCase()}
        </span>
        <span
          ref={scoreRef}
          className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${styles.badge}`}
        >
          {ioc.score !== undefined ? `${ioc.score}/100` : 'N/A'}
        </span>
      </div>

      <span className="font-mono text-[10px] text-primary truncate">{ioc.value}</span>

      {ioc.score !== undefined && (
        <svg className="w-full" height="4" viewBox="0 0 100 4">
          <rect width="100" height="4" rx="2" fill="#21262d" />
          <rect
            ref={barRef as unknown as React.Ref<SVGRectElement>}
            width="0"
            height="4"
            rx="2"
            fill={severity === 'malicious' ? '#f85149' : severity === 'suspicious' ? '#f0883e' : '#3fb950'}
          />
        </svg>
      )}

      {ioc.label && <span className="text-[8px] text-dim">{ioc.label}</span>}
    </div>
  )
}
```

- [ ] **Step 2: Run IOCCard tests to confirm they still pass**

```bash
cd frontend && npx jest __tests__/IOCCard.test.tsx --no-coverage
```
Expected: 6 tests pass. (The counter starts at 0 before effect runs, tests check DOM value which is set in render before the effect.)

- [ ] **Step 3: Commit**

```bash
git add frontend/components/workspace/IOCCard.tsx
git commit -m "feat: animate IOC score counter and threat bar with anime.js on card mount"
```

---

## Task 12: Case Load Orchestration

**Files:**
- Modify: `frontend/components/workspace/CaseOverview.tsx`

- [ ] **Step 1: Wire orchestrateCaseLoad into CaseOverview**

Open `frontend/components/workspace/CaseOverview.tsx`. Update the `useEffect`:

```tsx
import { orchestrateCaseLoad } from '@/lib/animations'

// inside CaseOverview:
useEffect(() => {
  if (!c) return
  orchestrateCaseLoad(headerRef.current, iocGridRef.current)
}, [c?.id])   // fires every time a different case is selected
```

Also add `will-change-transform` to header and IOC grid for GPU acceleration:

```tsx
<div ref={headerRef} className="... will-change-transform" style={{ willChange: 'transform, opacity' }}>
<div ref={iocGridRef} className="... will-change-transform" style={{ willChange: 'transform, opacity' }}>
```

- [ ] **Step 2: Run full test suite**

```bash
cd frontend && npx jest --no-coverage
```
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/workspace/CaseOverview.tsx
git commit -m "feat: orchestrate case load animation — header slides in, IOC cards stagger"
```

---

## Task 13: Queue Spring Entrance + Playbook Animations

**Files:**
- Modify: `frontend/components/workspace/CaseQueue.tsx`
- Modify: `frontend/components/playbooks/PlaybookRunner.tsx`
- Modify: `frontend/components/playbooks/StepCard.tsx`

- [ ] **Step 1: Add spring entrance to first card in CaseQueue on data load**

Open `frontend/components/workspace/CaseQueue.tsx`. Update the data effect:

```tsx
import { animateSpringEntrance } from '@/lib/animations'

// Inside CaseQueue, track previous case count:
const prevCountRef = useRef(0)

useEffect(() => {
  const current = filtered.length
  if (current > prevCountRef.current && newCardRef.current) {
    animateSpringEntrance(newCardRef.current)
  }
  prevCountRef.current = current
}, [filtered.length])
```

- [ ] **Step 2: Add progress bar to PlaybookRunner**

Open `frontend/components/playbooks/PlaybookRunner.tsx`. Add a progress bar below the playbook title. Add refs and wire `animateProgressBar`:

```tsx
import { animateProgressBar } from '@/lib/animations'

// Inside PlaybookRunner, compute completion pct:
const completedCount = playbookState?.completed_steps.length ?? 0
const totalSteps     = playbook?.steps.length ?? 1
const pct            = Math.round((completedCount / totalSteps) * 100)

const barRef   = useRef<HTMLDivElement>(null)
const labelRef = useRef<HTMLSpanElement>(null)

useEffect(() => {
  if (barRef.current && labelRef.current) {
    animateProgressBar(barRef.current, labelRef.current, pct)
  }
}, [pct])

// In render, add above the step list:
<div className="mb-3">
  <div className="flex justify-between items-center mb-1">
    <span className="font-mono text-[9px] text-muted">Progress</span>
    <span ref={labelRef} className="font-mono text-[9px] text-accent-blue font-bold">0%</span>
  </div>
  <div className="h-1 bg-elevated rounded overflow-hidden">
    <div ref={barRef} className="h-1 bg-accent-blue rounded" style={{ width: '0%' }} />
  </div>
</div>
```

- [ ] **Step 3: Add checkmark draw to StepCard on completion**

Open `frontend/components/playbooks/StepCard.tsx`. Add ref to the checkmark SVG polyline:

```tsx
import { useRef, useEffect } from 'react'
import { animateCheckmark } from '@/lib/animations'

// Inside StepCard, when step is completed:
const checkRef = useRef<SVGPolylineElement>(null)

useEffect(() => {
  if (isCompleted && checkRef.current) {
    animateCheckmark(checkRef.current)
  }
}, [isCompleted])

// In the render, for the completed state icon:
<svg viewBox="0 0 12 12" className="w-4 h-4">
  <polyline
    ref={checkRef}
    points="2,6 5,9 10,3"
    stroke="#3fb950"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
  />
</svg>
```

- [ ] **Step 4: Run full test suite**

```bash
cd frontend && npx jest --no-coverage
```
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/components/workspace/CaseQueue.tsx \
  frontend/components/playbooks/PlaybookRunner.tsx \
  frontend/components/playbooks/StepCard.tsx
git commit -m "feat: add spring entrance for new cases, playbook progress bar, and step checkmark animation"
```

---

## Task 14: Final Verification

- [ ] **Step 1: Run the full test suite one last time**

```bash
cd frontend && npx jest --no-coverage
```
Expected: All tests pass. No skipped tests.

- [ ] **Step 2: Verify no dead imports remain**

```bash
cd frontend && grep -r "from '@/lib/store'" . --include="*.ts" --include="*.tsx"
grep -r "from '@/components/ui/" . --include="*.tsx"
grep -r "Sidebar" . --include="*.tsx"
```
Expected: All return empty.

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
cd frontend && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Final commit**

```bash
git add -u
git commit -m "feat: complete frontend restructure — unified analyst workspace with GitHub-dark theme and anime.js animations"
```
