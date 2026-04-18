"""Tests for Formula-7 logic in professyans_core."""

from __future__ import annotations

import pytest

from professyans_core import (
    ProcessTrace,
    TraceEvent,
    compute_insights,
    detect_schzh_conflicts,
    match_hints,
    validate_formula,
)
from professyans_core.methods.formula7 import F7, derive_result
from professyans_core.models import Session


# ─── Data integrity ──────────────────────────────────────────────

def test_f7_data_loads() -> None:
    assert len(F7.cards) == 75, "F7 must have exactly 75 cards"
    assert F7.formula_size == 7
    assert set(F7.main_groups) == {"Ц", "П", "С", "У", "О", "К"}
    assert F7.ranking_order[0] == "СЧЖ"
    assert F7.ranking_order[-1] == "ВК"


def test_all_main_groups_have_9_cards() -> None:
    for g in F7.main_groups:
        assert len(F7.cards_of_group(g)) == 9, f"Group {g} must have 9 cards"


def test_auxiliary_groups_sizes() -> None:
    assert len(F7.cards_of_group("СЧЖ")) == 12
    assert len(F7.cards_of_group("ВК")) == 9


# ─── validate_formula ────────────────────────────────────────────

def test_valid_formula_passes() -> None:
    # Pick one from each of the 6 main groups + one extra
    formula = ["Ц-1", "П-1", "С-1", "У-1", "О-1", "К-1", "Ц-2"]
    card_states = {code: "like" for code in formula}
    # Need at least one "like" in each main group too (same as formula is fine)
    v = validate_formula(formula, card_states)
    assert v.ok, f"Expected valid, got issues: {v.issues}"


def test_formula_too_small_fails() -> None:
    formula = ["Ц-1", "П-1", "С-1"]
    v = validate_formula(formula, {c: "like" for c in formula})
    assert not v.ok
    assert any("3 из 7" in i for i in v.issues)


def test_formula_missing_group_fails() -> None:
    # 7 cards, but all from groups Ц and П only — missing С, У, О, К
    formula = ["Ц-1", "Ц-2", "Ц-3", "Ц-4", "П-1", "П-2", "П-3"]
    states = {code: "like" for code in formula}
    v = validate_formula(formula, states)
    assert not v.ok
    assert "С" in v.missing_groups
    assert "У" in v.missing_groups
    assert "О" in v.missing_groups
    assert "К" in v.missing_groups


def test_formula_empty_like_group_flagged() -> None:
    formula = ["Ц-1", "П-1", "С-1", "У-1", "О-1", "К-1", "Ц-2"]
    states = dict.fromkeys(formula, "like")
    # User likes nothing in "П" (but has П-1 in formula — contradiction to resolve in UI)
    # Artificial scenario: formula contains П-1 but П-1 not in card_states as "like"
    states["П-1"] = "neutral"
    v = validate_formula(formula, states)
    assert "П" in v.empty_like_groups


# ─── match_hints ────────────────────────────────────────────────

def test_match_hints_exact_match_scored_highest() -> None:
    # Hint h4: ["Ц-6", "П-2", "С-4"] → IT / разработка
    selected = {"Ц-6", "П-2", "С-4"}
    out = match_hints(selected)
    assert out, "Expected at least one match"
    # The full-match hint should be first
    assert out[0].hint_id == "h4"
    assert out[0].coverage == 1.0
    assert out[0].score == 3


def test_match_hints_partial_below_threshold_dropped() -> None:
    # Only 1 of 3 keys → score=1, coverage=0.33 → dropped
    selected = {"Ц-6"}  # belongs to h2, h3, h4, h5, h14 (all needing more)
    out = match_hints(selected)
    # h1 needs Ц-6 + П-6; we only have Ц-6 — score=1, coverage=0.5 — dropped
    for m in out:
        assert not (m.score == 1), "single-key matches should be dropped"


def test_match_hints_2_of_3_kept() -> None:
    # h4 = ["Ц-6", "П-2", "С-4"]. Take 2 of 3 → coverage 0.667 — keeps.
    selected = {"Ц-6", "П-2"}
    out = match_hints(selected)
    ids = [m.hint_id for m in out]
    # h1 also hits (Ц-6 + П-6) — let's not include П-6
    assert "h4" in ids


