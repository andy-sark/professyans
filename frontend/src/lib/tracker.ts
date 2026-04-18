/**
 * Process tracker.
 *
 * Central mechanism of the activating methodology (spec §2.3, §9):
 * "процесс важнее результата". Every state change, pause, return, and
 * re-decision is recorded and surfaced to the user.
 *
 * The tracker is an accumulator, not a side-effectful service — it takes
 * a ProcessTrace and returns a new one. This makes it trivial to use from
 * inside a Zustand store (via produce-style updates) and easy to test.
 */

import type { ProcessTrace, TraceEvent, ProcessInsights } from '../types/session';
import type { CardState } from '../types/card';

const DECISION_QUICK_MS = 2000;
const DECISION_LONG_MS = 15000;

/* ============================================================
   Event recorders — pure functions, return a new trace
   ============================================================ */

export function recordCardShown(trace: ProcessTrace, cardCode: string): ProcessTrace {
  if (trace.cardFirstShown[cardCode]) return trace; // already shown
  return {
    ...trace,
    cardFirstShown: { ...trace.cardFirstShown, [cardCode]: Date.now() },
  };
}

export function recordStateChange(
  trace: ProcessTrace,
  cardCode: string,
  from: CardState,
  to: CardState
): ProcessTrace {
  const event: TraceEvent = {
    ts: Date.now(),
    kind: to === 'flipped' ? 'card_flip' : 'card_state_change',
    payload: { cardCode, from, to },
  };
  return {
    ...trace,
    events: [...trace.events, event],
    cardChangeCount: {
      ...trace.cardChangeCount,
      [cardCode]: (trace.cardChangeCount[cardCode] ?? 0) + 1,
    },
  };
}

export function recordStageTransition(
  trace: ProcessTrace,
  from: string,
  to: string
): ProcessTrace {
  return {
    ...trace,
    events: [
      ...trace.events,
      { ts: Date.now(), kind: 'stage_exit', payload: { stage: from } },
      { ts: Date.now(), kind: 'stage_enter', payload: { stage: to } },
    ],
  };
}

export function recordProvocationShown(
  trace: ProcessTrace,
  provocationId: string,
  context: Record<string, unknown> = {}
): ProcessTrace {
  return {
    ...trace,
    events: [
      ...trace.events,
      { ts: Date.now(), kind: 'provocation_shown', payload: { provocationId, ...context } },
    ],
  };
}

/* ============================================================
   Insights — derived metrics for the results screen (spec §9.4)
   ============================================================ */

export function computeInsights(trace: ProcessTrace): ProcessInsights {
  const stateChangeEvents = trace.events.filter(
    (e) => e.kind === 'card_state_change' || e.kind === 'card_flip'
  );

  // Cards with ≥2 changes — "wavering" ones
  const mostChangedCards = Object.entries(trace.cardChangeCount)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([code]) => code);

  // Cards that were reject-ed and later changed away from reject
  const returnedFromReject = findReturnedFromReject(stateChangeEvents);

  // Per-card last-decision time (time between first shown and last change)
  const decisionTimes = computeDecisionTimes(trace);
  const quickDecisionCards = Object.entries(decisionTimes)
    .filter(([, ms]) => ms > 0 && ms < DECISION_QUICK_MS)
    .map(([code]) => code);
  const longDecisionCards = Object.entries(decisionTimes)
    .filter(([, ms]) => ms > DECISION_LONG_MS)
    .map(([code]) => code);

  const totalStateChanges = stateChangeEvents.length;
  const avg =
    Object.values(decisionTimes).length > 0
      ? Object.values(decisionTimes).reduce((a, b) => a + b, 0) /
        Object.values(decisionTimes).length
      : 0;

  return {
    mostChangedCards,
    returnedFromReject,
    quickDecisionCards,
    longDecisionCards,
    totalStateChanges,
    averageDecisionTimeMs: Math.round(avg),
  };
}

function findReturnedFromReject(events: TraceEvent[]): string[] {
  const hadReject = new Set<string>();
  const returned = new Set<string>();
  for (const e of events) {
    const p = e.payload as { cardCode?: string; from?: CardState; to?: CardState };
    if (!p.cardCode) continue;
    if (p.to === 'reject') hadReject.add(p.cardCode);
    if (p.from === 'reject' && p.to !== 'reject' && hadReject.has(p.cardCode)) {
      returned.add(p.cardCode);
    }
  }
  return [...returned];
}

function computeDecisionTimes(trace: ProcessTrace): Record<string, number> {
  const lastChange: Record<string, number> = {};
  for (const e of trace.events) {
    const p = e.payload as { cardCode?: string };
    if (!p.cardCode) continue;
    if (e.kind === 'card_state_change' || e.kind === 'card_flip') {
      lastChange[p.cardCode] = e.ts;
    }
  }
  const out: Record<string, number> = {};
  for (const [code, lastTs] of Object.entries(lastChange)) {
    const firstShown = trace.cardFirstShown[code];
    if (firstShown) out[code] = lastTs - firstShown;
  }
  return out;
}
