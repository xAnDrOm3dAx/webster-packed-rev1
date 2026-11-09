# Webster Pack Helper — Ticket List

> **How to use this file (Claude Code, read this):** This is a record, not a
> work queue. Do not start any ticket unless Christopher names it in the
> current session. The "Who" column says who would do the work *if* it were
> asked for — it is not permission to begin. Tickets marked `[?]` are waiting
> on a decision and must not be implemented or decided for him. Tickets marked
> `[-]` are deliberately deferred: do not raise them as new findings.
>
> When a ticket is completed, update its status here in the same commit as the
> code change.

Last reviewed: 9 Nov 2026
Branch audited: `main` (2a92767), 169 tests passing, build and linter clean.

**Status key**
`[ ]` open · `[x]` done · `[~]` in progress · `[?]` waiting on Christopher's decision · `[-]` parked until a later milestone

---

## A. Before Milestone 3 can start

| ID | Status | What | Who |
|---|---|---|---|
| A1 | `[x]` | **Decide the unit question for "other" form medications.** The spec says a plain number with no unit is safe because non-tablet forms never get packed — but it also deliberately allows "other" (a patch, a sachet) to *be* packed. So a packed "other" medication can show as bare `2.5` with nothing saying 2.5 of what. Milestone 3 builds the screen that has to display that number. If you don't decide, Milestone 3 decides for you. **Decided:** optional unit word (`doseUnit`) on packed "other", snapshotted onto `PackEntry.quantityUnit`; SPEC §4/§5/§7/§11 updated. Follow-ups: a plural word typed off the box stores as the singular ("sachets" → "sachet", words of ≤2 characters left alone); words ending in ch/sh/s/x/z take "-es" so "patch"/"patches" and "box"/"boxes" round-trip correctly; and unticking "Goes in the pack" clears the word so it can't sit stored with no visible field to edit it. | Christopher |
| A2 | `[x]` | **Fix the dose picker going blank when editing a dose above 4.** Save 7 tablets, reopen it, and the picker shows nothing selected and an empty box while 7 is still stored. Confirmed bug. Fable 5's Fix 1. *Medication form now loads the saved record on the first render so the picker mounts with the real dose.* | Claude Code |
| A3 | `[x]` | **Stop liquid doses showing as tablet fractions.** A 0.5ml liquid currently displays as "½" on the medications list, which reads as half a tablet. Shared formatting helper, so it would follow straight onto the packing screen. Fable 5's Fix 2. *Fixed by the A1 unit work, which made `doseSummary` form-aware. Skip Fix 2 when the A2–A6 audit batch runs; do not do this twice.* | Claude Code |
| A4 | `[x]` | **Stop "Goes in the pack" re-ticking itself when Form changes.** Untick it on a tablet, switch to capsule, and it silently comes back on — adding something to the pack the person removed. Fable 5's Fix 3. *Choice is kept when Form stays on one side of the tablet/non-tablet boundary; crossing the boundary still resets to the new form's default.* | Claude Code |
| A5 | `[x]` | **Stop "Goes in the pack" clearing on a schedule round-trip.** Fixed → As needed → Fixed loses the tick. Fable 5's Fix 4. *Leaving Fixed no longer zeros the checkbox; save still forces false for as-needed / as-directed.* | Claude Code |
| A6 | `[x]` | **Sort chosen days into week order.** Tapping Fri then Mon stores and shows "Fri, Mon". Fable 5's Fix 5. *Days are sorted on tap and when loading a saved medication.* | Claude Code |
| A7 | `[x]` | **Settings groundwork.** Write default values for pack length and time-of-day labels into the data layer now, with a helper that returns saved settings or those defaults. Milestone 3 needs to know a pack is 7 days; the Settings screen isn't until Milestone 6. Without this, Milestone 3 will hardcode it or wander off and build Settings early. *`DEFAULT_CYCLE_DAYS` (7) and `DEFAULT_SETTINGS` added in `lib/constants.ts` beside the existing `DEFAULT_SLOT_LABELS`; `getSettingsOrDefaults()` added to `repository.ts`, filling in field by field and returning a fresh object each call. `getSettings()` is unchanged and still returns `null` when nothing is saved. SPEC §4 documents both reads. Milestone 3 should call `getSettingsOrDefaults()` for `cycleDays` rather than hardcoding 7. Wiring the saved slot labels into the UI is still D2/C3 and was left alone.* | Claude Code |
| A8 | `[x]` | **Merge the dose entry work into `main`.** All of it currently sits on `milestone-2-dose-entry-revised`. Do this after A2–A7 are green. *The dose-entry commits had already reached `main` and `milestone-2-dose-entry-revised` was gone; the outstanding work was `Ticket-A7` (A7 settings groundwork plus the D7 note), fast-forwarded onto `main` with 169 tests passing, build and linter clean.* | Christopher |
| A9 | `[x]` | **Revise A1: unit field for all non-tablet forms.** A1 left inhaler/injection/liquid as a bare number because they never generate a compartment. The number is still shown on the medications list, the dose-entry rows, and (once built) the not-packed panel and print list. Optional unit field now shown for every fixed-schedule non-tablet form: measure forms store and display verbatim; `other` keeps A1's pluraliser. Decoupled from "Goes in the pack". | Claude Code |

