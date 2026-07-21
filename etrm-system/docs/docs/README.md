# SmartETRM Docs — Index

This `docs/` folder is the single source of truth for how the SmartETRM platform is designed, built, and changed. It is read by both humans and Claude Code. It is updated manually by Dharani and pushed via VS Code after each design/review session.

## Folder Structure

```
docs/
├── README.md                      ← you are here
├── architecture/                  ← WHAT the system is (current design, stable reference)
│   ├── 00-overview.md
│   ├── 01-meta-data-system.md
│   ├── 02-event-outbox.md
│   ├── 03-streaming-layer.md
│   ├── 04-ai-governance.md
│   └── decisions/                 ← WHY it was designed that way (ADRs, append-only, never edit past ones)
│       ├── 0000-template.md
│       ├── 0001-service-layer-diffing-over-preupdate.md
│       └── 0002-transactional-outbox-pattern.md
├── playbooks/                     ← HOW to make a specific kind of change, step by step
│   ├── README.md
│   ├── add-new-table.md
│   ├── add-new-column.md
│   ├── add-new-stored-procedure.md
│   ├── add-new-api-endpoint.md
│   ├── add-new-page.md
│   ├── add-new-validation.md
│   └── deprecate-or-remove-field.md
└── tasks/                         ← WHAT is being worked on right now (living, changes often)
    ├── README.md
    ├── backlog.md
    ├── in-progress.md
    ├── completed.md
    └── open-questions.md
```

## The Golden Rule (read this before touching anything)

Before implementing **any** change to the platform — a new table, column, stored procedure, API endpoint, page, or validation — the flow is always:

1. **Check `architecture/`** — does this change fit the existing design, or does it require a new decision? If it changes something structural, it needs a new ADR in `architecture/decisions/` first, not code first.
2. **Follow the matching playbook in `playbooks/`** — every category of change has a checklist. Don't skip steps, even ones that seem obvious for a "small" change — the meta-data/cascade/outbox system is exactly the kind of architecture where a skipped step (e.g. forgetting a `meta_field_change_rule` entry) breaks things silently, elsewhere, later.
3. **Update `tasks/`** — move the task card between `backlog.md` → `in-progress.md` → `completed.md`, and log anything unresolved in `open-questions.md`.
4. **Never contradict an existing ADR.** If a change requires overturning a past decision, write a new ADR that explicitly supersedes the old one — don't just quietly diverge from it in code.

## Who updates what

- **Architecture & decisions** → updated only when the design actually changes, reviewed together (evening review sessions).
- **Playbooks** → stable, rarely change; update only when the actual process changes (e.g. a new required step is discovered).
- **Tasks** → updated constantly, day to day.
