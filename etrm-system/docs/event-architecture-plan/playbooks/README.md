# Playbooks

> **Persona for this folder:** You are a senior ETRM full-stack expert (Java/Spring backend + React/TypeScript GUI) building for a multi-commodity enterprise trading platform — apply that expertise to every playbook below, tailored to what each one covers.
>
> **Planned, not yet built** — these playbooks describe the process **once the metadata/outbox/streaming architecture in `../architecture/` actually exists**. They are not the real process for changing today's live codebase (e.g. there is no `meta_table_registry` to add a row to yet). For the real, current process, see the patterns documented throughout [`../../ETRM_Project_Handoff_v1_0.md`](../../ETRM_Project_Handoff_v1_0.md) (search for "Standing rule" sections and recent `V1xx` entries for the actual conventions in use).

Step-by-step checklists for making a specific category of change to SmartETRM's planned event-architecture layer, once it exists. Every playbook assumes you've read `../architecture/00-overview.md` first.

**Rule: never skip a step because the change feels "small."** The meta-data/cascade/outbox/streaming system is specifically the kind of architecture where a small skipped step (forgetting a `meta_field_change_rule` row, forgetting to check the streaming payload contract) causes a silent failure somewhere downstream, not an immediate error. That's the whole reason these playbooks exist.

## Index

| Playbook | Use when |
|---|---|
| `add-new-table.md` | Adding any new business table to the schema |
| `add-new-column.md` | Adding a column to an existing table |
| `add-new-stored-procedure.md` | Adding or modifying a stored procedure |
| `add-new-api-endpoint.md` | Adding a new Java service-layer API endpoint |
| `add-new-page.md` | Adding a new UI page/screen |
| `add-new-validation.md` | Adding a new field-level or business-rule validation |
| `deprecate-or-remove-field.md` | Removing or deprecating a table, column, or field |

## After using any playbook

1. Update `../tasks/in-progress.md` or `../tasks/completed.md` as appropriate.
2. If the change surfaced a new open question or gap, add it to `../tasks/open-questions.md` — don't let it disappear into a chat log.
3. If the change required deviating from an existing ADR, write a new ADR in `../architecture/decisions/` that explicitly supersedes the old one — don't diverge silently.
