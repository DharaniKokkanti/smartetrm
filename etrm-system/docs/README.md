# SmartETRM Docs — Index

> **Persona, always:** You are a senior ETRM (Energy/Commodity Trading and Risk Management) systems architect and full-stack developer — expert in designing and implementing multi-commodity enterprise trading platforms (trade capture, credit & risk, master data governance, settlements, logistics) end to end. Every doc below is scoped to a specific function of that platform; bring the same ETRM domain expertise to each one, tailored to what that doc covers.

This folder holds two different kinds of documentation. Read the distinction below before opening anything else — conflating them is the most likely way to get confused (e.g. following a playbook step for a table/mechanism that doesn't exist yet).

## 1. The real, currently-built system (start here for almost everything)

| Doc | What it's for |
|---|---|
| [`ETRM_Project_Handoff_v1_0.md`](ETRM_Project_Handoff_v1_0.md) | **The authoritative source of truth for what's actually built.** Session-by-session build log (§0), standing rules/conventions the team has learned the hard way, and the full migration history (V1–V151 as of 2026-07-21). Always check §0 "Session Recap" first when resuming work — it's kept current and is more reliable than any memory file. |
| [`GUI_ARCHITECTURE.md`](GUI_ARCHITECTURE.md) | **Frontend/GUI reference.** The real, currently-built React/AntD/AG Grid frontend's shared component vocabulary, layout, and established UI conventions (density-by-default, optimistic-lock UX, the two-catalog Tier2 gotcha, etc.) — consolidated from the handoff doc's scattered GUI entries. Start here for any GUI/page work. |
| [`RUNNING_LOCALLY.md`](RUNNING_LOCALLY.md) | How to get the full stack (backend, frontend, SQL Server) running locally, 100% on free tiers. |
| [`BOOTSTRAP_FIRST_ADMIN.md`](BOOTSTRAP_FIRST_ADMIN.md) | Vendor runbook for standing up the first admin user in a fresh environment — not a customer-facing flow. |
| [`ETRM_Database_Schema_Reference.docx`](ETRM_Database_Schema_Reference.docx), [`ETRM_Master_Data_Entry_Technical_Design.docx`](ETRM_Master_Data_Entry_Technical_Design.docx), [`ETRM_Power_Schema_Reference.docx`](ETRM_Power_Schema_Reference.docx) | Reference design docs (Word format, predate the handoff doc's migration-by-migration detail). |

### Pending / tracked work items (numbered, not chronological — check `Status:` at the top of each)

| Doc | Status |
|---|---|
| [`masterdata_pending_project_01.md`](masterdata_pending_project_01.md) | Not started — lock down SYSTEM-only static/reference tables. |
| [`flyway_prod_deployment_pending_02.md`](flyway_prod_deployment_pending_02.md) | Not started — Flyway production-deployment hardening. |
| [`dedicated_table_governance_gap_pending_03.md`](dedicated_table_governance_gap_pending_03.md) | **Resolved** (V144–V151, 2026-07-21) — kept for historical reference on how the gap was found. |

### Future-module specs

| Doc | What it's for |
|---|---|
| [`etrm-charter-bunker-demurrage-prompt.md`](etrm-charter-bunker-demurrage-prompt.md) | Standalone functional/technical spec for a future Time Charter / Bunker / Demurrage Claims module — meant to be handed to an AI coding agent or a dev team, not yet built. |

## 2. The planned event-architecture layer (not yet built — a separate track)

[`event-architecture-plan/`](event-architecture-plan/) — a metadata-driven change-tracking / transactional-outbox / live-streaming / AI-governance layer that's been designed but has **zero implementation** in the codebase so far (no `meta_table_registry`, `sys_event_outbox`, or `sys_stream_registry` exists anywhere in the real schema). It's the structured, multi-file expansion of the repo root's [`../../CLAUDE.md`](../../CLAUDE.md) — keep both in sync when either changes; `CLAUDE.md` is the quick version Claude Code loads automatically every session, this folder has the full architecture write-ups, ADRs, playbooks, and task tracking.

Do not treat anything in `event-architecture-plan/playbooks/` as the real process for today's codebase. The real conventions (how a table actually gets added, what governance columns it needs, how migrations are versioned and mirrored) are documented throughout `ETRM_Project_Handoff_v1_0.md` instead — search it for "Standing rule" sections.

## Quick decision guide

- **"How do I run this locally?"** → `RUNNING_LOCALLY.md`
- **"I'm building/changing a GUI page — what conventions do I follow?"** → `GUI_ARCHITECTURE.md`
- **"What's actually been built so far / what changed recently?"** → `ETRM_Project_Handoff_v1_0.md` §0
- **"What's the real process for adding a table/column/endpoint today?"** → `ETRM_Project_Handoff_v1_0.md` (standing-rule sections + recent `Vxxx` entries for precedent)
- **"What's the target architecture for events/streaming/AI-governance, once built?"** → `event-architecture-plan/`
- **"Is there a task list for that planned layer?"** → `event-architecture-plan/tasks/`
