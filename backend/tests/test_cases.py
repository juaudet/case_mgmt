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
