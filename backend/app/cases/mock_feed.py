"""Periodic synthetic cases for demo / local SIEM queue simulation."""

from __future__ import annotations

import asyncio
import logging
import random
from typing import Final

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.cases.models import CaseCreate, CaseStatus, IOCRef, Severity
from app.cases import service as case_service

logger = logging.getLogger(__name__)

_MIN_INTERVAL_S: Final[float] = 10.0
_MAX_INTERVAL_S: Final[float] = 30.0

_SCENARIO_TEMPLATES: Final[list[tuple[str, str]]] = [
    (
        "Possible password spray against VPN gateway",
        "Multiple failed authentications from distributed IPv4 sources targeting the same VPN account within a 10-minute window.",
    ),
    (
        "Suspicious PowerShell encoded command on workstation",
        "EDR flagged -EncodedCommand usage with no signed script path; parent process explorer.exe.",
    ),
    (
        "Azure AD risky sign-in — unfamiliar location",
        "Conditional Access reported medium risk: successful sign-in from ASN not seen for this user in 90 days.",
    ),
    (
        "O365 mass download anomaly",
        "SharePoint sync client downloaded >2k files in 15 minutes from a single session.",
    ),
    (
        "Lateral movement via WMI execution",
        "Detections correlated wmiprvse.exe spawning cmd.exe on three hosts in the same subnet.",
    ),
    (
        "Phishing link clicked — credential harvester domain",
        "Safe Links rewrite hit a known typosquat domain; user submitted credentials before block page.",
    ),
    (
        "Container escape attempt signal",
        "Falco rule: unexpected mount of host /proc from namespace breakout pattern.",
    ),
    (
        "Database client anomaly — off-hours bulk SELECT",
        "Application service account issued large sequential queries against PII tables outside maintenance window.",
    ),
]

_SOURCES: Final[list[str]] = ["sentinel", "splunk"]

# Synthetic IOCs (documentation / test ranges only) — every mock incident includes a subset.
_MOCK_IOC_POOL: Final[list[IOCRef]] = [
    IOCRef(type="ipv4", value="203.0.113.41", score=68, label="auth-source"),
    IOCRef(type="ipv4", value="198.51.100.12", score=55, label="distributed-source"),
    IOCRef(type="ipv4", value="192.0.2.88", score=61, label="session-origin"),
    IOCRef(type="domain", value="login-secure-upd.example.net", score=82, label="credential-phish"),
    IOCRef(type="domain", value="cdn-assets.typosquat.test", score=74, label="typosquat"),
    IOCRef(type="url", value="https://malicious.example/login", score=79, label="harvester-url"),
    IOCRef(
        type="sha256",
        value="a3f1c9b2e847d6f0391cc52a4e1b7f3da3f1c9b2e847d6f0391cc52a4e1b7f3d",
        score=91,
        label="encoded-payload",
    ),
    IOCRef(
        type="sha256",
        value="b4e2d0c3f958e7a140a2dd63b5f2c8e4b4e2d0c3f958e7a140a2dd63b5f2c8e4",
        score=77,
        label="suspicious-module",
    ),
    IOCRef(type="email", value="svc-batch@corp.local", score=22, label="service-account"),
    IOCRef(type="email", value="victim.user@corp.local", score=12, label="mailbox"),
]


def build_random_mock_case_create() -> CaseCreate:
    source = random.choice(_SOURCES)
    title, description = random.choice(_SCENARIO_TEMPLATES)
    suffix = random.randint(1000, 9999)
    ioc_n = random.randint(1, 3)
    iocs = random.sample(_MOCK_IOC_POOL, k=min(ioc_n, len(_MOCK_IOC_POOL)))
    return CaseCreate(
        title=f"[{source.upper()}] {title} (#{suffix})",
        description=f"{description} Source: {source}.",
        severity=random.choice(list(Severity)),
        status=CaseStatus.open,
        assigned_to=None,
        tags=["mock-feed", "synthetic", source],
        mitre_tactics=random.sample(
            ["initial-access", "execution", "persistence", "credential-access", "lateral-movement"],
            k=random.randint(0, 2),
        ),
        mitre_techniques=random.sample(
            ["T1078", "T1059.001", "T1110", "T1021.002", "T1566.002"],
            k=random.randint(0, 2),
        ),
        iocs=iocs,
    )


async def run_mock_incident_feed(db: AsyncIOMotorDatabase) -> None:
    """Insert a synthetic case every 10-30 seconds until cancelled."""
    try:
        while True:
            await asyncio.sleep(random.uniform(_MIN_INTERVAL_S, _MAX_INTERVAL_S))
            data = build_random_mock_case_create()
            try:
                await case_service.create_case(db, data, created_by="mock-incident-feed")
            except Exception:
                logger.exception("Mock incident feed failed to create case")
                continue
            logger.info("Inserted mock incident case: %s", data.title)
    except asyncio.CancelledError:
        logger.debug("Mock incident feed cancelled")
        raise
