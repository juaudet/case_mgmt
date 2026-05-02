"""Register enrichment tools that forward to Tines (single webhook / MCP URL)."""

import os

from fastmcp import FastMCP

import tines_client

TINES_VT_TOOL = os.getenv(
    "TINES_VT_TOOL", "search_for_files_urls_domains_ips_and_comments"
)
ABUSEIPDB_CHECK_TOOL = os.getenv(
    "TINES_ABUSEIPDB_CHECK_TOOL", "search_for_an_ip_address"
)
ABUSEIPDB_REPORTS_TOOL = os.getenv(
    "TINES_ABUSEIPDB_REPORTS_TOOL", "get_reports_for_an_ip_address"
)


def register_tines_tools(mcp: FastMCP, demo_mode: bool, load_mock) -> None:
    """Expose VT- and AbuseIPDB-shaped tools; live mode calls Tines only."""

    @mcp.tool()
    async def vt_ip_report(ip: str, include_resolutions: bool = True) -> dict:
        """Query VirusTotal for IP reputation and resolution history."""
        if demo_mode:
            return load_mock(f"vt_ip_{ip}.json")
        return await tines_client.call_tool(TINES_VT_TOOL, {"query": ip})

    @mcp.tool()
    async def vt_hash_lookup(hash: str) -> dict:
        """Look up a file hash on VirusTotal. Returns malware family, detection count, sandbox verdict."""
        if demo_mode:
            return load_mock(f"vt_hash_{hash}.json")
        return await tines_client.call_tool(TINES_VT_TOOL, {"query": hash})

    @mcp.tool()
    async def vt_domain_scan(domain: str) -> dict:
        """Scan a domain on VirusTotal. Returns category, registrar, resolving IPs, TLS org."""
        if demo_mode:
            return load_mock(f"vt_domain_{domain}.json")
        return await tines_client.call_tool(TINES_VT_TOOL, {"query": domain})

    @mcp.tool()
    async def vt_file_submit(url: str) -> dict:
        """Submit a file URL to VirusTotal for async scanning. Returns job ID."""
        if demo_mode:
            return {"analysis_id": "demo-analysis-12345", "status": "queued", "demo": True}
        return await tines_client.call_tool(TINES_VT_TOOL, {"query": url})

    @mcp.tool()
    async def abuseipdb_check_ip(ip: str, max_age_in_days: int = 30) -> dict:
        """Check an IP address against AbuseIPDB. Returns confidence score, ISP, usage type, and country."""
        if demo_mode:
            return load_mock(f"abuseipdb_ip_{ip}.json")
        return await tines_client.call_tool(
            ABUSEIPDB_CHECK_TOOL,
            {"ip_address": ip, "max_age_in_days": max_age_in_days},
        )

    @mcp.tool()
    async def abuseipdb_ip_reports(
        ip: str,
        max_age_in_days: int = 30,
        page: int = 1,
        per_page: int = 25,
    ) -> dict:
        """Get paginated abuse reports for an IP from AbuseIPDB."""
        if demo_mode:
            return load_mock(f"abuseipdb_reports_{ip}.json")
        return await tines_client.call_tool(
            ABUSEIPDB_REPORTS_TOOL,
            {
                "ip_address": ip,
                "max_age_in_days": max_age_in_days,
                "page": page,
                "per_page": per_page,
            },
        )
