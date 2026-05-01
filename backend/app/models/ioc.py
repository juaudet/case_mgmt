from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class IOCType(str, Enum):
    ipv4 = "ipv4"
    sha256 = "sha256"
    domain = "domain"
    url = "url"
    email = "email"


class IOC(BaseModel):
    id: str
    case_id: str
    type: IOCType
    value: str
    score: int | None = None
    label: str | None = None
    vt_data: dict | None = None
    otx_data: dict | None = None
    geo_data: dict | None = None
    created_at: datetime
    enriched_at: datetime | None = None


class IOCCreate(BaseModel):
    type: IOCType
    value: str
