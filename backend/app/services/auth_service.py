from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import hash_password, verify_password
from app.models.user import UserInDB


async def get_user_by_email(db: AsyncIOMotorDatabase, email: str) -> UserInDB | None:
    doc = await db.users.find_one({"email": email})
    if not doc:
        return None
    doc["id"] = str(doc.pop("_id"))
    return UserInDB(**doc)


async def authenticate_user(
    db: AsyncIOMotorDatabase, email: str, password: str
) -> UserInDB | None:
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def create_user(
    db: AsyncIOMotorDatabase,
    email: str,
    full_name: str,
    role: str,
    password: str,
) -> UserInDB:
    doc = {
        "email": email,
        "full_name": full_name,
        "role": role,
        "hashed_password": hash_password(password),
    }
    result = await db.users.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return UserInDB(**doc)
