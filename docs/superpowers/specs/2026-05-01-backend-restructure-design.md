# Backend Restructure — Feature-Based (Domain) Modules

**Date:** 2026-05-01
**Status:** Approved

---

## Problem

The current backend uses a layer-based layout: all routes in `app/api/v1/`, all services in `app/services/`, all models in `app/models/`. This is functional but doesn't scale well — adding a new feature requires touching four separate directories. It also makes it harder to understand what the system does at a glance.

---

## Goal

Reorganize into feature-based domain modules so that each business domain is self-contained. A reader should be able to open `app/cases/` and find everything related to cases without navigating across the codebase.

---

## Architecture

### New Directory Structure

```
backend/app/
├── auth/
│   ├── __init__.py
│   ├── router.py        # FastAPI router (was api/v1/auth.py)
│   ├── service.py       # Auth logic (was services/auth_service.py)
│   └── models.py        # User models, Role enum (was models/user.py)
├── cases/
│   ├── __init__.py
│   ├── router.py        # FastAPI router (was api/v1/cases.py)
│   ├── service.py       # Case CRUD, timeline (was services/case_service.py)
│   ├── models.py        # Case, IOC, Timeline models (was models/case.py + models/ioc.py)
│   ├── parsers.py       # Sentinel/Splunk ingestion (was services/source_parsers.py)
│   └── mock_feed.py     # Synthetic incident generator (was services/mock_incident_feed.py)
├── playbooks/
│   ├── __init__.py
│   ├── router.py        # FastAPI router (was api/v1/playbooks.py)
│   ├── engine.py        # Step execution, branch logic (was services/playbook_engine.py)
│   └── models.py        # Playbook, PlaybookStep, Branch (was models/playbook.py)
├── enrichment/
│   ├── __init__.py
│   ├── router.py        # FastAPI router (was api/v1/enrichment.py)
│   └── service.py       # VT/OTX/LDAP/GeoIP lookups (was services/enrichment_service.py)
├── mcp/
│   ├── __init__.py
│   ├── router.py        # FastAPI router (was api/v1/mcp.py)
│   └── service.py       # MCP tool execution, audit log (was services/mcp_case_service.py)
├── console/
│   ├── __init__.py
│   ├── router.py        # FastAPI router (was api/v1/console.py)
│   └── service.py       # Prompt context builder (was services/console_service.py)
├── core/                # Shared infrastructure — unchanged
│   ├── config.py
│   ├── deps.py
│   ├── security.py
│   └── secrets.py
├── db/                  # Database connections — unchanged
│   ├── mongo.py
│   ├── redis.py
│   └── bootstrap.py
└── main.py              # App init, router registration — updated imports only
```

### What Changes vs. What Stays

| Concern | Change |
|---|---|
| File content | **None** — logic is moved, not rewritten |
| Import paths | Updated throughout (e.g. `from app.services.case_service` → `from app.cases.service`) |
| `app/api/v1/` directory | Deleted — routers move into domain packages |
| `app/services/` directory | Deleted — services move into domain packages |
| `app/models/` directory | Deleted — models move into domain packages |
| `app/core/` | Untouched |
| `app/db/` | Untouched |
| `app/main.py` | Router registration imports updated |
| URL routes (`/api/v1/...`) | **Unchanged** — prefix stays on each router |

### Model Consolidation

`models/ioc.py` merges into `cases/models.py`. IOCs are only referenced by cases, so they belong in the same module. No other cross-domain model merges are needed.

### mock_incident_feed.py Placement

Moves to `cases/mock_feed.py` because it generates `Case` objects and calls `case_service`. It is a cases concern.

---

## Data Flow

No change to runtime data flow. The restructure is purely organizational:

```
Request → main.py → domain/router.py → domain/service.py → db/ → Response
```

Cross-domain dependencies remain valid (e.g. `console/service.py` imports from `cases/service.py`) — these are explicit imports, not circular.

---

## Error Handling

No changes. All existing error handling, HTTP exceptions, and dependency injection patterns carry over unchanged.

---

## Testing

Tests mirror the new domain structure:

```
backend/tests/
├── auth/
│   └── test_auth.py               (was tests/test_auth.py)
├── cases/
│   ├── test_cases.py              (was tests/test_cases.py)
│   └── test_mock_feed.py          (was tests/test_mock_incident_feed.py)
├── playbooks/
│   └── test_playbook_engine.py    (was tests/test_playbook_engine.py)
├── mcp/
│   └── test_mcp_case.py           (was tests/test_mcp_case.py)
├── console/
│   └── test_console_history.py    (was tests/test_console_history.py)
├── db/
│   └── test_bootstrap.py          (was tests/test_bootstrap.py — cross-domain infra test)
└── conftest.py                    (unchanged — shared fixtures)
```

Test logic does not change — only import paths update.

---

## Implementation Order

1. Create all domain `__init__.py` files
2. Move and rename files domain by domain (cases first — largest)
3. Update imports within each moved file
4. Update `main.py` router registration
5. Move and rename test files
6. Update test import paths
7. Run full test suite — all tests must pass before done

---

## Success Criteria

- All existing tests pass with no logic changes
- No `app/api/`, `app/services/`, or `app/models/` directories remain
- Each domain directory is self-contained: router + service + models in one place
- `app/core/` and `app/db/` remain untouched
