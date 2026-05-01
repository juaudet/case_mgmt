import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.security import hash_password
from app.main import app

TEST_DB = "siem_test"


@pytest_asyncio.fixture(scope="function")
async def test_db():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client[TEST_DB]
    yield db
    await client.drop_database(TEST_DB)
    client.close()


@pytest_asyncio.fixture(scope="function")
async def async_client(test_db):
    app.state.db = test_db
    try:
        import fakeredis.aioredis

        app.state.redis = fakeredis.aioredis.FakeRedis()
    except ImportError:
        from unittest.mock import AsyncMock, MagicMock

        mock_redis = MagicMock()
        mock_redis.setex = AsyncMock(return_value=True)
        app.state.redis = mock_redis

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def analyst_user(test_db):
    await test_db.users.insert_one(
        {
            "email": "analyst@test.local",
            "full_name": "Test Analyst",
            "role": "analyst",
            "hashed_password": hash_password("TestPass1!"),
        }
    )
    return {"email": "analyst@test.local", "password": "TestPass1!"}


@pytest_asyncio.fixture
async def admin_user(test_db):
    await test_db.users.insert_one(
        {
            "email": "admin@test.local",
            "full_name": "Test Admin",
            "role": "admin",
            "hashed_password": hash_password("AdminPass1!"),
        }
    )
    return {"email": "admin@test.local", "password": "AdminPass1!"}


@pytest_asyncio.fixture
async def analyst_token(async_client, analyst_user):
    resp = await async_client.post(
        "/api/v1/auth/login",
        data={
            "username": analyst_user["email"],
            "password": analyst_user["password"],
        },
    )
    return resp.json()["access_token"]


@pytest_asyncio.fixture
async def admin_token(async_client, admin_user):
    resp = await async_client.post(
        "/api/v1/auth/login",
        data={
            "username": admin_user["email"],
            "password": admin_user["password"],
        },
    )
    return resp.json()["access_token"]
