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

    async def fake_response(prompt_text: str, system_prompt: str) -> str:
        return "Initial access was likely spearphishing with high confidence."

    monkeypatch.setattr("app.api.v1.console.generate_console_response", fake_response)

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

    history_resp = await async_client.get(
        f"/api/v1/cases/{case_id}/console/history",
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert len(history_resp.json()["history"]) == 1
