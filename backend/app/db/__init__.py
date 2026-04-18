"""SQLAlchemy engine + session factory."""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session as DbSession, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    """Base for all ORM models."""


_settings = get_settings()

_connect_args: dict[str, object] = {}
if _settings.database_url.startswith("sqlite"):
    # SQLite specific: allow multi-thread access for uvicorn workers
    _connect_args = {"check_same_thread": False}

engine = create_engine(
    _settings.database_url,
    connect_args=_connect_args,
    echo=False,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db() -> Generator[DbSession, None, None]:
    """FastAPI dependency — provides a request-scoped SQLAlchemy session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables. Called on startup for SQLite dev; production uses Alembic."""
    # Import models so SQLAlchemy sees them when we call metadata.create_all
    from app.db import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
