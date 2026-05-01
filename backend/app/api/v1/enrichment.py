from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.core.deps import get_current_user, get_db
from app.models.user import UserInDB
from app.services.enrichment_service import enrich_ioc, geoip_lookup, lookup_ldap_user

router = APIRouter()


class IOCEnrichRequest(BaseModel):
    type: str
    value: str


class LDAPLookupRequest(BaseModel):
    username: str


@router.post("/cases/{case_id}/enrich/ioc")
async def enrich_case_ioc(
    case_id: str,
    body: IOCEnrichRequest,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    case_doc = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case_doc:
        raise HTTPException(status_code=404, detail="Case not found")

    enrichment_results = await enrich_ioc(body.type, body.value)
    now = datetime.now(timezone.utc)

    update_fields: dict = {"updated_at": now}
    if enrichment_results.get("virustotal"):
        update_fields["vt_results"] = enrichment_results["virustotal"]
    if enrichment_results.get("otx"):
        update_fields["otx_results"] = enrichment_results["otx"]

    timeline_event = {
        "timestamp": now,
        "actor": current_user.email,
        "action": "enriched",
        "detail": f"IOC enrichment run for {body.type}:{body.value}",
    }

    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": update_fields, "$push": {"timeline": timeline_event}},
    )

    return {"ioc_type": body.type, "value": body.value, "results": enrichment_results}


@router.post("/cases/{case_id}/enrich/ldap")
async def enrich_ldap(
    case_id: str,
    body: LDAPLookupRequest,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    case_doc = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case_doc:
        raise HTTPException(status_code=404, detail="Case not found")

    ldap_data = await lookup_ldap_user(body.username)
    now = datetime.now(timezone.utc)

    timeline_event = {
        "timestamp": now,
        "actor": current_user.email,
        "action": "ldap_lookup",
        "detail": f"LDAP context fetched for user: {body.username}",
    }

    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {
            "$set": {"ldap_context": ldap_data, "updated_at": now},
            "$push": {"timeline": timeline_event},
        },
    )

    return {"username": body.username, "ldap_data": ldap_data}


@router.get("/cases/{case_id}/enrich/geoip/{ip}")
async def enrich_geoip(
    case_id: str,
    ip: str,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    case_doc = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not case_doc:
        raise HTTPException(status_code=404, detail="Case not found")

    try:
        geo_data = await geoip_lookup(ip)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"GeoIP lookup failed: {exc}") from exc

    return {"ip": ip, "geo_data": geo_data}
