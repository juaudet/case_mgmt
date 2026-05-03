import json

from app.cases.models import Case


def build_system_prompt(case: Case, flags: dict) -> str:
    persona = (
        "You are an expert SOC analyst AI assistant. "
        "Analyse the case context below and answer the analyst query concisely and precisely. "
        "Always cite evidence. Flag uncertainty. Suggest next steps. "
        "You have access to tools: use them when the analyst asks about specific IPs, "
        "hashes, domains, or URLs to look up live threat intelligence."
    )
    case_json = json.dumps(
        case.model_dump(mode="json", exclude_none=True),
        indent=2,
        default=str,
    )
    return f"{persona}\n\nCASE CONTEXT:\n{case_json}"
