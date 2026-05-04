# SOC Case Manager

The core thesis: every SOAR platform I've worked with (Tines, Swimlane, others) is missing a **per-case AI analyst console** that is natively connected to the security tools the business already uses. This project focuses on that gap.

---

## Background & Scope Decision

I initially scoped a full case management system. After an hour of building I realized that was too broad for a take-home. I narrowed to the feature I think matters most and is most absent in existing SOARs: **an AI chat console, scoped to a specific case, backed by real security tool integrations via MCP**.

The MCP server is hosted on [Tines](https://www.tines.com/) — a tool I use daily. It handles the webhook layer so the backend never manages raw API credentials for VirusTotal or AbuseIPDB directly.

---

## What's Built

### AI Analyst Console (core feature)
- Per-case chat interface powered by **GPT-4o** via an OpenAI agentic loop
- Streams responses via **Server-Sent Events (SSE)** — tool-call status chips appear in real time as the model invokes security tools
- Tools connected: VirusTotal lookup (hashes, IPs, domains, URLs) and AbuseIPDB check, both routed through a Tines MCP webhook
- System prompt is case-aware — the model receives case context, IOCs, and timeline before the first turn

### Case Management
- Case list and detail views with status, severity, and assignee fields
- Timeline of events per case
- IOC (indicator of compromise) attachment and tracking
- Dashboard with a live case rail
- Mock incident feed in demo mode (synthetic cases generated every 10–30 seconds)

### IOC Enrichment
- Results persisted against the case for audit purposes
- In demo mode, enrichment returns pre-seeded realistic fixtures (Tor exit nodes, Cobalt Strike C2, Mimikatz hash, LockBit ransomware, AiTM phishing domain)

### Auth & Security
- JWT access + refresh token flow (15 min / 7 day TTL)
- Secrets loaded from mounted files (`/run/secrets/`) — no plaintext credentials in the image or environment block
- Role-aware user model (Analyst, Tier 2, Team Lead, Admin)

---

## Quick Start

### Prerequisites
- Docker Desktop 4.x+
- `docker compose` v2

### 1. Clone and configure secrets

```bash
git clone <repo-url>
cd case_mgmt
mkdir -p .secrets
echo "supersecretjwtkey1234567890abcdef" > .secrets/jwt_secret
echo "sk-..." > .secrets/openai_api_key     # OpenAI key for the AI console
# Optional for live enrichment:
# echo "https://your-tines-webhook-url" > .secrets/tines_webhook_url
```

### 2. Start all services

```bash
docker compose up --build
```

| Service    | URL                    |
|------------|------------------------|
| Frontend   | http://localhost:3000  |
| Backend    | http://localhost:8000  |
| MongoDB    | localhost:27017        |
| Redis      | localhost:6379         |

### 3. Open the app

Navigate to http://localhost:3000 and log in with a demo account:

| Role              | Email                  | Password    |
|-------------------|------------------------|-------------|
| SOC Analyst       | `analyst@demo.local`   | `Demo1234!` |
| Tier 2            | `tier2@demo.local`     | `Demo1234!` |
| Team Lead         | `lead@demo.local`      | `Demo1234!` |
| Admin             | `admin@demo.local`     | `Demo1234!` |

Demo data is auto-seeded on first boot when `DEMO_MODE=true`.

---

## Demo Mode

`DEMO_MODE=true` (default) enables:
- Auto-seeded demo cases on startup
- Mock incident feed generating synthetic cases in the background
- Enrichment calls return fixture JSON instead of hitting Tines/VirusTotal

Fixture scenarios included:

| IOC | Scenario |
|-----|----------|
| `185.220.101.47` | Tor exit node — high malicious detections |
| `45.142.212.100` | Cobalt Strike C2 beacon (NL) |
| `a3f1...` (hash) | Mimikatz — credential dumping (T1003.001) |
| `b7e2...` (hash) | LockBit 3.0 ransomware loader |
| `corp-mail-auth.ru` | EvilProxy AiTM phishing domain |

---

## Live Enrichment via Tines

To switch from demo fixtures to real VirusTotal + AbuseIPDB:

1. Set `DEMO_MODE=false` in `docker-compose.yml`
2. Set `TINES_WEBHOOK_URL` to your Tines MCP webhook URL (the story that handles `tools/call` JSON-RPC)

The backend calls Tines directly via `TINES_WEBHOOK_URL`.

---

## Environment Variables

### Backend

| Variable | Default | Notes |
|----------|---------|-------|
| `MONGODB_URL` | `mongodb://localhost:27017` | Overridden by `MONGODB_URL_FILE` |
| `REDIS_URL` | `redis://localhost:6379` | Overridden by `REDIS_URL_FILE` |
| `JWT_SECRET_KEY` | required | Min 32 chars; use `JWT_SECRET_KEY_FILE` in Docker |
| `OPENAI_API_KEY` | — | Required for AI console; use `OPENAI_API_KEY_FILE` in Docker |
| `OPENAI_MODEL` | `gpt-4o` | Model used by the agentic loop |
| `TINES_WEBHOOK_URL` | — | Tines `tools/call` webhook; leave blank in demo mode |
| `DEMO_MODE` | `true` | Skip live enrichment; auto-seed demo data |
| `MOCK_INCIDENT_FEED` | `true` | Generate synthetic cases every 10–30s (requires `DEMO_MODE`) |

### Frontend

| Variable | Notes |
|----------|-------|
| `NEXTAUTH_SECRET` | 32-char secret for NextAuth; falls back to demo value when unset in demo mode |
| `NEXTAUTH_URL` | Public URL of the frontend |
| `NEXT_PUBLIC_API_URL` | Public URL of the backend |

---

## API Reference

### Auth
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/auth/login` | Password login → access + refresh tokens |
| `POST` | `/api/v1/auth/refresh` | Rotate refresh token |
| `POST` | `/api/v1/auth/logout` | Revoke refresh token |

### Cases
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/cases` | List cases (paginated) |
| `POST` | `/api/v1/cases` | Create case |
| `GET` | `/api/v1/cases/{id}` | Case detail |
| `PATCH` | `/api/v1/cases/{id}` | Update status / severity / assignee |

### AI Console
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/cases/{id}/console` | Send a message; returns SSE stream of tokens + tool events |

### Enrichment
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/cases/{id}/enrich/ioc` | Manually enrich a hash, IP, domain, or URL |

### Playbooks
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/playbooks` | List playbooks |
| `GET` | `/api/v1/playbooks/{id}` | Playbook detail |

### MCP Proxy
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/mcp/tools/call` | Proxy a `tools/call` request to Tines |

---

## Project Structure

```
case_mgmt/
├── frontend/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Login page
│   │   ├── cases/[id]/         # Case detail page
│   │   ├── dashboard/          # Dashboard
│   │   └── playbooks/          # Playbooks
│   └── components/
│       ├── cases/              # CaseList, CaseCard, CaseHeader, Timeline, IOCTable …
│       ├── console/            # AnalystConsole, ContextToggles, PromptHistory
│       ├── dashboard/          # DashboardCaseRail
│       ├── enrichment/         # MCPCallViewer, MCPToolCallCard, ConsolidatedFindings …
│       ├── workspace/          # CaseOverview, CaseQueue, IOCCard
│       └── layout/             # AppShell, TopBar
├── backend/
│   └── app/
│       ├── auth/               # JWT login, refresh, logout
│       ├── cases/              # Case CRUD + mock incident feed
│       ├── console/            # SSE agentic loop (OpenAI tool-use → Tines)
│       ├── enrichment/         # IOC enrichment + Tines client
│       ├── mcp/                # MCP proxy router
│       ├── playbooks/          # Playbook CRUD
│       ├── core/               # Config, deps, security, secret-file loader
│       └── db/                 # MongoDB + Redis connections, bootstrap/seed
├── docker-compose.yml
├── docker-compose.prod.yml
└── ARCHITECTURE.md
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python 3.12, Motor (async MongoDB driver) |
| AI Console | OpenAI `gpt-4o` via OpenAI SDK agentic loop, SSE streaming |
| MCP / Tools | Tines webhook (`tools/call` JSON-RPC) |
| Database | MongoDB 7 |
| Cache | Redis 7 |
| Auth | NextAuth.js (frontend), JWT + refresh tokens (backend) |
| Containers | Docker, Docker Compose |

---

## What I'd Improve With More Time

- **More security tool integrations**: Axonius (asset/user lookup), Slack notifications, CrowdStrike RTR actions, Zscaler block/unblock, JAMF/Intune device lock — most require paid tiers which made them impractical for a take-home
- **Full case lifecycle**: status transitions, assignment workflow, SLA timers
- **Vulnerability hardening**: OWASP scan, rate limiting, input sanitization audit
- **Observability**: structured logging throughout (this is a security platform — logging matters)
- **Auth improvements**: sign-up flow, password reset via email, MFA / passkey support
- **Mobile view**
- **MITRE ATT&CK auto-tagging** from IOC enrichment results

## Known Limitations

- Frontend polish is uneven — this isn't my daily domain and some views are rougher than others
- The AI console uses `gpt-4o`; switching to Claude would require the Anthropic SDK (the agentic loop structure is compatible)
- No rate limiting on the console endpoint yet — a busy analyst could run up OpenAI costs in demo mode

---
