import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_SLOT_LABELS, MEDICATION_FORM_LABELS, WEEKDAY_LABELS } from '../lib/constants';
import { doseSummary, frequencySummary } from '../lib/medicationForm';
import * as repo from '../storage/repository';
import type { Medication } from '../types';

function loadMedications(): Medication[] {
  return [...repo.listMedications()].sort((a, b) => a.sortOrder - b.sortOrder);
}

function MedicationCard({
  med,
  onToggleArchive,
}: {
  med: Medication;
  onToggleArchive: (med: Medication) => void;
}) {
  const doses = doseSummary(med, DEFAULT_SLOT_LABELS);
  const frequency = frequencySummary(med, WEEKDAY_LABELS);

  return (
    <li className="rounded-lg border border-slate-300 bg-white">
      <div className="flex items-start justify-between gap-3 p-4">
        <Link to={`/medications/${med.id}`} className="min-w-0 flex-1">
          <div className="text-2xl font-semibold text-slate-900">{med.name}</div>
          {med.brandName && <div className="text-lg text-slate-700">{med.brandName}</div>}
          <div className="mt-2 flex flex-wrap gap-2 text-base">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              {MEDICATION_FORM_LABELS[med.form]}
            </span>
            {!med.goesInPack && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
                Not packed
              </span>
            )}
            {med.scheduleType === 'asNeeded' && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">As needed</span>
            )}
            {med.scheduleType === 'asDirected' && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                As directed
              </span>
            )}
          </div>
          {med.scheduleType === 'fixed' ? (
            <p className="mt-2 text-lg text-slate-700">
              {doses || 'No dose entered'}
              {frequency && frequency !== 'Daily' ? ` — ${frequency}` : ''}
            </p>
          ) : (
            <p className="mt-2 whitespace-pre-wrap text-lg text-slate-700">{med.directions}</p>
          )}
        </Link>
        <button
          type="button"
          onClick={() => onToggleArchive(med)}
          className="min-h-[56px] shrink-0 rounded-md border border-slate-400 px-4 text-lg font-medium text-slate-800"
        >
          {med.active ? 'Archive' : 'Restore'}
        </button>
      </div>
    </li>
  );
}

export default function MedicationsList() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    setMedications(loadMedications());
  }, []);

  function toggleArchive(med: Medication) {
    repo.updateMedication(med.id, { active: !med.active });
    setMedications(loadMedications());
  }

  const active = medications.filter((m) => m.active);
  const archived = medications.filter((m) => !m.active);

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Medications</h1>
        <Link
          to="/medications/new"
          className="flex min-h-[56px] items-center justify-center rounded-md bg-teal-800 px-5 text-lg font-medium text-white"
        >
          Add medication
        </Link>
      </div>

      {active.length === 0 && archived.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <p className="mb-4 text-lg text-slate-700">No medications yet.</p>
          <Link
            to="/medications/new"
            className="inline-flex min-h-[56px] items-center rounded-md bg-teal-800 px-5 text-lg font-medium text-white"
          >
            Add the first medication
          </Link>
        </div>
      )}

      {active.length > 0 && (
        <ul className="flex flex-col gap-3">
          {active.map((med) => (
            <MedicationCard key={med.id} med={med} onToggleArchive={toggleArchive} />
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="min-h-[56px] text-lg font-medium text-slate-700 underline"
            aria-expanded={showArchived}
          >
            {showArchived ? 'Hide' : 'Show'} archived ({archived.length})
          </button>
          {showArchived && (
            <ul className="mt-3 flex flex-col gap-3">
              {archived.map((med) => (
                <MedicationCard key={med.id} med={med} onToggleArchive={toggleArchive} />
              ))}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
