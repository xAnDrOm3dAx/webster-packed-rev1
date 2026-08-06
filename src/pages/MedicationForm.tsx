import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { QuantityStepper } from '../components/QuantityStepper';
import {
  DEFAULT_SLOT_LABELS,
  MEDICATION_FORMS,
  MEDICATION_FORM_LABELS,
  SLOTS,
  WEEKDAYS,
  WEEKDAY_LABELS,
} from '../lib/constants';
import {
  defaultFormState,
  defaultGoesInPack,
  fromMedication,
  toMedicationInput,
  validateForm,
  type MedicationFormState,
} from '../lib/medicationForm';
import * as repo from '../storage/repository';
import type { Medication, Weekday } from '../types';

export default function MedicationForm() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [existing, setExisting] = useState<Medication | undefined>(undefined);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState<MedicationFormState>(defaultFormState());
  const [touched, setTouched] = useState(false);

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

  if (isEditing && notFound) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <p className="text-lg text-slate-700">That medication could not be found.</p>
        <Link to="/medications" className="mt-4 inline-block text-lg text-teal-700 underline">
          Back to medications
        </Link>
      </main>
    );
  }

  const errors = touched ? validateForm(form) : {};

  function update<K extends keyof MedicationFormState>(key: K, value: MedicationFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleDay(day: Weekday) {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) return;

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
        <div>
          <label htmlFor="name" className="mb-1 block text-lg font-medium text-slate-800">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className="h-14 w-full rounded-md border border-slate-400 px-3 text-lg text-slate-900"
            placeholder="Bisoprolol 5mg tablets"
          />
          {errors.name && (
            <p id="name-error" className="mt-1 text-base text-red-700">
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
              setForm((f) => ({ ...f, form: nextForm, goesInPack: defaultGoesInPack(nextForm) }));
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
                onClick={() => update('scheduleType', value)}
                className="min-h-[56px] flex-1 rounded-md border border-slate-400 px-3 text-lg font-medium text-slate-800 aria-pressed:border-teal-700 aria-pressed:bg-teal-50 aria-pressed:text-teal-800"
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {form.scheduleType === 'fixed' ? (
          <>
            <div>
              <p className="mb-2 text-lg font-medium text-slate-800">Dose per time of day</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SLOTS.map((slot) => (
                  <QuantityStepper
                    key={slot}
                    id={`dose-${slot}`}
                    label={DEFAULT_SLOT_LABELS[slot]}
                    value={form.doses[slot]}
                    onChange={(v) => update('doses', { ...form.doses, [slot]: v })}
                  />
                ))}
              </div>
              {errors.doses && <p className="mt-1 text-base text-red-700">{errors.doses}</p>}
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
              <div>
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
                {errors.days && <p className="mt-1 text-base text-red-700">{errors.days}</p>}
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
              rows={4}
              value={form.directions}
              onChange={(e) => update('directions', e.target.value)}
              aria-invalid={Boolean(errors.directions)}
              aria-describedby={errors.directions ? 'directions-error' : undefined}
              className="w-full rounded-md border border-slate-400 px-3 py-2 text-lg text-slate-900"
              placeholder="Take as directed"
            />
            {errors.directions && (
              <p id="directions-error" className="mt-1 text-base text-red-700">
                {errors.directions}
              </p>
            )}
          </div>
        )}

        <div className="flex min-h-[56px] items-center gap-3">
          <input
            id="goesInPack"
            type="checkbox"
            checked={form.goesInPack}
            onChange={(e) => update('goesInPack', e.target.checked)}
            className="h-7 w-7"
          />
          <label htmlFor="goesInPack" className="text-lg text-slate-800">
            Goes in the pack
          </label>
        </div>
        <p className="-mt-3 text-base text-slate-600">
          Turn off for inhalers, injections, liquids, and anything else that isn't a tablet or
          capsule sitting in the tray.
        </p>

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
            className="min-h-[56px] flex-1 rounded-md bg-teal-700 px-5 text-lg font-medium text-white"
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
