from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import decode_token
from app.auth.models import Role, UserInDB

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


async def get_redis(request: Request):
    return request.app.state.redis


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> UserInDB:
    payload = decode_token(token)
    if payload.get("type") == "refresh":
        raise HTTPException(status_code=401, detail="Cannot use refresh token here")
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_doc = await db.users.find_one({"email": email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    user_doc["id"] = str(user_doc.pop("_id"))
    return UserInDB(**user_doc)


def require_role(*roles: Role):
    async def checker(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user

    return checker
