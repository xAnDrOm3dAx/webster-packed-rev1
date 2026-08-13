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

Last reviewed: 10 Aug 2026
Branch audited: `milestone-2-dose-entry-revised` (b0a71c7) — 104 tests passing, build and linter clean.

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
| A7 | `[ ]` | **Settings groundwork.** Write default values for pack length and time-of-day labels into the data layer now, with a helper that returns saved settings or those defaults. Milestone 3 needs to know a pack is 7 days; the Settings screen isn't until Milestone 6. Without this, Milestone 3 will hardcode it or wander off and build Settings early. | Claude Code |
| A8 | `[ ]` | **Merge the dose entry work into `main`.** All of it currently sits on `milestone-2-dose-entry-revised`. Do this after A2–A7 are green. | Christopher |

---

## B. Milestone 3 — the packing session

| ID | Status | What | Who |
|---|---|---|---|
| B1 | `[ ]` | **Settle the packing screen layout.** Two directions to compare: medication card with a row of only its compartments, versus the whole tray shown with the current medication's compartments highlighted. Claude Design, separate conversations, Wireframe template. | Christopher |
| B2 | `[ ]` | **Close the two spec gaps first.** §7 has no "Check pack" verification screen written up, and §5 treats not-in-tray medications as separate full-screen steps rather than a panel alongside the main flow. Both need settling before Claude Code builds from that section. | Claude / Christopher |
| B3 | `[ ]` | **Write the Milestone 3 brief.** Anchored on §4, §5 and §7, and must state the per-compartment quantity requirement explicitly. | Claude |
| B4 | `[ ]` | **Build it.** Pack creation, compartment generation, medication-first flow, fill and unfill, Fill all, progress, resume after closing the browser. | Claude Code |
| B5 | `[ ]` | **Design review pass**, findings fixed in Claude Code only. | Christopher |
| B6 | `[ ]` | **Test on the actual tablet** (`npm run dev -- --host`). | Christopher |
| B7 | `[ ]` | **Close-out and merge** using `CLOSEOUT.md`. | Claude / Christopher |

---

## C. Spec tidy-up — batch whenever

None of these block anything. Worth clearing before the Milestone 3 close-out so the drift report stays short.

| ID | Status | What | Who |
|---|---|---|---|
| C1 | `[ ]` | **Read the five reconstructed paragraphs** in §7 (lines 215, 224, 226, 230, 234). These are a reconstruction of *why* you decided things, not your own words. From here on they get treated as settled, so 10 minutes of reading now is worth it. | Christopher |
| C2 | `[ ]` | **Fix the tick-mark contradiction.** §8 requires a tick mark on filled state; §7 records that ticks were removed from dose buttons because they clipped. Harmless today, but Milestone 7's accessibility check will flag it and you'll argue it out again then. | Claude Code proposes, Christopher approves |
| C3 | `[ ]` | **Note that time-of-day labels are hardcoded.** The dose entry says Morning/Noon/Evening/Night and ignores the editable labels §4 promises. Genuinely a Milestone 6 job — leave a note so it gets found again. | Claude Code |
| C4 | `[ ]` | **Repoint the code comments.** Four files cite "DOSE ENTRY REVISION 2" notes that only ever existed in a chat window. Anyone reading the code goes hunting for a file that doesn't exist. | Claude Code |
| C5 | `[ ]` | **Document where the Clear button sits** — it's in the part-tablet row and clears both rows. One sentence in §7 for completeness. | Claude Code |
| C6 | `[?]` | **Decide whether the silent caps stay silent.** Typing an 11th tablet does nothing at all, with no message. Defensible for a rare case, but it reads as a broken app to someone at a kitchen table. | Christopher |

---

## D. Parked until their milestone

| ID | Status | What | When |
|---|---|---|---|
| D1 | `[-]` | Placeholder text ("Custom", "Amount") sits around 4.8:1 contrast, below the 7:1 the spec asks for. | Milestone 7 |
| D2 | `[-]` | Wire the editable time-of-day labels through to the dose list and medications list. | Milestone 6 |
| D3 | `[-]` | New medications take their position number from the current count. If real deletion is ever added to the screen, two medications could end up with the same position. | Whenever deletion is added |
| D4 | `[-]` | No dose checking at the data layer before Import ships — already documented in §14. | Milestone 6 |
| D5 | `[-]` | Dev server port changed. No action, noted so it isn't a surprise. | — |

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
| ✅ | Quantity tap buttons toggle off instead of doing nothing when already selected. | — |
| ✅ | Error summary takes focus on a failed save, rather than the cursor jumping past it. | — |
| ✅ | Contrast raised to 7:1 across the medications list and form. | — |
