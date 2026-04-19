"""
Shared formula-style logic: validation, hint matching, process insights.

Used by method-specific modules; callers supply static data (sizes, groups,
hint rows) so this module stays free of any single methodology's constants.
"""

from __future__ import annotations

from collections.abc import Callable, Iterable
from dataclasses import dataclass
from typing import Any

from professyans_core.models import (
    CardState,
    ProcessInsights,
    ProcessTrace,
)

# ─── Constants matching TS spec (tracker.ts) ─────────────────────

_DECISION_QUICK_MS = 2000
_DECISION_LONG_MS = 15000


# ─── Formula validation — parity with TS validateFormula ─────────

@dataclass(frozen=True)
class FormulaValidation:
    ok: bool
    issues: list[str]
    missing_groups: list[str]
    empty_like_groups: list[str]


def validate_formula(
    formula: list[str],
    card_states: dict[str, str],
    *,
    formula_size: int,
    main_groups: tuple[str, ...],
    card_group: Callable[[str], str | None],
    bonus_size: int = 0,
) -> FormulaValidation:
    """Validate a candidate formula against size and main-group rules."""
    issues: list[str] = []
    formula_set = set(formula)
    n = len(formula_set)
    max_size = formula_size + bonus_size

    if n < formula_size or n > max_size:
        if bonus_size == 0:
            issues.append(f"Выбрано {n} из {formula_size}")
        else:
            issues.append(
                f"Выбрано {n}, нужно от {formula_size} до {formula_size + bonus_size}"
            )

    missing_groups: list[str] = []
    for group in main_groups:
        has_any = any(card_group(code) == group for code in formula_set)
        if not has_any:
            missing_groups.append(group)
    if missing_groups:
        issues.append(
            "В формуле пока нет карточек из групп: " + ", ".join(missing_groups)
        )

    empty_like_groups: list[str] = []
    for group in main_groups:
        has_like = any(
            card_group(code) == group and state == "like"
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


# ─── Hint matching — parity with TS matchHints ──────────────────

@dataclass(frozen=True)
class MatchedHint:
    hint_id: str
    label: str
    examples: list[str]
    keys: list[str]
    matched_keys: list[str]
    score: int
    coverage: float


def match_hints(
    selected_codes: set[str],
    *,
    hints: Iterable[dict[str, Any]],
) -> list[MatchedHint]:
    """Find profession-hint signatures that match the selection (§10.3)."""
    out: list[MatchedHint] = []
    for h in hints:
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


# ─── Process insights — parity with TS computeInsights ───────────

def compute_insights(trace: ProcessTrace) -> ProcessInsights:
    """Derive process metrics from a recorded trace."""
    state_change_events = [
        e for e in trace.events
        if e.kind in ("card_state_change", "card_flip")
    ]

    most_changed = [
        code for code, count in sorted(
            ((c, n) for c, n in trace.card_change_count.items() if n >= 2),
            key=lambda kv: -kv[1],
        )
    ][:10]

    returned = _find_returned_from_reject(state_change_events)

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
