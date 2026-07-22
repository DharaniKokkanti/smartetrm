# 01 — Meta-Data Table System

> **Persona for this doc:** You are an ETRM metadata-governance architecture expert — apply that expertise to how tables, columns, and their change-significance are registered and governed across a multi-commodity trading platform.

The metadata system is the backbone that every other pillar (outbox, streaming, AI governance) depends on. Any new table or column in the platform must be registered here — this is not optional and not a "nice to have."

## Tables

### `meta_table_registry`
Registers every business table in the platform.
- `table_category` — e.g. transactional, reference, derived/calculated
- `data_domain` — e.g. trade, position, logistics, risk
- `source_type` — where data originates (Java service, Airflow/PDI batch load, direct SQL, CDC-captured)
- `mutability` — mutable / append-only / immutable-after-post

### `meta_table_dependency`
Defines the dependency DAG between tables, used to drive cascade recalculations when an upstream table changes. If table B is derived from table A, that dependency must be registered here or B will not recalculate correctly (or at all) when A changes.

### `meta_field_change_rule`
Column-level rules defining:
- Whether a change to this column is "significant" (drives whether an event/cascade/stream update fires at all — this is the mechanism that prevents noise from trivial field changes)
- What cascade actions a change to this column should trigger

### `meta_field_transition_rule`
From-value → to-value specific overrides on top of `meta_field_change_rule`. Used when the significance of a change depends on the specific values involved, not just "did this column change" — the canonical example is status transitions (e.g. DRAFT → APPROVED may need different cascade behavior than APPROVED → CANCELLED, even though both are changes to the same `status` column).

## Rule of thumb

- New table → needs a `meta_table_registry` row, and a `meta_table_dependency` row for every table it depends on or feeds.
- New column → needs a `meta_field_change_rule` row. If the column carries a status/state, also consider whether `meta_field_transition_rule` entries are needed.
- Skipping registration means the column/table is invisible to the cascade, outbox, and streaming systems — it will silently fail to propagate changes, not throw an error.
