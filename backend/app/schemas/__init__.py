"""
API request / response schemas.

These schemas are *identical in shape* to what the TS frontend produces —
so a Session can be PUT'd to the server and PUT'd back without any
transformation on either side.

For response models of result endpoints we define dataclass→pydantic
conversions where needed.
"""

from __future__ import annotations

from pydantic import BaseModel
from pydantic.alias_generators import to_camel

# Re-export the canonical Session shape from core:
from professyans_core.models import CamelModel, Session

__all__ = [
    "Session",
    "SessionListItem",
    "SessionListResponse",
    "F7ResultResponse",
    "F5ResultResponse",
    "MatchedHintSchema",
    "SchzhConflictSchema",
    "FormulaValidationSchema",
    "ProcessInsightsSchema",
]


class SessionListItem(CamelModel):
    """Compact session summary for listings."""
    id: str
    method: str
    track: str
    started_at: int
    completed_at: int | None
    current_stage: str
    has_formula: bool


class SessionListResponse(BaseModel):
    items: list[SessionListItem]
    total: int


# ─── Result schemas — safe wire shape of core dataclasses ────────

class FormulaValidationSchema(CamelModel):
    ok: bool
    issues: list[str]
    missing_groups: list[str]
    empty_like_groups: list[str]


class MatchedHintSchema(CamelModel):
    hint_id: str
    label: str
    examples: list[str]
    keys: list[str]
    matched_keys: list[str]
    score: int
    coverage: float


class SchzhConflictSchema(CamelModel):
    description: str
    cards: list[str]
    matched_cards: list[str]


class ProcessInsightsSchema(CamelModel):
    most_changed_cards: list[str]
    returned_from_reject: list[str]
    quick_decision_cards: list[str]
    long_decision_cards: list[str]
    total_state_changes: int
    average_decision_time_ms: int


class F7ResultResponse(CamelModel):
    session_id: str
    formula: list[str]
    validation: FormulaValidationSchema
    hints: list[MatchedHintSchema]
    conflicts: list[SchzhConflictSchema]
    insights: ProcessInsightsSchema
    flipped_cards: list[str]
    rejected_cards: list[str]


class F5ResultResponse(CamelModel):
    """Formula-5 result — same wire shape as F7 except no tension/conflicts list."""

    session_id: str
    formula: list[str]
    validation: FormulaValidationSchema
    hints: list[MatchedHintSchema]
    insights: ProcessInsightsSchema
    flipped_cards: list[str]
    rejected_cards: list[str]
