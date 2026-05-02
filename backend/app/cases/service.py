from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.cases.models import Case, CaseCreate, CaseListItem, CaseUpdate, IOCRef, TimelineEvent


def _normalize_assigned_to(value: object) -> str | None:
    """Coerce legacy or bad stored values (e.g. []) to str | None for API models."""
    if value is None:
        return None
    if isinstance(value, str):
        return value or None
    if isinstance(value, list):
        if not value:
            return None
        first = value[0]
        return str(first) if first is not None else None
    return str(value)


async def get_next_case_number(db: AsyncIOMotorDatabase) -> str:
    year = datetime.now(timezone.utc).year
    count = await db.cases.count_documents({"year": year})
    return f"CASE-{year}-{count + 1:04d}"


async def create_case(db: AsyncIOMotorDatabase, data: CaseCreate, created_by: str) -> Case:
    case_number = await get_next_case_number(db)
    now = datetime.now(timezone.utc)
    payload = data.model_dump()
    initial_iocs = payload.pop("iocs", [])
    doc = {
        **payload,
        "case_number": case_number,
        "year": now.year,
        "created_at": now,
        "updated_at": now,
        "created_by": created_by,
        "timeline": [
            {
                "timestamp": now,
                "actor": created_by,
                "action": "created",
                "detail": "Case created",
            }
        ],
        "iocs": initial_iocs,
        "mcp_calls": [],
        "mcp_findings": [],
        "console_history": [],
    }
    result = await db.cases.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return _doc_to_case(doc)


async def get_case(db: AsyncIOMotorDatabase, case_id: str) -> Case | None:
    try:
        oid = ObjectId(case_id)
    except Exception:
        return None
    doc = await db.cases.find_one({"_id": oid})
    if not doc:
        return None
    return _doc_to_case(doc)


async def list_cases(
    db: AsyncIOMotorDatabase,
    skip: int = 0,
    limit: int = 50,
    status: str | None = None,
    severity: str | None = None,
    assigned_to: str | None = None,
) -> list[CaseListItem]:
    query: dict = {}
    if status:
        query["status"] = status
    if severity:
        query["severity"] = severity
    if assigned_to:
        query["assigned_to"] = assigned_to
    cursor = db.cases.find(query).sort("updated_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [_doc_to_list_item(d) for d in docs]


async def update_case(
    db: AsyncIOMotorDatabase, case_id: str, data: CaseUpdate, actor: str
) -> Case | None:
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    now = datetime.now(timezone.utc)
    update_data["updated_at"] = now
    changed_fields = [k for k in update_data if k != "updated_at"]
    timeline_event = {
        "timestamp": now,
        "actor": actor,
        "action": "updated",
        "detail": f"Updated fields: {', '.join(changed_fields)}",
    }
    result = await db.cases.find_one_and_update(
        {"_id": ObjectId(case_id)},
        {"$set": update_data, "$push": {"timeline": timeline_event}},
        return_document=True,
    )
    if not result:
        return None
    return _doc_to_case(result)


async def delete_case(db: AsyncIOMotorDatabase, case_id: str) -> bool:
    result = await db.cases.delete_one({"_id": ObjectId(case_id)})
    return result.deleted_count > 0


async def add_timeline_event(
    db: AsyncIOMotorDatabase, case_id: str, event: TimelineEvent
) -> Case | None:
    now = datetime.now(timezone.utc)
    result = await db.cases.find_one_and_update(
        {"_id": ObjectId(case_id)},
        {
            "$push": {"timeline": event.model_dump()},
            "$set": {"updated_at": now},
        },
        return_document=True,
    )
    if not result:
        return None
    return _doc_to_case(result)


async def add_ioc(
    db: AsyncIOMotorDatabase, case_id: str, ioc: IOCRef, actor: str
) -> Case | None:
    now = datetime.now(timezone.utc)
    timeline_event = {
        "timestamp": now,
        "actor": actor,
        "action": "ioc_added",
        "detail": f"IOC added: {ioc.type}:{ioc.value}",
    }
    result = await db.cases.find_one_and_update(
        {"_id": ObjectId(case_id)},
        {
            "$push": {"iocs": ioc.model_dump(), "timeline": timeline_event},
            "$set": {"updated_at": now},
        },
        return_document=True,
    )
    if not result:
        return None
    return _doc_to_case(result)


async def remove_ioc(
    db: AsyncIOMotorDatabase, case_id: str, ioc_value: str, actor: str
) -> Case | None:
    now = datetime.now(timezone.utc)
    timeline_event = {
        "timestamp": now,
        "actor": actor,
        "action": "ioc_removed",
        "detail": f"IOC removed: {ioc_value}",
    }
    result = await db.cases.find_one_and_update(
        {"_id": ObjectId(case_id)},
        {
            "$pull": {"iocs": {"value": ioc_value}},
            "$push": {"timeline": timeline_event},
            "$set": {"updated_at": now},
        },
        return_document=True,
    )
    if not result:
        return None
    return _doc_to_case(result)


def _doc_to_case(doc: dict) -> Case:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id", doc.get("id", "")))
    doc.pop("year", None)
    if "assigned_to" in doc:
        doc["assigned_to"] = _normalize_assigned_to(doc["assigned_to"])
    return Case(**doc)


def _doc_to_list_item(doc: dict) -> CaseListItem:
    return CaseListItem(
        id=str(doc["_id"]),
        case_number=doc["case_number"],
        title=doc["title"],
        severity=doc["severity"],
        status=doc["status"],
        assigned_to=_normalize_assigned_to(doc.get("assigned_to")),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
        ioc_count=len(doc.get("iocs", [])),
        sla_deadline=doc.get("sla_deadline"),
    )
