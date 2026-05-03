# AI Console — ChatGPT + Tines MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Claude-backed AI Console with a ChatGPT (gpt-4o) agentic loop that calls Tines MCP tools (VirusTotal, AbuseIPDB) mid-conversation and streams results back to the analyst via SSE.

**Architecture:** The backend's `/console/stream` endpoint runs an OpenAI tool-calling loop — up to 5 iterations — emitting SSE `tool_call`/`tool_result` events as each Tines tool executes, then streams the final text response. Conversation history is multi-turn (loaded from MongoDB per case). The frontend replaces its mutation hook with a streaming SSE handler and shows inline tool-call status chips.

**Tech Stack:** Python `openai` SDK (async), FastAPI SSE, React `fetch` ReadableStream, MongoDB, existing `tines_client.py`

---

## File Map

| File | Action |
|---|---|
| `backend/requirements.txt` | Replace `anthropic` with `openai` |
| `backend/app/core/config.py` | Add `OPENAI_API_KEY`, `OPENAI_MODEL`; remove 3 old `TINES_*` settings |
| `backend/app/enrichment/tines_mcp_bridge.py` | **Delete** |
| `backend/app/enrichment/service.py` | Remove bridge import; call Tines tools by their direct names |
| `backend/app/mcp/service.py` | Remove `call_mcp_tool` import; inline Tines resolution; call `tines_client` directly |
| `backend/app/console/service.py` | Rewrite `build_system_prompt` — always inject full case JSON |
| `backend/app/console/router.py` | Full rewrite — OpenAI agentic loop, SSE streaming, tool result normalization |
| `backend/tests/console/test_console_history.py` | Rewrite tests to mock OpenAI instead of Anthropic |
| `frontend/types/index.ts` | Add `tool_calls_used` to `ConsoleHistoryTurn` |
| `frontend/lib/api.ts` | Replace `useSubmitConsolePrompt` with `useStreamConsolePrompt` (SSE) |
| `frontend/components/console/AnalystConsole.tsx` | Use new hook; show tool-call chips and streaming text bubble |

---

## Task 1: Swap Python Dependencies

**Files:**
- Modify: `backend/requirements.txt`

- [ ] **Step 1: Replace anthropic with openai**

Edit `backend/requirements.txt` — replace line `anthropic==0.40.0` with:

```
openai==1.30.5
```

- [ ] **Step 2: Install**

```bash
cd backend
pip install openai==1.30.5
pip uninstall anthropic -y
```

Expected: `Successfully installed openai-1.30.5`

- [ ] **Step 3: Commit**

```bash
git add backend/requirements.txt
git commit -m "chore: replace anthropic with openai dependency"
```

---

## Task 2: Config — Add OpenAI Settings, Remove Old Tines Tool Names

**Files:**
- Modify: `backend/app/core/config.py`

- [ ] **Step 1: Write a failing test**

Create `backend/tests/test_config.py`:

```python
def test_openai_settings_present():
    from app.core.config import Settings
    s = Settings(JWT_SECRET_KEY="a" * 32, OPENAI_API_KEY="sk-test")
    assert s.OPENAI_API_KEY == "sk-test"
    assert s.OPENAI_MODEL == "gpt-4o"

def test_old_tines_tool_settings_removed():
    from app.core.config import Settings
    import inspect
    fields = inspect.signature(Settings).parameters
    assert "TINES_VT_TOOL" not in fields
    assert "TINES_ABUSEIPDB_CHECK_TOOL" not in fields
    assert "TINES_ABUSEIPDB_REPORTS_TOOL" not in fields
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd backend
pytest tests/test_config.py -v
```

Expected: FAIL — `OPENAI_API_KEY` not in Settings, old fields still present.

- [ ] **Step 3: Update config**

In `backend/app/core/config.py`, make these changes:

Remove these three lines:
```python
    TINES_VT_TOOL: str = "search_for_files_urls_domains_ips_and_comments"
    TINES_ABUSEIPDB_CHECK_TOOL: str = "search_for_an_ip_address"
    TINES_ABUSEIPDB_REPORTS_TOOL: str = "get_reports_for_an_ip_address"
```

Add after `TINES_MCP_URL`:
```python
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_config.py -v
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/app/core/config.py backend/tests/test_config.py
git commit -m "feat: add OpenAI config settings, remove old Tines tool name settings"
```

---

## Task 3: Delete Bridge, Fix Enrichment and MCP Callers

**Files:**
- Delete: `backend/app/enrichment/tines_mcp_bridge.py`
- Modify: `backend/app/enrichment/service.py`
- Modify: `backend/app/mcp/service.py`

- [ ] **Step 1: Delete the bridge file**

Delete `backend/app/enrichment/tines_mcp_bridge.py`.

- [ ] **Step 2: Rewrite enrichment/service.py**

Replace the entire contents of `backend/app/enrichment/service.py` with:

