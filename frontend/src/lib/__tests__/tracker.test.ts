import {
  computeInsights,
  recordCardShown,
  recordProvocationShown,
  recordStageTransition,
  recordStateChange,
} from '../tracker';
import { emptyTrace } from '../../types/session';
import type { ProcessTrace, TraceEvent } from '../../types/session';

describe('computeInsights', () => {
  it('empty trace gives zero insights', () => {
    const ins = computeInsights(emptyTrace());
    expect(ins.totalStateChanges).toBe(0);
    expect(ins.mostChangedCards).toEqual([]);
    expect(ins.averageDecisionTimeMs).toBe(0);
    expect(ins.returnedFromReject).toEqual([]);
    expect(ins.quickDecisionCards).toEqual([]);
    expect(ins.longDecisionCards).toEqual([]);
  });

  it('mostChangedCards sorted desc, filtered by >=2 changes', () => {
    const trace: ProcessTrace = {
      ...emptyTrace(),
      cardChangeCount: { 'Ц-1': 5, 'П-1': 3, 'С-1': 1, 'У-1': 2 },
    };
    const ins = computeInsights(trace);
    expect(ins.mostChangedCards).toEqual(['Ц-1', 'П-1', 'У-1']);
  });

  it('returnedFromReject detected', () => {
    const events: TraceEvent[] = [
      {
        ts: 1000,
        kind: 'card_state_change',
        payload: { cardCode: 'Ц-1', from: 'unset', to: 'reject' },
      },
      {
        ts: 2000,
        kind: 'card_state_change',
        payload: { cardCode: 'Ц-1', from: 'reject', to: 'like' },
      },
    ];
    const trace: ProcessTrace = {
      events,
      cardFirstShown: {},
      cardChangeCount: { 'Ц-1': 2 },
    };
    const ins = computeInsights(trace);
    expect(ins.returnedFromReject).toContain('Ц-1');
  });

  it('decision time classification', () => {
    const events: TraceEvent[] = [
      {
        ts: 500,
        kind: 'card_state_change',
        payload: { cardCode: 'A-1', from: 'unset', to: 'like' },
      },
      {
        ts: 20000,
        kind: 'card_state_change',
        payload: { cardCode: 'B-1', from: 'unset', to: 'like' },
      },
    ];
    const trace: ProcessTrace = {
      events,
      cardFirstShown: { 'A-1': 0, 'B-1': 0 },
      cardChangeCount: { 'A-1': 1, 'B-1': 1 },
    };
    const ins = computeInsights(trace);
    expect(ins.quickDecisionCards).toContain('A-1');
    expect(ins.longDecisionCards).toContain('B-1');
  });

  it('decision time uses zero firstShown correctly (parity with Python is-not-None)', () => {
    const trace: ProcessTrace = {
      events: [
        {
          ts: 1500,
          kind: 'card_state_change',
          payload: { cardCode: 'Ц-1', from: 'unset', to: 'like' },
        },
      ],
      cardFirstShown: { 'Ц-1': 0 },
      cardChangeCount: { 'Ц-1': 1 },
    };
    const insights = computeInsights(trace);
    expect(insights.quickDecisionCards).toContain('Ц-1');
  });

  it('totalStateChanges counts only state_change and flip events', () => {
    const events: TraceEvent[] = [
      { ts: 1, kind: 'provocation_shown', payload: { provocationId: 'x' } },
      { ts: 2, kind: 'stage_enter', payload: { stage: 'f7.intro' } },
      { ts: 3, kind: 'note_added', payload: { text: 'n' } },
      {
        ts: 4,
        kind: 'card_state_change',
        payload: { cardCode: 'Ц-1', from: 'unset', to: 'like' },
      },
      {
        ts: 5,
        kind: 'card_state_change',
        payload: { cardCode: 'П-1', from: 'unset', to: 'neutral' },
      },
    ];
    const trace: ProcessTrace = {
      events,
      cardFirstShown: {},
      cardChangeCount: {},
    };
    const ins = computeInsights(trace);
    expect(ins.totalStateChanges).toBe(2);
  });

  it('mostChangedCards capped at 10', () => {
    const cardChangeCount: Record<string, number> = {};
    for (let i = 0; i < 15; i += 1) {
      cardChangeCount[`K-${i}`] = 20 - i;
    }
    const trace: ProcessTrace = {
      ...emptyTrace(),
      cardChangeCount,
    };
    const ins = computeInsights(trace);
    expect(ins.mostChangedCards).toHaveLength(10);
    expect(ins.mostChangedCards[0]).toBe('K-0');
    expect(ins.mostChangedCards[9]).toBe('K-9');
  });

  it('averageDecisionTimeMs is integer (Math.round)', () => {
    const events: TraceEvent[] = [
      {
        ts: 100,
        kind: 'card_state_change',
        payload: { cardCode: 'X', from: 'unset', to: 'like' },
      },
      {
        ts: 200,
        kind: 'card_state_change',
        payload: { cardCode: 'Y', from: 'unset', to: 'like' },
      },
      {
        ts: 301,
        kind: 'card_state_change',
        payload: { cardCode: 'Z', from: 'unset', to: 'like' },
      },
    ];
    const trace: ProcessTrace = {
      events,
      cardFirstShown: { X: 0, Y: 0, Z: 0 },
      cardChangeCount: {},
    };
    const ins = computeInsights(trace);
    expect(Number.isInteger(ins.averageDecisionTimeMs)).toBe(true);
    expect(ins.averageDecisionTimeMs).toBe(200);
  });
});

