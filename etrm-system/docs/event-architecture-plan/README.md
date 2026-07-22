# SmartETRM Event Architecture — Plan (NOT YET BUILT)

> **Persona for this folder:** You are an ETRM platform architect expert in event-driven, metadata-governed enterprise system design (change-tracking, transactional outbox, real-time streaming, AI governance) for a multi-commodity trading platform. Apply that expertise when reading, extending, or eventually implementing this plan.
>
> **Status: planned, zero implementation exists yet.** Everything in this folder — `meta_table_registry`, `meta_field_change_rule`, `sys_event_outbox`, `sys_stream_registry`, and every playbook step that references them — describes a **target architecture layer** for the metadata-driven change-tracking / event-outbox / live-streaming / AI-governance system. None of these tables or mechanisms exist in the real SmartETRM database or codebase today (confirmed: no `meta_*` or `sys_event_outbox`/`sys_stream_registry` table exists anywhere in the actual schema as of migration V151, 2026-07-21).
>
> **For what is actually built and running today** — the real master-data CRUD engine, RBAC, optimistic locking, audit columns, trade capture, credit & risk — see [`../ETRM_Project_Handoff_v1_0.md`](../ETRM_Project_Handoff_v1_0.md), the authoritative record of the real, currently-built system. Don't follow a playbook step in this folder (e.g. "add a row to `meta_table_registry`") as if it's the real process for today's codebase — the real process for adding a table today is the Tier1/Tier2 pattern documented throughout the handoff doc. This folder is the plan for where the platform is headed next, once the outbox/streaming layer described here actually gets built (see `tasks/in-progress.md` for the current next step).
>
> This is also mirrored, in condensed single-file form, at the repo root's [`CLAUDE.md`](../../../CLAUDE.md) — that file is the quick version Claude Code loads automatically every session; this folder is the fuller, structured version with playbooks and task tracking. Keep both in sync when either changes.

This folder is the single source of truth for how this *planned* architecture layer is designed and will be built. It is read by both humans and Claude Code. It is updated manually by Dharani and pushed via VS Code after each design/review session.

## Folder Structure

```
event-architecture-plan/
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

## The Golden Rule (read this before touching anything in this planned layer)

Once this architecture layer is actually being built, before implementing **any** change to it — a new table, column, stored procedure, API endpoint, page, or validation that needs to participate in the metadata/outbox/streaming system — the flow is always:

1. **Check `architecture/`** — does this change fit the existing design, or does it require a new decision? If it changes something structural, it needs a new ADR in `architecture/decisions/` first, not code first.
2. **Follow the matching playbook in `playbooks/`** — every category of change has a checklist. Don't skip steps, even ones that seem obvious for a "small" change — the meta-data/cascade/outbox system is exactly the kind of architecture where a skipped step (e.g. forgetting a `meta_field_change_rule` entry) breaks things silently, elsewhere, later.
3. **Update `tasks/`** — move the task card between `backlog.md` → `in-progress.md` → `completed.md`, and log anything unresolved in `open-questions.md`.
4. **Never contradict an existing ADR.** If a change requires overturning a past decision, write a new ADR that explicitly supersedes the old one — don't just quietly diverge from it in code.

## Who updates what

- **Architecture & decisions** → updated only when the design actually changes, reviewed together (evening review sessions).
- **Playbooks** → stable, rarely change; update only when the actual process changes (e.g. a new required step is discovered).
- **Tasks** → updated constantly, day to day.
