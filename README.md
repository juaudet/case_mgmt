# SIEM Case Manager

An AI-powered Security Operations Center (SOC) case management platform that combines structured incident tracking with threat intelligence enrichment via **Tines MCP** (VirusTotal and AbuseIPDB tools), callable from the backend and optionally from a small FastMCP sidecar for IDE clients.

---

## Features

- **AI-Assisted Investigation** — Claude-powered analyst agent enriches IOCs, drafts timelines, and suggests containment actions in natural language
- **Unified Case Management** — Create, triage, assign, and escalate security incidents with full audit trail
- **Live Threat Intelligence** — VirusTotal and AbuseIPDB via Tines MCP (`tools/call` JSON-RPC)
- **MITRE ATT&CK Tagging** — Technique mapping on every IOC and case timeline event
- **Demo Mode** — Fully functional with realistic mock fixtures; no external API keys required to evaluate
- **Role-Based Access Control** — Analyst, Tier 2, Team Lead, and Admin roles with scoped permissions
- **Real-Time Updates** — WebSocket-based live case feed and alert ingestion pipeline

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / SOC Analyst                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Frontend  (Next.js 15 / App Router)           │
│   Case List · Case Detail · IOC Panel · AI Chat · Admin UI      │
│                        Port 3000                                │
└─────────────────────────────┬───────────────────────────────────┘
                              │ REST + WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               Backend API  (FastAPI / Python 3.12)              │
│   /cases  /alerts  /iocs  /users  /ws  /ai/analyze              │
│   JWT Auth · MongoDB · Redis pub/sub · Beanie ODM               │
│                        Port 8000                                │
└──────────┬──────────────────────────────────────┬──────────────┘
           │ optional SSE (IDE)                      │ Motor async
           ▼                                       ▼
┌──────────────────────────┐         ┌─────────────────────────┐
│  MCP sidecar (optional)  │         │   MongoDB 7             │
│  FastMCP · Tines proxy   │         │   cases, alerts, iocs   │
│  vt_* · abuseipdb_*      │         └─────────────────────────┘
│  Port 8001               │         ┌─────────────────────────┐
└──────────────────────────┘         │   Redis 7               │
     mocks or Tines webhook          │   cache / pubsub        │
                                    └─────────────────────────┘
