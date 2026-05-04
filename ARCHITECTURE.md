# Architecture

## Overview

The system is a three-service stack: a Next.js frontend, a FastAPI backend, and a MongoDB + Redis data layer. The design centres on the **AI Analyst Console** — a per-case chat interface where an agentic loop drives security tool calls in real time.

---

## System Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Browser (SOC Analyst)                        │
│                                                                      │
│   Dashboard · Case List · Case Detail · Analyst Console · Playbooks  │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ HTTPS / SSE
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   Frontend  (Next.js 15 / App Router)                │
│                            Port 3000                                 │
│                                                                      │
│  NextAuth.js session  ·  REST calls to backend  ·  SSE stream reader │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ REST + SSE
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                Backend API  (FastAPI / Python 3.12)                  │
│                            Port 8000                                 │
│                                                                      │
│  /auth   /cases   /console (SSE)   /enrichment   /mcp   /playbooks  │
│                                                                      │
│  JWT auth · Motor async driver · Pydantic models                     │
└────┬──────────────────────────────────┬───────────────────────────┬──┘
     │ Motor (async)                    │ Redis pub/sub             │ HTTP
     ▼                                 ▼                           ▼
┌──────────────┐              ┌───────────────┐        ┌──────────────────────┐
│  MongoDB 7   │              │   Redis 7     │        │   Tines MCP Webhook  │
│  Port 27017  │              │   Port 6379   │        │  (hosted on Tines)   │
│              │              │               │        │                      │
│  cases       │              │  session cache│        │  tools/call JSON-RPC │
│  users       │              │  mock feed    │        │  → VirusTotal        │
│  playbooks   │              │               │        │  → AbuseIPDB         │
│  audit_log   │              └───────────────┘        └──────────────────────┘
└──────────────┘
```

---

## AI Analyst Console — Agentic Loop

This is the core feature. The flow for a single console turn:

```
Browser
  │  POST /api/v1/cases/{id}/console/stream  { "prompt": "..." }
  │
  ▼
Backend: console/router.py
  │
  ├─ 1. Load case context (title, severity, IOCs, timeline) from MongoDB
  ├─ 2. Build system prompt with case context
  ├─ 3. Return StreamingResponse (text/event-stream)
  │
  └─ Inside the stream generator:
       ┌─────────────────────────────────────────────────────────┐
       │  OpenAI agentic loop (max 5 iterations)                 │
       │                                                         │
       │  client.chat.completions.create(                        │
       │      model="gpt-4o",                                    │
       │      tools=[vt_lookup, abuseipdb_check],                │
       │  )  ← non-streaming; response wrapped into SSE manually │
       │                                                         │
       │  On text response → SSE: { type: "delta", text }        │
       │  On tool_call     → SSE: { type: "tool_call",           │
       │                            tool, args, status:"running"}│
       │                   → Call Tines webhook                  │
       │                   → SSE: { type: "tool_result",         │
       │                            tool, status: "done" }       │
       │  On finish        → SSE: { type: "done" }               │
       │  On error         → SSE: { type: "error", message }     │
       │  Loop until no more tool_calls or max iterations        │
       │                                                         │
       └─────────────────────────────────────────────────────────┘
  │
  ▼
Frontend: useConsoleSSE hook
  │
  ├─ Accumulates text tokens into message bubbles
  └─ Renders tool-call status chips (pending → result)
```

The model never sees raw API credentials. It calls tools by name; the backend resolves each call to the appropriate Tines webhook endpoint.

---

## Tines Integration

Tines acts as the MCP layer — it owns the API credentials for VirusTotal and AbuseIPDB and exposes a single `tools/call` JSON-RPC endpoint.

```
Backend
  │
  │  POST <TINES_WEBHOOK_URL>
  │  {
  │    "tool": "search_for_files_urls_domains_ips_and_comments",
  │    "parameters": { "query": "185.220.101.47" }
  │  }
  │
  ▼
Tines Story
  ├─ Route by tool name
  ├─ Call VirusTotal API  (credentials stored in Tines)
  └─ Return structured JSON response
```

In demo mode (`DEMO_MODE=true`), `tines_client.py` short-circuits and returns fixture JSON from `backend/app/mcp/mock_responses.py` without making any outbound HTTP calls.

---

## Backend Module Structure

```
backend/app/
├── auth/               JWT login, token refresh, logout, user model
├── cases/
│   ├── router.py       CRUD endpoints
│   ├── service.py      Business logic, pagination
│   ├── models.py       Pydantic/Mongo document models
│   └── mock_feed.py    Async task: generates synthetic cases every 10–30s
├── console/
│   ├── router.py       SSE endpoint + OpenAI agentic loop
│   └── service.py      System prompt builder (injects case context)
├── enrichment/
│   ├── router.py       Manual IOC enrichment endpoint
│   ├── service.py      Enrichment orchestration
│   └── tines_client.py HTTP client → Tines webhook (or fixture fallback)
├── mcp/
│   └── router.py       MCP proxy: forwards tools/call to Tines
├── playbooks/          Playbook CRUD
└── core/
    ├── config.py       Pydantic settings (env vars + _FILE secret mounts)
    ├── deps.py         FastAPI dependency injection (db, current_user)
    ├── security.py     JWT encode/decode, password hashing
    └── secrets.py      Reads plain env var or mounted secret file
