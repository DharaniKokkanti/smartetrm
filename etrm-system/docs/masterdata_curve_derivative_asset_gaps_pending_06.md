# Pending Project — Curve/derivative/gas-storage master-data gaps (external review triage)

> **Persona for this doc:** You are an ETRM master-data architect triaging an external review checklist against the actual schema — apply that expertise to separate real gaps from claims the schema already covers, so nobody re-implements something that exists under a different name.

**Status: PARTIALLY RESOLVED (2026-07-26, V161 + follow-up frontend/backend
sync).** Gaps #2 (derivative contract spec master), #3 (gas-storage
columns), and #4 (physical_asset registry) are now **DONE end-to-end**
(schema + Java entity/service + frontend) — see "V161 implementation
record" and "Frontend/backend sync follow-up" at the bottom of this doc.

**Correction on gap #5 (counterparty group hierarchy)**: this was
**already fully implemented before this session**, by
`V62__legal_entity_counterparty_parent_ind.sql` — `parent_counterparty_id`
(self-referencing FK), `parent_ind`, both CHECK constraints, and full
Java entity + frontend (`CounterpartyFormPage.tsx`) wiring all already
existed. The original triage below missed this because it only grepped
`V1__master_data_foundation.sql` for the pattern, not the full migration
set — a real research gap, not a schema gap. V161's ALTER for this column
was a guarded no-op (column and FK both already existed, `IF NOT EXISTS`
skipped both) — harmless, but the "DONE" claim in this doc's first version
was wrong to attribute to V161. Correcting the record here rather than
silently editing history.

Gap #1 (commodity forward-curve/vol-surface/yield-curve master) is **still
open**, deliberately not attempted in this pass — it's a materially bigger
design (interpolation methods, curve-point storage shape, vol-surface
dimensionality) that needs its own scoping session, not a quick additive
migration like the others.

Original triage record follows, kept for context on how each claim was
checked. An external review (pasted checklist, not from this codebase)
claimed a list of missing entities/domains. Checked each claim against the
live migration set (frontier V160 at the time) before writing anything down,
per this project's standing rule to verify against real schema state before
accepting an external claim. Several claims were **already covered** under
different table names; those are noted below so they aren't re-flagged in a
future session.

## Confirmed real gaps

### 1. No commodity forward-curve / vol-surface / yield-curve master (Item A)

**CORRECTED 2026-08-11 — mostly resolved, or never actually missing; original
framing below was wrong.** Re-reviewed after Dharani directly questioned why
a new `price_curve` table would be needed when `price_index` already exists
and is period-linked.

