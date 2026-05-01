# SIEM Case Manager

An AI-powered Security Operations Center (SOC) case management platform that combines structured incident tracking with real-time threat intelligence enrichment via a FastMCP sidecar server.

---

## Features

- **AI-Assisted Investigation** — Claude-powered analyst agent enriches IOCs, drafts timelines, and suggests containment actions in natural language
- **Unified Case Management** — Create, triage, assign, and escalate security incidents with full audit trail
- **Live Threat Intelligence** — VirusTotal, CrowdStrike Falcon, AlienVault OTX, and Active Directory enrichment via MCP tools
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
           │ HTTP (internal)                       │ Motor async
           ▼                                       ▼
┌──────────────────────────┐         ┌─────────────────────────┐
│  MCP Sidecar (FastMCP)   │         │   MongoDB 7             │
│  /tools/vt_ip_report     │         │   Collections:          │
│  /tools/vt_hash_lookup   │         │   cases, alerts, iocs   │
│  /tools/vt_domain_scan   │         │   users, audit_log      │
│  /tools/cs_host_details  │         └─────────────────────────┘
│  /tools/cs_contain_host  │
│  /tools/cs_ioc_search    │         ┌─────────────────────────┐
│  /tools/cs_process_tree  │         │   Redis 7               │
│  /tools/otx_indicator    │         │   Session cache         │
│  /tools/otx_pulse_search │         │   WebSocket pub/sub     │
│  /tools/ldap_user_lookup │         │   Rate limit buckets    │
│         Port 8001        │         └─────────────────────────┘
└──────────────────────────┘
     │ DEMO_MODE=true → mock_responses/
     │ DEMO_MODE=false → live APIs
     ├── VirusTotal v3
     ├── CrowdStrike Falcon
     ├── AlienVault OTX
     └── Active Directory (LDAP3)
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

Included mock scenarios:

| Fixture | Scenario |
|---|---|
| `vt_ip_185.220.101.47` | Tor exit node, 52/65 malicious detections |
| `vt_ip_45.142.212.100` | Cobalt Strike C2 beacon (NL) |
| `vt_hash_a3f1...` | Mimikatz — T1003.001 credential dumping |
| `vt_hash_b7e2...` | LockBit 3.0 ransomware loader |
| `vt_domain_corp-mail-auth.ru` | EvilProxy AiTM phishing domain |
| `cs_host_WKST-MW-007` | Middleware workstation, not contained |
| `cs_ioc_search_finance` | Mimikatz found on 2 Finance OU hosts |
| `cs_process_tree` | cmd → powershell → beacon.exe chain |
| `otx_indicator_185.220.101.47` | 47 OTX pulses — finance sector targeting |
| `otx_indicator_corp-mail-auth.ru` | Scattered Spider attribution |
| `ldap_user_jwong` | Finance analyst, MFA: Authenticator app |
| `ldap_user_msmith` | Domain Admin, MFA: FIDO2 key |

---

## VirusTotal Live Mode

Local Docker Compose runs with `DEMO_MODE=true` by default, so MCP tools use deterministic mock responses.

To enable live VirusTotal calls for the MCP service:

1. Create `.secrets/vt_api_key` containing your VirusTotal API key.
2. Set the MCP service `DEMO_MODE` to `false` in `docker-compose.yml` or an override file.
3. Restart the stack with `docker compose up --build`.

Never commit `.secrets/` or API keys. The repository `.gitignore` excludes `.secrets/`.

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
| `DEMO_MODE` | `true` | Use mock fixtures instead of live APIs |
| `MCP_SERVER_URL` | `http://mcp:8001` | Internal MCP sidecar URL |

### MCP Server

| Variable | Description |
|---|---|
| `DEMO_MODE` | When `true`, return fixture JSON instead of calling live APIs |
| `VT_API_KEY` / `VT_API_KEY_FILE` | VirusTotal v3 API key (file mount preferred in Docker) |
| `CS_CLIENT_ID` / `CS_CLIENT_ID_FILE` | CrowdStrike OAuth2 client ID |
| `CS_CLIENT_SECRET` / `CS_CLIENT_SECRET_FILE` | CrowdStrike OAuth2 client secret |
| `OTX_API_KEY` / `OTX_API_KEY_FILE` | AlienVault OTX API key |
| `LDAP_HOST` | LDAP server URI (e.g. `ldap://10.0.0.1`) |
| `LDAP_BIND_DN` | Service account DN for LDAP bind |
| `LDAP_BIND_PASSWORD` / `LDAP_BIND_PASSWORD_FILE` | Service account password |
| `LDAP_BASE_DN` | LDAP search base (e.g. `dc=corp,dc=local`) |

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
- [x] FastMCP sidecar with VirusTotal, CrowdStrike, OTX, LDAP tools
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