```python
from app.core.config import settings
from app.enrichment.tines_client import call_tool as tines_call_tool


def _tines_webhook_url() -> str:
    return (settings.TINES_WEBHOOK_URL or settings.TINES_MCP_URL or "").strip()


async def call_mcp_tool(tines_tool_name: str, arguments: dict) -> dict:
    if settings.DEMO_MODE:
        return {}
    url = _tines_webhook_url()
    if not url:
        return {"error": "TINES_WEBHOOK_URL or TINES_MCP_URL is not configured"}
    return await tines_call_tool(url, tines_tool_name, arguments)


async def enrich_ioc(ioc_type: str, value: str) -> dict:
    results: dict = {}
    if ioc_type == "ipv4":
        results["virustotal"] = await call_mcp_tool(
            "search_for_files_urls_domains_ips_and_comments", {"query": value}
        )
        results["abuseipdb"] = await call_mcp_tool(
            "search_for_an_ip_address", {"ip_address": value, "max_age_in_days": 30}
        )
    elif ioc_type == "sha256":
        results["virustotal"] = await call_mcp_tool(
            "search_for_files_urls_domains_ips_and_comments", {"query": value}
        )
    elif ioc_type == "domain":
        results["virustotal"] = await call_mcp_tool(
            "search_for_files_urls_domains_ips_and_comments", {"query": value}
        )
    return results
```

- [ ] **Step 3: Rewrite the Tines resolution in mcp/service.py**

In `backend/app/mcp/service.py`, replace the existing import:
```python
from app.enrichment.service import call_mcp_tool
```

With:
```python
from app.core.config import settings
from app.enrichment.tines_client import call_tool as tines_call_tool
```

Add this mapping dict and helper after the imports (before `ALLOWED_TOOLS`):

```python
_TINES_RESOLUTION: dict[str, tuple[str, "callable[[dict], dict]"]] = {
    "vt_ip_report": (
        "search_for_files_urls_domains_ips_and_comments",
        lambda p: {"query": p["ip"]},
    ),
    "vt_hash_lookup": (
        "search_for_files_urls_domains_ips_and_comments",
        lambda p: {"query": p["hash"]},
    ),
    "vt_domain_scan": (
        "search_for_files_urls_domains_ips_and_comments",
        lambda p: {"query": p["domain"]},
    ),
    "abuseipdb_check_ip": (
        "search_for_an_ip_address",
        lambda p: {"ip_address": p["ip"], "max_age_in_days": int(p.get("max_age_in_days", 30))},
    ),
    "abuseipdb_ip_reports": (
        "get_reports_for_an_ip_address",
        lambda p: {"ip_address": p["ip"], "max_age_in_days": int(p.get("max_age_in_days", 30))},
    ),
}


async def _call_tines(tool_name: str, params: dict) -> dict:
    if settings.DEMO_MODE:
        return {}
    url = (settings.TINES_WEBHOOK_URL or settings.TINES_MCP_URL or "").strip()
    if not url:
        return {"error": "TINES_WEBHOOK_URL or TINES_MCP_URL is not configured"}
    entry = _TINES_RESOLUTION.get(tool_name)
    if not entry:
        return {"error": f"No Tines mapping for tool: {tool_name}"}
    tines_name, arg_fn = entry
    return await tines_call_tool(url, tines_name, arg_fn(params))
```

In `run_case_tool`, replace the line:
```python
        raw_result = await call_mcp_tool(tool_name, params)
```
With:
```python
        raw_result = await _call_tines(tool_name, params)
```

- [ ] **Step 4: Verify the app still imports cleanly**

```bash
cd backend
python -c "from app.mcp.service import run_case_tool; from app.enrichment.service import enrich_ioc; print('OK')"
```

Expected output: `OK`

- [ ] **Step 5: Commit**

```bash
git add backend/app/enrichment/service.py backend/app/mcp/service.py
git rm backend/app/enrichment/tines_mcp_bridge.py
git commit -m "refactor: delete Tines bridge, resolve tool names directly in enrichment and mcp services"
```

---

## Task 4: Console Service — Inject Full Case JSON into System Prompt

**Files:**
- Modify: `backend/app/console/service.py`

- [ ] **Step 1: Write the failing test**

Add a new test file `backend/tests/console/test_console_service.py`:

```python
import json
from app.console.service import build_system_prompt
from app.cases.models import Case


def _make_case(**kwargs) -> Case:
    defaults = {
        "id": "abc123",
        "case_number": "CASE-001",
        "title": "SSH Brute Force",
        "description": "Repeated failed SSH logins",
        "severity": "high",
        "status": "open",
        "mitre_tactics": [],
        "mitre_techniques": [],
        "tags": [],
        "created_at": "2026-05-02T00:00:00Z",
        "updated_at": "2026-05-02T00:00:00Z",
        "created_by": "analyst@test.local",
        "timeline": [],
        "iocs": [],
        "mcp_calls": [],
        "mcp_findings": [],
        "console_history": [],
    }
    defaults.update(kwargs)
    return Case(**defaults)


def test_system_prompt_contains_case_json():
    case = _make_case(title="My Malware Case")
    prompt = build_system_prompt(case, {})
    assert "My Malware Case" in prompt
    assert "CASE CONTEXT" in prompt


def test_system_prompt_contains_severity():
    case = _make_case(severity="critical")
    prompt = build_system_prompt(case, {})
    assert "critical" in prompt


def test_system_prompt_always_has_persona():
    case = _make_case()
    prompt = build_system_prompt(case, {})
    assert "SOC analyst" in prompt
    assert "tools" in prompt.lower()
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd backend
pytest tests/console/test_console_service.py -v
```

Expected: FAIL — `build_system_prompt` doesn't include case JSON yet.

- [ ] **Step 3: Rewrite console/service.py**

Replace the entire contents of `backend/app/console/service.py` with:

