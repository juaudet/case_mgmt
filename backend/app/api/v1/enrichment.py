from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.core.deps import get_current_user, get_db
from app.auth.models import UserInDB
from app.services.enrichment_service import enrich_ioc

router = APIRouter()


class IOCEnrichRequest(BaseModel):
    type: str
    value: str


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
    if enrichment_results.get("abuseipdb"):
        update_fields["abuseipdb_results"] = enrichment_results["abuseipdb"]

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
