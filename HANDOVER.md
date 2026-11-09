# Webster Pack Helper — Project Handover

Written 1 November 2026. Everything below was verified against the live repository on the day it was written, not recalled from conversation.

---

## 1. What the project is

A web app that walks a person through filling a Webster pack: the weekly plastic tray with a compartment for each day and each dose time. It ticks off each compartment as it is filled so nothing is missed or doubled.

The gap it fills: existing medication apps handle reminders and "did you take it" tracking. Nothing helps with the twenty minutes at the kitchen table with eleven boxes of tablets and a plastic tray, trying not to lose your place.

**One sentence:** a medication list, plus a guided packing session that tracks which compartments are filled.

**Who it is for:** possibly someone in their seventies or eighties, possibly on a tablet device, possibly with a tremor, possibly in poor light. That audience drives most of the design decisions below.

### Hard boundary, never cross it

The app is deliberately not a clinical tool, and is scoped to stay outside medical device regulation. It must never behave as though it knows anything about medicine. Specifically, there is no:

- dose calculation of any kind (it stores what the person types and shows it back)
- drug interaction checking, warnings, or clinical advice
- scanning or reading of prescriptions (no OCR)
- reminders, alarms, notifications, or adherence tracking
- cloud accounts, sync, or sharing between devices
- pharmacy or health record integration

If a future change starts to look like any of these, stop and raise it rather than building it.

---

## 2. Current state, verified 1 November 2026

| | |
|---|---|
| Repository | `xAnDrOm3dAx/webster-packed-rev1` (public) |
| Current branch | `main` only, at commit `2a92767`. No other branches exist. |
| Tests | 169 passing, across 7 test files |
| Type check and build | clean (`tsc -b && vite build`) |
| Linter | clean (oxlint, 0 warnings, 0 errors) |

**Milestones 1 and 2 are complete.** All pre-Milestone-3 tickets (A1 to A9) are closed and merged. Milestone 3 has not been started.

---

## 3. Stack and structure

- **Vite + React + TypeScript**, Tailwind CSS, Vitest for tests, oxlint
- **localStorage only.** No backend, no server, no database. Deploys as a static site.
- Node via `fnm` (Fast Node Manager, installed with Homebrew), Node v24 LTS

```
SPEC.md       the single source of truth for behaviour, data shapes, acceptance criteria
TICKETS.md    the record of open work, pending decisions, and parked items
CLAUDE.md     thin pointer file: read SPEC.md first, route storage through repository.ts
CLOSEOUT.md   the drift-check prompt run at the end of each milestone
README.md
src/
  types.ts                    all data types
  storage/repository.ts       THE ONLY FILE THAT TOUCHES localStorage
  lib/constants.ts            slot labels, weekdays, defaults, caps
  lib/quantity.ts             all dose formatting and pluralisation
  lib/medicationForm.ts       form state, validation, save/load rules, doseSummary
  components/DosePicker.tsx       tablet dose picker (two rows)
  components/FreeDoseInput.tsx    plain amount box for non-tablet forms
  components/DoseTimeList.tsx     collapsible list of the four times of day
  pages/MedicationsList.tsx
  pages/MedicationForm.tsx
```

### The one structural rule

**Every read and write of stored data goes through `src/storage/repository.ts`.** No component, hook, or helper touches localStorage directly. This has held since Milestone 1 and has been verified repeatedly. It is what makes a later move to a real database a contained job rather than a rewrite. Do not break it.

---

## 4. Scope decisions already settled

| Decision | Settled as |
|---|---|
| Devices | One device only. No sync, no sharing. |
| People per install | One person's medications. |
| Getting in | 4-digit PIN, stored as a hash, set on first run |
| Where data lives | That browser, on that device. Nothing leaves it. |
| Pack cycle | Built for 7 days, length is a setting (7 or 14) |

The PIN is a convenience lock, not real security. The medication data itself is unencrypted and anyone with technical knowledge and physical access could read it. That is an accepted trade-off for version 1, and the Settings screen must not claim otherwise.

---

## 5. How work runs: the three-tool split

