"""Tests for MCP tool functions in demo mode."""
import sys
import pytest
import json
from pathlib import Path

MOCK_DIR = Path(__file__).parent.parent / "mock_responses"

# Make mcp-server importable
sys.path.insert(0, str(Path(__file__).parent.parent))

def load_mock(filename: str) -> dict:
    path = MOCK_DIR / filename
    if path.exists():
        return json.loads(path.read_text())
    return {"error": f"No mock for {filename}"}

# Test fixture loading
def test_vt_ip_mock_exists():
    data = load_mock("vt_ip_185.220.101.47.json")
    assert "data" in data
    assert data["data"]["id"] == "185.220.101.47"

def test_vt_ip_has_score():
    data = load_mock("vt_ip_185.220.101.47.json")
    assert data["meta"]["score"] == 92

def test_vt_hash_mock_exists():
    data = load_mock("vt_hash_a3f1c9b2e847d6f0391cc52a4e1b7f3d.json")
    assert "data" in data
    assert "mimikatz" in data["data"]["attributes"]["meaningful_name"].lower()

def test_vt_domain_mock_exists():
    data = load_mock("vt_domain_corp-mail-auth.ru.json")
    assert "data" in data
    assert data["data"]["attributes"]["reputation"] < 0

def test_all_mock_files_valid_json():
    """All mock response files must be valid JSON."""
    for f in MOCK_DIR.glob("*.json"):
        data = json.loads(f.read_text())
        assert isinstance(data, dict), f"{f.name} is not a dict"


# ---------------------------------------------------------------------------
# WannaCry hash mock (SHA-256)
# ---------------------------------------------------------------------------
WANNACRY_HASH = "24d004a104d4d54034dbcffc2a4b19a11f39008a575aa614ea04703480b1022c"

def test_vt_wannacry_hash_mock_exists():
    data = load_mock(f"vt_hash_{WANNACRY_HASH}.json")
    assert "data" in data
    assert data["data"]["id"] == WANNACRY_HASH

def test_vt_wannacry_hash_malware_name():
    data = load_mock(f"vt_hash_{WANNACRY_HASH}.json")
    name = data["data"]["attributes"]["meaningful_name"].lower()
    assert "wannacry" in name or "mssecsvc" in name

def test_vt_wannacry_hash_high_detection():
    data = load_mock(f"vt_hash_{WANNACRY_HASH}.json")
    stats = data["data"]["attributes"]["last_analysis_stats"]
    assert stats["malicious"] >= 60, "Expected high malicious detection count"
    assert stats["harmless"] == 0

def test_vt_wannacry_hash_score():
    data = load_mock(f"vt_hash_{WANNACRY_HASH}.json")
    assert data["meta"]["score"] == 99

def test_vt_wannacry_hash_threat_label():
    data = load_mock(f"vt_hash_{WANNACRY_HASH}.json")
    label = data["data"]["attributes"]["popular_threat_classification"]["suggested_threat_label"]
    assert "wannacry" in label.lower()

def test_vt_wannacry_hash_sandbox_verdicts():
    data = load_mock(f"vt_hash_{WANNACRY_HASH}.json")
    verdicts = data["data"]["attributes"]["sandbox_verdicts"]
    assert len(verdicts) >= 1
    for verdict in verdicts.values():
        assert verdict["category"] == "malicious"

def test_vt_wannacry_hash_tags():
    data = load_mock(f"vt_hash_{WANNACRY_HASH}.json")
    tags = data["data"]["attributes"]["tags"]
    assert "ransomware" in tags
    assert any("cve-2017" in t for t in tags), "Expected EternalBlue CVE tag"

def test_vt_wannacry_hash_checksums():
    """SHA-256 mock includes md5/sha1 cross-references."""
    data = load_mock(f"vt_hash_{WANNACRY_HASH}.json")
    attrs = data["data"]["attributes"]
    assert "md5" in attrs
    assert "sha1" in attrs
    assert attrs["sha256"] == WANNACRY_HASH


# ---------------------------------------------------------------------------
# vt_hash_lookup tool — direct invocation in demo mode
# ---------------------------------------------------------------------------
from fastmcp import FastMCP
from tools.tines_proxy import register_tines_tools


def _make_demo_mcp():
    """Build a minimal FastMCP instance with Tines-proxy tools in demo mode."""
    mcp = FastMCP("test-siem")
    register_tines_tools(mcp, demo_mode=True, load_mock=load_mock)
    return mcp


@pytest.mark.asyncio
async def test_vt_hash_lookup_known_hash():
    """Tool returns correct data for a hash that has a mock fixture."""
    mcp = _make_demo_mcp()
    tools = await mcp.get_tools()
    result = await tools["vt_hash_lookup"].fn(hash=WANNACRY_HASH)
    assert result["data"]["id"] == WANNACRY_HASH
    assert result["meta"]["score"] == 99


@pytest.mark.asyncio
async def test_vt_hash_lookup_mimikatz_hash():
    """Tool returns mimikatz data for the known mimikatz fixture."""
    mcp = _make_demo_mcp()
    tools = await mcp.get_tools()
    result = await tools["vt_hash_lookup"].fn(hash="a3f1c9b2e847d6f0391cc52a4e1b7f3d")
    assert "mimikatz" in result["data"]["attributes"]["meaningful_name"].lower()


@pytest.mark.asyncio
async def test_vt_hash_lookup_random_hash_returns_error():
    """Tool returns an error dict (not an exception) for an unknown random hash."""
    random_hash = "deadbeefcafe0000111122223333444455556666777788889999aaaabbbbcccc"
    mcp = _make_demo_mcp()
    tools = await mcp.get_tools()
    result = await tools["vt_hash_lookup"].fn(hash=random_hash)
    assert "error" in result, "Expected error key for hash with no mock fixture"
    assert random_hash in result["error"] or "mock" in result["error"].lower()
