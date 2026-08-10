import { useState, type ChangeEvent, type ReactNode } from 'react';
import {
  CUSTOM_WHOLE_MAX,
  DOSE_PART_OPTIONS,
  WHOLE_TABLET_OPTIONS,
  combineDose,
  splitQuantity,
  type TabletUnit,
} from '../lib/quantity';

type Props = {
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  // "tablet" or "capsule", matching the medication's Form field. Defaults
  // to "tablet" for callers that don't care (e.g. tests).
  unit?: TabletUnit;
};

// Which control last set the whole-tablets count: one of the fixed
// buttons, or the custom field. The two must never show as selected at
// once, so this can't be inferred from the numeric value alone (see DOSE
// ENTRY REVISION 2, FIX 1) — typing "3" into the custom field must not
// also light up the fixed "3" button.
type WholeSource = 'fixed' | 'custom';

// Selected buttons must be distinguishable by more than colour: a filled
// background, bold text, and a thicker border (see DOSE ENTRY spec,
// "SELECTED STATE").
const doseButtonClass =
  'flex min-h-[56px] min-w-[56px] flex-1 items-center justify-center rounded-md border-2 border-slate-400 px-1 text-base font-medium text-slate-800 aria-pressed:border-4 aria-pressed:border-slate-900 aria-pressed:bg-teal-800 aria-pressed:font-bold aria-pressed:text-white';

const customInputClass =
  'flex min-h-[56px] min-w-[56px] flex-1 items-center justify-center rounded-md border-2 px-1 text-center text-base font-medium';

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
export function DosePicker({ value, onChange, ariaLabel, unit = 'tablet' }: Props) {
  const { whole, fraction } = splitQuantity(value);

  // The last slot in the whole-tablets row is a custom number input (whole
  // numbers only, capped at CUSTOM_WHOLE_MAX) rather than a fixed "5"
  // button, so doses above 4 tablets can still be entered. customText is
  // local: it only needs to track what's been typed, and is cleared
  // whenever a fixed button (or Clear) is pressed instead.
  const [wholeSource, setWholeSource] = useState<WholeSource>(() => (whole > 4 ? 'custom' : 'fixed'));
  const [customText, setCustomText] = useState<string>(() => (whole > 4 ? String(whole) : ''));

  function selectWhole(option: number) {
    setWholeSource('fixed');
    setCustomText('');
    onChange(combineDose(option, fraction));
  }

  function handleCustomChange(e: ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '');

    if (digits === '') {
      // Emptying the field must clear the whole-tablets count too, so the
      // stored dose never disagrees with what the field displays (DOSE
      // ENTRY REVISION 2, FIX 2).
      setWholeSource('custom');
      setCustomText('');
      onChange(combineDose(0, fraction));
      return;
    }

    if (Number(digits) > CUSTOM_WHOLE_MAX) return;

    setWholeSource('custom');
    setCustomText(digits);
    onChange(combineDose(Number(digits), fraction));
  }

  function handleClear() {
    setWholeSource('fixed');
    setCustomText('');
    onChange(0);
  }

  return (
    <div>
      <p className="mb-1.5 text-base font-medium text-slate-700">Whole {unit}s</p>
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label={`${ariaLabel}: whole ${unit}s`}>
        {WHOLE_TABLET_OPTIONS.map((option) => (
          <DoseButton
            key={option}
            pressed={wholeSource === 'fixed' && whole === option}
            onClick={() => selectWhole(option)}
          >
            {option}
          </DoseButton>
        ))}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={customText}
          onChange={handleCustomChange}
          placeholder="Custom"
          aria-label={`${ariaLabel}: custom whole ${unit}s, up to ${CUSTOM_WHOLE_MAX}`}
          className={
            customInputClass +
            (wholeSource === 'custom' && customText !== ''
              ? ' border-slate-900 border-4 bg-teal-800 font-bold text-white placeholder:text-white'
              : ' border-slate-400 text-slate-800 placeholder:text-slate-500')
          }
        />
      </div>

      <p className="mb-1.5 text-base font-medium text-slate-700">Part {unit}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={`${ariaLabel}: part ${unit}`}>
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
          className="flex min-h-[56px] min-w-[56px] flex-1 items-center justify-center rounded-md border-2 border-slate-400 px-1 text-base font-medium text-slate-800"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
