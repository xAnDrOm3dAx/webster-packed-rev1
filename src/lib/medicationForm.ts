// Pure form-state logic for adding/editing a medication (SPEC.md section 5 and 7).
// Kept separate from the React component so the awkward cases in section 5 can
// be tested directly, without rendering anything.

import type { Medication, Slot, Weekday } from '../types';
import { SLOTS } from './constants';
import { formatQuantity } from './quantity';

export type MedicationFormType = Medication['form'];
export type ScheduleType = Medication['scheduleType'];

export type MedicationFormState = {
  name: string;
  brandName: string;
  purpose: string;
  form: MedicationFormType;
  scheduleType: ScheduleType;
  doses: Record<Slot, number>;
  frequency: 'daily' | 'specificDays';
  days: Weekday[];
  directions: string;
  goesInPack: boolean;
  notes: string;
};

// Whether a form is measured in whole/part tablets, as opposed to a plain
// amount (SPEC.md section 5, "Not a tablet").
export function isTabletForm(form: MedicationFormType): boolean {
  return form === 'tablet' || form === 'capsule';
}

// Forms the spec is explicit never go in the pack (SPEC.md section 4:
// "goesInPack: false for inhalers, injections, liquids"). 'other' is left
// as a user choice, since it might still be something that gets packed
// (a patch, a sachet) — unlike these three, which never are.
const NEVER_PACKED_FORMS: MedicationFormType[] = ['injection', 'inhaler', 'liquid'];

export function goesInPackLocked(form: MedicationFormType): boolean {
  return NEVER_PACKED_FORMS.includes(form);
}

// Tablets and capsules go in the pack by default; everything else (inhalers,
// injections, liquids, other) does not (SPEC.md section 5, "Not a tablet").
export function defaultGoesInPack(form: MedicationFormType): boolean {
  return isTabletForm(form);
}

export function emptyDoses(): Record<Slot, number> {
  return { morning: 0, noon: 0, evening: 0, night: 0 };
}

// The doses to keep when the Form field changes. Crossing the
// tablet/non-tablet boundary changes what the number means — 250 is a
// plausible dose in ml but not in tablets — and the two entry controls
// enforce different ceilings (FREE_DOSE_MAX 999 vs CUSTOM_WHOLE_MAX 10).
// Carrying a value across that boundary smuggles a non-tablet amount into
// the tablet picker, past the cap that only ever gets applied at the
// keystroke. So the doses reset. Changing form within one side (tablet to
// capsule, liquid to injection) keeps them: the numbers still mean the
// same thing there.
export function dosesAfterFormChange(
  state: MedicationFormState,
  nextForm: MedicationFormType,
): Record<Slot, number> {
  if (isTabletForm(state.form) === isTabletForm(nextForm)) return state.doses;
  return emptyDoses();
}

export function defaultFormState(): MedicationFormState {
  return {
    name: '',
    brandName: '',
    purpose: '',
    form: 'tablet',
    scheduleType: 'fixed',
    doses: emptyDoses(),
    frequency: 'daily',
    days: [],
    directions: '',
    goesInPack: true,
    notes: '',
  };
}

export function fromMedication(med: Medication): MedicationFormState {
  return {
    name: med.name,
    brandName: med.brandName ?? '',
    purpose: med.purpose ?? '',
    form: med.form,
    scheduleType: med.scheduleType,
    doses: med.doses ?? emptyDoses(),
    frequency: med.frequency ?? 'daily',
    days: med.days ?? [],
    directions: med.directions ?? '',
    goesInPack: med.goesInPack,
    notes: med.notes ?? '',
  };
}

export type MedicationFormErrors = Partial<
  Record<'name' | 'doses' | 'days' | 'directions', string>
>;

export function validateForm(state: MedicationFormState): MedicationFormErrors {
  const errors: MedicationFormErrors = {};

  if (state.name.trim() === '') {
    errors.name = 'Enter a name';
  }

  if (state.scheduleType === 'fixed') {
    const hasDose = SLOTS.some((slot) => state.doses[slot] > 0);
    if (!hasDose) {
      errors.doses = 'Enter a dose for at least one time of day';
    }
    if (state.frequency === 'specificDays' && state.days.length === 0) {
      errors.days = 'Choose at least one day';
    }
  } else {
    if (state.directions.trim() === '') {
      errors.directions = 'Add directions';
    }
  }

  return errors;
}

// Builds the Medication fields that come from the form. id, active, and
// sortOrder are assigned by the caller (repository.ts owns id; the page
// decides sortOrder and active state).
export function toMedicationInput(
  state: MedicationFormState,
): Omit<Medication, 'id' | 'active' | 'sortOrder'> {
  // asNeeded and asDirected medications generate no compartments, so they
  // never go in the pack (SPEC.md section 5, "when required" / "as directed").
  // Injections, inhalers, and liquids never go in the pack either, regardless
  // of what the (disabled) checkbox happens to hold.
  const goesInPack =
    state.scheduleType === 'fixed' ? state.goesInPack && !goesInPackLocked(state.form) : false;

  const base = {
    name: state.name.trim(),
    brandName: state.brandName.trim() || undefined,
    purpose: state.purpose.trim() || undefined,
    form: state.form,
    goesInPack,
    notes: state.notes.trim() || undefined,
  };

  if (state.scheduleType === 'fixed') {
    return {
      ...base,
      scheduleType: 'fixed',
      doses: { ...state.doses },
      frequency: state.frequency,
      days: state.frequency === 'specificDays' ? state.days : undefined,
      directions: undefined,
    };
  }

  return {
    ...base,
    scheduleType: state.scheduleType,
    doses: undefined,
    frequency: undefined,
    days: undefined,
    directions: state.directions.trim(),
  };
}

export function doseSummary(
  med: Medication,
  slotLabels: Record<Slot, string>,
): string {
  if (med.scheduleType !== 'fixed' || !med.doses) return '';
  return SLOTS.filter((slot) => (med.doses?.[slot] ?? 0) > 0)
    .map((slot) => `${formatQuantity(med.doses![slot])} ${slotLabels[slot].toLowerCase()}`)
    .join(', ');
}

export function frequencySummary(
  med: Medication,
  weekdayLabels: Record<Weekday, string>,
): string {
  if (med.scheduleType !== 'fixed') return '';
  if (med.frequency === 'specificDays') {
    return (med.days ?? []).map((d) => weekdayLabels[d]).join(', ');
  }
  return 'Daily';
}
