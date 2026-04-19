import { matchHints, detectSchzhConflicts } from '../hints';

describe('matchHints (mirrors test_formula7.py)', () => {
  it('ranks full 3-key match h4 first with score 3 and coverage 1', () => {
    const selected = new Set(['Ц-6', 'П-2', 'С-4']);
    const out = matchHints(selected);
    expect(out.length).toBeGreaterThan(0);
    expect(out[0].hint.id).toBe('h4');
    expect(out[0].coverage).toBe(1);
    expect(out[0].score).toBe(3);
  });

  it('drops single-key matches (score === 1)', () => {
    const selected = new Set(['Ц-6']);
    const out = matchHints(selected);
    for (const m of out) {
      expect(m.score).not.toBe(1);
    }
  });

  it('keeps 2-of-3 partial for h4', () => {
    const selected = new Set(['Ц-6', 'П-2']);
    const out = matchHints(selected);
    expect(out.some((m) => m.hint.id === 'h4')).toBe(true);
  });

  it('returns at most 6 hints for a wide selection', () => {
    const selected = new Set(['Ц-6', 'П-6', 'П-5', 'П-4', 'П-2', 'С-4', 'С-7', 'Ц-4', 'Ц-5']);
    const out = matchHints(selected);
    expect(out.length).toBeLessThanOrEqual(6);
  });

  it('sorts higher score before lower', () => {
    const selected = new Set(['Ц-6', 'П-2', 'С-4', 'П-5']);
    const out = matchHints(selected);
    expect(out[0].hint.id).toBe('h4');
    expect(out[0].score).toBe(3);
    const idxH2 = out.findIndex((m) => m.hint.id === 'h2' && m.score === 2);
    expect(idxH2).toBeGreaterThan(0);
  });

  it('when scores tie, sorts higher coverage first', () => {
    const selected = new Set(['Ц-6', 'П-5', 'П-2']);
    const out = matchHints(selected);
    const i2 = out.findIndex((m) => m.hint.id === 'h2');
    const i4 = out.findIndex((m) => m.hint.id === 'h4');
    expect(i2).toBeLessThan(i4);
    expect(out[i2].score).toBe(2);
    expect(out[i4].score).toBe(2);
    expect(out[i2].coverage).toBeGreaterThan(out[i4].coverage);
  });
});

describe(
  'detectSchzhConflicts — F-7-specific, intentionally not in common/',
  () => {
    it('triggers wealth vs honest/quiet conflict for full triple', () => {
      const selected = new Set(['СЧЖ-4', 'О-1', 'О-7']);
      const out = detectSchzhConflicts(selected);
      expect(out.length).toBeGreaterThanOrEqual(1);
      expect(out.some((c) => c.conflict.description.includes('Богатство'))).toBe(true);
    });

    it('does not trigger when only two of three cards present', () => {
      const selected = new Set(['СЧЖ-4', 'О-1']);
      const out = detectSchzhConflicts(selected);
      expect(out.some((c) => c.conflict.description.includes('Богатство'))).toBe(false);
    });
  }
);
