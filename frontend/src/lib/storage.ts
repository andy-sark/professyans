/**
 * Storage layer.
 *
 * Two-tier design per professyans_spec_v2.md §3.3:
 *   - localStorage — for the CURRENT session (fast, synchronous).
 *   - IndexedDB (Dexie) — for the history of COMPLETED sessions.
 *
 * Privacy: all data stays local. No backend calls in this module.
 * A later iteration will add an opt-in sync-to-backend path.
 */

import Dexie, { type EntityTable } from 'dexie';
import type { Session } from '../types/session';

const LS_CURRENT_SESSION_KEY = 'professyans.currentSession.v1';

/* ============================================================
   localStorage: current session
   ============================================================ */

export function saveCurrentSession(session: Session): void {
  try {
    const serialized = JSON.stringify(session);
    localStorage.setItem(LS_CURRENT_SESSION_KEY, serialized);
  } catch (err) {
    // Most likely quota exceeded — trace could grow very large on long sessions.
    // Strategy: drop oldest trace events, keep the rest of the session intact.
    console.warn('[storage] localStorage write failed — trimming trace', err);
    const trimmed: Session = {
      ...session,
      trace: {
        ...session.trace,
        events: session.trace.events.slice(-500), // keep last 500 events
      },
    };
    try {
      localStorage.setItem(LS_CURRENT_SESSION_KEY, JSON.stringify(trimmed));
    } catch {
      // Give up gracefully. Session will still be reconstructable from history DB.
    }
  }
}

export function loadCurrentSession(): Session | null {
  const raw = localStorage.getItem(LS_CURRENT_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function clearCurrentSession(): void {
  localStorage.removeItem(LS_CURRENT_SESSION_KEY);
}

/* ============================================================
   IndexedDB: history of completed sessions
   ============================================================ */

class ProfessyansDB extends Dexie {
  sessions!: EntityTable<Session, 'id'>;

  constructor() {
    super('professyans');
    this.version(1).stores({
      // Index by id (primary), startedAt (for history sort), method (for filter)
      sessions: 'id, startedAt, completedAt, method, track',
    });
  }
}

export const db = new ProfessyansDB();

export async function archiveSession(session: Session): Promise<void> {
  await db.sessions.put({ ...session, updatedAt: Date.now() });
}

export async function listSessions(opts?: {
  method?: string;
  limit?: number;
}): Promise<Session[]> {
  let collection = db.sessions.orderBy('startedAt').reverse();
  if (opts?.method) {
    collection = db.sessions.where('method').equals(opts.method).reverse();
  }
  const all = await (opts?.limit ? collection.limit(opts.limit).toArray() : collection.toArray());
  return all;
}

export async function getSession(id: string): Promise<Session | undefined> {
  return db.sessions.get(id);
}

export async function deleteSession(id: string): Promise<void> {
  await db.sessions.delete(id);
}
