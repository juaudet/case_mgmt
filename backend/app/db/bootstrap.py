import json
from datetime import datetime, timezone
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import hash_password

SEED_DIR = Path(__file__).resolve().parents[2] / "seed"

DEMO_USERS = [
    {
        "email": "analyst.kim@corp.local",
        "full_name": "Kim Analyst",
        "role": "analyst",
        "password": "Demo1234!",
    },
    {
        "email": "lead.reyes@corp.local",
        "full_name": "Reyes Lead",
        "role": "tier2",
        "password": "Demo1234!",
    },
    {
        "email": "admin@corp.local",
        "full_name": "Admin User",
        "role": "admin",
        "password": "Admin5678!",
    },
]


async def ensure_demo_users(db: AsyncIOMotorDatabase, demo_mode: bool) -> int:
    if not demo_mode:
        return 0

    existing = {
        doc["email"]
        async for doc in db.users.find({}, {"email": 1, "_id": 0})
    }
    to_create = [u for u in DEMO_USERS if u["email"] not in existing]
    if not to_create:
        return 0

    await db.users.insert_many(
        [
            {
                "email": u["email"],
                "full_name": u["full_name"],
                "role": u["role"],
                "hashed_password": hash_password(u["password"]),
            }
            for u in to_create
        ]
    )
    return len(to_create)


async def ensure_demo_data(
    db: AsyncIOMotorDatabase, demo_mode: bool
) -> dict[str, int]:
    if not demo_mode:
        return {"users": 0, "cases": 0, "playbooks": 0}

    return {
        "users": await ensure_demo_users(db, demo_mode),
        "cases": await _ensure_demo_cases(db),
        "playbooks": await _ensure_demo_playbooks(db),
    }


async def _ensure_demo_cases(db: AsyncIOMotorDatabase) -> int:
    cases = _load_seed_docs("cases.json")
    existing = {
        doc["case_number"]
        async for doc in db.cases.find({}, {"case_number": 1, "_id": 0})
    }
    to_create = [
        _prepare_case_doc(case)
        for case in cases
        if case["case_number"] not in existing
    ]
    if not to_create:
        return 0

    await db.cases.insert_many(to_create)
    return len(to_create)


async def _ensure_demo_playbooks(db: AsyncIOMotorDatabase) -> int:
    playbooks = _load_seed_docs("playbooks.json")
    existing = {
        doc["id"]
        async for doc in db.playbooks.find({}, {"id": 1, "_id": 0})
    }
    to_create = [playbook for playbook in playbooks if playbook["id"] not in existing]
    if not to_create:
        return 0

    await db.playbooks.insert_many(to_create)
    return len(to_create)


def _load_seed_docs(filename: str) -> list[dict]:
    return json.loads((SEED_DIR / filename).read_text())


def _prepare_case_doc(case: dict) -> dict:
    now = datetime.now(timezone.utc)
    prepared = dict(case)
    prepared.setdefault("created_at", now)
    prepared.setdefault("updated_at", now)
    prepared.setdefault("created_by", "system")

    for event in prepared.get("timeline", []):
        if isinstance(event.get("timestamp"), str):
            event["timestamp"] = datetime.fromisoformat(
                event["timestamp"].replace("Z", "+00:00")
            )

    return prepared
