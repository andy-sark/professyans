import type { MatchedHint } from '@/lib/common/hints';

export interface HintsListProps {
  hints: MatchedHint[];
}

export function HintsList({ hints }: HintsListProps) {
  if (hints.length === 0) return null;

  return (
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
              <div className="font-display text-[1.1rem] leading-snug">{h.hint.label}</div>
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
  );
}
