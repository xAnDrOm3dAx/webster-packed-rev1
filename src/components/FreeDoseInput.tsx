import { useState, type ChangeEvent } from 'react';
import { FREE_DOSE_MAX } from '../lib/quantity';

type Props = {
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  // Optional unit shown after the amount field (e.g. "ml"). Folded into
  // the aria-label as "Morning: dose in ml" when present.
  unit?: string;
};

// Strips everything except digits and a decimal point — no minus sign, no
// "e" (which would otherwise open a scientific-notation path) — and
// collapses multiple decimal points down to the first one. The free-text
// equivalent of DosePicker stripping non-digits from its custom whole-
// tablets field (DOSE ENTRY REVISION 2, FIX 2): invalid characters are
// rejected at entry, not accepted into the field and left to disagree with
// the stored dose.
function sanitize(raw: string): string {
  const kept = raw.replace(/[^0-9.]/g, '');
  const firstDot = kept.indexOf('.');
  if (firstDot === -1) return kept;
  return kept.slice(0, firstDot + 1) + kept.slice(firstDot + 1).replace(/\./g, '');
}

// The dose entry for non-tablet forms (injections, inhalers, liquids,
// other): a plain amount the person types in, not a set of preset
// whole/part-tablet buttons — there's no fixed set of doses to offer when
// the unit might be ml, puffs, or units (SPEC.md section 5, "Not a
// tablet"). Local text state mirrors DosePicker's custom-input pattern so a
// trailing decimal point isn't eaten while typing.
export function FreeDoseInput({ value, onChange, ariaLabel, unit }: Props) {
  const [text, setText] = useState<string>(() => (value > 0 ? String(value) : ''));
  const word = unit?.trim();

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const sanitized = sanitize(e.target.value);
    const digits = sanitized.replace('.', '');

    if (digits === '') {
      // No digits typed (field cleared, or every character typed was
      // invalid and got stripped) — the field and the dose must agree, so
      // this is 0, the same as an explicitly emptied field.
      setText(sanitized);
      onChange(0);
      return;
    }

    const parsed = Number(sanitized);
    if (parsed > FREE_DOSE_MAX) return;

    setText(sanitized);
    onChange(parsed);
  }

  return (
    <div>
      <label className="mb-1.5 block text-base font-medium text-slate-700">Dose</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={text}
          onChange={handleChange}
          placeholder="Amount"
          aria-label={word ? `${ariaLabel}: dose in ${word}` : `${ariaLabel}: dose`}
          className="h-14 min-w-0 flex-1 rounded-md border-2 border-slate-400 px-3 text-lg text-slate-900"
        />
        {word ? (
          <span className="shrink-0 text-lg text-slate-700" aria-hidden="true">
            {word}
          </span>
        ) : null}
      </div>
    </div>
  );
}
