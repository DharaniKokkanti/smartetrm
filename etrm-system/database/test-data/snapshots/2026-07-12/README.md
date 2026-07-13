# Test / Sample Business Data Snapshot — 2026-07-12

## Scope

24 "core Tier 1" entity tables — the ones most screens/forms actually need
populated to be usable, out of the ~68 entity master data tables that were
found to have zero rows anywhere in the system:

```
legal_entity, app_user, desk, trader, book, counterparty, contact,
bank_account, tax_registration, gtc, gtc_version, netting_agreement,
cp_commercial_terms, cp_gtc_agreement, location, transport_operator,
vessel, vessel_certificate, pipeline, storage_facility, tank, truck,
market, price_index
```

**Deliberately deferred** (not covered by this snapshot): niche
commodity-specific entity tables such as `metal_warrant`,
`lng_boil_off_rule`, `power_pnode`, `rin_account`,
`agri_crop_year_lifecycle`, `emission_scheme`, and others in that class.
Add them in a future dated snapshot if/when needed.

## The dataset

One consistent fictional trading group, "Meridian Trading":

- 3 legal entities — UK (holding co.), US (swap dealer subsidiary),
  Singapore — with realistic LEI codes, regulators, and timezones.
- Desks, traders, and books under those entities.
- 6 counterparties with contacts, bank accounts, tax registrations, GTC
  agreements (with versions), netting agreements, and commercial terms.
- Locations, a transport operator, 3 vessels (with certificates), 2
  pipelines, storage facilities/tanks, and trucks.
- 4 markets and 4 price indices (ICE Brent, NYMEX WTI, LME Copper, TTF).

All rows use explicit IDs (`IDENTITY_INSERT ON`) and cross-reference each
other consistently — same style/scale as the frontend's MSW mock data, so
the app looks the same whether pointed at mocks or a real backend seeded
with this file.

## Prerequisite

Apply `database/consolidated/snapshots/2026-07-12/` first, in order:

1. `00_master_data_schema.sql`
2. `01_master_data_seed.sql`

Then apply this snapshot's `01_core_tier1_test_data.sql`. It only inserts
"entity" rows — it relies on the reference/lookup data (currencies,
countries, legal entity types, counterparty types, incoterms, etc.)
already being present from step 2.

## Verification

Applied to a throwaway `MDTEST` database, built from scratch in sequence
(schema → seed → this file): **0 errors**, and every one of the 24 tables
above confirmed to have rows afterward (row counts range 2–6 per table).
Re-applied a second time to the same database to confirm the idempotent
guards (see below) work — 0 errors, row counts unchanged (no duplicates).

Applied for real to the local dev `ETRM_DB` on 2026-07-12: 0 errors, same
row counts confirmed (`legal_entity`=3, `vessel`=3, `counterparty`=6, etc.
across all 24 tables).

Two bugs were caught and fixed during verification:
- `vessel.mmsi` is a plain (non-filtered) `UNIQUE` constraint, which
  rejects multiple `NULL`s — all 3 vessel rows needed real MMSI values.
- `vessel`, `vessel_certificate`, and `market` all have filtered indexes
  (e.g. `ix_vessel_vetting`, `ix_vc_expiry`, `ix_market_exchange`), which
  require `SET QUOTED_IDENTIFIER ON` at insert time — the file's header
  now sets this (and `SET ANSI_NULLS ON`) before the first `INSERT`.

## Idempotency

Every `INSERT` in `01_core_tier1_test_data.sql` is guarded by
`IF NOT EXISTS (SELECT 1 FROM dbo.<table> WHERE <pk> = <id>)`. Safe to
re-run against a database that already has some or all of these rows —
only what's missing gets inserted, nothing errors or duplicates. This is
what let it be applied directly to the shared local dev `ETRM_DB` (not
just a throwaway verification database) as a one-time data load, and what
makes it safe to re-run later without first checking what's already there.

## Regeneration

This file is hand-authored, not extracted from a live database (the
target tables were empty, so there was nothing to script out). To produce
a similarly-structured file for a future snapshot: write INSERT
statements by hand in FK-dependency order, using `IDENTITY_INSERT ON` for
explicit IDs, and verify against a throwaway database seeded with the
`database/consolidated/` snapshot this one depends on.
