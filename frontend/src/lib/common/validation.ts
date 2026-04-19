/**
 * Generic formula validation (method-agnostic).
 * Mirrors core/src/professyans_core/methods/common.py::validate_formula.
 */

export interface FormulaValidation {
  ok: boolean;
  /** Human-readable explanation of what's missing or wrong */
  issues: string[];
  /** Groups that still have no card in the formula */
  missingGroups: string[];
  /** Groups where the user hasn't yet liked anything — can't satisfy the rule */
  emptyLikeGroups: string[];
}

export interface ValidateFormulaContext {
  formulaSize: number;
  mainGroups: readonly string[];
  cardsByCode: Record<string, { group: string }>;
  /** Default 0 — same as core when omitted */
  bonusSize?: number;
}

/**
 * Validate a candidate formula against size, main-group coverage, and empty-like rules.
 */
export function validateFormula(
  formula: string[],
  cardStates: Record<string, string>,
  ctx: ValidateFormulaContext
): FormulaValidation {
  const issues: string[] = [];
  const formulaSet = new Set(formula);
  const n = formulaSet.size;
  const bonusSize = ctx.bonusSize ?? 0;
  const maxSize = ctx.formulaSize + bonusSize;

  if (n < ctx.formulaSize || n > maxSize) {
    if (bonusSize === 0) {
      issues.push(`Выбрано ${n} из ${ctx.formulaSize}`);
    } else {
      issues.push(
        `Выбрано ${n}, нужно от ${ctx.formulaSize} до ${ctx.formulaSize + bonusSize}`
      );
    }
  }

  const missingGroups: string[] = [];
  for (const group of ctx.mainGroups) {
    const hasAny = [...formulaSet].some((code) => ctx.cardsByCode[code]?.group === group);
    if (!hasAny) missingGroups.push(group);
  }
  if (missingGroups.length > 0) {
    issues.push(`В формуле пока нет карточек из групп: ${missingGroups.join(', ')}`);
  }

  const emptyLikeGroups: string[] = [];
  for (const group of ctx.mainGroups) {
    const hasLike = Object.entries(cardStates).some(
      ([code, state]) => ctx.cardsByCode[code]?.group === group && state === 'like'
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
