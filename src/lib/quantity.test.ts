import { describe, expect, it } from 'vitest';
import { formatQuantity } from './quantity';

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