```python
import json

from app.cases.models import Case


def build_system_prompt(case: Case, flags: dict) -> str:
    persona = (
        "You are an expert SOC analyst AI assistant. "
        "Analyse the case context below and answer the analyst query concisely and precisely. "
        "Always cite evidence. Flag uncertainty. Suggest next steps. "
        "You have access to tools: use them when the analyst asks about specific IPs, "
        "hashes, domains, or URLs to look up live threat intelligence."
    )
    case_json = json.dumps(
        case.model_dump(mode="json", exclude_none=True),
        indent=2,
        default=str,
    )
    return f"{persona}\n\nCASE CONTEXT:\n{case_json}"
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/console/test_console_service.py -v
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/app/console/service.py backend/tests/console/test_console_service.py
git commit -m "feat: rewrite build_system_prompt to inject full case JSON every turn"
```

---

## Task 5: Console Router — OpenAI Agentic Loop

**Files:**
- Modify: `backend/app/console/router.py`

- [ ] **Step 1: Replace the entire router**

Replace the full contents of `backend/app/console/router.py` with:

```python
import json
from datetime import datetime, timezone
from uuid import uuid4

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from openai import AsyncOpenAI
from pydantic import BaseModel

from app.auth.models import UserInDB
from app.cases.service import get_case
from app.console.service import build_system_prompt
from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.core.secrets import read_env_or_secret_file
from app.enrichment.tines_client import call_tool as tines_call_tool
from app.mcp.service import _case_object_id

router = APIRouter()

MAX_TOOL_ITERATIONS = 5

TINES_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_for_files_urls_domains_ips_and_comments",
            "description": "Search VirusTotal for a file hash, URL, domain, or IP address.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Hash, IP, domain, or URL to look up",
                    }
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_for_an_ip_address",
            "description": "Check an IP address against AbuseIPDB for abuse confidence score.",
            "parameters": {
                "type": "object",
                "properties": {
                    "ip_address": {"type": "string"},
                    "max_age_in_days": {"type": "integer", "default": 30},
                },
                "required": ["ip_address"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_reports_for_an_ip_address",
            "description": "Get detailed abuse reports for an IP address from AbuseIPDB.",
            "parameters": {
                "type": "object",
                "properties": {
                    "ip_address": {"type": "string"},
                    "max_age_in_days": {"type": "integer", "default": 30},
                },
                "required": ["ip_address"],
            },
        },
    },
]

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


def _get_openai_api_key() -> str:
    try:
        key = read_env_or_secret_file("OPENAI_API_KEY", on_file_error="raise")
    except RuntimeError as exc:
        raise HTTPException(
            status_code=503, detail="OpenAI API key file is not readable"
        ) from exc
    if key:
        return key
    raise HTTPException(status_code=503, detail="OpenAI API key is not configured")


def _tines_url() -> str:
    return (settings.TINES_WEBHOOK_URL or settings.TINES_MCP_URL or "").strip()


def _build_messages(history: list[dict], system_prompt: str, prompt: str) -> list[dict]:
    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    for turn in reversed(history):
        messages.append({"role": "user", "content": turn["prompt"]})
        messages.append({"role": "assistant", "content": turn["response"]})
    messages.append({"role": "user", "content": prompt})
    return messages


def summarize_tool_result(tool_name: str, raw: dict) -> dict:
    if "error" in raw:
        return {"error": raw["error"]}
    if tool_name == "search_for_files_urls_domains_ips_and_comments":
        data = raw.get("data", [])
        attrs = data[0].get("attributes", {}) if isinstance(data, list) and data else {}
        stats = attrs.get("last_analysis_stats", {})
        return {
            "sha256": attrs.get("sha256"),
            "meaningful_name": attrs.get("meaningful_name"),
            "malicious": stats.get("malicious", 0),
            "suspicious": stats.get("suspicious", 0),
            "suggested_threat_label": attrs.get(
                "popular_threat_classification", {}
            ).get("suggested_threat_label"),
            "sandbox_verdicts": [
                name
                for name, v in attrs.get("sandbox_verdicts", {}).items()
                if v.get("category") == "malicious"
            ],
        }
    if tool_name == "search_for_an_ip_address":
        d = raw.get("data", {})
        return {
            "ip_address": d.get("ipAddress"),
            "abuse_confidence_score": d.get("abuseConfidenceScore", 0),
            "country_code": d.get("countryCode"),
            "isp": d.get("isp"),
            "domain": d.get("domain"),
            "is_tor": d.get("isTor", False),
            "total_reports": d.get("totalReports", 0),
            "num_distinct_users": d.get("numDistinctUsers", 0),
            "last_reported_at": d.get("lastReportedAt"),
        }
    if tool_name == "get_reports_for_an_ip_address":
        d = raw.get("data", {})
        results = d.get("results", [])
        return {
            "total": d.get("total", 0),
            "page": d.get("page", 1),
            "last_page": d.get("lastPage", 1),
            "sample_comments": [
                r.get("comment", "")[:200] for r in results[:3] if r.get("comment")
            ],
            "categories_seen": sorted(
                {cat for r in results for cat in r.get("categories", [])}
            ),
        }
    return {}


def _normalize_findings(tool_name: str, summary: dict, now: datetime) -> list[dict]:
    if "error" in summary:
        return []
    if tool_name == "search_for_files_urls_domains_ips_and_comments":
        if summary.get("malicious", 0) <= 0 and summary.get("suspicious", 0) <= 0:
            return []
        return [
            {
                "id": str(uuid4()),
                "source": "VirusTotal",
                "title": "VirusTotal signal detected",
                "severity": "critical" if summary.get("malicious", 0) >= 10 else "medium",
                "fields": summary,
                "created_at": now,
            }
        ]
    if tool_name == "search_for_an_ip_address":
        score = summary.get("abuse_confidence_score", 0)
        if score < 25:
            return []
        return [
            {
                "id": str(uuid4()),
                "source": "AbuseIPDB",
                "title": "IP flagged by AbuseIPDB",
                "severity": "critical" if score >= 75 else "medium",
                "fields": summary,
                "created_at": now,
            }
        ]
    return []


def _build_db_update(
    turn: dict,
    tool_calls_used: list[dict],
    all_findings: list[dict],
    now: datetime,
    actor: str,
) -> dict:
    update: dict = {
        "$push": {"console_history": {"$each": [turn], "$position": 0}},
        "$set": {"updated_at": now},
    }
    if all_findings:
        update["$push"]["mcp_findings"] = {"$each": all_findings}
    if tool_calls_used:
        mcp_records = [
            {
                "id": str(uuid4()),
                "provider": "Tines",
                "tool_name": tc["tool"],
                "params": tc["args"],
                "status": "completed" if "error" not in tc["result_summary"] else "failed",
                "duration_ms": 0,
                "result_summary": tc["result_summary"],
                "raw_result": {},
                "created_at": now,
                "actor": actor,
            }
            for tc in tool_calls_used
        ]
        update["$push"]["mcp_calls"] = {"$each": mcp_records}
    return update


@router.post("/cases/{case_id}/console/stream")
async def stream_console(
    case_id: str,
    body: ConsolePromptRequest,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> StreamingResponse:
    case = await get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    prompt_text = (
        PROMPT_TEMPLATES[body.template]
        if body.template and body.template in PROMPT_TEMPLATES
        else body.prompt
    )
    system_prompt = build_system_prompt(case, body.context_flags)
    case_doc = await db.cases.find_one({"_id": _case_object_id(case_id)})
    history: list[dict] = case_doc.get("console_history", []) if case_doc else []

    api_key = _get_openai_api_key()
    tines_url = _tines_url()
    client = AsyncOpenAI(api_key=api_key)

    async def event_generator():
        tool_calls_used: list[dict] = []
        all_findings: list[dict] = []
        response_text = ""
        now = datetime.now(timezone.utc)

        try:
            messages = _build_messages(history, system_prompt, prompt_text)

            for _ in range(MAX_TOOL_ITERATIONS):
                completion = await client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=messages,
                    tools=TINES_TOOLS,
                    tool_choice="auto",
                )
                msg = completion.choices[0].message

                if not msg.tool_calls:
                    response_text = msg.content or ""
                    yield f"data: {json.dumps({'type': 'delta', 'text': response_text})}\n\n"
                    break

                messages.append(
                    {
                        "role": "assistant",
                        "content": msg.content,
                        "tool_calls": [
                            {
                                "id": tc.id,
                                "type": "function",
                                "function": {
                                    "name": tc.function.name,
                                    "arguments": tc.function.arguments,
                                },
                            }
                            for tc in msg.tool_calls
                        ],
                    }
                )

                for tc in msg.tool_calls:
                    args = json.loads(tc.function.arguments)
                    yield f"data: {json.dumps({'type': 'tool_call', 'tool': tc.function.name, 'args': args, 'status': 'running'})}\n\n"

                    raw = (
                        await tines_call_tool(tines_url, tc.function.name, args)
                        if tines_url
                        else {"error": "Tines MCP URL not configured"}
                    )
                    summary = summarize_tool_result(tc.function.name, raw)
                    tool_calls_used.append(
                        {"tool": tc.function.name, "args": args, "result_summary": summary}
                    )
                    all_findings.extend(_normalize_findings(tc.function.name, summary, now))

                    yield f"data: {json.dumps({'type': 'tool_result', 'tool': tc.function.name, 'status': 'done'})}\n\n"
                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tc.id,
                            "content": json.dumps(raw),
                        }
                    )

            turn = {
                "id": str(uuid4()),
                "prompt": prompt_text,
                "response": response_text,
                "tool_calls_used": tool_calls_used,
                "template": body.template,
                "context_flags": body.context_flags,
                "sources_used": [k for k, v in body.context_flags.items() if v],
                "created_at": now,
                "actor": current_user.email,
            }
            await db.cases.update_one(
                {"_id": _case_object_id(case_id)},
                _build_db_update(turn, tool_calls_used, all_findings, now, current_user.email),
            )
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as exc:
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"

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

    prompt_text = (
        PROMPT_TEMPLATES[body.template]
        if body.template and body.template in PROMPT_TEMPLATES
        else body.prompt
    )
    system_prompt = build_system_prompt(case, body.context_flags)
    case_doc = await db.cases.find_one({"_id": _case_object_id(case_id)})
    history: list[dict] = case_doc.get("console_history", []) if case_doc else []

    api_key = _get_openai_api_key()
    tines_url = _tines_url()
    client = AsyncOpenAI(api_key=api_key)
    messages = _build_messages(history, system_prompt, prompt_text)
    tool_calls_used: list[dict] = []
    all_findings: list[dict] = []
    now = datetime.now(timezone.utc)
    response_text = ""

    for _ in range(MAX_TOOL_ITERATIONS):
        completion = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            tools=TINES_TOOLS,
            tool_choice="auto",
        )
        msg = completion.choices[0].message
        if not msg.tool_calls:
            response_text = msg.content or ""
            break
        messages.append(
            {
                "role": "assistant",
                "content": msg.content,
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                    }
                    for tc in msg.tool_calls
                ],
            }
        )
        for tc in msg.tool_calls:
            args = json.loads(tc.function.arguments)
            raw = (
                await tines_call_tool(tines_url, tc.function.name, args)
                if tines_url
                else {"error": "Tines MCP URL not configured"}
            )
            summary = summarize_tool_result(tc.function.name, raw)
            tool_calls_used.append({"tool": tc.function.name, "args": args, "result_summary": summary})
            all_findings.extend(_normalize_findings(tc.function.name, summary, now))
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": json.dumps(raw)})

    turn = {
        "id": str(uuid4()),
        "prompt": prompt_text,
        "response": response_text,
        "tool_calls_used": tool_calls_used,
        "template": body.template,
        "context_flags": body.context_flags,
        "sources_used": [k for k, v in body.context_flags.items() if v],
        "created_at": now,
        "actor": current_user.email,
    }
    await db.cases.update_one(
        {"_id": _case_object_id(case_id)},
        _build_db_update(turn, tool_calls_used, all_findings, now, current_user.email),
    )
    return {"turn": turn}


@router.get("/cases/{case_id}/console/templates")
async def get_templates(current_user: UserInDB = Depends(get_current_user)) -> dict:
    return {"templates": list(PROMPT_TEMPLATES.keys())}
```

