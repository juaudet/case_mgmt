from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

_client: AsyncIOMotorClient | None = None


async def connect_mongo() -> None:
    global _client
    _client = AsyncIOMotorClient(settings.MONGODB_URL)


async def disconnect_mongo() -> None:
    if _client:
        _client.close()


def get_client() -> AsyncIOMotorClient:
    return _client  # type: ignore[return-value]


def get_database() -> AsyncIOMotorDatabase:
    return _client[settings.MONGODB_DB]  # type: ignore[index]
