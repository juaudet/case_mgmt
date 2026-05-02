from enum import Enum

from pydantic import BaseModel


class Role(str, Enum):
    analyst = "analyst"
    tier2 = "tier2"
    admin = "admin"


class UserBase(BaseModel):
    email: str
    full_name: str
    role: Role


class UserInDB(UserBase):
    id: str
    hashed_password: str


class UserPublic(UserBase):
    id: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
