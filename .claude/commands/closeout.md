---
description: End-of-milestone drift check of SPEC.md and CLAUDE.md. Report only, no edits.
argument-hint: <milestone number and name> <branch>
---

I'm closing out Milestone $ARGUMENTS. Before I move to the next milestone, check the spec for drift.

Report only: don't edit `SPEC.md` or `CLAUDE.md` during this check. Christopher reviews the list first.

1. List every behaviour, data shape or component changed, added or removed in this milestone, even small ones. Work from the branch's commits and diff, not from memory.
2. For each, search `SPEC.md` and `CLAUDE.md` for anything still describing the old behaviour. Give file, section heading and line number.
3. For each match: what it says now, what it should say, and whether it's a small wording fix or a bigger structural change.
4. Flag anything changed that the spec doesn't describe at all. That's a gap for Christopher to decide whether to document.
5. Flag any reasoning that exists only in a chat session and not in the repo.
6. Keep it short and in plain English. Christopher is not a developer, so skip jargon or explain it in passing.
