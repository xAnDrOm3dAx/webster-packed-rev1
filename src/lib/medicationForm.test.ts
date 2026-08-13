import { beforeEach, describe, expect, it } from 'vitest';
import * as repo from '../storage/repository';
import { DEFAULT_SLOT_LABELS, WEEKDAY_LABELS } from './constants';
import {
  defaultFormState,
  defaultGoesInPack,
  doseSummary,
  frequencySummary,
  fromMedication,
  goesInPackAfterFormChange,
  goesInPackLocked,
  isTabletForm,
  sortDays,
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

  it('is measured in tablets only for tablet and capsule forms', () => {
    expect(isTabletForm('tablet')).toBe(true);
    expect(isTabletForm('capsule')).toBe(true);
    expect(isTabletForm('inhaler')).toBe(false);
    expect(isTabletForm('injection')).toBe(false);
    expect(isTabletForm('liquid')).toBe(false);
    expect(isTabletForm('other')).toBe(false);
  });

  it('locks goesInPack off for injections, inhalers, and liquids, but not other', () => {
    expect(goesInPackLocked('injection')).toBe(true);
    expect(goesInPackLocked('inhaler')).toBe(true);
    expect(goesInPackLocked('liquid')).toBe(true);
    expect(goesInPackLocked('other')).toBe(false);
    expect(goesInPackLocked('tablet')).toBe(false);
    expect(goesInPackLocked('capsule')).toBe(false);
  });

  it('forces goesInPack to false for an injection even if the form state says true', () => {
    const s = state({
      name: 'Methotrexate 10mg injection',
      form: 'injection',
      goesInPack: true,
      doses: { morning: 0, noon: 0, evening: 0, night: 1 },
    });
    const med = toMedicationInput(s);
    expect(med.goesInPack).toBe(false);
  });

  it('does not lock goesInPack for the "other" form', () => {
    const s = state({
      name: 'Medicated patch',
      form: 'other',
      goesInPack: true,
      doses: { morning: 1, noon: 0, evening: 0, night: 0 },
    });
    const med = toMedicationInput(s);
    expect(med.goesInPack).toBe(true);
  });
});

