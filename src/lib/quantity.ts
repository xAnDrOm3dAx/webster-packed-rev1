// Formatting for dose quantities. Displays quarter-steps as fraction glyphs
// (SPEC.md section 5: "Displayed as '½'") and anything else as a plain number.

const FRACTION_GLYPHS: Record<number, string> = {
  0.25: '¼',
  0.5: '½',
  0.75: '¾',
};

export const QUICK_FRACTIONS = [0.25, 0.5, 0.75] as const;

export const QUICK_WHOLE_NUMBERS = [1, 2, 3] as const;

// Splits a quantity into its whole and fractional parts so whole-number and
// fraction taps can be combined (tap 1, then ½, gives 1.5 — SPEC.md section 5).
export function splitQuantity(quantity: number): { whole: number; fraction: number } {
  const whole = Math.floor(quantity);
  const fraction = Math.round((quantity - whole) * 100) / 100;
  return { whole, fraction };
}

// Tapping a whole number combines with the existing fraction, unless that
// whole number is already the pressed one, in which case it toggles off and
// leaves just the fraction (1.5, tap 1 -> 0.5).
export function tapWholeNumber(current: number, whole: number): number {
  const parts = splitQuantity(current);
  if (parts.whole === whole) return parts.fraction;
  return Math.round((whole + parts.fraction) * 100) / 100;
}

// Tapping a fraction combines with the existing whole number, unless that
// fraction is already the pressed one, in which case it toggles off and
// leaves just the whole number (1.5, tap ½ -> 1).
export function tapFraction(current: number, fraction: number): number {
  const parts = splitQuantity(current);
  if (parts.fraction === fraction) return parts.whole;
  return Math.round((parts.whole + fraction) * 100) / 100;
}

export function formatQuantity(quantity: number): string {
  if (!Number.isFinite(quantity) || quantity <= 0) return '0';

  const whole = Math.floor(quantity);
  const fraction = Math.round((quantity - whole) * 100) / 100;
  const glyph = FRACTION_GLYPHS[fraction];

  if (glyph) {
    return whole === 0 ? glyph : `${whole}${glyph}`;
  }

  return String(Math.round(quantity * 100) / 100);
}
