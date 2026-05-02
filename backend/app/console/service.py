from app.cases.models import Case


def build_system_prompt(case: Case, flags: dict) -> str:
    blocks = [
        "You are an expert SOC analyst AI assistant. Analyse the following case context and answer the analyst query concisely and precisely.",
        "Always cite evidence. Flag uncertainty. Suggest next steps.",
    ]
    if flags.get("case_details"):
        blocks.append(
            f"CASE:\nID: {case.case_number}\nTitle: {case.title}\n"
            f"Severity: {case.severity}\nStatus: {case.status}\nDescription: {case.description}"
        )
    if flags.get("ldap") and case.ldap_context:
        blocks.append(f"LDAP:\n{case.ldap_context}")
    if flags.get("ioc_data") and case.iocs:
        ioc_lines = [
            f"- {i.type}: {i.value} (score: {i.score}, label: {i.label})"
            for i in case.iocs
        ]
        blocks.append("IOCs:\n" + "\n".join(ioc_lines))
    if flags.get("virustotal") and case.vt_results:
        blocks.append(f"VT RESULTS:\n{case.vt_results}")
    if flags.get("mcp_findings") and case.mcp_findings:
        blocks.append(f"MCP FINDINGS (Tines-backed):\n{case.mcp_findings}")
    if flags.get("abuseipdb") and case.abuseipdb_results:
        blocks.append(f"ABUSEIPDB:\n{case.abuseipdb_results}")
    if flags.get("playbook_state") and case.playbook_state:
        blocks.append(f"PLAYBOOK STATE:\n{case.playbook_state}")
    return "\n\n".join(blocks)
