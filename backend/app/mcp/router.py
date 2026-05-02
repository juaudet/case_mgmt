from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from app.auth.models import UserInDB
from app.core.deps import get_current_user, get_db
from app.mcp.service import get_mcp_state, run_case_tool

router = APIRouter()


class MCPRunRequest(BaseModel):
    tool_name: str = Field(min_length=1)
    params: dict = Field(default_factory=dict)


class MCPStateResponse(BaseModel):
    mcp_calls: list[dict]
    mcp_findings: list[dict]


class MCPRunResponse(MCPStateResponse):
    call: dict
    findings: list[dict]


@router.get("/cases/{case_id}/mcp", response_model=MCPStateResponse)
async def get_case_mcp(
    case_id: str,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    return await get_mcp_state(db, case_id)


@router.post("/cases/{case_id}/mcp/run", response_model=MCPRunResponse)
async def run_case_mcp_tool(
    case_id: str,
    body: MCPRunRequest,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    return await run_case_tool(
        db,
        case_id,
        body.tool_name,
        body.params,
        current_user.email,
    )
