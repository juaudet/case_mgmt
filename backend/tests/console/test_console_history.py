import json
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import AsyncClient


async def _create_case(async_client: AsyncClient, analyst_token: str) -> str:
    resp = await async_client.post(
        "/api/v1/cases",
        json={
            "title": "Console Test Case",
            "description": "Case for prompt history",
            "severity": "high",
            "status": "open",
            "mitre_tactics": ["TA0001"],
            "mitre_techniques": ["T1566.001"],
            "tags": ["console"],
        },
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 201
    return resp.json()["id"]


def _openai_text_response(text: str) -> MagicMock:
    msg = MagicMock()
    msg.content = text
    msg.tool_calls = None
    choice = MagicMock()
    choice.message = msg
    resp = MagicMock()
    resp.choices = [choice]
    return resp


def _openai_tool_call_response(tool_name: str, arguments: dict) -> MagicMock:
    tc = MagicMock()
    tc.id = "call_abc123"
    tc.function.name = tool_name
    tc.function.arguments = json.dumps(arguments)
    msg = MagicMock()
    msg.content = None
    msg.tool_calls = [tc]
    choice = MagicMock()
    choice.message = msg
    resp = MagicMock()
    resp.choices = [choice]
    return resp


@pytest.mark.asyncio
async def test_console_history_starts_empty(
    async_client: AsyncClient, analyst_token: str
) -> None:
    case_id = await _create_case(async_client, analyst_token)
    resp = await async_client.get(
        f"/api/v1/cases/{case_id}/console/history",
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 200
    assert resp.json() == {"history": []}


@pytest.mark.asyncio
async def test_console_prompt_persists_response(
    async_client: AsyncClient, analyst_token: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    case_id = await _create_case(async_client, analyst_token)

    mock_create = AsyncMock(
        return_value=_openai_text_response("Initial access was likely spearphishing.")
    )
    monkeypatch.setattr("app.console.router.AsyncOpenAI", lambda api_key: MagicMock(
        chat=MagicMock(completions=MagicMock(create=mock_create))
    ))
    monkeypatch.setattr("app.console.router._get_openai_api_key", lambda: "sk-test")

    resp = await async_client.post(
        f"/api/v1/cases/{case_id}/console/prompt",
        json={
            "prompt": "What is the likely initial access vector?",
            "template": None,
            "context_flags": {"case_details": True, "ioc_data": True},
        },
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["turn"]["response"].startswith("Initial access")
    assert body["turn"]["sources_used"] == ["case_details", "ioc_data"]
    assert body["turn"]["tool_calls_used"] == []

    history_resp = await async_client.get(
        f"/api/v1/cases/{case_id}/console/history",
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert len(history_resp.json()["history"]) == 1


@pytest.mark.asyncio
async def test_console_history_is_multi_turn(
    async_client: AsyncClient, analyst_token: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    case_id = await _create_case(async_client, analyst_token)
    responses = [
        _openai_text_response("First answer."),
        _openai_text_response("Second answer."),
    ]
    call_count = 0

    async def fake_create(**kwargs):
        nonlocal call_count
        result = responses[min(call_count, len(responses) - 1)]
        call_count += 1
        if call_count == 1:
            assert len(kwargs["messages"]) == 2  # system + first user message
        if call_count == 2:
            assert len(kwargs["messages"]) == 4  # system + user1 + assistant1 + user2
        return result

    monkeypatch.setattr("app.console.router.AsyncOpenAI", lambda api_key: MagicMock(
        chat=MagicMock(completions=MagicMock(create=fake_create))
    ))
    monkeypatch.setattr("app.console.router._get_openai_api_key", lambda: "sk-test")

    for prompt in ["First question.", "Second question."]:
        await async_client.post(
            f"/api/v1/cases/{case_id}/console/prompt",
            json={"prompt": prompt, "context_flags": {}},
            headers={"Authorization": f"Bearer {analyst_token}"},
        )

    history = (
        await async_client.get(
            f"/api/v1/cases/{case_id}/console/history",
            headers={"Authorization": f"Bearer {analyst_token}"},
        )
    ).json()["history"]
    assert len(history) == 2


@pytest.mark.asyncio
async def test_tool_call_recorded_in_mcp_calls(
    async_client: AsyncClient, analyst_token: str, monkeypatch: pytest.MonkeyPatch,
    test_db
) -> None:
    case_id = await _create_case(async_client, analyst_token)

    abuseipdb_raw = {
        "data": {
            "ipAddress": "1.2.3.4",
            "abuseConfidenceScore": 90,
            "countryCode": "CN",
            "isp": "Test ISP",
            "domain": "test.com",
            "isTor": False,
            "totalReports": 50,
            "numDistinctUsers": 20,
            "lastReportedAt": "2026-05-01T00:00:00Z",
        }
    }
    call_count = 0

    async def fake_create(**kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return _openai_tool_call_response(
                "search_for_an_ip_address", {"ip_address": "1.2.3.4"}
            )
        return _openai_text_response("IP 1.2.3.4 has abuse score 90, classified as malicious.")

    monkeypatch.setattr("app.console.router.AsyncOpenAI", lambda api_key: MagicMock(
        chat=MagicMock(completions=MagicMock(create=fake_create))
    ))
    monkeypatch.setattr("app.console.router._get_openai_api_key", lambda: "sk-test")
    monkeypatch.setattr(
        "app.console.router.tines_call_tool",
        AsyncMock(return_value=abuseipdb_raw),
    )
    monkeypatch.setattr("app.console.router._tines_url", lambda: "https://tines.example.com/mcp/abc")

    resp = await async_client.post(
        f"/api/v1/cases/{case_id}/console/prompt",
        json={"prompt": "Is 1.2.3.4 malicious?", "context_flags": {}},
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 200
    turn = resp.json()["turn"]
    assert len(turn["tool_calls_used"]) == 1
    assert turn["tool_calls_used"][0]["tool"] == "search_for_an_ip_address"
    assert turn["tool_calls_used"][0]["result_summary"]["abuse_confidence_score"] == 90

    from bson import ObjectId
    doc = await test_db.cases.find_one({"_id": ObjectId(case_id)})
    assert len(doc.get("mcp_calls", [])) >= 1
    assert doc["mcp_calls"][0]["tool_name"] == "search_for_an_ip_address"
    assert len(doc.get("mcp_findings", [])) >= 1


@pytest.mark.asyncio
async def test_tines_unavailable_returns_graceful_response(
    async_client: AsyncClient, analyst_token: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    case_id = await _create_case(async_client, analyst_token)
    call_count = 0

    async def fake_create(**kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return _openai_tool_call_response(
                "search_for_an_ip_address", {"ip_address": "5.6.7.8"}
            )
        return _openai_text_response("Could not retrieve live data. Based on case context, proceed with caution.")

    monkeypatch.setattr("app.console.router.AsyncOpenAI", lambda api_key: MagicMock(
        chat=MagicMock(completions=MagicMock(create=fake_create))
    ))
    monkeypatch.setattr("app.console.router._get_openai_api_key", lambda: "sk-test")
    monkeypatch.setattr("app.console.router._tines_url", lambda: "")
    monkeypatch.setattr(
        "app.console.router.tines_call_tool",
        AsyncMock(side_effect=AssertionError("tines_call_tool should not be called when URL is empty")),
    )

    resp = await async_client.post(
        f"/api/v1/cases/{case_id}/console/prompt",
        json={"prompt": "Is 5.6.7.8 malicious?", "context_flags": {}},
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 200
    assert "proceed" in resp.json()["turn"]["response"].lower()
    turn = resp.json()["turn"]
    # Tool call was attempted (OpenAI requested it) but Tines was skipped — error recorded in summary
    assert len(turn["tool_calls_used"]) == 1
    assert "error" in turn["tool_calls_used"][0]["result_summary"]


@pytest.mark.asyncio
async def test_loop_guard_exits_after_max_iterations(
    async_client: AsyncClient, analyst_token: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    case_id = await _create_case(async_client, analyst_token)

    async def always_tool_call(**kwargs):
        return _openai_tool_call_response(
            "search_for_an_ip_address", {"ip_address": "9.9.9.9"}
        )

    monkeypatch.setattr("app.console.router.AsyncOpenAI", lambda api_key: MagicMock(
        chat=MagicMock(completions=MagicMock(create=always_tool_call))
    ))
    monkeypatch.setattr("app.console.router._get_openai_api_key", lambda: "sk-test")
    monkeypatch.setattr(
        "app.console.router.tines_call_tool",
        AsyncMock(return_value={"data": {"abuseConfidenceScore": 0}}),
    )
    monkeypatch.setattr("app.console.router._tines_url", lambda: "https://tines.example.com/mcp/abc")

    resp = await async_client.post(
        f"/api/v1/cases/{case_id}/console/prompt",
        json={"prompt": "Loop forever?", "context_flags": {}},
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 200
    turn = resp.json()["turn"]
    assert len(turn["tool_calls_used"]) == 5
    assert "Max tool iterations" in turn["response"]
