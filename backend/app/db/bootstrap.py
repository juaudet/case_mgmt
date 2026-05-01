from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import hash_password

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
