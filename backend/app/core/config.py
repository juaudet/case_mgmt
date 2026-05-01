import os
from pathlib import Path
from typing import Any

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "siem"
    REDIS_URL: str = "redis://localhost:6379"
    JWT_SECRET_KEY: str = Field(
        ...,
        min_length=32,
        description="JWT signing secret; set JWT_SECRET_KEY or JWT_SECRET_KEY_FILE (never commit real values).",
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    MCP_SERVER_URL: str = "http://localhost:8001"
    DEMO_MODE: bool = True

    @model_validator(mode="before")
    @classmethod
    def _apply_secret_files(cls, data: Any) -> Any:
        """Prefer *_FILE mounts (Docker secrets / Key Vault sync) over plain env."""
        if not isinstance(data, dict):
            data = {}
        for key in ("JWT_SECRET_KEY", "MONGODB_URL", "REDIS_URL"):
            file_path = os.environ.get(f"{key}_FILE")
            if not file_path:
                continue
            try:
                val = Path(file_path).read_text(encoding="utf-8").strip()
            except OSError:
                continue
            if val:
                data[key] = val
        # In demo mode, allow boot without local secret files.
        demo_mode_raw = data.get("DEMO_MODE", os.environ.get("DEMO_MODE", "true"))
        demo_mode = str(demo_mode_raw).strip().lower() in {"1", "true", "yes", "on"}
        if demo_mode and not data.get("JWT_SECRET_KEY"):
            data["JWT_SECRET_KEY"] = "demo_jwt_secret_key_change_me_0123456789abcdef"
        return data


settings = Settings()
