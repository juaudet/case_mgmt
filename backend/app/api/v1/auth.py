from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.deps import get_current_user, get_db, get_redis
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.models.user import TokenResponse, UserPublic

router = APIRouter()


@router.post("/auth/login", response_model=TokenResponse)
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> TokenResponse:
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token({"sub": user["email"], "role": user["role"]})
    refresh_token = create_refresh_token({"sub": user["email"]})
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        samesite="lax",
    )
    return TokenResponse(access_token=access_token)


@router.post("/auth/refresh", response_model=TokenResponse)
async def refresh(refresh_token: str = Cookie(default=None)) -> TokenResponse:
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    access_token = create_access_token({"sub": payload["sub"]})
    return TokenResponse(access_token=access_token)


@router.post("/auth/logout")
async def logout(
    response: Response,
    refresh_token: str = Cookie(default=None),
    redis=Depends(get_redis),
) -> dict:
    if refresh_token:
        await redis.setex(
            f"blocklist:{refresh_token}",
            settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
            "1",
        )
    response.delete_cookie("refresh_token")
    return {"detail": "Logged out"}


@router.get("/auth/me", response_model=UserPublic)
async def me(current_user=Depends(get_current_user)) -> UserPublic:
    return UserPublic(**current_user.model_dump())
