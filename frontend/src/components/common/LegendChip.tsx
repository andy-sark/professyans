/**
 * Legend chip for card-state ring used in ranking screens.
 * Method-agnostic.
 */

export interface LegendChipProps {
  color: string;
  label: string;
  desc: string;
}

export function LegendChip({ color, label, desc }: LegendChipProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded border-2 ${color} shrink-0`} />
      <div>
        <div className="font-ui font-medium text-ink-900 text-[13px]">{label}</div>
        <div className="text-xs text-ink-600">{desc}</div>
      </div>
    </div>
  );
}
