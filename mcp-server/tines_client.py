"""
Tines webhook client for the MCP sidecar.

This is the only outbound integration: JSON-RPC `tools/call` POST to the
Tines MCP/webhook URL. `TINES_WEBHOOK_URL` is preferred; `TINES_MCP_URL` is
accepted as an alias.
"""

import json
import logging
import os

import httpx

logger = logging.getLogger(__name__)

TINES_WEBHOOK_URL = os.getenv("TINES_WEBHOOK_URL") or os.getenv("TINES_MCP_URL", "")


async def call_tool(tool_name: str, arguments: dict) -> dict:
    """Call *tool_name* on the configured Tines MCP server."""
    if not TINES_WEBHOOK_URL:
        return {"error": "TINES_WEBHOOK_URL or TINES_MCP_URL is not configured"}

    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {"name": tool_name, "arguments": arguments},
    }
    headers = {"Content-Type": "application/json", "Accept": "application/json"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(TINES_WEBHOOK_URL, json=payload, headers=headers)
        resp.raise_for_status()
        rpc = resp.json()

    if "result" in rpc:
        content = rpc["result"].get("content", [])
        texts = [c.get("text", "") for c in content if c.get("type") == "text"]
        if texts:
            raw = "\n".join(texts)
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                return {"text": raw}
        return rpc["result"]

    if "error" in rpc:
        logger.warning("Tines error calling %s: %s", tool_name, rpc["error"])
        return {"error": rpc["error"]}

    return rpc
