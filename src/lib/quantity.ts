// Formatting and selection logic for dose quantities (SPEC.md section 5:
// "Displayed as '½'"). The dose picker is two single-select rows (whole
// tablets, part tablet); tapping a button SETS that part of the dose, it
// never adds to or subtracts from the current value.

const FRACTION_GLYPHS: Record<number, string> = {
  0.25: '¼',
  0.5: '½',
  0.75: '¾',
};

// The word the picker and the read-out use for a whole unit — "tablet" or
// "capsule", matching the medication's Form field. Both pluralise by just
// adding "s", so no separate plural table is needed.
export type TabletUnit = 'tablet' | 'capsule';

// Dose picker: whole tablets row. The remaining slot in that row is a
// custom number input, capped at CUSTOM_WHOLE_MAX.
export const WHOLE_TABLET_OPTIONS = [0, 1, 2, 3, 4] as const;
export const CUSTOM_WHOLE_MAX = 10;

// FreeDoseInput's cap on a typed amount (ml, puffs, units — whatever the
// non-tablet form's dose is measured in).
export const FREE_DOSE_MAX = 999;

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
// "½ a tablet", "1½ tablets", "Not given" for zero. `unit` swaps the word
// for "capsule" when that's the medication's form.
export function formatDoseText(quantity: number, unit: TabletUnit = 'tablet'): string {
  if (!Number.isFinite(quantity) || quantity <= 0) return 'Not given';

  const { whole, fraction } = splitQuantity(quantity);
  const glyph = FRACTION_GLYPHS[fraction];

  if (whole === 0) {
    return glyph ? `${glyph} a ${unit}` : `${formatQuantity(quantity)} of a ${unit}`;
  }

  if (fraction === 0) {
    return whole === 1 ? `1 ${unit}` : `${whole} ${unit}s`;
  }

  return glyph ? `${whole}${glyph} ${unit}s` : `${formatQuantity(quantity)} ${unit}s`;
}

// A unit word ending in a sibilant (ch, sh, s, x, z) takes "-es" in the
// plural — "patch"/"patches", "box"/"boxes". Used both when storing the
// typed word and when displaying it, so the two sides cannot drift.
export function takesEsPlural(word: string): boolean {
  return (
    word.endsWith('ch') ||
    word.endsWith('sh') ||
    word.endsWith('s') ||
    word.endsWith('x') ||
    word.endsWith('z')
  );
}

// Plain-number dose text for non-tablet forms (injections, inhalers,
// liquids, other) — just the amount, rounded to 2 decimal places with no
// trailing zeros, and none of the "tablet"/"a tablet" wording or fraction
// glyphs from formatQuantity: "2½" means nothing for a 2.5ml liquid dose
// (SPEC.md section 5, "Not a tablet").
//
// `unit` is the optional word a packed 'other' medication stores in
// doseUnit ("sachet", "wafer", "patch"): the amount is followed by that
// word, pluralised whenever the quantity is not exactly 1 — append "es"
// when the word takes it ("2 patches"), otherwise "s" ("2 sachets").
// Blank or absent unit: the amount alone (SPEC.md section 5, ticket A1).
export function formatFreeDoseText(quantity: number, unit?: string): string {
  if (!Number.isFinite(quantity) || quantity <= 0) return 'Not given';
  const amount = String(Math.round(quantity * 100) / 100);
  const word = unit?.trim();
  if (!word) return amount;
  const suffix = takesEsPlural(word) ? 'es' : 's';
  return quantity === 1 ? `${amount} ${word}` : `${amount} ${word}${suffix}`;
}

// Combines the whole-tablets row and part-tablet row into one dose, e.g.
// whole=3, part=0.75 -> 3.75.
export function combineDose(whole: number, part: number): number {
  return Math.round((whole + part) * 100) / 100;
}
