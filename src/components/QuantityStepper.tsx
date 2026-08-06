import { QUICK_FRACTIONS, formatQuantity } from '../lib/quantity';

type Props = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export function QuantityStepper({ id, label, value, onChange }: Props) {
  return (
    <div className="rounded-lg border border-slate-300 p-3">
      <label htmlFor={id} className="mb-2 block text-lg font-medium text-slate-800">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step={0.25}
        value={value === 0 ? '' : value}
        placeholder="0"
        onChange={(e) => {
          const parsed = Number(e.target.value);
          onChange(e.target.value === '' || Number.isNaN(parsed) ? 0 : parsed);
        }}
        className="mb-2 h-14 w-full rounded-md border border-slate-400 px-3 text-lg text-slate-900"
      />
      <div className="flex flex-wrap gap-2">
        {QUICK_FRACTIONS.map((frac) => (
          <button
            key={frac}
            type="button"
            aria-pressed={value === frac}
            onClick={() => onChange(frac)}
            className="min-h-[56px] min-w-[56px] flex-1 rounded-md border border-slate-400 text-lg font-medium text-slate-800 aria-pressed:border-teal-700 aria-pressed:bg-teal-50 aria-pressed:text-teal-800"
          >
            {formatQuantity(frac)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(0)}
          className="min-h-[56px] min-w-[56px] flex-1 rounded-md border border-slate-400 text-lg font-medium text-slate-800"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
