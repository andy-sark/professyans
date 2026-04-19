/**
 * Track-selection card used in method intro screens
 * (activating / closed track choice per spec §4.7).
 * Method-agnostic.
 */

import type { ReactNode } from 'react';

export interface TrackOptionProps {
  label: string;
  tag: string;
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}

export function TrackOption({ label, tag, selected, onSelect, children }: TrackOptionProps) {
  return (
    <button
      onClick={onSelect}
      className={`text-left paper-card p-6 border-2 transition-all duration-200 ease-paper
                  ${selected ? 'border-sage-500 bg-sage-100 shadow-card-raised' : 'border-paper-300 hover:border-ink-400'}`}
      aria-pressed={selected}
    >
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <span className="font-display text-xl">{label}</span>
        <span className="meta-label">{tag}</span>
      </div>
      <p className="text-[14.5px] text-ink-700 leading-relaxed text-pretty">
        {children}
      </p>
    </button>
  );
}
