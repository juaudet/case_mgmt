"""
Utility for reading sensitive values from environment variables or Docker secret files.

Priority: environment variable → /run/secrets/<name> file → empty string
"""

import os
from pathlib import Path


def read_env_or_secret_file(
    name: str,
    secret_dir: str = "/run/secrets",
    on_file_error: str = "ignore",
) -> str:
    """
    Read a secret value by name.

    Checks in order:
    1. Environment variable named `name`
    2. File at `<secret_dir>/<name>` (Docker secrets / mounted volume)

    Args:
        name: The variable/secret name (e.g. "OPENAI_API_KEY")
        secret_dir: Directory to look for secret files (default: /run/secrets)
        on_file_error: "ignore" returns "" on read error; "raise" raises RuntimeError

    Returns:
        The secret value, or "" if not found.
    """
    value = os.environ.get(name, "").strip()
    if value:
        return value

    secret_path = Path(secret_dir) / name
    try:
        return secret_path.read_text(encoding="utf-8").strip()
    except OSError as exc:
        if on_file_error == "raise":
            raise RuntimeError(
                f"Secret '{name}' not found in env or '{secret_path}'"
            ) from exc
        return ""