- **Forward curve — NOT missing, no new table needed.** `dbo.price_index`
  (the series definition) + `dbo.period` (the tenor bucket — `period_start`/
  `period_end`, `curve_label`, `price_index_id` FK) + `dbo.settlement_price`
  (`price_index_id` + `period_id` + `settle_date` + `settle_price`/bid/ask)
  together already **are** a forward curve: every `settlement_price` row for
  one `price_index_id` as of one `settle_date`, across every linked
  `period_id`, is a curve point. `SettlementPricesPage.tsx`'s own field hint
  says this explicitly ("lets a forward curve be assembled from stored
  settlement prices") — the design already anticipated this, it just isn't
  labeled "curve" anywhere. **Real, narrow remaining gaps**: (1) no
  interpolation-method field on `price_index`/`period` (linear/flat-forward/
  log-linear — needed to value a position whose date falls between two known
  period points, not just on a period boundary), (2) no dedicated "assemble
  and view the curve" report/API — today you can only see one
  `settlement_price` row at a time, not "the whole Brent curve as of
  2026-08-11" as a single view. Both are small, additive — not a schema
  redesign.
- **Volatility surface — already built, not missing.** `dbo.volatility_point`
  (`option_index_link_id`, `period_id`, `moneyness_label`, `strike_price`,
  `quote_date`, `implied_volatility`) + `dbo.option_index_link`, both with
  real Java controllers (`VolatilityPointController`, `OptionIndexLinkController`)
  and a real live page (`/pricing/volatility-points`). The original
  "no schema exists for a strike×expiry×as-of-date vol surface" claim in the
  handoff doc (§0, 2026-07-27) is stale — this was built in a later session
  and the earlier doc entry never got corrected. Nothing to do here.
- **Discount/yield curve — genuinely still missing**, unchanged from the
  original finding: `interest_rate_index` (V5) defines named rate indices
  but there's no curve-of-tenor→rate-points table and zero code consumes it
  for PV/discounting. See `discount_premium_interest_rate_gaps_pending_08.md`
  and handoff §12 for this one specifically — it's the one piece of this
  original three-part gap that's actually still open.

### 2. No reusable derivative-contract specification master (Item B)
`dbo.trade_option_detail` (V44) captures option economics **per trade**
(put/call, strike, expiry, exercise_date, premium, lot_size) but there is
no separate reference/master table defining reusable contract
specifications — option style (American/European/Asian), exercise type
(physical/cash), tick value, first/last notice date, or settlement-roll
convention — that a family of contracts (e.g. all WTI options on a given
listed series) would share. Every trade re-enters these implicitly instead
of inheriting them from a spec. **Real gap**, though scope should be
confirmed (physical/OTC-only shop may not need this depth).

### 3. No gas-storage-specific physical attributes (Item E, storage half)
`dbo.storage_facility` (V1) is a generic facility table (capacity,
capacity_uom, operator, facility_type incl. `TANK`/`GRAIN_SILO`/`CAVERN`)
with no `working_gas_capacity`, `cushion_gas`, or per-day
injection/withdrawal-rate columns. This gap is **already self-documented**
in `V103__logistics_delivery_gaps.sql`'s own comments ("storage_facility
has no regulatoryRef/injectionRate/withdrawalRate/statusCode columns") —
deliberately deferred at the time, not missed. Pipeline itself
(`pipeline`/`pipeline_point`/`pipeline_segment`/`pipeline_tariff`/
`pipeline_cycle`, V4/V8/V74/V75/V91) is well covered — the review's
`pipeline_system` claim does **not** hold.

### 4. No polymorphic `physical_asset` parent (Structural Recommendation 1)
Confirmed: no such table. `lng_terminal_detail`, `storage_facility`,
`generation_asset` etc. are independent tables, each separately carrying
country/owner/operator/status rather than inheriting from a shared parent.
This is a **structural/architectural** recommendation, not a missing
domain — real, but a bigger lift (schema remodel + FK migration across
several existing dedicated tables) than the other items here. Flagging for
awareness, not proposing to act on it without an explicit decision — this
kind of remodel changes a lot of existing dedicated-table FKs at once.

### 5. `counterparty_group` hierarchy missing (Structural Recommendation 3, half)
`dbo.legal_entity` (V1) already has `parent_entity_id` — a genuine
self-referencing group hierarchy on the internal-entity side. `dbo.counterparty`
(V1) has no equivalent `parent_counterparty_id`/`counterparty_group` — every
counterparty is a flat row, so external-party group relationships (e.g. a
trading desk and its parent conglomerate as separate counterparties) can't
be modeled. `is_intercompany` + `internal_entity_id` do correctly link a
counterparty back to an internal `legal_entity` when it's really us, which
covers the review's core "segregate intercompany vs. external" concern —
the missing piece is specifically external-party-to-external-party grouping.
**Real, narrow gap.**

### 6. `location.location_type_id` is single-valued — BUILT 2026-08-11 (V216)

**Status: DONE, full-stack, live-verified.** Design below was reviewed and approved by
Dharani ("go ahead and fix this... drop me final version before you build"); built exactly
as drafted after confirming the design against real-world exchange-warehouse structure
(GKEML's public "dual-commodity delivery qualification" case — a single facility holding
independent exchange approvals layered on top of its base classification, matching the
`location_role_assignment` link-table shape below, not a boolean-flag alternative).

**What was built**: `dbo.location_role_assignment` (V216) — `location_id` + `location_type_id`
(reused FK) + `approval_reference`/`effective_date`/`expiry_date`/`notes`, unique on
`(location_id, location_type_id)`, full row_version guard trigger. `location.location_type_id`
itself untouched (still the primary/default role, zero blast radius). Java:
`LocationRoleAssignment`/`LocationRoleAssignmentRepository`/`LocationRoleAssignmentService`,
new sub-resource endpoints on `LocationController` (`GET/POST/PUT/DELETE
/api/v1/locations/{id}/roles`). Frontend: `LocationRolesSection.tsx` — an "Additional Roles"
table + Add Role modal embedded in the existing Locations edit Drawer, live CRUD (no staging),
duplicate-role add correctly 409s. MSW mock seeded with `LME-WAREHOUSE` (location 7) holding an
`EXCHANGE` role (`LME-WH-00412`) as the worked example.

**Live-verified**: `mvn compile` clean, real backend boot applied V216 with zero Hibernate
validation errors, full curl round-trip against the real DB (create → hydrated
`locationTypeCode` → duplicate 409 → update bumps `rowVersion` 0→1, guard trigger confirmed
working → delete → unauthenticated request 403s). `npx tsc -b --noEmit` clean. Real end-to-end
UI pass via Playwright against the live dev server + real backend: opened an existing
location, added a role through the modal, confirmed it appears in the table, removed it,
confirmed it's gone — no console/page errors. Backend stopped after verification.

Original research/design record follows, kept for context:

### 6a. Original gap record (now resolved above)

Confirmed live (`V1__master_data_foundation.sql`): `dbo.location` has exactly one
`location_type_id INT NOT NULL` FK to `dbo.location_type` (values: `PORT`,
`PIPELINE_HUB`, `GAS_HUB`, `GAS_PIPELINE`, `GRID_NODE`, `POWER_PLANT`,
`WAREHOUSE`, `EXCHANGE`, `REFINERY`, `LNG_TERMINAL`, `OTHER`) — a location can
only ever be classified as one of these. Real-world counter-example: an
LME-approved warehouse is simultaneously a `WAREHOUSE` (physical storage,
capacity/operator attributes) and an `EXCHANGE` delivery point (eligible for
exchange-warrant delivery against a futures contract) — today's schema can't
express both on the same row, forcing either a duplicate row (breaks
`uq_location_code`/data integrity) or a wrong single classification.

**How LME actually structures this (research, not vendor precedent):** LME
does not treat "warehouse" and "exchange delivery point" as mutually exclusive
categories at all — the real hierarchy is **Delivery Point → (one or more)
approved Warehousing Companies → individual Warehouses**, and a single
physical warehouse can hold LME-approved status for multiple metals/brands
independently. The "exchange-ness" is an *approval/role*, layered onto a
warehouse, not a replacement classification for it.
Source: [LME — Warehousing](https://www.lme.com/en/Warehousing), [LME approved warehouse list & structure](https://www.lme.com/en/warehousing/lme-warehouses).

**Proposed shape (draft, not built):** same pattern already used elsewhere in
this schema for multi-role tagging (`book_classification`'s dimension+value
rows, and `location`'s own existing `office_loc_ind`/`trading_desk_ind`
boolean flags, which are a narrow precedent for "one location, multiple
roles"). Two options, in order of preference:
1. **`location_role_assignment`** (new link table): `location_id` +
   `location_type_id` (reused FK, now many-per-location) + optional
   role-specific attributes (e.g. `is_primary`, `effective_date`,
   `approval_reference` for the exchange-approval case) — `location_type_id`
   moves from a column on `location` to rows in this table. `location` keeps
   one attribute set (address, coordinates, operator) since the physical
   place doesn't change; only its *roles* multiply.
2. Cheaper/narrower alternative if a full remodel isn't wanted yet: add
   targeted boolean flags to `location` itself, following the
   `office_loc_ind`/`trading_desk_ind` precedent already in the table (e.g.
   `is_exchange_approved_ind`) — works for the specific warehouse+exchange
   case but doesn't generalize to arbitrary N-role combinations the way
   option 1 does.

**Not proposing to build either without review** — option 1 is a real schema
change touching every place that currently reads `location.location_type_id`
as a single value (filters, FK dropdowns, `physical_asset` backref logic).
Flagging as a real, scoped gap for a future session.

### 7. `dbo.physical_asset` — clarification, not a new gap (re: "schema-only stub")

Re-confirmed against the V161 record above (§ "V161 implementation record"):
`physical_asset` having no Java entity/controller and not appearing in the
Master Data Hub **is deliberate, not an oversight** — it was built
`is_enabled=0`/all-write-flags-0 on purpose, as a **derived catalog index**
over `storage_facility`/`generation_asset` (one row per real asset, backfilled
automatically), not a source-of-truth table anyone edits directly. The actual
editable full-stack pages for the underlying assets already exist and are
real (`StoragePage.tsx`/`StorageFacility.java` etc.) — `physical_asset` exists
purely so cross-asset-class queries/governance sweeps have one table to join
against, per its own migration comment. If a real cross-asset-class *view*
(e.g. "all physical assets I own, storage or generation, in one grid") is
wanted, that's a new read-only page/endpoint over the existing
`physical_asset` table — not a full CRUD build-out, since the table was never
meant to be edited directly.

## Claims that do NOT hold — already covered, do not re-flag

- **Item D (credit limits / ISDA-CSA)** — `dbo.credit_limit` (V1, expanded
  heavily in V49: commodity scope, DIRECT/ALLOCATED basis with
  `parent_limit_id` hierarchy, country risk rating, collateral offset,
  temp uplift, tenor cap, warning/critical thresholds, breach action) plus
  `dbo.margin_agreement` (V35: CSA_BILATERAL/CSA_ONE_WAY/PLEDGE/CTA types,
  threshold_amount, cp_threshold_amount, MTA, independent_amount, gov_law,
  valuation_frequency) together are a functionally complete equivalent of
  the review's `counterparty_credit_limit_master`/`isda_csa_master` ask,
  just under different names. One minor sub-gap: no explicit
  Peak-Exposure/PFE *calculated* field — worth a look if VaR/PFE reporting
  is being built next, not urgent on its own.
- **Item C (agriculture)** — `dbo.agri_crop_year_lifecycle` and
  `dbo.agri_moisture_discount_scale` (both present) cover crop-year and
  moisture-discount seasonality directly; `dbo.commodity_grade_standard`
  (V67) covers grade-level price differentials generically across
  commodity families (not just Agri). No dedicated `elevator_terminal_detail`
  table, but `storage_facility_type` already has a `SILO` (formerly
  `GRAIN_SILO`) type riding the generic `storage_facility` table — same
  model gap as gas storage above (#3), not a separate missing domain.
- **Structural Recommendation 2 (dynamic quality-attribute matrix)** —
  `dbo.metal_assay_component_rule` (V96) is *exactly* this pattern already
  built and live: per-product chemical-element rows with
  `base_content_pct`/`rejection_threshold_pct`/`penalty_per_ppm_over_base`,
  i.e. a real attribute-range-with-penalty-formula table — just scoped to
  metals assay only. Oil/Agri/Coal still use the flatter
  `commodity_grade_standard` (grade-code-level, not continuous min/max/target
  ranges). So the *pattern* exists and is proven in production; extending
  it to other commodity families (rather than inventing a new generic
  `product_quality_attribute`/`product_spec_range` pair) is the more
  consistent path if this gets picked up later.

## Next steps

Only gap #1 (commodity forward-curve/vol-surface/yield-curve master) remains
open — the widest-blast-radius item, since it blocks any real MTM/VaR work.
Needs its own scoping pass (curve-point storage shape, interpolation method
vocabulary, vol-surface dimensionality) before a migration is written, not a
quick additive fix like the other four.

## V161 implementation record (2026-07-26)

Fixed gaps #2, #3, #4, #5 in one migration,
`V161__curve_derivative_asset_gap_fixes.sql` (mirrored to
`database/161_curve_derivative_asset_gap_fixes.sql`). Two scoping questions
confirmed with Dharani before writing anything: `row_version` type for the
two new tables (**INT**, matching the universal existing pattern — no table
here has a high-frequency-write profile that would justify `BIGINT`), and
how deep to go on physical_asset (**additive registry only** — `location`
already carries most of the shared country/timezone/lat-long/operator/
capacity attributes the original review wanted centralized via a real
parent-owns-the-data remodel, so a full remodel touching existing PKs/Java
entities/frontend wasn't worth the risk for what's actually left to solve:
a cross-commodity index, not a data model fix).

**What shipped:**
1. **`dbo.derivative_contract_specification`** — new table, rides the
   generic Tier2 engine (`allow_create/edit/delete=1`, no Java entity, same
   pattern as `dbo.metal_assay_component_rule`, V96). `instrument_type`
   (FUTURE/OPTION/SWAP/SWAPTION/SPREAD_OPTION/FORWARD), `option_style`
   (AMERICAN/EUROPEAN/ASIAN, only for the option-shaped instrument types —
   enforced by `chk_dcs_option_fields_scope`), `exercise_type` (PHYSICAL/
   CASH), `contract_size`/`tick_size`/`tick_value` with UOM/currency FKs,
   and `notice_date_convention`/`expiry_convention`/`settlement_roll_convention`
   as the reusable-per-contract-family fields the review asked for —
   deliberately free-text/descriptive for the date conventions (not
   per-trade literal dates, which stay on `trade_option_detail` where they
   already are, one real date per trade instance).
2. **`dbo.storage_facility`** gained `working_gas_capacity`,
   `cushion_gas_volume`, `max_injection_rate_per_day`,
   `max_withdrawal_rate_per_day`, `gas_volume_uom_id` — all nullable, only
   meaningful for the `GAS_STORAGE` facility_type (already existed since
   V47, no constraint change needed).
3. **`dbo.physical_asset`** — new catalog-only registry (`is_enabled=0`,
   all write flags `0` — not user-editable through the generic grid, since
   it's a derived index, not a source of truth), `asset_class` +
   nullable `storage_facility_id`/`generation_asset_id` back-references
   enforced mutually exclusive by `chk_pa_one_backref`, plus
   `owner_legal_entity_id`. Backfilled one row per existing
   `storage_facility`/`generation_asset` row.
4. **`dbo.counterparty.parent_counterparty_id`** — self-referencing nullable
   FK, exact mirror of `dbo.legal_entity.parent_entity_id`'s existing
   pattern (V1).

**Real bug caught during live rollout, not by review**: the first version
used plain `UNIQUE` constraints on `physical_asset.storage_facility_id`/
`generation_asset_id`. SQL Server treats multiple `NULL`s as duplicate
values under a `UNIQUE` constraint (unlike most other engines) — the
backfill's second `INSERT` (all `generation_asset_id = NULL` since this dev
DB has zero generation_asset rows) hit `Violation of UNIQUE KEY constraint
'uq_pa_generation_asset'... duplicate key value is (<NULL>)`. Flyway rolled
the failed migration back cleanly (confirmed via `flyway_schema_history`
query: no v161 row existed after the failure, no `flyway:repair` needed).
Fixed by switching both to filtered unique indexes
(`CREATE UNIQUE INDEX ... WHERE col IS NOT NULL`), which allow multiple
`NULL`s while still enforcing uniqueness among the actual (non-null)
values — re-ran clean.

**Live-verified**: applied via real `mvn spring-boot:run` against the live
dev DB (had to `export DB_USERNAME`/`DB_PASSWORD` from `etrm-backend/.env`
manually since a bare `mvn spring-boot:run` doesn't auto-source `.env` —
first attempt failed on `etrm_app` login, unrelated to this migration).
`Successfully applied 1 migration to schema [dbo], now at version v161`;
backend booted clean, zero Hibernate `ddl-auto: validate` mismatches. Direct
`sqlcmd` confirmed: 61 `storage_facility` rows → 61 `physical_asset` rows
(0 `generation_asset` rows in this dev DB, so 0 of that half backfilled —
correct, nothing to backfill), all 5 gas-storage columns present, all 24
`derivative_contract_specification` columns present,
`counterparty.parent_counterparty_id` present. `curl` round-trip as `admin`:
`POST /api/v1/reference-data/derivative_contract_specification` → `201`
with correct field mapping and `createdBy` stamped, immediately
`DELETE`d again (test row not left behind). `POST` to
`/api/v1/reference-data/physical_asset` → `404` ("not a registered Tier 2
table"), confirming the catalog-only `is_enabled=0` row behaves identically
to the existing `credit_limit`/`margin_agreement` catalog-only precedent.
Backend stopped after verification; SQL Server container left running (was
already running before this session).

## Frontend/backend sync follow-up (2026-07-26)

V161 alone left two of the four fixes DB-only: `storage_facility` and
`counterparty` are **dedicated** (non-Tier2) JPA entities with explicit
field-by-field `@Column` mappings, so new DB columns don't automatically
become visible to the API or frontend the way a generic Tier2 table's do.
User asked directly whether frontend/API/backend were actually synced —
they weren't for these two, so this pass closed that gap.

**`dbo.storage_facility`** — `StorageFacility.java` gained
`workingGasCapacity`/`cushionGasVolume`/`injectionRate`/`withdrawalRate`/
`gasVolumeUomId`(+transient `gasVolumeUomCode`) fields;
`StorageFacilityService.hydrate()` resolves `gasVolumeUomCode` the same way
it already resolves `capacityUomCode`. Real find while doing this: the
frontend's `StorageFacility` type and `StoragePage.tsx` form **already
had** `injectionRate`/`withdrawalRate` fields — added before V103, with no
backing column at all (that migration's own comment says so explicitly).
Mapped the new `max_injection_rate_per_day`/`max_withdrawal_rate_per_day`
columns to those exact existing frontend field names rather than inventing
new ones, so this incidentally fixes a pre-existing dead-field bug instead
of adding a parallel one. `workingGasCapacity`/`cushionGasVolume`/
`gasVolumeUomCode` are net-new fields, added to `types.ts` and the drawer
form in `StoragePage.tsx`. `regulatoryRef`/`statusCode` remain unbacked —
out of scope (unrelated concepts per the V103 comment, not gas-storage
attributes).

**`dbo.counterparty`** — no work needed; already fully wired since V62 (see
the correction above).

**`dbo.derivative_contract_specification`** — added a `MasterDataHub.tsx`
entry (`Products & Markets` group, `/static-data/derivative_contract_specification`,
following the exact pattern of the adjacent `metal_assay_component_rule`
entry). The generic `/static-data/:tableName` route already handles any
registered table with no per-table route needed — confirmed by reading
`AppRouter.tsx`. No backend change needed here; the Tier2 API was already
live from V161.

**Live-verified**: backend recompiled and reapplied against the running
dev DB via `mvn spring-boot:run` (same `DB_USERNAME`/`DB_PASSWORD` export
as before), booted clean, zero Hibernate `ddl-auto: validate` mismatches
(confirming the new `@Column` mappings match the V161 schema exactly).
`curl` as `admin`: `POST /api/v1/storage` with `workingGasCapacity`,
`cushionGasVolume`, `injectionRate`, `withdrawalRate`, `gasVolumeUomCode`
all populated → `201` with every field echoed back correctly (including
`gasVolumeUomCode` resolved from the FK by `hydrate()`); `GET /api/v1/storage`
confirmed the row persisted with all 5 new values; test row's parent
storage facility left in place (only field values changed on an existing
row, nothing destructive). `npx tsc -b` clean on the frontend. Backend
stopped after verification.
