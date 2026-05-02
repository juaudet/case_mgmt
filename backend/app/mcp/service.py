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
