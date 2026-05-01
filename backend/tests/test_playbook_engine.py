import pytest

from app.models.playbook import Branch
from app.services.playbook_engine import evaluate_branch


def _make_branch(when: str, goto: str, label: str = "test") -> Branch:
    return Branch(when=when, goto=goto, label=label)


def test_gte_branch_matches() -> None:
    branches = [_make_branch("gte:70", "high_risk_step")]
    result = evaluate_branch("score", {"score": 75}, branches, "default_step")
    assert result == "high_risk_step"


def test_gte_branch_no_match() -> None:
    branches = [_make_branch("gte:70", "high_risk_step")]
    result = evaluate_branch("score", {"score": 65}, branches, "default_step")
    assert result == "default_step"


def test_lt_branch_matches() -> None:
    branches = [_make_branch("lt:70", "low_risk_step")]
    result = evaluate_branch("score", {"score": 50}, branches, "default_step")
    assert result == "low_risk_step"


def test_eq_branch_matches() -> None:
    branches = [_make_branch("eq:attachment", "attachment_step")]
    result = evaluate_branch("delivery_type", {"delivery_type": "attachment"}, branches, "default_step")
    assert result == "attachment_step"


def test_eq_branch_no_match() -> None:
    branches = [_make_branch("eq:attachment", "attachment_step")]
    result = evaluate_branch("delivery_type", {"delivery_type": "url"}, branches, "default_step")
    assert result == "default_step"


def test_contains_branch_matches() -> None:
    branches = [_make_branch("contains:FIN7", "fin7_step")]
    result = evaluate_branch("actor", {"actor": "FIN7 group suspected"}, branches, "default_step")
    assert result == "fin7_step"


def test_contains_branch_no_match() -> None:
    branches = [_make_branch("contains:FIN7", "fin7_step")]
    result = evaluate_branch("actor", {"actor": "APT29 suspected"}, branches, "default_step")
    assert result == "default_step"


def test_bool_branch_true() -> None:
    branches = [_make_branch("bool:true", "privileged_step")]
    result = evaluate_branch("is_privileged", {"is_privileged": True}, branches, "default_step")
    assert result == "privileged_step"


def test_bool_branch_false() -> None:
    branches = [_make_branch("bool:true", "privileged_step")]
    result = evaluate_branch("is_privileged", {"is_privileged": False}, branches, "default_step")
    assert result == "default_step"


def test_missing_field_uses_default() -> None:
    branches = [_make_branch("gte:70", "high_step")]
    result = evaluate_branch("nonexistent_field", {"score": 90}, branches, "fallback_step")
    assert result == "fallback_step"


def test_no_branches_returns_end() -> None:
    result = evaluate_branch("score", {"score": 90}, [], None)
    assert result == "END"


def test_multiple_branches_first_match_wins() -> None:
    branches = [
        _make_branch("gte:90", "critical_step"),
        _make_branch("gte:70", "high_step"),
        _make_branch("gte:50", "medium_step"),
    ]
    result = evaluate_branch("score", {"score": 95}, branches, "default_step")
    assert result == "critical_step"


def test_invalid_numeric_value_falls_through_to_default() -> None:
    branches = [_make_branch("gte:70", "high_step")]
    result = evaluate_branch("score", {"score": "not_a_number"}, branches, "safe_default")
    assert result == "safe_default"


def test_no_default_returns_end() -> None:
    branches = [_make_branch("eq:foo", "foo_step")]
    result = evaluate_branch("field", {"field": "bar"}, branches, None)
    assert result == "END"
