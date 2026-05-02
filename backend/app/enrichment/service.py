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
