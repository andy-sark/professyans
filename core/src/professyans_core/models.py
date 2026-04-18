"""
Pydantic models for professyans_core.

These mirror the TypeScript types in frontend/src/types/ exactly.
Field names are chosen for cross-language clarity; where TS uses
camelCase, Python uses snake_case but serializes back to camelCase
via Pydantic's `alias_generator` so the wire format is identical.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

# ─── Enums / literals ────────────────────────────────────────────

Method = Literal["F7", "F5", "KCHG", "PEREKRESTOK"]
Track = Literal["activating", "closed"]
Gender = Literal["male", "female"]
CardState = Literal["unset", "like", "neutral", "reject", "flipped"]

TraceEventKind = Literal[
    "card_state_change",
    "card_flip",
    "formula_add",
    "formula_remove",
    "cluster_assign",
    "stage_enter",
    "stage_exit",
    "provocation_shown",
    "note_added",
]


# ─── Base with camelCase serialization for wire parity ───────────

class CamelModel(BaseModel):
    """Base: snake_case in Python, camelCase on the wire."""
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        frozen=False,
    )


# ─── Card schema ────────────────────────────────────────────────

class Card(CamelModel):
    code: str
    group: str
    method: Method
    title: str
    description: str | None = None
    linked_Ch: list[int] | None = Field(default=None, alias="linked_Ch")
    linked_G: list[int] | None = Field(default=None, alias="linked_G")


class GroupMeta(CamelModel):
    key: str
    label: str
    name: str
    role: Literal["auxiliary", "main", "final"]
    intro: str


# ─── Trace ────────────────────────────────────────────────────

class TraceEvent(CamelModel):
    ts: int
    kind: TraceEventKind
    payload: dict[str, Any] = Field(default_factory=dict)


class ProcessTrace(CamelModel):
    events: list[TraceEvent] = Field(default_factory=list)
    card_first_shown: dict[str, int] = Field(default_factory=dict)
    card_change_count: dict[str, int] = Field(default_factory=dict)


class ProcessInsights(CamelModel):
    most_changed_cards: list[str]
    returned_from_reject: list[str]
    quick_decision_cards: list[str]
    long_decision_cards: list[str]
    total_state_changes: int
    average_decision_time_ms: int


# ─── Session ──────────────────────────────────────────────────

class Session(CamelModel):
    id: str
    method: Method
    track: Track
    gender: Gender | None = None

    started_at: int
    updated_at: int
    completed_at: int | None = None

    current_stage: str

    # F7/F5:
    card_states: dict[str, CardState] = Field(default_factory=dict)
    formula: list[str] = Field(default_factory=list)
    clusters: dict[str, int] = Field(default_factory=dict)

    trace: ProcessTrace = Field(default_factory=ProcessTrace)
    notes: list[str] = Field(default_factory=list)
