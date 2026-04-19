/**
 * Formula-5 hint signatures.
 *
 * Source of truth: `shared-data/formula5/hints.json`.
 */

import hintsJson from '@shared-data/formula5/hints.json';
import type { HintSignature } from '../../lib/common/hints';

const data = hintsJson as {
  hints: HintSignature[];
};

export const F5_HINTS: HintSignature[] = data.hints;

export type { HintSignature };
