# Webster Pack Helper — Build Spec v1

## 1. What we're building

A web app that walks a person through filling a Webster pack (a weekly tray with a compartment for each day and each dose time), ticking off each compartment as it's filled so nothing gets missed or double-dosed.

The gap it fills: existing medication apps deal with *reminders* and *did you take it* tracking. Nothing helps with the twenty minutes where you're sitting at the kitchen table with eleven boxes of tablets and a plastic tray, trying not to lose your place.

**One sentence for the build:** a medication list, plus a guided packing session that tracks which compartments are filled.

---

## 2. Scope of v1

| Decision | v1 |
|---|---|
| Devices | One device only. No sync, no sharing. |
| People per install | One person's medications. |
| Getting in | 4-digit PIN, set on first run. |
| Where data lives | In the browser on that device. Nothing leaves it. |
| Backend | None. |

### Explicit non-goals

Do not build these. They are out of scope for reasons of safety, regulation, and shipping something that works.

- No scanning or reading of prescriptions or medication records (no OCR)
- No dose calculation of any kind — the app stores what the person types and displays it back
- No drug interaction checking, no warnings, no clinical advice
- No reminders, alarms, or notifications
- No adherence tracking ("did you take it")
- No cloud accounts, no sync, no sharing between devices
- No integration with pharmacies or health records

The app is a **checklist for a physical task**. It must never behave like it knows anything about medicine. This is a deliberate line and it should stay drawn where it is.

---

## 3. Stack

- **Vite + React + TypeScript**
- **Tailwind CSS**
- **localStorage** for persistence, accessed only through a single `storage/repository.ts` module
- **Vitest**, with **React Testing Library** for component tests
- Deploys as a static site (Vercel or Netlify — no server required)

Two notes on why:

- Vite over Next.js: there's no server, so there's nothing for Next.js to do. Vite builds faster and there's less to go wrong on a first project. If a backend is added later, the Supabase client is browser-side anyway and drops into this stack fine.
- **All reads and writes go through `repository.ts`.** No component touches localStorage directly. This is the single most important structural rule in the spec — it's what makes a later move to a real database a contained job rather than a rewrite.

---

## 4. Data model

```ts
type Slot = 'morning' | 'noon' | 'evening' | 'night';
type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

type Settings = {
  personName: string;          // display only, e.g. "Mum"
  cycleDays: 7 | 14;           // default 7
  pinHash: string;             // SHA-256 of the PIN
  slotLabels: Record<Slot, string>; // editable, e.g. night -> "Bedtime"
};

type Medication = {
  id: string;
  name: string;                // "Bisoprolol 5mg tablets"
  brandName?: string;          // "Bicor"
  purpose?: string;            // "Improve heart function" — free text, copied from the record
  form: 'tablet' | 'capsule' | 'inhaler' | 'injection' | 'liquid' | 'other';
  doseUnit?: string;           // only for form 'other', e.g. "sachet", "wafer"

  scheduleType: 'fixed' | 'asNeeded' | 'asDirected';

  // fixed only:
  doses?: Record<Slot, number>;   // whole tablets 0–10, plus ¼/½/¾; other forms up to 999
  frequency?: 'daily' | 'specificDays';
  days?: Weekday[];               // when frequency === 'specificDays'

  // asNeeded / asDirected only:
  directions?: string;            // free text, shown verbatim, never parsed

  goesInPack: boolean;            // false for inhalers, injections, liquids
  notes?: string;                 // "Swallow whole", "with food"
  active: boolean;
  sortOrder: number;
};

type PackInstance = {
  id: string;
  startDate: string;           // ISO date, the Monday (or whichever day) the pack begins
  cycleDays: number;           // snapshotted from settings at creation
  status: 'inProgress' | 'complete';
  createdAt: string;
  completedAt?: string;
};

type PackEntry = {
  id: string;
  packInstanceId: string;
  medicationId: string;
  medicationLabel: string;     // snapshotted name at time of creation
  dayIndex: number;            // 0-based
  slot: Slot;
  quantity: number;            // whole tablets 0–10, plus ¼/½/¾; other forms up to 999
  quantityUnit?: string;       // snapshot of Medication.doseUnit at pack creation
  filled: boolean;
  filledAt?: string;
};
```

