export type Slot = 'morning' | 'noon' | 'evening' | 'night';
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type Settings = {
  personName: string; // display only, e.g. "Mum"
  cycleDays: 7 | 14; // default 7
  pinHash: string; // SHA-256 of the PIN
  slotLabels: Record<Slot, string>; // editable, e.g. night -> "Bedtime"
};

export type Medication = {
  id: string;
  name: string; // "Bisoprolol 5mg tablets"
  brandName?: string; // "Bicor"
  purpose?: string; // "Improve heart function" — free text, copied from the record
  form: 'tablet' | 'capsule' | 'inhaler' | 'injection' | 'liquid' | 'other';

  scheduleType: 'fixed' | 'asNeeded' | 'asDirected';

  // fixed only:
  doses?: Record<Slot, number>; // decimals allowed: 0.5, 1, 2, 3
  frequency?: 'daily' | 'specificDays';
  days?: Weekday[]; // when frequency === 'specificDays'

  // asNeeded / asDirected only:
  directions?: string; // free text, shown verbatim, never parsed

  goesInPack: boolean; // false for inhalers, injections, liquids
  notes?: string; // "Swallow whole", "with food"
  active: boolean;
  sortOrder: number;
};

export type PackInstance = {
  id: string;
  startDate: string; // ISO date, the Monday (or whichever day) the pack begins
  cycleDays: number; // snapshotted from settings at creation
  status: 'inProgress' | 'complete';
  createdAt: string;
  completedAt?: string;
};

export type PackEntry = {
  id: string;
  packInstanceId: string;
  medicationId: string;
  medicationLabel: string; // snapshotted name at time of creation
  dayIndex: number; // 0-based
  slot: Slot;
  quantity: number; // 0.5, 1, 2, 3...
  filled: boolean;
  filledAt?: string;
};