// TICKET A1: a packed 'other' medication may store an optional unit word
// (doseUnit) so its dose never displays as a bare number or a tablet
// fraction (SPEC.md section 5, revised decision).
describe('ticket A1: unit word for packed "other" medications', () => {
  const otherState = (overrides: Partial<MedicationFormState> = {}) =>
    state({
      name: 'Movicol sachets',
      form: 'other',
      goesInPack: true,
      doses: { morning: 2, noon: 0, evening: 0, night: 0 },
      ...overrides,
    });

  it('persists a trimmed doseUnit for form "other"', () => {
    const med = toMedicationInput(otherState({ doseUnit: '  sachet ' }));
    expect(med.doseUnit).toBe('sachet');
  });

  it('drops a blank doseUnit', () => {
    expect(toMedicationInput(otherState({ doseUnit: '' })).doseUnit).toBeUndefined();
    expect(toMedicationInput(otherState({ doseUnit: '   ' })).doseUnit).toBeUndefined();
  });

  // The box usually prints the plural ("sachets"); storing it as typed
  // would make the display pluralise it again ("2 sachetss").
  it('stores a plural unit word as the singular ("sachets" -> "sachet")', () => {
    expect(toMedicationInput(otherState({ doseUnit: 'sachets' })).doseUnit).toBe('sachet');
  });

  it('leaves a word not ending in "s" alone ("wafer" -> "wafer")', () => {
    expect(toMedicationInput(otherState({ doseUnit: 'wafer' })).doseUnit).toBe('wafer');
  });

  it('leaves words of two characters or fewer alone', () => {
    expect(toMedicationInput(otherState({ doseUnit: 'gs' })).doseUnit).toBe('gs');
    expect(toMedicationInput(otherState({ doseUnit: 's' })).doseUnit).toBe('s');
  });

  it('drops doseUnit for any form other than "other"', () => {
    const med = toMedicationInput(
      state({
        name: 'Bisoprolol 5mg tablets',
        form: 'tablet',
        doseUnit: 'sachet',
        doses: { morning: 1, noon: 0, evening: 0, night: 0 },
      }),
    );
    expect(med.doseUnit).toBeUndefined();
  });

  it('round-trips doseUnit through fromMedication', () => {
    const med = { ...toMedicationInput(otherState({ doseUnit: 'sachet' })), id: 'x', active: true, sortOrder: 0 };
    expect(fromMedication(med).doseUnit).toBe('sachet');
  });

  it('summarises "other" doses as a plain number plus the pluralised word', () => {
    const med = {
      ...toMedicationInput(
        otherState({
          doseUnit: 'sachet',
          doses: { morning: 2, noon: 0, evening: 1, night: 0.5 },
        }),
      ),
      id: 'x',
      active: true,
      sortOrder: 0,
    };
    expect(doseSummary(med, DEFAULT_SLOT_LABELS)).toBe(
      '2 sachets morning, 1 sachet evening, 0.5 sachets night',
    );
  });

  it('summarises "other" doses with no unit as the plain number, never a tablet fraction', () => {
    const med = {
      ...toMedicationInput(otherState({ doses: { morning: 0.5, noon: 0, evening: 0, night: 0 } })),
      id: 'x',
      active: true,
      sortOrder: 0,
    };
    expect(doseSummary(med, DEFAULT_SLOT_LABELS)).toBe('0.5 morning');
  });

  // TICKET A3: the same form-aware formatter stops a 0.5ml liquid reading
  // as "½" (half a tablet) on the medications list.
  it('summarises a liquid dose as a plain number, never a tablet fraction', () => {
    const med = {
      ...toMedicationInput(
        state({
          name: 'Amoxicillin 250mg/5ml suspension',
          form: 'liquid',
          goesInPack: false,
          doses: { morning: 0.5, noon: 0, evening: 0, night: 0 },
        }),
      ),
      id: 'x',
      active: true,
      sortOrder: 0,
    };
    expect(doseSummary(med, DEFAULT_SLOT_LABELS)).toBe('0.5 morning');
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

// Ticket A4: changing Form within one side of the tablet/non-tablet
// boundary must keep the person's "Goes in the pack" choice.
describe('goesInPackAfterFormChange', () => {
  it('keeps an unticked box when Form changes from tablet to capsule', () => {
    const s = state({ form: 'tablet', goesInPack: false });
    expect(goesInPackAfterFormChange(s, 'capsule')).toBe(false);
  });

  it('keeps a ticked box when Form changes from tablet to capsule', () => {
    const s = state({ form: 'tablet', goesInPack: true });
    expect(goesInPackAfterFormChange(s, 'capsule')).toBe(true);
  });

  it('keeps the choice when Form changes from liquid to other', () => {
    const s = state({ form: 'liquid', goesInPack: false });
    expect(goesInPackAfterFormChange(s, 'other')).toBe(false);
  });

  it('resets to the new form default when crossing from tablet to liquid', () => {
    const s = state({ form: 'tablet', goesInPack: true });
    expect(goesInPackAfterFormChange(s, 'liquid')).toBe(false);
  });

  it('resets to the new form default when crossing from liquid to tablet', () => {
    const s = state({ form: 'liquid', goesInPack: false });
    expect(goesInPackAfterFormChange(s, 'tablet')).toBe(true);
  });
});

// Ticket A6: chosen days store and display in week order, not tap order.
describe('sortDays', () => {
  it('orders Fri-then-Mon as Mon, Fri', () => {
    expect(sortDays(['fri', 'mon'])).toEqual(['mon', 'fri']);
  });

  it('sorts previously saved out-of-order days when loading a medication', () => {
    const med = {
      ...toMedicationInput(
        state({
          name: 'Weekly tablet',
          frequency: 'specificDays',
          days: ['fri', 'mon'],
          doses: { morning: 1, noon: 0, evening: 0, night: 0 },
        }),
      ),
      id: 'x',
      active: true,
      sortOrder: 0,
    };
    // Bypass toMedicationInput's current days so the stored shape is
    // tap-order, the way older records were saved.
    med.days = ['fri', 'mon'];
    expect(fromMedication(med).days).toEqual(['mon', 'fri']);
    expect(frequencySummary({ ...med, days: fromMedication(med).days }, WEEKDAY_LABELS)).toBe(
      'Mon, Fri',
    );
  });
});
