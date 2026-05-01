from pydantic import Field
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
        description="JWT signing secret; set JWT_SECRET_KEY in the environment or .env (never commit real values).",
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ANTHROPIC_API_KEY: str = ""
    MCP_SERVER_URL: str = "http://localhost:8001"
    DEMO_MODE: bool = True


settings = Settings()
