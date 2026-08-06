import { beforeEach, describe, expect, it } from 'vitest';
import type { Medication, PackEntry, PackInstance, Settings } from '../types';
import * as repo from './repository';

function buildSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    personName: 'Mum',
    cycleDays: 7,
    pinHash: 'hash',
    slotLabels: {
      morning: 'Morning',
      noon: 'Noon',
      evening: 'Evening',
      night: 'Night',
    },
    ...overrides,
  };
}

function buildMedication(overrides: Partial<Medication> = {}): Omit<Medication, 'id'> {
  return {
    name: 'Bisoprolol 5mg tablets',
    form: 'tablet',
    scheduleType: 'fixed',
    doses: { morning: 1, noon: 0, evening: 0, night: 0 },
    frequency: 'daily',
    goesInPack: true,
    active: true,
    sortOrder: 0,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe('settings', () => {
  it('returns null when nothing has been saved', () => {
    expect(repo.getSettings()).toBeNull();
  });

  it('saves and retrieves settings', () => {
    const settings = buildSettings();
    repo.saveSettings(settings);
    expect(repo.getSettings()).toEqual(settings);
  });

  it('overwrites previous settings on save', () => {
    repo.saveSettings(buildSettings({ personName: 'Mum' }));
    repo.saveSettings(buildSettings({ personName: 'Dad' }));
    expect(repo.getSettings()?.personName).toBe('Dad');
  });

  it('persists across separate reads, simulating a page refresh', () => {
    repo.saveSettings(buildSettings({ personName: 'Mum' }));
    // A fresh read from storage (no in-memory state carried over) still finds it.
    const reloaded = repo.getSettings();
    expect(reloaded).toEqual(buildSettings({ personName: 'Mum' }));
  });
});

describe('medications CRUD', () => {
  it('starts empty', () => {
    expect(repo.listMedications()).toEqual([]);
  });

  it('creates a medication and assigns an id', () => {
    const created = repo.createMedication(buildMedication());
    expect(created.id).toBeTruthy();
    expect(repo.listMedications()).toHaveLength(1);
    expect(repo.getMedication(created.id)).toEqual(created);
  });

  it('creates distinct ids for successive medications', () => {
    const a = repo.createMedication(buildMedication({ name: 'A' }));
    const b = repo.createMedication(buildMedication({ name: 'B' }));
    expect(a.id).not.toBe(b.id);
    expect(repo.listMedications()).toHaveLength(2);
  });

  it('updates a medication by id', () => {
    const created = repo.createMedication(buildMedication({ name: 'A' }));
    const updated = repo.updateMedication(created.id, { name: 'A (renamed)' });
    expect(updated.name).toBe('A (renamed)');
    expect(repo.getMedication(created.id)?.name).toBe('A (renamed)');
  });

  it('throws when updating a medication that does not exist', () => {
    expect(() => repo.updateMedication('missing-id', { name: 'X' })).toThrow();
  });

  it('deletes a medication by id', () => {
    const created = repo.createMedication(buildMedication());
    repo.deleteMedication(created.id);
    expect(repo.getMedication(created.id)).toBeUndefined();
    expect(repo.listMedications()).toEqual([]);
  });

  it('does not disturb other medications when one is updated or deleted', () => {
    const a = repo.createMedication(buildMedication({ name: 'A' }));
    const b = repo.createMedication(buildMedication({ name: 'B' }));
    repo.updateMedication(a.id, { name: 'A2' });
    expect(repo.getMedication(b.id)?.name).toBe('B');
    repo.deleteMedication(a.id);
    expect(repo.listMedications()).toEqual([repo.getMedication(b.id)]);
  });

  it('supports scheduleType asNeeded and asDirected without a doses field', () => {
    const prn = repo.createMedication(
      buildMedication({
        name: 'Bumetanide (when required)',
        scheduleType: 'asNeeded',
        doses: undefined,
        frequency: undefined,
        directions: 'Take 2 tablets once each day when required',
        goesInPack: false,
      }),
    );
    expect(prn.scheduleType).toBe('asNeeded');
    expect(prn.directions).toBe('Take 2 tablets once each day when required');
  });
});

describe('pack instances CRUD', () => {
  function buildPackInstance(overrides: Partial<PackInstance> = {}): Omit<PackInstance, 'id'> {
    return {
      startDate: '2026-08-03',
      cycleDays: 7,
      status: 'inProgress',
      createdAt: '2026-08-03T09:00:00.000Z',
      ...overrides,
    };
  }

  it('creates, reads, updates, and deletes a pack instance', () => {
    const created = repo.createPackInstance(buildPackInstance());
    expect(repo.getPackInstance(created.id)).toEqual(created);

    const completed = repo.updatePackInstance(created.id, {
      status: 'complete',
      completedAt: '2026-08-10T09:00:00.000Z',
    });
    expect(completed.status).toBe('complete');
    expect(repo.getPackInstance(created.id)?.completedAt).toBe(
      '2026-08-10T09:00:00.000Z',
    );

    repo.deletePackInstance(created.id);
    expect(repo.getPackInstance(created.id)).toBeUndefined();
  });

  it('lists multiple pack instances', () => {
    repo.createPackInstance(buildPackInstance({ startDate: '2026-08-03' }));
    repo.createPackInstance(buildPackInstance({ startDate: '2026-08-10' }));
    expect(repo.listPackInstances()).toHaveLength(2);
  });
});

describe('pack entries CRUD', () => {
  function buildPackEntry(overrides: Partial<PackEntry> = {}): Omit<PackEntry, 'id'> {
    return {
      packInstanceId: 'pack-1',
      medicationId: 'med-1',
      medicationLabel: 'Bisoprolol 5mg tablets',
      dayIndex: 0,
      slot: 'morning',
      quantity: 1,
      filled: false,
      ...overrides,
    };
  }

  it('creates and reads a pack entry', () => {
    const created = repo.createPackEntry(buildPackEntry());
    expect(repo.getPackEntry(created.id)).toEqual(created);
  });

  it('bulk-creates entries for a whole pack', () => {
    const entries = repo.createPackEntries([
      buildPackEntry({ dayIndex: 0 }),
      buildPackEntry({ dayIndex: 1 }),
      buildPackEntry({ dayIndex: 2 }),
    ]);
    expect(entries).toHaveLength(3);
    expect(repo.listPackEntries()).toHaveLength(3);
  });

  it('filters entries by packInstanceId', () => {
    repo.createPackEntries([
      buildPackEntry({ packInstanceId: 'pack-1', dayIndex: 0 }),
      buildPackEntry({ packInstanceId: 'pack-2', dayIndex: 0 }),
    ]);
    expect(repo.listPackEntries('pack-1')).toHaveLength(1);
    expect(repo.listPackEntries('pack-2')).toHaveLength(1);
    expect(repo.listPackEntries()).toHaveLength(2);
  });

  it('toggles filled state on a single entry, leaving others untouched', () => {
    const [a, b] = repo.createPackEntries([
      buildPackEntry({ dayIndex: 0 }),
      buildPackEntry({ dayIndex: 1 }),
    ]);

    const filled = repo.updatePackEntry(a.id, {
      filled: true,
      filledAt: '2026-08-06T10:00:00.000Z',
    });
    expect(filled.filled).toBe(true);
    expect(repo.getPackEntry(b.id)?.filled).toBe(false);

    const unfilled = repo.updatePackEntry(a.id, { filled: false, filledAt: undefined });
    expect(unfilled.filled).toBe(false);
  });

  it('deletes a pack entry', () => {
    const created = repo.createPackEntry(buildPackEntry());
    repo.deletePackEntry(created.id);
    expect(repo.getPackEntry(created.id)).toBeUndefined();
  });
});

describe('persistence across reads (survives a refresh)', () => {
  it('every write is immediately readable from storage, not just in-memory state', () => {
    const settings = buildSettings();
    repo.saveSettings(settings);
    const med = repo.createMedication(buildMedication());
    const pack = repo.createPackInstance({
      startDate: '2026-08-03',
      cycleDays: 7,
      status: 'inProgress',
      createdAt: '2026-08-03T09:00:00.000Z',
    });
    const entry = repo.createPackEntry({
      packInstanceId: pack.id,
      medicationId: med.id,
      medicationLabel: med.name,
      dayIndex: 0,
      slot: 'morning',
      quantity: 1,
      filled: false,
    });

    // Reading straight back from localStorage (bypassing any in-memory cache)
    // confirms the write actually reached storage, not just a local variable.
    const rawSettings = JSON.parse(localStorage.getItem('websterPack:settings')!);
    const rawMeds = JSON.parse(localStorage.getItem('websterPack:medications')!);
    const rawPacks = JSON.parse(localStorage.getItem('websterPack:packInstances')!);
    const rawEntries = JSON.parse(localStorage.getItem('websterPack:packEntries')!);

    expect(rawSettings).toEqual(settings);
    expect(rawMeds).toEqual([med]);
    expect(rawPacks).toEqual([pack]);
    expect(rawEntries).toEqual([entry]);
  });

  it('clearAll wipes every store', () => {
    repo.saveSettings(buildSettings());
    repo.createMedication(buildMedication());
    repo.createPackInstance({
      startDate: '2026-08-03',
      cycleDays: 7,
      status: 'inProgress',
      createdAt: '2026-08-03T09:00:00.000Z',
    });
    repo.createPackEntry({
      packInstanceId: 'p',
      medicationId: 'm',
      medicationLabel: 'X',
      dayIndex: 0,
      slot: 'morning',
      quantity: 1,
      filled: false,
    });

    repo.clearAll();

    expect(repo.getSettings()).toBeNull();
    expect(repo.listMedications()).toEqual([]);
    expect(repo.listPackInstances()).toEqual([]);
    expect(repo.listPackEntries()).toEqual([]);
  });

  it('recovers gracefully from corrupted JSON in storage', () => {
    localStorage.setItem('websterPack:medications', '{not valid json');
    expect(repo.listMedications()).toEqual([]);
  });
});