- **Claude Code** writes all application code. It has `CLAUDE.md` as its steering file.
- **A separate Claude chat window** acts as the review and process layer. It pulls branches directly, runs independent checks, and approves before anything merges. It does not write application code.
- **Claude Design** is used for visual wireframes only, and is read-only on the codebase.
- **Cursor** is the editor, with a steering file at `.cursor/rules/webster-pack-app.mdc`. The `CLOSEOUT.md` drift prompt is run there at the end of each milestone.

### Review discipline, learned the hard way

**Always pull the branch and verify independently. Never review from a pasted summary.** Christopher pushes first, then says it is up. Reviewing from summaries would have missed all of the following, each of which was caught only by pulling the code and running it:

- a pluralisation bug that turned "patch" into "patche" or "patchs", in the spec's own worked example
- a bug where a dose above the documented ceiling survived by switching form types
- a 48px tap target that breached the 56px accessibility minimum
- reasoning that existed only in a chat window and never reached the repository
- a test that passed for the wrong reason, asserting a field was absent while the code showed it

**Work must appear as a ticket before it is built.** There was one instance (ticket A9) where Claude Code built uninstructed work and reported it as already complete. The work was correct and was merged, but the rule was then made explicit: if a real gap is spotted, add it to `TICKETS.md` as an open item and flag it, do not build it.

**Claude Code editing `SPEC.md` when explicitly asked is fine and preferred.** An earlier instruction to keep the spec off-limits to Claude Code was reversed.

**One milestone per session.** Long sessions drift. Commit at the end of each.

### Response style expected

- Plain English throughout. Christopher is not a professional software engineer or a medical professional. Avoid jargon or define it briefly in passing.
- Short and readable, not dense.
- Paste-ready instruction blocks for Claude Code, not hedged observations.
- Direct pushback preferred. If something is wrong, say so plainly with a paste-ready correction.
- No em dashes in written output. Use a comma, colon, or full stop. En dashes in date ranges are fine.
- Australian spelling: organise, licence (noun), centre, colour.
- Never invent facts. Ask if unsure.
- Never delete anything without approval.
- Ask where to save before writing a file.

---

## 6. What Milestone 2 built

**Screens:** medications list (with archive), add/edit medication form.

**Dose entry:** a two-row tablet picker (whole tablets 0 to 4 plus a capped "Custom" box, and a part-tablet row of ¼, ½, ¾), a plain amount box for non-tablet forms, and a collapsible list of the four times of day.

**Data:** an optional `doseUnit` word on a medication, plus default settings and a `getSettingsOrDefaults()` read so Milestone 3 knows a pack is 7 days.

### The eight awkward cases, all working and tested

These came from a real hospital outpatient medication record. They are the acceptance tests for the medication form.

| Case | Example | Behaviour |
|---|---|---|
| Half tablets | "½ a tablet in the morning" | Stored as `0.5`, displayed as "½" |
| Split dose, different amounts | "3 tablets morning and 2 at midday" | One medication, different amount per time of day |
| Same drug listed twice | Bumetanide as both a fixed daily dose and a separate when-required dose | Two separate records. The app must not treat this as a duplicate or offer to merge them. |
| When required (PRN) | "2 tablets once a day when required" | Generates no compartments. Appears in a separate not-packed list. |
| Once weekly, specific day | Weekly injection on Tuesdays | Stored with the chosen days; because it is an injection it is never packed |
| Free text, no dose | "Take as directed" | Shown verbatim, never parsed, no compartments ever |
| Not a tablet | Inhaler, injection, oil | Listed for completeness, never given a compartment |
| Long directions | Multi-sentence PRN instructions | Stored and shown in full, wrapped, not truncated |

**The governing rule:** if the app is not certain something belongs in a compartment, it does not create one. Under-filling the grid is safe. Over-filling it is not.

### Behaviour rules settled during Milestone 2