---

## B. Milestone 3 — the packing session

| ID | Status | What | Who |
|---|---|---|---|
| B8 | `[x]` | **Cells must name the time of day, not just the day.** Do before B1. SPEC §7 said each cell shows "the day and the quantity", so the §5 split dose (3 morning, 2 noon) gave two cells reading "Mon — 3" and "Mon — 2" with nothing saying which compartment each goes in. The Variant A wireframe prompt (now under "B1 wireframe prompts" below) had the same flaw ("one per day"). *SPEC §7 now requires day and time of day on every cell, visible on screen (a row heading counts) and in the cell's accessible name, using the labels from `getSettingsOrDefaults()`. Layout left to B1. Both B1 wireframe prompts now use the split dose as their worked example.* | Claude Code |
| B9 | `[ ]` | **Archived medications in packs.** Do before B3. SPEC §4 rule 2 says fixed medications with `goesInPack: true` generate entries, but never says only *active* ones, so an archived medication would still get compartments. Done when SPEC says pack creation skips archived medications. | Claude / Christopher |
| B10 | `[ ]` | **The "Not going in the pack" panel misses medications.** Do before B3. SPEC §7 describes it as "as-needed, as-directed, and non-tablet medications". A fixed tablet with "Goes in the pack" unticked, or an `other` with it unticked, fits none of those and would show nowhere. That undercuts the panel's job of showing nothing was forgotten. §5 also calls it "Not packed — as needed", so the name is inconsistent too. Done when SPEC says exactly which medications the panel lists (every active one that generates no compartment, or a stated alternative) and uses one name for it throughout. | Claude / Christopher |
| B11 | `[ ]` | **The pack snapshot is incomplete.** Do before B3. `PackEntry` saves name, quantity and unit only. The packing screen also shows brand, purpose and notes, and how a quantity is formatted depends on `form` (½ for tablets versus 0.5 for others, pluralised or verbatim units). Reading those from the live medication lets an edit mid-pack change the pack in progress, which SPEC §4 rule 1 forbids. Needs a data model decision. Done when SPEC §4 says which fields are snapshotted, and where (on each entry or once per medication per pack), and which, if any, are deliberately read live. | Claude / Christopher |
| B12 | `[ ]` | **Nowhere to store where the person is up to.** Do before B3. SPEC §7 says reopening returns to "the medication that was in progress", but `PackInstance` has no field for it. The first unfilled medication isn't always right, because skipping ahead is allowed. Done when SPEC says what is stored, where, and when it is written. | Claude / Christopher |
| B13 | `[ ]` | **Starting a pack is undefined.** Do before B3. Open questions: who picks the start date; how `dayIndex` maps to weekdays for "specific days" medications when a pack starts mid-week, and on a 14-day pack; what happens if a pack is already in progress; where "Reset pack" lives (it appears only in §8); and where §5's "note on the Tuesday column" goes on a medication-first screen. Done when SPEC answers each one. | Claude / Christopher |
| B1 | `[ ]` | **Settle the packing screen layout.** Two directions to compare: medication card with a row of only its compartments, versus the whole tray shown with the current medication's compartments highlighted. Claude Design, separate conversations, Wireframe template. Prompts are under "B1 wireframe prompts" below the table. | Christopher |
| B2 | `[x]` | **Close the two spec gaps first.** §7 has no "Check pack" verification screen written up, and §5 treats not-in-tray medications as separate full-screen steps rather than a panel alongside the main flow. Both need settling before Claude Code builds from that section. *Closed 9 Nov 2026, no change needed: both were already in SPEC §7 from the first commit (81eded4), under "Then — check pack" and the collapsed "Not going in the pack" panel. Nothing in the spec describes full-screen steps. Check pack is only one paragraph so far; it gets fleshed out with Milestone 4 (E1).* | Claude / Christopher |
| B3 | `[ ]` | **Write the Milestone 3 brief.** Anchored on §4, §5 and §7, and must state the per-compartment quantity requirement explicitly. It must also cover: what to show the person when a save to storage fails, so no tick is lost silently; and saving "Fill all" and pack creation in one go, so an interruption can't leave them half done. | Claude |
| B4 | `[ ]` | **Build it.** Pack creation, compartment generation, medication-first flow, fill and unfill, Fill all, progress, resume after closing the browser. | Claude Code |
| B5 | `[ ]` | **Design review pass**, findings fixed in Claude Code only. | Christopher |
| B6 | `[ ]` | **Test on the actual tablet** (`npm run dev -- --host`). | Christopher |
| B7 | `[ ]` | **Close-out and merge** using the close-out drift check in `CLAUDE.md`. | Claude / Christopher |

