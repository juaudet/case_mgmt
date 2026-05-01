import os
import httpx
from fastmcp import FastMCP

def register_otx_tools(mcp: FastMCP, demo_mode: bool, load_mock):

    @mcp.tool()
    async def otx_pulse_search(query: str) -> dict:
        """Search AlienVault OTX for threat intel pulses matching an IOC. Returns campaign tags, malware family."""
        if demo_mode:
            return load_mock(f"otx_indicator_{query}.json")
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://otx.alienvault.com/api/v1/search/pulses",
                headers={"X-OTX-API-KEY": os.getenv("OTX_API_KEY", "")},
                params={"q": query, "limit": 10},
            )
            return r.json()

    @mcp.tool()
    async def otx_indicator(indicator: str, type: str = "IPv4") -> dict:
        """Get OTX reputation for an indicator. Returns related IPs, threat type, adversary attribution."""
        if demo_mode:
            return load_mock(f"otx_indicator_{indicator}.json")
        section_map = {
            "IPv4": "IPv4", "domain": "domain", "sha256": "file",
            "url": "url", "email": "email",
        }
        section = section_map.get(type, "IPv4")
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://otx.alienvault.com/api/v1/indicators/{section}/{indicator}/general",
                headers={"X-OTX-API-KEY": os.getenv("OTX_API_KEY", "")},
            )
            return r.json()