- **Dose taps set the value, they never toggle it off.** An earlier build made them toggle (tap "1" on a dose of 1½ and you were left with ½). That was deliberately reversed. Clear is the only way to remove a dose. The reasoning is recorded in SPEC §7 under "Why the dose picker works this way".
- Changing Form between tablet and non-tablet resets the doses. Changing within one side keeps them.
- "Goes in the pack" survives a schedule round-trip, and is not silently re-ticked when Form changes within one side.
- Chosen days sort into week order.
- Liquids never display as tablet fractions.
- The form refuses to save in four cases: no name; a fixed-schedule medication with all four doses at zero; "specific days" with no day chosen; as-needed or as-directed with no directions. **The second rule is the one Milestone 3 leans on:** every fixed medication therefore has at least one dose, so a medication that would produce an empty row of compartments cannot exist.
- Medications are archived, never deleted. `repository.ts` still exports a `deleteMedication` function and nothing calls it. The reason archiving won: completed packs refer to medications by id, so deleting one would leave pack history pointing at something that no longer exists.
- Dose caps: 10 whole tablets per time of day (making 10¾ the maximum), and 999 for non-tablet amounts. Both are arbitrary guard rails on a typed field, not clinical limits. The highest dose in the real reference record was 3 tablets. If a real prescription needs more, raise `CUSTOM_WHOLE_MAX` deliberately and note why.

### The dose unit rule (tickets A1 and A9)

Three groups, decided by the medication's form:

- **tablet, capsule:** no unit field. The picker's own wording covers it.
- **inhaler, injection, liquid:** optional unit, shown **verbatim**, never re-spelled. "5 ml", "20 mg", "2 puff". The pluraliser never touches these.
- **other** (a patch, a sachet, a wafer): optional unit, **pluralised**. "1 sachet", "2 patches".

A typed plural is stored as the singular, so "sachets" and "sachet" both store as "sachet". Words ending in ch, sh, s, x or z take "-es", so "patch" and "patches" both round-trip correctly. Words of two characters or fewer are left alone.

The unit is snapshotted onto `PackEntry.quantityUnit` at pack creation, for the same reason the name and quantity are: editing a medication halfway through packing must not change a pack already being filled.

Known limitation, deliberately not fixed (ticket D6): the pluraliser over-strips a silent "e" after a sibilant, so "doses" would store as "dos". You cannot tell a silent e from the letters alone, and "dose" is an unlikely answer to "what are these called?".

---

## 7. What remains

### Blocking Milestone 3

| ID | Who | What |
|---|---|---|
| **C1** | Christopher | **Read five paragraphs in SPEC §7.** They are a reconstruction of *why* decisions were made, not Christopher's own words, and they are honestly labelled in the file as "Reasoning reconstructed from session transcript". They are currently at lines 252, 260, 263, 267 and 271. If the file has moved, search for the label instead. Ten minutes of reading. From here on they stand as settled reasoning, and Milestone 3 builds directly on that section. |
| **B1** | Christopher | **Settle the packing screen layout** in Claude Design. Two directions to compare, in two separate conversations, using the Wireframe template. See section 8 below for the prompts. |

B2 (close two spec gaps in §7) was closed on 9 November 2026 with no change needed. Both the Check pack screen and the collapsed "Not going in the pack" panel have been in SPEC §7 since the first commit, and nothing in the spec describes full-screen steps. Check pack is only one paragraph so far and gets fleshed out with Milestone 4.

### Then

| ID | Who | What |
|---|---|---|
| B3 | Claude | Write the Milestone 3 brief, anchored on §4, §5 and §7. Must state the per-compartment quantity requirement explicitly. |
| B4 | Claude Code | Build it. Pack creation, compartment generation, medication-first flow, fill and unfill, Fill all, progress, resume after closing the browser. |
| B5 | Christopher | Design review pass. Findings fixed in Claude Code only. |
| B6 | Christopher | Test on the actual tablet device (`npm run dev -- --host`). |
| B7 | Claude / Christopher | Close-out using `CLOSEOUT.md`, then merge. |

### Two decisions waiting on Christopher

| ID | What |
|---|---|
| **C6** | **Should the silent dose caps stay silent?** Typing an 11th tablet does nothing at all, with no message. Defensible for a rare case, but it reads as a broken app to someone at a kitchen table. Small either way. |
| **C7** | **Should measure-form units pluralise?** SPEC §5 says inhaler, injection and liquid units show verbatim, never re-spelled. Its own example is "2 puff", not "2 puffs". The code matches the spec exactly, so this is a spec-change decision, not a bug. Raised because "2 injection" reads oddly. |

### Spec tidy-up, not blocking anything

