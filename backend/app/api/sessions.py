"""Session CRUD + sync endpoints."""

from __future__ import annotations

from dataclasses import asdict
from typing import Union

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session as DbSession

from app.db import get_db
from app.db.models import SessionRecord
from app.schemas import (
    F5ResultResponse,
    F7ResultResponse,
    Session as SessionSchema,
    SessionListItem,
    SessionListResponse,
)
from professyans_core.methods.formula5 import derive_result as derive_result_f5
from professyans_core.methods.formula7 import derive_result as derive_result_f7

router = APIRouter(prefix="/sessions", tags=["sessions"])


def _record_to_session(rec: SessionRecord) -> SessionSchema:
    """Reconstruct a Session from its stored JSON blob."""
    return SessionSchema.model_validate(rec.state)


def _session_to_record(s: SessionSchema, rec: SessionRecord | None = None) -> SessionRecord:
    """Create or update a SessionRecord from a Session."""
    blob = s.model_dump(by_alias=True)
    if rec is None:
        rec = SessionRecord(id=s.id)
    rec.method = s.method
    rec.track = s.track
    rec.gender = s.gender
    rec.started_at = s.started_at
    rec.updated_at = s.updated_at
    rec.completed_at = s.completed_at
    rec.current_stage = s.current_stage
    rec.state = blob
    rec.notes_text = "\n---\n".join(s.notes) if s.notes else None
    return rec


@router.post("", response_model=SessionSchema, status_code=status.HTTP_201_CREATED)
def create_session(payload: SessionSchema, db: DbSession = Depends(get_db)) -> SessionSchema:
    """Create or replace a session (idempotent by id).

    The frontend generates a UUID on the client and PUTs the full Session
    here. If a session with that id already exists, it's replaced — this
    matches the "last write wins" semantics of the offline-first client.
    """
    existing = db.get(SessionRecord, payload.id)
    rec = _session_to_record(payload, existing)
    db.merge(rec)
    db.commit()
    return payload


@router.get("/{session_id}", response_model=SessionSchema)
def get_session(session_id: str, db: DbSession = Depends(get_db)) -> SessionSchema:
    rec = db.get(SessionRecord, session_id)
    if rec is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return _record_to_session(rec)


@router.put("/{session_id}", response_model=SessionSchema)
def update_session(
    session_id: str,
    payload: SessionSchema,
    db: DbSession = Depends(get_db),
) -> SessionSchema:
    """Full-replace update — same semantics as create."""
    if payload.id != session_id:
        raise HTTPException(
            status_code=400,
            detail="Session id in URL doesn't match payload",
        )
    existing = db.get(SessionRecord, session_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="Session not found")
    rec = _session_to_record(payload, existing)
    db.merge(rec)
    db.commit()
    return payload


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: str, db: DbSession = Depends(get_db)) -> None:
    rec = db.get(SessionRecord, session_id)
    if rec is None:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(rec)
    db.commit()


@router.get("", response_model=SessionListResponse)
def list_sessions(
    method: str | None = None,
    limit: int = 50,
    db: DbSession = Depends(get_db),
) -> SessionListResponse:
    q = select(SessionRecord).order_by(SessionRecord.started_at.desc())
    if method:
        q = q.where(SessionRecord.method == method)
    q = q.limit(min(limit, 200))
    rows = db.execute(q).scalars().all()
    items = [
        SessionListItem(
            id=r.id,
            method=r.method,
            track=r.track,
            started_at=r.started_at,
            completed_at=r.completed_at,
            current_stage=r.current_stage,
            has_formula=bool(r.state.get("formula")),
        )
        for r in rows
    ]
    total = db.query(SessionRecord).count()
    return SessionListResponse(items=items, total=total)


@router.get("/{session_id}/result", response_model=Union[F7ResultResponse, F5ResultResponse])
def get_result(
    session_id: str, db: DbSession = Depends(get_db),
) -> Union[F7ResultResponse, F5ResultResponse]:
    """Compute and return the derived result for a session — server-side parity check."""
    rec = db.get(SessionRecord, session_id)
    if rec is None:
        raise HTTPException(status_code=404, detail="Session not found")
    session = _record_to_session(rec)

    if rec.method == "F7":
        result = derive_result_f7(session)
        return F7ResultResponse(
            session_id=result.session_id,
            formula=result.formula,
            validation=asdict(result.validation),  # type: ignore[arg-type]
            hints=[asdict(h) for h in result.hints],  # type: ignore[arg-type]
            conflicts=[asdict(c) for c in result.conflicts],  # type: ignore[arg-type]
            insights=result.insights.model_dump(),  # type: ignore[arg-type]
            flipped_cards=result.flipped_cards,
            rejected_cards=result.rejected_cards,
        )
    if rec.method == "F5":
        result = derive_result_f5(session)
        return F5ResultResponse(
            session_id=result.session_id,
            formula=result.formula,
            validation=asdict(result.validation),  # type: ignore[arg-type]
            hints=[asdict(h) for h in result.hints],  # type: ignore[arg-type]
            insights=result.insights.model_dump(),  # type: ignore[arg-type]
            flipped_cards=result.flipped_cards,
            rejected_cards=result.rejected_cards,
        )

    raise HTTPException(
        status_code=400,
        detail=f"Result derivation for method '{rec.method}' not implemented yet",
    )
