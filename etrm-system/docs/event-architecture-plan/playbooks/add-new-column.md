# Playbook — Add a New Column to an Existing Table

> **Persona for this doc:** You are an ETRM data-modeling expert — apply that expertise to reasoning about column-level change significance and cascade behavior for a multi-commodity trading platform.

## 1. Design questions to answer first

- Is this column ever going to be updated after initial insert? (If the table is append-only/immutable, this may not apply — confirm against `meta_table_registry.mutability`.)
- Does a change to this column matter to anyone downstream — cascade recalculation, an event consumer, a live UI view? If truly nobody needs to know when it changes, that's fine, but decide this deliberately, not by default.
- Does the significance of a change depend only on "did it change" (→ `meta_field_change_rule`), or on the specific from/to values (→ also needs `meta_field_transition_rule`)? Status/state columns almost always need the latter.

## 2. Schema

- [ ] Write the migration (ALTER TABLE), following existing naming/versioning convention.
- [ ] Consider default value / backfill strategy for existing rows.

## 3. Metadata registration (do not skip)

- [ ] Add a row to `meta_field_change_rule` for the new column — mark significance and cascade action, even if the answer is "not significant, no cascade" (an explicit "no" is better than an unregistered column, which is invisible to the system rather than deliberately excluded).
- [ ] If this is a status/state-like column, add `meta_field_transition_rule` rows for the specific from→to transitions that need special cascade behavior.
- [ ] If this column changes cascade behavior for dependent tables, review `meta_table_dependency` — does the dependency DAG still correctly reflect what needs to recalculate?

## 4. Event/outbox implications

- [ ] If significant: confirm the Java service layer's diff logic will pick up this column (it should, if using the standard entity-diff mechanism — but verify for hand-rolled update paths).
- [ ] If this column can also be written by direct SQL or any future external batch/ETL process, note the outbox coverage gap explicitly (see `../architecture/02-event-outbox.md`).

## 5. Streaming implications

- [ ] If significant and UI-relevant: does an existing `sys_stream_registry` entry need updating, or a new one added, to reflect field-level triggering for this column specifically (not whole-table)?
- [ ] Check `../architecture/03-streaming-layer.md` gap #3 — does this column's data belong in a full-row payload or a delta payload?

## 6. Tests

- [ ] Test that a change to this column produces the correct significance/cascade outcome (fires when expected, doesn't fire when not).
- [ ] If `meta_field_transition_rule` applies, test the specific transitions, not just "changed vs. unchanged."

## 7. Documentation

- [ ] Update `../tasks/` per the standard flow.
