import type { Settings, Slot, Weekday } from '../types';

export const SLOTS: Slot[] = ['morning', 'noon', 'evening', 'night'];

export const DEFAULT_SLOT_LABELS: Record<Slot, string> = {
  morning: 'Morning',
  noon: 'Noon',
  evening: 'Evening',
  night: 'Night',
};

// A pack is seven days unless the person changes it on the Settings screen
// (SPEC.md section 4). Milestone 3 generates compartments from this number, so
// it must have a value long before Settings exists to edit it.
export const DEFAULT_CYCLE_DAYS: Settings['cycleDays'] = 7;

// What settings look like before anyone has saved any. `personName` and
// `pinHash` are empty rather than absent: an empty `pinHash` means no PIN has
// been set, which is the state the app starts in.
export const DEFAULT_SETTINGS: Settings = {
  personName: '',
  cycleDays: DEFAULT_CYCLE_DAYS,
  pinHash: '',
  slotLabels: DEFAULT_SLOT_LABELS,
};

export const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

export const MEDICATION_FORMS = [
  'tablet',
  'capsule',
  'inhaler',
  'injection',
  'liquid',
  'other',
] as const;

export const MEDICATION_FORM_LABELS: Record<(typeof MEDICATION_FORMS)[number], string> = {
  tablet: 'Tablet',
  capsule: 'Capsule',
  inhaler: 'Inhaler',
  injection: 'Injection',
  liquid: 'Liquid',
  other: 'Other',
};
