import redis.asyncio as aioredis

from app.core.config import settings

_redis: aioredis.Redis | None = None


async def connect_redis() -> None:
    global _redis
    _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)


async def disconnect_redis() -> None:
    if _redis:
        await _redis.aclose()


def get_redis_client() -> aioredis.Redis:
    return _redis  # type: ignore[return-value]
