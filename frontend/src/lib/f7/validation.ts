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

export interface FormulaValidation {
  ok: boolean;
  /** Human-readable explanation of what's missing or wrong */
  issues: string[];
  /** Groups that still have no card in the formula */
  missingGroups: string[];
  /** Groups where the user hasn't yet liked anything — can't satisfy the rule */
  emptyLikeGroups: string[];
}

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
  const issues: string[] = [];
  const formulaSet = new Set(formula);

  // Size check
  if (formulaSet.size !== F7_FORMULA_SIZE) {
    issues.push(`Выбрано ${formulaSet.size} из ${F7_FORMULA_SIZE}`);
  }

  // Per-group coverage
  const missingGroups: string[] = [];
  for (const group of F7_MAIN_GROUPS) {
    const hasAny = [...formulaSet].some((code) => F7_CARDS_BY_CODE[code]?.group === group);
    if (!hasAny) missingGroups.push(group);
  }
  if (missingGroups.length > 0) {
    issues.push(`В формуле пока нет карточек из групп: ${missingGroups.join(', ')}`);
  }

  // Empty-like groups — a deeper problem: can't satisfy the rule at all
  const emptyLikeGroups: string[] = [];
  for (const group of F7_MAIN_GROUPS) {
    const hasLike = Object.entries(cardStates).some(
      ([code, state]) => F7_CARDS_BY_CODE[code]?.group === group && state === 'like'
    );
    if (!hasLike) emptyLikeGroups.push(group);
  }
  if (emptyLikeGroups.length > 0) {
    issues.push(
      `В группах ${emptyLikeGroups.join(', ')} у тебя нет ни одной «нравится». ` +
        `Это сигнал сам по себе — стоит обсудить, почему.`
    );
  }

  return {
    ok: issues.length === 0,
    issues,
    missingGroups,
    emptyLikeGroups,
  };
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
