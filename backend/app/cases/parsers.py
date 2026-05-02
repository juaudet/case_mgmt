from __future__ import annotations

from app.cases.models import CaseCreate, CaseStatus, IOCRef, Severity


def parse_provider_incident(provider: str, payload: dict) -> tuple[CaseCreate, list[IOCRef]]:
    normalized_provider = provider.strip().lower()
    if normalized_provider == "sentinel":
        return _parse_sentinel(payload)
    if normalized_provider == "splunk":
        return _parse_splunk(payload)
    raise ValueError(f"Unsupported provider: {provider}")


def _parse_sentinel(payload: dict) -> tuple[CaseCreate, list[IOCRef]]:
    properties = payload.get("properties", {})
    owner = properties.get("owner", {})
    title = properties.get("title") or payload.get("name") or "Sentinel incident"
    description = properties.get("description") or "Imported from Microsoft Sentinel"
    severity = _map_sentinel_severity(properties.get("severity"))
    status = _map_sentinel_status(properties.get("status"))

    tags = ["sentinel"]
    provider_name = properties.get("providerName")
    if provider_name:
        tags.append(provider_name.lower().replace(" ", "-"))

    incident_number = properties.get("incidentNumber")
    if incident_number is not None:
        tags.append(f"incident-{incident_number}")

    assigned_to = owner.get("email") or owner.get("userPrincipalName")

    return (
        CaseCreate(
            title=title,
            description=description,
            severity=severity,
            status=status,
            assigned_to=assigned_to,
            tags=list(dict.fromkeys(tags)),
        ),
        _extract_sentinel_iocs(payload),
    )


def _parse_splunk(payload: dict) -> tuple[CaseCreate, list[IOCRef]]:
    result = payload.get("result", payload)
    title = (
        result.get("title")
        or result.get("rule_name")
        or result.get("search_name")
        or "Splunk incident"
    )
    description = (
        result.get("description")
        or result.get("message")
        or result.get("_raw")
        or "Imported from Splunk"
    )
    severity = _map_splunk_severity(result.get("severity") or result.get("urgency"))
    status = _map_splunk_status(result.get("status"))
    assigned_to = result.get("owner") or result.get("assigned_to")

    tags = ["splunk"]
    if result.get("app"):
        tags.append(str(result["app"]).lower())
    if result.get("source"):
        tags.append(str(result["source"]).lower())

    return (
        CaseCreate(
            title=title,
            description=description,
            severity=severity,
            status=status,
            assigned_to=assigned_to,
            tags=list(dict.fromkeys(tags)),
        ),
        [],
    )


def _extract_sentinel_iocs(payload: dict) -> list[IOCRef]:
    entities = payload.get("entities")
    if entities is None and isinstance(payload.get("incident_entities"), dict):
        entities = payload["incident_entities"].get("entities")
    if entities is None:
        entities = payload.get("related_entities")
    if not isinstance(entities, list):
        return []

    iocs: list[IOCRef] = []
    seen: set[tuple[str, str]] = set()
    for entity in entities:
        if not isinstance(entity, dict):
            continue
        kind = str(entity.get("kind", "")).lower()
        props = entity.get("properties", {}) if isinstance(entity.get("properties"), dict) else {}

        candidates: list[tuple[str, str]] = []
        if kind == "ip" and props.get("address"):
            address = str(props["address"]).strip()
            ioc_type = "ipv6" if ":" in address else "ipv4"
            candidates.append((ioc_type, address))
        elif kind == "dnsresolution" and props.get("domainName"):
            candidates.append(("domain", str(props["domainName"]).strip().lower()))
        elif kind == "url" and props.get("url"):
            candidates.append(("url", str(props["url"]).strip()))
        elif kind == "filehash" and props.get("hashValue"):
            algorithm = str(props.get("algorithm", "hash")).strip().lower()
            candidates.append((algorithm, str(props["hashValue"]).strip().lower()))
        elif kind in {"account", "mailbox"}:
            value = props.get("upn") or props.get("mailboxPrimaryAddress")
            if value:
                candidates.append(("email", str(value).strip().lower()))

        for ioc_type, value in candidates:
            if not value:
                continue
            key = (ioc_type, value)
            if key in seen:
                continue
            seen.add(key)
            iocs.append(IOCRef(type=ioc_type, value=value, label=f"sentinel:{kind}"))
    return iocs


def _map_sentinel_severity(value: str | None) -> Severity:
    mapping = {
        "high": Severity.critical,
        "medium": Severity.high,
        "low": Severity.medium,
        "informational": Severity.low,
    }
    return mapping.get((value or "").strip().lower(), Severity.medium)


def _map_sentinel_status(value: str | None) -> CaseStatus:
    mapping = {
        "new": CaseStatus.open,
        "active": CaseStatus.in_progress,
        "closed": CaseStatus.closed,
    }
    return mapping.get((value or "").strip().lower(), CaseStatus.open)


def _map_splunk_severity(value: str | None) -> Severity:
    normalized = (value or "").strip().lower()
    mapping = {
        "critical": Severity.critical,
        "high": Severity.high,
        "medium": Severity.medium,
        "low": Severity.low,
        "info": Severity.low,
        "informational": Severity.low,
        "1": Severity.critical,
        "2": Severity.high,
        "3": Severity.medium,
        "4": Severity.low,
        "5": Severity.low,
    }
    return mapping.get(normalized, Severity.medium)


def _map_splunk_status(value: str | None) -> CaseStatus:
    normalized = (value or "").strip().lower()
    mapping = {
        "new": CaseStatus.open,
        "open": CaseStatus.open,
        "in_progress": CaseStatus.in_progress,
        "in progress": CaseStatus.in_progress,
        "active": CaseStatus.in_progress,
        "resolved": CaseStatus.closed,
        "closed": CaseStatus.closed,
        "false_positive": CaseStatus.false_positive,
        "false positive": CaseStatus.false_positive,
    }
    return mapping.get(normalized, CaseStatus.open)
