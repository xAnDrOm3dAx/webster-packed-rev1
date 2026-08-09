import { useState } from 'react';
import { DEFAULT_SLOT_LABELS, SLOTS } from '../lib/constants';
import { formatDoseText, formatFreeDoseText, type TabletUnit } from '../lib/quantity';
import type { Slot } from '../types';
import { DosePicker } from './DosePicker';
import { FreeDoseInput } from './FreeDoseInput';

type Props = {
  doses: Record<Slot, number>;
  onChange: (slot: Slot, value: number) => void;
  // 'tablet' shows the whole/part-tablet button picker; 'freeText' shows a
  // plain amount field instead, for forms that aren't measured in tablets
  // (SPEC.md section 5, "Not a tablet"). Defaults to 'tablet'.
  variant?: 'tablet' | 'freeText';
  // Only used when variant is 'tablet': "tablet" or "capsule", matching the
  // medication's Form field. Defaults to "tablet".
  unit?: TabletUnit;
};

// One time-of-day box is open at a time (DOSE ENTRY spec, "LAYOUT: ONE TIME
// OF DAY OPEN AT A TIME"). All four rows start collapsed; expanding one
// collapses whatever else was open.
export function DoseTimeList({ doses, onChange, variant = 'tablet', unit = 'tablet' }: Props) {
  const [expanded, setExpanded] = useState<Slot | null>(null);
  const formatText =
    variant === 'tablet' ? (q: number) => formatDoseText(q, unit) : formatFreeDoseText;

  return (
    <div className="flex flex-col gap-2">
      {SLOTS.map((slot) => {
        const isExpanded = expanded === slot;
        const panelId = `dose-panel-${slot}`;

        return (
          <div key={slot} className="overflow-hidden rounded-lg border border-slate-300">
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-controls={panelId}
              aria-label={`${DEFAULT_SLOT_LABELS[slot]}, ${formatText(doses[slot])}`}
              onClick={() => setExpanded((current) => (current === slot ? null : slot))}
              className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 text-lg"
            >
              <span className="font-medium text-slate-900" aria-hidden="true">
                {DEFAULT_SLOT_LABELS[slot]}
              </span>
              <span className="text-slate-700" aria-hidden="true">
                {formatText(doses[slot])}
              </span>
            </button>
            <div id={panelId} hidden={!isExpanded} className="border-t border-slate-300 p-3">
              {variant === 'tablet' ? (
                <DosePicker
                  value={doses[slot]}
                  onChange={(v) => onChange(slot, v)}
                  ariaLabel={DEFAULT_SLOT_LABELS[slot]}
                  unit={unit}
                />
              ) : (
                <FreeDoseInput
                  value={doses[slot]}
                  onChange={(v) => onChange(slot, v)}
                  ariaLabel={DEFAULT_SLOT_LABELS[slot]}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
