# Working rules

`SPEC.md` is the source of truth for behaviour. `TICKETS.md` is the record of open work, pending decisions and parked items. Don't restate either here.

## Before changing anything

- Read `SPEC.md` first.
- All storage goes through `src/storage/repository.ts`. Nothing else touches localStorage.
- Don't add features that aren't in the spec.
- Read `TICKETS.md` before proposing work. Don't raise parked `[-]` items again, and don't decide `[?]` items for Christopher.
- Never start a ticket that hasn't been asked for in the current session.
- Work must be a ticket before it is built. If you spot a real gap, add it to `TICKETS.md` as an open item and flag it. Don't build it.
- Editing `SPEC.md` is fine, and preferred, when Christopher explicitly asks.

## How sessions run

- One milestone per session. Long sessions drift. Commit at the end of each.
- Review by pulling the branch and running the code and tests yourself. Never review from a pasted summary: past bugs were only caught by running the code.

## Writing to Christopher

- Plain English. Christopher is not a professional software engineer or a medical professional. Avoid jargon, or explain it in passing.
- Short and readable. Paste-ready instruction blocks, not hedged observations.
- Push back directly. If something is wrong, say so plainly and give the correction.
- No em dashes. Use a comma, colon or full stop. En dashes in date ranges are fine.
- Australian spelling: organise, licence (noun), centre, colour.
- Never invent facts. Ask if unsure.
- Never delete anything without approval.
- Ask where to save a new file before writing it.

## Commands

```
npm run dev              start the dev server
npm run dev -- --host    start it reachable from the tablet on the same network
npx vitest run           run the tests
npm run build            type check and build
npm run lint             run oxlint
```

## Close-out drift check

Run at the end of each milestone, before merging. Report only: don't edit `SPEC.md` or `CLAUDE.md` during the check, Christopher reviews the list first.

1. List every behaviour, data shape or component changed, added or removed in the milestone, even small ones.
2. For each, search `SPEC.md` and `CLAUDE.md` for anything still describing the old behaviour. Give file, section heading and line number.
3. For each match: what it says now, what it should say, and whether it's a small wording fix or a bigger structural change.
4. Flag anything changed that the spec doesn't describe at all. That's a gap for Christopher to decide whether to document.
5. Flag any reasoning that exists only in a chat session and not in the repo.
6. Keep it short and in plain English.

## Business context

Consumer monetisation in this space is difficult. Pharmacy packing services are often free or government-funded, and regulated care workers are generally not allowed to pack trays themselves. This hasn't changed the build plan, but know it before proposing a commercial direction.
