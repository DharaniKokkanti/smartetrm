# Playbook — Add a New Table

## 1. Design questions to answer first

- What is this table's `data_domain`? (trade, position, logistics, risk, reference, etc.)
- What is its `mutability`? (mutable / append-only / immutable-after-post)
- What is its `source_type`? (Java service layer, PDI/Airflow batch load, direct SQL, CDC-captured)
- Does this table **depend on** other tables (derived/calculated from them)? Does anything **depend on it**?

If you can't answer these, stop and clarify before writing DDL — these answers determine registry entries below and get harder to retrofit later.

## 2. Schema

- [ ] Write the DDL (naming conventions, keys, indexes per existing schema standards).
- [ ] Add a migration script in the standard migrations location, following existing naming/versioning convention.

## 3. Metadata registration (do not skip)

- [ ] Add a row to `meta_table_registry` — `table_category`, `data_domain`, `source_type`, `mutability`.
- [ ] Add row(s) to `meta_table_dependency` for every table this one depends on, and update dependents if this table feeds an existing one.
- [ ] If the table has columns that matter for cascade/event purposes, also do the `add-new-column.md` playbook for each significant column now (don't leave this for "later").

## 4. Event/outbox implications

- [ ] Is this table mutable and Java-service-written? If yes, confirm the service layer's snapshot/diff logic will cover it (see `../architecture/02-event-outbox.md`).
- [ ] Is this table written by PDI/Airflow/direct SQL? If yes, flag explicitly that it falls into the known outbox coverage gap — note it in `../tasks/open-questions.md` if not already covered by the CDC safety-net discussion.

## 5. Streaming implications

- [ ] Does any UI need to see live updates from this table (directly or via a derived table)? If yes, add an entry to `sys_stream_registry` and walk through `../architecture/03-streaming-layer.md` gaps 1–5 for this specific case.

## 6. Access control

- [ ] Confirm desk/book-level entitlement rules are defined for this table's data, consistent with existing access control patterns.

## 7. Tests

- [ ] Unit/integration tests for the new table's CRUD paths.
- [ ] If cascade/outbox applies, a test confirming the correct event fires (and doesn't fire on insignificant changes).

## 8. Documentation

- [ ] If this table introduces a new pattern (not just an instance of an existing one), consider whether it warrants a new ADR in `../architecture/decisions/`.
- [ ] Update `../tasks/` per the standard flow.