Backend uses the same Tines webhook when DEMO_MODE=false (no sidecar required).
```

---

## Quick Start (Docker Compose)

### Prerequisites
- Docker Desktop 4.x+
- `docker compose` v2

### 1. Clone and configure

```bash
git clone https://github.com/your-org/case-mgmt.git
cd case-mgmt
cp .env.example .env
# Optional: create .secrets/ if you want to provide real keys locally.
# In demo mode, the app now auto-falls back to built-in demo secrets.
mkdir -p .secrets
```

### 2. Start all services

```bash
docker compose up --build
```

Services will start on:
| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| MCP Server | http://localhost:8001 |
| MongoDB | localhost:27017 |
| Redis | localhost:6379 |

### 3. Seed demo data

```bash
# From the project root, after services are up:
docker compose exec backend python scripts/seed_demo.py
```

This creates 3 realistic demo cases including a simulated AiTM phishing campaign, credential dumping incident, and ransomware pre-cursor investigation.

### 4. Open the app

Navigate to http://localhost:3000 and log in with the demo credentials below.

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| SOC Analyst | `analyst@demo.local` | `Demo1234!` |
| Tier 2 Investigator | `tier2@demo.local` | `Demo1234!` |
| Team Lead | `lead@demo.local` | `Demo1234!` |
| Admin | `admin@demo.local` | `Demo1234!` |

---

## Demo Mode

With `DEMO_MODE=true` (the default), all MCP tool calls return realistic pre-seeded JSON fixtures from `mcp-server/mock_responses/`. No external API keys are required.

Included mock scenarios (Tines-shaped VT fixtures in `mcp-server/mock_responses/`):

| Fixture | Scenario |
|---|---|
| `vt_ip_185.220.101.47` | Tor exit node, high malicious detections |
| `vt_ip_45.142.212.100` | Cobalt Strike C2 beacon (NL) |
| `vt_hash_a3f1...` | Mimikatz — T1003.001 credential dumping |
| `vt_hash_b7e2...` | LockBit 3.0 ransomware loader |
| `vt_domain_corp-mail-auth.ru` | EvilProxy AiTM phishing domain |

---

## Live enrichment (Tines)

With `DEMO_MODE=true` (default), the backend skips live HTTP enrichment calls; the optional MCP sidecar still serves VT/AbuseIPDB-shaped **fixtures** from `mcp-server/mock_responses/`.

For live VirusTotal and AbuseIPDB via your Tines tenant:

1. Set `DEMO_MODE=false` on the **backend** (and on `mcp` if you use the sidecar).
2. Set `TINES_WEBHOOK_URL` (or `TINES_MCP_URL`) to your Tines MCP webhook URL.
3. Optionally override `TINES_VT_TOOL`, `TINES_ABUSEIPDB_CHECK_TOOL`, and `TINES_ABUSEIPDB_REPORTS_TOOL` if your story names differ.

Never commit secrets. The repository `.gitignore` excludes `.secrets/`.

---

## Environment Variables Reference

### Backend

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URL` | `mongodb://localhost:27017` | MongoDB connection string (non-Docker / tests) |
| `MONGODB_URL_FILE` | — | If set, read connection string from this path (overrides `MONGODB_URL`; use with Docker secrets / Key Vault sync) |
| `REDIS_URL` | `redis://localhost:6379` | Redis URL (non-Docker / tests) |
| `REDIS_URL_FILE` | — | If set, read Redis URL from this path (overrides `REDIS_URL`) |
| `JWT_SECRET_KEY` | *(required outside demo mode)* | Min 32 chars; token signing secret (non-Docker / tests) |
| `JWT_SECRET_KEY_FILE` | `/run/secrets/jwt_secret` in Compose | If set, read JWT secret from this path (overrides `JWT_SECRET_KEY`); optional in demo mode |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Short-lived access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token TTL |
| `ANTHROPIC_API_KEY` | — | Anthropic API key (local dev without secret files) |
| `ANTHROPIC_API_KEY_FILE` | `/run/secrets/anthropic_api_key` in Compose | If set, read API key from this path (preferred in Docker) |
| `DEMO_MODE` | `true` | Skip live Tines calls in the API; fixtures on optional MCP sidecar |
| `TINES_WEBHOOK_URL` | — | Tines `tools/call` URL (backend live enrichment) |
| `TINES_MCP_URL` | — | Legacy alias for `TINES_WEBHOOK_URL` |
| `TINES_VT_TOOL` / `TINES_ABUSEIPDB_*` | defaults in code | Tines story names if yours differ |

### MCP Server (optional sidecar)

| Variable | Description |
|---|---|
| `DEMO_MODE` | When `true`, return fixture JSON from `mock_responses/` |
| `TINES_WEBHOOK_URL` | Same Tines MCP URL as the backend |

### Frontend

| Variable | Description |
|---|---|
| `NEXTAUTH_SECRET` | 32-char random secret for NextAuth; in demo mode entrypoint falls back to a demo value if unset |
| `NEXTAUTH_SECRET_FILE` | `/run/secrets/nextauth_secret` in Compose | Optional path to mounted secret; entrypoint exports `NEXTAUTH_SECRET` when present |
| `NEXTAUTH_URL` | Public URL of the frontend |
| `NEXT_PUBLIC_API_URL` | Public URL of the backend API |

---

## API Endpoints Overview

### Authentication
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Username + password → access + refresh tokens |
| `POST` | `/api/auth/refresh` | Rotate refresh token |
| `POST` | `/api/auth/logout` | Revoke refresh token |

### Cases
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/cases` | List cases (paginated, filterable) |
| `POST` | `/api/cases` | Create new case |
| `GET` | `/api/cases/{id}` | Get case detail |
| `PATCH` | `/api/cases/{id}` | Update status, severity, assignee |
| `POST` | `/api/cases/{id}/timeline` | Add timeline event |
| `POST` | `/api/cases/{id}/iocs` | Attach IOC to case |

### AI Analysis
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/ai/analyze` | Run AI analyst agent on a case (streams) |
| `POST` | `/api/ai/enrich-ioc` | Enrich a single IOC via MCP tools |

