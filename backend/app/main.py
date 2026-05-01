from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, cases, console, enrichment, playbooks
from app.core.config import settings
from app.db.mongo import connect_mongo, disconnect_mongo, get_database
from app.db.redis import connect_redis, disconnect_redis, get_redis_client
from app.db.bootstrap import ensure_demo_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_mongo()
    await connect_redis()
    app.state.db = get_database()
    app.state.redis = get_redis_client()
    await ensure_demo_data(app.state.db, settings.DEMO_MODE)
    yield
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

app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(cases.router, prefix="/api/v1", tags=["cases"])
app.include_router(playbooks.router, prefix="/api/v1", tags=["playbooks"])
app.include_router(enrichment.router, prefix="/api/v1", tags=["enrichment"])
app.include_router(console.router, prefix="/api/v1", tags=["console"])


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
