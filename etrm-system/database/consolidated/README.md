# Consolidated Master Data — Release Snapshots

Generated, point-in-time flattened exports of the master data schema + seed
data, for reading/searching/standing-up without replaying the full Flyway
migration chain. **Not the source of truth and not part of the Flyway
chain** — that's `etrm-backend/src/main/resources/db/migration/V*.sql` (and
its mirror in `../`). Edit that for any real schema change; this folder only
ever gets a new dated snapshot added to it.

## Structure

```
database/consolidated/
  README.md              <- this file (the index)
  snapshots/
    2026-07-12/           <- migration frontier V96 at generation time
      README.md           <- what this specific snapshot covers, how it was built
      00_master_data_schema.sql
      01_master_data_seed.sql
      02_organization_users_data.sql
      ...
      18_shared_support_tables_data.sql
    <next-date>/           <- added when the frontier moves, never edits 2026-07-12/
      ...
```

## Current snapshot

**[`snapshots/2026-07-12/`](snapshots/2026-07-12/)** — migration frontier V96.
154 tables, ~1,385 seed rows. See its own `README.md` for full scope,
verification notes, and the exact regeneration command.

## The release rule: snapshots are immutable, dated, and additive

A snapshot folder is named `YYYY-MM-DD` for the date it was generated, and
once created **it does not change** — no in-place edits, no regenerating
over it, even if the underlying data was wrong (fix forward with a new
snapshot instead, and note the correction in the new one's README). This is
what makes "which snapshot am I looking at" always answerable just from the
folder name, and lets you diff two dates to see exactly what master data
changed between them.

### When to cut a new snapshot

- The Flyway migration frontier moves (a new `VNN__*.sql` lands in
  `etrm-backend/.../db/migration/`) and you want a fresh flattened view.
- A table is added to or removed from `master_data_table_registry` or the
  frontend's `MasterDataHub.tsx` (changes the 154-table scope).
- Seed/reference data changes meaningfully and you want a point-in-time
  record of it (e.g. before/after a bulk data correction).

Not every migration needs a new snapshot — this is a convenience artifact,
not a required step of shipping a migration. Cut one when it's actually
useful to have a flattened reference of "what did master data look like on
this date," not automatically on every `VNN`.

### How to cut one

1. Make sure the target database is fully migrated to the frontier you want
   to snapshot (`flyway info` shows every migration as `Success`).
2. Follow the exact generation process documented in the current snapshot's
   `README.md` / file headers (table list, `mssql-scripter` invocation,
   post-processing steps) — the process itself doesn't change between
   snapshots, only the date and the live data/schema being captured.
3. Create `snapshots/YYYY-MM-DD/` with today's date, write all files there,
   verify them (apply schema then seed to a throwaway database, confirm 0
   errors and row counts match the source) before committing.
4. Write that snapshot's own `README.md` — copy the previous one as a
   starting point, update the migration frontier, table count, row count,
   and generation date, and call out anything that changed since the last
   snapshot (new tables, scope changes, fixed bugs in the generation
   process).
5. Update **this file** — bump "Current snapshot" to point at the new
   folder. Leave the old snapshot in place; don't delete it.
