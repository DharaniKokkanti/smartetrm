# Pending Project — Fold `fx_period` into `dbo.period`, link `period` to `product`, add contract lifecycle dates

> **Persona for this doc:** You are a senior ETRM systems architect who understands how exchanges (CME/NYMEX, ICE, LME) and PRAs (Platts, Argus) actually structure contract months, spot assessments, and forward-curve tenor buckets — apply that domain grounding, not just schema mechanics, when this gets picked back up.

**Naming update (2026-07-26, V163):** `dbo.market_product` (and the `market_product_id` FK column this whole doc refers to) was renamed to **`dbo.market_product_link`** / **`market_product_link_id`** — the row is a link record (market × product), not a product itself. Every `market_product`/`marketProductId` reference below predates that rename and is kept as-is (historical record), not silently rewritten.

**Status: IMPLEMENTED (2026-07-26, V162) — live-verified end-to-end.** Dharani reviewed
the design same-day and gave the go-ahead to implement, including two new asks beyond the
original design: bulk load via Excel, and an auto-generate feature (roll forward N
iterations from the latest period). Both built and verified. See "V162 implementation
record" at the bottom of this doc. The design-review narrative below is kept as the
historical record of how the structure was arrived at.

**Update (2026-07-26, same day):** FX question resolved — **option 2 chosen**. `fx_period`
stays standalone, not folded into `period`. Reasoning confirmed: FX genuinely isn't
product-scoped (no `dbo.product` row for a currency pair), so forcing it into the same
column as commodity products would be a false unification. This simplifies the whole
design — `product_id` on `period` can now be a single-purpose mandatory FK with no dual
nullable-scope-column/CHECK complexity, and the `fx_currency_pair` registry idea (option 1)
is shelved along with it. See the "Proposed structure" section below for the resulting
simplified design. Open questions 2 and 6 (FX fit, `period_type` reconciliation with
`fx_period`'s values) are now moot/closed by this decision.

## Why this came up

Follow-on from `masterdata_curve_derivative_asset_gaps_pending_06.md`'s still-open gap
#1 (no commodity forward-curve master). Before building `price_curve_point`, Dharani
wants the tenor/period dimension it would reference to be a single, real table — not a
new one, and not the existing `fx_period`/`period` split that already exists.

## Current state (verified against live dev DB)

| Table | Rows today | Shape |
|---|---|---|
| `dbo.period` | 209 | Pure rolling templates (M+0..M+12, Q+0.., etc.), `commodity_type` mostly NULL, `is_rolling=1`, no product link, no concrete dates. Has a `curve_label` column whose own comment says "used by quant engine and UI" — built for this purpose, never actually wired to a curve. |
| `dbo.fx_period` (V56) | 12 | Near-duplicate tenor table (`period_code`/`period_name`/`period_type` SPOT\|STANDARD_TENOR\|DAILY_FORWARD/`days_offset`), built without considering `dbo.period` already existed (V56's own comment justifies it only against `lookup_value`). |
| `dbo.fx_rate` | 0 | Scoped by **currency pair** (`from_currency_id`/`to_currency_id`), not product — `fx_period_id` FK added in V56. |
| `dbo.market_product_period` | 0 | Product↔period junction table — exists, **completely unused**. |
| `dbo.trade.period_id` | 0% populated | Column exists, not live-used yet. |

**Net: zero live data at risk in this fold.** Good time to get the shape right rather
than retrofit later.

## The core design tension, and where the design landed

**Initial proposal (mine, first pass)**: make the new `product_id` column on `period`
**nullable**, to avoid disturbing the 209 existing generic rows.

**Dharani's correction, confirmed correct against real market structure**: `product_id`
should be **NOT NULL**. Reasoning, grounded in how exchanges/PRAs actually work, not just
schema convenience:
- Every exchange-listed contract month (CME/NYMEX WTI, ICE Brent, LME copper) is
  registered per underlying product with its own contract spec — last trade day, first
  notice day, expiry, settlement day all differ by product (WTI's calendar isn't
  Brent's isn't Henry Hub's). There is no "generic month" floating free of a product on
  a real exchange.
- Same is true one level down at PRAs (Platts, Argus): every forward-curve point is
  published against a specific assessment code for a specific grade/market. Even the
  **spot/physical assessment** is grade-specific, not generic — Platts' "Dated Brent"
  and Argus' "WTI Midland" are two distinct spot assessments, not one shared generic
  "SPOT" row.
- Conclusion: a period row that isn't tied to what it's actually pricing isn't a
  meaningful row. The 209 existing generic rows should be **backfilled with the correct
  product association** (or deliberately re-seeded), not used as a reason to leave the
  column optional.

**Dates (`expiry_date`/`last_trade_date`/`settlement_date`/`first_notice_date`)**:
nullable, but the real distinction is sharper than "SPOT/QUARTER/YEAR are usually
null" — it's about whether the row represents a **tradeable listed instrument** or a
**continuous assessment**:
- SPOT/physical assessments never have these dates — nothing to expire, reassessed
  daily.
- Individual contract months (MONTH-type, e.g. WTI Jan-27) always have real dates on
  real exchanges — this is exactly where differential/roll pricing lives, so these
  should be populated, not left null.
- QUARTER/CAL strips are the genuinely ambiguous middle case: ICE/CME *do* technically
  define a last trading day for quarterly/calendar swaps (derived from the last trading
  day of the final constituent month) — it's not that they *can't* have dates, it's
  that many desks treat a strip as a bundle of its constituent months and only track
  dates at the month level, leaving the strip's own dates null by convention. **This
  needs an explicit decision, not a default**, when picked back up.

## The unresolved piece: FX doesn't have a "product"

`dbo.product` has no row for a currency pair — WTI/Brent/TTF are products, "EUR/USD"
isn't. If `product_id` is mandatory (per the correction above), FX periods have nothing
valid to point at. This is the one part of the fold that isn't fully resolved yet.

Also surfaced along the way: **there is no currency-pair registry in this schema at
all**. `fx_rate.from_currency_id`/`to_currency_id` are two independent FKs into
`dbo.currency` — any combination is implicitly a pair. Nothing enforces canonical
base/quote convention (e.g. EUR/USD is market-convention EUR-as-base; nothing here
prevents entering it backwards), and nothing registers which pairs are actually
tradeable vs. theoretically constructible. Only guardrails today: `chk_fx_different`
(can't be the same currency twice) and the composite unique constraint on
`(from_currency_id, to_currency_id, rate_date, rate_type)`.

**Two options, not yet decided:**

1. **Add a real `dbo.fx_currency_pair` master** (`base_currency_id`, `quote_currency_id`,
   `is_active` — effectively "product" for FX) and give `period` two nullable scope
   columns, `product_id` and `currency_pair_id`, with a CHECK requiring exactly one set.
   This mirrors a pattern already live in this schema —
   `dbo.physical_asset.asset_class` + mutually-exclusive `storage_facility_id`/
   `generation_asset_id` back-references from V161 — so it's precedent, not a new idea.
   Side benefit: fixes the currency-pair registry gap above as well.
2. **Don't fold FX in after all** — keep `fx_period` separate, since FX genuinely isn't
   product-scoped and forcing it into the same column as commodity products would be a
   false unification, not a real one.

No lean recorded yet — flagged for tomorrow's review.

## Correction: the key is market_product, not product alone

First-pass proposal below used `product_id` as the FK. **That's incomplete.** The same
product can list differently on different markets — different last-trade day, first-notice
day, settlement convention (e.g. an exchange-listed contract vs. an OTC-bilateral version
of the "same" product). `dbo.market_product` (live since V2) is already the market×product
pair, and it already carries the *generic offset rules* for this — `first_notice_day_offset`
and `last_trading_day_offset` (both SMALLINT, "days before expiry/delivery month end") — but
nothing today resolves those offsets into concrete calendar dates for an actual contract
month. That resolution step is exactly what `period`'s new date columns should do.

**Corrected FK: `period.market_product_id → dbo.market_product`, not `period.product_id →
dbo.product`.** `market_product` already has `UQ (market_id, product_id)`, so one FK to it
encodes both market and product as the key, rather than needing two separate columns (and a
composite key) directly on `period`.

This also touches open question 4: `dbo.market_product_period` (empty junction table,
meant to say "which periods are valid for which product on which market") looks redundant
once `period.market_product_id` exists. **Dharani's call: do NOT retire it — keep it as-is
for now, flagged here for review/confirmation later, not decided in this session.**

**Side-effect on open question 1 (backfill)**: scoping to `market_product` instead of
`product` makes the backfill bigger, not smaller — a rolling template like `M+1` may need
one row per `market_product` (not per `product`) if conventions genuinely differ across
markets for the same product. OTC-bilateral `market_product` rows likely keep templates
undated (no hard listed contract month), while only exchange-listed `market_product` rows
get concrete `expiry_date`/`last_trade_date`/etc. populated — same date-population logic as
before, just anchored at the market_product level.

## Latest revisions (2026-07-26, continued)

- **`period_id` → BIGINT**, not INT. Confirmed by Dharani given the LME metals daily
  prompt-date volume flagged above (potentially hundreds of rows/year per market_product,
  across many products/markets, well before other commodities' monthly-contract volumes)
  — INT's ~2.1B ceiling isn't a near-term risk but BIGINT is the deliberate choice given
  that projected row-volume shape. This answers the INT-vs-BIGINT question for `period_id`
  specifically (the same question for `row_version` is still separately open, see below).
- **`WEEK` and `DAY` period types confirmed as needed** — both already exist in the current
  11-value `period_type` CHECK list (`WEEK`, `DAY`), so no new enum values required here.
  Called out explicitly because `WEEK` is the LME "weekly out to 6 months" prompt-date
  granularity from the metals nuance above, and `DAY` is the "daily out to 3 months"
  granularity — both already representable, just confirming they're the intended vehicle
  rather than adding metals-specific new period_type values.
- **`last_notice_date` added**, alongside the already-proposed `first_notice_date`. Physical
  delivery contracts have a notice *window*, not a single day — first notice day (earliest
  a holder can be assigned delivery) through last notice day (final day notices can be
  tendered), both real distinct fields on exchange contract specs (e.g. CBOT agri, NYMEX
  energy), not just the one first-notice date originally proposed.
- **`row_version` confirmed INT** by Dharani (governance-column type question, separate
  from the `period_id` BIGINT decision above). All open type questions for this table are
  now resolved.

## Proposed structure — FINAL, all open type questions resolved (2026-07-26)

Current `dbo.period` (V2, 209 rows): `period_id` INT PK, `commodity_type` (free-text,
nullable, not product-scoped), `period_code`/`period_name`/`period_type`, rolling fields
(`is_rolling`/`roll_offset`/`roll_unit`), `period_start`/`period_end` (paired-or-null),
`curve_label` (never wired to a real curve table), usage flags
(`is_trading_period`/`is_risk_period`/`is_settlement_period`), `load_type`, `gas_day_type`,
`is_active`, `notes`, only `created_at`/`created_by` (missing `updated_at`/`updated_by`/
`row_version`). Unique on `(period_code, commodity_type)`.

```
period_id              BIGINT PK IDENTITY(1,1)                     -- was INT; BIGINT confirmed given LME prompt-date volume

market_product_id      INT NOT NULL   FK → dbo.market_product        -- replaces commodity_type; ties period to market AND product via one FK

period_code            VARCHAR(30)  NOT NULL
period_name            VARCHAR(200) NOT NULL
exch_product_code      VARCHAR(20)  NULL     -- contract-month-specific exchange code, e.g. 'CLF27'

period_type            VARCHAR(20)  NOT NULL   -- unchanged 11 values; WEEK + DAY confirmed as the LME metals vehicle, no new enum values needed

is_rolling / roll_offset / roll_unit           -- unchanged
period_start / period_end                       -- unchanged, paired-or-null
curve_label                                     -- unchanged

first_trade_date       DATE  NULL
expiry_date            DATE  NULL
last_trade_date        DATE  NULL
option_exp_date        DATE  NULL
settlement_date        DATE  NULL
first_notice_date      DATE  NULL
last_notice_date       DATE  NULL

is_trading_period / is_risk_period / is_settlement_period   -- unchanged
load_type / gas_day_type                                     -- unchanged
is_active / notes                                             -- unchanged

created_at, created_by, updated_at, updated_by, row_version INT   -- 3 missing governance columns added; row_version type CONFIRMED INT by Dharani

PK  (period_id)
UQ  (period_code, market_product_id)
FK  market_product_id → dbo.market_product(market_product_id)
CHECK: rolling → roll_offset + roll_unit required
CHECK: period_start/period_end paired-or-null
CHECK: period_end >= period_start
```

**Correction found during implementation:** the "current structure" this whole design was
compared against (top of doc) was read from `V2__market_price_source_period.sql` only —
it missed several later ALTERs (`V57`/`V85`/`V93`/`V100`/`V133`/`V148`) that had already
evolved live `dbo.period` well past that baseline: `commodity_type` was already an FK to a
dedicated `commodity_type` table (not free text), plus `delivery_start_date`/
`delivery_end_date`, `pricing_calendar_code`/`settlement_calendar_code` (FK →
`holiday_calendar`), `load_type_lookup_id`/`gas_day_type_lookup_id` (FK → `lookup_value`),
`start_time_utc`/`end_time_utc`, `crop_year_offset_months`, `status_code`, and full
governance columns (`row_version`/`updated_at`/`updated_by` already existed, not missing
as this doc originally claimed). None of that was lost — V162 preserved every one of those
columns and only replaced `commodity_type` with `market_product_id`, per the design above.
See "V162 implementation record" below for the actual final column list as built.

## V162 implementation record (2026-07-26)

**Live-verified against the dev DB, not spot-checked** — full details below.

**Schema** (`V162__period_market_product_key_lifecycle_dates.sql`, mirrored to
`database/162_period_market_product_key_lifecycle_dates.sql`): `dbo.period` dropped and
rebuilt (zero live-data risk confirmed beforehand — 209 rows, none backfillable since
`market_product` had zero rows anywhere in the system). New table: `period_id BIGINT`
identity PK, `market_product_id INT NOT NULL FK`, `exch_product_code`, 7 lifecycle date
columns (`first_trade_date`/`expiry_date`/`last_trade_date`/`option_exp_date`/
`settlement_date`/`first_notice_date`/`last_notice_date`), plus every pre-existing column
carried forward unchanged (see correction note above). `row_version` confirmed `INT`.
`uq_period_code_mp (period_code, market_product_id)` replaces the old
`uq_period_code_comm`. Row-version guard trigger (`trg_period_row_version_guard`, from
V153) recreated identically on the new table.

Every table with a period FK — `market_product_period.period_id`,
`period_mapping.parent_period_id`/`child_period_id`, `position.period_id`,
`position_eod_snapshot.period_id`, `trade.period_id`,
`trade_transmission_right_detail.delivery_period_id` — widened `INT` → `BIGINT`, with every
dependent index/unique constraint (including two that only turned up mid-migration via a
live boot failure: `market_product_period`'s V3 date-range indexes carrying `period_id` as
an INCLUDE column, and `position`/`position_eod_snapshot`'s composite uniqueness
constraints) dropped and recreated around the `ALTER COLUMN`. `trade_order`'s FK onto the
now-removed `(period_code, commodity_type)` natural key was dropped outright (columns
themselves left in place — unmapped by any JPA entity, 0 rows, out of scope).
`market_product_period` was **not** touched beyond the FK type widening — kept exactly as
Dharani directed earlier in this doc (dormant, not retired, flagged for later review).

**Backend**: `Period.java`/`PeriodRepository`/`PeriodService`/`PeriodController` rewritten
for the new shape (`Long` id, `marketProductId` + hydrated `marketCode`/`productCode`, all
new date fields). Added `PeriodRowInserter` (per-row `REQUIRES_NEW` transaction, same
pattern as `LegalEntityRowInserter`) backing a new `POST /api/v1/periods/bulk` endpoint —
duplicates rejected with a reason, not silently skipped, matching the existing bulk-create
convention. Added `PeriodRollCalculator` + `POST /api/v1/periods/auto-generate`: takes the
latest period for a market_product (or an explicit anchor), rolls forward N iterations one
calendar step at a time. Only `MONTH`/`QUARTER`/`HALF_YEAR`/`YEAR`/`WEEK`/`DAY` are
supported (the period_types with an unambiguous calendar-label convention) — others reject
with a clear error rather than guessing a label. Lifecycle dates on generated rows are
derived from the market_product's `last_trading_day_offset`/`first_notice_day_offset`
where present; flagged in-code as a simplification (doesn't handle commodities like CBOT
agri where first notice precedes last trade — see the cross-commodity section above).
Also added a flat `GET /api/v1/market-products` (no `marketId` filter) since the Period
picker needs every market_product across all markets, not one scoped by market —
`MarketProduct.java` gained a hydrated `marketCode` transient field for this.

**Frontend**: `types.ts`/`api.ts`/`hooks.ts` rewritten for the new shape.
`excelTemplate.ts`/`excelUpload.ts` (mirroring the legal-entity Excel pattern — client-side
`exceljs` parse, resolve Market Code + Product Code pair to `marketProductId`, reject
duplicates with a reason) plus a `PeriodUploadReviewModal.tsx` (valid/rejected tabs, same
as `LegalEntityUploadReviewModal`). New `PeriodAutoGenerateModal.tsx` (market product
picker, optional anchor period picker, iterations `InputNumber`). `PeriodsPage.tsx`
rewritten: market_product picker replaces the old commodityType select, all new lifecycle
date fields added to the drawer, Download Template / Upload Excel / Auto-Generate buttons
added to the page header.

**Live-verified, in order**: `mvn spring-boot:run` against the real dev DB — first boot
attempt caught the `market_product_period`/`position`/`position_eod_snapshot` index gaps
above (SQL Server rejects `ALTER COLUMN` while any index/constraint still references the
column, even after the FK itself is dropped), fixed, re-ran clean with zero Hibernate
`ddl-auto: validate` mismatches. `npx tsc -b` clean. Full curl round-trip as `admin`
against a freshly seeded throwaway market + market_product (`TESTV162`/product 1): period
create (confirmed `marketCode`/`productCode` hydration), the flat `/market-products`
listing, `auto-generate` with an explicit anchor (JAN-27 → FEB-27 → MAR-27 → APR-27, each
with `last_trade_date`/`expiry_date`/`first_notice_date` correctly resolved from the
market_product's offset columns) and again with **no** anchor (confirmed it correctly
found the latest existing period by `period_start` and rolled forward from there), bulk
create with one valid + one intentional duplicate row (confirmed the duplicate was
rejected with a clear reason while the valid row still committed), optimistic-lock update
(confirmed `row_version` 0→1) and a stale retry (confirmed 409), and deactivate (204). All
test data (market, market_product, 8 periods) cleaned up via direct `DELETE` afterward —
backend stopped, SQL Server container left running.

Dropped: `commodity_type` (superseded by `market_product_id` → `market_product.product_id`
→ `product.commodity_id`). `period_id` kept as a surrogate PK rather than switching to a
composite `(period_code, market_product_id)` PK — recommendation, not yet a locked
decision — to avoid composite FKs rippling into `market_product_period`, `period_mapping`,
and `trade.period_id`, and to stay consistent with every other master table's
surrogate-PK-plus-natural-unique-key pattern in this schema.

All INT-vs-BIGINT type questions for this table are now resolved: `period_id` → BIGINT,
`row_version` → INT.

## Cross-commodity coverage check (oil/power/agri/metals/gas)

Structurally the design generalizes across commodities — it hooks off `market_product_id`
(market × product), which is already commodity-agnostic. Existing columns already cover
power (`load_type`), gas (`gas_day_type`), agri (`period_type='CROP_YEAR'`), and sub-monthly
granularity (`period_type='DAY'/'INTRADAY'` + `is_rolling`). Two real nuances flagged for
backfill-planning time, not schema changes:

1. **First Notice Day vs. Last Trade Day ordering is commodity-dependent** — energy futures
   (WTI/Brent) typically have FND at/after LTD; CBOT agri futures (corn/wheat/soybean)
   commonly have FND **before** LTD. The proposed CHECK constraints deliberately don't
   order `first_notice_date` vs. `last_trade_date` against each other (unlike
   `period_start`/`period_end`, which are ordered) — so the schema doesn't fight this, but
   population/backfill logic needs to know it per commodity, it's not one universal rule.
2. **LME metals use a fundamentally different date structure, not yet verified against real
   LME specs.** Daily "prompt dates" out to 3 months, then weekly to 6 months, then monthly
   beyond — much higher row volume than oil/agri contract-month calendars, and market
   convention uses terms like "cash"/"3-month"/"tom-next" rather than month codes, which
   `exch_product_code` (contract-month style, e.g. `CLF27`) doesn't map onto cleanly. Only
   oil (CME) has been checked against live exchange spec pages so far this session — power/
   agri/metals conclusions above are from existing domain knowledge, not freshly verified.
   Flagged for a dedicated research pass before metals forward curves are built, not
   assumed to block the period redesign itself.

## Open questions to resolve before implementation

1. **`product_id` NOT NULL, confirmed** — but does the backfill of the 209 existing
   generic rows mean duplicating each rolling-template row once per product (multiplying
   row count substantially), or re-seeding a smaller deliberate set? Needs a concrete
   backfill plan, not just the column definition.
2. **FX fit** — option 1 (`fx_currency_pair` + dual nullable scope + CHECK) vs. option 2
   (leave `fx_period` standalone, fold only commodity products in). See above.
3. **QUARTER/CAL strip dates** — populate real last-trading-day dates derived from the
   final constituent month, or leave null by convention and only date individual
   months? Needs an explicit decision.
4. **`market_product_period`** — with `product_id` living directly on `period`, this
   junction table becomes largely redundant for "which product owns this period."
   It's unused today (0 rows). Retire it, or repurpose it as a separate "is this period
   currently tradeable" toggle independent of structural product ownership?
5. **Uniqueness** — `uq_period_code_comm (period_code, commodity_type)` can't survive a
   move to product-scoped rows as-is (repeated period_code across products, e.g. every
   product's own "JAN27" row). Will need `(period_code, product_id)` uniqueness,
   implemented as a filtered unique index (not a plain `UNIQUE` constraint) — SQL Server
   treats repeated NULLs as duplicates under a plain `UNIQUE`, the same trap hit and
   fixed on `physical_asset` in V161.
6. **`period_type` reconciliation** — `fx_period`'s 3 values (`SPOT`/`STANDARD_TENOR`/
   `DAILY_FORWARD`) need to map onto or extend `period`'s existing 11 (`SPOT` already
   overlaps; `STANDARD_TENOR`/`DAILY_FORWARD` are new concepts specific to FX's
   days-from-spot model — decide whether these become new enum values or get expressed
   via existing ones + the new `days_offset` column).

## What this unblocks once resolved

This is the tenor axis `masterdata_curve_derivative_asset_gaps_pending_06.md`'s still-open
gap #1 (`price_curve_point`, commodity forward-curve master) would reference —
resolving this design is a prerequisite for that table, not a parallel/independent
piece of work.
