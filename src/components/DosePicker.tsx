import { useState, type ReactNode } from 'react';
import {
  DOSE_PART_OPTIONS,
  MAIN_DOSE_OPTIONS,
  WHOLE_TABLET_OPTIONS,
  clearDose,
  combineDose,
  formatDoseText,
  formatQuantity,
  matchingMainOption,
  selectDose,
  splitQuantity,
} from '../lib/quantity';

type Props = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
};

// Selected buttons must be distinguishable by more than border colour: a
// filled background, bold text, and a checkmark (see DOSE ENTRY spec,
// "SELECTED STATE").
const doseButtonClass =
  'flex min-h-[48px] min-w-[48px] flex-1 items-center justify-center gap-1.5 rounded-md border-2 border-slate-400 px-2 text-lg font-medium text-slate-800 aria-pressed:border-teal-800 aria-pressed:bg-teal-800 aria-pressed:font-bold aria-pressed:text-white';

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
      {pressed && <span aria-hidden="true">✓</span>}
      {children}
    </button>
  );
}

export function DosePicker({ id, label, value, onChange }: Props) {
  const [otherOpen, setOtherOpen] = useState(false);
  const initialSplit = splitQuantity(value);
  const [draftWhole, setDraftWhole] = useState<number>(initialSplit.whole);
  const [draftPart, setDraftPart] = useState<number>(initialSplit.fraction);

  const mainSelected = matchingMainOption(value);
  const otherSelected = value > 0 && mainSelected === null;

  function openOther() {
    const split = splitQuantity(value);
    setDraftWhole(split.whole);
    setDraftPart(split.fraction);
    setOtherOpen(true);
  }

  function handleDone() {
    onChange(combineDose(draftWhole, draftPart));
    setOtherOpen(false);
  }

  return (
    <div className="rounded-lg border border-slate-300 p-3">
      <p id={id} className="mb-1 text-lg font-medium text-slate-800">
        {label}
      </p>
      <p className="mb-3 text-xl text-slate-900">{formatDoseText(value)}</p>

      <div className="flex flex-wrap gap-2" role="group" aria-labelledby={id}>
        {MAIN_DOSE_OPTIONS.map((opt) => (
          <DoseButton
            key={opt}
            pressed={mainSelected === opt}
            onClick={() => onChange(selectDose(value, opt))}
          >
            {formatQuantity(opt)}
          </DoseButton>
        ))}
        <DoseButton pressed={otherSelected} onClick={openOther}>
          Other…
        </DoseButton>
        <button
          type="button"
          onClick={() => {
            onChange(clearDose());
            setOtherOpen(false);
          }}
          className="flex min-h-[48px] min-w-[48px] flex-1 items-center justify-center rounded-md border-2 border-slate-400 px-2 text-lg font-medium text-slate-800"
        >
          Clear
        </button>
      </div>

      {otherOpen && (
        <div className="mt-3 rounded-md border border-slate-300 bg-slate-50 p-3">
          <p className="mb-2 text-base font-medium text-slate-800">Whole tablets</p>
          <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Whole tablets">
            {WHOLE_TABLET_OPTIONS.map((whole) => (
              <DoseButton key={whole} pressed={draftWhole === whole} onClick={() => setDraftWhole(whole)}>
                {whole}
              </DoseButton>
            ))}
          </div>

          <p className="mb-2 text-base font-medium text-slate-800">Part tablet</p>
          <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Part tablet">
            {DOSE_PART_OPTIONS.map((part) => (
              <DoseButton
                key={part.value}
                pressed={draftPart === part.value}
                onClick={() => setDraftPart(part.value)}
              >
                {part.label}
              </DoseButton>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDone}
              className="min-h-[48px] flex-1 rounded-md bg-teal-800 px-3 text-lg font-medium text-white"
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => setOtherOpen(false)}
              className="min-h-[48px] flex-1 rounded-md border-2 border-slate-400 px-3 text-lg font-medium text-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
