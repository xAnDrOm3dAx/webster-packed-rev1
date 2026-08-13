import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DoseTimeList } from '../components/DoseTimeList';
import {
  MEDICATION_FORMS,
  MEDICATION_FORM_LABELS,
  WEEKDAYS,
  WEEKDAY_LABELS,
} from '../lib/constants';
import {
  defaultFormState,
  defaultGoesInPack,
  dosesAfterFormChange,
  fromMedication,
  goesInPackLocked,
  isTabletForm,
  toMedicationInput,
  validateForm,
  type MedicationFormErrors,
  type MedicationFormState,
} from '../lib/medicationForm';
import * as repo from '../storage/repository';
import type { Medication, Weekday } from '../types';

// Order matches the fields as they appear on the page, so both the error
// summary and "jump to first error" focus follow the same reading order.
const ERROR_FIELD_ORDER: { key: keyof MedicationFormErrors; href: string }[] = [
  { key: 'name', href: '#name' },
  { key: 'doses', href: '#doses' },
  { key: 'days', href: '#days' },
  { key: 'directions', href: '#directions' },
];

export default function MedicationForm() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [existing, setExisting] = useState<Medication | undefined>(undefined);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState<MedicationFormState>(defaultFormState());
  const [touched, setTouched] = useState(false);
  const [failedSubmitCount, setFailedSubmitCount] = useState(0);

  const summaryRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const dosesRef = useRef<HTMLDivElement>(null);
  const daysRef = useRef<HTMLDivElement>(null);
  const directionsRef = useRef<HTMLTextAreaElement>(null);
  const fieldRefs: Record<keyof MedicationFormErrors, React.RefObject<HTMLElement | null>> = {
    name: nameRef,
    doses: dosesRef,
    days: daysRef,
    directions: directionsRef,
  };

  useEffect(() => {
    if (!id) return;
    const med = repo.getMedication(id);
    if (!med) {
      setNotFound(true);
      return;
    }
    setExisting(med);
    setForm(fromMedication(med));
  }, [id]);

  // The error summary only enters the DOM once `touched` is true, so its ref
  // isn't attached yet in the same event handler that fails validation.
  // Focus it in an effect once that render has committed.
  useEffect(() => {
    if (failedSubmitCount > 0) summaryRef.current?.focus();
  }, [failedSubmitCount]);

  if (isEditing && notFound) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <p className="text-lg text-slate-700">That medication could not be found.</p>
        <Link to="/medications" className="mt-4 inline-block text-lg text-teal-800 underline">
          Back to medications
        </Link>
      </main>
    );
  }

  const errors = touched ? validateForm(form) : {};

  function update<K extends keyof MedicationFormState>(key: K, value: MedicationFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // asNeeded and asDirected medications never go in the pack (SPEC.md section 5).
  function updateScheduleType(value: MedicationFormState['scheduleType']) {
    setForm((f) => ({
      ...f,
      scheduleType: value,
      goesInPack: value === 'fixed' ? f.goesInPack : false,
    }));
  }

  function toggleDay(day: Weekday) {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  }

  function focusField(key: keyof MedicationFormErrors) {
    fieldRefs[key].current?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setFailedSubmitCount((n) => n + 1);
      return;
    }

    const input = toMedicationInput(form);
    if (existing) {
      repo.updateMedication(existing.id, input);
    } else {
      const sortOrder = repo.listMedications().length;
      repo.createMedication({ ...input, active: true, sortOrder });
    }
    navigate('/medications');
  }

  function handleArchiveToggle() {
    if (!existing) return;
    repo.updateMedication(existing.id, { active: !existing.active });
    navigate('/medications');
  }

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">
        {isEditing ? 'Edit medication' : 'Add medication'}
      </h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {touched && Object.keys(errors).length > 0 && (
          <div
            ref={summaryRef}
            tabIndex={-1}
            aria-labelledby="error-summary-heading"
            className="rounded-lg border-2 border-red-800 bg-red-50 p-4"
          >
            <p id="error-summary-heading" className="text-lg font-semibold text-red-900">
              {Object.keys(errors).length === 1
                ? 'There is 1 problem to fix'
                : `There are ${Object.keys(errors).length} problems to fix`}
            </p>
            <ul className="mt-2 list-disc pl-5">
              {ERROR_FIELD_ORDER.filter((f) => errors[f.key]).map((f) => (
                <li key={f.key}>
                  <a
                    href={f.href}
                    className="text-lg text-red-800 underline"
                    onClick={(e) => {
                      e.preventDefault();
                      focusField(f.key);
                    }}
                  >
                    {errors[f.key]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label htmlFor="name" className="mb-1 block text-lg font-medium text-slate-800">
            Name
          </label>
          <input
            id="name"
            ref={nameRef}
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className="h-14 w-full rounded-md border border-slate-400 px-3 text-lg text-slate-900"
            placeholder="Bisoprolol 5mg tablets"
          />
          {errors.name && (
            <p id="name-error" className="mt-1 text-base text-red-800">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="brandName" className="mb-1 block text-lg font-medium text-slate-800">
            Brand name (optional)
          </label>
          <input
            id="brandName"
            type="text"
            value={form.brandName}
            onChange={(e) => update('brandName', e.target.value)}
            className="h-14 w-full rounded-md border border-slate-400 px-3 text-lg text-slate-900"
            placeholder="Bicor"
          />
        </div>

        <div>
          <label htmlFor="purpose" className="mb-1 block text-lg font-medium text-slate-800">
            What it's for (optional)
          </label>
          <input
            id="purpose"
            type="text"
            value={form.purpose}
            onChange={(e) => update('purpose', e.target.value)}
            className="h-14 w-full rounded-md border border-slate-400 px-3 text-lg text-slate-900"
            placeholder="Improve heart function"
          />
        </div>

        <div>
          <label htmlFor="form" className="mb-1 block text-lg font-medium text-slate-800">
            Form
          </label>
          <select
            id="form"
            value={form.form}
            onChange={(e) => {
              const nextForm = e.target.value as MedicationFormState['form'];
              setForm((f) => ({
                ...f,
                form: nextForm,
                doses: dosesAfterFormChange(f, nextForm),
                goesInPack: defaultGoesInPack(nextForm),
                // The unit word belongs to form 'other' only (SPEC.md
                // section 5) — leaving 'other' clears it.
                doseUnit: nextForm === 'other' ? f.doseUnit : '',
              }));
            }}
            className="h-14 w-full rounded-md border border-slate-400 px-3 text-lg text-slate-900"
          >
            {MEDICATION_FORMS.map((f) => (
              <option key={f} value={f}>
                {MEDICATION_FORM_LABELS[f]}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="mb-2 text-lg font-medium text-slate-800">Schedule</legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['fixed', 'Fixed schedule'],
                ['asNeeded', 'As needed'],
                ['asDirected', 'As directed'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={form.scheduleType === value}
                onClick={() => updateScheduleType(value)}
                className="min-h-[56px] flex-1 rounded-md border border-slate-400 px-3 text-lg font-medium text-slate-800 aria-pressed:border-teal-700 aria-pressed:bg-teal-50 aria-pressed:text-teal-800"
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {form.scheduleType === 'fixed' ? (
          <>
            <div id="doses" ref={dosesRef} tabIndex={-1}>
              <p className="mb-2 text-lg font-medium text-slate-800">Dose per time of day</p>
              <DoseTimeList
                doses={form.doses}
                onChange={(slot, v) => update('doses', { ...form.doses, [slot]: v })}
                variant={isTabletForm(form.form) ? 'tablet' : 'freeText'}
                unit={form.form === 'capsule' ? 'capsule' : 'tablet'}
                freeUnit={form.form === 'other' ? form.doseUnit : undefined}
              />
              {errors.doses && <p className="mt-1 text-base text-red-800">{errors.doses}</p>}
            </div>

            <fieldset>
              <legend className="mb-2 text-lg font-medium text-slate-800">Frequency</legend>
              <div className="flex gap-2">
                {(
                  [
                    ['daily', 'Every day'],
                    ['specificDays', 'Specific days'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={form.frequency === value}
                    onClick={() => update('frequency', value)}
                    className="min-h-[56px] flex-1 rounded-md border border-slate-400 px-3 text-lg font-medium text-slate-800 aria-pressed:border-teal-700 aria-pressed:bg-teal-50 aria-pressed:text-teal-800"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            {form.frequency === 'specificDays' && (
              <div id="days" ref={daysRef} tabIndex={-1}>
                <p className="mb-2 text-lg font-medium text-slate-800">Which days</p>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={form.days.includes(day)}
                      onClick={() => toggleDay(day)}
                      className="min-h-[56px] min-w-[56px] flex-1 rounded-md border border-slate-400 text-lg font-medium text-slate-800 aria-pressed:border-teal-700 aria-pressed:bg-teal-50 aria-pressed:text-teal-800"
                    >
                      {WEEKDAY_LABELS[day]}
                    </button>
                  ))}
                </div>
                {errors.days && <p className="mt-1 text-base text-red-800">{errors.days}</p>}
              </div>
            )}
          </>
        ) : (
          <div>
            <label htmlFor="directions" className="mb-1 block text-lg font-medium text-slate-800">
              Directions
            </label>
            <textarea
              id="directions"
              ref={directionsRef}
              rows={4}
              value={form.directions}
              onChange={(e) => update('directions', e.target.value)}
              aria-invalid={Boolean(errors.directions)}
              aria-describedby={errors.directions ? 'directions-error' : undefined}
              className="w-full rounded-md border border-slate-400 px-3 py-2 text-lg text-slate-900"
              placeholder="Take as directed"
            />
            {errors.directions && (
              <p id="directions-error" className="mt-1 text-base text-red-800">
                {errors.directions}
              </p>
            )}
          </div>
        )}

        {form.scheduleType === 'fixed' ? (
          <>
            <div className="flex min-h-[56px] items-center gap-3">
              <input
                id="goesInPack"
                type="checkbox"
                checked={goesInPackLocked(form.form) ? false : form.goesInPack}
                disabled={goesInPackLocked(form.form)}
                onChange={(e) => update('goesInPack', e.target.checked)}
                className="h-7 w-7 disabled:opacity-50"
              />
              <label htmlFor="goesInPack" className="text-lg text-slate-800">
                Goes in the pack
              </label>
            </div>
            <p className="-mt-3 text-base text-slate-700">
              {goesInPackLocked(form.form)
                ? 'Off automatically — injections, inhalers, and liquids never go in the pack.'
                : "Turn off for anything that isn't a tablet or capsule sitting in the tray."}
            </p>
            {form.form === 'other' && form.goesInPack && (
              <div>
                <label htmlFor="doseUnit" className="mb-1 block text-lg font-medium text-slate-800">
                  What are these called? (optional)
                </label>
                <input
                  id="doseUnit"
                  type="text"
                  value={form.doseUnit}
                  onChange={(e) => update('doseUnit', e.target.value)}
                  className="h-14 w-full rounded-md border border-slate-400 px-3 text-lg text-slate-900"
                  placeholder="sachet"
                />
                <p className="mt-1 text-base text-slate-700">
                  One word, like "sachet" or "wafer" — doses will show as "2 sachets". Leave blank
                  to show the number alone.
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-base text-slate-700">
            As-needed and as-directed medications are never packed into the tray.
          </p>
        )}

        <div>
          <label htmlFor="notes" className="mb-1 block text-lg font-medium text-slate-800">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            rows={2}
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            className="w-full rounded-md border border-slate-400 px-3 py-2 text-lg text-slate-900"
            placeholder="Swallow whole, with food"
          />
        </div>

        <div className="mt-2 flex flex-wrap gap-3">
          <button
            type="submit"
            className="min-h-[56px] flex-1 rounded-md bg-teal-800 px-5 text-lg font-medium text-white"
          >
            {isEditing ? 'Save changes' : 'Add medication'}
          </button>
          <Link
            to="/medications"
            className="flex min-h-[56px] flex-1 items-center justify-center rounded-md border border-slate-400 px-5 text-lg font-medium text-slate-800"
          >
            Cancel
          </Link>
        </div>

        {existing && (
          <button
            type="button"
            onClick={handleArchiveToggle}
            className="min-h-[56px] rounded-md border border-slate-400 px-5 text-lg font-medium text-slate-800"
          >
            {existing.active ? 'Archive this medication' : 'Restore this medication'}
          </button>
        )}
      </form>
    </main>
  );
}
