/**
 * Formula-7 hint matching and SCHZH conflict detection.
 *
 * Important (spec §10.3): "эти подсказки — не автодиагноз". Any consumer
 * MUST frame results as conversation starters, not as recommendations.
 */

import { F7_HINTS, F7_SCHZH_CONFLICTS, type SchzhConflict } from '../../data/formula7/hints';
import {
  matchHints as matchHintsGeneric,
  type HintSignature,
  type MatchedHint,
} from '../common/hints';

export type { HintSignature, MatchedHint };

export interface TriggeredConflict {
  conflict: SchzhConflict;
  matchedCards: string[];
}

/** Match hint signatures against the user's selected ("like") set. */
export function matchHints(selectedCodes: Set<string>): MatchedHint[] {
  return matchHintsGeneric(selectedCodes, F7_HINTS);
}

/**
 * SCHZH conflict detection is F-7-specific and intentionally not in common/.
 * СЧЖ is a group that doesn't exist in F-5 (see f5_vs_f7_comparison.md:
 * marked as new in F-7). Keeping this in f7/ preserves the architectural
 * distinction between "F-5 doesn't have SCHZH conflicts because it lacks
 * the object" vs. "F-5 has the feature with empty data" — the latter would
 * mask a fundamental methodological difference as a configuration detail.
 * Parity note: same decision in core/.../formula7.py::detect_schzh_conflicts.
 */
export function detectSchzhConflicts(selectedCodes: Set<string>): TriggeredConflict[] {
  const out: TriggeredConflict[] = [];
  for (const c of F7_SCHZH_CONFLICTS) {
    const matched = c.cards.filter((k) => selectedCodes.has(k));
    // Conflict triggers if all of the listed cards are "liked"
    if (matched.length === c.cards.length) {
      out.push({ conflict: c, matchedCards: matched });
    }
  }
  return out;
}
