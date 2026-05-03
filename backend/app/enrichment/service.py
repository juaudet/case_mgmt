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