def test_match_hints_returns_at_most_6() -> None:
    # Select many — stress test the cap
    selected = {"Ц-6", "П-6", "П-5", "П-4", "П-2", "С-4", "С-7", "Ц-4", "Ц-5"}
    out = match_hints(selected)
    assert len(out) <= 6


# ─── SCHZH conflicts ────────────────────────────────────────────

def test_schzh_conflict_wealth_vs_honest_quiet() -> None:
    selected = {"СЧЖ-4", "О-1", "О-7"}
    out = detect_schzh_conflicts(selected)
    assert len(out) >= 1
    assert any("Богатство" in c.description for c in out)


def test_schzh_conflict_not_triggered_when_partial() -> None:
    # Only 2 of 3 required cards — shouldn't trigger
    selected = {"СЧЖ-4", "О-1"}  # missing О-7
    out = detect_schzh_conflicts(selected)
    assert not any("Богатство" in c.description for c in out)


# ─── compute_insights ──────────────────────────────────────────

def test_empty_trace_gives_zero_insights() -> None:
    trace = ProcessTrace()
    ins = compute_insights(trace)
    assert ins.total_state_changes == 0
    assert ins.most_changed_cards == []
    assert ins.average_decision_time_ms == 0


def test_most_changed_cards_sorted_desc() -> None:
    trace = ProcessTrace(
        card_change_count={"Ц-1": 5, "П-1": 3, "С-1": 1, "У-1": 2},
    )
    ins = compute_insights(trace)
    # Only cards with >=2 changes appear; sorted desc by count
    assert ins.most_changed_cards == ["Ц-1", "П-1", "У-1"]


def test_returned_from_reject_detected() -> None:
    events = [
        TraceEvent(ts=1000, kind="card_state_change",
                   payload={"cardCode": "Ц-1", "from": "unset", "to": "reject"}),
        TraceEvent(ts=2000, kind="card_state_change",
                   payload={"cardCode": "Ц-1", "from": "reject", "to": "like"}),
    ]
    trace = ProcessTrace(events=events, card_change_count={"Ц-1": 2})
    ins = compute_insights(trace)
    assert "Ц-1" in ins.returned_from_reject


def test_decision_time_classification() -> None:
    events = [
        # Quick: 500ms
        TraceEvent(ts=500, kind="card_state_change",
                   payload={"cardCode": "A-1", "from": "unset", "to": "like"}),
        # Long: 20000ms (>15s)
        TraceEvent(ts=20000, kind="card_state_change",
                   payload={"cardCode": "B-1", "from": "unset", "to": "like"}),
    ]
    trace = ProcessTrace(
        events=events,
        card_first_shown={"A-1": 0, "B-1": 0},
        card_change_count={"A-1": 1, "B-1": 1},
    )
    ins = compute_insights(trace)
    assert "A-1" in ins.quick_decision_cards
    assert "B-1" in ins.long_decision_cards


# ─── Full result derivation ────────────────────────────────────

def test_derive_result_from_session() -> None:
    session = Session(
        id="test-1",
        method="F7",
        track="activating",
        started_at=0,
        updated_at=0,
        current_stage="f7.results",
        card_states={
            "Ц-6": "like", "П-2": "like", "С-4": "like",
            "У-1": "like", "О-1": "like", "К-1": "like", "Ц-2": "like",
            "СЧЖ-4": "reject", "П-4": "flipped",
        },
        formula=["Ц-6", "П-2", "С-4", "У-1", "О-1", "К-1", "Ц-2"],
        clusters={"Ц-6": 0, "П-2": 0, "С-4": 0, "У-1": 1, "О-1": 1, "К-1": 1, "Ц-2": 1},
    )
    r = derive_result(session)
    assert r.validation.ok, f"Unexpected issues: {r.validation.issues}"
    assert r.flipped_cards == ["П-4"]
    assert r.rejected_cards == ["СЧЖ-4"]
    # Ц-6 + П-2 + С-4 → IT hint (h4)
    assert any(h.hint_id == "h4" for h in r.hints)


@pytest.mark.parametrize("group", ["Ц", "П", "С", "У", "О", "К"])
def test_every_main_group_has_9_cards(group: str) -> None:
    """Regression: ensure no main group drifts away from 9 cards."""
    assert len(F7.cards_of_group(group)) == 9
