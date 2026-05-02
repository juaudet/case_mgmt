from datetime import datetime

from pydantic import BaseModel


class Branch(BaseModel):
    when: str
    goto: str
    label: str


class PlaybookStep(BaseModel):
    step_id: str
    title: str
    description: str
    auto: bool = False
    mcp_tools: list[str] = []
    condition_field: str | None = None
    branches: list[Branch] = []
    default_goto: str | None = None
    mitre_technique: str | None = None


class Playbook(BaseModel):
    id: str
    name: str
    description: str
    mitre_tactics: list[str] = []
    steps: list[PlaybookStep] = []


class PlaybookExecutionState(BaseModel):
    playbook_id: str
    current_step_id: str
    completed_steps: list[str] = []
    step_results: dict[str, dict] = {}
    started_at: datetime
    completed_at: datetime | None = None


class StepCompleteRequest(BaseModel):
    result_data: dict
