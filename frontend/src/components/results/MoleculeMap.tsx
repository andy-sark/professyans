import { motion } from 'framer-motion';

export interface MoleculeMapProps {
  formula: string[];
  clusters: Record<string, number>;
  cardsByCode: Record<string, { code: string; title: string }>;
}

export function MoleculeMap({ formula, clusters, cardsByCode }: MoleculeMapProps) {
  const moleculeByCluster: Record<number, string[]> = { 0: [], 1: [], 2: [] };
  for (const code of formula) {
    const idx = clusters[code];
    if (typeof idx === 'number') moleculeByCluster[idx].push(code);
  }

  return (
    <section className="mb-20">
      <div className="flex items-baseline justify-between mb-8">
        <h2 className="font-display">Твоя формула</h2>
        <span className="meta-label">
          {formula.length} карточек,{' '}
          {Object.values(moleculeByCluster).filter((a) => a.length > 0).length} ядра
        </span>
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
              <div className="font-display text-2xl text-sage-600 mb-4">Ядро {idx + 1}</div>
              <div className="space-y-3">
                {codes.map((code) => {
                  const c = cardsByCode[code];
                  if (!c) return null;
                  return (
                    <div
                      key={code}
                      className="pb-3 border-b border-paper-300 last:border-0 last:pb-0"
                    >
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
  );
}
