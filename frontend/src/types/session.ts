/**
 * Session model — the unit of user work with a methodology.
 *
 * Derived from professyans_spec_v2.md §12.2 and perekrestok_spec_v2.md §11.4.
 */

import type { Method, CardState } from './card';

export type Track = 'activating' | 'closed';
export type Gender = 'male' | 'female';

/** One fine-grained event in the process trace — per spec §9.2 */
export interface TraceEvent {
  ts: number;
  kind:
    | 'card_state_change'
    | 'card_flip'
    | 'formula_add'
    | 'formula_remove'
    | 'cluster_assign'
    | 'stage_enter'
    | 'stage_exit'
    | 'provocation_shown'
    | 'note_added';
  /** Payload is event-kind-specific; kept loose by design */
  payload: Record<string, unknown>;
}

/** Aggregated insights computed from trace — per spec §9.4 */
export interface ProcessInsights {
  mostChangedCards: string[];
  returnedFromReject: string[];
  quickDecisionCards: string[];
  longDecisionCards: string[];
  totalStateChanges: number;
  averageDecisionTimeMs: number;
}

export interface ProcessTrace {
  events: TraceEvent[];
  /** Per-card first-shown timestamp for computing decision time */
  cardFirstShown: Record<string, number>;
  /** Per-card change count — number of times the state has changed */
  cardChangeCount: Record<string, number>;
}

/**
 * The Session object.
 *
 * Persisted as the current-session blob in localStorage,
 * and archived to IndexedDB on completion.
 */
export interface Session {
  id: string;
  method: Method;
  track: Track;
  gender?: Gender;

  startedAt: number;
  updatedAt: number;
  completedAt?: number;

  /** Current stage in the flow — e.g. "f7.ranking:Ц", "f7.formula", "f7.molecule" */
  currentStage: string;

  // Formula-7 / Formula-5 state
  cardStates?: Record<string, CardState>;
  /** Cards chosen as the final formula (7 for F7, 8 for F5) */
  formula?: string[];
  /** Cluster index (0..2) per formula card — the "molecule" */
  clusters?: Record<string, number>;

  // Process tracking
  trace: ProcessTrace;

  /** User-written notes across the session */
  notes?: string[];
}

/** Helper to create a fresh trace */
export function emptyTrace(): ProcessTrace {
  return {
    events: [],
    cardFirstShown: {},
    cardChangeCount: {},
  };
}

/** Helper to create a fresh session */
export function createSession(params: {
  id: string;
  method: Method;
  track: Track;
  gender?: Gender;
}): Session {
  const now = Date.now();
  return {
    id: params.id,
    method: params.method,
    track: params.track,
    gender: params.gender,
    startedAt: now,
    updatedAt: now,
    currentStage:
      params.method === 'F7' ? 'f7.intro' :
      params.method === 'F5' ? 'f5.intro' :
      params.method === 'KCHG' ? 'kchg.intro' :
      'perekrestok.intro',
    cardStates: {},
    formula: [],
    clusters: {},
    trace: emptyTrace(),
    notes: [],
  };
}
