import asyncio
import contextlib
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import router as auth_router
from app.cases import router as cases_router
from app.enrichment import router as enrichment_router
from app.mcp import router as mcp_router
from app.playbooks import router as playbooks_router
from app.api.v1 import console
from app.core.config import settings
from app.db.mongo import connect_mongo, disconnect_mongo, get_database
from app.db.redis import connect_redis, disconnect_redis, get_redis_client
from app.db.bootstrap import ensure_demo_data

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_mongo()
    await connect_redis()
    app.state.db = get_database()
    app.state.redis = get_redis_client()
    await ensure_demo_data(app.state.db, settings.DEMO_MODE)
    feed_task: asyncio.Task[None] | None = None
    if settings.DEMO_MODE and settings.MOCK_INCIDENT_FEED:
        from app.cases.mock_feed import run_mock_incident_feed

        feed_task = asyncio.create_task(run_mock_incident_feed(app.state.db))
        logger.info("Mock incident feed started (synthetic cases every 10–30s)")
    yield
    if feed_task is not None:
        feed_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await feed_task
        logger.info("Mock incident feed stopped")
    await disconnect_mongo()
    await disconnect_redis()


app = FastAPI(title="SIEM Case Manager API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/v1", tags=["auth"])
app.include_router(cases_router.router, prefix="/api/v1", tags=["cases"])
app.include_router(playbooks_router.router, prefix="/api/v1", tags=["playbooks"])
app.include_router(enrichment_router.router, prefix="/api/v1", tags=["enrichment"])
app.include_router(mcp_router.router, prefix="/api/v1", tags=["mcp"])
app.include_router(console.router, prefix="/api/v1", tags=["console"])


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
