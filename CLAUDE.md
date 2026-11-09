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

At the end of each milestone, before merging, run `/closeout <milestone> <branch>` (defined in `.claude/commands/closeout.md`).

## Business context

Consumer monetisation in this space is difficult. Pharmacy packing services are often free or government-funded, and regulated care workers are generally not allowed to pack trays themselves. This hasn't changed the build plan, but know it before proposing a commercial direction.
