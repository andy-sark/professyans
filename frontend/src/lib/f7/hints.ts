/**
 * Profession hint matcher for Formula-7.
 *
 * Algorithm per professyans_spec_v2.md §10.3:
 *   for hint in HINTS:
 *     matched = hint.keys ∩ selected
 *     hint.score = |matched|
 *     hint.coverage = |matched| / |hint.keys|
 *   keep hints where coverage >= 1.0
 *     OR (score >= 2 AND coverage >= 0.66)
 *   sort by score DESC, coverage DESC; limit 6
 *
 * Important (spec §10.3): "эти подсказки — не автодиагноз". Any consumer
 * MUST frame results as conversation starters, not as recommendations.
 */

import { F7_HINTS, F7_SCHZH_CONFLICTS, type HintSignature, type SchzhConflict }
  from '../../data/formula7/hints';

export interface MatchedHint {
  hint: HintSignature;
  score: number;
  coverage: number;
  matchedKeys: string[];
}

export interface TriggeredConflict {
  conflict: SchzhConflict;
  matchedCards: string[];
}

/** Match hint signatures against the user's selected ("like") set. */
export function matchHints(selectedCodes: Set<string>): MatchedHint[] {
  const out: MatchedHint[] = [];

  for (const h of F7_HINTS) {
    const matched = h.keys.filter((k) => selectedCodes.has(k));
    const score = matched.length;
    const coverage = score / h.keys.length;

    const keep = coverage >= 1.0 || (score >= 2 && coverage >= 0.66);
    if (keep) {
      out.push({ hint: h, score, coverage, matchedKeys: matched });
    }
  }

  out.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.coverage - a.coverage;
  });

  return out.slice(0, 6);
}

/** Flag lifestyle-vs-profession conflicts (spec §10.4). */
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