- [ ] **Step 2: Verify the module imports cleanly**

```bash
cd backend
python -c "from app.console.router import router, summarize_tool_result, _build_messages; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/app/console/router.py
git commit -m "feat: replace Anthropic with OpenAI agentic loop in console router"
```

---

## Task 6: Update Backend Tests

**Files:**
- Modify: `backend/tests/console/test_console_history.py`

- [ ] **Step 1: Rewrite the test file**

Replace the full contents of `backend/tests/console/test_console_history.py` with:

```python
import json
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import AsyncClient


async def _create_case(async_client: AsyncClient, analyst_token: str) -> str:
    resp = await async_client.post(
        "/api/v1/cases",
        json={
            "title": "Console Test Case",
            "description": "Case for prompt history",
            "severity": "high",
            "status": "open",
            "mitre_tactics": ["TA0001"],
            "mitre_techniques": ["T1566.001"],
            "tags": ["console"],
        },
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 201
    return resp.json()["id"]


def _openai_text_response(text: str) -> MagicMock:
    """Build a mock OpenAI completion response with no tool calls."""
    msg = MagicMock()
    msg.content = text
    msg.tool_calls = None
    choice = MagicMock()
    choice.message = msg
    resp = MagicMock()
    resp.choices = [choice]
    return resp


def _openai_tool_call_response(tool_name: str, arguments: dict) -> MagicMock:
    """Build a mock OpenAI completion response requesting one tool call."""
    tc = MagicMock()
    tc.id = "call_abc123"
    tc.function.name = tool_name
    tc.function.arguments = json.dumps(arguments)
    msg = MagicMock()
    msg.content = None
    msg.tool_calls = [tc]
    choice = MagicMock()
    choice.message = msg
    resp = MagicMock()
    resp.choices = [choice]
    return resp


@pytest.mark.asyncio
async def test_console_history_starts_empty(
    async_client: AsyncClient, analyst_token: str
) -> None:
    case_id = await _create_case(async_client, analyst_token)
    resp = await async_client.get(
        f"/api/v1/cases/{case_id}/console/history",
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 200
    assert resp.json() == {"history": []}


@pytest.mark.asyncio
async def test_console_prompt_persists_response(
    async_client: AsyncClient, analyst_token: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    case_id = await _create_case(async_client, analyst_token)

    mock_create = AsyncMock(
        return_value=_openai_text_response("Initial access was likely spearphishing.")
    )
    monkeypatch.setattr("app.console.router.AsyncOpenAI", lambda api_key: MagicMock(
        chat=MagicMock(completions=MagicMock(create=mock_create))
    ))
    monkeypatch.setattr("app.console.router._get_openai_api_key", lambda: "sk-test")

    resp = await async_client.post(
        f"/api/v1/cases/{case_id}/console/prompt",
        json={
            "prompt": "What is the likely initial access vector?",
            "template": None,
            "context_flags": {"case_details": True, "ioc_data": True},
        },
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["turn"]["response"].startswith("Initial access")
    assert body["turn"]["sources_used"] == ["case_details", "ioc_data"]
    assert body["turn"]["tool_calls_used"] == []

    history_resp = await async_client.get(
        f"/api/v1/cases/{case_id}/console/history",
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert len(history_resp.json()["history"]) == 1


@pytest.mark.asyncio
async def test_console_history_is_multi_turn(
    async_client: AsyncClient, analyst_token: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    case_id = await _create_case(async_client, analyst_token)
    responses = [
        _openai_text_response("First answer."),
        _openai_text_response("Second answer."),
    ]
    call_count = 0

    async def fake_create(**kwargs):
        nonlocal call_count
        result = responses[min(call_count, len(responses) - 1)]
        call_count += 1
        # second call should have 3 messages (system + user1 + assistant1 + user2)
        if call_count == 2:
            assert len(kwargs["messages"]) == 4
        return result

    monkeypatch.setattr("app.console.router.AsyncOpenAI", lambda api_key: MagicMock(
        chat=MagicMock(completions=MagicMock(create=fake_create))
    ))
    monkeypatch.setattr("app.console.router._get_openai_api_key", lambda: "sk-test")

    for prompt in ["First question.", "Second question."]:
        await async_client.post(
            f"/api/v1/cases/{case_id}/console/prompt",
            json={"prompt": prompt, "context_flags": {}},
            headers={"Authorization": f"Bearer {analyst_token}"},
        )

    history = (
        await async_client.get(
            f"/api/v1/cases/{case_id}/console/history",
            headers={"Authorization": f"Bearer {analyst_token}"},
        )
    ).json()["history"]
    assert len(history) == 2


@pytest.mark.asyncio
async def test_tool_call_recorded_in_mcp_calls(
    async_client: AsyncClient, analyst_token: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    case_id = await _create_case(async_client, analyst_token)

    abuseipdb_raw = {
        "data": {
            "ipAddress": "1.2.3.4",
            "abuseConfidenceScore": 90,
            "countryCode": "CN",
            "isp": "Test ISP",
            "domain": "test.com",
            "isTor": False,
            "totalReports": 50,
            "numDistinctUsers": 20,
            "lastReportedAt": "2026-05-01T00:00:00Z",
        }
    }
    call_count = 0

    async def fake_create(**kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return _openai_tool_call_response(
                "search_for_an_ip_address", {"ip_address": "1.2.3.4"}
            )
        return _openai_text_response("IP 1.2.3.4 has abuse score 90, classified as malicious.")

    monkeypatch.setattr("app.console.router.AsyncOpenAI", lambda api_key: MagicMock(
        chat=MagicMock(completions=MagicMock(create=fake_create))
    ))
    monkeypatch.setattr("app.console.router._get_openai_api_key", lambda: "sk-test")
    monkeypatch.setattr(
        "app.console.router.tines_call_tool",
        AsyncMock(return_value=abuseipdb_raw),
    )
    monkeypatch.setattr("app.console.router._tines_url", lambda: "https://tines.example.com/mcp/abc")

    resp = await async_client.post(
        f"/api/v1/cases/{case_id}/console/prompt",
        json={"prompt": "Is 1.2.3.4 malicious?", "context_flags": {}},
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 200
    turn = resp.json()["turn"]
    assert len(turn["tool_calls_used"]) == 1
    assert turn["tool_calls_used"][0]["tool"] == "search_for_an_ip_address"
    assert turn["tool_calls_used"][0]["result_summary"]["abuse_confidence_score"] == 90

    from bson import ObjectId
    from app.core.config import settings
    from motor.motor_asyncio import AsyncIOMotorClient
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["siem_test"]
    doc = await db.cases.find_one({"_id": ObjectId(case_id)})
    assert len(doc.get("mcp_calls", [])) >= 1
    assert doc["mcp_calls"][0]["tool_name"] == "search_for_an_ip_address"
    assert len(doc.get("mcp_findings", [])) >= 1
    client.close()


@pytest.mark.asyncio
async def test_tines_unavailable_returns_graceful_response(
    async_client: AsyncClient, analyst_token: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    case_id = await _create_case(async_client, analyst_token)
    call_count = 0

    async def fake_create(**kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return _openai_tool_call_response(
                "search_for_an_ip_address", {"ip_address": "5.6.7.8"}
            )
        return _openai_text_response("Could not retrieve live data. Based on case context, proceed with caution.")

    monkeypatch.setattr("app.console.router.AsyncOpenAI", lambda api_key: MagicMock(
        chat=MagicMock(completions=MagicMock(create=fake_create))
    ))
    monkeypatch.setattr("app.console.router._get_openai_api_key", lambda: "sk-test")
    monkeypatch.setattr("app.console.router._tines_url", lambda: "")

    resp = await async_client.post(
        f"/api/v1/cases/{case_id}/console/prompt",
        json={"prompt": "Is 5.6.7.8 malicious?", "context_flags": {}},
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 200
    assert "proceed" in resp.json()["turn"]["response"].lower()


@pytest.mark.asyncio
async def test_loop_guard_exits_after_max_iterations(
    async_client: AsyncClient, analyst_token: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    case_id = await _create_case(async_client, analyst_token)

    async def always_tool_call(**kwargs):
        return _openai_tool_call_response(
            "search_for_an_ip_address", {"ip_address": "9.9.9.9"}
        )

    monkeypatch.setattr("app.console.router.AsyncOpenAI", lambda api_key: MagicMock(
        chat=MagicMock(completions=MagicMock(create=always_tool_call))
    ))
    monkeypatch.setattr("app.console.router._get_openai_api_key", lambda: "sk-test")
    monkeypatch.setattr(
        "app.console.router.tines_call_tool",
        AsyncMock(return_value={"data": {"abuseConfidenceScore": 0}}),
    )
    monkeypatch.setattr("app.console.router._tines_url", lambda: "https://tines.example.com/mcp/abc")

    resp = await async_client.post(
        f"/api/v1/cases/{case_id}/console/prompt",
        json={"prompt": "Loop forever?", "context_flags": {}},
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 200
    turn = resp.json()["turn"]
    assert len(turn["tool_calls_used"]) == 5
```

