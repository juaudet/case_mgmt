# Backend Restructure — Feature-Based Domain Modules

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `backend/app/` from a layer-based layout (api/, services/, models/) into feature-based domain packages (auth/, cases/, playbooks/, enrichment/, mcp/, console/) where each domain owns its router, service, and models.

**Architecture:** Each domain package is self-contained — its router, service logic, and Pydantic models live together in one directory. Shared infrastructure (`core/`, `db/`) is untouched. File content is preserved; only module paths and import statements change.

**Tech Stack:** Python 3.11+, FastAPI, Motor (async MongoDB), Pydantic v2, pytest-asyncio

---

## File Map

### Created
- `backend/app/auth/__init__.py`
- `backend/app/auth/models.py` ← `app/models/user.py`
- `backend/app/auth/service.py` ← `app/services/auth_service.py`
- `backend/app/auth/router.py` ← `app/api/v1/auth.py`
- `backend/app/cases/__init__.py`
- `backend/app/cases/models.py` ← `app/models/case.py` + `app/models/ioc.py` merged
- `backend/app/cases/service.py` ← `app/services/case_service.py`
- `backend/app/cases/parsers.py` ← `app/services/source_parsers.py`
- `backend/app/cases/mock_feed.py` ← `app/services/mock_incident_feed.py`
- `backend/app/cases/router.py` ← `app/api/v1/cases.py`
- `backend/app/playbooks/__init__.py`
- `backend/app/playbooks/models.py` ← `app/models/playbook.py`
- `backend/app/playbooks/engine.py` ← `app/services/playbook_engine.py`
- `backend/app/playbooks/router.py` ← `app/api/v1/playbooks.py`
- `backend/app/enrichment/__init__.py`
- `backend/app/enrichment/tines_client.py` ← `app/services/tines_client.py`
- `backend/app/enrichment/tines_mcp_bridge.py` ← `app/services/tines_mcp_bridge.py`
- `backend/app/enrichment/service.py` ← `app/services/enrichment_service.py`
- `backend/app/enrichment/router.py` ← `app/api/v1/enrichment.py`
- `backend/app/mcp/__init__.py`
- `backend/app/mcp/service.py` ← `app/services/mcp_case_service.py`
- `backend/app/mcp/router.py` ← `app/api/v1/mcp.py`
- `backend/app/console/__init__.py`
- `backend/app/console/service.py` ← `app/services/console_service.py`
- `backend/app/console/router.py` ← `app/api/v1/console.py`
- `backend/tests/auth/__init__.py`
- `backend/tests/cases/__init__.py`
- `backend/tests/playbooks/__init__.py`
- `backend/tests/mcp/__init__.py`
- `backend/tests/console/__init__.py`
- `backend/tests/db/__init__.py`
- `backend/tests/enrichment/__init__.py`

### Modified
- `backend/app/main.py` — update all domain router imports
- `backend/app/core/deps.py` — update `UserInDB`/`Role` import to `app.auth.models`

### Deleted
- `backend/app/api/` (entire directory)
- `backend/app/models/` (entire directory)
- `backend/app/services/` (entire directory — tines files moved to enrichment/ first)

### Moved (tests)
- `tests/test_auth.py` → `tests/auth/test_auth.py`
- `tests/test_cases.py` → `tests/cases/test_cases.py`
- `tests/test_mock_incident_feed.py` → `tests/cases/test_mock_feed.py`
- `tests/test_bootstrap.py` → `tests/db/test_bootstrap.py`
- `tests/test_playbook_engine.py` → `tests/playbooks/test_playbook_engine.py`
- `tests/test_mcp_case.py` → `tests/mcp/test_mcp_case.py`
- `tests/test_console_history.py` → `tests/console/test_console_history.py`

---

## Task 1: Confirm Baseline

**Files:** none

- [ ] **Step 1: Run the full test suite and confirm all tests pass**

```bash
cd backend
pytest -v
```

Expected: all tests pass (green). If any fail, fix them before proceeding — this plan assumes a clean baseline.

---

## Task 2: Create All Domain `__init__.py` Files

**Files:**
- Create: `backend/app/auth/__init__.py`
- Create: `backend/app/cases/__init__.py`
- Create: `backend/app/playbooks/__init__.py`
- Create: `backend/app/enrichment/__init__.py`
- Create: `backend/app/mcp/__init__.py`
- Create: `backend/app/console/__init__.py`

- [ ] **Step 1: Create all empty `__init__.py` files**

```bash
mkdir -p backend/app/auth backend/app/cases backend/app/playbooks \
         backend/app/enrichment backend/app/mcp backend/app/console
touch backend/app/auth/__init__.py backend/app/cases/__init__.py \
      backend/app/playbooks/__init__.py backend/app/enrichment/__init__.py \
      backend/app/mcp/__init__.py backend/app/console/__init__.py
```

- [ ] **Step 2: Run tests — must still pass (nothing changed)**

```bash
pytest -v
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add backend/app/auth/__init__.py backend/app/cases/__init__.py \
        backend/app/playbooks/__init__.py backend/app/enrichment/__init__.py \
        backend/app/mcp/__init__.py backend/app/console/__init__.py
git commit -m "refactor: create domain package directories"
```

---

## Task 3: Auth Domain

Move user models, auth service, and auth router into `app/auth/`. Update every file that imports from the old paths. Delete the old files.

**Files:**
- Create: `backend/app/auth/models.py`
- Create: `backend/app/auth/service.py`
- Create: `backend/app/auth/router.py`
- Modify: `backend/app/core/deps.py`
- Modify: `backend/app/api/v1/cases.py`
- Modify: `backend/app/api/v1/enrichment.py`
- Modify: `backend/app/api/v1/mcp.py`
- Modify: `backend/app/api/v1/playbooks.py`
- Modify: `backend/app/api/v1/console.py`
- Modify: `backend/app/main.py`
- Delete: `backend/app/models/user.py`
- Delete: `backend/app/services/auth_service.py`

- [ ] **Step 1: Create `backend/app/auth/models.py`**

```python
from enum import Enum

from pydantic import BaseModel


class Role(str, Enum):
    analyst = "analyst"
    tier2 = "tier2"
    admin = "admin"


class UserBase(BaseModel):
    email: str
    full_name: str
    role: Role


class UserInDB(UserBase):
    id: str
    hashed_password: str


class UserPublic(UserBase):
    id: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
```

- [ ] **Step 2: Create `backend/app/auth/service.py`**

```python
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.models import UserInDB
from app.core.security import hash_password, verify_password


async def get_user_by_email(db: AsyncIOMotorDatabase, email: str) -> UserInDB | None:
    doc = await db.users.find_one({"email": email})
    if not doc:
        return None
    doc["id"] = str(doc.pop("_id"))
    return UserInDB(**doc)


async def authenticate_user(
    db: AsyncIOMotorDatabase, email: str, password: str
) -> UserInDB | None:
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def create_user(
    db: AsyncIOMotorDatabase,
    email: str,
    full_name: str,
    role: str,
    password: str,
) -> UserInDB:
    doc = {
        "email": email,
        "full_name": full_name,
        "role": role,
        "hashed_password": hash_password(password),
    }
    result = await db.users.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return UserInDB(**doc)
```

- [ ] **Step 3: Create `backend/app/auth/router.py`**

```python
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.models import TokenResponse, UserPublic
from app.core.config import settings
from app.core.deps import get_current_user, get_db, get_redis
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)

router = APIRouter()


@router.post("/auth/login", response_model=TokenResponse)
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> TokenResponse:
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token({"sub": user["email"], "role": user["role"]})
    refresh_token = create_refresh_token({"sub": user["email"]})
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        samesite="lax",
    )
    return TokenResponse(access_token=access_token)


@router.post("/auth/refresh", response_model=TokenResponse)
async def refresh(refresh_token: str = Cookie(default=None)) -> TokenResponse:
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    access_token = create_access_token({"sub": payload["sub"]})
    return TokenResponse(access_token=access_token)


@router.post("/auth/logout")
async def logout(
    response: Response,
    refresh_token: str = Cookie(default=None),
    redis=Depends(get_redis),
) -> dict:
    if refresh_token:
        await redis.setex(
            f"blocklist:{refresh_token}",
            settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
            "1",
        )
    response.delete_cookie("refresh_token")
    return {"detail": "Logged out"}


@router.get("/auth/me", response_model=UserPublic)
async def me(current_user=Depends(get_current_user)) -> UserPublic:
    return UserPublic(**current_user.model_dump())
```

- [ ] **Step 4: Update `backend/app/core/deps.py`**

Change line 6:
```python
# Before
from app.models.user import Role, UserInDB

# After
from app.auth.models import Role, UserInDB
```

- [ ] **Step 5: Update imports in remaining `app/api/v1/` routers**

In `backend/app/api/v1/cases.py` change line 7:
```python
# Before
from app.models.user import Role, UserInDB

# After
from app.auth.models import Role, UserInDB
```

In `backend/app/api/v1/enrichment.py` change line 9:
```python
# Before
from app.models.user import UserInDB

# After
from app.auth.models import UserInDB
```

