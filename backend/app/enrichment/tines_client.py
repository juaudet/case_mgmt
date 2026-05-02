"""POST JSON-RPC tools/call to a Tines MCP webhook (backend-only path; no sidecar)."""

import json
import logging

import httpx

logger = logging.getLogger(__name__)


async def call_tool(webhook_url: str, tines_tool_name: str, arguments: dict) -> dict:
    """Call *tines_tool_name* on the given Tines MCP URL."""
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {"name": tines_tool_name, "arguments": arguments},
    }
    headers = {"Content-Type": "application/json", "Accept": "application/json"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(webhook_url, json=payload, headers=headers)
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
        logger.warning("Tines error calling %s: %s", tines_tool_name, rpc["error"])
        return {"error": rpc["error"]}

    return rpc