### Two rules about PackEntry

1. **Every entry is generated when the pack is created**, and each stores a snapshot of the medication name and quantity. If the medication list changes mid-pack, the pack in progress does not change underneath the person. It stays exactly as it was when they started.
2. **Only `fixed` medications with `goesInPack: true` generate entries.** Everything else never appears as a compartment to fill.

---

## 5. Handling the awkward cases

These come from a real hospital outpatient medication record and every one of them must work. Treat them as acceptance tests.

| Case | Real example | Required behaviour |
|---|---|---|
| Half tablets | "Take ½ a tablet in the morning" | Whole tablets entered via fixed taps (0–4) plus a capped custom field for higher amounts. Part tablet is a separate row: None, ¼, ½, ¾. No free typing of decimals. Displayed as "½" in the medication list; read out as "½ a tablet" in the entry form. |
| Split dose, different amounts | "3 tablets in the morning **and** 2 tablets at midday" | One medication, `doses: { morning: 3, noon: 2, evening: 0, night: 0 }`. |
| Same drug listed twice | Bumetanide appears as a fixed daily dose **and** as a separate when-required dose | Two separate medication records. The app must **not** treat this as a duplicate or offer to merge them. |
| When required (PRN) | "Take 2 tablets once each day when required" | `scheduleType: 'asNeeded'`. Generates **no compartments**. Appears in a separate "Not packed — as needed" list on the packing screen and the print list. |
| Once weekly, specific day | Weekly injection on Tuesdays | `frequency: 'specificDays', days: ['tue']`. Because it's an injection, `goesInPack: false` — so it shows as a note on the Tuesday column, not a compartment. |
| Free text with no dose | "Take as directed" | `scheduleType: 'asDirected'`. Directions shown verbatim. No compartments, ever. No attempt to interpret the text. |
| Not a tablet | Inhaler, injection, oil | `goesInPack: false`. Listed for completeness, never given a compartment. |
| Long directions | Multi-sentence PRN instructions about monitoring | Stored and displayed in full, wrapped, not truncated. |

**The consistent rule:** if the app isn't certain something belongs in a compartment, it doesn't create a compartment. Under-filling the grid is safe; over-filling it is not.

**Note on the medication form itself (not just the downstream pack):** the `form` field should also change how the medication form behaves while it's being entered, not only what happens once it's saved.

- For `injection`, `inhaler`, and `liquid`, `goesInPack` is forced to `false` and the checkbox is disabled — the person entering the medication can't turn it back on. `other` is left as a free choice, since it might still be something that gets packed (a patch, a sachet).
- For any form other than `tablet` or `capsule`, the dose-per-time-of-day entry should not use "whole tablets / part tablet" language or the tablet tap buttons — those don't mean anything for a liquid or an injection. A plain free-text amount field is used instead.
- **Decided (revised, ticket A1):** medications with form `other` may be packed if the person ticks "Goes in the pack". When they do, an optional "What are these called?" field appears, storing a single word in `doseUnit` (e.g. "sachet", "wafer"). Doses for `other` are shown as a plain number followed by that word, pluralised whenever the quantity is not exactly 1: "2 sachets", "1 sachet", "0.5 sachets". Never tablet fractions. If the field is left blank, the dose shows as a plain number alone. This field appears nowhere except form `other`. For `injection`, `inhaler`, and `liquid` the free-text amount stays a bare number with no unit field — the medication name and notes carry the unit (e.g. "Amoxicillin 250mg/5ml suspension", note "Give 5ml"). That is safe because those three forms are `goesInPack: false` and never generate a compartment, so the packing screen never has to interpret their number on its own.
- Changing Form between a tablet form (tablet, capsule) and a non-tablet form
resets all four doses to 0. The number means something different on each
side: 250 is a plausible dose in ml, never in tablets. Each side's ceiling
is only checked as the person types, so a value carried across would arrive
unchecked. Changing form within one side keeps the doses.