```

---

## Frontend Component Structure

```
frontend/
├── app/
│   ├── (auth)/             Login page (NextAuth credentials provider)
│   ├── dashboard/          Live case rail + metrics
│   ├── cases/[id]/         Case detail — tabbed layout
│   └── playbooks/          Playbook list + detail
└── components/
    ├── cases/
    │   ├── CaseList.tsx         Filterable paginated case table
    │   ├── CaseCard.tsx         Summary card used in the queue
    │   ├── CaseHeader.tsx       Status, severity, assignee header
    │   ├── CaseTabbedContent.tsx Tabs: Overview · IOCs · Timeline · Console
    │   ├── CaseRightPane.tsx    Contextual detail pane
    │   ├── IOCTable.tsx         IOC list with enrichment status
    │   ├── Timeline.tsx         Chronological event feed
    │   └── StatusBadge.tsx      Severity / status colour chip
    ├── console/
    │   ├── AnalystConsole.tsx   Chat UI — reads SSE stream, renders tool chips
    │   ├── ContextToggles.tsx   Toggle which case context is injected
    │   └── PromptHistory.tsx    Previous turns in the session
    ├── enrichment/
    │   ├── MCPCallViewer.tsx    Expandable raw tool call / result viewer
    │   ├── MCPToolCallCard.tsx  Per-call status card
    │   ├── MCPConnectorGrid.tsx Grid of available MCP connectors
    │   ├── MCPIntegrationPanel.tsx Full enrichment sidebar
    │   ├── ConsolidatedFindings.tsx Aggregated enrichment summary
    │   └── LDAPPanel.tsx        (placeholder for directory lookups)
    ├── workspace/
    │   ├── CaseOverview.tsx
    │   ├── CaseQueue.tsx
    │   └── IOCCard.tsx
    └── layout/
        ├── AppShell.tsx         Sidebar nav + main content area
        └── TopBar.tsx           Global header with user menu
```

---

## Auth Flow

```
Browser                    Frontend                    Backend
  │                            │                           │
  │─── POST /api/auth/login ──►│                           │
  │                            │── POST /api/v1/auth/login►│
  │                            │                           │ verify password
  │                            │◄── { access, refresh } ───│
  │◄── Set httpOnly cookies ───│                           │
  │                            │                           │
  │─── GET /api/cases ────────►│                           │
  │                            │── GET /api/v1/cases ─────►│
  │                            │   Authorization: Bearer   │ verify JWT
  │                            │◄── cases[] ───────────────│
  │◄── rendered page ──────────│                           │
```

- Access token: 15-minute TTL, stored in memory / httpOnly cookie
- Refresh token: 7-day TTL, rotated on use, revocable via Redis

---

## Data Model (MongoDB collections)

```
cases
  _id, title, description, status, severity, assignee,
  created_at, updated_at, iocs[], timeline[], tags[]

users
  _id, email, hashed_password, role, created_at

playbooks
  _id, name, description, steps[], created_at

audit_log
  _id, user_id, action, target_id, detail, timestamp
```

---

## Secrets Management

No secrets are baked into images or plain environment blocks. The pattern for every secret:

1. Docker Compose mounts `.secrets/` into each container at `/run/secrets/`
2. `core/secrets.py` checks `<KEY>_FILE` first; falls back to the plain env var
3. In demo mode, the app auto-generates safe ephemeral values for optional secrets (e.g., `NEXTAUTH_SECRET`)

---

## Demo Mode vs Live Mode

| Concern | `DEMO_MODE=true` | `DEMO_MODE=false` |
|---------|-----------------|-------------------|
| Case data | Auto-seeded + synthetic feed | Requires real ingestion |
| IOC enrichment | Fixture JSON from `mock_responses/` | Live Tines webhook |
| AI console | Functional (still calls OpenAI) | Functional |
| External dependencies | None (beyond OpenAI) | Tines + VT/AbuseIPDB credentials |

---

## What's Not Built Yet

- MITRE ATT&CK auto-tagging from enrichment results
- Full RBAC enforcement at the field level (role model exists, route guards are partial)
- Admin UI (user management, audit log viewer)
