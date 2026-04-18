"""
Formula-7 logic — Python port of the TypeScript frontend.

Must produce IDENTICAL results to the TS implementation:
    - frontend/src/lib/f7/validation.ts     → validate_formula
    - frontend/src/lib/f7/hints.ts          → match_hints, detect_schzh_conflicts
    - frontend/src/lib/tracker.ts           → compute_insights

Invariant: for any given Session, both implementations produce the
same FormulaValidation / MatchedHint list / ProcessInsights.
Parity is verified by tests in core/tests/.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import cached_property
from typing import Any

from professyans_core.models import (
    CardState,
    ProcessInsights,
    ProcessTrace,
    Session,
)
from professyans_core.paths import load_json

# ─── Constants matching TS spec ──────────────────────────────────

_DECISION_QUICK_MS = 2000
_DECISION_LONG_MS = 15000


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


# ─── Formula validation — parity with TS validateFormula ────────

@dataclass(frozen=True)
class FormulaValidation:
    ok: bool
    issues: list[str]
    missing_groups: list[str]
    empty_like_groups: list[str]


def validate_formula(
    formula: list[str],
    card_states: dict[str, str],
) -> FormulaValidation:
    """Validate a candidate formula against the F7 rules.

    Mirrors frontend/src/lib/f7/validation.ts::validateFormula.
    """
    issues: list[str] = []
    formula_set = set(formula)

    # Size check
    if len(formula_set) != F7.formula_size:
        issues.append(f"Выбрано {len(formula_set)} из {F7.formula_size}")

    # Per-group coverage
    missing_groups: list[str] = []
    for group in F7.main_groups:
        has_any = any(F7.card_group(code) == group for code in formula_set)
        if not has_any:
            missing_groups.append(group)
    if missing_groups:
        issues.append(
            "В формуле пока нет карточек из групп: " + ", ".join(missing_groups)
        )

    # Empty-like groups
    empty_like_groups: list[str] = []
    for group in F7.main_groups:
        has_like = any(
            F7.card_group(code) == group and state == "like"
            for code, state in card_states.items()
        )
        if not has_like:
            empty_like_groups.append(group)
    if empty_like_groups:
        issues.append(
            f"В группах {', '.join(empty_like_groups)} у тебя нет ни одной «нравится». "
            "Это сигнал сам по себе — стоит обсудить, почему."
        )

    return FormulaValidation(
        ok=not issues,
        issues=issues,
        missing_groups=missing_groups,
        empty_like_groups=empty_like_groups,
    )


# ─── Hint matching — parity with TS matchHints ─────────────────

@dataclass(frozen=True)
class MatchedHint:
    hint_id: str
    label: str
    examples: list[str]
    keys: list[str]
    matched_keys: list[str]
    score: int
    coverage: float


def match_hints(selected_codes: set[str]) -> list[MatchedHint]:
    """Find profession-hint signatures that match the selection.

    Algorithm per spec §10.3 — mirrors frontend matchHints().
    """
    out: list[MatchedHint] = []
    for h in F7.data.hints:
        keys = h["keys"]
        matched = [k for k in keys if k in selected_codes]
        score = len(matched)
        coverage = score / len(keys) if keys else 0.0
        keep = coverage >= 1.0 or (score >= 2 and coverage >= 0.66)
        if keep:
            out.append(MatchedHint(
                hint_id=h["id"],
                label=h["label"],
                examples=list(h["examples"]),
                keys=list(keys),
                matched_keys=matched,
                score=score,
                coverage=coverage,
            ))

    out.sort(key=lambda m: (-m.score, -m.coverage))
    return out[:6]


# ─── SCHZH conflicts — parity with TS detectSchzhConflicts ─────

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


# ─── Process insights — parity with TS computeInsights ─────────

def compute_insights(trace: ProcessTrace) -> ProcessInsights:
    """Derive process metrics from a recorded trace.

    Mirrors frontend/src/lib/tracker.ts::computeInsights.
    """
    state_change_events = [
        e for e in trace.events
        if e.kind in ("card_state_change", "card_flip")
    ]

    # Cards with ≥2 changes — sorted desc by change count, limit 10
    most_changed = [
        code for code, count in sorted(
            ((c, n) for c, n in trace.card_change_count.items() if n >= 2),
            key=lambda kv: -kv[1],
        )
    ][:10]

    # Returned-from-reject
    returned = _find_returned_from_reject(state_change_events)

    # Decision times
    decision_times = _compute_decision_times(trace, state_change_events)
    quick = [c for c, ms in decision_times.items() if 0 < ms < _DECISION_QUICK_MS]
    long_ = [c for c, ms in decision_times.items() if ms > _DECISION_LONG_MS]

    avg = int(
        sum(decision_times.values()) / len(decision_times)
    ) if decision_times else 0

    return ProcessInsights(
        most_changed_cards=most_changed,
        returned_from_reject=returned,
        quick_decision_cards=quick,
        long_decision_cards=long_,
        total_state_changes=len(state_change_events),
        average_decision_time_ms=avg,
    )


def _find_returned_from_reject(events: list[Any]) -> list[str]:
    had_reject: set[str] = set()
    returned: set[str] = set()
    for e in events:
        p = e.payload
        code = p.get("cardCode")
        if not code:
            continue
        frm: CardState | None = p.get("from")
        to: CardState | None = p.get("to")
        if to == "reject":
            had_reject.add(code)
        if frm == "reject" and to != "reject" and code in had_reject:
            returned.add(code)
    return list(returned)


def _compute_decision_times(
    trace: ProcessTrace, events: list[Any]
) -> dict[str, int]:
    last_change: dict[str, int] = {}
    for e in events:
        code = e.payload.get("cardCode")
        if not code:
            continue
        last_change[code] = e.ts

    out: dict[str, int] = {}
    for code, last_ts in last_change.items():
        first_shown = trace.card_first_shown.get(code)
        if first_shown is not None:
            out[code] = last_ts - first_shown
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