In `backend/app/api/v1/mcp.py` change line 6:
```python
# Before
from app.models.user import UserInDB

# After
from app.auth.models import UserInDB
```

In `backend/app/api/v1/playbooks.py` change line 8:
```python
# Before
from app.models.user import UserInDB

# After
from app.auth.models import UserInDB
```

In `backend/app/api/v1/console.py` change line 12:
```python
# Before
from app.models.user import UserInDB

# After
from app.auth.models import UserInDB
```

- [ ] **Step 6: Update `backend/app/main.py` — swap auth router import**

```python
import asyncio
import contextlib
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import router as auth_router
from app.api.v1 import cases, console, enrichment, mcp, playbooks
from app.core.config import settings
from app.db.mongo import connect_mongo, disconnect_mongo, get_database
from app.db.redis import connect_redis, disconnect_redis, get_redis_client
from app.db.bootstrap import ensure_demo_data

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_mongo()
    await connect_redis()
    app.state.db = get_database()
    app.state.redis = get_redis_client()
    await ensure_demo_data(app.state.db, settings.DEMO_MODE)
    feed_task: asyncio.Task[None] | None = None
    if settings.DEMO_MODE and settings.MOCK_INCIDENT_FEED:
        from app.services.mock_incident_feed import run_mock_incident_feed

        feed_task = asyncio.create_task(run_mock_incident_feed(app.state.db))
        logger.info("Mock incident feed started (synthetic cases every 10–30s)")
    yield
    if feed_task is not None:
        feed_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await feed_task
        logger.info("Mock incident feed stopped")
    await disconnect_mongo()
    await disconnect_redis()


app = FastAPI(title="SIEM Case Manager API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/v1", tags=["auth"])
app.include_router(cases.router, prefix="/api/v1", tags=["cases"])
app.include_router(playbooks.router, prefix="/api/v1", tags=["playbooks"])
app.include_router(enrichment.router, prefix="/api/v1", tags=["enrichment"])
app.include_router(mcp.router, prefix="/api/v1", tags=["mcp"])
app.include_router(console.router, prefix="/api/v1", tags=["console"])


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
```

- [ ] **Step 7: Delete the old files**

```bash
rm backend/app/models/user.py
rm backend/app/services/auth_service.py
```

- [ ] **Step 8: Run tests — must pass**

```bash
cd backend && pytest -v
```

Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add backend/app/auth/ backend/app/core/deps.py \
        backend/app/api/v1/cases.py backend/app/api/v1/enrichment.py \
        backend/app/api/v1/mcp.py backend/app/api/v1/playbooks.py \
        backend/app/api/v1/console.py backend/app/main.py
git commit -m "refactor: move auth domain to app/auth/"
```

---

## Task 4: Cases Domain

Move case + IOC models, case service, parsers, mock feed, and cases router into `app/cases/`. The two model files (`case.py` and `ioc.py`) are merged into one `models.py`.

**Files:**
- Create: `backend/app/cases/models.py`
- Create: `backend/app/cases/service.py`
- Create: `backend/app/cases/parsers.py`
- Create: `backend/app/cases/mock_feed.py`
- Create: `backend/app/cases/router.py`
- Modify: `backend/app/api/v1/console.py`
- Modify: `backend/app/services/console_service.py`
- Modify: `backend/app/main.py`
- Delete: `backend/app/models/case.py`
- Delete: `backend/app/models/ioc.py`
- Delete: `backend/app/services/case_service.py`
- Delete: `backend/app/services/source_parsers.py`
- Delete: `backend/app/services/mock_incident_feed.py`
- Delete: `backend/app/api/v1/cases.py`

- [ ] **Step 1: Create `backend/app/cases/models.py`**

Merged content of `app/models/case.py` and `app/models/ioc.py`:

```python
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class Severity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class CaseStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    closed = "closed"
    false_positive = "false_positive"


class IOCType(str, Enum):
    ipv4 = "ipv4"
    sha256 = "sha256"
    domain = "domain"
    url = "url"
    email = "email"


class IOCCreate(BaseModel):
    type: IOCType
    value: str


class IOCRef(BaseModel):
    type: str
    value: str
    score: int | None = None
    label: str | None = None


class IOC(BaseModel):
    id: str
    case_id: str
    type: IOCType
    value: str
    score: int | None = None
    label: str | None = None
    vt_data: dict | None = None
    created_at: datetime
    enriched_at: datetime | None = None


class TimelineEvent(BaseModel):
    timestamp: datetime
    actor: str
    action: str
    detail: str


class MCPCallRecord(BaseModel):
    id: str
    provider: str
    tool_name: str
    params: dict
    status: str
    duration_ms: int | None = None
    result_summary: dict = {}
    raw_result: dict = {}
    created_at: datetime
    actor: str


class MCPFinding(BaseModel):
    id: str
    source: str
    title: str
    severity: str
    fields: dict
    created_at: datetime


class ConsoleHistoryTurn(BaseModel):
    id: str
    prompt: str
    response: str
    template: str | None = None
    context_flags: dict = {}
    sources_used: list[str] = []
    created_at: datetime
    actor: str


class CaseBase(BaseModel):
    title: str
    description: str
    severity: Severity
    status: CaseStatus = CaseStatus.open
    assigned_to: str | None = None
    mitre_tactics: list[str] = []
    mitre_techniques: list[str] = []
    tags: list[str] = []


class CaseCreate(CaseBase):
    iocs: list[IOCRef] = Field(default_factory=list)


class CaseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    severity: Severity | None = None
    status: CaseStatus | None = None
    assigned_to: str | None = None
    mitre_tactics: list[str] | None = None
    mitre_techniques: list[str] | None = None
    tags: list[str] | None = None


class Case(CaseBase):
    id: str
    case_number: str
    created_at: datetime
    updated_at: datetime
    created_by: str
    timeline: list[TimelineEvent] = []
    iocs: list[IOCRef] = []
    mcp_calls: list[MCPCallRecord] = []
    mcp_findings: list[MCPFinding] = []
    console_history: list[ConsoleHistoryTurn] = []
    sla_deadline: datetime | None = None
    ldap_context: dict | None = None
    vt_results: dict | None = None
    abuseipdb_results: dict | None = None
    playbook_id: str | None = None
    playbook_state: dict | None = None
    parent_case_id: str | None = None


class CaseListItem(BaseModel):
    id: str
    case_number: str
    title: str
    severity: Severity
    status: CaseStatus
    assigned_to: str | None = None
    created_at: datetime
    updated_at: datetime
    ioc_count: int = 0
    sla_deadline: datetime | None = None
```

- [ ] **Step 2: Create `backend/app/cases/service.py`**

```python
from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.cases.models import Case, CaseCreate, CaseListItem, CaseUpdate, IOCRef, TimelineEvent


def _normalize_assigned_to(value: object) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value or None
    if isinstance(value, list):
        if not value:
            return None
        first = value[0]
        return str(first) if first is not None else None
    return str(value)


async def get_next_case_number(db: AsyncIOMotorDatabase) -> str:
    year = datetime.now(timezone.utc).year
    count = await db.cases.count_documents({"year": year})
    return f"CASE-{year}-{count + 1:04d}"


async def create_case(db: AsyncIOMotorDatabase, data: CaseCreate, created_by: str) -> Case:
    case_number = await get_next_case_number(db)
    now = datetime.now(timezone.utc)
    payload = data.model_dump()
    initial_iocs = payload.pop("iocs", [])
    doc = {
        **payload,
        "case_number": case_number,
        "year": now.year,
        "created_at": now,
        "updated_at": now,
        "created_by": created_by,
        "timeline": [
            {
                "timestamp": now,
                "actor": created_by,
                "action": "created",
                "detail": "Case created",
            }
        ],
        "iocs": initial_iocs,
        "mcp_calls": [],
        "mcp_findings": [],
        "console_history": [],
    }
    result = await db.cases.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return _doc_to_case(doc)


async def get_case(db: AsyncIOMotorDatabase, case_id: str) -> Case | None:
    try:
        oid = ObjectId(case_id)
    except Exception:
        return None
    doc = await db.cases.find_one({"_id": oid})
    if not doc:
        return None
    return _doc_to_case(doc)


