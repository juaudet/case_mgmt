"""Tests for MCP tool functions in demo mode."""
import pytest
import json
from pathlib import Path

MOCK_DIR = Path(__file__).parent.parent / "mock_responses"

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

def test_cs_host_mock_exists():
    data = load_mock("cs_host_WKST-MW-007.json")
    assert "resources" in data
    assert data["resources"][0]["hostname"] == "WKST-MW-007"

def test_cs_ioc_search_mock_exists():
    data = load_mock("cs_ioc_search_finance.json")
    assert "resources" in data
    assert len(data["resources"]) == 2
    # Both hosts should be in Finance OU
    for host in data["resources"]:
        assert "Finance" in host["ou"]

def test_otx_indicator_ip_mock_exists():
    data = load_mock("otx_indicator_185.220.101.47.json")
    assert data["indicator"] == "185.220.101.47"
    assert data["pulse_count"] > 0

def test_ldap_user_mock_exists():
    data = load_mock("ldap_user_jwong.json")
    assert data["username"] == "jwong"
    assert data["mfa_enabled"] is True

def test_ldap_privileged_user():
    data = load_mock("ldap_user_msmith.json")
    assert data["privileged"] is True
    assert "Domain-Admins" in data["admin_groups"]

def test_all_mock_files_valid_json():
    """All mock response files must be valid JSON."""
    for f in MOCK_DIR.glob("*.json"):
        data = json.loads(f.read_text())
        assert isinstance(data, dict), f"{f.name} is not a dict"
