import os
import json
from pathlib import Path
from fastmcp import FastMCP
from tools.virustotal import register_vt_tools
from tools.crowdstrike import register_cs_tools
from tools.otx import register_otx_tools
from tools.ldap_tool import register_ldap_tools

DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"
MOCK_DIR = Path(__file__).parent / "mock_responses"

def load_mock(filename: str) -> dict:
    path = MOCK_DIR / filename
    if path.exists():
        return json.loads(path.read_text())
    return {"error": f"No mock fixture for {filename}", "demo_mode": True}

mcp = FastMCP("siem-enrichment")

register_vt_tools(mcp, DEMO_MODE, load_mock)
register_cs_tools(mcp, DEMO_MODE, load_mock)
register_otx_tools(mcp, DEMO_MODE, load_mock)
register_ldap_tools(mcp, DEMO_MODE, load_mock)

if __name__ == "__main__":
    import uvicorn
    # FastMCP exposes an ASGI app
    uvicorn.run(mcp.sse_app(), host="0.0.0.0", port=8001)
