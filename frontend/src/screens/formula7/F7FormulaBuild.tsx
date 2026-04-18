import { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shell } from '../../components/layout/Shell';
import { Button } from '../../components/ui/Button';
import { useSession } from '../../store/sessionStore';
import {
  F7_CARDS_BY_CODE,
  F7_MAIN_GROUPS,
  F7_FORMULA_SIZE,
  cardsOfGroup,
} from '../../data/formula7/cards';
import { validateFormula, candidateCards } from '../../lib/f7/validation';

/**
 * Formula-building screen.
 *
 * User picks exactly 7 cards from the "like" pool in the 6 main groups,
 * with ≥1 per group (spec §5.3 phase 2). We:
 *   - show candidates grouped by group,
 *   - highlight groups that still need a pick,
 *   - allow add/remove freely,
 *   - only enable "дальше" when validation passes,
 *   - show issues inline (not as an error modal — this is normal work).
 */
export function F7FormulaBuild() {
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

  // Group candidates by group for display
  const candidatesByGroup = useMemo(() => {
    const out: Record<string, typeof candidates> = {};
    for (const g of F7_MAIN_GROUPS) out[g] = [];
    for (const c of candidates) {
      if (out[c.group]) out[c.group].push(c);
    }
    return out;
  }, [candidates]);

  const toggle = (code: string) => {
    if (formulaSet.has(code)) {
      removeFromFormula(code);
    } else {
      if (formula.length >= F7_FORMULA_SIZE) return; // soft cap
      addToFormula(code);
    }
  };

  const goNext = () => {
    setStage('f7.molecule');
    navigate('/f7/molecule');
  };

  if (!session) return null;

  return (
    <Shell maxWidth="wide">
      <div className="mb-10">
        <div className="meta-label mb-4">Формула · сборка</div>
        <h1 className="mb-4 text-balance">
          Выбери семь главных —{' '}
          <span className="display-italic text-sage-600">свою формулу</span>.
        </h1>
        <p className="text-ink-700 text-lg leading-relaxed max-w-3xl text-pretty">
          Из карточек, помеченных как «нравится», собери ровно семь. Правило автора:
          из каждой из шести основных групп должна быть хотя бы одна. Это правило —
          способ не стянуть формулу в один угол.
        </p>
      </div>

      {/* Formula tray */}
      <div className="mb-10 paper-card p-6 md:p-8 bg-paper-50 border-sage-300">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-display text-xl">Твоя формула</h2>
          <div className="meta-label">
            {formula.length} / {F7_FORMULA_SIZE}
          </div>
        </div>

        {formula.length === 0 ? (
          <div className="py-8 text-center text-ink-500 italic">
            пока пусто — добавь карточки из списка ниже
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            <AnimatePresence mode="popLayout">
              {formula.map((code) => {
                const c = F7_CARDS_BY_CODE[code];
                if (!c) return null;
                return (
                  <motion.button
                    layout
                    key={code}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => toggle(code)}
                    className="group flex items-center gap-2 pl-3 pr-2 py-2 rounded-full
                               bg-sage-500 text-paper-50 hover:bg-sage-600 transition-colors
                               shadow-card"
                    title="нажми, чтобы убрать из формулы"
                  >
                    <span className="font-mono text-xs opacity-80">{c.code}</span>
                    <span className="font-ui text-sm">{c.title}</span>
                    <span className="text-xs opacity-60 group-hover:opacity-100">✕</span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Validation inline */}
        {validation.issues.length > 0 && formula.length > 0 && (
          <div className="mt-5 pt-5 border-t border-paper-300 space-y-2">
            {validation.issues.map((issue, i) => (
              <div key={i} className="flex gap-2 text-sm text-ink-700">
                <span className="text-terra-500 shrink-0">·</span>
                <span>{issue}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Candidates by group */}
      <div className="space-y-10">
        {F7_MAIN_GROUPS.map((g) => {
          const cs = candidatesByGroup[g] ?? [];
          const allInGroup = cardsOfGroup(g);
          const groupHasInFormula = [...formulaSet].some(
            (c) => F7_CARDS_BY_CODE[c]?.group === g
          );
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
                  В этой группе нет карточек с пометкой «нравится». Можешь вернуться
                  к ранжированию и посмотреть её ещё раз —{' '}
                  <button
                    className="underline hover:text-ink-900"
                    onClick={() => {
                      setStage(`f7.ranking:${g}`);
                      navigate('/f7/ranking');
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
                    const atCap = formula.length >= F7_FORMULA_SIZE && !picked;
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
                          {picked && (
                            <span className="meta-label !text-sage-700">✓ в формуле</span>
                          )}
                        </div>
                        <div className="font-display text-[1.02rem] leading-snug mb-1">
                          {c.title}
                        </div>
                        {c.description && (
                          <div className="text-xs text-ink-600 leading-relaxed text-pretty">
                            {c.description}
                          </div>
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

      {/* Nav */}
      <div className="mt-16 pt-8 border-t border-paper-300 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={() => { setStage('f7.ranking:К'); navigate('/f7/ranking'); }}>
          ← вернуться к ранжированию
        </Button>

        <div className="flex items-center gap-4">
          {!validation.ok && (
            <div className="text-sm text-ink-600">
              пока нельзя дальше — см. список наверху
            </div>
          )}
          <Button size="lg" disabled={!validation.ok} onClick={goNext}>
            собрать молекулу →
          </Button>
        </div>
      </div>
    </Shell>
  );
}
