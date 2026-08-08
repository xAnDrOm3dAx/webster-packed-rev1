import { useState } from 'react';
import { DEFAULT_SLOT_LABELS, SLOTS } from '../lib/constants';
import { formatDoseText } from '../lib/quantity';
import type { Slot } from '../types';
import { DosePicker } from './DosePicker';

type Props = {
  doses: Record<Slot, number>;
  onChange: (slot: Slot, value: number) => void;
};

// One time-of-day box is open at a time (DOSE ENTRY spec, "LAYOUT: ONE TIME
// OF DAY OPEN AT A TIME"). All four rows start collapsed; expanding one
// collapses whatever else was open.
export function DoseTimeList({ doses, onChange }: Props) {
  const [expanded, setExpanded] = useState<Slot | null>(null);

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
              aria-label={`${DEFAULT_SLOT_LABELS[slot]}, ${formatDoseText(doses[slot])}`}
              onClick={() => setExpanded((current) => (current === slot ? null : slot))}
              className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 text-lg"
            >
              <span className="font-medium text-slate-900" aria-hidden="true">
                {DEFAULT_SLOT_LABELS[slot]}
              </span>
              <span className="text-slate-700" aria-hidden="true">
                {formatDoseText(doses[slot])}
              </span>
            </button>
            {isExpanded && (
              <div id={panelId} className="border-t border-slate-300 p-3">
                <DosePicker
                  value={doses[slot]}
                  onChange={(v) => onChange(slot, v)}
                  ariaLabel={DEFAULT_SLOT_LABELS[slot]}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
