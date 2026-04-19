import { matchHints } from '../hints';

describe('matchHints (mirrors test_formula5.py)', () => {
  it('h1: full IT triple ranks first with score 3 and coverage 1', () => {
    const selected = new Set(['Ц-6', 'П-2', 'С-4']);
    const out = matchHints(selected);
    expect(out.length).toBeGreaterThan(0);
    expect(out[0].hint.id).toBe('h1');
    expect(out[0].coverage).toBe(1);
    expect(out[0].score).toBe(3);
  });

  it('h2: педагогика с детьми', () => {
    const out = matchHints(new Set(['Ц-5', 'П-8']));
    expect(out.some((m) => m.hint.id === 'h2')).toBe(true);
  });

  it('h3: забота о природе', () => {
    const out = matchHints(new Set(['Ц-8', 'П-6']));
    expect(out.some((m) => m.hint.id === 'h3')).toBe(true);
  });

  it('h4: транспорт', () => {
    const out = matchHints(new Set(['Ц-3', 'П-1']));
    expect(out.some((m) => m.hint.id === 'h4')).toBe(true);
  });

  it('h5: инженерия', () => {
    const out = matchHints(new Set(['Ц-4', 'П-1']));
    expect(out.some((m) => m.hint.id === 'h5')).toBe(true);
  });

  it('returns at most 6 hints for a wide selection (contract cap)', () => {
    const selected = new Set([
      'Ц-1',
      'Ц-2',
      'Ц-3',
      'Ц-4',
      'Ц-5',
      'Ц-6',
      'П-1',
      'П-2',
      'П-6',
      'П-8',
      'С-4',
      'У-1',
      'О-1',
    ]);
    const out = matchHints(selected);
    expect(out.length).toBeLessThanOrEqual(6);
  });

  it('drops single-key partial on3-key h1 (score 1)', () => {
    const selected = new Set(['Ц-6']);
    const out = matchHints(selected);
    expect(out.some((m) => m.hint.id === 'h1')).toBe(false);
  });
});
