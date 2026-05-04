import json

from app.cases.models import Case


def build_system_prompt(case: Case, flags: dict) -> str:
    persona = (
        "You are an expert SOC analyst AI assistant. "
        "Analyse the case context below and answer the analyst query concisely and precisely. "
        "Always cite evidence. Flag uncertainty. Suggest next steps. "
        "You have access to tools: use them when the analyst asks about specific IPs, "
        "hashes, domains, or URLs to look up live threat intelligence. "
        "Always format your response using Markdown: use headers, bullet points, bold text, "
        "and code blocks where appropriate. "
        "Use inline HTML color spans when color adds meaning — for example: "
        "<span style='color:red'>critical</span>, <span style='color:orange'>high</span>, "
        "<span style='color:yellow'>medium</span>, <span style='color:green'>low/clean</span> "
        "severity labels, or to highlight key IOCs and findings."
    )
    case_json = json.dumps(
        case.model_dump(mode="json", exclude_none=True),
        indent=2,
        default=str,
    )
    return f"{persona}\n\nCASE CONTEXT:\n{case_json}"
