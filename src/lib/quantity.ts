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
