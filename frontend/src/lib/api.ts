/**
 * Backend API client.
 *
 * The frontend is offline-first by design (spec §3.3). Sync to the backend
 * is OPTIONAL and progressive: if VITE_API_URL is set and the user opts in,
 * each session update is mirrored to the server; if not, everything works
 * purely from localStorage / IndexedDB.
 *
 * This client never throws on network error — failures are logged and
 * swallowed. The user-visible state of the session is authoritative in the
 * client; backend is a cloud backup.
 */

import type { Session } from '../types/session';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');
const API_BASE = API_URL ? `${API_URL}/api/v1` : null;

const LS_SYNC_ENABLED = 'professyans.sync.enabled';

export const api = {
  /** Whether an API URL is configured at build time. */
  isConfigured(): boolean {
    return API_BASE !== null;
  },

  /** Whether the user has enabled sync (opt-in). */
  isEnabled(): boolean {
    if (!this.isConfigured()) return false;
    return localStorage.getItem(LS_SYNC_ENABLED) === '1';
  },

  setEnabled(enabled: boolean): void {
    if (enabled) localStorage.setItem(LS_SYNC_ENABLED, '1');
    else localStorage.removeItem(LS_SYNC_ENABLED);
  },

  async health(): Promise<boolean> {
    if (!API_URL) return false;
    try {
      const r = await fetch(`${API_URL}/health`);
      return r.ok;
    } catch {
      return false;
    }
  },

  /** Upsert a session. Idempotent by id. Returns true on success. */
  async upsertSession(s: Session): Promise<boolean> {
    if (!this.isEnabled() || !API_BASE) return false;
    try {
      const r = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      });
      return r.ok;
    } catch (err) {
      console.warn('[api] sync failed, continuing offline', err);
      return false;
    }
  },

  async fetchSession(id: string): Promise<Session | null> {
    if (!this.isEnabled() || !API_BASE) return null;
    try {
      const r = await fetch(`${API_BASE}/sessions/${encodeURIComponent(id)}`);
      if (!r.ok) return null;
      return (await r.json()) as Session;
    } catch {
      return null;
    }
  },

  async listSessions(): Promise<Session[]> {
    if (!this.isEnabled() || !API_BASE) return [];
    try {
      const r = await fetch(`${API_BASE}/sessions?limit=100`);
      if (!r.ok) return [];
      const body = (await r.json()) as { items: Session[] };
      return body.items;
    } catch {
      return [];
    }
  },

  async deleteSession(id: string): Promise<boolean> {
    if (!this.isEnabled() || !API_BASE) return false;
    try {
      const r = await fetch(`${API_BASE}/sessions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return r.ok;
    } catch {
      return false;
    }
  },
};
