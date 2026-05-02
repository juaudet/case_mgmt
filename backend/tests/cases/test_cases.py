import re

import pytest
from httpx import AsyncClient

CASE_PAYLOAD = {
    "title": "Test Phishing Alert",
    "description": "Suspicious email with malicious link received by 3 users.",
    "severity": "high",
    "status": "open",
    "mitre_tactics": ["TA0001"],
    "mitre_techniques": ["T1566.001"],
    "tags": ["phishing", "email"],
}


@pytest.mark.asyncio
async def test_create_case_authenticated(
    async_client: AsyncClient, analyst_token: str
) -> None:
    resp = await async_client.post(
        "/api/v1/cases",
        json=CASE_PAYLOAD,
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == CASE_PAYLOAD["title"]
    assert body["severity"] == "high"
    assert "id" in body
    assert "case_number" in body


@pytest.mark.asyncio
async def test_list_cases(async_client: AsyncClient, analyst_token: str) -> None:
    await async_client.post(
        "/api/v1/cases",
        json=CASE_PAYLOAD,
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    resp = await async_client.get(
        "/api/v1/cases",
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert isinstance(body, list)
    assert len(body) >= 1


@pytest.mark.asyncio
async def test_get_case_by_id(async_client: AsyncClient, analyst_token: str) -> None:
    create_resp = await async_client.post(
        "/api/v1/cases",
        json=CASE_PAYLOAD,
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    case_id = create_resp.json()["id"]

    resp = await async_client.get(
        f"/api/v1/cases/{case_id}",
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == case_id
    assert body["title"] == CASE_PAYLOAD["title"]


@pytest.mark.asyncio
async def test_update_case_status(async_client: AsyncClient, analyst_token: str) -> None:
    create_resp = await async_client.post(
        "/api/v1/cases",
        json=CASE_PAYLOAD,
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    case_id = create_resp.json()["id"]

    patch_resp = await async_client.patch(
        f"/api/v1/cases/{case_id}",
        json={"status": "in_progress"},
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "in_progress"


@pytest.mark.asyncio
async def test_get_case_not_found(async_client: AsyncClient, analyst_token: str) -> None:
    resp = await async_client.get(
        "/api/v1/cases/000000000000000000000000",
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_add_ioc_to_case(async_client: AsyncClient, analyst_token: str) -> None:
    create_resp = await async_client.post(
        "/api/v1/cases",
        json=CASE_PAYLOAD,
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    case_id = create_resp.json()["id"]

    ioc_payload = {"type": "ipv4", "value": "203.0.113.99", "score": 85, "label": "Malicious IP"}
    ioc_resp = await async_client.post(
        f"/api/v1/cases/{case_id}/iocs",
        json=ioc_payload,
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert ioc_resp.status_code == 200
    body = ioc_resp.json()
    ioc_values = [i["value"] for i in body["iocs"]]
    assert "203.0.113.99" in ioc_values


@pytest.mark.asyncio
async def test_case_number_format(async_client: AsyncClient, analyst_token: str) -> None:
    resp = await async_client.post(
        "/api/v1/cases",
        json=CASE_PAYLOAD,
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 201
    case_number = resp.json()["case_number"]
    assert re.match(r"^CASE-\d{4}-\d{4}$", case_number), (
        f"case_number '{case_number}' does not match CASE-YYYY-NNNN pattern"
    )


@pytest.mark.asyncio
async def test_delete_case_admin_only(
    async_client: AsyncClient, analyst_token: str, admin_token: str
) -> None:
    create_resp = await async_client.post(
        "/api/v1/cases",
        json=CASE_PAYLOAD,
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    case_id = create_resp.json()["id"]

    analyst_del = await async_client.delete(
        f"/api/v1/cases/{case_id}",
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert analyst_del.status_code == 403

    admin_del = await async_client.delete(
        f"/api/v1/cases/{case_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert admin_del.status_code == 204


@pytest.mark.asyncio
async def test_ingest_sentinel_case(async_client: AsyncClient, analyst_token: str) -> None:
    sentinel_payload = {
        "id": "/subscriptions/test/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/ws/providers/Microsoft.SecurityInsights/incidents/abc",
        "name": "abc",
        "type": "Microsoft.SecurityInsights/incidents",
        "properties": {
            "title": "My incident",
            "description": "This is a demo incident",
            "owner": {
                "email": "john.doe@contoso.com",
                "userPrincipalName": "john@contoso.com",
                "assignedTo": "john doe",
            },
            "severity": "High",
            "status": "Closed",
            "providerName": "Azure Sentinel",
            "incidentNumber": 3177,
        },
        "entities": [
            {"kind": "Ip", "properties": {"address": "203.0.113.99"}},
            {"kind": "Url", "properties": {"url": "https://malicious.example/login"}},
            {"kind": "DnsResolution", "properties": {"domainName": "evil.example"}},
            {
                "kind": "FileHash",
                "properties": {"algorithm": "SHA256", "hashValue": "ABCDEF1234"},
            },
            {"kind": "Account", "properties": {"upn": "victim@contoso.com"}},
        ],
    }

    resp = await async_client.post(
        "/api/v1/cases/ingest/sentinel",
        json={"payload": sentinel_payload},
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "My incident"
    assert body["status"] == "closed"
    assert body["severity"] == "critical"
    assert body["assigned_to"] == "john.doe@contoso.com"
    assert "sentinel" in body["tags"]
    ioc_values = {f'{ioc["type"]}:{ioc["value"]}' for ioc in body["iocs"]}
    assert "ipv4:203.0.113.99" in ioc_values
    assert "url:https://malicious.example/login" in ioc_values
    assert "domain:evil.example" in ioc_values
    assert "sha256:abcdef1234" in ioc_values
    assert "email:victim@contoso.com" in ioc_values


@pytest.mark.asyncio
async def test_ingest_splunk_case(async_client: AsyncClient, analyst_token: str) -> None:
    splunk_payload = {
        "result": {
            "title": "Excessive failed logins",
            "description": "Multiple failed logins from one source",
            "severity": "medium",
            "status": "in progress",
            "owner": "analyst.kim@corp.local",
            "app": "ES",
            "source": "notable",
        }
    }

    resp = await async_client.post(
        "/api/v1/cases/ingest/splunk",
        json={"payload": splunk_payload},
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Excessive failed logins"
    assert body["status"] == "in_progress"
    assert body["severity"] == "medium"
    assert body["assigned_to"] == "analyst.kim@corp.local"
    assert "splunk" in body["tags"]
    assert len(body["iocs"]) >= 1


@pytest.mark.asyncio
async def test_case_response_includes_mcp_and_console_records(
    async_client: AsyncClient, analyst_token: str
) -> None:
    create_resp = await async_client.post(
        "/api/v1/cases",
        json=CASE_PAYLOAD,
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    case_id = create_resp.json()["id"]

    await async_client.post(
        f"/api/v1/cases/{case_id}/timeline",
        json={
            "timestamp": "2024-11-14T10:14:02Z",
            "actor": "analyst@test.local",
            "action": "note",
            "detail": "Baseline event",
        },
        headers={"Authorization": f"Bearer {analyst_token}"},
    )

    resp = await async_client.get(
        f"/api/v1/cases/{case_id}",
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["mcp_calls"] == []
    assert body["mcp_findings"] == []
    assert body["console_history"] == []