---

## 6. Screens

1. **Unlock** — PIN pad
2. **Home** — resume or start a pack; shortcuts to medications and settings
3. **Medications** — list, add, edit, archive
4. **Medication form** — add/edit one medication
5. **Packing session** — the core screen (section 7)
6. **Check pack** — verification pass by compartment
7. **Print list** — static fallback
8. **Settings** — name, cycle length, slot labels, change PIN, export/import

---

## 7. The packing session — read this part twice

This is the whole product. Get it wrong and the app is pointless.

### Work medication by medication, not compartment by compartment

The obvious design is to show compartment 1 (Monday morning), list what goes in it, tick them off, move to compartment 2. **Do not build this.**

When a person actually packs a tray, they pick up one box of tablets and work along every compartment that box goes into, then put the box down and pick up the next one. Compartment-first means picking up and putting down eleven boxes twenty-eight times over. Medication-first means picking up each box once.

So:

**Primary flow — one medication at a time**

- Show one medication: name, brand, what it's for, quantity per dose, any notes ("swallow whole").
- Below it, a grid of only the compartments this medication goes into. For a once-daily morning tablet on a 7-day pack, that's 7 cells in a row — not a 28-cell grid with 21 greyed out.
- Each cell shows the day and the quantity ("Mon — 1", "Tue — ½"). For form `other` the cell shows the quantity followed by the stored unit word if one exists ("Mon — 2 sachets"), never tablet fractions; with no unit word stored, the quantity alone.
- Tapping a cell marks it filled. Tapping again unfills it.
- A **"Fill all"** button ticks every cell for that medication at once — this is the common case and should be one tap.
- **Next medication** advances. Progress shown as "Medication 4 of 11", plus a thin bar.
- Moving forward with cells unfilled is allowed, but the medication is flagged as incomplete rather than done. Never block the person.

**Then — check pack**

After the last medication, a verification screen showing the tray the way it physically looks: a grid of days across, dose times down, with the contents of each compartment listed. This is where errors get caught. Anything unfilled is clearly marked.

**Then — finish**

Marking the pack complete records the date. It stays in history and can be reopened.

### Session must survive interruption

Every tap writes straight to storage. Closing the browser, the tablet sleeping, or a phone call mid-session must not lose a single tick. On reopening, the app returns to the medication that was in progress.

### Also on the packing screen

- A collapsed panel: **"Not going in the pack"** — the as-needed, as-directed, and non-tablet medications, with their directions in full. Present so the person can see nothing has been forgotten, clearly separated so nothing gets packed by mistake.

### Dose entry decisions

- The dose section is collapsible, one time-of-day open at a time.
- Tapping a dose button sets the value; it does not toggle it off.
- A zero dose reads as "Not given".
- The word "tablet" swaps to "capsule" when the form is a capsule.

#### Why the dose picker works this way

The picker was rebuilt twice during milestone 2 (the working notes called them "DOSE ENTRY — REVISED" and "DOSE ENTRY — REVISION 2" — the names the code comments still cite). Those notes only ever existed in chat, so the reasoning is written down here.

**Tapping sets the dose; it never toggles it off.** The first build used additive toggle buttons — 1, 2, 3, ¼, ½, ¾, Clear — where tapping a button already contributing to the dose subtracted it again. With a dose of 1½, tapping "1" left ½ behind. The old code said so plainly: *"it toggles off and leaves just the fraction (1.5, tap 1 -> 0.5)."*

That is the fault worth understanding. A stray second tap silently reduced a dose, and the result looked completely normal afterwards — ½ a tablet is a perfectly ordinary dose, so nothing on screen said anything was wrong. A person with a tremor, which §8 assumes, produces stray second taps. Single-select removes the whole class of error: a tap always names the dose that results, tapping the selected button again does nothing, and Clear is the only way to take a dose away. Removing a dose is now a deliberate act rather than a slip.

