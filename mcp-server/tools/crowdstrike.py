import os
import httpx
from fastmcp import FastMCP

def register_cs_tools(mcp: FastMCP, demo_mode: bool, load_mock):

    @mcp.tool()
    async def cs_host_details(device_id: str) -> dict:
        """Get CrowdStrike Falcon host details: OS, sensor version, prevention policy, last seen, containment status."""
        if demo_mode:
            return load_mock(f"cs_host_{device_id}.json")
        token = await _get_cs_token()
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://api.crowdstrike.com/devices/entities/devices/v2",
                headers={"Authorization": f"Bearer {token}"},
                params={"ids": device_id},
            )
            return r.json()

    @mcp.tool()
    async def cs_process_tree(device_id: str, hash: str, timestamp: str) -> dict:
        """Get parent/child process chain for a given hash + device + timestamp via CrowdStrike."""
        if demo_mode:
            return load_mock("cs_process_tree.json")
        token = await _get_cs_token()
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://api.crowdstrike.com/processes/queries/processes/v1",
                headers={"Authorization": f"Bearer {token}"},
                params={"device_id": device_id, "sha256": hash},
            )
            return r.json()

    @mcp.tool()
    async def cs_contain_host(device_id: str, action: str = "contain") -> dict:
        """Network-isolate or lift containment on a host via CrowdStrike Real Time Response."""
        if demo_mode:
            return {"device_id": device_id, "action": action, "status": "success", "demo": True,
                    "message": f"Host {device_id} {action}ment initiated (DEMO MODE)"}
        token = await _get_cs_token()
        async with httpx.AsyncClient() as client:
            r = await client.post(
                "https://api.crowdstrike.com/devices/entities/devices-actions/v2",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={"action_name": action, "ids": [device_id]},
            )
            return r.json()

    @mcp.tool()
    async def cs_ioc_search(indicator: str, indicator_type: str = "ip_address") -> dict:
        """Hunt a hash, IP, or domain across all CrowdStrike-monitored hosts."""
        if demo_mode:
            return load_mock("cs_ioc_search_finance.json")
        token = await _get_cs_token()
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://api.crowdstrike.com/iocs/queries/indicators/v1",
                headers={"Authorization": f"Bearer {token}"},
                params={"value": indicator, "type": indicator_type},
            )
            return r.json()

async def _get_cs_token() -> str:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://api.crowdstrike.com/oauth2/token",
            data={
                "client_id": os.getenv("CS_CLIENT_ID", ""),
                "client_secret": os.getenv("CS_CLIENT_SECRET", ""),
            },
        )
        return r.json()["access_token"]
