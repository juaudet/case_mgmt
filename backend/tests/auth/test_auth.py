import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient, analyst_user: dict) -> None:
    resp = await async_client.post(
        "/api/v1/auth/login",
        data={"username": analyst_user["email"], "password": analyst_user["password"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_password(async_client: AsyncClient, analyst_user: dict) -> None:
    resp = await async_client.post(
        "/api/v1/auth/login",
        data={"username": analyst_user["email"], "password": "WrongPassword!"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(async_client: AsyncClient) -> None:
    resp = await async_client.post(
        "/api/v1/auth/login",
        data={"username": "nobody@example.com", "password": "whatever"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_authenticated(
    async_client: AsyncClient, analyst_user: dict, analyst_token: str
) -> None:
    resp = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {analyst_token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == analyst_user["email"]
    assert body["role"] == "analyst"


@pytest.mark.asyncio
async def test_me_no_token(async_client: AsyncClient) -> None:
    resp = await async_client.get("/api/v1/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_refresh_with_cookie(
    async_client: AsyncClient, analyst_user: dict
) -> None:
    login_resp = await async_client.post(
        "/api/v1/auth/login",
        data={"username": analyst_user["email"], "password": analyst_user["password"]},
    )
    assert login_resp.status_code == 200
    assert "refresh_token" in login_resp.cookies

    refresh_resp = await async_client.post("/api/v1/auth/refresh")
    assert refresh_resp.status_code == 200
    body = refresh_resp.json()
    assert "access_token" in body


@pytest.mark.asyncio
async def test_logout_clears_cookie(
    async_client: AsyncClient, analyst_user: dict
) -> None:
    await async_client.post(
        "/api/v1/auth/login",
        data={"username": analyst_user["email"], "password": analyst_user["password"]},
    )
    logout_resp = await async_client.post("/api/v1/auth/logout")
    assert logout_resp.status_code == 200
    assert logout_resp.json()["detail"] == "Logged out"
    assert "refresh_token" not in logout_resp.cookies or logout_resp.cookies.get("refresh_token") == ""
