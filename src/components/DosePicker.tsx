import type { ReactNode } from 'react';
import { DOSE_PART_OPTIONS, WHOLE_TABLET_OPTIONS, combineDose, splitQuantity } from '../lib/quantity';

type Props = {
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
};

// Selected buttons must be distinguishable by more than colour: a filled
// background, bold text, and a thicker border (see DOSE ENTRY spec,
// "SELECTED STATE").
const doseButtonClass =
  'flex min-h-[48px] min-w-[48px] flex-1 items-center justify-center rounded-md border-2 border-slate-400 px-1 text-base font-medium text-slate-800 aria-pressed:border-4 aria-pressed:border-slate-900 aria-pressed:bg-teal-800 aria-pressed:font-bold aria-pressed:text-white';

function DoseButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick} className={doseButtonClass}>
      {children}
    </button>
  );
}

// The dose picker: two single-select rows (whole tablets, part tablet).
// Tapping a button SETS that part of the dose; it never adds to or
// subtracts from the current value. The current value is always derived
// from `value` via splitQuantity, so loading a stored dose preselects both
// rows automatically.
export function DosePicker({ value, onChange, ariaLabel }: Props) {
  const { whole, fraction } = splitQuantity(value);

  return (
    <div>
      <p className="mb-1.5 text-base font-medium text-slate-700">Whole tablets</p>
      <div className="mb-3 flex gap-2" role="group" aria-label={`${ariaLabel}: whole tablets`}>
        {WHOLE_TABLET_OPTIONS.map((option) => (
          <DoseButton
            key={option}
            pressed={whole === option}
            onClick={() => onChange(combineDose(option, fraction))}
          >
            {option}
          </DoseButton>
        ))}
      </div>

      <p className="mb-1.5 text-base font-medium text-slate-700">Part tablet</p>
      <div className="flex gap-2" role="group" aria-label={`${ariaLabel}: part tablet`}>
        {DOSE_PART_OPTIONS.map((part) => (
          <DoseButton
            key={part.value}
            pressed={fraction === part.value}
            onClick={() => onChange(combineDose(whole, part.value))}
          >
            {part.label}
          </DoseButton>
        ))}
        <button
          type="button"
          onClick={() => onChange(0)}
          className="flex min-h-[48px] min-w-[48px] flex-1 items-center justify-center rounded-md border-2 border-slate-400 px-1 text-base font-medium text-slate-800"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
