/**
 * Formula-7 hint signatures and SCHZH conflicts.
 *
 * Source of truth: `shared-data/formula7/hints.json`.
 */

import hintsJson from '@shared-data/formula7/hints.json';
import type { HintSignature } from '../../lib/common/hints';

export interface SchzhConflict {
  cards: string[];
  description: string;
}

const data = hintsJson as {
  hints: HintSignature[];
  schzh_conflicts: SchzhConflict[];
};

export const F7_HINTS: HintSignature[] = data.hints;
export const F7_SCHZH_CONFLICTS: SchzhConflict[] = data.schzh_conflicts;

export type { HintSignature };
