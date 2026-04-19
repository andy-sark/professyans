/**
 * Generic profession-hint matcher (method-agnostic).
 * Mirrors core/src/professyans_core/methods/common.py::match_hints.
 *
 * Algorithm per professyans_spec_v2.md §10.3:
 *   keep hints where coverage >= 1.0 OR (score >= 2 AND coverage >= 0.66)
 *   sort by score DESC, coverage DESC; limit 6
 */

export interface HintSignature {
  id: string;
  keys: string[];
  label: string;
  examples: string[];
}

export interface MatchedHint {
  hint: HintSignature;
  score: number;
  coverage: number;
  matchedKeys: string[];
}

/** Match hint signatures against the user's selected ("like") set. */
export function matchHints(
  selectedCodes: Set<string>,
  hints: readonly HintSignature[]
): MatchedHint[] {
  const out: MatchedHint[] = [];

  for (const h of hints) {
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
