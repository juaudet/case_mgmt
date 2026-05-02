from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


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


class IOCType(str, Enum):
    ipv4 = "ipv4"
    sha256 = "sha256"
    domain = "domain"
    url = "url"
    email = "email"


class IOCCreate(BaseModel):
    type: IOCType
    value: str


class IOCRef(BaseModel):
    type: str
    value: str
    score: int | None = None
    label: str | None = None


class IOC(BaseModel):
    id: str
    case_id: str
    type: IOCType
    value: str
    score: int | None = None
    label: str | None = None
    vt_data: dict | None = None
    created_at: datetime
    enriched_at: datetime | None = None


class TimelineEvent(BaseModel):
    timestamp: datetime
    actor: str
    action: str
    detail: str


class MCPCallRecord(BaseModel):
    id: str
    provider: str
    tool_name: str
    params: dict
    status: str
    duration_ms: int | None = None
    result_summary: dict = {}
    raw_result: dict = {}
    created_at: datetime
    actor: str


class MCPFinding(BaseModel):
    id: str
    source: str
    title: str
    severity: str
    fields: dict
    created_at: datetime


class ConsoleHistoryTurn(BaseModel):
    id: str
    prompt: str
    response: str
    template: str | None = None
    context_flags: dict = {}
    sources_used: list[str] = []
    created_at: datetime
    actor: str


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
    iocs: list[IOCRef] = Field(default_factory=list)


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
    mcp_calls: list[MCPCallRecord] = []
    mcp_findings: list[MCPFinding] = []
    console_history: list[ConsoleHistoryTurn] = []
    sla_deadline: datetime | None = None
    ldap_context: dict | None = None
    vt_results: dict | None = None
    abuseipdb_results: dict | None = None
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
