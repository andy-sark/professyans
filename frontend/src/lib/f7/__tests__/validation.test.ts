import {
  F7_CARDS,
  F7_FORMULA_SIZE,
  F7_MAIN_GROUPS,
  F7_RANKING_ORDER,
  cardsOfGroup,
} from '../../../data/formula7/cards';
import { validateFormula } from '../validation';

describe('F7 data integrity (mirrors test_formula7.py)', () => {
  it('loads 75 cards', () => {
    expect(F7_CARDS).toHaveLength(75);
  });

  it('has formula size 7', () => {
    expect(F7_FORMULA_SIZE).toBe(7);
  });

  it('has six main groups Ц П С У О К', () => {
    expect(new Set(F7_MAIN_GROUPS as readonly string[])).toEqual(
      new Set(['Ц', 'П', 'С', 'У', 'О', 'К'])
    );
  });

  it('ranking order starts with СЧЖ and ends with ВК', () => {
    expect(F7_RANKING_ORDER[0]).toBe('СЧЖ');
    expect(F7_RANKING_ORDER[F7_RANKING_ORDER.length - 1]).toBe('ВК');
  });

  it('has exactly 9 cards in each main group', () => {
    for (const g of F7_MAIN_GROUPS) {
      expect(cardsOfGroup(g)).toHaveLength(9);
    }
  });

  it('has 12 СЧЖ cards and 9 ВК cards', () => {
    expect(cardsOfGroup('СЧЖ')).toHaveLength(12);
    expect(cardsOfGroup('ВК')).toHaveLength(9);
  });
});

describe('validateFormula (mirrors test_formula7.py)', () => {
  it('accepts valid 7-card formula with one duplicate main group', () => {
    const formula = ['Ц-1', 'П-1', 'С-1', 'У-1', 'О-1', 'К-1', 'Ц-2'];
    const cardStates = Object.fromEntries(formula.map((c) => [c, 'like']));
    const v = validateFormula(formula, cardStates);
    expect(v.ok).toBe(true);
  });

  it('rejects 3-card formula with "3 из 7" in issues', () => {
    const formula = ['Ц-1', 'П-1', 'С-1'];
    const v = validateFormula(formula, Object.fromEntries(formula.map((c) => [c, 'like'])));
    expect(v.ok).toBe(false);
    expect(v.issues.some((i) => i.includes('3 из 7'))).toBe(true);
  });

  it('rejects 7 cards from only Ц and П — missing С У О К', () => {
    const formula = ['Ц-1', 'Ц-2', 'Ц-3', 'Ц-4', 'П-1', 'П-2', 'П-3'];
    const states = Object.fromEntries(formula.map((c) => [c, 'like']));
    const v = validateFormula(formula, states);
    expect(v.ok).toBe(false);
    expect(v.missingGroups).toContain('С');
    expect(v.missingGroups).toContain('У');
    expect(v.missingGroups).toContain('О');
    expect(v.missingGroups).toContain('К');
  });

  it('flags empty-like main group when formula card is not liked', () => {
    const formula = ['Ц-1', 'П-1', 'С-1', 'У-1', 'О-1', 'К-1', 'Ц-2'];
    const states = Object.fromEntries(formula.map((c) => [c, 'like' as const])) as Record<string, string>;
    states['П-1'] = 'neutral';
    const v = validateFormula(formula, states);
    expect(v.emptyLikeGroups).toContain('П');
  });
});