### B1 wireframe prompts

Moved here word for word from the old `HANDOVER.md` §8 so they survive for ticket B1.

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

---

## C. Spec tidy-up — batch whenever

None of these block anything. Worth clearing before the Milestone 3 close-out so the drift report stays short.

| ID | Status | What | Who |
|---|---|---|---|
| C1 | `[ ]` | **Read the five reconstructed paragraphs** in §7 (lines 252, 260, 263, 267, 271 as of 9 Nov 2026; if the file has moved, search for "Reasoning reconstructed"). These are a reconstruction of *why* you decided things, not your own words. From here on they get treated as settled, so 10 minutes of reading now is worth it. | Christopher |
| C2 | `[ ]` | **Fix the tick-mark contradiction.** §8 requires a tick mark on filled state; §7 records that ticks were removed from dose buttons because they clipped. Harmless today, but Milestone 7's accessibility check will flag it and you'll argue it out again then. | Claude Code proposes, Christopher approves |
| C3 | `[ ]` | **Note that time-of-day labels are hardcoded.** The dose entry says Morning/Noon/Evening/Night and ignores the editable labels §4 promises. Genuinely a Milestone 6 job — leave a note so it gets found again. | Claude Code |
| C4 | `[ ]` | **Repoint the code comments.** Five files (`DosePicker.tsx`, `DosePicker.test.tsx`, `DoseTimeList.tsx`, `FreeDoseInput.tsx`, `quantity.test.ts`) cite "DOSE ENTRY REVISION 2" notes that only ever existed in a chat window. Anyone reading the code goes hunting for a file that doesn't exist. | Claude Code |
| C5 | `[ ]` | **Document where the Clear button sits** — it's in the part-tablet row and clears both rows. One sentence in §7 for completeness. | Claude Code |
| C6 | `[?]` | **Decide whether the silent caps stay silent.** Typing an 11th tablet does nothing at all, with no message. Defensible for a rare case, but it reads as a broken app to someone at a kitchen table. | Christopher |
| C7 | `[?]` | **Decide whether measure-form units should pluralise.** SPEC.md §5 says inhaler/injection/liquid units are shown verbatim, never re-spelled — its own example is "2 puff", not "2 puffs" (`formatFreeDoseText` in `quantity.ts` passes `pluralise: false` for these forms deliberately). Raised because it reads oddly on screen ("2 injection"); current behaviour matches spec exactly, so this is a spec-change decision, not a bug. | Christopher |
| C8 | `[?]` | **Non-tablet doses round on display.** `formatFreeDoseText` in `src/lib/quantity.ts` rounds to 2 decimal places, but `FreeDoseInput` accepts more. 0.125 ml stored shows "0.13 ml", and 0.004 shows "0 ml". The spec says the app shows back what was typed. Two ways to fix it: cap input at 2 decimal places, or stop rounding on display. Done when Christopher has picked one and the stored and shown amounts always match. | Christopher |
| C9 | `[ ]` | **Some selected buttons rely on colour alone.** The Schedule, Frequency and day buttons in `src/pages/MedicationForm.tsx` show selection only by colour (the 1px border just changes colour). §8 says state must not rely on colour alone. The dose buttons already do it properly, with bold text and a thicker border. Done when these buttons show selection the same way. | Claude Code |