async def list_cases(
    db: AsyncIOMotorDatabase,
    skip: int = 0,
    limit: int = 50,
    status: str | None = None,
    severity: str | None = None,
    assigned_to: str | None = None,
) -> list[CaseListItem]:
    query: dict = {}
    if status:
        query["status"] = status
    if severity:
        query["severity"] = severity
    if assigned_to:
        query["assigned_to"] = assigned_to
    cursor = db.cases.find(query).sort("updated_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [_doc_to_list_item(d) for d in docs]


async def update_case(
    db: AsyncIOMotorDatabase, case_id: str, data: CaseUpdate, actor: str
) -> Case | None:
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    now = datetime.now(timezone.utc)
    update_data["updated_at"] = now
    changed_fields = [k for k in update_data if k != "updated_at"]
    timeline_event = {
        "timestamp": now,
        "actor": actor,
        "action": "updated",
        "detail": f"Updated fields: {', '.join(changed_fields)}",
    }
    result = await db.cases.find_one_and_update(
        {"_id": ObjectId(case_id)},
        {"$set": update_data, "$push": {"timeline": timeline_event}},
        return_document=True,
    )
    if not result:
        return None
    return _doc_to_case(result)


async def delete_case(db: AsyncIOMotorDatabase, case_id: str) -> bool:
    result = await db.cases.delete_one({"_id": ObjectId(case_id)})
    return result.deleted_count > 0


async def add_timeline_event(
    db: AsyncIOMotorDatabase, case_id: str, event: TimelineEvent
) -> Case | None:
    now = datetime.now(timezone.utc)
    result = await db.cases.find_one_and_update(
        {"_id": ObjectId(case_id)},
        {
            "$push": {"timeline": event.model_dump()},
            "$set": {"updated_at": now},
        },
        return_document=True,
    )
    if not result:
        return None
    return _doc_to_case(result)


async def add_ioc(
    db: AsyncIOMotorDatabase, case_id: str, ioc: IOCRef, actor: str
) -> Case | None:
    now = datetime.now(timezone.utc)
    timeline_event = {
        "timestamp": now,
        "actor": actor,
        "action": "ioc_added",
        "detail": f"IOC added: {ioc.type}:{ioc.value}",
    }
    result = await db.cases.find_one_and_update(
        {"_id": ObjectId(case_id)},
        {
            "$push": {"iocs": ioc.model_dump(), "timeline": timeline_event},
            "$set": {"updated_at": now},
        },
        return_document=True,
    )
    if not result:
        return None
    return _doc_to_case(result)


async def remove_ioc(
    db: AsyncIOMotorDatabase, case_id: str, ioc_value: str, actor: str
) -> Case | None:
    now = datetime.now(timezone.utc)
    timeline_event = {
        "timestamp": now,
        "actor": actor,
        "action": "ioc_removed",
        "detail": f"IOC removed: {ioc_value}",
    }
    result = await db.cases.find_one_and_update(
        {"_id": ObjectId(case_id)},
        {
            "$pull": {"iocs": {"value": ioc_value}},
            "$push": {"timeline": timeline_event},
            "$set": {"updated_at": now},
        },
        return_document=True,
    )
    if not result:
        return None
    return _doc_to_case(result)


def _doc_to_case(doc: dict) -> Case:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id", doc.get("id", "")))
    doc.pop("year", None)
    if "assigned_to" in doc:
        doc["assigned_to"] = _normalize_assigned_to(doc["assigned_to"])
    return Case(**doc)


def _doc_to_list_item(doc: dict) -> CaseListItem:
    return CaseListItem(
        id=str(doc["_id"]),
        case_number=doc["case_number"],
        title=doc["title"],
        severity=doc["severity"],
        status=doc["status"],
        assigned_to=_normalize_assigned_to(doc.get("assigned_to")),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
        ioc_count=len(doc.get("iocs", [])),
        sla_deadline=doc.get("sla_deadline"),
    )
```

- [ ] **Step 3: Create `backend/app/cases/parsers.py`**

```python
from __future__ import annotations

from app.cases.models import CaseCreate, CaseStatus, IOCRef, Severity


def parse_provider_incident(provider: str, payload: dict) -> tuple[CaseCreate, list[IOCRef]]:
    normalized_provider = provider.strip().lower()
    if normalized_provider == "sentinel":
        return _parse_sentinel(payload)
    if normalized_provider == "splunk":
        return _parse_splunk(payload)
    raise ValueError(f"Unsupported provider: {provider}")


def _parse_sentinel(payload: dict) -> tuple[CaseCreate, list[IOCRef]]:
    properties = payload.get("properties", {})
    owner = properties.get("owner", {})
    title = properties.get("title") or payload.get("name") or "Sentinel incident"
    description = properties.get("description") or "Imported from Microsoft Sentinel"
    severity = _map_sentinel_severity(properties.get("severity"))
    status = _map_sentinel_status(properties.get("status"))

    tags = ["sentinel"]
    provider_name = properties.get("providerName")
    if provider_name:
        tags.append(provider_name.lower().replace(" ", "-"))

    incident_number = properties.get("incidentNumber")
    if incident_number is not None:
        tags.append(f"incident-{incident_number}")

    assigned_to = owner.get("email") or owner.get("userPrincipalName")

    return (
        CaseCreate(
            title=title,
            description=description,
            severity=severity,
            status=status,
            assigned_to=assigned_to,
            tags=list(dict.fromkeys(tags)),
        ),
        _extract_sentinel_iocs(payload),
    )


def _parse_splunk(payload: dict) -> tuple[CaseCreate, list[IOCRef]]:
    result = payload.get("result", payload)
    title = (
        result.get("title")
        or result.get("rule_name")
        or result.get("search_name")
        or "Splunk incident"
    )
    description = (
        result.get("description")
        or result.get("message")
        or result.get("_raw")
        or "Imported from Splunk"
    )
    severity = _map_splunk_severity(result.get("severity") or result.get("urgency"))
    status = _map_splunk_status(result.get("status"))
    assigned_to = result.get("owner") or result.get("assigned_to")

    tags = ["splunk"]
    if result.get("app"):
        tags.append(str(result["app"]).lower())
    if result.get("source"):
        tags.append(str(result["source"]).lower())

    return (
        CaseCreate(
            title=title,
            description=description,
            severity=severity,
            status=status,
            assigned_to=assigned_to,
            tags=list(dict.fromkeys(tags)),
        ),
        [],
    )


def _extract_sentinel_iocs(payload: dict) -> list[IOCRef]:
    entities = payload.get("entities")
    if entities is None and isinstance(payload.get("incident_entities"), dict):
        entities = payload["incident_entities"].get("entities")
    if entities is None:
        entities = payload.get("related_entities")
    if not isinstance(entities, list):
        return []

    iocs: list[IOCRef] = []
    seen: set[tuple[str, str]] = set()
    for entity in entities:
        if not isinstance(entity, dict):
            continue
        kind = str(entity.get("kind", "")).lower()
        props = entity.get("properties", {}) if isinstance(entity.get("properties"), dict) else {}

        candidates: list[tuple[str, str]] = []
        if kind == "ip" and props.get("address"):
            address = str(props["address"]).strip()
            ioc_type = "ipv6" if ":" in address else "ipv4"
            candidates.append((ioc_type, address))
        elif kind == "dnsresolution" and props.get("domainName"):
            candidates.append(("domain", str(props["domainName"]).strip().lower()))
        elif kind == "url" and props.get("url"):
            candidates.append(("url", str(props["url"]).strip()))
        elif kind == "filehash" and props.get("hashValue"):
            algorithm = str(props.get("algorithm", "hash")).strip().lower()
            candidates.append((algorithm, str(props["hashValue"]).strip().lower()))
        elif kind in {"account", "mailbox"}:
            value = props.get("upn") or props.get("mailboxPrimaryAddress")
            if value:
                candidates.append(("email", str(value).strip().lower()))

        for ioc_type, value in candidates:
            if not value:
                continue
            key = (ioc_type, value)
            if key in seen:
                continue
            seen.add(key)
            iocs.append(IOCRef(type=ioc_type, value=value, label=f"sentinel:{kind}"))
    return iocs


def _map_sentinel_severity(value: str | None) -> Severity:
    mapping = {
        "high": Severity.critical,
        "medium": Severity.high,
        "low": Severity.medium,
        "informational": Severity.low,
    }
    return mapping.get((value or "").strip().lower(), Severity.medium)


def _map_sentinel_status(value: str | None) -> CaseStatus:
    mapping = {
        "new": CaseStatus.open,
        "active": CaseStatus.in_progress,
        "closed": CaseStatus.closed,
    }
    return mapping.get((value or "").strip().lower(), CaseStatus.open)


def _map_splunk_severity(value: str | None) -> Severity:
    normalized = (value or "").strip().lower()
    mapping = {
        "critical": Severity.critical,
        "high": Severity.high,
        "medium": Severity.medium,
        "low": Severity.low,
        "info": Severity.low,
        "informational": Severity.low,
        "1": Severity.critical,
        "2": Severity.high,
        "3": Severity.medium,
        "4": Severity.low,
        "5": Severity.low,
    }
    return mapping.get(normalized, Severity.medium)


def _map_splunk_status(value: str | None) -> CaseStatus:
    normalized = (value or "").strip().lower()
    mapping = {
        "new": CaseStatus.open,
        "open": CaseStatus.open,
        "in_progress": CaseStatus.in_progress,
        "in progress": CaseStatus.in_progress,
        "active": CaseStatus.in_progress,
        "resolved": CaseStatus.closed,
        "closed": CaseStatus.closed,
        "false_positive": CaseStatus.false_positive,
        "false positive": CaseStatus.false_positive,
    }
    return mapping.get(normalized, CaseStatus.open)
```

- [ ] **Step 4: Create `backend/app/cases/mock_feed.py`**

```python
"""Periodic synthetic cases for demo / local SIEM queue simulation."""

from __future__ import annotations

import asyncio
import logging
import random
from typing import Final

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.cases.models import CaseCreate, CaseStatus, IOCRef, Severity
from app.cases import service as case_service

logger = logging.getLogger(__name__)

_MIN_INTERVAL_S: Final[float] = 10.0
_MAX_INTERVAL_S: Final[float] = 30.0

_SCENARIO_TEMPLATES: Final[list[tuple[str, str]]] = [
    (
        "Possible password spray against VPN gateway",
        "Multiple failed authentications from distributed IPv4 sources targeting the same VPN account within a 10-minute window.",
    ),
    (
        "Suspicious PowerShell encoded command on workstation",
        "EDR flagged -EncodedCommand usage with no signed script path; parent process explorer.exe.",
    ),
    (
        "Azure AD risky sign-in — unfamiliar location",
        "Conditional Access reported medium risk: successful sign-in from ASN not seen for this user in 90 days.",
    ),
    (
        "O365 mass download anomaly",
        "SharePoint sync client downloaded >2k files in 15 minutes from a single session.",
    ),
    (
        "Lateral movement via WMI execution",
        "Detections correlated wmiprvse.exe spawning cmd.exe on three hosts in the same subnet.",
    ),
    (
        "Phishing link clicked — credential harvester domain",
        "Safe Links rewrite hit a known typosquat domain; user submitted credentials before block page.",
    ),
    (
        "Container escape attempt signal",
        "Falco rule: unexpected mount of host /proc from namespace breakout pattern.",
    ),
    (
        "Database client anomaly — off-hours bulk SELECT",
        "Application service account issued large sequential queries against PII tables outside maintenance window.",
    ),
]

_SOURCES: Final[list[str]] = ["sentinel", "splunk"]

_MOCK_IOC_POOL: Final[list[IOCRef]] = [
    IOCRef(type="ipv4", value="203.0.113.41", score=68, label="auth-source"),
    IOCRef(type="ipv4", value="198.51.100.12", score=55, label="distributed-source"),
    IOCRef(type="ipv4", value="192.0.2.88", score=61, label="session-origin"),
    IOCRef(type="domain", value="login-secure-upd.example.net", score=82, label="credential-phish"),
    IOCRef(type="domain", value="cdn-assets.typosquat.test", score=74, label="typosquat"),
    IOCRef(type="url", value="https://malicious.example/login", score=79, label="harvester-url"),
    IOCRef(
        type="sha256",
        value="a3f1c9b2e847d6f0391cc52a4e1b7f3da3f1c9b2e847d6f0391cc52a4e1b7f3d",
        score=91,
        label="encoded-payload",
    ),
    IOCRef(
        type="sha256",
        value="b4e2d0c3f958e7a140a2dd63b5f2c8e4b4e2d0c3f958e7a140a2dd63b5f2c8e4",
        score=77,
        label="suspicious-module",
    ),
    IOCRef(type="email", value="svc-batch@corp.local", score=22, label="service-account"),
    IOCRef(type="email", value="victim.user@corp.local", score=12, label="mailbox"),
]


def build_random_mock_case_create() -> CaseCreate:
    source = random.choice(_SOURCES)
    title, description = random.choice(_SCENARIO_TEMPLATES)
    suffix = random.randint(1000, 9999)
    ioc_n = random.randint(1, 3)
    iocs = random.sample(_MOCK_IOC_POOL, k=min(ioc_n, len(_MOCK_IOC_POOL)))
    return CaseCreate(
        title=f"[{source.upper()}] {title} (#{suffix})",
        description=f"{description} Source: {source}.",
        severity=random.choice(list(Severity)),
        status=CaseStatus.open,
        assigned_to=None,
        tags=["mock-feed", "synthetic", source],
        mitre_tactics=random.sample(
            ["initial-access", "execution", "persistence", "credential-access", "lateral-movement"],
            k=random.randint(0, 2),
        ),
        mitre_techniques=random.sample(
            ["T1078", "T1059.001", "T1110", "T1021.002", "T1566.002"],
            k=random.randint(0, 2),
        ),
        iocs=iocs,
    )


async def run_mock_incident_feed(db: AsyncIOMotorDatabase) -> None:
    """Insert a synthetic case every 10-30 seconds until cancelled."""
    try:
        while True:
            await asyncio.sleep(random.uniform(_MIN_INTERVAL_S, _MAX_INTERVAL_S))
            data = build_random_mock_case_create()
            try:
                await case_service.create_case(db, data, created_by="mock-incident-feed")
            except Exception:
                logger.exception("Mock incident feed failed to create case")
                continue
            logger.info("Inserted mock incident case: %s", data.title)
    except asyncio.CancelledError:
        logger.debug("Mock incident feed cancelled")
        raise
```

- [ ] **Step 5: Create `backend/app/cases/router.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.auth.models import Role, UserInDB
from app.cases.models import Case, CaseCreate, CaseListItem, CaseUpdate, IOCRef, TimelineEvent
from app.cases import service as case_service
from app.cases.parsers import parse_provider_incident
from app.core.deps import get_current_user, get_db, require_role

router = APIRouter()


class ProviderIngestBody(BaseModel):
    payload: dict


@router.get("/cases", response_model=list[CaseListItem])
async def list_cases(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: str | None = Query(None),
    severity: str | None = Query(None),
    assigned_to: str | None = Query(None),
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[CaseListItem]:
    return await case_service.list_cases(
        db, skip=skip, limit=limit, status=status, severity=severity, assigned_to=assigned_to
    )


@router.post("/cases", response_model=Case, status_code=status.HTTP_201_CREATED)
async def create_case(
    body: CaseCreate,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Case:
    return await case_service.create_case(db, body, created_by=current_user.email)


@router.post("/cases/ingest/{provider}", response_model=Case, status_code=status.HTTP_201_CREATED)
async def ingest_case(
    provider: str,
    body: ProviderIngestBody,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Case:
    try:
        case_data, parsed_iocs = parse_provider_incident(provider, body.payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not parsed_iocs:
        parsed_iocs = [
            IOCRef(
                type="domain",
                value="no-iocs-in-source.invalid",
                label="No structured IOCs in provider payload",
            )
        ]
    created_case = await case_service.create_case(db, case_data, created_by=current_user.email)
    enriched_case = created_case
    for ioc in parsed_iocs:
        updated_case = await case_service.add_ioc(
            db, created_case.id, ioc, actor=current_user.email
        )
        if updated_case:
            enriched_case = updated_case
    return enriched_case


@router.get("/cases/{case_id}", response_model=Case)
async def get_case(
    case_id: str,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Case:
    case = await case_service.get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.patch("/cases/{case_id}", response_model=Case)
async def update_case(
    case_id: str,
    body: CaseUpdate,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Case:
    case = await case_service.update_case(db, case_id, body, actor=current_user.email)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.delete("/cases/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case(
    case_id: str,
    current_user: UserInDB = Depends(require_role(Role.admin)),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> None:
    deleted = await case_service.delete_case(db, case_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Case not found")


@router.post("/cases/{case_id}/timeline", response_model=Case)
async def add_timeline_event(
    case_id: str,
    event: TimelineEvent,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Case:
    case = await case_service.add_timeline_event(db, case_id, event)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.post("/cases/{case_id}/iocs", response_model=Case)
async def add_ioc(
    case_id: str,
    ioc: IOCRef,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Case:
    case = await case_service.add_ioc(db, case_id, ioc, actor=current_user.email)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.delete("/cases/{case_id}/iocs/{ioc_value}", response_model=Case)
async def remove_ioc(
    case_id: str,
    ioc_value: str,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Case:
    case = await case_service.remove_ioc(db, case_id, ioc_value, actor=current_user.email)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case
```

- [ ] **Step 6: Update `backend/app/services/console_service.py`**

Change line 1:
```python
# Before
from app.models.case import Case

# After
from app.cases.models import Case
```

- [ ] **Step 7: Update `backend/app/api/v1/console.py`**

Change lines 15-16:
```python
# Before
from app.services.case_service import get_case
from app.services.console_service import build_system_prompt

# After
from app.cases.service import get_case
from app.services.console_service import build_system_prompt
```

- [ ] **Step 8: Update `backend/app/main.py`**

```python
import asyncio
import contextlib
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import router as auth_router
from app.cases import router as cases_router
from app.api.v1 import console, enrichment, mcp, playbooks
from app.core.config import settings
from app.db.mongo import connect_mongo, disconnect_mongo, get_database
from app.db.redis import connect_redis, disconnect_redis, get_redis_client
from app.db.bootstrap import ensure_demo_data

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_mongo()
    await connect_redis()
    app.state.db = get_database()
    app.state.redis = get_redis_client()
    await ensure_demo_data(app.state.db, settings.DEMO_MODE)
    feed_task: asyncio.Task[None] | None = None
    if settings.DEMO_MODE and settings.MOCK_INCIDENT_FEED:
        from app.cases.mock_feed import run_mock_incident_feed

        feed_task = asyncio.create_task(run_mock_incident_feed(app.state.db))
        logger.info("Mock incident feed started (synthetic cases every 10–30s)")
    yield
    if feed_task is not None:
        feed_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await feed_task
        logger.info("Mock incident feed stopped")
    await disconnect_mongo()
    await disconnect_redis()


app = FastAPI(title="SIEM Case Manager API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/v1", tags=["auth"])
app.include_router(cases_router.router, prefix="/api/v1", tags=["cases"])
app.include_router(playbooks.router, prefix="/api/v1", tags=["playbooks"])
app.include_router(enrichment.router, prefix="/api/v1", tags=["enrichment"])
app.include_router(mcp.router, prefix="/api/v1", tags=["mcp"])
app.include_router(console.router, prefix="/api/v1", tags=["console"])


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
```

- [ ] **Step 9: Delete old files**

```bash
rm backend/app/models/case.py
rm backend/app/models/ioc.py
rm backend/app/services/case_service.py
rm backend/app/services/source_parsers.py
rm backend/app/services/mock_incident_feed.py
rm backend/app/api/v1/cases.py
```

- [ ] **Step 10: Run tests — must pass**

```bash
cd backend && pytest -v
```

Expected: all tests pass.

- [ ] **Step 11: Commit**

```bash
git add backend/app/cases/ backend/app/services/console_service.py \
        backend/app/api/v1/console.py backend/app/main.py
git commit -m "refactor: move cases domain to app/cases/"
```

---

## Task 5: Playbooks Domain

**Files:**
- Create: `backend/app/playbooks/models.py`
- Create: `backend/app/playbooks/engine.py`
- Create: `backend/app/playbooks/router.py`
- Modify: `backend/app/main.py`
- Delete: `backend/app/models/playbook.py`
- Delete: `backend/app/services/playbook_engine.py`
- Delete: `backend/app/api/v1/playbooks.py`

- [ ] **Step 1: Create `backend/app/playbooks/models.py`**

```python
from datetime import datetime

from pydantic import BaseModel


class Branch(BaseModel):
    when: str
    goto: str
    label: str


class PlaybookStep(BaseModel):
    step_id: str
    title: str
    description: str
    auto: bool = False
    mcp_tools: list[str] = []
    condition_field: str | None = None
    branches: list[Branch] = []
    default_goto: str | None = None
    mitre_technique: str | None = None


class Playbook(BaseModel):
    id: str
    name: str
    description: str
    mitre_tactics: list[str] = []
    steps: list[PlaybookStep] = []


class PlaybookExecutionState(BaseModel):
    playbook_id: str
    current_step_id: str
    completed_steps: list[str] = []
    step_results: dict[str, dict] = {}
    started_at: datetime
    completed_at: datetime | None = None


class StepCompleteRequest(BaseModel):
    result_data: dict
```

- [ ] **Step 2: Create `backend/app/playbooks/engine.py`**

```python
from bson import ObjectId

from app.playbooks.models import Branch


def evaluate_branch(
    condition_field: str,
    result_data: dict,
    branches: list[Branch],
    default_goto: str | None,
) -> str:
    value = result_data.get(condition_field)
    for branch in branches:
        op, operand = branch.when.split(":", 1)
        try:
            if op == "gte" and float(value) >= float(operand):
                return branch.goto
            if op == "lt" and float(value) < float(operand):
                return branch.goto
            if op == "eq" and str(value) == operand:
                return branch.goto
            if op == "contains" and operand in str(value):
                return branch.goto
            if op == "bool" and bool(value) == (operand == "true"):
                return branch.goto
        except (TypeError, ValueError):
            continue
    return default_goto or "END"


async def advance_playbook(db, case_id: str, step_id: str, result_data: dict) -> str:
    """Complete a step and return the next step_id."""
    case = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case:
        return "END"

    pb_state = case.get("playbook_state") or {}
    playbook_id = case.get("playbook_id")
    if not playbook_id:
        return "END"

    playbook = await db.playbooks.find_one({"id": playbook_id})
    if not playbook:
        return "END"

    step = next((s for s in playbook["steps"] if s["step_id"] == step_id), None)
    if not step:
        return "END"

    completed = pb_state.get("completed_steps", [])
    step_results = pb_state.get("step_results", {})
    completed.append(step_id)
    step_results[step_id] = result_data

    if step.get("condition_field") and step.get("branches"):
        branches = [Branch(**b) for b in step["branches"]]
        next_step = evaluate_branch(
            step["condition_field"], result_data, branches, step.get("default_goto")
        )
    elif step.get("default_goto"):
        next_step = step["default_goto"]
    else:
        next_step = "END"

    new_state = {
        "playbook_id": playbook_id,
        "current_step_id": next_step,
        "completed_steps": completed,
        "step_results": step_results,
    }
    await db.cases.update_one(
        {"_id": ObjectId(case_id)}, {"$set": {"playbook_state": new_state}}
    )
    return next_step
```

- [ ] **Step 3: Create `backend/app/playbooks/router.py`**

```python
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.models import UserInDB
from app.core.deps import get_current_user, get_db
from app.playbooks.engine import advance_playbook
from app.playbooks.models import Playbook, PlaybookExecutionState, StepCompleteRequest
from pydantic import BaseModel

router = APIRouter()


class StartPlaybookRequest(BaseModel):
    playbook_id: str


@router.get("/playbooks", response_model=list[Playbook])
async def list_playbooks(
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[Playbook]:
    docs = await db.playbooks.find({}).to_list(length=100)
    return [Playbook(**d) for d in docs]


@router.get("/playbooks/{playbook_id}", response_model=Playbook)
async def get_playbook(
    playbook_id: str,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Playbook:
    doc = await db.playbooks.find_one({"id": playbook_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Playbook not found")
    return Playbook(**doc)


@router.post("/cases/{case_id}/playbook/start", response_model=PlaybookExecutionState)
async def start_playbook(
    case_id: str,
    body: StartPlaybookRequest,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> PlaybookExecutionState:
    playbook_doc = await db.playbooks.find_one({"id": body.playbook_id})
    if not playbook_doc:
        raise HTTPException(status_code=404, detail="Playbook not found")

    if not playbook_doc.get("steps"):
        raise HTTPException(status_code=400, detail="Playbook has no steps")

    first_step_id = playbook_doc["steps"][0]["step_id"]
    now = datetime.now(timezone.utc)
    state = {
        "playbook_id": body.playbook_id,
        "current_step_id": first_step_id,
        "completed_steps": [],
        "step_results": {},
        "started_at": now,
    }

    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {"playbook_id": body.playbook_id, "playbook_state": state}},
    )

    return PlaybookExecutionState(**state)


@router.post("/cases/{case_id}/playbook/step/{step_id}/complete")
async def complete_step(
    case_id: str,
    step_id: str,
    body: StepCompleteRequest,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    next_step = await advance_playbook(db, case_id, step_id, body.result_data)
    return {"next_step_id": next_step, "completed_step_id": step_id}


@router.get("/cases/{case_id}/playbook/state", response_model=PlaybookExecutionState)
async def get_playbook_state(
    case_id: str,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> PlaybookExecutionState:
    doc = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Case not found")

    state = doc.get("playbook_state")
    if not state:
        raise HTTPException(status_code=404, detail="No active playbook on this case")

    return PlaybookExecutionState(**state)
```

- [ ] **Step 4: Update `backend/app/main.py`**

```python
import asyncio
import contextlib
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import router as auth_router
from app.cases import router as cases_router
from app.playbooks import router as playbooks_router
from app.api.v1 import console, enrichment, mcp
from app.core.config import settings
from app.db.mongo import connect_mongo, disconnect_mongo, get_database
from app.db.redis import connect_redis, disconnect_redis, get_redis_client
from app.db.bootstrap import ensure_demo_data

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_mongo()
    await connect_redis()
    app.state.db = get_database()
    app.state.redis = get_redis_client()
    await ensure_demo_data(app.state.db, settings.DEMO_MODE)
    feed_task: asyncio.Task[None] | None = None
    if settings.DEMO_MODE and settings.MOCK_INCIDENT_FEED:
        from app.cases.mock_feed import run_mock_incident_feed

        feed_task = asyncio.create_task(run_mock_incident_feed(app.state.db))
        logger.info("Mock incident feed started (synthetic cases every 10–30s)")
    yield
    if feed_task is not None:
        feed_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await feed_task
        logger.info("Mock incident feed stopped")
    await disconnect_mongo()
    await disconnect_redis()


app = FastAPI(title="SIEM Case Manager API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/v1", tags=["auth"])
app.include_router(cases_router.router, prefix="/api/v1", tags=["cases"])
app.include_router(playbooks_router.router, prefix="/api/v1", tags=["playbooks"])
app.include_router(enrichment.router, prefix="/api/v1", tags=["enrichment"])
app.include_router(mcp.router, prefix="/api/v1", tags=["mcp"])
app.include_router(console.router, prefix="/api/v1", tags=["console"])


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
```

- [ ] **Step 5: Delete old files**

```bash
rm backend/app/models/playbook.py
rm backend/app/services/playbook_engine.py
rm backend/app/api/v1/playbooks.py
```

- [ ] **Step 6: Run tests — must pass**

```bash
cd backend && pytest -v
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add backend/app/playbooks/ backend/app/main.py
git commit -m "refactor: move playbooks domain to app/playbooks/"
```

---

## Task 6: Enrichment Domain

**Files:**
- Create: `backend/app/enrichment/service.py`
- Create: `backend/app/enrichment/router.py`
- Modify: `backend/app/services/mcp_case_service.py`
- Modify: `backend/app/main.py`
- Delete: `backend/app/services/enrichment_service.py`
- Delete: `backend/app/api/v1/enrichment.py`

- [ ] **Step 1: Move Tines infrastructure files into `enrichment/`**

These files have no internal service dependencies and move without content changes:

```bash
cp backend/app/services/tines_client.py backend/app/enrichment/tines_client.py
cp backend/app/services/tines_mcp_bridge.py backend/app/enrichment/tines_mcp_bridge.py
rm backend/app/services/tines_client.py
rm backend/app/services/tines_mcp_bridge.py
```

- [ ] **Step 2: Create `backend/app/enrichment/service.py`**

```python
from app.core.config import settings
from app.enrichment.tines_client import call_tool as tines_call_tool
from app.enrichment.tines_mcp_bridge import resolve_tines_invocation


def _tines_webhook_url() -> str:
    return (settings.TINES_WEBHOOK_URL or settings.TINES_MCP_URL or "").strip()


async def call_mcp_tool(tool_name: str, params: dict) -> dict:
    """Run an enrichment tool: Tines webhook when not in demo; empty dict in DEMO_MODE."""
    if settings.DEMO_MODE:
        return {}
    url = _tines_webhook_url()
    if not url:
        return {"error": "TINES_WEBHOOK_URL or TINES_MCP_URL is not configured"}
    try:
        tines_name, arguments = resolve_tines_invocation(settings, tool_name, params)
    except ValueError as exc:
        return {"error": str(exc)}
    return await tines_call_tool(url, tines_name, arguments)


async def enrich_ioc(ioc_type: str, value: str) -> dict:
    results: dict = {}
    if ioc_type == "ipv4":
        results["virustotal"] = await call_mcp_tool("vt_ip_report", {"ip": value})
        results["abuseipdb"] = await call_mcp_tool("abuseipdb_check_ip", {"ip": value})
    elif ioc_type == "sha256":
        results["virustotal"] = await call_mcp_tool("vt_hash_lookup", {"hash": value})
    elif ioc_type == "domain":
        results["virustotal"] = await call_mcp_tool("vt_domain_scan", {"domain": value})
    return results
```

- [ ] **Step 3: Create `backend/app/enrichment/router.py`**

```python
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.auth.models import UserInDB
from app.core.deps import get_current_user, get_db
from app.enrichment.service import enrich_ioc

router = APIRouter()


class IOCEnrichRequest(BaseModel):
    type: str
    value: str


@router.post("/cases/{case_id}/enrich/ioc")
async def enrich_case_ioc(
    case_id: str,
    body: IOCEnrichRequest,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    case_doc = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case_doc:
        raise HTTPException(status_code=404, detail="Case not found")

    enrichment_results = await enrich_ioc(body.type, body.value)
    now = datetime.now(timezone.utc)

    update_fields: dict = {"updated_at": now}
    if enrichment_results.get("virustotal"):
        update_fields["vt_results"] = enrichment_results["virustotal"]
    if enrichment_results.get("abuseipdb"):
        update_fields["abuseipdb_results"] = enrichment_results["abuseipdb"]

    timeline_event = {
        "timestamp": now,
        "actor": current_user.email,
        "action": "enriched",
        "detail": f"IOC enrichment run for {body.type}:{body.value}",
    }

    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": update_fields, "$push": {"timeline": timeline_event}},
    )

    return {"ioc_type": body.type, "value": body.value, "results": enrichment_results}
```

- [ ] **Step 4: Update `backend/app/services/mcp_case_service.py`**

Change line 10:
```python
# Before
from app.services.enrichment_service import call_mcp_tool

# After
from app.enrichment.service import call_mcp_tool
```

- [ ] **Step 5: Update `backend/app/main.py`**

```python
import asyncio
import contextlib
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import router as auth_router
from app.cases import router as cases_router
from app.enrichment import router as enrichment_router
from app.playbooks import router as playbooks_router
from app.api.v1 import console, mcp
from app.core.config import settings
from app.db.mongo import connect_mongo, disconnect_mongo, get_database
from app.db.redis import connect_redis, disconnect_redis, get_redis_client
from app.db.bootstrap import ensure_demo_data

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_mongo()
    await connect_redis()
    app.state.db = get_database()
    app.state.redis = get_redis_client()
    await ensure_demo_data(app.state.db, settings.DEMO_MODE)
    feed_task: asyncio.Task[None] | None = None
    if settings.DEMO_MODE and settings.MOCK_INCIDENT_FEED:
        from app.cases.mock_feed import run_mock_incident_feed

        feed_task = asyncio.create_task(run_mock_incident_feed(app.state.db))
        logger.info("Mock incident feed started (synthetic cases every 10–30s)")
    yield
    if feed_task is not None:
        feed_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await feed_task
        logger.info("Mock incident feed stopped")
    await disconnect_mongo()
    await disconnect_redis()


app = FastAPI(title="SIEM Case Manager API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/v1", tags=["auth"])
app.include_router(cases_router.router, prefix="/api/v1", tags=["cases"])
app.include_router(playbooks_router.router, prefix="/api/v1", tags=["playbooks"])
app.include_router(enrichment_router.router, prefix="/api/v1", tags=["enrichment"])
app.include_router(mcp.router, prefix="/api/v1", tags=["mcp"])
app.include_router(console.router, prefix="/api/v1", tags=["console"])


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
```

- [ ] **Step 6: Delete old files**

```bash
rm backend/app/services/enrichment_service.py
rm backend/app/api/v1/enrichment.py
```

- [ ] **Step 7: Run tests — must pass**

```bash
cd backend && pytest -v
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add backend/app/enrichment/ backend/app/services/mcp_case_service.py backend/app/main.py
git commit -m "refactor: move enrichment domain to app/enrichment/"
```

---

## Task 7: MCP Domain

**Files:**
- Create: `backend/app/mcp/service.py`
- Create: `backend/app/mcp/router.py`
- Modify: `backend/app/main.py`
- Delete: `backend/app/services/mcp_case_service.py`
- Delete: `backend/app/api/v1/mcp.py`

- [ ] **Step 1: Create `backend/app/mcp/service.py`**

```python
from datetime import datetime, timezone
from time import perf_counter
from uuid import uuid4

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.enrichment.service import call_mcp_tool

ALLOWED_TOOLS: dict[str, str] = {
    "vt_ip_report": "VirusTotal",
    "vt_hash_lookup": "VirusTotal",
    "vt_domain_scan": "VirusTotal",
    "abuseipdb_check_ip": "AbuseIPDB",
    "abuseipdb_ip_reports": "AbuseIPDB",
}

REQUIRED_PARAMS: dict[str, tuple[str, ...]] = {
    "vt_ip_report": ("ip",),
    "vt_hash_lookup": ("hash",),
    "vt_domain_scan": ("domain",),
    "abuseipdb_check_ip": ("ip",),
    "abuseipdb_ip_reports": ("ip",),
}

VT_FINDING_TITLES: dict[str, str] = {
    "vt_ip_report": "IP reputation signal detected",
    "vt_hash_lookup": "Hash reputation signal detected",
    "vt_domain_scan": "Domain reputation signal detected",
}


def provider_for_tool(tool_name: str) -> str:
    provider = ALLOWED_TOOLS.get(tool_name)
    if not provider:
        raise HTTPException(status_code=400, detail="Unsupported MCP tool")
    return provider


def _case_object_id(case_id: str) -> ObjectId:
    try:
        return ObjectId(case_id)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(status_code=404, detail="Case not found") from exc


async def require_case(db: AsyncIOMotorDatabase, case_id: str) -> dict:
    doc = await db.cases.find_one({"_id": _case_object_id(case_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Case not found")
    return doc


async def get_mcp_state(db: AsyncIOMotorDatabase, case_id: str) -> dict:
    doc = await require_case(db, case_id)
    return mcp_state_from_doc(doc)


def mcp_state_from_doc(doc: dict) -> dict:
    return {
        "mcp_calls": doc.get("mcp_calls", []),
        "mcp_findings": doc.get("mcp_findings", []),
    }


async def updated_mcp_state(db: AsyncIOMotorDatabase, case_id: str) -> dict:
    return mcp_state_from_doc(await require_case(db, case_id))


def validate_tool_params(tool_name: str, params: dict) -> None:
    missing = [key for key in REQUIRED_PARAMS.get(tool_name, ()) if not params.get(key)]
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Missing required MCP params: {', '.join(missing)}",
        )


async def run_case_tool(
    db: AsyncIOMotorDatabase,
    case_id: str,
    tool_name: str,
    params: dict,
    actor: str,
) -> dict:
    provider = provider_for_tool(tool_name)
    validate_tool_params(tool_name, params)
    await require_case(db, case_id)

    started = perf_counter()
    now = datetime.now(timezone.utc)

    try:
        raw_result = await call_mcp_tool(tool_name, params)
        status = "completed"
    except Exception as exc:
        raw_result = {"error": str(exc)}
        status = "failed"

    duration_ms = int((perf_counter() - started) * 1000)
    call = {
        "id": str(uuid4()),
        "provider": provider,
        "tool_name": tool_name,
        "params": params,
        "status": status,
        "duration_ms": duration_ms,
        "result_summary": summarize_result(tool_name, raw_result),
        "raw_result": raw_result,
        "created_at": now,
        "actor": actor,
    }
    findings = normalize_findings(tool_name, raw_result, now)

    update = {
        "$push": {
            "mcp_calls": call,
            "timeline": {
                "timestamp": now,
                "actor": actor,
                "action": "mcp_tool_run",
                "detail": f"Ran {tool_name}",
            },
        },
        "$set": {"updated_at": now},
    }
    if findings:
        update["$push"]["mcp_findings"] = {"$each": findings}

    result = await db.cases.update_one({"_id": _case_object_id(case_id)}, update)
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")

    state = await updated_mcp_state(db, case_id)
    return {"call": call, "findings": findings, **state}


def summarize_result(tool_name: str, raw_result: dict) -> dict:
    if "error" in raw_result:
        return {"error": raw_result["error"]}
    if tool_name == "abuseipdb_check_ip":
        score = (
            raw_result.get("data", {}).get("abuseConfidenceScore")
            or raw_result.get("abuseConfidenceScore")
            or 0
        )
        return {"abuse_confidence_score": score}
    if tool_name.startswith("vt_"):
        stats = (
            raw_result.get("data", {})
            .get("attributes", {})
            .get("last_analysis_stats", {})
        )
        return {
            "malicious": stats.get("malicious", 0),
            "suspicious": stats.get("suspicious", 0),
        }
    return {"status": "ready"}


def normalize_findings(tool_name: str, raw_result: dict, created_at: datetime) -> list[dict]:
    if "error" in raw_result:
        return []
    if tool_name.startswith("vt_"):
        summary = summarize_result(tool_name, raw_result)
        if summary.get("malicious", 0) <= 0 and summary.get("suspicious", 0) <= 0:
            return []
        return [
            {
                "id": str(uuid4()),
                "source": "VirusTotal",
                "title": VT_FINDING_TITLES.get(tool_name, "VirusTotal signal detected"),
                "severity": "critical" if summary.get("malicious", 0) >= 10 else "medium",
                "fields": summary,
                "created_at": created_at,
            }
        ]
    if tool_name == "abuseipdb_check_ip":
        score = (
            raw_result.get("data", {}).get("abuseConfidenceScore")
            or raw_result.get("abuseConfidenceScore")
            or 0
        )
        if score < 25:
            return []
        return [
            {
                "id": str(uuid4()),
                "source": "AbuseIPDB",
                "title": "IP flagged by AbuseIPDB",
                "severity": "critical" if score >= 75 else "medium",
                "fields": {"abuse_confidence_score": score},
                "created_at": created_at,
            }
        ]
    return []
```

- [ ] **Step 2: Create `backend/app/mcp/router.py`**

```python
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from app.auth.models import UserInDB
from app.core.deps import get_current_user, get_db
from app.mcp.service import get_mcp_state, run_case_tool

router = APIRouter()


class MCPRunRequest(BaseModel):
    tool_name: str = Field(min_length=1)
    params: dict = Field(default_factory=dict)


class MCPStateResponse(BaseModel):
    mcp_calls: list[dict]
    mcp_findings: list[dict]


class MCPRunResponse(MCPStateResponse):
    call: dict
    findings: list[dict]


@router.get("/cases/{case_id}/mcp", response_model=MCPStateResponse)
async def get_case_mcp(
    case_id: str,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    return await get_mcp_state(db, case_id)


@router.post("/cases/{case_id}/mcp/run", response_model=MCPRunResponse)
async def run_case_mcp_tool(
    case_id: str,
    body: MCPRunRequest,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    return await run_case_tool(
        db,
        case_id,
        body.tool_name,
        body.params,
        current_user.email,
    )
```

- [ ] **Step 3: Update `backend/app/main.py`**

```python
import asyncio
import contextlib
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import router as auth_router
from app.cases import router as cases_router
from app.enrichment import router as enrichment_router
from app.mcp import router as mcp_router
from app.playbooks import router as playbooks_router
from app.api.v1 import console
from app.core.config import settings
from app.db.mongo import connect_mongo, disconnect_mongo, get_database
from app.db.redis import connect_redis, disconnect_redis, get_redis_client
from app.db.bootstrap import ensure_demo_data

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_mongo()
    await connect_redis()
    app.state.db = get_database()
    app.state.redis = get_redis_client()
    await ensure_demo_data(app.state.db, settings.DEMO_MODE)
    feed_task: asyncio.Task[None] | None = None
    if settings.DEMO_MODE and settings.MOCK_INCIDENT_FEED:
        from app.cases.mock_feed import run_mock_incident_feed

        feed_task = asyncio.create_task(run_mock_incident_feed(app.state.db))
        logger.info("Mock incident feed started (synthetic cases every 10–30s)")
    yield
    if feed_task is not None:
        feed_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await feed_task
        logger.info("Mock incident feed stopped")
    await disconnect_mongo()
    await disconnect_redis()


app = FastAPI(title="SIEM Case Manager API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/v1", tags=["auth"])
app.include_router(cases_router.router, prefix="/api/v1", tags=["cases"])
app.include_router(playbooks_router.router, prefix="/api/v1", tags=["playbooks"])
app.include_router(enrichment_router.router, prefix="/api/v1", tags=["enrichment"])
app.include_router(mcp_router.router, prefix="/api/v1", tags=["mcp"])
app.include_router(console.router, prefix="/api/v1", tags=["console"])


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
```

- [ ] **Step 4: Delete old files**

```bash
rm backend/app/services/mcp_case_service.py
rm backend/app/api/v1/mcp.py
```

- [ ] **Step 5: Run tests — must pass**

```bash
cd backend && pytest -v
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add backend/app/mcp/ backend/app/main.py
git commit -m "refactor: move mcp domain to app/mcp/"
```

---

## Task 8: Console Domain

**Files:**
- Create: `backend/app/console/service.py`
- Create: `backend/app/console/router.py`
- Modify: `backend/app/main.py`
- Delete: `backend/app/services/console_service.py`
- Delete: `backend/app/api/v1/console.py`

- [ ] **Step 1: Create `backend/app/console/service.py`**

```python
from app.cases.models import Case


def build_system_prompt(case: Case, flags: dict) -> str:
    blocks = [
        "You are an expert SOC analyst AI assistant. Analyse the following case context and answer the analyst query concisely and precisely.",
        "Always cite evidence. Flag uncertainty. Suggest next steps.",
    ]
    if flags.get("case_details"):
        blocks.append(
            f"CASE:\nID: {case.case_number}\nTitle: {case.title}\n"
            f"Severity: {case.severity}\nStatus: {case.status}\nDescription: {case.description}"
        )
    if flags.get("ldap") and case.ldap_context:
        blocks.append(f"LDAP:\n{case.ldap_context}")
    if flags.get("ioc_data") and case.iocs:
        ioc_lines = [
            f"- {i.type}: {i.value} (score: {i.score}, label: {i.label})"
            for i in case.iocs
        ]
        blocks.append("IOCs:\n" + "\n".join(ioc_lines))
    if flags.get("virustotal") and case.vt_results:
        blocks.append(f"VT RESULTS:\n{case.vt_results}")
    if flags.get("mcp_findings") and case.mcp_findings:
        blocks.append(f"MCP FINDINGS (Tines-backed):\n{case.mcp_findings}")
    if flags.get("abuseipdb") and case.abuseipdb_results:
        blocks.append(f"ABUSEIPDB:\n{case.abuseipdb_results}")
    if flags.get("playbook_state") and case.playbook_state:
        blocks.append(f"PLAYBOOK STATE:\n{case.playbook_state}")
    return "\n\n".join(blocks)
```

- [ ] **Step 2: Create `backend/app/console/router.py`**

```python
import json
from datetime import datetime, timezone
from uuid import uuid4

import anthropic
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.auth.models import UserInDB
from app.cases.service import get_case
from app.console.service import build_system_prompt
from app.core.deps import get_current_user, get_db
from app.core.secrets import read_env_or_secret_file

router = APIRouter()

PROMPT_TEMPLATES = {
    "attribution": (
        "Based on all available IOC data, LDAP enrichment, and MCP tool results, provide a full "
        "threat actor attribution analysis. Include confidence level, supporting evidence, and matching TTPs."
    ),
    "exfil": (
        "Review all evidence and determine whether data exfiltration occurred. Check email forward rules, "
        "large file transfers, and DNS/HTTP traffic to the C2. Quantify risk if exfil cannot be ruled out."
    ),
    "blast_radius": (
        "What is the full blast radius? Identify every account, host, and data asset that may have been "
        "touched or is at risk. Prioritise by sensitivity."
    ),
    "hunt_iocs": (
        "Using existing IOCs, generate a list of additional related indicators to hunt for. "
        "Include YARA rule ideas and network signatures."
    ),
    "exec_summary": (
        "Write an executive summary for CISO briefing: what happened, who was affected, business risk, "
        "containment actions taken, remediation outstanding. Max 200 words."
    ),
    "remediation": (
        "Provide a complete prioritised remediation checklist covering identity, endpoint, email, network, "
        "and policy layers. Flag items needing change management."
    ),
    "timeline": (
        "Reconstruct the full attack timeline from initial delivery through containment, with timestamps, "
        "techniques, and evidence sources for each event."
    ),
}


class ConsolePromptRequest(BaseModel):
    prompt: str
    template: str | None = None
    context_flags: dict = {}


def _get_anthropic_api_key() -> str:
    try:
        key = read_env_or_secret_file("ANTHROPIC_API_KEY", on_file_error="raise")
    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail="Anthropic API key file is not readable",
        ) from exc
    if key:
        return key
    raise HTTPException(
        status_code=503,
        detail="Anthropic API key is not configured",
    )


async def generate_console_response(prompt_text: str, system_prompt: str) -> str:
    api_key = _get_anthropic_api_key()
    client = anthropic.AsyncAnthropic(api_key=api_key)
    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        system=system_prompt,
        messages=[{"role": "user", "content": prompt_text}],
    )
    return "".join(
        block.text for block in message.content if getattr(block, "type", None) == "text"
    )


@router.post("/cases/{case_id}/console/stream")
async def stream_console(
    case_id: str,
    body: ConsolePromptRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
) -> StreamingResponse:
    case = await get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    prompt_text = body.prompt
    if body.template and body.template in PROMPT_TEMPLATES:
        prompt_text = PROMPT_TEMPLATES[body.template]

    system_prompt = build_system_prompt(case, body.context_flags)

    async def event_generator():
        try:
            api_key = _get_anthropic_api_key()
            client = anthropic.AsyncAnthropic(api_key=api_key)
            async with client.messages.stream(
                model="claude-sonnet-4-6",
                max_tokens=1500,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt_text}],
            ) as stream:
                async for text in stream.text_stream:
                    yield f"data: {json.dumps({'delta': text})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/cases/{case_id}/console/history")
async def get_console_history(
    case_id: str,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    try:
        object_id = ObjectId(case_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Case not found")

    case = await db.cases.find_one({"_id": object_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"history": case.get("console_history", [])}


@router.post("/cases/{case_id}/console/prompt")
async def create_console_prompt(
    case_id: str,
    body: ConsolePromptRequest,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    case = await get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    prompt_text = body.prompt
    if body.template and body.template in PROMPT_TEMPLATES:
        prompt_text = PROMPT_TEMPLATES[body.template]

    system_prompt = build_system_prompt(case, body.context_flags)
    response_text = await generate_console_response(prompt_text, system_prompt)
    now = datetime.now(timezone.utc)
    turn = {
        "id": str(uuid4()),
        "prompt": prompt_text,
        "response": response_text,
        "template": body.template,
        "context_flags": body.context_flags,
        "sources_used": [key for key, enabled in body.context_flags.items() if enabled],
        "created_at": now,
        "actor": current_user.email,
    }
    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {
            "$push": {"console_history": {"$each": [turn], "$position": 0}},
            "$set": {"updated_at": now},
        },
    )
    return {"turn": turn}


@router.get("/cases/{case_id}/console/templates")
async def get_templates(current_user=Depends(get_current_user)) -> dict:
    return {"templates": list(PROMPT_TEMPLATES.keys())}
```

- [ ] **Step 3: Update `backend/app/main.py` — final version with all domain routers**

```python
import asyncio
import contextlib
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import router as auth_router
from app.cases import router as cases_router
from app.console import router as console_router
from app.enrichment import router as enrichment_router
from app.mcp import router as mcp_router
from app.playbooks import router as playbooks_router
from app.core.config import settings
from app.db.mongo import connect_mongo, disconnect_mongo, get_database
from app.db.redis import connect_redis, disconnect_redis, get_redis_client
from app.db.bootstrap import ensure_demo_data

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_mongo()
    await connect_redis()
    app.state.db = get_database()
    app.state.redis = get_redis_client()
    await ensure_demo_data(app.state.db, settings.DEMO_MODE)
    feed_task: asyncio.Task[None] | None = None
    if settings.DEMO_MODE and settings.MOCK_INCIDENT_FEED:
        from app.cases.mock_feed import run_mock_incident_feed

        feed_task = asyncio.create_task(run_mock_incident_feed(app.state.db))
        logger.info("Mock incident feed started (synthetic cases every 10–30s)")
    yield
    if feed_task is not None:
        feed_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await feed_task
        logger.info("Mock incident feed stopped")
    await disconnect_mongo()
    await disconnect_redis()


app = FastAPI(title="SIEM Case Manager API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/v1", tags=["auth"])
app.include_router(cases_router.router, prefix="/api/v1", tags=["cases"])
app.include_router(playbooks_router.router, prefix="/api/v1", tags=["playbooks"])
app.include_router(enrichment_router.router, prefix="/api/v1", tags=["enrichment"])
app.include_router(mcp_router.router, prefix="/api/v1", tags=["mcp"])
app.include_router(console_router.router, prefix="/api/v1", tags=["console"])


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
```

- [ ] **Step 4: Delete old files**

```bash
rm backend/app/services/console_service.py
rm backend/app/api/v1/console.py
```

- [ ] **Step 5: Run tests — must pass**

```bash
cd backend && pytest -v
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add backend/app/console/ backend/app/main.py
git commit -m "refactor: move console domain to app/console/"
```

---

## Task 9: Delete Old Empty Directories

At this point `app/api/v1/`, `app/models/`, and `app/services/` should be empty (all files deleted or moved in prior tasks).

**Files:**
- Delete: `backend/app/api/` (directory)
- Delete: `backend/app/models/` (directory)
- Delete: `backend/app/services/` (directory)

- [ ] **Step 1: Verify directories contain no .py files**

```bash
ls backend/app/api/v1/
ls backend/app/models/
ls backend/app/services/
```

Expected: all three directories show no `.py` files (only `__init__.py` if present).

- [ ] **Step 2: Delete the old directories**

```bash
rm -rf backend/app/api/
rm -rf backend/app/models/
rm -rf backend/app/services/
```

- [ ] **Step 3: Run tests — must pass**

```bash
cd backend && pytest -v
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove old api/ and models/ layer directories"
```

---

## Task 10: Restructure Tests Into Domain Subdirectories

The test files use HTTP-level testing via `AsyncClient` and don't import from app internal modules (except `conftest.py`). Moving them requires only creating subdirectories, adding `__init__.py` files, and moving the files.

**Files:**
- Create: `backend/tests/auth/__init__.py`
- Create: `backend/tests/cases/__init__.py`
- Create: `backend/tests/playbooks/__init__.py`
- Create: `backend/tests/mcp/__init__.py`
- Create: `backend/tests/console/__init__.py`
- Create: `backend/tests/db/__init__.py`

- [ ] **Step 1: Create test subdirectories**

```bash
mkdir -p backend/tests/auth backend/tests/cases backend/tests/playbooks \
         backend/tests/mcp backend/tests/console backend/tests/db backend/tests/enrichment
touch backend/tests/auth/__init__.py backend/tests/cases/__init__.py \
      backend/tests/playbooks/__init__.py backend/tests/mcp/__init__.py \
      backend/tests/console/__init__.py backend/tests/db/__init__.py \
      backend/tests/enrichment/__init__.py
```

- [ ] **Step 2: Move test files**

```bash
mv backend/tests/test_auth.py backend/tests/auth/test_auth.py
mv backend/tests/test_cases.py backend/tests/cases/test_cases.py
mv backend/tests/test_mock_incident_feed.py backend/tests/cases/test_mock_feed.py
mv backend/tests/test_bootstrap.py backend/tests/db/test_bootstrap.py
mv backend/tests/test_playbook_engine.py backend/tests/playbooks/test_playbook_engine.py
mv backend/tests/test_mcp_case.py backend/tests/mcp/test_mcp_case.py
mv backend/tests/test_console_history.py backend/tests/console/test_console_history.py
mv backend/tests/test_tines_mcp_bridge.py backend/tests/enrichment/test_tines_mcp_bridge.py
```

- [ ] **Step 3: Run tests — pytest must discover and pass all tests**

```bash
cd backend && pytest -v
```

Expected: all tests discovered and passing. If pytest can't find tests, verify `pytest.ini` has `testpaths = tests` and that `__init__.py` files exist in all subdirectories.

- [ ] **Step 4: Commit**

```bash
git add backend/tests/
git commit -m "refactor: reorganize tests into domain subdirectories"
```

---

## Task 11: Final Verification

- [ ] **Step 1: Run the full test suite one final time**

```bash
cd backend && pytest -v --tb=short
```

Expected: all tests pass, no imports from `app.api`, `app.models`, or `app.services` (except `tines_client` / `tines_mcp_bridge` which remain in `services/`).

- [ ] **Step 2: Verify directory structure matches spec**

```bash
find backend/app -type f -name "*.py" | sort
```

Expected output should show only these directories: `app/auth/`, `app/cases/`, `app/playbooks/`, `app/enrichment/`, `app/mcp/`, `app/console/`, `app/core/`, `app/db/`, `app/services/` (tines files only).

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "refactor: complete feature-based domain restructure"
```
