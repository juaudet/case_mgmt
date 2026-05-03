def test_openai_settings_present():
    from app.core.config import Settings
    s = Settings(JWT_SECRET_KEY="a" * 32, OPENAI_API_KEY="sk-test")
    assert s.OPENAI_API_KEY == "sk-test"
    assert s.OPENAI_MODEL == "gpt-4o"

def test_old_tines_tool_settings_removed():
    from app.core.config import Settings
    import inspect
    fields = inspect.signature(Settings).parameters
    assert "TINES_VT_TOOL" not in fields
    assert "TINES_ABUSEIPDB_CHECK_TOOL" not in fields
    assert "TINES_ABUSEIPDB_REPORTS_TOOL" not in fields