---

## D. Parked until their milestone

| ID | Status | What | When |
|---|---|---|---|
| D1 | `[-]` | Placeholder text ("Custom", "Amount") sits around 4.8:1 contrast, below the 7:1 the spec asks for. | Milestone 7 |
| D2 | `[-]` | Wire the editable time-of-day labels through to the dose list and medications list. | Milestone 6 |
| D3 | `[-]` | New medications take their position number from the current count. If real deletion is ever added to the screen, two medications could end up with the same position. | Whenever deletion is added |
| D4 | `[-]` | No dose checking at the data layer before Import ships — already documented in §14. | Milestone 6 |
| D5 | `[-]` | Dev server port changed. No action, noted so it isn't a surprise. | — |
| D6 | `[-]` | Unit-word pluraliser over-strips a silent "e" after a sibilant ("doses" stores as "dos", shows as "1 dos"). Won't fix: you can't tell a silent e from the letters, and "dose" is an unlikely thing to type in "What are these called?". "lozenges" happens to work because the e follows g, not a sibilant. | — |
| D7 | `[-]` | `getSettingsOrDefaults` fills in missing fields but not invalid ones — a stored `cycleDays` of null, 0 or 365 passes through untouched, and Milestone 3 would generate that many compartments. Unreachable until Import can write settings. Check the value is 7 or 14 and fall back to the default otherwise, when Import ships. | Milestone 6 |

---

## E. Remaining milestones

| ID | Status | What |
|---|---|---|
| E1 | `[ ]` | **Milestone 4** — Check pack verification screen, marking a pack complete, history. |
| E2 | `[ ]` | **Milestone 5** — Print list. |
| E3 | `[ ]` | **Milestone 6** — PIN, export, import, Settings screen. |
| E4 | `[ ]` | **Milestone 7** — Accessibility pass against §8, tested on a real tablet. |

---

## Done

| ID | What | Closed |
|---|---|---|
| ✅ | **Milestone 1** — project setup, data types, storage layer with tests. | — |
| ✅ | **Milestone 2** — medication list, add, edit, archive; all eight awkward real-world cases handled. | — |
| ✅ | Dose entry redesign — tap-sets model replacing the additive toggle buttons. | — |
| ✅ | Dose taps always set the value. Tapping the button already selected does nothing, and Clear is the only way to take a dose away. (An earlier build in this milestone made taps toggle off; that was deliberately reversed — see SPEC §7, "Why the dose picker works this way".) | — |
| ✅ | Error summary takes focus on a failed save, rather than the cursor jumping past it. | — |
| ✅ | Contrast raised to 7:1 across the medications list and form. | — |
