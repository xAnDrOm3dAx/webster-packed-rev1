import { describe, expect, it } from 'vitest';
import {
  clearDose,
  combineDose,
  formatDoseText,
  formatQuantity,
  matchingMainOption,
  selectDose,
  splitQuantity,
} from './quantity';

describe('formatQuantity', () => {
  it('formats a half tablet as ½', () => {
    expect(formatQuantity(0.5)).toBe('½');
  });

  it('formats a quarter tablet as ¼', () => {
    expect(formatQuantity(0.25)).toBe('¼');
  });

  it('formats three-quarters as ¾', () => {
    expect(formatQuantity(0.75)).toBe('¾');
  });

  it('formats whole numbers plainly', () => {
    expect(formatQuantity(1)).toBe('1');
    expect(formatQuantity(2)).toBe('2');
    expect(formatQuantity(3)).toBe('3');
  });

  it('combines a whole number with a fraction glyph', () => {
    expect(formatQuantity(1.5)).toBe('1½');
    expect(formatQuantity(2.25)).toBe('2¼');
    expect(formatQuantity(3.75)).toBe('3¾');
  });

  it('formats zero as 0', () => {
    expect(formatQuantity(0)).toBe('0');
  });

  it('falls back to a plain decimal for non-quarter values', () => {
    expect(formatQuantity(0.1)).toBe('0.1');
  });

  it('treats negative or non-finite values as 0', () => {
    expect(formatQuantity(-1)).toBe('0');
    expect(formatQuantity(NaN)).toBe('0');
  });
});

describe('splitQuantity', () => {
  it('splits a value into whole and fraction parts', () => {
    expect(splitQuantity(1.5)).toEqual({ whole: 1, fraction: 0.5 });
    expect(splitQuantity(0.5)).toEqual({ whole: 0, fraction: 0.5 });
    expect(splitQuantity(2)).toEqual({ whole: 2, fraction: 0 });
    expect(splitQuantity(0)).toEqual({ whole: 0, fraction: 0 });
  });
});

// DOSE ENTRY — REVISED: "plain English" read-only display for each
// time-of-day box.
describe('formatDoseText', () => {
  it('shows "Not given" for zero', () => {
    expect(formatDoseText(0)).toBe('Not given');
  });

  it('shows a single whole tablet in the singular', () => {
    expect(formatDoseText(1)).toBe('1 tablet');
  });

  it('shows multiple whole tablets in the plural', () => {
    expect(formatDoseText(2)).toBe('2 tablets');
    expect(formatDoseText(3)).toBe('3 tablets');
  });

  it('shows a fraction alone as "a tablet"', () => {
    expect(formatDoseText(0.5)).toBe('½ a tablet');
    expect(formatDoseText(0.25)).toBe('¼ a tablet');
  });

  it('shows a whole number plus a fraction, pluralised', () => {
    expect(formatDoseText(1.5)).toBe('1½ tablets');
    expect(formatDoseText(2.5)).toBe('2½ tablets');
  });

  it('treats negative or non-finite values as "Not given"', () => {
    expect(formatDoseText(-1)).toBe('Not given');
    expect(formatDoseText(NaN)).toBe('Not given');
  });
});

// DOSE ENTRY — REVISED: the picker is single-select. Tapping a button SETS
// the dose; it never adds to or subtracts from the current value.
describe('selectDose', () => {
  it('tapping a dose button sets that exact value, with no accumulation', () => {
    expect(selectDose(2, 0.5)).toBe(0.5);
    expect(selectDose(0, 3)).toBe(3);
    expect(selectDose(1.5, 2.5)).toBe(2.5);
  });

  it('tapping the same button twice leaves the value unchanged', () => {
    expect(selectDose(1.5, 1.5)).toBe(1.5);
  });
});

describe('clearDose', () => {
  it('returns the value to 0', () => {
    expect(clearDose()).toBe(0);
  });
});

// DOSE ENTRY — REVISED: "Other…" panel combines a whole-tablets row and a
// part-tablet row into one dose.
describe('combineDose', () => {
  it('combines whole=3 and part=¾ into 3.75', () => {
    expect(combineDose(3, 0.75)).toBe(3.75);
    expect(formatDoseText(combineDose(3, 0.75))).toBe('3¾ tablets');
  });

  it('combines whole=0 and part=0 into 0 ("Not given")', () => {
    expect(combineDose(0, 0)).toBe(0);
    expect(formatDoseText(combineDose(0, 0))).toBe('Not given');
  });

  it('combines whole=5 and part=¼ into 5.25', () => {
    expect(combineDose(5, 0.25)).toBe(5.25);
  });
});

// DOSE ENTRY — REVISED: a dose set via "Other…" that doesn't match one of
// the six main buttons must not show any main button selected.
describe('matchingMainOption', () => {
  it('matches an exact main-button value', () => {
    expect(matchingMainOption(0.5)).toBe(0.5);
    expect(matchingMainOption(1)).toBe(1);
    expect(matchingMainOption(1.5)).toBe(1.5);
    expect(matchingMainOption(3)).toBe(3);
  });

  it('a stored value of 0.25 matches no main button — "Other…" is selected instead, not ¼ + 1', () => {
    expect(matchingMainOption(0.25)).toBeNull();
    expect(splitQuantity(0.25)).toEqual({ whole: 0, fraction: 0.25 });
  });

  it('zero matches no main button', () => {
    expect(matchingMainOption(0)).toBeNull();
  });
});
