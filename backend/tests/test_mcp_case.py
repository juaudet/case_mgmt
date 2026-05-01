import pytest
from httpx import AsyncClient

MISSING_CASE_ID = "64f1c9b2e847d6f0391cc52a"


async def _create_case(async_client: AsyncClient, analyst_token: str) -> str:
    resp = await async_client.post(
        "/api/v1/cases",
        json={
            "title": "MCP Test Case",
            "description": "Case for MCP persistence",
            "severity": "critical",
            "status": "open",
            "mitre_tactics": ["TA0006"],
            "mitre_techniques": ["T1078"],
            "tags": ["mcp"],
        },
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 201
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_mcp_run_rejects_unknown_tool(
    async_client: AsyncClient, analyst_token: str
) -> None:
    case_id = await _create_case(async_client, analyst_token)
    resp = await async_client.post(
        f"/api/v1/cases/{case_id}/mcp/run",
        json={"tool_name": "dangerous_shell", "params": {}},
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Unsupported MCP tool"


@pytest.mark.asyncio
async def test_mcp_run_persists_demo_result(
    async_client: AsyncClient, analyst_token: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    case_id = await _create_case(async_client, analyst_token)

    async def fake_call(tool_name: str, params: dict) -> dict:
        return {
            "data": {
                "id": params["hash"],
                "attributes": {
                    "last_analysis_stats": {"malicious": 47, "suspicious": 1},
                    "popular_threat_classification": {
                        "suggested_threat_label": "mimikatz"
                    },
                },
            }
        }

    monkeypatch.setattr("app.services.mcp_case_service.call_mcp_tool", fake_call)

    resp = await async_client.post(
        f"/api/v1/cases/{case_id}/mcp/run",
        json={
            "tool_name": "vt_hash_lookup",
            "params": {"hash": "a3f1c9b2e847d6f0391cc52a4e1b7f3d"},
        },
        headers={"Authorization": f"Bearer {analyst_token}"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["call"]["tool_name"] == "vt_hash_lookup"
    assert body["call"]["status"] == "completed"
    assert body["findings"][0]["source"] == "VirusTotal"
    assert len(body["mcp_calls"]) == 1
    assert len(body["mcp_findings"]) == 1

    get_resp = await async_client.get(
        f"/api/v1/cases/{case_id}/mcp",
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert get_resp.status_code == 200
    state = get_resp.json()
    assert len(state["mcp_calls"]) == 1
    assert len(state["mcp_findings"]) == 1


@pytest.mark.asyncio
async def test_mcp_run_missing_case_does_not_call_mcp(
    async_client: AsyncClient, analyst_token: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    called = False

    async def fake_call(tool_name: str, params: dict) -> dict:
        nonlocal called
        called = True
        return {}

    monkeypatch.setattr("app.services.mcp_case_service.call_mcp_tool", fake_call)

    resp = await async_client.post(
        f"/api/v1/cases/{MISSING_CASE_ID}/mcp/run",
        json={"tool_name": "vt_hash_lookup", "params": {"hash": "abc123"}},
        headers={"Authorization": f"Bearer {analyst_token}"},
    )

    assert resp.status_code == 404
    assert resp.json()["detail"] == "Case not found"
    assert called is False


@pytest.mark.asyncio
async def test_mcp_run_rejects_missing_required_params_before_mcp_call(
    async_client: AsyncClient, analyst_token: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    case_id = await _create_case(async_client, analyst_token)
    called = False

    async def fake_call(tool_name: str, params: dict) -> dict:
        nonlocal called
        called = True
        return {}

    monkeypatch.setattr("app.services.mcp_case_service.call_mcp_tool", fake_call)

    resp = await async_client.post(
        f"/api/v1/cases/{case_id}/mcp/run",
        json={"tool_name": "vt_hash_lookup", "params": {}},
        headers={"Authorization": f"Bearer {analyst_token}"},
    )

    assert resp.status_code == 422
    assert resp.json()["detail"] == "Missing required MCP params: hash"
    assert called is False


@pytest.mark.asyncio
async def test_mcp_run_benign_vt_result_persists_call_without_findings(
    async_client: AsyncClient, analyst_token: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    case_id = await _create_case(async_client, analyst_token)

    async def fake_call(tool_name: str, params: dict) -> dict:
        return {
            "data": {
                "id": params["hash"],
                "attributes": {
                    "last_analysis_stats": {"malicious": 0, "suspicious": 0},
                },
            }
        }

    monkeypatch.setattr("app.services.mcp_case_service.call_mcp_tool", fake_call)

    resp = await async_client.post(
        f"/api/v1/cases/{case_id}/mcp/run",
        json={"tool_name": "vt_hash_lookup", "params": {"hash": "abc123"}},
        headers={"Authorization": f"Bearer {analyst_token}"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["call"]["status"] == "completed"
    assert body["findings"] == []
    assert len(body["mcp_calls"]) == 1
    assert body["mcp_findings"] == []


@pytest.mark.asyncio
async def test_mcp_run_normalizes_crowdstrike_ioc_search(
    async_client: AsyncClient, analyst_token: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    case_id = await _create_case(async_client, analyst_token)

    async def fake_call(tool_name: str, params: dict) -> dict:
        return {
            "hosts_scanned": 12,
            "hash_detections": 2,
            "suspicious_activity": 3,
        }

    monkeypatch.setattr("app.services.mcp_case_service.call_mcp_tool", fake_call)

    resp = await async_client.post(
        f"/api/v1/cases/{case_id}/mcp/run",
        json={"tool_name": "cs_ioc_search", "params": {"indicator": "abc123"}},
        headers={"Authorization": f"Bearer {analyst_token}"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["call"]["provider"] == "CrowdStrike"
    assert body["call"]["result_summary"]["hosts_scanned"] == 12
    assert body["findings"][0]["source"] == "CrowdStrike"
    assert body["findings"][0]["title"] == "IOC hunt completed"
    assert len(body["mcp_findings"]) == 1


@pytest.mark.asyncio
async def test_mcp_run_persists_failed_call_without_findings(
    async_client: AsyncClient, analyst_token: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    case_id = await _create_case(async_client, analyst_token)

    async def fake_call(tool_name: str, params: dict) -> dict:
        raise RuntimeError("sidecar unavailable")

    monkeypatch.setattr("app.services.mcp_case_service.call_mcp_tool", fake_call)

    resp = await async_client.post(
        f"/api/v1/cases/{case_id}/mcp/run",
        json={"tool_name": "vt_ip_report", "params": {"ip": "203.0.113.10"}},
        headers={"Authorization": f"Bearer {analyst_token}"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["call"]["status"] == "failed"
    assert body["call"]["result_summary"] == {"error": "sidecar unavailable"}
    assert body["findings"] == []
    assert len(body["mcp_calls"]) == 1
    assert body["mcp_calls"][0]["status"] == "failed"
    assert body["mcp_findings"] == []
