"""
Formula-5 logic — same structural pattern as Formula-7, separate static data.

Five main groups only; optional bonus slots come from methodology metadata.
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


@dataclass(frozen=True)
class _F5Data:
    """Immutable container for F5 static data loaded from JSON."""
    cards: list[dict[str, Any]]
    groups: list[dict[str, Any]]
    main_groups: tuple[str, ...]
    ranking_order: tuple[str, ...]
    formula_size: int
    bonus_size: int
    hints: list[dict[str, Any]]

    @cached_property
    def cards_by_code(self) -> dict[str, dict[str, Any]]:
        return {c["code"]: c for c in self.cards}

    @cached_property
    def card_group(self) -> dict[str, str]:
        return {c["code"]: c["group"] for c in self.cards}


def _load_f5_data() -> _F5Data:
    cards_doc = load_json("formula5/cards.json")
    hints_doc = load_json("formula5/hints.json")
    meta = cards_doc["meta"]
    return _F5Data(
        cards=cards_doc["cards"],
        groups=meta["groups"],
        main_groups=tuple(meta["mainGroups"]),
        ranking_order=tuple(meta["rankingOrder"]),
        formula_size=int(meta["formulaSize"]),
        bonus_size=int(meta.get("bonusSize", 0)),
        hints=hints_doc["hints"],
    )


class _F5Namespace:
    """Lazy singleton exposing F5 static data."""
    _cached: _F5Data | None = None

    @property
    def data(self) -> _F5Data:
        if self._cached is None:
            self._cached = _load_f5_data()
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

    @property
    def bonus_size(self) -> int:
        return self.data.bonus_size

    def cards_of_group(self, group: str) -> list[dict[str, Any]]:
        return [c for c in self.cards if c["group"] == group]

    def card_group(self, code: str) -> str | None:
        return self.data.card_group.get(code)


F5 = _F5Namespace()


def validate_formula(
    formula: list[str],
    card_states: dict[str, str],
) -> FormulaValidation:
    """Validate a candidate formula against the F5 rules."""
    return _validate_formula_generic(
        formula,
        card_states,
        formula_size=F5.formula_size,
        main_groups=F5.main_groups,
        card_group=F5.card_group,
        bonus_size=F5.bonus_size,
    )


def match_hints(selected_codes: set[str]) -> list[MatchedHint]:
    """Find profession-hint signatures that match the selection."""
    return _match_hints_generic(selected_codes, hints=F5.data.hints)


@dataclass(frozen=True)
class F5Result:
    """Complete result derived from a Session (F5)."""
    session_id: str
    formula: list[str]
    validation: FormulaValidation
    hints: list[MatchedHint]
    insights: ProcessInsights
    flipped_cards: list[str]
    rejected_cards: list[str]


def derive_result(session: Session) -> F5Result:
    """Compute a full F5Result from a Session."""
    liked_set = {
        code for code, state in session.card_states.items() if state == "like"
    }
    flipped = [c for c, s in session.card_states.items() if s == "flipped"]
    rejected = [c for c, s in session.card_states.items() if s == "reject"]

    return F5Result(
        session_id=session.id,
        formula=list(session.formula),
        validation=validate_formula(list(session.formula), dict(session.card_states)),
        hints=match_hints(liked_set),
        insights=compute_insights(session.trace),
        flipped_cards=flipped,
        rejected_cards=rejected,
    )