The same reasoning drives two smaller rules. The value display is read-only text and not a number field, so the dose can only ever be what the buttons say it is; and the field and the stored dose must never disagree — emptying the custom field sets that dose to zero rather than leaving the previous value stored behind an empty box. (Reasoning reconstructed from session transcript; original rationale not recorded.)

**Whole tablets: fixed taps 0–4, then a capped custom field.** The row is
kept short deliberately. Doses above four whole tablets exist but are rare,
so spending slots on 5, 6, 7, 8, 9 would fill the row with values almost
nobody enters and push the common ones further from the thumb. Slots one to
five are the common values 0–4; the sixth is a "Custom" field, whole numbers
only, for the rare higher dose. The row wraps to a second line rather than
shrinking when it can't fit at 56px (see below). (Reasoning reconstructed
from session transcript; original rationale not recorded.)

**On the ceiling of 10.** The custom field is capped at 10 whole tablets, making 10¾ the largest dose per time of day. This was set as a bound on a typed field, not derived from any clinical limit, and the reason for 10 rather than some other number was never recorded — treat it as an arbitrary guard rail. If a real prescription needs more, raise `CUSTOM_WHOLE_MAX` deliberately and note the reason here; do not work around it in the calling code. Non-tablet forms use a separate free-text amount capped at 999 for the same reason: a typed field with no bound accepts a slipped keystroke as a real dose. (Reasoning reconstructed from session transcript; original rationale not recorded.)

The highest single dose observed in the real hospital medication record this spec was built against is 3 tablets, so the ceiling has a wide margin. This is an observation, not a clinical limit.

**One time of day open at a time.** Four expanded pickers, each two rows of buttons, pushes the save button off screen and makes it easy to set Evening's dose while looking at Morning's heading. Collapsed rows read as a summary — the time of day on the left, the dose in plain English on the right — so all four doses can be checked at a glance without opening anything. Nothing is auto-expanded on load, including Morning: an expanded row invites a tap, and the first dose entered should be one the person chose. (Reasoning reconstructed from session transcript; original rationale not recorded.)

**Selected state must survive poor colour vision and poor light.** Selection shows as filled background, bold text, and a thicker border together — never colour alone. An earlier version added a checkmark instead, but it clipped against short labels ("✓ None"), so the border replaced it. For the same audience reasons, dose buttons are 56×56px per §8; when the row cannot fit at that size it wraps to a second line. Buttons never shrink below the minimum to save space.

**Plain English, and no tablet glyphs where there are no tablets.** Doses read as "1 tablet", "½ a tablet", "1½ tablets", and "Not given" for zero — "Not given" rather than "0" because zero is a real instruction here, not an empty field. (Reasoning reconstructed from session transcript; original rationale not recorded.) The fraction glyphs are for tablets only: a 2.5ml liquid dose reads "2.5", never "2½", because a liquid has no such thing as a half-tablet and the glyph would import tablet language into a form that has none.

---

## 8. Design and accessibility

The user may be in their seventies or eighties, possibly on a tablet, possibly with a tremor, possibly at the kitchen table in poor light.

**Hard requirements**

- Minimum tap target 56×56px. Compartment cells larger — aim for 72px.
- Base font 18px. Medication names 24px+.
- Text contrast at least 7:1.
- **Filled state must not rely on colour alone** — a tick mark plus a clear fill plus a border change.
- No hover-only behaviour. Nothing revealed by mouse-over.
- No timeouts, no auto-advance, no disappearing toasts carrying important information.
- No animation on tick beyond a fast (<150ms) state change. Respect `prefers-reduced-motion`.
- Visible keyboard focus everywhere.
- Works in portrait and landscape from 375px up.
- Destructive actions (delete medication, reset pack) always confirm.

**Visual direction**

Calm and clinical-adjacent without being cold or hospital-like. High contrast, generous whitespace, one strong accent colour for the filled state that reads clearly for the common forms of colour blindness (a deep blue or teal rather than green/red). Large plain sans-serif throughout — this is not a place for a display face. The interface should look like a well-made appliance, not an app.

