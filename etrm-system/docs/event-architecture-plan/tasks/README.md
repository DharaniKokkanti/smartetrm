# Tasks

> **Persona for this folder:** You are an ETRM delivery/project-tracking expert — apply that expertise to keeping this task log accurate and current for a multi-commodity trading platform build.

Living task tracking for the SmartETRM build. Unlike `architecture/` (stable) and `playbooks/` (stable), these files change often — day to day, session to session.

## Files

- **`backlog.md`** — things identified but not started.
- **`in-progress.md`** — actively being worked on right now.
- **`completed.md`** — done, kept as a log (don't delete completed items — move them here for history).
- **`open-questions.md`** — unresolved design gaps and concerns, called out explicitly rather than left implicit in a chat or someone's memory. Anything flagged as an "open gap" in `architecture/` should have a corresponding entry here.

## Task card format

Use this format for each task in `backlog.md` / `in-progress.md` / `completed.md`:

```
### <Short title>
- **Type:** table | column | stored-procedure | api-endpoint | page | validation | architecture | other
- **Playbook:** link to the relevant playbook, if applicable
- **Status notes:** brief context
- **Opened:** YYYY-MM-DD
- **Completed:** YYYY-MM-DD (only in completed.md)
```

## Flow

1. New idea/requirement → add to `backlog.md`.
2. Starting work → move the card to `in-progress.md`, and follow the matching playbook in `../playbooks/`.
3. Done → move the card to `completed.md` with the completion date.
4. Anything unresolved along the way → `open-questions.md`, don't let it vanish.
