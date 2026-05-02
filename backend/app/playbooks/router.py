from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.auth.models import UserInDB
from app.core.deps import get_current_user, get_db
from app.playbooks.engine import advance_playbook
from app.playbooks.models import Playbook, PlaybookExecutionState, StepCompleteRequest

router = APIRouter()


class StartPlaybookRequest(BaseModel):
    playbook_id: str


@router.get("/playbooks", response_model=list[Playbook])
async def list_playbooks(
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[Playbook]:
    docs = await db.playbooks.find({}).to_list(length=100)
    return [Playbook(**d) for d in docs]


@router.get("/playbooks/{playbook_id}", response_model=Playbook)
async def get_playbook(
    playbook_id: str,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Playbook:
    doc = await db.playbooks.find_one({"id": playbook_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Playbook not found")
    return Playbook(**doc)


@router.post("/cases/{case_id}/playbook/start", response_model=PlaybookExecutionState)
async def start_playbook(
    case_id: str,
    body: StartPlaybookRequest,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> PlaybookExecutionState:
    from bson import ObjectId

    playbook_doc = await db.playbooks.find_one({"id": body.playbook_id})
    if not playbook_doc:
        raise HTTPException(status_code=404, detail="Playbook not found")

    if not playbook_doc.get("steps"):
        raise HTTPException(status_code=400, detail="Playbook has no steps")

    first_step_id = playbook_doc["steps"][0]["step_id"]
    now = datetime.now(timezone.utc)
    state = {
        "playbook_id": body.playbook_id,
        "current_step_id": first_step_id,
        "completed_steps": [],
        "step_results": {},
        "started_at": now,
    }

    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {"playbook_id": body.playbook_id, "playbook_state": state}},
    )

    return PlaybookExecutionState(**state)


@router.post("/cases/{case_id}/playbook/step/{step_id}/complete")
async def complete_step(
    case_id: str,
    step_id: str,
    body: StepCompleteRequest,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    next_step = await advance_playbook(db, case_id, step_id, body.result_data)
    return {"next_step_id": next_step, "completed_step_id": step_id}


@router.get("/cases/{case_id}/playbook/state", response_model=PlaybookExecutionState)
async def get_playbook_state(
    case_id: str,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> PlaybookExecutionState:
    from bson import ObjectId

    doc = await db.cases.find_one({"_id": ObjectId(case_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Case not found")

    state = doc.get("playbook_state")
    if not state:
        raise HTTPException(status_code=404, detail="No active playbook on this case")

    return PlaybookExecutionState(**state)
