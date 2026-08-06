import type { Slot, Weekday } from '../types';

export const SLOTS: Slot[] = ['morning', 'noon', 'evening', 'night'];

export const DEFAULT_SLOT_LABELS: Record<Slot, string> = {
  morning: 'Morning',
  noon: 'Noon',
  evening: 'Evening',
  night: 'Night',
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
