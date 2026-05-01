import httpx

from app.core.config import settings


async def call_mcp_tool(tool_name: str, params: dict) -> dict:
    """Call the FastMCP sidecar. In DEMO_MODE returns empty dict (fixtures handled by MCP)."""
    if settings.DEMO_MODE:
        return {}
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{settings.MCP_SERVER_URL}/tools/{tool_name}",
            json=params,
        )
        resp.raise_for_status()
        return resp.json()


async def enrich_ioc(ioc_type: str, value: str) -> dict:
    results: dict = {}
    if ioc_type == "ipv4":
        results["virustotal"] = await call_mcp_tool("vt_ip_report", {"ip": value})
        results["otx"] = await call_mcp_tool("otx_indicator", {"indicator": value, "type": "IPv4"})
    elif ioc_type == "sha256":
        results["virustotal"] = await call_mcp_tool("vt_hash_lookup", {"hash": value})
    elif ioc_type == "domain":
        results["virustotal"] = await call_mcp_tool("vt_domain_scan", {"domain": value})
        results["otx"] = await call_mcp_tool("otx_indicator", {"indicator": value, "type": "domain"})
    return results


async def lookup_ldap_user(username: str) -> dict:
    return await call_mcp_tool("ldap_user_lookup", {"username": username})


async def geoip_lookup(ip: str) -> dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"http://ip-api.com/json/{ip}")
        resp.raise_for_status()
        return resp.json()
