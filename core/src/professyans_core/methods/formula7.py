"""
Formula-7 logic — Python port of the TypeScript frontend.

Must produce IDENTICAL results to the TS implementation:
    - frontend/src/lib/f7/validation.ts     → validate_formula
    - frontend/src/lib/f7/hints.ts          → match_hints, detect_schzh_conflicts
    - frontend/src/lib/tracker.ts           → compute_insights

Invariant: for any given Session, both implementations produce the
same FormulaValidation / MatchedHint list / ProcessInsights.
Parity is verified by tests in core/tests/.

Shared algorithms live in methods/common.py; this module wires them to F7 data.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import cached_property
from typing import Any

from professyans_core.models import (
    ProcessInsights,
    Session,
)
from professyans_core.paths import load_json

from .common import (
    FormulaValidation,
    MatchedHint,
    compute_insights,
    match_hints as _match_hints_generic,
    validate_formula as _validate_formula_generic,
)


# ─── Static data loader, memoized per-process ────────────────────

@dataclass(frozen=True)
class _F7Data:
    """Immutable container for F7 static data loaded from JSON."""
    cards: list[dict[str, Any]]
    groups: list[dict[str, Any]]
    main_groups: tuple[str, ...]
    ranking_order: tuple[str, ...]
    formula_size: int
    hints: list[dict[str, Any]]
    schzh_conflicts: list[dict[str, Any]]
    provocations: list[dict[str, Any]]

    @cached_property
    def cards_by_code(self) -> dict[str, dict[str, Any]]:
        return {c["code"]: c for c in self.cards}

    @cached_property
    def card_group(self) -> dict[str, str]:
        return {c["code"]: c["group"] for c in self.cards}


def _load_f7_data() -> _F7Data:
    cards_doc = load_json("formula7/cards.json")
    hints_doc = load_json("formula7/hints.json")
    provs_doc = load_json("formula7/provocations.json")
    return _F7Data(
        cards=cards_doc["cards"],
        groups=cards_doc["meta"]["groups"],
        main_groups=tuple(cards_doc["meta"]["mainGroups"]),
        ranking_order=tuple(cards_doc["meta"]["rankingOrder"]),
        formula_size=cards_doc["meta"]["formulaSize"],
        hints=hints_doc["hints"],
        schzh_conflicts=hints_doc["schzh_conflicts"],
        provocations=provs_doc,
    )


class _F7Namespace:
    """Lazy singleton exposing F7 static data."""
    _cached: _F7Data | None = None

    @property
    def data(self) -> _F7Data:
        if self._cached is None:
            self._cached = _load_f7_data()
        return self._cached

    @property
    def cards(self) -> list[dict[str, Any]]:
        return self.data.cards

    @property
    def main_groups(self) -> tuple[str, ...]:
        return self.data.main_groups

    @property
    def ranking_order(self) -> tuple[str, ...]:
        return self.data.ranking_order

    @property
    def formula_size(self) -> int:
        return self.data.formula_size

    def cards_of_group(self, group: str) -> list[dict[str, Any]]:
        return [c for c in self.cards if c["group"] == group]

    def card_group(self, code: str) -> str | None:
        return self.data.card_group.get(code)


F7 = _F7Namespace()


def validate_formula(
    formula: list[str],
    card_states: dict[str, str],
) -> FormulaValidation:
    """Validate a candidate formula against the F7 rules.

    Mirrors frontend/src/lib/f7/validation.ts::validateFormula.
    """
    return _validate_formula_generic(
        formula,
        card_states,
        formula_size=F7.formula_size,
        main_groups=F7.main_groups,
        card_group=F7.card_group,
    )


def match_hints(selected_codes: set[str]) -> list[MatchedHint]:
    """Find profession-hint signatures that match the selection.

    Algorithm per spec §10.3 — mirrors frontend matchHints().
    """
    return _match_hints_generic(selected_codes, hints=F7.data.hints)


# ─── SCHZH conflicts — parity with TS detectSchzhConflicts ─────────

@dataclass(frozen=True)
class SchzhConflictTriggered:
    description: str
    cards: list[str]
    matched_cards: list[str]


def detect_schzh_conflicts(selected_codes: set[str]) -> list[SchzhConflictTriggered]:
    out: list[SchzhConflictTriggered] = []
    for c in F7.data.schzh_conflicts:
        cards: list[str] = c["cards"]
        matched = [k for k in cards if k in selected_codes]
        if len(matched) == len(cards):
            out.append(SchzhConflictTriggered(
                description=c["description"],
                cards=list(cards),
                matched_cards=matched,
            ))
    return out


# ─── High-level convenience: full result from a Session ────────

@dataclass(frozen=True)
class F7Result:
    """Complete result derived from a Session."""
    session_id: str
    formula: list[str]
    validation: FormulaValidation
    hints: list[MatchedHint]
    conflicts: list[SchzhConflictTriggered]
    insights: ProcessInsights
    flipped_cards: list[str]
    rejected_cards: list[str]


def derive_result(session: Session) -> F7Result:
    """Compute a full F7Result from a Session — single entry point for UI."""
    liked_set = {
        code for code, state in session.card_states.items() if state == "like"
    }
    flipped = [c for c, s in session.card_states.items() if s == "flipped"]
    rejected = [c for c, s in session.card_states.items() if s == "reject"]

    return F7Result(
        session_id=session.id,
        formula=list(session.formula),
        validation=validate_formula(list(session.formula), dict(session.card_states)),
        hints=match_hints(liked_set),
        conflicts=detect_schzh_conflicts(liked_set),
        insights=compute_insights(session.trace),
        flipped_cards=flipped,
        rejected_cards=rejected,
    )
