// Formatting and selection logic for dose quantities (SPEC.md section 5:
// "Displayed as '½'"). The dose picker is single-select: tapping a button
// SETS the dose, it never adds to or subtracts from the current value.

const FRACTION_GLYPHS: Record<number, string> = {
  0.25: '¼',
  0.5: '½',
  0.75: '¾',
};

// The six complete-dose buttons shown on every time-of-day box, in display
// order: ½  1  1½  2  2½  3.
export const MAIN_DOSE_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3] as const;

// "Other…" panel: whole tablets row.
export const WHOLE_TABLET_OPTIONS = [0, 1, 2, 3, 4, 5] as const;

// "Other…" panel: part tablet row.
export const DOSE_PART_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 0.25, label: '¼' },
  { value: 0.5, label: '½' },
  { value: 0.75, label: '¾' },
] as const;

// Splits a quantity into its whole and fractional parts. Used to preselect
// the "Other…" panel's whole/part rows from the current dose.
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

// Tapping a dose button always SETS the value — it never combines with
// whatever is already there. Tapping the pressed button again is a no-op
// because the result doesn't depend on the current value.
export function selectDose(_current: number, tapped: number): number {
  return tapped;
}

export function clearDose(): number {
  return 0;
}

// Combines the "Other…" panel's whole and part rows into one dose, e.g.
// whole=3, part=0.75 -> 3.75.
export function combineDose(whole: number, part: number): number {
  return Math.round((whole + part) * 100) / 100;
}

// Which of the six main buttons (if any) exactly matches this dose. A dose
// set via "Other…" that doesn't land on one of them (e.g. 0.25) returns
// null, so the caller shows "Other…" selected instead of a main button.
export function matchingMainOption(quantity: number): number | null {
  const rounded = Math.round(quantity * 100) / 100;
  return (MAIN_DOSE_OPTIONS as readonly number[]).find((opt) => opt === rounded) ?? null;
}
