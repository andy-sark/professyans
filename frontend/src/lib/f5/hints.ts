/**
 * F-5 hint matcher.
 *
 * No conflict-detection helper here: that facility exists only in the
 * Formula-7 hints module (extra groups in that methodology). Formula-5
 * mirrors core `formula5` — hints JSON has no conflict list.
 * See `lib/f7/hints.ts` for the seven-card implementation and rationale.
 */

import { F5_HINTS } from '../../data/formula5/hints';
import { matchHints as matchHintsGeneric, type MatchedHint } from '../common/hints';

export function matchHints(selectedCodes: Set<string>): MatchedHint[] {
  return matchHintsGeneric(selectedCodes, F5_HINTS);
}

export type { MatchedHint };
