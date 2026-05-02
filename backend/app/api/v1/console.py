import json
from datetime import datetime, timezone
from uuid import uuid4

import anthropic
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.core.deps import get_current_user, get_db
from app.core.secrets import read_env_or_secret_file
from app.auth.models import UserInDB
from app.services.case_service import get_case
from app.services.console_service import build_system_prompt

router = APIRouter()

PROMPT_TEMPLATES = {
    "attribution": (
        "Based on all available IOC data, LDAP enrichment, and MCP tool results, provide a full "
        "threat actor attribution analysis. Include confidence level, supporting evidence, and matching TTPs."
    ),
    "exfil": (
        "Review all evidence and determine whether data exfiltration occurred. Check email forward rules, "
        "large file transfers, and DNS/HTTP traffic to the C2. Quantify risk if exfil cannot be ruled out."
    ),
    "blast_radius": (
        "What is the full blast radius? Identify every account, host, and data asset that may have been "
        "touched or is at risk. Prioritise by sensitivity."
    ),
    "hunt_iocs": (
        "Using existing IOCs, generate a list of additional related indicators to hunt for. "
        "Include YARA rule ideas and network signatures."
    ),
    "exec_summary": (
        "Write an executive summary for CISO briefing: what happened, who was affected, business risk, "
        "containment actions taken, remediation outstanding. Max 200 words."
    ),
    "remediation": (
        "Provide a complete prioritised remediation checklist covering identity, endpoint, email, network, "
        "and policy layers. Flag items needing change management."
    ),
    "timeline": (
        "Reconstruct the full attack timeline from initial delivery through containment, with timestamps, "
        "techniques, and evidence sources for each event."
    ),
}


class ConsolePromptRequest(BaseModel):
    prompt: str
    template: str | None = None
    context_flags: dict = {}


def _get_anthropic_api_key() -> str:
    try:
        key = read_env_or_secret_file("ANTHROPIC_API_KEY", on_file_error="raise")
    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail="Anthropic API key file is not readable",
        ) from exc
    if key:
        return key
    raise HTTPException(
        status_code=503,
        detail="Anthropic API key is not configured",
    )


async def generate_console_response(prompt_text: str, system_prompt: str) -> str:
    api_key = _get_anthropic_api_key()
    client = anthropic.AsyncAnthropic(api_key=api_key)
    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        system=system_prompt,
        messages=[{"role": "user", "content": prompt_text}],
    )
    return "".join(
        block.text for block in message.content if getattr(block, "type", None) == "text"
    )


@router.post("/cases/{case_id}/console/stream")
async def stream_console(
    case_id: str,
    body: ConsolePromptRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
) -> StreamingResponse:
    case = await get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    prompt_text = body.prompt
    if body.template and body.template in PROMPT_TEMPLATES:
        prompt_text = PROMPT_TEMPLATES[body.template]

    system_prompt = build_system_prompt(case, body.context_flags)

    async def event_generator():
        try:
            api_key = _get_anthropic_api_key()
            client = anthropic.AsyncAnthropic(api_key=api_key)
            async with client.messages.stream(
                model="claude-sonnet-4-6",
                max_tokens=1500,
                system=system_prompt,
                messages=[{"role": "user", "content": prompt_text}],
            ) as stream:
                async for text in stream.text_stream:
                    yield f"data: {json.dumps({'delta': text})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/cases/{case_id}/console/history")
async def get_console_history(
    case_id: str,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    try:
        object_id = ObjectId(case_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Case not found")

    case = await db.cases.find_one({"_id": object_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"history": case.get("console_history", [])}


@router.post("/cases/{case_id}/console/prompt")
async def create_console_prompt(
    case_id: str,
    body: ConsolePromptRequest,
    current_user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    case = await get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    prompt_text = body.prompt
    if body.template and body.template in PROMPT_TEMPLATES:
        prompt_text = PROMPT_TEMPLATES[body.template]

    system_prompt = build_system_prompt(case, body.context_flags)
    response_text = await generate_console_response(prompt_text, system_prompt)
    now = datetime.now(timezone.utc)
    turn = {
        "id": str(uuid4()),
        "prompt": prompt_text,
        "response": response_text,
        "template": body.template,
        "context_flags": body.context_flags,
        "sources_used": [key for key, enabled in body.context_flags.items() if enabled],
        "created_at": now,
        "actor": current_user.email,
    }
    await db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {
            "$push": {"console_history": {"$each": [turn], "$position": 0}},
            "$set": {"updated_at": now},
        },
    )
    return {"turn": turn}


@router.get("/cases/{case_id}/console/templates")
async def get_templates(current_user=Depends(get_current_user)) -> dict:
    return {"templates": list(PROMPT_TEMPLATES.keys())}
