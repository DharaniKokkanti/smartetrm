# Pending Project — Trade Blotter dropdown wiring gaps

> **Persona for this doc:** You are an ETRM trade-capture UX expert — apply that expertise to correctly wiring commodity-detail dropdown fields once Trade Management gets a real backend.

**Status: not started — identified and flagged only, deliberately deferred (2026-07-24).**

## What this is

While fixing a real bug in `gl_account_type` (see `masterdata_pending_project_01.md`'s
lookup_value discussion and the handoff doc's 2026-07-24 §0 entry), a full sweep of every
`useTableRows('...')` call across the frontend found 6 dropdown fields calling for a "table"
that has neither a physical table nor a `master_data_table_registry` row — meaning
`GET /api/v1/reference-data/{table}` 404s and the dropdown silently renders with zero options.

`gl_account_type` (GL Accounts page) was fixed the same session — see the handoff doc. The
other 5 are **all on `TradeBlotter.tsx`**, and unlike GL Accounts, **Trade Management has no
real backend at all yet** (`trade`/`trade_order`/`trade_item` and every commodity-detail
sub-table are frontend-mocks-only — confirmed via `SecurityConfig.java`'s own comment: "Trade
Management (TRADE_*) has no backend controller yet"). Fixing these 5 is therefore cosmetic
dev-mode polish today, not a data-correctness fix — there is no real persistence layer for any
of them to feed into yet. Explicitly deferred until Trade Management gets real backend tables;
revisit this doc at that point.

## The 5 deferred fields

| Frontend call (`TradeBlotter.tsx`) | Target form field | Real backing found | Correct real fix (once Trade Management has a backend) |
|---|---|---|---|
| `useTableRows('gas_day_type')` | `gasDetail.gasDayType` | `dbo.lookup_value` category `GAS_DAY_TYPE` (already seeded, V57) — same shape as `gl_account_type` | Use the new `useLookupValues('GAS_DAY_TYPE')` hook (built this session for `gl_account_type`, see hooks.ts) once `trade_gas_detail` is a real table with a real FK column |
| `useTableRows('crude_grade_type')` | `oilDetail.crudeGrade` | `trade_oil_detail.crude_grade` is `VARCHAR(100)` free text, NOT an FK — no `crude_grade_type` table/category exists anywhere. Prior mock cleanup comment claimed it duplicates `dbo.product`, which is directionally right for *suggested values* (real OIL-commodity product codes) but not a strict FK | Once real: source suggested values from `dbo.product` filtered to OIL commodity (mirror `productOptionsFor()`'s existing filter pattern in `TradeBlotter.tsx`), value = `productCode` string (matches the free-text column), not `productId` |
| `useTableRows('nomination_type')` | `gasDetail.nominationType` | Nothing — no table, no lookup_value category exists anywhere. Still defined as static mock rows only (FIRM/INTERRUPTIBLE/RENOMINATABLE) in `mocks/referenceData.ts` | Genuinely undesigned — needs a real classification decision (dedicated table vs. lookup_value category vs. small fixed CHECK enum) when `trade_gas_detail` is built for real, not just a re-pointing fix |
| `useTableRows('lng_price_basis')` | `lngDetail.priceBasis` | `trade_lng_detail.price_basis` is `VARCHAR(10)` with its own small `CHECK` constraint (`JCC`/`HH`/`TTF`/`NBP`/`CUSTOM`) — NOT an FK to `dbo.price_index` despite the old mock comment's claim | Once real: this is a small fixed CHECK-constrained enum, same shape as `GlAccountsPage.tsx`'s `NORMAL_BALANCE_OPTS` — just hardcode the 5 known values as a static const, no lookup/table wiring needed at all |
| `useTableRows('power_load_type')` | `powerDetail.loadShape` (via `trade_power_detail.load_shape_id`) | `trade_power_detail.load_shape_id` IS a real `INT` FK to `dbo.load_shape_template(load_shape_id)` — a real, already-registered Tier2 table | Once real: `useTableRows('load_shape_template')`, value = `loadShapeId` (number, not code string) — this one really is a simple re-pointing fix once the backend table exists |

## Why this matters when picked back up

Don't treat all 5 as one uniform fix — they need different real fixes once Trade Management's
backend exists: 2 are lookup_value-by-category, 1 is a real dedicated-table FK, 1 is a small
hardcoded CHECK enum, and 1 (`nomination_type`) needs an actual design decision first, not just
rewiring. See the table above for specifics per field before touching any of them.

## Related

- `masterdata_pending_project_01.md` — the `lookup_value`-by-category read-path gap this
  session's `gl_account_type`/`useLookupValues()` fix addresses generally.
- Handoff doc §0, 2026-07-24 entry — full incident record for how this was found (traced
  through `ReferenceDataController.requireRegistered()`, confirmed via live DB queries against
  `sys.tables`/`master_data_table_registry`, not guessed).
