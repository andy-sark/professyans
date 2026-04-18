/**
 * Formula-7 provocations — thin wrapper over canonical JSON.
 *
 * Source of truth: `shared-data/formula7/provocations.json`.
 * See §11 of professyans_spec_v2.md for the design rationale.
 */

import provsJson from '@shared-data/formula7/provocations.json';

export type ProvocationType = 'card' | 'group' | 'formula' | 'molecule' | 'pattern';

export type PatternTrigger =
  | { kind: 'all_like_in_group'; group: string }
  | { kind: 'all_reject_in_group'; group: string }
  | { kind: 'many_flips'; count: number }
  | { kind: 'contradiction'; cards: [string, string] }
  | { kind: 'long_pause_on_card'; ms: number }
  | { kind: 'quick_pass_in_group'; group: string; avgMs: number };

export interface Provocation {
  id: string;
  type: ProvocationType;
  target?: string;
  tone: 'soft' | 'neutral' | 'sharp';
  text: string;
  trigger?: PatternTrigger;
}

export const F7_PROVOCATIONS: Provocation[] = provsJson as Provocation[];

/** Card-type provocations indexed by card code */
export const F7_CARD_PROVOCATIONS: Record<string, Provocation> = Object.fromEntries(
  F7_PROVOCATIONS
    .filter((p) => p.type === 'card' && p.target)
    .map((p) => [p.target as string, p])
);

/** Group-type provocations indexed by group key */
export const F7_GROUP_PROVOCATIONS: Record<string, Provocation> = Object.fromEntries(
  F7_PROVOCATIONS
    .filter((p) => p.type === 'group' && p.target)
    .map((p) => [p.target as string, p])
);
