from app.cases.models import CaseStatus, Severity
from app.cases.mock_feed import build_random_mock_case_create


def test_build_random_mock_case_create_shape() -> None:
    c = build_random_mock_case_create()
    assert c.title
    assert c.description
    assert c.status == CaseStatus.open
    assert c.severity in Severity
    assert "mock-feed" in c.tags
    assert "synthetic" in c.tags
    assert any(src in c.tags for src in ("sentinel", "splunk"))
    assert c.title.startswith("[SENTINEL]") or c.title.startswith("[SPLUNK]")
    assert c.assigned_to is None
    assert len(c.iocs) >= 1
    assert all(i.type and i.value for i in c.iocs)
