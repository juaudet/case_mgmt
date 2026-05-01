from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class Severity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class CaseStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    closed = "closed"
    false_positive = "false_positive"


class TimelineEvent(BaseModel):
    timestamp: datetime
    actor: str
    action: str
    detail: str


class IOCRef(BaseModel):
    type: str
    value: str
    score: int | None = None
    label: str | None = None


class CaseBase(BaseModel):
    title: str
    description: str
    severity: Severity
    status: CaseStatus = CaseStatus.open
    assigned_to: str | None = None
    mitre_tactics: list[str] = []
    mitre_techniques: list[str] = []
    tags: list[str] = []


class CaseCreate(CaseBase):
    pass


class CaseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    severity: Severity | None = None
    status: CaseStatus | None = None
    assigned_to: str | None = None
    mitre_tactics: list[str] | None = None
    mitre_techniques: list[str] | None = None
    tags: list[str] | None = None


class Case(CaseBase):
    id: str
    case_number: str
    created_at: datetime
    updated_at: datetime
    created_by: str
    timeline: list[TimelineEvent] = []
    iocs: list[IOCRef] = []
    sla_deadline: datetime | None = None
    ldap_context: dict | None = None
    vt_results: dict | None = None
    cs_results: dict | None = None
    otx_results: dict | None = None
    playbook_id: str | None = None
    playbook_state: dict | None = None
    parent_case_id: str | None = None


class CaseListItem(BaseModel):
    id: str
    case_number: str
    title: str
    severity: Severity
    status: CaseStatus
    assigned_to: str | None = None
    created_at: datetime
    updated_at: datetime
    ioc_count: int = 0
    sla_deadline: datetime | None = None
