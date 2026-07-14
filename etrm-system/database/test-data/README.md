# Test / Sample Business Data — Release Snapshots

Hand-authored, realistic sample business data for the "entity" master data
tables that `database/consolidated/` intentionally leaves empty (it only
carries real reference/lookup data — currency codes, country codes, type
codes — extracted from a live database). This folder exists so the app has
something to actually click through in every screen, not empty grids
outside pure reference data.

**Not the source of truth, not part of the Flyway chain, and not
extracted from a live database** — unlike `database/consolidated/`, these
rows are invented (a fictional trading group, "Meridian Trading") because
the target tables have always been empty; there was no live data to script
out. Treat this as fixture/demo data only — never load it into anything
resembling a production or shared environment.

## Structure

```
database/test-data/
  README.md              <- this file (the index)
  snapshots/
    2026-07-12/           <- first cut of this data
      README.md           <- what this snapshot covers, scope, verification
      01_core_tier1_test_data.sql
    <next-date>/           <- added when scope/data changes, never edits 2026-07-12/
      ...
```

## Current snapshot

**[`snapshots/2026-07-14/`](snapshots/2026-07-14/)** — same 24 core Tier 1
tables and dataset as `2026-07-12/`, correcting a real bug: `app_user`'s
`password_hash` values were a literal placeholder string, not a real
bcrypt hash, so login never actually worked against a real backend seeded
with `2026-07-12/`. Also adds a 5th `app_user` (`admin`) as the designated
super-user account plus one `user_role_assignment` row granting it the
ADMIN role. See its own `README.md` for the full story and how to apply it
on top of an already-`2026-07-12`-seeded database.

**Prerequisite:** apply `database/consolidated/snapshots/2026-07-12/`
first (schema, then seed) — this data only adds rows on top of the
already-seeded reference data (currencies, countries, type codes, etc.).

Superseded: [`snapshots/2026-07-12/`](snapshots/2026-07-12/) — left in
place per the immutability rule below, but has the password bug above;
prefer `2026-07-14/` for any new database.

## The release rule: snapshots are immutable, dated, and additive

Same convention as `database/consolidated/` — a snapshot folder is named
`YYYY-MM-DD` for the date it was generated and, once created, **does not
change**. Fix forward with a new dated snapshot instead of editing an old
one, and note the correction in the new snapshot's README.

### When to cut a new snapshot

- More of the still-empty "entity" tables (the ones deliberately deferred
  out of the current 24-table scope — see the snapshot README for the
  list) get sample data added.
- The `database/consolidated/` snapshot this depends on moves to a new
  date (schema/reference data changed enough that the old test data may no
  longer apply cleanly).
- The existing sample dataset needs a meaningful correction or expansion.

### How to cut one

1. Confirm the `database/consolidated/` snapshot you're building on top of
   is the current one (check its `README.md`).
2. Write the INSERT statements by hand for the new/changed tables, keeping
   IDs and FK references internally consistent (use `IDENTITY_INSERT ON`
   for explicit ID control) and staying in FK-dependency order.
3. Include `SET ANSI_NULLS ON` / `SET QUOTED_IDENTIFIER ON` at the top —
   required for tables with filtered indexes (e.g. `vessel`, `market`).
4. Verify: build a throwaway database, apply the consolidated snapshot's
   schema + seed, then this file, confirm 0 errors.
5. Create `snapshots/YYYY-MM-DD/`, write the file(s) there, write that
   snapshot's own `README.md` (scope, prerequisite snapshot, verification
   notes, what's deferred).
6. Update **this file** — bump "Current snapshot" to point at the new
   folder. Leave the old snapshot in place; don't delete it.
