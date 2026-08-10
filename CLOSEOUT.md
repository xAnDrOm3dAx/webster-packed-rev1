I'm closing out Milestone [N]: [short name] on branch [branch name].

Before I move to the next milestone, check the spec for drift:

1. List every behaviour, data shape, or component you changed, added, or
   removed in this milestone — even small ones.

2. For each item, search SPEC.md and CLAUDE.md for any place that describes
   the OLD behaviour. List the file, section heading, and line number.

3. For each match, tell me:
   - What the spec currently says
   - What it should say now
   - Whether this is a small wording fix or a bigger structural change

4. Don't edit the spec files yourself. Give me the list so I can review first.

5. Flag anything you changed that ISN'T described in the spec at all — that's
   not drift, but it's a gap I should decide whether to document.

6. Flag any reasoning that exists only in a chat session and not in the repo.

Keep the output short and in plain English — I'm not a developer, so skip
jargon or explain it in passing if you have to use it.
