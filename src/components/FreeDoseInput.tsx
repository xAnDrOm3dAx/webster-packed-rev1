import { useState, type ChangeEvent } from 'react';

type Props = {
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
};

// The dose entry for non-tablet forms (injections, inhalers, liquids,
// other): a plain amount the person types in, not a set of preset
// whole/part-tablet buttons — there's no fixed set of doses to offer when
// the unit might be ml, puffs, or units (SPEC.md section 5, "Not a
// tablet"). Local text state mirrors DosePicker's custom-input pattern so a
// trailing decimal point isn't eaten while typing.
export function FreeDoseInput({ value, onChange, ariaLabel }: Props) {
  const [text, setText] = useState<string>(() => (value > 0 ? String(value) : ''));

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setText(raw);

    if (raw.trim() === '') {
      onChange(0);
      return;
    }

    const parsed = Number(raw);
    if (Number.isNaN(parsed) || parsed < 0) return;
    onChange(parsed);
  }

  return (
    <div>
      <label className="mb-1.5 block text-base font-medium text-slate-700">Dose</label>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onChange={handleChange}
        placeholder="Amount"
        aria-label={`${ariaLabel}: dose`}
        className="h-14 w-full rounded-md border-2 border-slate-400 px-3 text-lg text-slate-900"
      />
    </div>
  );
}