- [ ] **Step 2: Run tests**

```bash
cd backend
pytest tests/console/ -v
```

Expected: All tests PASS. If any fail, check monkeypatch targets match the function names in `router.py` exactly.

- [ ] **Step 3: Commit**

```bash
git add backend/tests/console/test_console_history.py
git commit -m "test: rewrite console tests for OpenAI agentic loop"
```

---

## Task 7: Frontend — Types and Streaming Hook

**Files:**
- Modify: `frontend/types/index.ts`
- Modify: `frontend/lib/api.ts`

- [ ] **Step 1: Add tool_calls_used to ConsoleHistoryTurn type**

In `frontend/types/index.ts`, find the `ConsoleHistoryTurn` interface and add the new field:

```typescript
export interface ToolCallRecord {
  tool: string
  args: Record<string, unknown>
  result_summary: Record<string, unknown>
}

export interface ConsoleHistoryTurn {
  id: string
  prompt: string
  response: string
  template?: string | null
  context_flags: Record<string, boolean>
  sources_used: string[]
  tool_calls_used: ToolCallRecord[]   // NEW
  created_at: string
  actor: string
}
```

- [ ] **Step 2: Add ConsoleSSEEvent type**

In `frontend/types/index.ts`, add after `ToolCallRecord`:

```typescript
export type ConsoleSSEEvent =
  | { type: 'tool_call'; tool: string; args: Record<string, unknown>; status: 'running' }
  | { type: 'tool_result'; tool: string; status: 'done' }
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string }
```

