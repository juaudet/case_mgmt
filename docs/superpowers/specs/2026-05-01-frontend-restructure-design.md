# Frontend Restructure — Design Spec
**Date:** 2026-05-01  
**Status:** Approved  
**Context:** Take-home project for a cybersecurity/SWE role. Reviewer will evaluate both engineering craft and SOC domain knowledge.

---

## Problem

The current frontend has two compounding issues:
1. **Fragmented layout** — the analyst loop (triage → enrich → playbook → console) spans multiple disconnected pages, requiring full navigations mid-investigation.
2. **Unfinished UI** — ~1,100 lines of dead scaffolding (unused Sidebar, 12 Radix UI wrappers, Zustand store) and inconsistent styling signal an incomplete project.

The goal is a unified analyst workspace where the full loop happens on one screen, with a GitHub-dark terminal aesthetic applied consistently.

---

## Approach: Unified Workspace + Cleanup

Consolidate everything into a single `/dashboard` analyst workspace. Delete all dead code. Apply a consistent design system. The full analyst loop — triage → enrich → playbook → console — completes without a page change.

---

## Routing

| Route | Before | After |
|---|---|---|
| `/` | Redirect to `/dashboard` | Unchanged |
| `/login` | Login page | Unchanged |
| `/dashboard` | Dashboard with case rail | **Unified analyst workspace** |
| `/cases` | Case list page | Redirect to `/dashboard` |
| `/cases/[id]` | Case detail page | Redirect to `/dashboard?case=[id]` |
| `/cases/[id]/playbook/[pbId]` | Standalone playbook page | Folded into center column tab |
| `/playbooks` | Playbook list page | Removed; quick links in left column |

Case selection is URL-driven via `?case=[id]` query param — deep links work, browser back button works correctly.

---

## Layout

Three fixed columns. No page navigation required for any analyst action.

```
┌─────────────────────────────────────────────────────────────────┐
│ TopBar — CASEMGMT · ● N CRITICAL                    analyst.kim │
├──────────────┬──────────────────────────────┬───────────────────┤
│  CASE QUEUE  │       CASE DETAIL            │   AI CONSOLE      │
│  ~200px      │       flex-1                 │   ~240px          │
│              │                              │                   │
│  Search      │  Header strip                │  Prompt history   │
│  Case cards  │  ├─ Title + badges           │  Template chips   │
│  (severity   │  └─ Metadata pills           │  Input + send     │
│   left       │                              │                   │
│   border)    │  IOC grid (main)             │                   │
│              │  ├─ Color-coded cards        │                   │
│  ─────────   │  └─ VT score badges         │                   │
│  PLAYBOOKS   │                              │                   │
│  Quick links │  Timeline (right strip)      │                   │
│              │  └─ Compact vertical         │                   │
│              │                              │                   │
│              │  Tabs: IOC · Enrich ·        │                   │
│              │  Playbook · Raw Logs         │                   │
└──────────────┴──────────────────────────────┴───────────────────┘
```

---

## Component Changes

### Delete entirely
| File | Reason |
|---|---|
| `components/layout/Sidebar.tsx` | Never imported anywhere |
| `components/ui/*` (12 files) | Radix wrappers, never used |
| `lib/store.ts` | Zustand store, never imported |
| `app/cases/page.tsx` | Replaced by redirect |
| `app/cases/[id]/page.tsx` | Replaced by redirect |
| `app/cases/[id]/CaseDetailClient.tsx` | Logic merged into workspace |
| `app/playbooks/page.tsx` | Folded into workspace |
| `app/playbooks/PlaybooksClient.tsx` | Folded into workspace |
| `app/dashboard/DashboardClient.tsx` | Replaced by WorkspaceClient |

### New components
| File | Purpose |
|---|---|
| `app/dashboard/WorkspaceClient.tsx` | Three-column shell, owns `selectedCaseId` state (synced to `?case=` query param) |
| `components/workspace/CaseQueue.tsx` | Left column: case list with search, severity filter, severity-colored left borders, playbook quick links at bottom |
| `components/workspace/CaseOverview.tsx` | Center column: metadata strip + IOC card grid + timeline right strip |
| `components/workspace/IOCCard.tsx` | Single IOC card — color-coded border/background by VT result, VT score badge, type label |

