import {
  F5_CARDS,
  F5_CARDS_BY_CODE,
  F5_FORMULA_SIZE,
  F5_BONUS_SIZE,
  F5_MAIN_GROUPS,
  F5_RANKING_ORDER,
  cardsOfGroup,
} from '../../../data/formula5/cards';
import { validateFormula } from '../validation';

describe('F5 data integrity (mirrors test_formula5.py)', () => {
  it('loads 45 cards', () => {
    expect(F5_CARDS).toHaveLength(45);
  });

  it('has formula size 8', () => {
    expect(F5_FORMULA_SIZE).toBe(8);
  });

  it('has bonus size 2', () => {
    expect(F5_BONUS_SIZE).toBe(2);
  });

  it('has five main groups Ц П С У О', () => {
    expect(new Set(F5_MAIN_GROUPS as readonly string[])).toEqual(
      new Set(['Ц', 'П', 'С', 'У', 'О'])
    );
  });

  it('ranking order matches main groups sequence', () => {
    expect(F5_RANKING_ORDER).toEqual(['Ц', 'П', 'С', 'У', 'О']);
  });

  it('has exactly 9 cards in each main group', () => {
    for (const g of F5_MAIN_GROUPS) {
      expect(cardsOfGroup(g)).toHaveLength(9);
    }
  });

  it('every card group is a main group', () => {
    const main = new Set(F5_MAIN_GROUPS);
    for (const c of F5_CARDS) {
      expect(main.has(c.group)).toBe(true);
    }
  });

  it('every card uses F5 method', () => {
    for (const c of F5_CARDS) {
      expect(c.method).toBe('F5');
    }
  });
});

describe('F5 control diffs vs Formula-7 data (comparison doc)', () => {
  it('Ц-2 title signals research wording', () => {
    expect(F5_CARDS_BY_CODE['Ц-2'].title).toContain('Исследовать');
  });

  it('О-3 title+description mention drinking context', () => {
    const c = F5_CARDS_BY_CODE['О-3'];
    const blob = c.title + (c.description ?? '');
    expect(blob).toContain('выпивать');
  });

  it('О-8 title+description mention sedentary work', () => {
    const c = F5_CARDS_BY_CODE['О-8'];
    const blob = (c.title + (c.description ?? '')).toLowerCase();
    expect(blob).toContain('сидяч');
  });

  it('У-7 description mentions workshop or lab setting', () => {
    const c = F5_CARDS_BY_CODE['У-7'];
    const desc = (c.description ?? '').toLowerCase();
    expect(desc.includes('цех') || desc.includes('лаборатория')).toBe(true);
  });
});

describe('validateFormula (mirrors test_formula5.py)', () => {
  it('accepts valid 8-card formula with one duplicate main group', () => {
    const formula = ['Ц-1', 'П-1', 'С-1', 'У-1', 'О-1', 'Ц-2', 'П-2', 'С-2'];
    const cardStates = Object.fromEntries(formula.map((c) => [c, 'like']));
    const v = validateFormula(formula, cardStates);
    expect(v.ok).toBe(true);
  });

  it('accepts 9-card formula within bonus range with full group coverage', () => {
    const formula = [
      'Ц-1',
      'П-1',
      'С-1',
      'У-1',
      'О-1',
      'Ц-2',
      'П-2',
      'С-2',
      'У-2',
    ];
    const v = validateFormula(formula, Object.fromEntries(formula.map((c) => [c, 'like'])));
    expect(v.ok).toBe(true);
  });

  it('accepts 10-card formula within bonus range with full group coverage', () => {
    const formula = [
      'Ц-1',
      'П-1',
      'С-1',
      'У-1',
      'О-1',
      'Ц-2',
      'П-2',
      'С-2',
      'У-2',
      'О-2',
    ];
    const v = validateFormula(formula, Object.fromEntries(formula.map((c) => [c, 'like'])));
    expect(v.ok).toBe(true);
  });

  it('rejects 11-card formula with size band message', () => {
    const formula = [
      'Ц-1',
      'Ц-2',
      'Ц-3',
      'Ц-4',
      'Ц-5',
      'Ц-6',
      'Ц-7',
      'Ц-8',
      'Ц-9',
      'П-1',
      'П-2',
    ];
    const v = validateFormula(formula, Object.fromEntries(formula.map((c) => [c, 'like'])));
    expect(v.ok).toBe(false);
    expect(v.issues.some((i) => i.includes('от 8 до 10'))).toBe(true);
  });

  it('rejects 7-card formula with size band message', () => {
    const formula = ['Ц-1', 'П-1', 'С-1', 'У-1', 'О-1', 'Ц-2', 'П-2'];
    const v = validateFormula(formula, Object.fromEntries(formula.map((c) => [c, 'like'])));
    expect(v.ok).toBe(false);
    expect(v.issues.some((i) => i.includes('от 8 до 10'))).toBe(true);
  });

  it('bonus size does not waive main-group coverage (nine Ц cards)', () => {
    const formula = ['Ц-1', 'Ц-2', 'Ц-3', 'Ц-4', 'Ц-5', 'Ц-6', 'Ц-7', 'Ц-8', 'Ц-9'];
    const v = validateFormula(formula, Object.fromEntries(formula.map((c) => [c, 'like'])));
    expect(v.ok).toBe(false);
    expect(v.missingGroups.length).toBeGreaterThan(0);
  });

  it('flags empty-like main group when formula card is not liked', () => {
    const formula = ['Ц-1', 'П-1', 'С-1', 'У-1', 'О-1', 'Ц-2', 'С-2', 'У-2'];
    const states = Object.fromEntries(formula.map((c) => [c, 'like' as const])) as Record<
      string,
      string
    >;
    states['П-1'] = 'neutral';
    const v = validateFormula(formula, states);
    expect(v.emptyLikeGroups).toContain('П');
  });
});
