# Playbook — Deprecate or Remove a Table, Column, or Field

Removing things is riskier than adding them in this architecture, because the metadata system, outbox, and streaming layer may all have live references to what you're removing. Treat this as a two-phase operation: **deprecate, then remove** — never remove in one step.

## Phase 1 — Deprecate

- [ ] Check `meta_table_dependency` / `meta_field_change_rule` / `meta_field_transition_rule` for any references to the table/column being removed. Nothing should silently point at a dropped column.
- [ ] Check `sys_stream_registry` for any topic depending on this table/column.
- [ ] Mark the field/table as deprecated in code and documentation, but leave it functional.
- [ ] Confirm no active consumer (UI page, downstream table, PDI/Airflow job) still depends on it. If any do, they must be migrated first.

## Phase 2 — Remove

- [ ] Remove the corresponding `meta_field_change_rule` / `meta_field_transition_rule` / `meta_table_dependency` / `sys_stream_registry` entries.
- [ ] Write the migration to drop the column/table.
- [ ] Confirm no orphaned outbox events or stream topics reference the removed field.

## Documentation

- [ ] If this removal reverses a past ADR decision, write a new ADR explicitly marking the old one "Superseded" — don't just delete the old ADR.
- [ ] Update `../tasks/` per the standard flow.
