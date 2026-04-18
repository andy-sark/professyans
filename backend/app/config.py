"""Environment-driven configuration."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration — all values overridable via env vars."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    # Default: SQLite for local dev. Production: postgresql+psycopg://user:pass@host/db
    database_url: str = Field(
        default="sqlite:///./professyans.db",
        alias="DATABASE_URL",
    )

    # CORS
    cors_allow_origins: list[str] = Field(
        default=["http://localhost:5173", "http://127.0.0.1:5173"],
        alias="CORS_ALLOW_ORIGINS",
    )

    # Logging
    log_level: str = Field(default="info", alias="LOG_LEVEL")

    # API metadata
    api_title: str = "Professyans API"
    api_version: str = "0.1.0"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
