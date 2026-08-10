import { describe, expect, it } from 'vitest';
import {
  combineDose,
  formatDoseText,
  formatFreeDoseText,
  formatQuantity,
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
    expect(splitQuantity(0.25)).toEqual({ whole: 0, fraction: 0.25 });
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

// DOSE ENTRY — REVISION 2: the dose picker combines a whole-tablets row and
// a part-tablet row into one dose.
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

// FREE DOSE TEXT — FIX: non-tablet forms must never show tablet fraction
// glyphs (½, ¼, ¾) — a 2.5ml liquid dose is not "2½".
describe('formatFreeDoseText', () => {
  it('shows the plain number, not a fraction glyph', () => {
    expect(formatFreeDoseText(2.5)).toBe('2.5');
    expect(formatFreeDoseText(0.5)).toBe('0.5');
    expect(formatFreeDoseText(1.25)).toBe('1.25');
    expect(formatFreeDoseText(0.75)).toBe('0.75');
  });

  it('shows a whole number with no decimal point', () => {
    expect(formatFreeDoseText(7)).toBe('7');
  });

  it('rounds to two decimal places', () => {
    expect(formatFreeDoseText(3.33)).toBe('3.33');
  });

  it('shows "Not given" for zero or non-finite values', () => {
    expect(formatFreeDoseText(0)).toBe('Not given');
    expect(formatFreeDoseText(-1)).toBe('Not given');
    expect(formatFreeDoseText(NaN)).toBe('Not given');
  });
});

