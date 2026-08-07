import { describe, expect, it } from 'vitest';
import { formatQuantity, splitQuantity } from './quantity';

// Simulates the tap combine logic in QuantityStepper: a whole-number tap
// keeps the current fraction, a fraction tap keeps the current whole number.
function tapWhole(current: number, whole: number): number {
  const { fraction } = splitQuantity(current);
  return Math.round((whole + fraction) * 100) / 100;
}

function tapFraction(current: number, fraction: number): number {
  const { whole } = splitQuantity(current);
  return Math.round((whole + fraction) * 100) / 100;
}

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

// SPEC.md section 5: "Entry form offers ¼, ½, ¾ as taps, plus whole numbers."
// A whole-number tap and a fraction tap must combine rather than overwrite.
describe('combining whole-number and fraction taps', () => {
  it('tapping 1 then ½ gives 1.5', () => {
    let value = 0;
    value = tapWhole(value, 1);
    expect(value).toBe(1);
    value = tapFraction(value, 0.5);
    expect(value).toBe(1.5);
  });

  it('tapping ½ then 1 also gives 1.5', () => {
    let value = 0;
    value = tapFraction(value, 0.5);
    expect(value).toBe(0.5);
    value = tapWhole(value, 1);
    expect(value).toBe(1.5);
  });

  it('tapping 2 then ¾ gives 2.75', () => {
    let value = 0;
    value = tapWhole(value, 2);
    value = tapFraction(value, 0.75);
    expect(value).toBe(2.75);
  });

  it('replacing the whole number keeps the existing fraction', () => {
    let value = 1.5;
    value = tapWhole(value, 3);
    expect(value).toBe(3.5);
  });

  it('replacing the fraction keeps the existing whole number', () => {
    let value = 2.25;
    value = tapFraction(value, 0.75);
    expect(value).toBe(2.75);
  });
});
