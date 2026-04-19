/**
 * Formula tray — shows selected formula cards as pills with remove
 * action, displays counter and validation issues inline.
 * Method-agnostic: counter format derives from formulaSize + bonusSize.
 */

import { AnimatePresence, motion } from 'framer-motion';
import type { FormulaValidation } from '@/lib/common/validation';

export interface FormulaTrayProps {
  formula: string[];
  cardsByCode: Record<string, { code: string; title: string }>;
  validation: FormulaValidation;
  formulaSize: number;
  bonusSize?: number;
  onRemove: (code: string) => void;
}

export function FormulaTray({
  formula,
  cardsByCode,
  validation,
  formulaSize,
  bonusSize = 0,
  onRemove,
}: FormulaTrayProps) {
  const counterText =
    bonusSize > 0
      ? `${formula.length} / ${formulaSize}-${formulaSize + bonusSize}`
      : `${formula.length} / ${formulaSize}`;

  return (
    <div className="mb-10 paper-card p-6 md:p-8 bg-paper-50 border-sage-300">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="font-display text-xl">Твоя формула</h2>
        <div className="meta-label">{counterText}</div>
      </div>

      {formula.length === 0 ? (
        <div className="py-8 text-center text-ink-500 italic">
          пока пусто — добавь карточки из списка ниже
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          <AnimatePresence mode="popLayout">
            {formula.map((code) => {
              const c = cardsByCode[code];
              if (!c) return null;
              return (
                <motion.button
                  layout
                  key={code}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => onRemove(code)}
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
  );
}
