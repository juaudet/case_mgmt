# AI Console — ChatGPT + Tines MCP Redesign

**Date:** 2026-05-02
**Status:** Approved

## Summary

Refactor the existing AI Console from a single-turn Claude (Anthropic) assistant to a multi-turn, agentic ChatGPT (OpenAI) assistant that can call Tines MCP tools directly during a conversation. Analysts interact through the existing side-drawer console; ChatGPT decides when to invoke VirusTotal or AbuseIPDB via the Tines MCP server and streams results back in real time.

---

## Architecture & Data Flow

The agentic tool-calling loop runs entirely server-side. The frontend sends one POST and receives an SSE stream.

```
Analyst types message
        │
        ▼
POST /cases/{id}/console/stream
        │
        ├─ Load console_history from MongoDB (reverse to chronological order)
        ├─ Build OpenAI messages array (system + history + new user message)
        ├─ System message always includes: SOC persona + raw case JSON
        │
        ▼
openai.chat.completions (gpt-4o, tools=[3 Tines functions])
        │
        ├─ Tool calls requested?
        │       ├─ SSE: {type: "tool_call", tool: "...", status: "running"}
        │       ├─ Call Tines MCP via existing tines_client.py
        │       ├─ SSE: {type: "tool_result", tool: "...", status: "done"}
        │       ├─ Write to mcp_calls / mcp_findings on case document
        │       └─ Feed results back → call OpenAI again (max 5 iterations)
        │
        └─ Final text → SSE stream: {type: "delta", text: "..."}
                │
                ▼
        Save turn to console_history (prompt, response, tool_calls_used)
        SSE: {type: "done"}
```

---

## Files Changed

| File | Change |
|---|---|
| `backend/app/console/router.py` | Replace Anthropic with OpenAI; add agentic loop; update streaming |
| `backend/app/console/service.py` | Inject raw case JSON into system message every turn |
| `backend/app/core/config.py` | Add `OPENAI_API_KEY`, `OPENAI_MODEL`; remove `TINES_VT_TOOL` / `TINES_ABUSEIPDB_*` settings |
| `backend/app/enrichment/tines_mcp_bridge.py` | **Deleted** — mapping layer no longer needed |
| `frontend/components/console/AnalystConsole.tsx` | Handle `tool_call` / `tool_result` SSE events |
| `backend/tests/console/` | Update existing tests in-place |

No new files are created.

---

## OpenAI Tool Definitions

Tools are registered by their exact Tines MCP names — no mapping layer:

```python
TINES_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_for_files_urls_domains_ips_and_comments",
            "description": "Search VirusTotal for a file hash, URL, domain, or IP address.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Hash, IP, domain, or URL to look up"}
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_for_an_ip_address",
            "description": "Check an IP address against AbuseIPDB for abuse confidence score.",
            "parameters": {
                "type": "object",
                "properties": {
                    "ip_address": {"type": "string"},
                    "max_age_in_days": {"type": "integer", "default": 30},
                },
                "required": ["ip_address"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_reports_for_an_ip_address",
            "description": "Get detailed abuse reports for an IP address from AbuseIPDB.",
            "parameters": {
                "type": "object",
                "properties": {
                    "ip_address": {"type": "string"},
                    "max_age_in_days": {"type": "integer", "default": 30},
                },
                "required": ["ip_address"],
            },
        },
    },
]
```

Tines MCP endpoint: `https://<YOUR-TINES-TENANT>.tines.com/mcp/<YOUR-TOKEN>`

---

## SSE Event Schema

| Event type | Payload | Frontend action |
|---|---|---|
| `tool_call` | `{tool, args, status: "running"}` | Show "Checking VirusTotal…" chip |
| `tool_result` | `{tool, status: "done"}` | Update chip to "Done" |
| `delta` | `{text}` | Append to response bubble |
| `done` | — | Stop spinner, re-enable input |
| `error` | `{message}` | Show error inline |

---

## Multi-turn Message Construction

```
[
  { role: "system",    content: "<SOC persona + raw case JSON>" },  ← every turn
  { role: "user",      content: "<turn 1 prompt>" },               ← from history
  { role: "assistant", content: "<turn 1 response>" },             ← from history
  ...
  { role: "user",      content: "<current message>" },             ← new
]
```

- `console_history` is stored newest-first in MongoDB; reversed before building messages.
- The raw case document (title, severity, status, IOCs, timeline, mcp_findings, etc.) is embedded in the system message on every turn — not just the first. This keeps case context stable across the conversation without special-casing.
- `context_flags` continue to be accepted but now influence which case fields are emphasized in the system message rather than being the sole source of context.

---

## MongoDB Turn Schema

