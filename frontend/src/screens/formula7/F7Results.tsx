import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shell } from '../../components/layout/Shell';
import { Button } from '../../components/ui/Button';
import { useSession } from '../../store/sessionStore';
import { F7_CARDS_BY_CODE } from '../../data/formula7/cards';
import { matchHints, detectSchzhConflicts } from '../../lib/f7/hints';
import { computeInsights } from '../../lib/tracker';
import type { CardState } from '../../types/card';

/**
 * Results screen — phase 5 per spec §4.3.
 *
 * CRITICAL UX requirements from the spec:
 *   - Thank the user for the work of reflection (§4.3).
 *   - Show the molecule as a MAP, not a list (§13.3).
 *   - Show process history — waverings, returns, quick/long decisions (§9.4).
 *   - End with OPEN QUESTIONS, not with conclusions (§4.5 "Незавершённое действие").
 *   - NEVER use "your personality type", "recommended professions:", etc.
 *   - Hints are conversation starters, not autodiagnosis (§10.3).
 */
export function F7Results() {
  const navigate = useNavigate();
  const session = useSession((s) => s.session);

  useEffect(() => {
    if (!session) navigate('/');
  }, [session, navigate]);

  const formula = session?.formula ?? [];
  const clusters = session?.clusters ?? {};
  const cardStates = session?.cardStates ?? {};
  const track = session?.track ?? 'activating';

  // Derived data
  const likedSet = useMemo(() => {
    const s = new Set<string>();
    for (const [code, state] of Object.entries(cardStates)) {
      if ((state as CardState) === 'like') s.add(code);
    }
    return s;
  }, [cardStates]);

  const flippedCards = useMemo(
    () => Object.entries(cardStates)
      .filter(([, st]) => (st as CardState) === 'flipped')
      .map(([c]) => c),
    [cardStates]
  );

  const rejectedCards = useMemo(
    () => Object.entries(cardStates)
      .filter(([, st]) => (st as CardState) === 'reject')
      .map(([c]) => c),
    [cardStates]
  );

  const hints = useMemo(() => matchHints(likedSet), [likedSet]);
  const conflicts = useMemo(() => detectSchzhConflicts(likedSet), [likedSet]);

  const insights = useMemo(() => {
    if (!session) return null;
    return computeInsights(session.trace);
  }, [session]);

  if (!session) return null;

  const moleculeByCluster: Record<number, string[]> = { 0: [], 1: [], 2: [] };
  for (const code of formula) {
    const idx = clusters[code];
    if (typeof idx === 'number') moleculeByCluster[idx].push(code);
  }

  const openQuestions = buildOpenQuestions(session, conflicts.length, flippedCards.length);

  return (
    <Shell maxWidth="wide">
      {/* Phase 5 opener — warm gratitude, not triumphalism */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="mb-16 md:mb-24"
      >
        <div className="meta-label mb-5">Итог</div>
        <h1 className="text-balance mb-6">
          Спасибо за <span className="display-italic text-sage-600">труд размышления</span>.
          Это была настоящая работа, а не тест.
        </h1>
        <p className="text-lg text-ink-700 max-w-3xl leading-relaxed text-pretty">
          Ниже — материал, с которым ещё предстоит разбираться. Это не диагноз и не окончательный выбор —
          это твои сегодняшние интуиции, зафиксированные в формуле.
          Через несколько месяцев попробуй пройти заново: картина может заметно измениться, и это нормально.
        </p>
      </motion.section>

      {/* Molecule — the central artefact, shown as a map */}
      <section className="mb-20">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display">Твоя формула</h2>
          <span className="meta-label">{formula.length} карточек, {Object.values(moleculeByCluster).filter(a => a.length > 0).length} ядра</span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map((idx) => {
            const codes = moleculeByCluster[idx];
            if (codes.length === 0) return null;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="paper-card paper-card-raised p-6 md:p-7 bg-paper-50"
              >
                <div className="font-display text-2xl text-sage-600 mb-4">
                  Ядро {idx + 1}
                </div>
                <div className="space-y-3">
                  {codes.map((code) => {
                    const c = F7_CARDS_BY_CODE[code];
                    if (!c) return null;
                    return (
                      <div key={code} className="pb-3 border-b border-paper-300 last:border-0 last:pb-0">
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="meta-label">{c.code}</span>
                        </div>
                        <div className="font-display text-[1.05rem] leading-snug">{c.title}</div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Activating track: show process history */}
      {track === 'activating' && insights && (
        <section className="mb-20">
          <h2 className="font-display mb-6">История твоего процесса</h2>
          <p className="text-ink-700 mb-8 max-w-3xl leading-relaxed">
            Это не оценка — это зеркало того, как ты работал. В активизирующей методике
            <em> процесс важнее результата</em>.
          </p>

          <div className="grid md:grid-cols-2 gap-5">
            <InsightBlock
              label="Колебались"
              cards={insights.mostChangedCards}
              explainer="Эти карточки ты менял несколько раз. Значит, за ними — внутренний спор, который стоит услышать."
            />
            <InsightBlock
              label="Возвращались из отверженных"
              cards={insights.returnedFromReject}
              explainer="Сначала отверг, потом всё-таки вернулся. Первый импульс оказался не окончательным."
            />
            <InsightBlock
              label="Быстрые решения"
              cards={insights.quickDecisionCards.slice(0, 8)}
              explainer="Меньше двух секунд на решение — обычно это уже готовые, давно прожитые ответы."
            />
            <InsightBlock
              label="Долгие раздумья"
              cards={insights.longDecisionCards.slice(0, 8)}
              explainer="Больше пятнадцати секунд — значит, карточка попала в зону настоящего размышления."
            />
          </div>

          <div className="mt-6 meta-label">
            всего изменений состояний: {insights.totalStateChanges} ·
            среднее время решения: {Math.round(insights.averageDecisionTimeMs / 100) / 10} сек
          </div>
        </section>
      )}

      {/* Flipped as growth zones */}
      {flippedCards.length > 0 && (
        <section className="mb-16">
          <h2 className="font-display mb-4">Зоны роста</h2>
          <p className="text-ink-700 mb-6 max-w-3xl leading-relaxed text-pretty">
            Эти карточки ты пометил как «хочу, но сейчас недоступно».
            Стоит спросить себя: <em>что именно мешает — и что нужно, чтобы это изменить?</em>
          </p>
          <div className="flex flex-wrap gap-2">
            {flippedCards.map((code) => {
              const c = F7_CARDS_BY_CODE[code];
              if (!c) return null;
              return (
                <span
                  key={code}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                             bg-paper-200 text-ink-700 border border-paper-300 text-sm"
                >
                  <span className="font-mono text-xs opacity-60">{c.code}</span>
                  <span className="italic">{c.title}</span>
                </span>
              );
            })}
          </div>
        </section>
      )}

      {/* Rejected as stop signals */}
      {rejectedCards.length > 0 && (
        <section className="mb-16">
          <h2 className="font-display mb-4">Стоп-сигналы</h2>
          <p className="text-ink-700 mb-6 max-w-3xl leading-relaxed text-pretty">
            Карточки, которые ты отверг. Не «плохое» — просто точно не твоё.
            Полезно просматривать этот список при любом предложении работы.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {rejectedCards.map((code) => {
              const c = F7_CARDS_BY_CODE[code];
              if (!c) return null;
              return (
                <span
                  key={code}
                  className="inline-flex items-center gap-2 px-2.5 py-1 text-sm
                             line-through decoration-terra-500 text-ink-500"
                >
                  <span className="font-mono text-[11px] opacity-50">{c.code}</span>
                  <span>{c.title}</span>
                </span>
              );
            })}
          </div>
        </section>
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <section className="mb-16">
          <h2 className="font-display mb-4">Напряжения</h2>
          <p className="text-ink-700 mb-6 max-w-3xl leading-relaxed">
            Это не ошибки. Это места, где твои выборы сталкиваются — и где жизнь задаёт
            задачу: как их совместить? <em>Программа не исправляет их за тебя.</em>
          </p>
          <div className="space-y-3">
            {conflicts.map((c, i) => (
              <div key={i} className="paper-card p-5 border-terra-300 bg-paper-50">
                <div className="flex items-start gap-3">
                  <span className="text-terra-500 text-xl leading-none">⚡</span>
                  <div>
                    <div className="text-ink-900 mb-2">{c.conflict.description}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.matchedCards.map((code) => (
                        <span key={code} className="meta-label !normal-case bg-paper-200 px-2 py-0.5 rounded">
                          {code} {F7_CARDS_BY_CODE[code]?.title}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Hints — only show if activating track user opts in, OR if closed track */}
      {hints.length > 0 && (
        <section className="mb-16">
          <h2 className="font-display mb-3">Направления, которые напрашиваются</h2>
          <p className="text-ink-700 mb-2 max-w-3xl leading-relaxed text-pretty">
            Это <em>не список рекомендуемых профессий</em>. Это направления, в которых твоя формула
            находит совпадения с типовыми профессиональными паттернами.
          </p>
          <p className="meta-label mb-6">о каждом стоит узнать больше — и проверить, подходит ли тебе</p>

          <div className="grid md:grid-cols-2 gap-4">
            {hints.map((h) => (
              <div key={h.hint.id} className="paper-card p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="font-display text-[1.1rem] leading-snug">
                    {h.hint.label}
                  </div>
                  <div className="meta-label shrink-0">
                    {h.score}/{h.hint.keys.length}
                  </div>
                </div>
                <div className="text-sm text-ink-600 italic leading-relaxed text-pretty">
                  например: {h.hint.examples.join(', ')}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {h.matchedKeys.map((k) => (
                    <span key={k} className="meta-label !normal-case bg-sage-100 px-2 py-0.5 rounded">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Open questions — THE most important block per spec §4.5 */}
      <section className="mb-16 paper-card p-8 md:p-10 bg-sage-100/50 border-sage-300">
        <h2 className="font-display mb-6">О чём стоит подумать</h2>
        <ol className="space-y-5 list-none">
          {openQuestions.map((q, i) => (
            <li key={i} className="flex gap-4">
              <span className="font-display italic text-3xl text-sage-500 leading-none shrink-0">
                {i + 1}
              </span>
              <p className="text-ink-800 leading-relaxed text-lg text-pretty pt-1">{q}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Closing — spec §4.5 "Незавершённое действие": hand the baton back to life */}
      <section className="text-center py-10 border-t border-paper-300">
        <p className="font-display italic text-xl text-ink-700 mb-8 max-w-2xl mx-auto text-pretty">
          Это не вывод — это пауза в середине пути. Дальше — уже твоя живая жизнь.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/">
            <Button variant="secondary">На главную</Button>
          </Link>
          <Link to="/history">
            <Button variant="ghost">Мои прошлые работы</Button>
          </Link>
        </div>
        <div className="mt-10 meta-label">
          данные сохранены локально на твоём устройстве
        </div>
      </section>
    </Shell>
  );
}

function InsightBlock({
  label,
  cards,
  explainer,
}: {
  label: string;
  cards: string[];
  explainer: string;
}) {
  if (cards.length === 0) {
    return (
      <div className="paper-card p-5 opacity-60">
        <div className="meta-label mb-2">{label}</div>
        <div className="text-sm text-ink-600 italic">таких карточек не было</div>
      </div>
    );
  }
  return (
    <div className="paper-card p-5">
      <div className="meta-label mb-3">{label}</div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {cards.map((code) => {
          const c = F7_CARDS_BY_CODE[code];
          if (!c) return null;
          return (
            <span key={code}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded
                         bg-paper-200 text-xs text-ink-700">
              <span className="font-mono opacity-60">{c.code}</span>
              <span>{c.title}</span>
            </span>
          );
        })}
      </div>
      <div className="text-sm text-ink-600 italic leading-relaxed text-pretty">
        {explainer}
      </div>
    </div>
  );
}

/**
 * Build personalized open questions based on the session state.
 * Per spec §4.5, these are conversation openers, not conclusions.
 */
function buildOpenQuestions(
  session: ReturnType<typeof useSession.getState>['session'],
  conflictCount: number,
  flippedCount: number
): string[] {
  void session; // reserved for future personalization
  const base = [
    'Что бы ты сказал себе через три года, если бы сегодняшние выборы оказались точными?',
    'Какие из этих карточек ты бы показал родителям? Каких точно не показал бы? Почему?',
  ];
  if (flippedCount > 0) {
    base.push(
      'Есть ли профессия, где твои «зоны роста» (перевёрнутые карточки) — не слабость, а обязательное требование?'
    );
  }
  if (conflictCount > 0) {
    base.push(
      'Напряжения, которые ты видишь — это то, с чем придётся жить, или то, что можно разрешить одним решением?'
    );
  }
  base.push(
    'Если бы кто-то описал «идеальную работу» этими же карточками — где ты не согласен с ним? Это важно: именно там твоя индивидуальность.'
  );
  return base;
}
