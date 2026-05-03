import json
from app.console.service import build_system_prompt
from app.cases.models import Case


def _make_case(**kwargs) -> Case:
    defaults = {
        "id": "abc123",
        "case_number": "CASE-001",
        "title": "SSH Brute Force",
        "description": "Repeated failed SSH logins",
        "severity": "high",
        "status": "open",
        "mitre_tactics": [],
        "mitre_techniques": [],
        "tags": [],
        "created_at": "2026-05-02T00:00:00Z",
        "updated_at": "2026-05-02T00:00:00Z",
        "created_by": "analyst@test.local",
        "timeline": [],
        "iocs": [],
        "mcp_calls": [],
        "mcp_findings": [],
        "console_history": [],
    }
    defaults.update(kwargs)
    return Case(**defaults)


def test_system_prompt_contains_case_json():
    case = _make_case(title="My Malware Case")
    prompt = build_system_prompt(case, {})
    assert "My Malware Case" in prompt
    assert "CASE CONTEXT" in prompt


def test_system_prompt_contains_severity():
    case = _make_case(severity="critical")
    prompt = build_system_prompt(case, {})
    assert "critical" in prompt


def test_system_prompt_always_has_persona():
    case = _make_case()
    prompt = build_system_prompt(case, {})
    assert "SOC analyst" in prompt
    assert "tools" in prompt.lower()