One new field added to each `console_history` entry:

```python
{
    "id": "uuid",
    "prompt": "Is this IP malicious?",
    "response": "Yes, 192.168.1.1 has an abuse confidence score of 87...",
    "tool_calls_used": [
        {
            "tool": "search_for_an_ip_address",
            "args": {"ip_address": "192.168.1.1"},
            "result_summary": {"abuse_confidence_score": 87}
        }
    ],
    "template": None,
    "context_flags": {},
    "sources_used": [],
    "created_at": "2026-05-02T...",
    "actor": "analyst@corp.local"
}
```

AI-triggered Tines calls are also written to the case's `mcp_calls` and `mcp_findings` arrays, giving a unified audit trail.

---

## Tool Result Summarization

The full raw Tines response is passed back to ChatGPT so it can reason over all fields. A compact `result_summary` is also extracted for storage in `tool_calls_used` and `mcp_calls`.

**VirusTotal (`search_for_files_urls_domains_ips_and_comments`)**

Response shape: `{"data": [{"attributes": {...}}]}`

Extract from `data[0].attributes`:

```python
{
    "sha256": attributes["sha256"],
    "meaningful_name": attributes.get("meaningful_name"),
    "malicious": attributes["last_analysis_stats"]["malicious"],
    "suspicious": attributes["last_analysis_stats"]["suspicious"],
    "suggested_threat_label": attributes
        .get("popular_threat_classification", {})
        .get("suggested_threat_label"),
    "sandbox_verdicts": [
        name for name, v in attributes.get("sandbox_verdicts", {}).items()
        if v.get("category") == "malicious"
    ],
}
```

Example (WannaCry): `{"sha256": "24d004...", "malicious": 69, "suspicious": 0, "suggested_threat_label": "trojan.wannacry/wanna", "sandbox_verdicts": ["Tencent HABO", "C2AE", "Zenbox", ...]}`

**AbuseIPDB (`search_for_an_ip_address`)**

```python
{
    "abuse_confidence_score": data.get("data", {}).get("abuseConfidenceScore", 0),
    "country_code": data.get("data", {}).get("countryCode"),
    "is_tor": data.get("data", {}).get("isTor", False),
}
```

**AbuseIPDB Reports (`get_reports_for_an_ip_address`)**

```python
{
    "total_reports": data.get("data", {}).get("totalReports", 0),
    "abuse_confidence_score": data.get("data", {}).get("abuseConfidenceScore", 0),
}
```

---

## Config Changes

**Added:**
```python
OPENAI_API_KEY: str = ""
OPENAI_MODEL: str = "gpt-4o"
```

**Removed:**
```python
TINES_VT_TOOL       # tool names now hardcoded in TINES_TOOLS definitions
TINES_ABUSEIPDB_CHECK_TOOL
TINES_ABUSEIPDB_REPORTS_TOOL
```

`TINES_MCP_URL` (or `TINES_WEBHOOK_URL`) remains — it's the Tines endpoint used by `tines_client.py`.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Tines tool fails | Error returned to ChatGPT as tool result; model responds gracefully |
| OpenAI API unavailable | SSE `error` event sent; turn not saved |
| Tool loop exceeds 5 iterations | Loop breaks; partial response flushed |
| `OPENAI_API_KEY` missing | 503 HTTP error with descriptive message |
| `TINES_MCP_URL` not configured | Tool calls return `{"error": "Tines MCP URL not configured"}`; model handles gracefully |

---

## Tests

Existing tests in `backend/tests/console/` are updated in-place:

| Test | Coverage |
|---|---|
| `test_console_prompt` | Happy path: message saved, response returned |
| `test_console_history` | Multi-turn messages built correctly from history |
| `test_tool_call_recorded` | `mcp_calls` written when ChatGPT calls a Tines tool |
| `test_tines_unavailable` | Loop continues gracefully when Tines returns error |
| `test_loop_guard` | Loop exits after 5 iterations |

---

## Endpoint Strategy

Two endpoints exist today:

| Endpoint | Role after refactor |
|---|---|
| `POST /cases/{id}/console/stream` | Primary — agentic loop + SSE streaming. Frontend switches to this. |
| `POST /cases/{id}/console/prompt` | Updated to run the same agentic loop but returns a single JSON response. Kept for non-streaming consumers (tests, CLI). |

The frontend hook `useSubmitConsolePrompt` is updated to point to `/stream` and consume SSE events instead of a JSON response.

---

## Out of Scope

- Streaming mid-tool-call partial text (tool loop runs to completion before streaming begins)
- Selecting between Claude and ChatGPT at runtime
- Token budget management / conversation truncation (case JSON is compact enough to be negligible for now)
