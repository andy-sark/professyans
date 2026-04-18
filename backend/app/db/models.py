"""SQLAlchemy ORM models."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import JSON, BigInteger, DateTime, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


class SessionRecord(Base):
    """
    Persisted user session.

    Strategy: keep the wire shape (matching frontend's Session type) as a
    JSON blob in `state`, plus a few promoted columns for indexing and
    filtering. The frontend serializes its Session directly into this blob;
    the backend doesn't need to re-model every field in SQL columns.

    For Postgres this maps to JSONB; for SQLite to TEXT-encoded JSON.
    """

    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    method: Mapped[str] = mapped_column(String(16), index=True)
    track: Mapped[str] = mapped_column(String(16), index=True)
    gender: Mapped[str | None] = mapped_column(String(16), nullable=True)

    started_at: Mapped[int] = mapped_column(BigInteger, index=True)
    updated_at: Mapped[int] = mapped_column(BigInteger)
    completed_at: Mapped[int | None] = mapped_column(BigInteger, nullable=True, index=True)

    current_stage: Mapped[str] = mapped_column(String(64))

    # The full Session as a JSON blob — single source for cardStates,
    # formula, clusters, trace, notes.
    state: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    # Optional free-text for later indexing
    notes_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Bookkeeping
    created_at_db: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now_utc
    )
    updated_at_db: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now_utc, onupdate=_now_utc
    )

    __table_args__ = (
        Index("ix_sessions_method_started", "method", "started_at"),
    )
