/**
 * Card and card-state types.
 *
 * Based on professyans_spec_v2.md §10.1 (state machine) and §12.1 (Card interface).
 * These types are shared across Formula-7, Formula-5, and KCHG.
 */

export type Method = 'F7' | 'F5' | 'KCHG' | 'PEREKRESTOK';

/** Card state machine per spec §10.1 */
export type CardState = 'unset' | 'like' | 'neutral' | 'reject' | 'flipped';

/** Formula-7 groups */
export type F7Group = 'СЧЖ' | 'Ц' | 'П' | 'С' | 'У' | 'О' | 'К' | 'ВК';
/** Formula-5 groups (subset) */
export type F5Group = 'Ц' | 'П' | 'С' | 'У' | 'О';
/** KCHG groups */
export type KCHGGroup = 'К' | 'Ч' | 'Г';

export type AnyGroup = F7Group | KCHGGroup;

export interface Card {
  /** e.g. "Ц-6", "П-7", "К-12" */
  code: string;
  group: AnyGroup;
  method: Method;
  title: string;
  description?: string;
  /** KCHG only — K cards link to Ч and Г by numeric index */
  linked_Ch?: number[];
  linked_G?: number[];
}

/**
 * Group metadata — display name, role, spec reference.
 */
export interface GroupMeta {
  key: AnyGroup;
  /** Short label — "Ц", "П" */
  label: string;
  /** Full name — "Цели труда" */
  name: string;
  /** Role in methodology */
  role: 'auxiliary' | 'main' | 'final';
  /** One-line description shown before ranking the group */
  intro: string;
}
