import os
import json
from pathlib import Path
from fastmcp import FastMCP
from tools.tines_proxy import register_tines_tools

DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"
MOCK_DIR = Path(__file__).parent / "mock_responses"

def load_mock(filename: str) -> dict:
    path = MOCK_DIR / filename
    if path.exists():
        return json.loads(path.read_text())
    return {"error": f"No mock fixture for {filename}", "demo_mode": True}

mcp = FastMCP("siem-enrichment")

register_tines_tools(mcp, DEMO_MODE, load_mock)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(mcp.sse_app(), host="0.0.0.0", port=8001)
