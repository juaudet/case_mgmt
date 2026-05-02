import pytest

from app.core.config import Settings
from app.services.tines_mcp_bridge import resolve_tines_invocation


@pytest.fixture
def tines_settings() -> Settings:
    return Settings(
        JWT_SECRET_KEY="demo_jwt_secret_key_change_me_0123456789abcdef",
        TINES_VT_TOOL="vt_story",
        TINES_ABUSEIPDB_CHECK_TOOL="abuse_check",
        TINES_ABUSEIPDB_REPORTS_TOOL="abuse_reports",
    )


def test_resolve_vt_ip(tines_settings: Settings):
    name, args = resolve_tines_invocation(tines_settings, "vt_ip_report", {"ip": "1.2.3.4"})
    assert name == "vt_story"
    assert args == {"query": "1.2.3.4"}


def test_resolve_abuseipdb_reports_defaults(tines_settings: Settings):
    name, args = resolve_tines_invocation(
        tines_settings, "abuseipdb_ip_reports", {"ip": "10.0.0.1"}
    )
    assert name == "abuse_reports"
    assert args["ip_address"] == "10.0.0.1"
    assert args["max_age_in_days"] == 30
    assert args["page"] == 1
    assert args["per_page"] == 25


def test_resolve_unknown_tool(tines_settings: Settings):
    with pytest.raises(ValueError, match="Unsupported"):
        resolve_tines_invocation(tines_settings, "unknown_tool", {})
