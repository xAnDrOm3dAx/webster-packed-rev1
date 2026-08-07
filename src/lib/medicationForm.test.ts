import { beforeEach, describe, expect, it } from 'vitest';
import * as repo from '../storage/repository';
import { DEFAULT_SLOT_LABELS, WEEKDAY_LABELS } from './constants';
import {
  defaultFormState,
  defaultGoesInPack,
  doseSummary,
  frequencySummary,
  toMedicationInput,
  validateForm,
  type MedicationFormState,
} from './medicationForm';

beforeEach(() => {
  localStorage.clear();
});

function state(overrides: Partial<MedicationFormState> = {}): MedicationFormState {
  return { ...defaultFormState(), ...overrides };
}

// Each describe block below is one row of the SPEC.md section 5 table,
// treated as an acceptance test: the form must produce a Medication object
// that comes back with the right shape, and the app must never try to be
// clever about interpreting the dose.

describe('section 5: half tablets', () => {
  it('stores 0.5 and displays it as ½', () => {
    const s = state({
      name: 'Bisoprolol 5mg tablets',
      doses: { morning: 0.5, noon: 0, evening: 0, night: 0 },
    });
    expect(validateForm(s)).toEqual({});
    const med = { ...toMedicationInput(s), id: 'x', active: true, sortOrder: 0 };
    expect(med.doses?.morning).toBe(0.5);
    expect(doseSummary(med, DEFAULT_SLOT_LABELS)).toBe('½ morning');
  });
});

describe('section 5: split dose, different amounts', () => {
  it('is one medication with different quantities per slot', () => {
    const s = state({
      name: 'Furosemide 40mg tablets',
      doses: { morning: 3, noon: 2, evening: 0, night: 0 },
    });
    expect(validateForm(s)).toEqual({});
    const med = { ...toMedicationInput(s), id: 'x', active: true, sortOrder: 0 };
    expect(med.doses).toEqual({ morning: 3, noon: 2, evening: 0, night: 0 });
    expect(doseSummary(med, DEFAULT_SLOT_LABELS)).toBe('3 morning, 2 noon');
  });
});

describe('section 5: same drug listed twice', () => {
  it('creates two separate medication records, never merged', () => {
    const fixed = repo.createMedication({
      ...toMedicationInput(
        state({
          name: 'Bumetanide 1mg tablets',
          doses: { morning: 1, noon: 0, evening: 0, night: 0 },
        }),
      ),
      active: true,
      sortOrder: 0,
    });
    const prn = repo.createMedication({
      ...toMedicationInput(
        state({
          name: 'Bumetanide 1mg tablets',
          scheduleType: 'asNeeded',
          directions: 'Take 2 tablets once each day when required',
          goesInPack: false,
        }),
      ),
      active: true,
      sortOrder: 1,
    });

    expect(fixed.id).not.toBe(prn.id);
    const all = repo.listMedications();
    expect(all).toHaveLength(2);
    expect(all.filter((m) => m.name === 'Bumetanide 1mg tablets')).toHaveLength(2);
  });
});

describe('section 5: when required (PRN)', () => {
  it('has scheduleType asNeeded, no doses, and directions kept verbatim', () => {
    const s = state({
      name: 'Bumetanide 1mg tablets',
      scheduleType: 'asNeeded',
      directions: 'Take 2 tablets once each day when required',
      goesInPack: false,
    });
    expect(validateForm(s)).toEqual({});
    const med = { ...toMedicationInput(s), id: 'x', active: true, sortOrder: 0 };
    expect(med.scheduleType).toBe('asNeeded');
    expect(med.doses).toBeUndefined();
    expect(med.frequency).toBeUndefined();
    expect(med.directions).toBe('Take 2 tablets once each day when required');
  });

  it('forces goesInPack to false for a tablet, even if the checkbox was left on', () => {
    const s = state({
      name: 'Bumetanide 1mg tablets',
      form: 'tablet',
      scheduleType: 'asNeeded',
      directions: 'Take 2 tablets once each day when required',
      goesInPack: true,
    });
    const med = toMedicationInput(s);
    expect(med.goesInPack).toBe(false);
  });
});

