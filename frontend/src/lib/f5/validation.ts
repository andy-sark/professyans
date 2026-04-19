/**
 * Formula validation for Formula-5.
 *
 * Rule: at least one card from each main group (Ц, П, С, У, О).
 * Formula size: formulaSize..formulaSize+bonusSize unique cards (see JSON meta).
 */

import type { Card } from '../../types/card';
import {
  F5_BONUS_SIZE,
  F5_CARDS_BY_CODE,
  F5_MAIN_GROUPS,
  F5_FORMULA_SIZE,
} from '../../data/formula5/cards';
import {
  validateFormula as validateFormulaGeneric,
  type FormulaValidation,
} from '../common/validation';

export type { FormulaValidation };

export function validateFormula(
  formula: string[],
  cardStates: Record<string, string>
): FormulaValidation {
  return validateFormulaGeneric(formula, cardStates, {
    formulaSize: F5_FORMULA_SIZE,
    mainGroups: F5_MAIN_GROUPS,
    cardsByCode: F5_CARDS_BY_CODE,
    bonusSize: F5_BONUS_SIZE,
  });
}

/**
 * Cards marked "like" (not flipped) from main groups only — candidates for the formula.
 */
export function candidateCards(cardStates: Record<string, string>): Card[] {
  return Object.entries(cardStates)
    .filter(([, state]) => state === 'like')
    .map(([code]) => F5_CARDS_BY_CODE[code])
    .filter((c): c is Card => Boolean(c) && F5_MAIN_GROUPS.includes(c.group as never));
}
