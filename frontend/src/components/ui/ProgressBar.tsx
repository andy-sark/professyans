import clsx from 'clsx';

interface Props {
  current: number;
  total: number;
  /** Optional label shown to the right of the track */
  label?: string;
  className?: string;
}

/**
 * Honest progress indicator (spec §3.2: «честный прогресс-бар»).
 * Shows exact counts — not a vague percentage ring or animated blob.
 */
export function ProgressBar({ current, total, label, className }: Props) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
  return (
    <div className={clsx('flex items-center gap-4', className)}>
      <div className="flex-1 h-1.5 rounded-full bg-paper-300 overflow-hidden">
        <div
          className="h-full bg-sage-500 rounded-full transition-[width] duration-500 ease-paper"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
      <div className="font-mono text-sm text-ink-600 tabular-nums whitespace-nowrap">
        {label ?? `${current} из ${total}`}
      </div>
    </div>
  );
}
