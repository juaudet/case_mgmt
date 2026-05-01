import os
import httpx
from fastmcp import FastMCP

def register_vt_tools(mcp: FastMCP, demo_mode: bool, load_mock):

    @mcp.tool()
    async def vt_ip_report(ip: str, include_resolutions: bool = True) -> dict:
        """Query VirusTotal v3 for IP reputation and resolution history."""
        if demo_mode:
            return load_mock(f"vt_ip_{ip}.json")
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://www.virustotal.com/api/v3/ip_addresses/{ip}",
                headers={"x-apikey": os.getenv("VT_API_KEY", "")},
            )
            return r.json()

    @mcp.tool()
    async def vt_hash_lookup(hash: str) -> dict:
        """Look up a file hash on VirusTotal. Returns malware family, detection count, sandbox verdict."""
        if demo_mode:
            return load_mock(f"vt_hash_{hash}.json")
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://www.virustotal.com/api/v3/files/{hash}",
                headers={"x-apikey": os.getenv("VT_API_KEY", "")},
            )
            return r.json()

    @mcp.tool()
    async def vt_domain_scan(domain: str) -> dict:
        """Scan a domain on VirusTotal. Returns category, registrar, resolving IPs, TLS org."""
        if demo_mode:
            return load_mock(f"vt_domain_{domain}.json")
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://www.virustotal.com/api/v3/domains/{domain}",
                headers={"x-apikey": os.getenv("VT_API_KEY", "")},
            )
            return r.json()

    @mcp.tool()
    async def vt_file_submit(url: str) -> dict:
        """Submit a file URL to VirusTotal for async scanning. Returns job ID."""
        if demo_mode:
            return {"analysis_id": "demo-analysis-12345", "status": "queued", "demo": True}
        async with httpx.AsyncClient() as client:
            r = await client.post(
                "https://www.virustotal.com/api/v3/urls",
                headers={"x-apikey": os.getenv("VT_API_KEY", "")},
                data={"url": url},
            )
            return r.json()