- [ ] **Step 3: Replace useSubmitConsolePrompt with useStreamConsolePrompt in api.ts**

In `frontend/lib/api.ts`, add this import at the top:

```typescript
import { useState, useCallback } from 'react'
```

Replace the existing `useSubmitConsolePrompt` function (lines 137–155) with:

```typescript
async function* _streamConsoleEvents(
  url: string,
  headers: Record<string, string>,
  body: object
): AsyncGenerator<import('@/types').ConsoleSSEEvent> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (!data) continue
      try {
        yield JSON.parse(data) as import('@/types').ConsoleSSEEvent
      } catch {
        // ignore malformed lines
      }
    }
  }
}

export function useStreamConsolePrompt(caseId: string) {
  const headers = useAuthHeaders()
  const qc = useQueryClient()
  const [isPending, setIsPending] = useState(false)
  const [activeToolCall, setActiveToolCall] = useState<string | null>(null)
  const [streamingText, setStreamingText] = useState('')

  const submit = useCallback(
    async (data: { prompt: string; template?: string; context_flags: Record<string, boolean> }) => {
      setIsPending(true)
      setStreamingText('')
      setActiveToolCall(null)
      try {
        const url = `${API_URL}/api/v1/cases/${caseId}/console/stream`
        for await (const event of _streamConsoleEvents(url, headers, data)) {
          if (event.type === 'tool_call') setActiveToolCall(event.tool)
          if (event.type === 'tool_result') setActiveToolCall(null)
          if (event.type === 'delta') setStreamingText((prev) => prev + event.text)
          if (event.type === 'done') {
            qc.invalidateQueries({ queryKey: ['case', caseId, 'console-history'] })
            qc.invalidateQueries({ queryKey: ['case', caseId] })
          }
          if (event.type === 'error') throw new Error(event.message)
        }
      } finally {
        setIsPending(false)
        setActiveToolCall(null)
      }
    },
    [caseId, headers, qc]
  )

  return { submit, isPending, activeToolCall, streamingText }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit
```

