"""Tests for Formula-5 logic in professyans_core."""

from __future__ import annotations

import pytest

from professyans_core import validate_formula as f7_validate_formula
from professyans_core.methods.formula5 import (
    F5,
    derive_result,
    match_hints as f5_match_hints,
    validate_formula as f5_validate_formula,
)
from professyans_core.models import Session


# ─── Data integrity ──────────────────────────────────────────────

def test_f5_data_loads() -> None:
    assert len(F5.cards) == 45
    assert F5.formula_size == 8
    assert F5.bonus_size == 2
    assert set(F5.main_groups) == {"Ц", "П", "С", "У", "О"}
    assert F5.ranking_order == ("Ц", "П", "С", "У", "О")


def test_f5_groups_have_9_cards() -> None:
    for g in F5.main_groups:
        assert len(F5.cards_of_group(g)) == 9, f"Group {g} must have 9 cards"


def test_f5_no_auxiliary_blocks_in_ranking() -> None:
    order = "".join(F5.ranking_order)
    assert "СЧЖ" not in order
    assert "ВК" not in order


def test_f5_all_cards_use_f5_method() -> None:
    for c in F5.cards:
        assert c["method"] == "F5"
        assert c["group"] in F5.main_groups


# ─── Control diffs vs F-7 data (§6.2 / comparison doc) ───────────

def test_f5_c2_is_research() -> None:
    c = F5.data.cards_by_code["Ц-2"]
    assert "Исследовать" in c["title"]


def test_f5_o3_is_drinking() -> None:
    c = F5.data.cards_by_code["О-3"]
    blob = c["title"] + (c.get("description") or "")
    assert "выпивать" in blob


def test_f5_o8_is_sedentary() -> None:
    c = F5.data.cards_by_code["О-8"]
    blob = c["title"] + (c.get("description") or "")
    assert "сидяч" in blob.lower()


def test_f5_u7_is_workplace_type() -> None:
    c = F5.data.cards_by_code["У-7"]
    desc = (c.get("description") or "").lower()
    assert "цех" in desc or "лаборатория" in desc


# ─── validate_formula (F5) ───────────────────────────────────────

def _likes(formula: list[str]) -> dict[str, str]:
    return {code: "like" for code in formula}


def test_f5_valid_formula_eight() -> None:
    formula = ["Ц-1", "П-1", "С-1", "У-1", "О-1", "Ц-2", "П-2", "С-2"]
    v = f5_validate_formula(formula, _likes(formula))
    assert v.ok, v.issues


def test_f5_valid_formula_nine_with_bonus() -> None:
    formula = [
        "Ц-1", "П-1", "С-1", "У-1", "О-1",
        "Ц-2", "П-2", "С-2", "У-2",
    ]
    v = f5_validate_formula(formula, _likes(formula))
    assert v.ok, v.issues


def test_f5_valid_formula_ten_with_bonus() -> None:
    formula = [
        "Ц-1", "П-1", "С-1", "У-1", "О-1",
        "Ц-2", "П-2", "С-2", "У-2", "О-2",
    ]
    v = f5_validate_formula(formula, _likes(formula))
    assert v.ok, v.issues


def test_f5_formula_eleven_rejected() -> None:
    formula = [
        "Ц-1", "Ц-2", "Ц-3", "Ц-4", "Ц-5",
        "Ц-6", "Ц-7", "Ц-8", "Ц-9", "П-1", "П-2",
    ]
    v = f5_validate_formula(formula, _likes(formula))
    assert not v.ok
    assert any("нужно от 8 до 10" in i for i in v.issues)


def test_f5_formula_seven_too_small() -> None:
    formula = ["Ц-1", "П-1", "С-1", "У-1", "О-1", "Ц-2", "П-2"]
    v = f5_validate_formula(formula, _likes(formula))
    assert not v.ok
    assert any("нужно от 8 до 10" in i for i in v.issues)


def test_bonus_does_not_skip_group_coverage() -> None:
    formula = [f"Ц-{i}" for i in range(1, 10)]
    v = f5_validate_formula(formula, _likes(formula))
    assert not v.ok
    assert v.missing_groups


# ─── match_hints (F5) ───────────────────────────────────────────

def test_f5_match_hints_h1() -> None:
    out = f5_match_hints({"Ц-6", "П-2", "С-4"})
    assert out and out[0].hint_id == "h1"
    assert out[0].coverage == 1.0


def test_f5_match_hints_h2() -> None:
    out = f5_match_hints({"Ц-5", "П-8"})
    assert any(m.hint_id == "h2" for m in out)


def test_f5_match_hints_h3() -> None:
    out = f5_match_hints({"Ц-8", "П-6"})
    assert any(m.hint_id == "h3" for m in out)


def test_f5_match_hints_h4() -> None:
    out = f5_match_hints({"Ц-3", "П-1"})
    assert any(m.hint_id == "h4" for m in out)


def test_f5_match_hints_h5() -> None:
    out = f5_match_hints({"Ц-4", "П-1"})
    assert any(m.hint_id == "h5" for m in out)


# ─── F-7 regression: bonus_size default ──────────────────────────

def test_f7_bonus_zero_behaves_as_before() -> None:
    formula = ["Ц-1", "П-1", "С-1", "У-1", "О-1", "К-1", "Ц-2"]
    v = f7_validate_formula(formula, _likes(formula))
    assert v.ok
    v2 = f7_validate_formula(formula[:3], _likes(formula[:3]))
    assert not v2.ok
    assert any("3 из 7" in i for i in v2.issues)
    assert not any("нужно от" in i for i in v2.issues)


# ─── derive_result ────────────────────────────────────────────────

def test_derive_result_f5_from_session() -> None:
    formula = ["Ц-6", "П-2", "С-4", "У-1", "О-1", "Ц-3", "П-3", "С-3"]
    card_states: dict[str, str] = {c: "like" for c in formula}
    card_states["П-4"] = "flipped"
    card_states["О-2"] = "reject"
    session = Session(
        id="f5-test-1",
        method="F5",
        track="activating",
        started_at=0,
        updated_at=0,
        current_stage="f5.results",
        card_states=card_states,
        formula=formula,
        clusters={c: 0 for c in formula},
    )
    r = derive_result(session)
    assert r.validation.ok, r.validation.issues
    assert r.flipped_cards == ["П-4"]
    assert r.rejected_cards == ["О-2"]
    assert any(h.hint_id == "h1" for h in r.hints)


@pytest.mark.parametrize("group", ["Ц", "П", "С", "У", "О"])
def test_every_f5_main_group_has_9_cards(group: str) -> None:
    assert len(F5.cards_of_group(group)) == 9