Worth clearing before the Milestone 3 close-out so the next drift report stays short.

- **C2** Fix the tick-mark contradiction. §8 requires a tick mark on filled state; §7 records that ticks were removed from the dose buttons because they clipped against short labels, replaced by a thicker border. Milestone 7's accessibility check will flag this and the argument will be had again.
- **C3** Note in the spec that the time-of-day labels are hardcoded and ignore the editable labels §4 promises. A Milestone 6 job, but leave a marker.
- **C4** Repoint the code comments in five files (`FreeDoseInput.tsx`, `DoseTimeList.tsx`, `DosePicker.tsx`, `DosePicker.test.tsx`, `quantity.test.ts`) that cite "DOSE ENTRY REVISION 2" and "DOSE ENTRY spec". Those were chat messages. Anyone reading the code goes hunting for a file that was never written.
- **C5** Document where the Clear button sits: it is in the part-tablet row and clears both rows.

### Parked until a later milestone, do not raise as new findings

| ID | What | When |
|---|---|---|
| D1 | Placeholder text ("Custom", "Amount") sits around 4.8:1 contrast, below the 7:1 the spec requires | Milestone 7 |
| D2 | Wire the editable time-of-day labels through to the dose list and medications list | Milestone 6 |
| D3 | New medications take their position number from the current count. If real deletion is ever added, two could share a position. | If deletion is added |
| D4 | No dose checking at the data layer before Import ships. Already documented in §14. | Milestone 6 |
| D5 | Dev server port changed. No action. | — |
| D6 | Pluraliser over-strips a silent "e" after a sibilant ("doses" stores as "dos"). Won't fix, see section 6. | — |
| D7 | `getSettingsOrDefaults` fills in missing fields but not invalid ones. A stored cycle length of null, 0 or 365 passes through untouched, and Milestone 3 would generate that many compartments. Unreachable until Import can write settings. Check the value is 7 or 14 and fall back otherwise. | Milestone 6 |

### Remaining milestones

- **Milestone 3** The packing session (next)
- **Milestone 4** Check pack verification screen, marking a pack complete, history
- **Milestone 5** Print list
- **Milestone 6** PIN, export, import, Settings screen
- **Milestone 7** Accessibility pass against §8, tested on a real tablet

---

## 8. Milestone 3: what matters most

This is the whole product. Get it wrong and the app is pointless.

### Medication by medication, not compartment by compartment

The obvious design shows compartment 1 (Monday morning), lists what goes in it, ticks them off, then moves to compartment 2. **Do not build this.**

When a person actually packs a tray they pick up one box of tablets and work along every compartment that box goes into, then put it down and pick up the next. Compartment-first means picking up and putting down eleven boxes twenty-eight times. Medication-first means picking up each box once.

So: show one medication at a time with its name, brand, what it is for, quantity per dose, and any notes. Below it, a grid of **only** the compartments that medication goes into. For a once-daily morning tablet on a 7-day pack that is 7 cells in a row, not a 28-cell grid with 21 greyed out. Tapping a cell fills it, tapping again unfills it. A **Fill all** button ticks every cell for that medication in one tap, which is the common case. Progress shows as "Medication 4 of 11". Moving on with cells unfilled is allowed but flags the medication as incomplete. Never block the person.

**Every tap writes straight to storage.** Closing the browser, the device sleeping, or a phone call mid-session must not lose a single tick. On reopening, return to the medication that was in progress.

A collapsed panel on the same screen lists the not-packed medications (as-needed, as-directed, and non-tablet forms) with their directions in full, so the person can see nothing has been forgotten, clearly separated so nothing gets packed by mistake.

### The two layout options for Claude Design (ticket B1)

Run these in **two separate conversations**, not one. Pasting both into the same thread makes the second read as "change what we just built" rather than "show me a different idea". Use the **Wireframe** template, design system **None**, and the default Sonnet model. Wireframe keeps the output at structure level rather than spending effort on polish that will be rebuilt in Tailwind anyway.

**Variant A, card plus row:**

