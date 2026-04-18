/**
 * Session store.
 *
 * Single source of truth for the active session. Auto-persists to
 * localStorage on every update (spec §3.4: "при закрытии вкладки
 * расклад автоматически сохраняется").
 *
 * On session completion the session is archived to IndexedDB (via
 * storage.archiveSession) and the localStorage slot is cleared.
 */

import { create } from 'zustand';
import type { Session, Track, Gender } from '../types/session';
import type { Method, CardState } from '../types/card';
import { createSession } from '../types/session';
import {
  saveCurrentSession,
  loadCurrentSession,
  clearCurrentSession,
  archiveSession,
} from '../lib/storage';
import {
  recordCardShown,
  recordStateChange,
  recordStageTransition,
  recordProvocationShown,
} from '../lib/tracker';
import { api } from '../lib/api';

/** Debounced backend sync — coalesce rapid updates into one request. */
const SYNC_DEBOUNCE_MS = 1500;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSync(session: Session): void {
  if (!api.isEnabled()) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void api.upsertSession(session);
    syncTimer = null;
  }, SYNC_DEBOUNCE_MS);
}

interface SessionStore {
  session: Session | null;

  // Lifecycle
  startSession: (params: { method: Method; track: Track; gender?: Gender }) => void;
  resumeFromStorage: () => boolean;
  abandonSession: () => void;
  completeSession: () => Promise<void>;

  // Navigation
  setStage: (stage: string) => void;

  // Card state (F7/F5)
  setCardState: (cardCode: string, newState: CardState) => void;
  markCardShown: (cardCode: string) => void;

  // Formula / molecule (F7/F5)
  addToFormula: (cardCode: string) => void;
  removeFromFormula: (cardCode: string) => void;
  assignCluster: (cardCode: string, clusterIdx: number) => void;

  // Misc
  addNote: (text: string) => void;
  markProvocationShown: (id: string, context?: Record<string, unknown>) => void;
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Persist-and-update helper. Returns the updated session. */
function touch(s: Session): Session {
  const updated = { ...s, updatedAt: Date.now() };
  saveCurrentSession(updated);
  scheduleSync(updated);
  return updated;
}

export const useSession = create<SessionStore>((set, get) => ({
  session: null,

  startSession: ({ method, track, gender }) => {
    const s = createSession({ id: uuid(), method, track, gender });
    saveCurrentSession(s);
    void api.upsertSession(s); // immediate, not debounced
    set({ session: s });
  },

  resumeFromStorage: () => {
    const s = loadCurrentSession();
    if (s) {
      set({ session: s });
      return true;
    }
    return false;
  },

  abandonSession: () => {
    clearCurrentSession();
    if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; }
    set({ session: null });
  },

  completeSession: async () => {
    const s = get().session;
    if (!s) return;
    const completed = { ...s, completedAt: Date.now(), updatedAt: Date.now() };
    await archiveSession(completed);
    // Flush pending sync, then do a final upsert of the completed state
    if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; }
    void api.upsertSession(completed);
    clearCurrentSession();
    set({ session: completed });
  },

  setStage: (stage) => {
    const s = get().session;
    if (!s) return;
    const trace = recordStageTransition(s.trace, s.currentStage, stage);
    set({ session: touch({ ...s, currentStage: stage, trace }) });
  },

  setCardState: (cardCode, newState) => {
    const s = get().session;
    if (!s) return;
    const prev: CardState = (s.cardStates?.[cardCode] ?? 'unset') as CardState;
    if (prev === newState) return;
    const trace = recordStateChange(s.trace, cardCode, prev, newState);
    const cardStates = { ...(s.cardStates ?? {}), [cardCode]: newState };
    // If card became not-liked, drop it from the formula too
    let formula = s.formula ?? [];
    let clusters = s.clusters ?? {};
    if (newState !== 'like' && formula.includes(cardCode)) {
      formula = formula.filter((c) => c !== cardCode);
      const { [cardCode]: _dropped, ...restClusters } = clusters;
      void _dropped;
      clusters = restClusters;
    }
    set({ session: touch({ ...s, cardStates, formula, clusters, trace }) });
  },

  markCardShown: (cardCode) => {
    const s = get().session;
    if (!s) return;
    const trace = recordCardShown(s.trace, cardCode);
    if (trace === s.trace) return; // no change (already shown)
    set({ session: touch({ ...s, trace }) });
  },

  addToFormula: (cardCode) => {
    const s = get().session;
    if (!s) return;
    const formula = s.formula ?? [];
    if (formula.includes(cardCode)) return;
    const newFormula = [...formula, cardCode];
    const event = {
      ts: Date.now(),
      kind: 'formula_add' as const,
      payload: { cardCode },
    };
    const trace = { ...s.trace, events: [...s.trace.events, event] };
    set({ session: touch({ ...s, formula: newFormula, trace }) });
  },

  removeFromFormula: (cardCode) => {
    const s = get().session;
    if (!s) return;
    const formula = (s.formula ?? []).filter((c) => c !== cardCode);
    const clusters = { ...(s.clusters ?? {}) };
    delete clusters[cardCode];
    const event = {
      ts: Date.now(),
      kind: 'formula_remove' as const,
      payload: { cardCode },
    };
    const trace = { ...s.trace, events: [...s.trace.events, event] };
    set({ session: touch({ ...s, formula, clusters, trace }) });
  },

  assignCluster: (cardCode, clusterIdx) => {
    const s = get().session;
    if (!s) return;
    const clusters = { ...(s.clusters ?? {}), [cardCode]: clusterIdx };
    const event = {
      ts: Date.now(),
      kind: 'cluster_assign' as const,
      payload: { cardCode, clusterIdx },
    };
    const trace = { ...s.trace, events: [...s.trace.events, event] };
    set({ session: touch({ ...s, clusters, trace }) });
  },

  addNote: (text) => {
    const s = get().session;
    if (!s) return;
    const notes = [...(s.notes ?? []), text];
    const event = {
      ts: Date.now(),
      kind: 'note_added' as const,
      payload: { length: text.length },
    };
    const trace = { ...s.trace, events: [...s.trace.events, event] };
    set({ session: touch({ ...s, notes, trace }) });
  },

  markProvocationShown: (id, context = {}) => {
    const s = get().session;
    if (!s) return;
    const trace = recordProvocationShown(s.trace, id, context);
    set({ session: touch({ ...s, trace }) });
  },
}));
