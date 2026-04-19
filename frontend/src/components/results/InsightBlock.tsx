export interface InsightBlockProps {
  label: string;
  cards: string[];
  explainer: string;
  cardsByCode: Record<string, { code: string; title: string }>;
}

export function InsightBlock({ label, cards, explainer, cardsByCode }: InsightBlockProps) {
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
          const c = cardsByCode[code];
          if (!c) return null;
          return (
            <span
              key={code}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded
                         bg-paper-200 text-xs text-ink-700"
            >
              <span className="font-mono opacity-60">{c.code}</span>
              <span>{c.title}</span>
            </span>
          );
        })}
      </div>
      <div className="text-sm text-ink-600 italic leading-relaxed text-pretty">{explainer}</div>
    </div>
  );
}
