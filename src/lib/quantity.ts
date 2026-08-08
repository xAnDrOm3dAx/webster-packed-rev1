// Formatting and selection logic for dose quantities (SPEC.md section 5:
// "Displayed as '½'"). The dose picker is two single-select rows (whole
// tablets, part tablet); tapping a button SETS that part of the dose, it
// never adds to or subtracts from the current value.

const FRACTION_GLYPHS: Record<number, string> = {
  0.25: '¼',
  0.5: '½',
  0.75: '¾',
};

// Dose picker: whole tablets row. The remaining slot in that row is a
// custom number input, capped at CUSTOM_WHOLE_MAX.
export const WHOLE_TABLET_OPTIONS = [0, 1, 2, 3, 4] as const;
export const CUSTOM_WHOLE_MAX = 10;

// Dose picker: part tablet row.
export const DOSE_PART_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 0.25, label: '¼' },
  { value: 0.5, label: '½' },
  { value: 0.75, label: '¾' },
] as const;

// Splits a quantity into its whole and fractional parts. Used to preselect
// the whole/part rows from the current dose.
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

// Plain-English dose text for the read-only display, e.g. "1 tablet",
// "½ a tablet", "1½ tablets", "Not given" for zero.
export function formatDoseText(quantity: number): string {
  if (!Number.isFinite(quantity) || quantity <= 0) return 'Not given';

  const { whole, fraction } = splitQuantity(quantity);
  const glyph = FRACTION_GLYPHS[fraction];

  if (whole === 0) {
    return glyph ? `${glyph} a tablet` : `${formatQuantity(quantity)} of a tablet`;
  }

  if (fraction === 0) {
    return whole === 1 ? '1 tablet' : `${whole} tablets`;
  }

  return glyph ? `${whole}${glyph} tablets` : `${formatQuantity(quantity)} tablets`;
}

// Combines the whole-tablets row and part-tablet row into one dose, e.g.
// whole=3, part=0.75 -> 3.75.
export function combineDose(whole: number, part: number): number {
  return Math.round((whole + part) * 100) / 100;
}