describe('section 5: once weekly, specific day', () => {
  it('is fixed/specificDays with goesInPack false because it is an injection', () => {
    const s = state({
      name: 'Methotrexate 10mg injection',
      form: 'injection',
      goesInPack: defaultGoesInPack('injection'),
      doses: { morning: 0, noon: 0, evening: 0, night: 1 },
      frequency: 'specificDays',
      days: ['tue'],
    });
    expect(defaultGoesInPack('injection')).toBe(false);
    expect(validateForm(s)).toEqual({});
    const med = { ...toMedicationInput(s), id: 'x', active: true, sortOrder: 0 };
    expect(med.frequency).toBe('specificDays');
    expect(med.days).toEqual(['tue']);
    expect(med.goesInPack).toBe(false);
    expect(frequencySummary(med, WEEKDAY_LABELS)).toBe('Tue');
  });

  it('requires at least one day when frequency is specificDays', () => {
    const s = state({ name: 'X', frequency: 'specificDays', days: [], doses: { morning: 1, noon: 0, evening: 0, night: 0 } });
    expect(validateForm(s).days).toBeTruthy();
  });
});

describe('section 5: free text with no dose', () => {
  it('is asDirected with directions shown verbatim and no compartments', () => {
    const s = state({
      name: 'Warfarin tablets',
      scheduleType: 'asDirected',
      directions: 'Take as directed',
    });
    expect(validateForm(s)).toEqual({});
    const med = { ...toMedicationInput(s), id: 'x', active: true, sortOrder: 0 };
    expect(med.scheduleType).toBe('asDirected');
    expect(med.doses).toBeUndefined();
    expect(med.directions).toBe('Take as directed');
  });

  it('forces goesInPack to false for a tablet, even if the checkbox was left on', () => {
    const s = state({
      name: 'Warfarin tablets',
      form: 'tablet',
      scheduleType: 'asDirected',
      directions: 'Take as directed',
      goesInPack: true,
    });
    const med = toMedicationInput(s);
    expect(med.goesInPack).toBe(false);
  });
});

describe('section 5: not a tablet', () => {
  it('defaults goesInPack to false for an inhaler', () => {
    expect(defaultGoesInPack('inhaler')).toBe(false);
    expect(defaultGoesInPack('liquid')).toBe(false);
    expect(defaultGoesInPack('other')).toBe(false);
    expect(defaultGoesInPack('tablet')).toBe(true);
    expect(defaultGoesInPack('capsule')).toBe(true);
  });
});

describe('section 5: long directions', () => {
  it('stores multi-sentence directions in full, not truncated', () => {
    const long =
      'Take 2 tablets once each day when required for breathlessness. ' +
      'Do not take more than 6 tablets in 24 hours. ' +
      'If symptoms persist for more than 2 days, contact the GP surgery for review.';
    const s = state({
      name: 'Salbutamol inhaler',
      form: 'inhaler',
      scheduleType: 'asNeeded',
      goesInPack: false,
      directions: long,
    });
    expect(validateForm(s)).toEqual({});
    const med = { ...toMedicationInput(s), id: 'x', active: true, sortOrder: 0 };
    expect(med.directions).toBe(long);
    expect(med.directions?.length).toBe(long.length);
  });
});

describe('validation', () => {
  it('requires a name', () => {
    const s = state({ name: '  ' });
    expect(validateForm(s).name).toBeTruthy();
  });

  it('requires at least one non-zero dose for a fixed medication', () => {
    const s = state({ name: 'X', doses: { morning: 0, noon: 0, evening: 0, night: 0 } });
    expect(validateForm(s).doses).toBeTruthy();
  });

  it('requires directions for asNeeded/asDirected', () => {
    const s = state({ name: 'X', scheduleType: 'asNeeded', directions: '' });
    expect(validateForm(s).directions).toBeTruthy();
  });
});
