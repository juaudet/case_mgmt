"""Map public MCP tool names + params to Tines story names and arguments."""

from app.core.config import Settings


def resolve_tines_invocation(settings: Settings, tool_name: str, params: dict) -> tuple[str, dict]:
    """Return (tines_tool_name, arguments) for a tools/call to Tines."""
    vt = settings.TINES_VT_TOOL
    check = settings.TINES_ABUSEIPDB_CHECK_TOOL
    reports = settings.TINES_ABUSEIPDB_REPORTS_TOOL

    if tool_name == "vt_ip_report":
        return vt, {"query": params["ip"]}
    if tool_name == "vt_hash_lookup":
        return vt, {"query": params["hash"]}
    if tool_name == "vt_domain_scan":
        return vt, {"query": params["domain"]}
    if tool_name == "vt_file_submit":
        return vt, {"query": params["url"]}
    if tool_name == "abuseipdb_check_ip":
        return check, {
            "ip_address": params["ip"],
            "max_age_in_days": int(params.get("max_age_in_days", 30)),
        }
    if tool_name == "abuseipdb_ip_reports":
        return reports, {
            "ip_address": params["ip"],
            "max_age_in_days": int(params.get("max_age_in_days", 30)),
            "page": int(params.get("page", 1)),
            "per_page": int(params.get("per_page", 25)),
        }
    raise ValueError(f"Unsupported MCP tool for Tines bridge: {tool_name}")