**Words**

Plain, active, consistent. "Fill all", "Next medication", "Check pack", "Finish pack". Never "submit", "confirm entry", "dose administration". Empty states say what to do next: an empty medication list says "Add the first medication" with the button right there.

---

## 9. The PIN — be honest about what it does

The PIN is stored as a SHA-256 hash in localStorage and gates the app on open.

**It keeps a visitor or a grandchild from casually opening the app. It is not real security** — the medication data itself is stored unencrypted, and anyone with technical knowledge and physical access to the device could read it. That is an acceptable trade-off for v1 on a personal device, but the settings screen should not claim otherwise.

Forgot-PIN: a reset that clears the PIN and keeps the data. Document plainly in settings that this is a convenience lock only.

Do not build encryption in v1. If it's wanted later, it's a contained change because everything goes through `repository.ts`.

---

## 10. Backup

Because everything lives in one browser, clearing browser data destroys everything. So:

- **Export** — downloads a `.json` file with all settings, medications, and pack history.
- **Import** — reads that file back, replacing everything, with a confirmation step.
- After the fifth completed pack, a one-time gentle prompt suggesting an export.

This isn't optional polish. Without it a cleared cache means re-typing eleven medications.

---

## 11. Print list

A print stylesheet producing one page: a grid of days across, dose times down, listing what goes in each compartment. Compartment quantities follow the same rule as section 7: tablets and capsules use fraction glyphs; form `other` shows the quantity followed by its stored unit word when one exists, otherwise the quantity alone. Below it, the "not packed" medications with their full directions. Large type, black on white, no colour dependency.

This is the fallback for when the tablet is flat or the person would rather work from paper.

---

## 12. Build order

Work through these in order. Each one should run and be usable before starting the next.

**Milestone 1 — Foundation**
Project setup, types, `repository.ts` with full CRUD and tests, Tailwind, routing. No UI beyond a stub. Done when: tests pass and data survives a refresh.

**Milestone 2 — Medications**
List, add, edit, archive. The medication form must handle every case in section 5. Done when: all eight rows of that table can be entered and come back correctly.

**Milestone 3 — Packing session**
Pack creation and entry generation, the medication-first flow, fill/unfill, fill all, progress, resume after close. Done when: a pack can be created from a realistic medication list and filled end to end without losing state on refresh.

**Milestone 4 — Check pack and finish**
Verification grid, completion, history.

**Milestone 5 — Print list**

**Milestone 6 — PIN, export, import, settings**

**Milestone 7 — Accessibility and polish pass**
Audit against section 8. Test on an actual tablet.

---

## 13. Working with Claude Code

Since this is a first run, a few things that help:

- Start by putting this spec in the repo as `SPEC.md`, and create a short `CLAUDE.md` alongside it saying: read SPEC.md before making changes; all storage goes through repository.ts; do not add features not in the spec.
- **Do one milestone per session.** Ask for milestone 1, review it, commit, then start a fresh session for milestone 2. Long sessions drift.
- Commit at the end of each milestone. If a session goes sideways, it's much easier to throw away one milestone than three.
- Ask explicitly for tests on the section 5 cases. They're the ones that will quietly break.
- When something isn't right, describe the behaviour you want rather than the code you think would fix it.
- If Claude Code proposes something not in this spec, say no and point at section 2.

---

## 14. Deliberately left for later

- Two devices sharing a live session
- Multiple people per install
- Encryption at rest
- Installable app (PWA) with offline support
- Scanning a medication record to prefill the list — if this is ever built, it must require the person to confirm every extracted line before anything reaches a pack list
- Dose validation in the data layer. The tablet ceiling (CUSTOM_WHOLE_MAX)
  and the non-tablet ceiling (FREE_DOSE_MAX) are enforced only by the entry
  controls as the person types. toMedicationInput and repository.ts do not
  check them. This is safe while the form is the only way in, but §10's
  Import reads a JSON file straight into storage — a hand-edited or corrupted
  file would arrive unchecked. Validate at the data layer before Import ships.