### Alerts
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/alerts` | List unprocessed alerts |
| `POST` | `/api/alerts/{id}/promote` | Promote alert to case |

### IOCs
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/iocs` | Search IOCs across all cases |
| `GET` | `/api/iocs/{value}` | Get enrichment history for an IOC |

### Admin
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/users` | List users (admin only) |
| `POST` | `/api/users` | Create user |
| `GET` | `/api/audit` | Audit log (admin only) |

### WebSocket
| Path | Description |
|---|---|
| `ws://host/ws` | Real-time case updates and alert feed |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python 3.12, Beanie ODM, Motor async driver |
| AI | Anthropic Claude 3.5 Sonnet via `anthropic` SDK |
| MCP Sidecar | FastMCP 2.2, uvicorn |
| Database | MongoDB 7 |
| Cache / Pubsub | Redis 7 |
| Auth | NextAuth.js (frontend), JWT + refresh tokens (backend) |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions → DigitalOcean Container Registry → App Platform |

---

## Sprint Roadmap

### Sprint 1 — Foundation (complete)
- [x] Monorepo scaffold: `frontend/`, `backend/`, `mcp-server/`
- [x] FastAPI skeleton with JWT auth and MongoDB models
- [x] FastMCP sidecar (optional) with Tines-backed VT + AbuseIPDB tools
- [x] Realistic mock fixture library (12 scenarios)
- [x] Docker Compose for local development
- [x] GitHub Actions CI pipeline

### Sprint 2 — Core Case Management
- [ ] Case CRUD API with Beanie ODM
- [ ] Alert ingestion endpoint + promotion to case workflow
- [ ] IOC attachment and deduplication
- [ ] WebSocket real-time feed (Redis pub/sub)
- [ ] Frontend: case list + detail pages (shadcn data table)

### Sprint 3 — AI Analyst Agent
- [ ] Claude tool-use agent wired to MCP sidecar
- [ ] Streaming AI analysis panel in case detail view
- [ ] MITRE ATT&CK technique auto-tagging from IOC enrichment
- [ ] AI-generated timeline narrative + containment recommendations

### Sprint 4 — RBAC + Audit
- [ ] Role definitions: Analyst / Tier 2 / Lead / Admin
- [ ] Field-level permissions on case mutations
- [ ] Immutable audit log collection
- [ ] Admin UI: user management, role assignment

### Sprint 5 — Production Hardening
- [ ] Rate limiting (Redis token bucket)
- [ ] Secrets rotation procedure
- [ ] DigitalOcean App Platform deployment spec
- [ ] Load testing (Locust) + performance baseline
- [ ] Runbook documentation

---

## Project Structure

```
case_mgmt/
├── frontend/               # Next.js 15 app
│   ├── app/                # App Router pages and layouts
│   ├── components/         # Shared UI components (shadcn)
│   └── lib/                # API client, auth helpers
├── backend/                # FastAPI application
│   ├── app/
│   │   ├── api/            # Route handlers
│   │   ├── models/         # Beanie ODM document models
│   │   ├── services/       # Business logic
│   │   └── core/           # Config, security, dependencies
│   └── tests/
├── mcp-server/             # FastMCP sidecar
│   ├── server.py           # MCP app entry point
│   ├── tools/              # Tool registration modules
│   └── mock_responses/     # Demo fixture JSON files
├── .github/workflows/      # CI and deploy pipelines
├── docker-compose.yml      # Local dev stack
├── docker-compose.prod.yml # Production image overrides
└── .env.example            # Environment variable template
```

---

## Contributing

1. Fork the repo and create a feature branch off `main`
2. Run `docker compose up` to verify your changes locally
3. Ensure `pytest` passes in both `backend/` and `mcp-server/`
4. Open a PR — CI will run lint, type check, and tests automatically

---

## License

MIT