### Keep and restyle (GitHub dark theme applied)
- `components/cases/CaseHeader.tsx`
- `components/cases/StatusBadge.tsx`
- `components/cases/Timeline.tsx`
- `components/cases/CaseTabbedContent.tsx` — add Playbook tab, remove as primary view
- `components/enrichment/MCPIntegrationPanel.tsx` + supporting enrichment components
- `components/playbooks/PlaybookRunner.tsx` + `StepCard.tsx` + `BranchDecision.tsx`
- `components/console/AnalystConsole.tsx` + `ContextToggles.tsx` + `PromptHistory.tsx`
- `lib/api.ts`, `types/index.ts`, `middleware.ts` — no changes

---

## Design System

Single token set applied globally via Tailwind config. No inline hex values in components.

| Token | Value | Used for |
|---|---|---|
| `bg-base` | `#0d1117` | App background |
| `bg-panel` | `#161b22` | Columns, panels, cards |
| `bg-elevated` | `#21262d` | Active items, inputs, hover |
| `border-subtle` | `#21262d` | All dividers and borders |
| `text-primary` | `#f0f6fc` | Active/selected text |
| `text-muted` | `#8b949e` | Labels, secondary text |
| `text-dim` | `#6e7681` | Timestamps, de-emphasized |
| `accent-blue` | `#58a6ff` | Section headers, active tab, links |
| `accent-green` | `#238636` | Confirm actions, clean VT |
| `severity-critical` | `#f85149` | Critical IOCs, critical cases |
| `severity-high` | `#f0883e` | High severity |
| `severity-medium` | `#eab308` | Medium severity |
| `severity-low` | `#3fb950` | Low severity, clean |

**Typography:** Monospace for all labels, IDs, scores, timestamps. System-ui for body text and descriptions.

**IOC card color coding:**
- Malicious: `bg-[#1a0505]` + `border-[#490202]` + red VT badge
- Suspicious: `bg-[#1a0e00]` + `border-[#4a2500]` + orange badge  
- Clean: `bg-[#0d1a10]` + `border-[#1a3a20]` + green VT badge

---

## Animations

### CSS (continuous loops)
| Animation | Trigger | Component |
|---|---|---|
| Critical case glow pulse | Always-on for CRITICAL severity | `CaseQueue` cards |
| Timeline critical dot pulse | Always-on for CRITICAL events | `Timeline` dots |

### Anime.js (orchestrated / one-shot)
| Animation | Trigger | Component |
|---|---|---|
| Case load orchestration | Case selected | `CaseOverview` — timeline: header → metadata pills → IOC cards stagger |
| IOC card stagger | Part of orchestration | `IOCCard` — `translateX` + `opacity`, 100ms stagger |
| VT score count-up | IOC card mounts | `IOCCard` — 0 → score, `easeOutExpo`, 1200ms |
| Threat score arc gauge | IOC card mounts | `IOCCard` — SVG `stroke-dashoffset`, proportional to score |
| New case spring entrance | New case arrives in queue | `CaseQueue` — `spring(1, 80, 10, 0)` |
| Playbook step checkmark | Step marked complete | `StepCard` — SVG stroke draw |
| Playbook progress bar | Step marked complete | `PlaybookRunner` — bar width + percentage counter synced |

**Performance:** All animations use `transform` and `opacity` only. `will-change: transform, opacity` on animated elements. Full `prefers-reduced-motion` support via global CSS.

---

## Data Flow

```
URL: /dashboard?case=1042
        │
        ▼
WorkspaceClient
├── reads ?case param → selectedCaseId
├── useCase(selectedCaseId) → case data
├── Left: CaseQueue
│         useCases() → list
│         onClick(case) → setSelectedCaseId + push ?case=
├── Center: CaseOverview
│         case data → CaseHeader, IOCCard grid, Timeline strip
│         Tabs: CaseTabbedContent (Enrich, Playbook, Raw Logs)
└── Right: AnalystConsole
          useConsoleHistory(selectedCaseId)
          useSubmitConsolePrompt(selectedCaseId)
          context-aware: always knows active case
```

---

## Files Deleted (Dead Code Summary)

~1,100 lines removed:
- `components/layout/Sidebar.tsx` — 138 lines
- `components/ui/*.tsx` (12 files) — ~900 lines
- `lib/store.ts` — 32 lines
- Consolidated page components — ~130 lines

---

## Out of Scope

- Backend changes
- New API endpoints
- Authentication changes
- Test suite rewrite (existing tests updated to match restructured components)
- Dark/light mode toggle
