import type { ReactNode } from 'react';

export interface CardsBadgeListProps {
  title: string;
  description: ReactNode;
  cards: string[];
  variant: 'growth' | 'stop';
  cardsByCode: Record<string, { code: string; title: string }>;
}

export function CardsBadgeList({
  title,
  description,
  cards,
  variant,
  cardsByCode,
}: CardsBadgeListProps) {
  if (cards.length === 0) return null;

  if (variant === 'growth') {
    return (
      <section className="mb-16">
        <h2 className="font-display mb-4">{title}</h2>
        <p className="text-ink-700 mb-6 max-w-3xl leading-relaxed text-pretty">{description}</p>
        <div className="flex flex-wrap gap-2">
          {cards.map((code) => {
            const c = cardsByCode[code];
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
    );
  }

  return (
    <section className="mb-16">
      <h2 className="font-display mb-4">{title}</h2>
      <p className="text-ink-700 mb-6 max-w-3xl leading-relaxed text-pretty">{description}</p>
      <div className="flex flex-wrap gap-1.5">
        {cards.map((code) => {
          const c = cardsByCode[code];
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
  );
}
