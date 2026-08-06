import type { Medication, PackEntry, PackInstance, Settings } from '../types';

// The only module in this app allowed to touch localStorage. Every read and
// write to persisted data goes through the functions below (SPEC.md section 3).

const KEYS = {
  settings: 'websterPack:settings',
  medications: 'websterPack:medications',
  packInstances: 'websterPack:packInstances',
  packEntries: 'websterPack:packEntries',
} as const;

function readJSON<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function makeId(): string {
  return crypto.randomUUID();
}

// ---- Settings ----

export function getSettings(): Settings | null {
  return readJSON<Settings | null>(KEYS.settings, null);
}

export function saveSettings(settings: Settings): Settings {
  writeJSON(KEYS.settings, settings);
  return settings;
}

// ---- Medications ----

export function listMedications(): Medication[] {
  return readJSON<Medication[]>(KEYS.medications, []);
}

export function getMedication(id: string): Medication | undefined {
  return listMedications().find((m) => m.id === id);
}

export function createMedication(input: Omit<Medication, 'id'>): Medication {
  const medication: Medication = { ...input, id: makeId() };
  const medications = listMedications();
  medications.push(medication);
  writeJSON(KEYS.medications, medications);
  return medication;
}

export function updateMedication(
  id: string,
  patch: Partial<Omit<Medication, 'id'>>,
): Medication {
  const medications = listMedications();
  const index = medications.findIndex((m) => m.id === id);
  if (index === -1) {
    throw new Error(`Medication not found: ${id}`);
  }
  const updated: Medication = { ...medications[index], ...patch, id };
  medications[index] = updated;
  writeJSON(KEYS.medications, medications);
  return updated;
}

export function deleteMedication(id: string): void {
  const medications = listMedications().filter((m) => m.id !== id);
  writeJSON(KEYS.medications, medications);
}

// ---- Pack instances ----

export function listPackInstances(): PackInstance[] {
  return readJSON<PackInstance[]>(KEYS.packInstances, []);
}

export function getPackInstance(id: string): PackInstance | undefined {
  return listPackInstances().find((p) => p.id === id);
}

export function createPackInstance(
  input: Omit<PackInstance, 'id'>,
): PackInstance {
  const packInstance: PackInstance = { ...input, id: makeId() };
  const packInstances = listPackInstances();
  packInstances.push(packInstance);
  writeJSON(KEYS.packInstances, packInstances);
  return packInstance;
}

export function updatePackInstance(
  id: string,
  patch: Partial<Omit<PackInstance, 'id'>>,
): PackInstance {
  const packInstances = listPackInstances();
  const index = packInstances.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error(`Pack instance not found: ${id}`);
  }
  const updated: PackInstance = { ...packInstances[index], ...patch, id };
  packInstances[index] = updated;
  writeJSON(KEYS.packInstances, packInstances);
  return updated;
}

export function deletePackInstance(id: string): void {
  const packInstances = listPackInstances().filter((p) => p.id !== id);
  writeJSON(KEYS.packInstances, packInstances);
}

// ---- Pack entries ----

export function listPackEntries(packInstanceId?: string): PackEntry[] {
  const entries = readJSON<PackEntry[]>(KEYS.packEntries, []);
  if (packInstanceId === undefined) return entries;
  return entries.filter((e) => e.packInstanceId === packInstanceId);
}

export function getPackEntry(id: string): PackEntry | undefined {
  return listPackEntries().find((e) => e.id === id);
}

export function createPackEntry(input: Omit<PackEntry, 'id'>): PackEntry {
  const entry: PackEntry = { ...input, id: makeId() };
  const entries = listPackEntries();
  entries.push(entry);
  writeJSON(KEYS.packEntries, entries);
  return entry;
}

export function createPackEntries(
  inputs: Omit<PackEntry, 'id'>[],
): PackEntry[] {
  const created = inputs.map((input) => ({ ...input, id: makeId() }));
  const entries = listPackEntries();
  entries.push(...created);
  writeJSON(KEYS.packEntries, entries);
  return created;
}

export function updatePackEntry(
  id: string,
  patch: Partial<Omit<PackEntry, 'id'>>,
): PackEntry {
  const entries = listPackEntries();
  const index = entries.findIndex((e) => e.id === id);
  if (index === -1) {
    throw new Error(`Pack entry not found: ${id}`);
  }
  const updated: PackEntry = { ...entries[index], ...patch, id };
  entries[index] = updated;
  writeJSON(KEYS.packEntries, entries);
  return updated;
}

export function deletePackEntry(id: string): void {
  const entries = listPackEntries().filter((e) => e.id !== id);
  writeJSON(KEYS.packEntries, entries);
}

// ---- Reset (used by import, and by tests) ----

export function clearAll(): void {
  localStorage.removeItem(KEYS.settings);
  localStorage.removeItem(KEYS.medications);
  localStorage.removeItem(KEYS.packInstances);
  localStorage.removeItem(KEYS.packEntries);
}