Expected: No errors. If there are errors about `ConsoleSSEEvent` or `ToolCallRecord`, ensure they are exported from `types/index.ts`.

- [ ] **Step 5: Commit**

```bash
git add frontend/types/index.ts frontend/lib/api.ts
git commit -m "feat: add SSE streaming hook and ConsoleSSEEvent types"
```

---

## Task 8: Frontend — Update AnalystConsole Component

**Files:**
- Modify: `frontend/components/console/AnalystConsole.tsx`

- [ ] **Step 1: Rewrite AnalystConsole.tsx**

Replace the full contents of `frontend/components/console/AnalystConsole.tsx` with:

```tsx
'use client'
import { useState } from 'react'
import { useConsoleHistory, useStreamConsolePrompt } from '@/lib/api'
import { ContextToggles, CONTEXT_LABELS, type ContextFlags } from './ContextToggles'
import { PromptHistory } from './PromptHistory'

const TEMPLATES = [
  { key: 'attribution', label: 'Attribution analysis' },
  { key: 'exfil', label: 'Exfil scope check' },
  { key: 'blast_radius', label: 'Blast radius' },
  { key: 'hunt_iocs', label: 'Hunt new IOCs' },
  { key: 'exec_summary', label: 'Exec summary' },
  { key: 'remediation', label: 'Remediation steps' },
  { key: 'timeline', label: 'Reconstruct timeline' },
  { key: '', label: 'Custom' },
]

const DEFAULT_CONTEXT_FLAGS: ContextFlags = {
  case_details: true,
  ldap: true,
  ioc_data: true,
  virustotal: false,
  abuseipdb: false,
  mcp_findings: true,
  playbook_state: true,
}

const MODES = ['Free-form', 'Structured', 'Chain-of-thought']

const TOOL_LABELS: Record<string, string> = {
  search_for_files_urls_domains_ips_and_comments: 'VirusTotal',
  search_for_an_ip_address: 'AbuseIPDB check',
  get_reports_for_an_ip_address: 'AbuseIPDB reports',
}

export function AnalystConsole({ caseId }: { caseId: string | null }) {
  const [prompt, setPrompt] = useState('')
  const [template, setTemplate] = useState('')
  const [mode, setMode] = useState(MODES[0])
  const [contextFlags, setContextFlags] = useState<ContextFlags>(DEFAULT_CONTEXT_FLAGS)

  const consoleHistory = useConsoleHistory(caseId ?? '')
  const { submit, isPending, activeToolCall, streamingText } = useStreamConsolePrompt(caseId ?? '')
  const turns = consoleHistory.data?.history ?? []

  function handleSubmit() {
    if (!caseId || (!prompt.trim() && !template)) return
    submit({
      prompt,
      template: template || undefined,
      context_flags: contextFlags,
    })
    setPrompt('')
    setTemplate('')
  }

  function handleReuse(reusedPrompt: string) {
    setPrompt(reusedPrompt)
    setTemplate('')
  }

  return (
    <aside className="w-[240px] flex-shrink-0 bg-panel border-l border-subtle flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-3 pt-2 pb-1 border-b border-subtle">
        <p className="font-mono text-[9px] text-accent-blue tracking-widest">AI CONSOLE</p>
        {!caseId && (
          <p className="font-mono text-[8px] text-dim mt-1">select a case to enable</p>
        )}
      </div>

      {/* History + streaming area */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        {/* Active tool-call chip */}
        {activeToolCall && (
          <div className="flex items-center gap-1 px-2 py-1 bg-elevated rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
            <span className="font-mono text-[8px] text-accent-blue">
              Checking {TOOL_LABELS[activeToolCall] ?? activeToolCall}…
            </span>
          </div>
        )}

        {/* Streaming response bubble */}
        {isPending && streamingText && (
          <div className="px-2 py-1.5 bg-elevated rounded">
            <p className="font-mono text-[9px] text-primary whitespace-pre-wrap">{streamingText}</p>
            <span className="inline-block w-1 h-3 bg-accent-blue animate-pulse ml-0.5" />
          </div>
        )}

        {consoleHistory.isLoading ? (
          <p className="font-mono text-[9px] text-dim">Loading history...</p>
        ) : (
          <PromptHistory turns={turns} onReuse={handleReuse} />
        )}
      </div>

      {/* Template chips + input */}
      <div className="flex-shrink-0 border-t border-subtle px-2 py-2">
        <p className="font-mono text-[8px] text-dim uppercase tracking-widest mb-1">Analyst prompt</p>
        <ContextToggles flags={contextFlags} onChange={setContextFlags} />

        <div className="flex flex-wrap gap-1 mt-2">
          {MODES.map((modeLabel) => (
            <button
              key={modeLabel}
              onClick={() => setMode(modeLabel)}
              type="button"
              className={`font-mono text-[8px] px-1.5 py-0.5 rounded transition ${
                mode === modeLabel
                  ? 'bg-accent-blue text-white'
                  : 'bg-elevated text-muted hover:text-primary'
              }`}
            >
              {modeLabel}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          {TEMPLATES.map((item) => (
            <button
              key={item.label}
              onClick={() => setTemplate(item.key)}
              type="button"
              className={`font-mono text-[8px] px-1.5 py-0.5 rounded transition ${
                template === item.key
                  ? 'bg-accent-blue text-white'
                  : 'bg-elevated text-muted hover:text-primary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 mt-2">
          <input
            disabled={!caseId || isPending}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            className="flex-1 bg-base border border-subtle rounded font-mono text-[9px] text-primary px-2 py-1 outline-none focus:border-accent-blue disabled:opacity-40 placeholder:text-dim"
            placeholder={caseId ? 'ask anything...' : 'no case selected'}
          />
          <button
            disabled={!caseId || isPending || (!prompt.trim() && !template)}
            onClick={handleSubmit}
            type="button"
            className="bg-accent-green px-2 py-1 rounded font-mono text-[9px] text-white disabled:opacity-40 hover:opacity-80 transition-opacity"
          >
            {isPending ? '…' : '→'}
          </button>
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/console/AnalystConsole.tsx
git commit -m "feat: update AnalystConsole to stream SSE and show tool-call status chips"
```

---

## Task 9: Run Full Test Suite and Smoke Test

- [ ] **Step 1: Run all backend tests**

```bash
cd backend
pytest -v
```

Expected: All tests pass. Pay attention to any test that previously monkeypatched `generate_console_response` — those are now replaced in Task 6.

- [ ] **Step 2: Verify the app starts**

```bash
cd backend
uvicorn app.main:app --reload
```

Expected: No import errors. App starts on port 8000.

- [ ] **Step 3: Set OPENAI_API_KEY in your .env**

Add to `backend/.env` (create if it doesn't exist):

```
OPENAI_API_KEY=sk-your-key-here
TINES_WEBHOOK_URL=https://<YOUR-TINES-TENANT>.tines.com/mcp/<YOUR-TOKEN>
DEMO_MODE=false
```

- [ ] **Step 4: Manual smoke test**

With both backend and frontend running, open a case in the UI and type in the AI Console: `Is this case related to ransomware?`

Expected:
- The `→` button shows `…` while pending
- If the case has an IOC, ChatGPT may show "Checking VirusTotal…" chip
- The chip disappears and the response appears
- After completion, the history panel shows the new turn

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: ChatGPT + Tines MCP agentic console — full integration"
```
