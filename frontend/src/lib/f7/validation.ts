/**
 * Formula validation for Formula-7.
 *
 * Source: professyans_spec_v2.md §5.3 (Phase 2) and §10.2.
 *
 * Rule (author): "Из каждой группы должна быть взята хотя бы одна карточка".
 * The formula must contain exactly 7 cards drawn from the 6 main groups
 * (Ц, П, С, У, О, К), with ≥1 card per group.
 *
 * Validation blocks progression in the activating track — but never scolds.
 * Error messages aim to explain, not to shame.
 */

import type { Card } from '../../types/card';
import { F7_CARDS_BY_CODE, F7_MAIN_GROUPS, F7_FORMULA_SIZE } from '../../data/formula7/cards';
import {
  validateFormula as validateFormulaGeneric,
  type FormulaValidation,
} from '../common/validation';

export type { FormulaValidation };

/**
 * Validate a candidate formula.
 *
 * @param formula — array of card codes chosen for the formula
 * @param cardStates — full map of cardCode → state (to detect empty-like groups)
 */
export function validateFormula(
  formula: string[],
  cardStates: Record<string, string>
): FormulaValidation {
  return validateFormulaGeneric(formula, cardStates, {
    formulaSize: F7_FORMULA_SIZE,
    mainGroups: F7_MAIN_GROUPS,
    cardsByCode: F7_CARDS_BY_CODE,
  });
}

/**
 * List candidate cards for the formula — everything marked as "like",
 * but NOT "flipped" (flipped means wanted-but-unavailable, counted differently).
 */
export function candidateCards(cardStates: Record<string, string>): Card[] {
  return Object.entries(cardStates)
    .filter(([, state]) => state === 'like')
    .map(([code]) => F7_CARDS_BY_CODE[code])
    .filter((c): c is Card => Boolean(c) && F7_MAIN_GROUPS.includes(c.group as never));
}
