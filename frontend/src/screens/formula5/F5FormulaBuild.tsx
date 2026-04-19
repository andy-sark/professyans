import { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormulaTray } from '../../components/common/FormulaTray';
import { Shell } from '../../components/layout/Shell';
import { Button } from '../../components/ui/Button';
import { useSession } from '../../store/sessionStore';
import {
  F5_BONUS_SIZE,
  F5_CARDS_BY_CODE,
  F5_FORMULA_SIZE,
  F5_MAIN_GROUPS,
  cardsOfGroup,
} from '../../data/formula5/cards';
import { validateFormula, candidateCards } from '../../lib/f5/validation';

const MAX_FORMULA = F5_FORMULA_SIZE + F5_BONUS_SIZE;

/**
 * Formula-building screen (Formula-5).
 *
 * Pick 8–10 cards from the "like" pool across five main groups (≥1 per group).
 */
export function F5FormulaBuild() {
  const navigate = useNavigate();
  const session = useSession((s) => s.session);
  const addToFormula = useSession((s) => s.addToFormula);
  const removeFromFormula = useSession((s) => s.removeFromFormula);
  const setStage = useSession((s) => s.setStage);

  useEffect(() => {
    if (!session) navigate('/');
  }, [session, navigate]);

  const candidates = useMemo(
    () => candidateCards(session?.cardStates ?? {}),
    [session?.cardStates]
  );

  const formula = session?.formula ?? [];
  const formulaSet = useMemo(() => new Set(formula), [formula]);

  const validation = useMemo(
    () => validateFormula(formula, session?.cardStates ?? {}),
    [formula, session?.cardStates]
  );

  const candidatesByGroup = useMemo(() => {
    const out: Record<string, typeof candidates> = {};
    for (const g of F5_MAIN_GROUPS) out[g] = [];
    for (const c of candidates) {
      if (out[c.group]) out[c.group].push(c);
    }
    return out;
  }, [candidates]);

  const toggle = (code: string) => {
    if (formulaSet.has(code)) {
      removeFromFormula(code);
    } else {
      if (formula.length >= MAX_FORMULA) return;
      addToFormula(code);
    }
  };

  const goNext = () => {
    setStage('f5.molecule');
    navigate('/f5/molecule');
  };

  const lastRankingGroup = F5_MAIN_GROUPS[F5_MAIN_GROUPS.length - 1] ?? 'О';

  if (!session) return null;

  return (
    <Shell maxWidth="wide">
      <div className="mb-10">
        <div className="meta-label mb-4">Формула · сборка</div>
        <h1 className="mb-4 text-balance">
          Выбери восемь главных — <span className="display-italic text-sage-600">свою формулу</span>.
        </h1>
        <p className="text-ink-700 text-lg leading-relaxed max-w-3xl text-pretty">
          Из карточек, помеченных как «нравится», собери от 8 до 10. Правило автора: из каждой из пяти основных групп
          должна быть хотя бы одна. Это правило — способ не стянуть формулу в один угол.
        </p>
      </div>

      <FormulaTray
        formula={formula}
        cardsByCode={F5_CARDS_BY_CODE}
        validation={validation}
        formulaSize={F5_FORMULA_SIZE}
        bonusSize={F5_BONUS_SIZE}
        onRemove={toggle}
      />

      <div className="space-y-10">
        {F5_MAIN_GROUPS.map((g) => {
          const cs = candidatesByGroup[g] ?? [];
          const allInGroup = cardsOfGroup(g);
          const groupHasInFormula = [...formulaSet].some((c) => F5_CARDS_BY_CODE[c]?.group === g);
          return (
            <section key={g}>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="font-display text-3xl text-sage-600">{g}</span>
                <div className="meta-label">
                  {cs.length} из {allInGroup.length} «нравится»
                </div>
                {!groupHasInFormula && cs.length > 0 && (
                  <div className="meta-label !text-terra-700">нужна хотя бы одна</div>
                )}
              </div>

              {cs.length === 0 ? (
                <div className="paper-card p-5 text-ink-600 text-sm italic">
                  В этой группе нет карточек с пометкой «нравится». Можешь вернуться к ранжированию и посмотреть её
                  ещё раз —{' '}
                  <button
                    className="underline hover:text-ink-900"
                    onClick={() => {
                      setStage(`f5.ranking:${g}`);
                      navigate('/f5/ranking');
                    }}
                  >
                    перейти к группе {g}
                  </button>
                  .
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cs.map((c) => {
                    const picked = formulaSet.has(c.code);
                    const atCap = formula.length >= MAX_FORMULA && !picked;
                    return (
                      <button
                        key={c.code}
                        onClick={() => toggle(c.code)}
                        disabled={atCap}
                        className={`paper-card p-4 text-left transition-all duration-200 ease-paper
                                    border-2
                                    ${picked ? 'border-sage-500 bg-sage-100' : 'border-paper-300 hover:border-ink-400'}
                                    ${atCap ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <span className="meta-label">{c.code}</span>
                          {picked && <span className="meta-label !text-sage-700">✓ в формуле</span>}
                        </div>
                        <div className="font-display text-[1.02rem] leading-snug mb-1">{c.title}</div>
                        {c.description && (
                          <div className="text-xs text-ink-600 leading-relaxed text-pretty">{c.description}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="mt-16 pt-8 border-t border-paper-300 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          onClick={() => {
            setStage(`f5.ranking:${lastRankingGroup}`);
            navigate('/f5/ranking');
          }}
        >
          ← вернуться к ранжированию
        </Button>

        <div className="flex items-center gap-4">
          {!validation.ok && <div className="text-sm text-ink-600">пока нельзя дальше — см. список наверху</div>}
          <Button size="lg" disabled={!validation.ok} onClick={goNext}>
            собрать молекулу →
          </Button>
        </div>
      </div>
    </Shell>
  );
}
