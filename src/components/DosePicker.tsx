import { useState, type ChangeEvent, type ReactNode } from 'react';
import {
  CUSTOM_WHOLE_MAX,
  DOSE_PART_OPTIONS,
  WHOLE_TABLET_OPTIONS,
  combineDose,
  splitQuantity,
} from '../lib/quantity';

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

const customInputClass =
  'flex min-h-[48px] min-w-[48px] flex-1 items-center justify-center rounded-md border-2 px-1 text-center text-base font-medium';

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

  // The last slot in the whole-tablets row is a custom number input (whole
  // numbers only, capped at CUSTOM_WHOLE_MAX) rather than a fixed "5"
  // button, so doses above 4 tablets can still be entered. Its text is
  // local: it only needs to track what's been typed, and is cleared
  // whenever a fixed button (or Clear) is pressed instead.
  const [customText, setCustomText] = useState<string>(() => (whole > 4 ? String(whole) : ''));
  const customSelected = whole > 4;

  function selectWhole(option: number) {
    setCustomText('');
    onChange(combineDose(option, fraction));
  }

  function handleCustomChange(e: ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (digits === '') {
      setCustomText('');
      return;
    }
    if (Number(digits) > CUSTOM_WHOLE_MAX) return;
    setCustomText(digits);
    onChange(combineDose(Number(digits), fraction));
  }

  function handleClear() {
    setCustomText('');
    onChange(0);
  }

  return (
    <div>
      <p className="mb-1.5 text-base font-medium text-slate-700">Whole tablets</p>
      <div className="mb-3 flex gap-2" role="group" aria-label={`${ariaLabel}: whole tablets`}>
        {WHOLE_TABLET_OPTIONS.map((option) => (
          <DoseButton key={option} pressed={whole === option} onClick={() => selectWhole(option)}>
            {option === 0 ? 'None' : option}
          </DoseButton>
        ))}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={customText}
          onChange={handleCustomChange}
          placeholder="Custom"
          aria-label={`${ariaLabel}: custom whole tablets, up to ${CUSTOM_WHOLE_MAX}`}
          className={
            customInputClass +
            (customSelected
              ? ' border-slate-900 border-4 bg-teal-800 font-bold text-white placeholder:text-white'
              : ' border-slate-400 text-slate-800 placeholder:text-slate-500')
          }
        />
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
          onClick={handleClear}
          className="flex min-h-[48px] min-w-[48px] flex-1 items-center justify-center rounded-md border-2 border-slate-400 px-1 text-base font-medium text-slate-800"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
