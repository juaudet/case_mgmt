"""Drop and repopulate all MongoDB collections."""
import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

MONGODB_URL = "mongodb://localhost:27017"
DB_NAME = "siem"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SEED_DIR = Path(__file__).parent


async def main() -> None:
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]

    for col in ["users", "cases", "playbooks", "iocs"]:
        await db.drop_collection(col)
    print("Dropped all collections")

    users_raw = json.loads((SEED_DIR / "users.json").read_text())
    users = [
        {
            "email": u["email"],
            "full_name": u["full_name"],
            "role": u["role"],
            "hashed_password": pwd_context.hash(u["password"]),
        }
        for u in users_raw
    ]
    await db.users.insert_many(users)
    print(f"Inserted {len(users)} users")

    playbooks_raw = json.loads((SEED_DIR / "playbooks.json").read_text())
    await db.playbooks.insert_many(playbooks_raw)
    print(f"Inserted {len(playbooks_raw)} playbooks")

    cases_raw = json.loads((SEED_DIR / "cases.json").read_text())
    now = datetime.now(timezone.utc)
    for case in cases_raw:
        case.setdefault("created_at", now)
        case.setdefault("updated_at", now)
        case.setdefault("created_by", "system")
        for event in case.get("timeline", []):
            if isinstance(event.get("timestamp"), str):
                event["timestamp"] = datetime.fromisoformat(
                    event["timestamp"].replace("Z", "+00:00")
                )
    await db.cases.insert_many(cases_raw)
    print(f"Inserted {len(cases_raw)} cases")

    client.close()
    print("Seed complete")


if __name__ == "__main__":
    asyncio.run(main())
