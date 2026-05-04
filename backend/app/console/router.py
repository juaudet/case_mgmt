import json
from datetime import datetime, timezone
from uuid import uuid4

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.auth.models import UserInDB
from app.cases.service import get_case
from app.console.service import build_system_prompt
from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.enrichment.tines_client import call_tool as tines_call_tool
from app.mcp.service import _case_object_id

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

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
    context_flags: dict = Field(default_factory=dict)


def _get_openai_api_key() -> str:
    key = settings.OPENAI_API_KEY.strip()
    if key:
        return key
    raise HTTPException(status_code=503, detail="OpenAI API key is not configured")


def _tines_url() -> str:
    return (settings.TINES_WEBHOOK_URL or settings.TINES_MCP_URL or "").strip()


def _build_messages(history: list[dict], system_prompt: str, prompt: str) -> list[dict]:
    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    for turn in reversed(history):  # history is stored newest-first; reverse for chronological order
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
@limiter.limit("10/minute")
async def stream_console(
    request: Request,
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
                    try:
                        args = json.loads(tc.function.arguments)
                    except json.JSONDecodeError:
                        args = {}
                    yield f"data: {json.dumps({'type': 'tool_call', 'tool': tc.function.name, 'args': args, 'status': 'running'})}\n\n"

                    if tines_url:
                        try:
                            raw = await tines_call_tool(tines_url, tc.function.name, args)
                        except Exception as exc:
                            raw = {"error": str(exc)}
                    else:
                        raw = {"error": "Tines MCP URL not configured"}
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
            else:
                response_text = "[Max tool iterations reached without a final response.]"

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
            result = await db.cases.update_one(
                {"_id": _case_object_id(case_id)},
                _build_db_update(turn, tool_calls_used, all_findings, now, current_user.email),
            )
            if result.matched_count == 0:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Case not found during save'})}\n\n"
                return
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


@router.get("/cases/{case_id}/console/templates")
async def get_templates(current_user: UserInDB = Depends(get_current_user)) -> dict:
    return {"templates": list(PROMPT_TEMPLATES.keys())}
