import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shell } from '../../components/layout/Shell';
import { Button } from '../../components/ui/Button';
import { useSession } from '../../store/sessionStore';
import { F5_CARDS_BY_CODE } from '../../data/formula5/cards';

/**
 * Molecule-build screen (Formula-5).
 *
 * Heading uses formula.length so copy stays accurate when the formula has 8–10 cards (bonus range).
 */
export function F5MoleculeBuild() {
  const navigate = useNavigate();
  const session = useSession((s) => s.session);
  const assignCluster = useSession((s) => s.assignCluster);
  const setStage = useSession((s) => s.setStage);

  useEffect(() => {
    if (!session) navigate('/');
  }, [session, navigate]);

  const formula = session?.formula ?? [];
  const clusters = session?.clusters ?? {};

  const allAssigned = formula.every((c) => typeof clusters[c] === 'number');

  const usedClusters = useMemo(() => {
    const set = new Set<number>();
    for (const code of formula) {
      const idx = clusters[code];
      if (typeof idx === 'number') set.add(idx);
    }
    return set;
  }, [clusters, formula]);

  const clusterNames = ['Ядро 1', 'Ядро 2', 'Ядро 3'];

  const validMolecule = allAssigned && usedClusters.size >= 2;

  const goToResults = async () => {
    setStage('f5.results');
    await useSession.getState().completeSession();
    navigate('/f5/results');
  };

  if (!session) return null;

  return (
    <Shell maxWidth="wide">
      <div className="mb-10">
        <div className="meta-label mb-4">Молекула · сборка</div>
        <h1 className="mb-4 text-balance">
          Сгруппируй <span className="display-italic text-sage-600">{formula.length} карточек</span> в два-три ядра.
        </h1>
        <p className="text-ink-700 text-lg leading-relaxed max-w-3xl text-pretty">
          Ядро — это логически связанная подгруппа. Например: «творческая часть» / «социальная часть» / «обеспечение
          быта». Назначение ядер — твоё. Это кульминация работы: ты впервые увидишь свою формулу как целое.
        </p>
      </div>

      <div className="space-y-3 mb-10">
        {formula.map((code) => {
          const c = F5_CARDS_BY_CODE[code];
          if (!c) return null;
          const current = clusters[code];
          return (
            <motion.div
              layout
              key={code}
              className="paper-card p-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-6"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="meta-label">{c.code}</span>
                  <span className="meta-label">{c.group}</span>
                </div>
                <div className="font-display text-lg leading-snug">{c.title}</div>
                {c.description && (
                  <div className="text-sm text-ink-600 leading-relaxed mt-1 text-pretty">{c.description}</div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => assignCluster(code, idx)}
                    className={`h-11 w-11 rounded-full border-2 font-ui text-sm transition-all duration-200
                                ${
                                  current === idx
                                    ? 'bg-sage-500 text-paper-50 border-sage-600 shadow-card'
                                    : 'bg-paper-50 border-paper-300 text-ink-700 hover:border-ink-400'
                                }`}
                    aria-label={`Назначить ${clusterNames[idx]}`}
                    title={clusterNames[idx]}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {allAssigned && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="paper-card p-6 md:p-8 mb-8 bg-paper-50"
        >
          <div className="meta-label mb-4">Предварительный вид молекулы</div>
          <div className="grid md:grid-cols-3 gap-6">
            {[0, 1, 2].map((idx) => {
              const cardsInCluster = formula.filter((c) => clusters[c] === idx);
              if (cardsInCluster.length === 0) return null;
              return (
                <div key={idx}>
                  <div className="font-display text-xl text-sage-600 mb-3">{clusterNames[idx]}</div>
                  <div className="space-y-2">
                    {cardsInCluster.map((code) => {
                      const c = F5_CARDS_BY_CODE[code];
                      return (
                        <div key={code} className="text-sm">
                          <span className="meta-label mr-2">{c?.code}</span>
                          <span>{c?.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <div className="mt-12 pt-8 border-t border-paper-300 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          onClick={() => {
            setStage('f5.formula');
            navigate('/f5/formula');
          }}
        >
          ← к формуле
        </Button>

        <div className="flex items-center gap-4">
          {!allAssigned && <div className="text-sm text-ink-600">назначь ядро для каждой карточки</div>}
          {allAssigned && usedClusters.size < 2 && (
            <div className="text-sm text-ink-600">все в одном ядре — попробуй увидеть два</div>
          )}
          <Button size="lg" disabled={!validMolecule} onClick={goToResults}>
            к результатам →
          </Button>
        </div>
      </div>
    </Shell>
  );
}
