# Consolidated Master Data — Snapshot as of 2026-07-12 (migration frontier: V96)

**Generated files — not the source of truth, not part of the Flyway chain.**
The real schema history lives in `etrm-backend/src/main/resources/db/migration/V*.sql`
(and its mirror in `etrm-system/database/`) — that's what Flyway actually
applies, one migration at a time, and it's what you edit for any real schema
change.

This folder is a **flattened snapshot**, frozen at this date, of the master
data layer's shape after migrations V1–V96, generated directly from a live,
fully-migrated database via `mssql-scripter` — useful for reading/searching
the current shape of a table without mentally replaying 96 migrations, or
for standing up a master-data-only copy of the schema somewhere.

**This snapshot does not update in place.** When the migration frontier
moves past V96, a new dated folder is added alongside this one (see
`../../README.md` for the release process) — this folder stays exactly as
it was on 2026-07-12 so it's always clear which migration state any given
snapshot reflects.

## Files

| File | What | Runnable standalone? |
|---|---|---|
| `00_master_data_schema.sql` | `CREATE TABLE` + all constraints/indexes for 154 tables | Yes — verified against a throwaway DB, 0 errors |
| `01_master_data_seed.sql` | All ~1,385 seed/reference rows across those 154 tables, in a verified-safe load order | Yes, **after** `00_...schema.sql` — verified together, 0 errors, row count matches source exactly |
| `02_organization_users_data.sql` … `18_shared_support_tables_data.sql` | The same rows as `01_...seed.sql`, split out **by Master Data Hub group** for readability | **No** — see below |

## Why the per-group files (02–18) aren't independently runnable

The Master Data Hub's 16 groups (`etrm-frontend/src/features/master-data/MasterDataHub.tsx`)
are a UI organization scheme, not a dependency hierarchy. Checked this
directly before assuming otherwise: computed the group-level FK dependency
graph, and it's densely cyclic — e.g. **Products & Markets** needs
**Finance & Settlement**'s currency rows, but **Finance & Settlement**'s
`bank_account` needs **Counterparties & Agreements**' rows, which needs
**Organization & Users**, which needs **Products & Markets** back again.
There is no group ordering that satisfies every foreign key — only a
per-*table* one.

So: use `01_master_data_seed.sql` for an actual load (it uses that per-table
order). Use the `02`–`18` files to find/read/diff "what's the seed data for
Credit & Collateral" without wading through one 1,850-line file — they
contain a `Shared Support Tables` file too, for the 8 tables the Hub
references (as FK targets) but doesn't give their own card: `address`,
`document_store`, `field_permission_profile`, `gtc_version`,
`pipeline_point`, `pricing_trigger_event_type`, `pricing_window_rule`,
`screen_field_registry`.

## Scope: what counts as "master data" here

Every table in `dbo.master_data_table_registry` (Tier 2, drives `/static-data`)
plus every Tier 1 core entity on the Master Data Hub (`legal_entity`,
`counterparty`, `product`, `book`, `trader`, etc.) plus the 8 shared support
tables above — **154 tables**.

Deliberately **excluded**: transactional/operational tables — `trade`,
`trade_order`, `trade_item`, every `trade_*_detail` table, `position`,
`position_eod_snapshot`, `nomination`, `delivery_instruction`, `trade_cost`,
`trade_order_cost`, `trade_order_assay_result`, `trade_custom_field_value`.
Those exist only in the Flyway migration chain.

## Regenerating this snapshot vs. creating a new one

Don't edit these files or regenerate them in place — if the migration
frontier has moved, or the Hub/registry table list changed, **create a new
dated folder** under `../` instead (see `../../README.md` for the process).
Only regenerate in place to fix a mistake in this same snapshot (e.g. this
README) without the underlying data having changed.

Both `.sql` files' generation commands are documented in their own headers.
In short: `mssql-scripter` (`pip install mssql-scripter`, invoke via
`python3 -m mssqlscripter` — the installed CLI shim's `python` shebang is
broken on a `python3`-only machine) against the live, migrated `ETRM_DB`,
with a Python post-processing pass to fix two `mssql-scripter` quirks this
schema hits: system-versioned (temporal) tables need `SYSTEM_VERSIONING = ON`
deferred until after their `PRIMARY KEY` exists (the tool's default ordering
doesn't satisfy that), and `pricing_rule`'s `GENERATED ALWAYS` columns
(`valid_from_sys`/`valid_to_sys` — non-standard names) get included in its
data `INSERT`s when they shouldn't be.