> Design a mobile-first web screen for "filling" a weekly medication organiser tray, one medication at a time.
>
> Show: one medication card (name, brand name, dose amount, a short note like "swallow whole"), and below it tappable cells, one per compartment this medication goes into: one row for each time of day it is taken, with the time of day as the row heading, and one cell per day in that row showing the day and quantity. Use a split dose as the example: 3 tablets in the morning and 2 at noon, every day, so there are two rows (Morning: Mon 3, Tue 3 and so on; Noon: Mon 2, Tue 2 and so on). It must always be clear which day and which time of day each cell belongs to. A "Fill all" button. A "Next medication" button. A slim progress indicator ("4 of 11").
>
> Constraints: tap targets at least 56px, compartment cells around 72px. Base text 18px, medication name 24px+. Filled cells must be distinguishable without colour alone: combine a fill, a border change, and a checkmark. High contrast (7:1+). One accent colour for "filled", a deep blue or teal, not red or green, colourblind-safe. No hover-dependent interactions.
>
> Mood: calm, high-contrast, generous whitespace, built for an older adult, possibly with a tremor, in ordinary room light. Should feel like a well-made appliance, not a hospital form or a flashy app.

**Variant B, full tray with current medication highlighted:** same prompt, but replace the "Show" paragraph with:

> Show the whole week's tray as a background grid (7 days by dose times), with the compartments belonging to the current medication highlighted and everything else dimmed. Use a split dose as the example: 3 tablets in the morning and 2 at noon, every day, so the Morning and Noon rows are highlighted. Above or beside the grid: the medication name, brand, dose amount, and a short note. A "Fill all" button. A "Next medication" button. A slim progress indicator ("4 of 11").

A shows only the relevant compartments, so it is simpler per screen but never shows the whole tray. B stays closer to how the physical object looks but risks feeling busy at 375px width. That is the thing worth seeing rendered rather than guessing about.

### Things Milestone 3 must get right

- Every pack entry is generated when the pack is created, and each stores a **snapshot** of the medication name, quantity, and unit. If the medication list changes mid-pack, the pack in progress does not change underneath the person.
- Only fixed-schedule medications with `goesInPack: true` generate entries. Nothing else, ever.
- Read the pack length from `getSettingsOrDefaults()`. **Do not hardcode 7.** Do not build a Settings screen, that is Milestone 6.
- Compartment cells and the print list show the quantity, then the unit word if one is stored. Tablets keep their fraction glyphs.

---

## 9. Design and accessibility requirements

These apply to every screen, not just a final polish pass. Do not defer them and do not ship a control that fails them.

- Minimum tap target 56×56px. Compartment cells around 72px.
- Base font 18px. Medication names 24px and above.
- Text contrast at least 7:1. (Note this is stricter than the usual WCAG AA standard. Verify against real colour values, not by eye. Tailwind's `text-slate-600` and `bg-teal-700` both fail it; `slate-700` and `teal-800` pass.)
- Filled and selected states must not rely on colour alone.
- No hover-only behaviour. No timeouts, no auto-advance, no disappearing messages carrying important information.
- Visible keyboard focus everywhere. Respect `prefers-reduced-motion`.
- Works in portrait and landscape from 375px wide.
- Destructive actions (reset pack, an import that replaces all data) always confirm. Archiving does not, because it is reversible from the same button.
- On a failed save, focus moves to the error summary box, not to the first broken field, so a screen reader user hears the full list of problems.

**Visual direction:** calm and clinical-adjacent without being cold or hospital-like. High contrast, generous whitespace, one strong accent colour for the filled state. Large plain sans-serif. Should look like a well-made appliance, not an app.

**Words:** plain, active, consistent. "Fill all", "Next medication", "Check pack", "Finish pack". Never "submit", "confirm entry", "dose administration".

---

## 10. Commands

```
npm run dev              start the dev server
npm run dev -- --host    start it reachable from the tablet on the same network
npx vitest run           run the tests
npm run build            type check and build
npm run lint             run oxlint
```

Pulling a specific branch in a shallow clone:

```
git fetch origin branch-name:local-name
```

---

## 11. Known business context

Consumer monetisation in this space is difficult. Pharmacy packing services are often free or government-funded, and regulated care workers are generally not permitted to pack trays themselves. This has not changed the build plan, but it is worth knowing before anyone proposes a commercial direction.