describe('recordCardShown', () => {
  it('records first shown timestamp', () => {
    const t0 = emptyTrace();
    const t1 = recordCardShown(t0, 'Ц-1');
    expect(t1.cardFirstShown['Ц-1']).toBeDefined();
    expect(Date.now() - (t1.cardFirstShown['Ц-1'] as number)).toBeLessThan(100);
  });

  it('idempotent on second call', () => {
    const t0 = emptyTrace();
    const t1 = recordCardShown(t0, 'Ц-1');
    const t2 = recordCardShown(t1, 'Ц-1');
    expect(t2).toBe(t1);
  });

  it('does not mutate input trace', () => {
    const frozen = Object.freeze(emptyTrace());
    expect(() => recordCardShown(frozen, 'Ц-1')).not.toThrow();
    const out = recordCardShown(frozen, 'Ц-1');
    expect(out).not.toBe(frozen);
  });
});

describe('recordStateChange', () => {
  it('adds event and increments change count', () => {
    const t0 = emptyTrace();
    const t1 = recordStateChange(t0, 'Ц-1', 'unset', 'like');
    expect(t1.events).toHaveLength(1);
    expect(t1.events[0].kind).toBe('card_state_change');
    expect(t1.events[0].payload).toMatchObject({ cardCode: 'Ц-1', from: 'unset', to: 'like' });
    expect(t1.cardChangeCount['Ц-1']).toBe(1);
  });

  it('to:flipped produces card_flip kind', () => {
    const t1 = recordStateChange(emptyTrace(), 'Ц-1', 'like', 'flipped');
    expect(t1.events[0].kind).toBe('card_flip');
    expect(t1.events[0].payload).toMatchObject({ cardCode: 'Ц-1', from: 'like', to: 'flipped' });
  });

  it('multiple calls accumulate', () => {
    let t = emptyTrace();
    t = recordStateChange(t, 'Ц-1', 'unset', 'like');
    t = recordStateChange(t, 'П-1', 'unset', 'reject');
    t = recordStateChange(t, 'С-1', 'unset', 'neutral');
    expect(t.events).toHaveLength(3);
    expect(t.cardChangeCount['Ц-1']).toBe(1);
    expect(t.cardChangeCount['П-1']).toBe(1);
    expect(t.cardChangeCount['С-1']).toBe(1);
  });
});

describe('recordStageTransition', () => {
  it('adds two events: stage_exit then stage_enter', () => {
    const t1 = recordStageTransition(emptyTrace(), 'f7.intro', 'f7.ranking:СЧЖ');
    expect(t1.events).toHaveLength(2);
    expect(t1.events[0].kind).toBe('stage_exit');
    expect(t1.events[0].payload).toEqual({ stage: 'f7.intro' });
    expect(t1.events[1].kind).toBe('stage_enter');
    expect(t1.events[1].payload).toEqual({ stage: 'f7.ranking:СЧЖ' });
  });
});

describe('recordProvocationShown', () => {
  it('adds event with id', () => {
    const t1 = recordProvocationShown(emptyTrace(), 'p-1');
    expect(t1.events).toHaveLength(1);
    expect(t1.events[0].kind).toBe('provocation_shown');
    expect(t1.events[0].payload.provocationId).toBe('p-1');
  });

  it('merges context into payload', () => {
    const t1 = recordProvocationShown(emptyTrace(), 'p-1', { group: 'Ц', cardCode: 'Ц-6' });
    expect(t1.events[0].payload).toEqual({
      provocationId: 'p-1',
      group: 'Ц',
      cardCode: 'Ц-6',
    });
  });
});
