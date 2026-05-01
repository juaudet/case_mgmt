from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.core.deps import get_current_user, get_db, require_role
from app.models.case import Case, CaseCreate, CaseListItem, CaseUpdate, IOCRef, TimelineEvent
from app.models.user import Role, UserInDB
from app.services import case_service
from app.services.source_parsers import parse_provider_incident

router = APIRouter()


class ProviderIngestBody(BaseModel):
    payload: dict


@router.get("/cases", response_model=list[CaseListItem])
async def list_cases(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: str | None = Query(None),
    severity: str | None = Query(None),
    assigned_to: str | None = Query(None),
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[CaseListItem]:
    return await case_service.list_cases(
        db, skip=skip, limit=limit, status=status, severity=severity, assigned_to=assigned_to
    )


@router.post("/cases", response_model=Case, status_code=status.HTTP_201_CREATED)
async def create_case(
    body: CaseCreate,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Case:
    return await case_service.create_case(db, body, created_by=current_user.email)


@router.post("/cases/ingest/{provider}", response_model=Case, status_code=status.HTTP_201_CREATED)
async def ingest_case(
    provider: str,
    body: ProviderIngestBody,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Case:
    try:
        case_data, parsed_iocs = parse_provider_incident(provider, body.payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    created_case = await case_service.create_case(db, case_data, created_by=current_user.email)
    enriched_case = created_case
    for ioc in parsed_iocs:
        updated_case = await case_service.add_ioc(
            db, created_case.id, ioc, actor=current_user.email
        )
        if updated_case:
            enriched_case = updated_case
    return enriched_case


@router.get("/cases/{case_id}", response_model=Case)
async def get_case(
    case_id: str,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Case:
    case = await case_service.get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.patch("/cases/{case_id}", response_model=Case)
async def update_case(
    case_id: str,
    body: CaseUpdate,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Case:
    case = await case_service.update_case(db, case_id, body, actor=current_user.email)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.delete("/cases/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case(
    case_id: str,
    current_user: UserInDB = Depends(require_role(Role.admin)),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> None:
    deleted = await case_service.delete_case(db, case_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Case not found")


@router.post("/cases/{case_id}/timeline", response_model=Case)
async def add_timeline_event(
    case_id: str,
    event: TimelineEvent,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Case:
    case = await case_service.add_timeline_event(db, case_id, event)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.post("/cases/{case_id}/iocs", response_model=Case)
async def add_ioc(
    case_id: str,
    ioc: IOCRef,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Case:
    case = await case_service.add_ioc(db, case_id, ioc, actor=current_user.email)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.delete("/cases/{case_id}/iocs/{ioc_value}", response_model=Case)
async def remove_ioc(
    case_id: str,
    ioc_value: str,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Case:
    case = await case_service.remove_ioc(db, case_id, ioc_value, actor=current_user.email)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case
