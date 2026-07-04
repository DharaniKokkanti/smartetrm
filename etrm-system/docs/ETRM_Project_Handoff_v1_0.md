# ETRM System — Project Handoff Document
**Version:** 1.8 | **Date:** July 2026 | **Status:** Trade Capture + Credit & Risk Module Complete — migration frontier V56

---

## 0. Session Recap (read this first when resuming)

**Migration frontier: V56.** Next migration is **V57**. Every SQL change must be written to BOTH `etrm-system/database/NN_name.sql` (no V prefix) AND `etrm-backend/src/main/resources/db/migration/VNN__name.sql` (V prefix) — keep them byte-identical.

**CRITICAL — typecheck command:** `npx tsc --noEmit` in `etrm-frontend/` is **vacuous** — the root `tsconfig.json` is solution-style (`"files": []`, references only) and exits clean without checking anything. Always use `npx tsc -b --noEmit` (matches the real build script `tsc -b && vite build`). This bit us once this session — 24 real errors were hiding behind a false-clean `tsc --noEmit`.

**CRITICAL — there are two separate, non-interchangeable "legal entity" mock stores in the frontend.** `src/mocks/handlers.ts` exports `legalEntityStore` (seeded from `src/mocks/data.ts`: ACME-UK / ACME-US / GLOBEX-SG) — this is the **real, canonical, CRUD-backed** one, registered first in `browser.ts` so it's what `GET /legal-entities` actually returns and what `useLegalEntities()` shows everywhere. `src/mocks/etrmHandlers.ts` separately has an internal `legalEntitiesRef` shadow array (SETRM-LTD / SETRM-NL / SETRM-SG) used only to denormalize desk/book/trader seed rows — it is dead code as far as the `/legal-entities` endpoint goes (shadowed by registration order) and must never be used for anything a user can look up by legal entity id, or the displayed code won't match any real, editable record. Desk/book/trader `legalEntityCode` values were found stale (pointing at the shadow codes) this session and corrected to the real ones — if you add a new master-data entity that references `legalEntityId`, denormalize against `legalEntityStore`, not `legalEntitiesRef`.

**What changed this session, most recent first:**
- **V56 — FX forward curve support: new `dbo.fx_period` tenor master + refactored `dbo.fx_rate`.** User asked for comprehensive FX rate support and supplied the exact structural spec for a dedicated tenor/period table (not a generic `lookup_value` category), reasoning it needs to scale to 1000+ individual daily-forward rows without bloating the small-list lookup table. Reviewed our existing `dbo.fx_rate` (V1) first: it was a flat spot/EOD table with no tenor/forward-curve concept at all, no seed data, and no frontend page reading it yet (`live: false` Hub placeholder) — a clean additive change, not a breaking one. Implemented via `ALTER` (not drop+recreate) since migrations should stay safe against an environment that already has real rows, even though ours is empty today. New `dbo.fx_period` (11 rows seeded: SPOT, 1M–2Y standard tenors, DAY_1–3 example daily forwards — additional `DAY_N` rows get inserted on demand, not pre-seeded to 1000). `dbo.fx_rate` gained `fx_period_id` (FK), `maturity_date`, `rate_value_type` (OUTRIGHT/POINTS); the existing `uq_fx_rate` uniqueness constraint was widened to include `fx_period_id` (multiple tenor rows now legitimately exist per currency-pair/rate-date); kept the existing `chk_fx_rate_type` (EOD/INTRADAY/SETTLEMENT/FIXING/MID) and `chk_fx_different` constraints unchanged — the user's fragment had dropped the `rate_type` CHECK to a narrower 3-value list, which looked like an incomplete copy-paste rather than an intentional narrowing, so it was preserved as-is. Added the specified `ix_fx_rate_valuation_lookup` composite index for curve-range queries. Frontend: added `fx_period` as a new live Static Data table + Master Data Hub card (Pricing & Rates group); `fx_rate` itself stays `live: false` — building its actual forward-curve capture UI is a separate, larger feature beyond this migration. `tsc -b --noEmit` clean; verified in headless Chrome (11 rows render, no errors).
- **V55 — commodity_type / book_type: hardcoded CHECK strings → FK on `lookup_value`, across all 9 tables that shared the pattern.** User supplied a reference spec proposing this for 4 tables (`commodity`, `unit_of_measure`, `location_type`, `desk`) plus `book.book_type`. Reviewing the actual schema first surfaced two things that changed the plan:
  1. **The same commodity_type VARCHAR+CHECK pattern (11-value V47 vocabulary) is also on `gl_account`, `trader_commodity_limit`, and the freight tables added this session (`freight_rate_index`, `laytime_term_template`, `demurrage_dispatch_rate`)** — not just the 4 tables named. Converting only 4 of 9 would've left two incompatible representations of the same concept in the schema. Asked the user to confirm scope via AskUserQuestion; they chose "all ~9 tables" for full consistency.
  2. Executed for all 9: `commodity.commodity_type`, `unit_of_measure.commodity_type`, `location_type.commodity_type`, `desk.commodity_type`, `book.commodity_type`, `book.book_type`, `gl_account.commodity_type`, `trader_commodity_limit.commodity_type`, `freight_rate_index.commodity_type`, `laytime_term_template.commodity_type`, `demurrage_dispatch_rate.commodity_type` — each converted from VARCHAR+CHECK to `INT` FK on `dbo.lookup_value(lookup_id)` via a staging-column-and-rename pattern (add nullable INT column → backfill by joining old value to `lookup_value.code` → drop old CHECK + column → rename staging column into place → re-apply NOT NULL where the original was NOT NULL → add FK). Seeded `lookup_value` with `category='commodity_type'` (11 rows) and `category='book_type'` (6 rows). `book.book_type`'s inline `DEFAULT 'TRADING'` needed special handling — SQL Server auto-names inline default constraints, so the migration looks it up dynamically before dropping the column, then re-adds a new default pointing at the resolved `TRADING` lookup_id via dynamic SQL. `ix_book_entity` (the only index that referenced a converted column) was recreated after the swap.
  - **Deliberately NOT touched — flagged as a separate, much larger follow-up, not part of the agreed scope**: `dbo.trade.commodity_type`, `dbo.location.commodity_type`, `dbo.pipeline.commodity_type`, `dbo.holiday_calendar.commodity_type`, and the counterparty commercial-terms `commodity_type` column. These are core transactional/operational tables with heavy trade-capture and reporting surface area — converting them is a much bigger blast-radius change than the 9 reference-data tables done here.
  - Frontend: updated the 4 tables already in the generic Static Data mechanism (`commodity`, `freight_rate_index`, `laytime_term_template`, `demurrage_dispatch_rate`) — their `commodityType` column changed from `enum` kind to `foreign_key` kind, and every rowSeed value changed from the string code to the matching numeric lookup id (same order as the SQL seed: OIL=1, GAS=2, POWER=3, LNG=4, AGRICULTURAL=5, METALS=6, FREIGHT=7, RINS=8, ENVIRONMENTAL=9, MULTI=10, OTHER=11).
  - **Explicitly deferred, not silently skipped**: `desk`, `book`, `gl_account`, and `trader`/`trader_commodity_limit` are NOT in the generic Static Data mechanism — they're dedicated feature pages (`DesksPage`, `BooksPage`, `GlAccountsPage`, `TradersPage`) with hardcoded TypeScript `CommodityType` string-union types and `<Select>` dropdowns built from those unions across several files each. Converting those to ID-based FKs while keeping human-readable dropdown labels is a real, moderate-to-large frontend refactor (new shared `{id, code, label}` constant per category, form field type changes, mock data changes) that wasn't attempted in this pass — flagging clearly here rather than doing a rushed, half-verified version across 4+ complex pages.
  - Verified: `tsc -b --noEmit` clean; headless Chrome confirmed all 4 updated generic tables (`commodity`, `freight_rate_index`, `laytime_term_template`, `demurrage_dispatch_rate`) still render their exact expected row counts with no runtime errors.
- **Reviewed a second user-supplied reference spec proposing 4 schema "corrections" — 2 of the 4 were based on incorrect assumptions about the actual schema and were not applied; the other 2 were already substantially solved differently than proposed.** Investigated the real schema (not just the pasted fragment) before touching anything:
  1. **Rejected**: making `app_user.legal_entity_id` nullable to "fix a circular bootstrapping dependency." Checked — no such dependency exists. `legal_entity.created_by` and `app_user.created_by` are plain `VARCHAR(100)` audit strings, not foreign keys back to `app_user`; the only real FK is the one-directional `app_user.legal_entity_id → legal_entity.legal_entity_id`, which bootstraps cleanly (create the legal entity first with `created_by='SYSTEM'`, then the user). Making the column nullable would have been a pure data-integrity regression with no actual problem behind it.
  2. **Handled via the AskUserQuestion + V55 above** (commodity_type/book_type → lookup_value FK) — see V55 entry.
  3. **`dbo.trader.commodity_types VARCHAR(200)` CSV column** — confirmed this genuinely exists in the raw SQL (a real 1NF violation), but `dbo.trader_commodity_limit` (added in V43) already normalizes it into proper rows and the CSV column was only kept "for backward compatibility" per that migration's own comment — nothing in our frontend/backend still reads it (the frontend mock already models per-trader commodities as an array + separate `commodityLimits`, not a CSV string). Not yet dropped or replaced with the user's proposed `trader_commodity_market` table in this session — noted as a clean, low-risk follow-up (the CSV column is genuinely vestigial and safe to drop; `trader_commodity_market` would be a legitimate *additional* table since it's about trade-permissioning/access-control, not limit values — a different concern from what `trader_commodity_limit` already covers).
  4. **`dbo.counterparty.credit_limit`/`credit_limit_currency`/`credit_review_date` flat columns** — confirmed these still exist alongside a proper, already-normalized `dbo.credit_limit` child table (built in V35, expanded in V49: `counterparty_id`, `limit_type` SETTLEMENT/PRE_SETTLEMENT/DELIVERY/MARK_TO_MARKET, `limit_amount`, `limit_currency`, `effective_date`/`expiry_date`, `status`). Creating the user's proposed `counterparty_credit_limit` table would have duplicated this — a split-brain data model. Not fixed in this session (the flat columns are actively read/written by `CounterpartyFormPage.tsx`/`CounterpartyListPage.tsx`/`types.ts`, so removing them requires a coordinated frontend change, not just a SQL drop) — noted as a follow-up: add `legal_entity_id` to the existing `dbo.credit_limit` table (a genuine gap — "which internal entity grants this limit" isn't captured today) and migrate the frontend off the flat counterparty columns onto the real `credit_limit` table before dropping them.
- **V54 — Freight master data integrity constraints, implementing the gaps found by reviewing a user-supplied reference spec against our actual V8+V53 schema.** User pasted a reference version of the freight master data script (`ETRM_Freight_External_MD_Patch_v1_0.sql`) and asked to review it and implement whatever was missing. `charter_party_type` matched exactly. Three real gaps found and fixed:
  1. **`freight_rate_index` was missing a business-rule CHECK** requiring BALTIC/ASSESSED index types to carry a currency + UoM (an index that can't resolve to a $/unit rate isn't usable for benchmarking) — our BALTIC/ASSESSED seed rows (BDTI, BCTI, BDI, BPI, BSI, BHSI, SPARK30S) all had NULL currency/uom. Added two new UoMs that didn't exist before (`PDAY` — Per Day, for the dry-bulk TCE indices and the LNG assessment; `WS_PT` — Worldscale Points, for the Worldscale-quoted tanker indices), backfilled all 7 rows with USD + the appropriate UoM, then added `chk_fri_pricing_rules`.
  2. **`laytime_term_template`'s NOR turn-time was nullable and hours-based** (`notice_period_hours`, added in V53) — left NULL on templates without the full WIPON/WIBON/WIFPON/WCCON bundle. The reference spec models this as mandatory and minutes-granular (`notice_of_readiness_turn_time_mins INT NOT NULL DEFAULT 360`), which is more correct: a 6-hour NOR turn time is the near-universal market default regardless of laytime exclusion basis. Replaced the column outright (converted existing 6hr values to 360, defaulted the rest to 360) rather than keeping both — two overlapping nullable/mandatory fields for the same concept would just be confusing.
  3. **`demurrage_dispatch_rate` was missing two data-integrity CHECKs**: `demurrage_rate_per_day >= 0`, and `dispatch_rate_per_day <= demurrage_rate_per_day` (dispatch can never commercially exceed demurrage — it's conventionally half). Verified all 7 existing rows already satisfied both before adding the constraints, so no data fixes needed there.
  - Frontend (`referenceData.ts`) updated to match: `laytime_term_template`'s column renamed `noticePeriodHours` → `noticeOfReadinessTurnTimeMins` (now non-nullable, all 8 rows set to 360); `freight_rate_index`'s BALTIC/ASSESSED rows backfilled with `currencyId: 1` (USD) and placeholder `uomId` values (101=PDAY, 102=WS_PT) — flagged as placeholders since the frontend still has no `uom` mock table at all (pre-existing gap, not fixed here), so these numbers aren't cross-referenced against anything, they only need to be non-null.
  - Verified: `tsc -b --noEmit` clean; headless Chrome confirmed both `laytime_term_template` and `freight_rate_index` render all rows with no runtime errors after the schema change.
- **Removed the RINs Hub and Environmental Hub pages — same redundant-hub pattern as the earlier Credit Hub removal.** Both `RinsHub.tsx` and `EnvironmentalHub.tsx` were pure card-grid pages linking to individually-navigable pages already reachable from the same sidebar nav group ("Regulatory" and "Environmental"), and the Master Data Hub already covers the identical items under its "RIN & Renewable Fuels" and "Carbon & Environmental" groups — so, like Credit, a second narrower hub for the same items was redundant. Deleted both hub components, removed their lazy imports/routes from `AppRouter.tsx` (bare `/rins` and `/environmental` now `<Navigate to="/master-data" replace />`), and removed the "RINs Hub"/"Environmental Hub" entries from `AppShell.tsx`'s nav groups (the individual page links — Fuel Categories, RIN Accounts, Emission Schemes, etc. — remain unchanged). Verified via headless Chrome: both bare paths redirect to `/master-data`; nav no longer shows either hub label but still shows the individual pages; direct navigation to a child route (e.g. `/rins/fuel-categories`) still works. `tsc -b --noEmit` clean.
- **V53 — Freight/demurrage master data audit + enhancement, researched against real charter party practice, made to work across oil/LNG/dry-bulk (metals/agri).** User asked to check freight/demurrage master data for missing key fields and "build it clearly that works for all commodities — oil, LNG, metals, power etc." Researched BIMCO laytime definitions, NOR-tendering clauses (WIPON/WIBON/WIFPON/WCCON), LNG heel/boil-off conventions, and dry-bulk stowage factor/grain-bale capacity, then compared against the existing V8 freight reference tables and V4 vessel table. Gaps found and fixed:
  1. **`freight_rate_index` had no CHECK constraint on `commodity_type` at all**, and its Baltic dry-bulk seed rows (BDI/BPI/BSI/BHSI) were wrongly tagged `AGRICULTURAL`-only even though those indices price any dry-bulk cargo (ore, coal, grain). Added the canonical 11-value `commodity_type` CHECK (same vocabulary as V47's book/desk/gl_account extension: `OIL,GAS,POWER,LNG,AGRICULTURAL,METALS,FREIGHT,RINS,ENVIRONMENTAL,MULTI,OTHER`), broadened those 4 rows to `NULL` (= all dry-bulk commodities), and added `SPARK30S` (Spark Commodities' LNG freight assessment) since LNG had no freight benchmark at all.
  2. **`laytime_term_template` had no way to express NOR-tendering clauses** (WIPON/WIBON/WIFPON/WCCON — "whether in port/berth/free pratique/customs cleared or not", the real-world clause bundle that determines WHEN laytime actually starts counting) or the notice period between NOR tender and laytime commencement. Added 4 boolean flags + `notice_period_hours` + `commodity_type`; backfilled realistic values on the 7 existing rows (full WWWW bundle + 6hr notice on the SHEX-family templates) and added an `LNG_SHINC` template (continuous SHINC counting — LNG terminals run 24/7 — plus a BOG-management note).
  3. **`demurrage_dispatch_rate` had no `commodity_type`** despite demurrage rates varying by an order of magnitude between an LNG carrier (~$100k+/day) and a dry-bulk carrier (~$15-20k/day), and was missing two frequently-negotiated real clauses: the **demurrage claim time-bar** (days to submit a claim with full supporting laytime docs before it's contractually barred — BIMCO/Gencon standard is 90 days) and the **despatch basis** (paid on ALL laytime saved vs. WORKING-time saved only — a real, commonly-varied term). Added all three; backfilled the 5 existing oil-tanker rows (`OIL`, 90-day bar, `ALL_TIME_SAVED`) and added new `LNG_CARRIER`/`LNG` and `BULK_CARRIER`/`METALS` rows.
  4. **`vessel` had no dry-bulk stowage attributes** (grain vs. bale capacity — the two figures that determine whether a vessel can lift the contractual metals/agri cargo quantity) **and no LNG boil-off/heel attributes** (guaranteed daily boil-off rate, minimum heel volume retained between voyages). Added all four as nullable columns.
  5. **New reference table `laytime_exception_type`** (11 seeded rows: WEATHER, STRIKE, BREAKDOWN, AWAITING_BERTH, AWAITING_INSTRUCTIONS, HOLIDAY, PORT_CONGESTION, INSPECTION_DELAY, BOG_MANAGEMENT, FORCE_MAJEURE, OTHER) — the standard categories laytime/demurrage calculations and disputes are built around, commodity-agnostic (works identically for oil, LNG, and dry bulk).
  6. **`trade_freight_detail` (the one transactional table that actually captures a fixture) had a free-text `charter_type` enum totally disconnected from the `charter_party_type` master table**, and no link to `laytime_term_template` or fixture-level demurrage/dispatch overrides — meaning the master data above would otherwise be pure decoration, never actually reachable from a real freight trade. Added `charter_party_type_id` + `laytime_term_id` FKs and `demurrage_rate_per_day`/`dispatch_rate_per_day` override columns.
  7. Also fixed **`charter_party_type.standard_form_reference`** for the VOYAGE row to read `'ASBATANKVOY / GENCON / LNGVOY (BIMCO)'` instead of an oil/dry-bulk-only reference, since LNG voyage chartering has its own standard BIMCO form (LNGVOY).
  8. Registered `freight_rate_index`, `laytime_term_template`, `demurrage_dispatch_rate`, `laytime_exception_type` in `master_data_table_registry` (module_group `Freight & Shipping`) — **all 4 previously existed in real SQL (or, for laytime_exception_type, are new) but had ZERO frontend surface**; `freight_rate_index`/`demurrage_dispatch_rate` were `live: false` placeholders in `MasterDataHub.tsx` and `laytime_term_template` was miscategorized under `Contract & Legal` pointing at a non-existent `/contracts/laytime` page. All 4 are now `live: true` under `Freight & Shipping`, routed through the generic `/static-data/<table>` path, with full `TABLE_DEFS` column definitions + `rowSeed` matching the new SQL columns exactly (`referenceData.ts`). `charter_party_type`'s frontend columns also gained `standardFormReference`/`description` (existed in SQL since V8, were never exposed in the UI) and its mock rowSeed expanded from 2 to the full 5 SQL rows (BAREBOAT/COA/WS_VOYAGE were missing).
  9. **Vessel registry (`/logistics/vessels`, a separate dedicated page from the generic Static Data table) enhanced to actually support dry bulk/metals and LNG**: added `BULK_CARRIER` to its `VESSEL_TYPES` (previously absent — this page literally couldn't represent a dry-bulk/metals vessel), added the same 4 new fields (grain/bale capacity, boil-off rate, heel capacity) to `types.ts`/mock seed (`etrmHandlers.ts`)/form, shown conditionally based on selected vessel type. Added a `CAPE ENDURANCE` (`BULK_CARRIER`) seed row and enriched the existing `ENERGY INNOVATOR` (`LNG_CARRIER`) row with boil-off/heel values.
  - Power was deliberately NOT forced into this schema: electricity doesn't move by vessel, so "works for all commodities" for freight/demurrage means oil/LNG/dry-bulk(metals/agri) get first-class support and the schema doesn't hard-code oil-only assumptions — it does not mean fabricating a marine freight concept for power.
  - Flagged, not fixed (pre-existing, out of scope): the frontend `commodity` master table's own `commodityType` enum (`OIL,POWER,GAS,AGRICULTURAL,METALS,OTHER`) still predates the V47 11-value vocabulary (missing LNG/FREIGHT/RINS/ENVIRONMENTAL/MULTI) — the new freight/demurrage `commodity_type` columns use the newer 11-value vocabulary directly (consistent with how V47 already did this for book/desk/gl_account), so this is a pre-existing inconsistency, not a new one.
  - Verified: `tsc -b --noEmit` clean; headless Chrome confirmed all 5 tables render their exact expected row counts with correct data (a first pass double-counted rows by +3 across every table — turned out to be the always-mounted `ApiLogDrawer` table being caught by an unscoped `tr[data-row-key]` selector, not a real bug; rescoped to the actual content table and confirmed exact matches), Hub cards for the 3 newly-live tables render and navigate correctly, and the Vessels page shows the new BULK_CARRIER seed row.
- **Static Data sidebar is now resizable, and the redundant "Credit Hub" page was removed.** Two follow-up UX requests after the V52 re-group:
  1. **Resizable Static Data sidebar.** `Tier2HomePage.tsx`'s left sidebar was a hardcoded `width: 220` — user wanted to widen/narrow it without touching the main `AppShell` sidebar. Added a 6px drag handle on the sidebar's right edge (same ref-based drag pattern as the modal drag handle: `resizingRef`/`resizeStartRef` refs + window-level `mousemove`/`mouseup` listeners registered once on mount), clamped to `180–480px`, persisted to `localStorage` (`staticdata.sidebarWidth`) so it survives reload/navigation. Had to restructure the sidebar's internal layout: the handle must live on a non-scrolling outer wrapper, not the inner `overflowY: auto` div — the handle is positioned `right: -3` (half outside the sidebar box) so if it's a child of the scrolling element, `overflow-y: auto` forces `overflow-x` to also compute to `auto` per the CSS spec, which clips and makes the outer half of the handle unclickable. Fixed by moving `overflowY: auto` down onto a new inner wrapper div, keeping the handle on the outer (non-clipping) container. Verified via headless Chrome: dragged the handle +120px, confirmed the computed width updated live, persisted through `localStorage`, and survived a full page reload. Confirmed no regression to the V52 accordion expand/collapse behavior (per-table group auto-expand, others collapsed) or the modal drag/minimize/maximize feature. `tsc -b --noEmit` clean. (Only Static Data has a real sidebar like this — audited `FieldPermissionsPage.tsx`/`RolesPage.tsx`/other hits on `width: 220` and confirmed those are just table column widths, not sidebars, so nothing else needed this treatment.)
  2. **Removed the standalone "Credit Hub" page** (`/credit`, `CreditHub.tsx`) — it only listed 3 cards (Margin Agreements, Credit Limits, Letters of Credit) that already exist as individually-routable items both in the main nav's "Credit & Risk" submenu and in the Master Data Hub's "Credit & Collateral" group (10 entries). User's call: the Master Data Hub is the one hub that should exist for this; a second, narrower hub page for the same items was redundant. Deleted `CreditHub.tsx`, removed its lazy import/route from `AppRouter.tsx` (the bare `/credit` path now `<Navigate to="/master-data" replace />` for any old bookmarks/links), and removed the "Credit Hub" entry from `AppShell.tsx`'s `g-credit` nav group (the 3 individual item links remain directly in the nav, unchanged). Verified via headless Chrome: visiting `/credit` redirects to `/master-data`; nav no longer shows "Credit Hub" but still shows "Margin Agreements" etc. `tsc -b --noEmit` clean.
- **V52 — Re-grouped Static Data to match the Master Data Hub, and fixed sidebar expand/collapse.** The user reported Static Data's grouping/expand behavior was "still not good" and that clicking a related card in the Hub didn't sensibly expand/collapse the Static Data sidebar. Root causes and fixes:
  1. **Static Data's sidebar groups (`moduleGroup`) had drifted completely out of sync with the Hub's own 15 group names.** Static Data used its own terse, independent scheme (`Trade`, `Reference`, `Commercial`, `Counterparty`, `Organisation`, `Power`, `Freight`, `Products`, `Logistics`, `Credit & Risk`) where `Trade` and `Reference` had become giant miscellaneous buckets (`Trade` mixed genuine trade-mechanics tables with unrelated commodity-classification codes like crude grades/metal shapes/gas day types; `Reference` mixed environmental/RIN/GL/tax/pricing/UOM codes together). Meanwhile the Hub already had clean, well-scoped groups (`Organization & Users`, `Counterparties & Agreements`, `Credit & Collateral`, `Products & Markets`, `Contract & Legal`, `Logistics & Delivery`, `Freight & Shipping`, `Power & Energy`, `Pricing & Rates`, `Finance & Settlement`, `Carbon & Environmental`, etc.) — so a Hub card and its Static Data destination often landed in *differently-named* groups, which is why the "right" sidebar group never appeared to expand in any recognizable way. Fixed by re-mapping every one of the ~60 Static Data tables' `moduleGroup`/`group` value (`referenceData.ts`: both `registrySeed` and `PARENT_LOOKUP_TABLES`) onto the Hub's exact group names — e.g. `deal_type`/`crude_grade_type`/`instrument_type`/etc. moved from the `Trade` catch-all into `Products & Markets`; `currency`/`gl_account_type`/`uom_type` moved from `Reference` into `Finance & Settlement`; `credit_rating`/`address_type`/`bank_account_type` moved into `Counterparties & Agreements`; full mapping is in `regroup.py` logic, not persisted as a script. `Tier2HomePage.tsx`'s `GROUP_ORDER` was rewritten to the same 12 names in the same order as the Hub's `GROUPS` array.
  2. **New migration V52** (`52_master_data_registry_regroup.sql` / `V52__master_data_registry_regroup.sql`) applies the same re-group as data-only `UPDATE`s to the real `dbo.master_data_table_registry.module_group` column — but only for the 25 rows that actually exist there (from V14 + V17 + V51). The frontend mock's other ~35 `PARENT_LOOKUP_TABLES` entries (crude grades, RIN types, credit limit types, etc.) were never inserted into the real SQL registry at all — a pre-existing mock-ahead-of-backend gap, out of scope here, only the mock-side grouping needed fixing for those.
  3. **Two Hub groups had confusingly overlapping names**: `Risk & Compliance` (Countries, sanctions, REMIT/EMIR/CFTC reporting) vs. `Regulatory Compliance` (RINs/EPA renewable-fuel compliance) — renamed to `Sanctions & Regulatory Reporting` and `RIN & Renewable Fuels` respectively in `MasterDataHub.tsx`, with the matching Static Data `moduleGroup` for `rin_transaction_type`/`rin_obligation_status` updated to `RIN & Renewable Fuels` (mock-only; these two aren't in the real SQL registry either).
  4. **Sidebar expand/collapse behavior rewritten** in `Tier2HomePage.tsx`: previously every group started expanded and stayed that way — clicking a Hub card never collapsed anything. Now: (a) whenever the selected table changes (including landing here via a Hub card click), every group *other than* the newly-selected table's group collapses to just its header, and with nothing selected every group starts collapsed; (b) manually clicking a group header is now a single-open accordion (expanding one collapses all others), matching the main `AppShell` sidebar's existing accordion convention. Implemented as a derived-state adjustment during render (an `autoKey`/`lastAutoKey` comparison, React's documented "reset state when a prop changes" pattern) rather than a `useEffect` + `setCollapsed`, because the latter tripped the project's `react-hooks/set-state-in-effect` diagnostic. Verified with headless Chrome: clicking "Deal Types" on the Hub landed on `/static-data/deal_type` with only `Products & Markets` expanded (confirmed via the sidebar DOM directly, not page-wide text, since the selected table's own name is always present in the right-hand content panel too) and `Organization & Users`'s items (e.g. "Contact Roles") not rendered; manually clicking the "Power & Energy" header then collapsed `Products & Markets` and expanded only `Power & Energy`. `tsc -b --noEmit` clean throughout.
- **New Static Data / master data rows now default to Active.** Added `initialValues={{ isActive: true }}` to the `Form` in `ReferenceDataTable.tsx` — the one generic component behind all ~120 Tier 2 Static Data tables — so the Active switch starts checked on every new row across every one of those tables (edit still loads the row's real value via `setFieldsValue`, unaffected). Before making this change, audited all ~50 dedicated (non-generic) master-data feature pages (Currencies, Incoterms, Countries, Markets, Products, Desks, Books, Traders, Brokers, credit/contracts/environmental/logistics/rins pages, counterparty child sections, etc.) and found they already default `isActive: true` on their own create forms via explicit `form.setFieldsValue(...)` — so this was a real gap only in the generic Tier 2 path, not an app-wide pattern that needed replicating. Verified with a headless-Chrome pass across four Static Data tables that have *multiple* boolean columns (`energy_footprint`, `load_shape_template`, `energy_footprint_site`, `balancing_authority`) — specifically checking the switch under the "Active" label (not just the first switch on the form, which for these tables is a different, unrelated boolean like `isComposite`/`isAggregatedDispatch`) — all four came back checked by default. `tsc -b --noEmit` clean.
- **Added move / minimize / maximize to the Static Data capture modal** (`ReferenceDataTable.tsx` — the one generic component behind all ~120 Tier 2 tables, so this covers every Static Data page automatically). The modal's title bar is now a drag handle (manual mouse-event drag, no new dependency: `draggingRef`/`dragStartRef` refs + a `dragPos` state applied via `modalRender`'s wrapper `transform: translate()` — window-level `mousemove`/`mouseup` listeners registered once on mount, not re-bound per drag, to avoid a listener-leak from stale closures), plus two title-bar icon buttons: minimize (hides the modal via the `modalRender` wrapper's `display:none` while `open` stays `true`, so the `Form` instance is never unmounted/destroyed — data survives; a small floating bottom-right chip appears to restore it) and maximize (toggles `width`/`styles.content`/`styles.body` to near-fullscreen, reset on restore). All three reset to default (centered, normal size, not minimized) whenever a fresh Add/Edit is opened. Verified end-to-end with a headless-Chrome pass against the real dev server: dragged the modal and read back the actual computed CSS matrix, toggled maximize/restore and checked width, minimized/restored and confirmed a typed value survived intact throughout. (Two rounds of the verification script itself were wrong first — querying `.ant-modal` instead of the nested `modalRender` wrapper for the drag transform, and typing non-numeric text into a numeric `InputNumber` field, which antd correctly clears on blur regardless of this feature — worth remembering before trusting a "bug" surfaced by a Puppeteer script rather than the app itself.) `tsc -b --noEmit` clean.
- **Fixed two app-wide bugs the user hit while using Master Data / Static Data: form-value bleed between tables, and unscrollable modals.** Both verified with a headless-Chrome click-through against the real dev server (not just `tsc`), including simulated mouse-wheel scroll — see below.
  1. **Form data bled from one Static Data table's Add form into the next table's Add form.** Root cause: `Tier2HomePage.tsx` renders `<ReferenceDataTable table={activeTable} />` with no `key` prop, and the route is `/static-data/:tableName` — React Router re-renders the *same* component instance across param changes rather than unmounting it, so `ReferenceDataTable`'s `form`/`modalOpen`/`editingId` state (declared once via `useState`/`Form.useForm()`) survived the "navigation" to a different table. Fixed with `key={activeTable.tableName}` on the component (`Tier2HomePage.tsx:213`), forcing a clean remount — and therefore a clean form — every time the table changes. Verified: typed a marker value into `load_shape_interval`'s Add modal, navigated to `energy_footprint` without saving, opened its Add modal — fields are empty.
  2. **Modals with enough fields to overflow the viewport (e.g. `energy_footprint_site`, 12 fields) couldn't be scrolled at all** — not by the page, not by the modal. Root cause: last session's Drawer/Modal-blocks-sidebar fix set `.ant-modal-wrap { pointer-events: none }` globally (`index.css`) so clicks pass through to the sidebar. But `.ant-modal-wrap` is also the element antd normally scrolls when modal content overflows the viewport — `pointer-events: none` removes it from wheel-event hit-testing entirely, so the wheel event passes straight through to whatever's behind the modal instead of scrolling it. Fixed by giving the modal box itself (which keeps `pointer-events: auto`) a bounded height and its own internal scroll region: `.ant-modal` gets `max-height: calc(100vh - 64px)`, `.ant-modal-content` gets the *same concrete `calc()`* (not `max-height: 100%` — percentage heights don't resolve against a parent that only has `max-height`, not a definite `height`, so that was tried first and silently no-opped), laid out as a flex column, and `.ant-modal-body` gets `flex: 1 1 auto; overflow-y: auto`. Header/footer stay put; only the body scrolls. This affects every `<Modal mask={false}>` in the app (7 files: `ReferenceDataTable.tsx`, `RolesPage.tsx`, `ProductsPage.tsx`, `LegalEntityUploadReviewModal.tsx`, and the counterparty child-record `ContactsSection`/`AddressesSection`/`ChildRecordSection`), not just Static Data — all get the fix for free since it's a global CSS rule. `Drawer`s were never affected (no equivalent full-viewport wrap div). `tsc -b --noEmit` clean.
- **Master data audit — fixed a pre-existing gap in the frontend `balancing_authority`/`transmission_zone` mock seed surfaced by V51.** The real SQL schema (V11) seeds 7 balancing authorities (PJM, ERCOT, CAISO, MISO, NYISO, NGESO, TENNET) and 6 transmission zones, but `referenceData.ts`'s mock only ever had 2 BAs (PJM, ERCOT) and 2 zones — so the V51 `energy_footprint` mock rows had to null out `balancingAuthorityId`/`defaultZoneId` instead of linking `SOLAR_CA_01`→CAISO / `EVNET_GB_01`→NGESO the way the real SQL seed does. Added the missing 5 BAs (ids 3–7) and 4 zones (ids 3–6, including NGESO's `GSP_A`/`GSP_B`), then wired the two footprint mock rows to their correct BA ids. Verified no other mock row referenced the renumbered zone ids before changing them. `tsc -b --noEmit` clean. Rest of the master-data audit (registry parity across V43–V51, dual SQL-file parity, FK integrity in V51's new tables) checked out — the only other things not wired to a live UI page are `generation_asset`/`interconnector`, which are pre-existing `live: false` placeholders (part of a long-standing ~36-entry backlog of planned-but-unbuilt Tier 2/3 pages across the whole hub, not something dropped this session).
- **V51 — Power master data: nested load shape structure + distributed energy footprints.** Closes two gaps the user flagged in the V11 power schema. (1) Nested shapes: `load_shape_template` gained `interval_minutes` (60/30/15) + `is_composite`; new `load_shape_interval` (per-interval MW weight under a shape, keyed by day_type + 0-based interval_no — expresses solar bell curves, EV overnight-charging curves) and `load_shape_component` (recursive shape-of-shapes: parent composed of weighted children, optional month_from/month_to seasonal window with winter wrap; seed: ATC_US = PEAK_US + OFFPEAK_US). (2) Footprints: new `energy_footprint` (SOLAR_PORTFOLIO / WIND_PORTFOLIO / EV_CHARGING_NETWORK / BATTERY_FLEET / DEMAND_RESPONSE / MICROGRID / HYBRID, flow_direction GENERATION/LOAD/BIDIRECTIONAL, owner/operator CPs, BA, default zone/shape, aggregated-dispatch flag) and `energy_footprint_site` (member sites: location, zone override, capacity_mw, storage MWh, EV charger_count/max_charger_kw/connector_standard CCS/CHADEMO/NACS/TYPE2/MIXED, technology, optional generation_asset_id link, per-site shape override). All four registered in `master_data_table_registry` (SQL) and in the frontend: `SPECIAL_TABLE_METADATA` + `registrySeed` (ids 201–204, above the 10+i parent-lookup block) + `rowSeed` in `referenceData.ts`, plus four live Master Data hub cards in `MasterDataHub.tsx` (Power & Energy group, `/static-data/<table>` routes served by the generic reference-data handlers automatically). `tsc -b --noEmit` clean. Deliberately master-data-only: linking `trade_power_detail` to an `energy_footprint` (PPA source, alongside the existing `source_generation_asset_id`) is a flagged follow-up. Browser-level verification of the four new pages was not completed this session (headless Chrome run was killed) — worth a quick manual click-through of the four hub cards.
- **V50 — GL Account enhancements.** The chart of accounts (`dbo.gl_account`) was missing every link a real COA needs: `legal_entity_id` (booking company — nullable, NULL = shared/corporate account across all entities, same convention as `commodity_type`), `book_id` (portfolio/P&L attribution — nullable), `parent_account_id` (self-referencing FK for hierarchy/rollups), `normal_balance` (DEBIT/CREDIT), `currency_code`, `external_gl_code` (mapping to the real ERP/GL system of record — SAP/Oracle — since this ETRM doesn't post its own GL), and `is_control_account`. `GlAccountsPage.tsx` gained Select fields for all of the above (Legal Entity/Book/Parent Account pull from the real master-data hooks). MSW `computeGlAccount()` denormalizes `legalEntityCode`/`bookCode`/`parentAccountCode` server-side on create/update, same pattern as `computeCreditLimit`.
- **App renamed placeholder: SmartETRM → NonameETRM.** User wants a different product name, hasn't decided yet — "NonameETRM" is a deliberate placeholder (header logo, docs, seed data) until they pick one. Repo folder name and npm package name (`etrm-frontend`) were deliberately left untouched (internal identifiers, not user-facing).
- **Minimize-panel / draft-resume actually fixed** (previous session's "still not working" item — root-caused and resolved, not just re-described). Two independent bugs, both app-wide:
  1. **Drawers and Modals were blocking sidebar navigation entirely.** Antd's `Drawer`/`Modal` render a full-viewport backdrop; even sized to only cover the content area, clicking the sidebar while one was open hit the backdrop, which silently closed the panel (discarding in-progress edits) instead of navigating. Fixed with `mask={false}` on all 46 `Drawer` and 7 `Modal` capture-form instances app-wide. Modal needed a second fix on top: unlike Drawer, its `.ant-modal-wrap` wrapper still spans and intercepts the full viewport even with the mask hidden — a global CSS rule in `index.css` (`.ant-modal-wrap { pointer-events: none } .ant-modal-wrap .ant-modal { pointer-events: auto }`) punches through it. No other `Modal.confirm()`-style dialogs exist in the app, so this global rule is safe.
  2. **Restore was silently auto-firing on every page visit** (not opt-in), which hijacked the page every time you landed on it and blocked opening a *different* existing record until you dealt with the old draft — and a follow-up bug in the same fix caused dormant (un-resumed) drafts to be wiped by React StrictMode's dev-only double-effect-invoke the moment the page merely remounted. `src/components/smart/formDraft.ts` was rewritten: restore now only fires via an explicit pin click (`MinimizedDraftsDock.tsx`, new component, mounted in `AppShell` — a persistent bottom-left dock of pinned in-progress drafts across the whole app), drafts are per-*record* (minimizing a new item and, separately, an edit of an existing one now keep two independent pins instead of one clobbering the other — id scheme `key:new` / `key:edit:<snapshot>`), and the reset-on-restore now clears the form before applying stashed values (was previously leaving stale fields from whatever the user had looked at in between).
  3. **New `usePageFormDraft` hook** for routed (non-drawer) capture pages — `CounterpartyFormPage` (`/tier1/counterparty/:id`) is the first user; needs an explicit `activeRef` flipped to `false` on Cancel/Save (mirrors a drawer's `setOpen(false)`) since a routed page has no open/closed concept to gate the stash-on-unmount.
  4. **Extended draft-resume to pages that never had it**: `GuaranteeFormDrawer` (nested inside Counterparty/Legal Entity), `RolesPage`'s create/edit role modal, and `ReferenceDataTable` (covers every Static Data / Tier 2 table generically via a per-table-name key + dynamic route).
  5. **StrictMode gotcha worth remembering**: the `useDraftValues`/`useDraftState` "child owns the form, parent owns open/editing" split has a `skipResetRef` flag whose owning reset-effect can fire 3 times around one restore (two StrictMode phantom invokes while `open` is still stale, then a third genuine one once the parent's `setOpen(true)` actually commits) — the flag must only be cleared by the consuming effect when it observes `open === true`, never on a bare timer or unconditionally, or the third occurrence wipes the just-restored values. See the doc comment on `useDraftValues` in `formDraft.ts`.
  6. All 46 `Drawer`s and 7 `Modal`s also gained `forceRender` — without it, a restore's `form.setFieldsValue()` can fire before the panel's `Form.Item`s have ever mounted (antd lazy-renders closed panel content by default), silently no-op'ing.
- **Uniform `AppDatePicker` component** (`src/components/smart/AppDatePicker.tsx`) — the one date field for the whole app now, format `YYYY-MM-DD`, full width, typeable + calendar. Replaced ~30 files' worth of inconsistent date UI: 9 places using bare antd `DatePicker` (inconsistent format/width), and a larger set of plain `Input` fields with a date-shaped placeholder and no calendar at all (`TradeBlotter` alone had a dozen — trade date, execution time, RFP dates, risk period, and every commodity-detail sub-object's laycan/delivery/pricing dates). Each conversion included fixing the load (`dayjs(isoString)`) and submit (`.format('YYYY-MM-DD')`) boundary since the field's runtime value changes from a plain string to a dayjs object. **Convention going forward: always use `<AppDatePicker />`, never bare `<DatePicker>` or `<Input>` with a date placeholder, for any new date field.**
- **V49 — Credit Limit module expansion.** `dbo.credit_limit` gained 22 columns (commodity scope, DIRECT/ALLOCATED basis + `parent_limit_id` group hierarchy, country risk, credit analyst assignment, review cycle with auto-derived next-review-date, collateral offset, temp uplift, tenor cap, warning/critical thresholds, breach action, internal/counterparty alerting). New tables `credit_limit_line_item` (instrument-class sub-limits: PHYSICAL/FUTURES/FORWARDS/SWAPS/OPTIONS/STORAGE_TRANSPORT) and `credit_limit_alert` (event log with ack tracking). `CreditLimitsPage.tsx` fully rebuilt — two-column drawer, sub-limits `Form.List`, alert timeline. MSW `computeCreditLimit()` denormalizes CP/analyst and computes availableAmount/utilisationPct/limitIndicator server-side.
- **App-wide Save/Save&Close** (draft-resume behavior itself is described above, now fixed). Every capture form in the app (47+ pages) has two save actions — **Save** (persists, drawer stays open, a create switches to edit mode) and **Save & Close** (closes).
- **Sidebar restructured** — hub groups (Master Data, Credit & Risk, Pricing, Operations, Regulatory, Environmental, Admin) collapse to accordion submenus, all closed by default, auto-opening the group for the current route. Finance folded into Master Data group.
- **Trade Blotter UI** — drawers now full-width (`calc(100vw - sidebar)`) instead of fixed 780px; both Trade and Leg drawers restructured into two-column layouts (identification/classification left, counterparty/broker/credit right for Trade; product/pricing/delivery left, commodity detail right for Leg).
- **V48 — special_reference replaces special_contract_flag.** A special contract is a text reference (side letter / bespoke clause), not a boolean. `Trade.specialReference: string | null`, NVARCHAR(180), with a counted Input in the Contract Controls row.
- **V47 — storage type canonicalization + commodity type extension.** `storage_facility.facility_type` legacy 8 codes remapped to the canonical 14-code frontend vocabulary (TANK→TANK_FARM, CAVERN→SALT_CAVERN, etc). `commodity_type` CHECK on book/desk/gl_account/trader_commodity_limit widened from 7 to 11 values (added LNG, FREIGHT, RINS, ENVIRONMENTAL) — desks/books can now be classified for every tradeable commodity, not just the original 5.
- **V46 — physical leg enrichments.** `trade_order` gained `origin_country_code` (sanctions screening), demurrage/laytime fields (rate, currency, basis REVERSIBLE/NON_REVERSIBLE/AVERAGED, allowed laytime, despatch rate), and a new `trade_order_price_adjustment` table (API gravity, density, heat content, sulfur, protein, moisture, TC/RC, quality prem/disc, tax, markup, FX differential — 15 types). Wired into `PriceAdjustmentsSection` and `DemurrageSection` on physical legs only (OIL/LNG/AGRI/METALS with vessel transport).
- **V45 — commodity↔instrument-type map moved server-side.** Previously hardcoded in `trade/types.ts`; now `dbo.commodity_instrument_type_config` + `GET /commodity-instrument-map`, fetched via `useCommodityInstrumentMap()` with `staleTime: Infinity`. Vendor/DBA controls which instrument types are valid per commodity via SQL migration only — no UI to edit it. This was a deliberate design choice per user request ("don't hardcode, let vendor add via SQL").
- **V44 — instrument types + deal detail tables.** `Trade.instrumentType`: PHYSICAL, CERTIFICATE_TRANSFER, FUTURES, FORWARD, SWAP_FIXED_FLOAT, SWAP_FLOAT_FLOAT, OPTION_LISTED/OTC_AMERICAN/OTC_ASIAN/OTC_EUROPEAN, STORAGE_AGREEMENT, TRANSPORT_AGREEMENT. Four new leg-level detail tables (`trade_swap_detail`, `trade_option_detail`, `trade_storage_agreement_detail`, `trade_transport_agreement_detail`), each `order_id FK → trade_order ON DELETE CASCADE`, columns matching their TS interfaces exactly. Added RINS + ENVIRONMENTAL commodity types with `rinDetail`/`environmentalDetail` sections (RINs are electronic EPA EMTS certificates — never PHYSICAL; correct term is CERTIFICATE_TRANSFER). CERTIFICATE added to MOT_TYPES.

**Open items flagged by user, not yet resolved:**
1. Product name still undecided — "NonameETRM" is a placeholder; rename again once the user picks a real name (see `MEMORY.md` grep-list in the session recap above for where the name appears).
2. Minor known limitation: the nested `GuaranteeFormDrawer`'s local UI toggle state (guarantor/principal/beneficiary party-type selectors) isn't captured by `useDraftValues`'s restore (only `extra`/`onRestore`-equipped `useFormDraft` supports that) — restoring a minimized guarantee draft repopulates the actual form fields correctly but the party-type Segmented controls reset to their defaults, which can visually mismatch until the user touches them. Low priority (deeply nested, rarely-minimized form).
3. Minor known limitation: a minimized `GuaranteeFormDrawer` draft's dock pin always routes back to `/tier1/legal-entity` (its `DRAFT_META` entry is static) even when it was actually minimized from within a Counterparty's Guarantees tab (`/tier1/counterparty/:id`) — `CounterpartyFormPage` didn't have per-entry dynamic routing plumbed through to this specific nested child. Low priority.
4. Pre-existing bug found but NOT fixed (out of scope for the GL Account work that surfaced it): `DesksPage.tsx`'s "Legal Entity" column reads `field: 'legalEntityCode'`, but `desksStore` mock rows in `etrmHandlers.ts` never had that field populated (only `legalEntityId`) — the column renders blank. `BooksPage`/`TradersPage` are fine (their seed rows do bake in `legalEntityCode`, and it's now correct post-fix above). Needs the same denormalization `computeGlAccount` uses, or just adding the field to the seed rows.
5. No other open items as of this doc update.

**Key architecture notes worth re-deriving-avoidance:**
- `lookup_value` table schema (V1) is `(lookup_id, category, code, display_name, sort_order, is_active, notes)` — NOT `(table_name, type_code, type_name, description)`. Several early migrations (V36–V38) had this wrong and were corrected in-place this session.
- MSW denormalization: POST/PUT handlers for trades and credit limits must be registered *before* the generic `crudHandlers(...)` spread, since MSW matches routes in registration order — the custom handler intercepts first.
- Two-column drawer pattern (TradeBlotter, CreditLimitsPage) is now the house style for any capture form with >15 fields: `<Row gutter={28}><Col span={12} style={{borderRight:'1px solid rgba(125,125,125,0.15)'}}>...</Col><Col span={12}>...</Col></Row>`.

---

---

## 1. Project Overview

Enterprise multi-commodity Energy Trading & Risk Management (ETRM) system built from scratch. Covers Oil & Petroleum, Power & Gas, Agricultural, and Metals & Mining.

**Core strategy:** Design for all commodities, implement Oil first. The architecture is commodity-agnostic at its core — commodity-specific logic lives in extension/plugin modules. This is non-negotiable and must be enforced at every architecture decision.

**Team:** Small dev team (2–5 developers) + 5–10 domain experts across all commodity types.

**Estimated timeline:** 14–20 months to full production with domain experts embedded from day one.

---

## 2. Technology Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Backend framework | Spring Boot | 3.3.x | Java 21 LTS, virtual threads |
| ORM | Spring Data JPA + Hibernate | 6.x | Native SQL for complex reporting |
| Security | Spring Security + JWT | 6.x | RS256, 15-min access tokens |
| API docs | SpringDoc OpenAPI | 2.x | Auto-generated REST docs |
| Build | Maven | 3.9.x | |
| Logging | SLF4J + Logback → ELK | Latest | Structured JSON logs |
| Quant engine | Python + FastAPI | 3.11 / 0.111.x | Internal REST, stateless |
| Numerical | NumPy + SciPy + Pandas | Latest | Curve interpolation, stats |
| Quant library | QuantLib-Python | 1.34 | Industry-standard pricing primitives |
| Frontend | React + TypeScript | 18.x / 5.x | |
| State management | Zustand | Latest | RTK if complexity grows |
| UI library | Ant Design | 5.x | Enterprise data tables/forms |
| Data grid | AG Grid | Community/Enterprise | Trade blotter, 100k+ rows |
| Charts | Recharts + D3.js | Latest | Curve viz, P&L, risk heat maps |
| API client | React Query (TanStack) | 5.x | Caching, polling, optimistic updates |
| Build tool | Vite | 5.x | |
| Database | SQL Server | 2022 | |
| Migrations | Flyway | Latest | Schema as code |
| Audit | SQL Server Temporal Tables | — | Auto-historised, no app code needed |

**API style:** REST only (JSON). Versioned via URL path (/v1/). RFC 7807 error format.

**Spring → Python communication:** Internal REST/HTTP calls. Python never initiates calls to Spring. Python is a pure calculation service — stateless, no direct DB access.

**Deployment target:** Not yet decided — architecture is deployment-agnostic (Azure/AWS/GCP/on-premise). Terraform from day one regardless.

---

## 3. Architecture Overview

```
React 18 + TypeScript (UI)
        ↓ REST/JSON HTTPS JWT
Spring Boot 3.x (API Gateway + Business Services)
        ↓ Internal REST          ↓ JDBC/JPA
Python FastAPI (Quant Engine)    SQL Server 2022
```

**Multi-entity / multi-book:** Every trade traces through book → legal entity. Full P&L segregation per company, per book, per desk.

**Commodity-agnostic core + commodity plugin modules:**
```
CORE (shared by all commodities)
├── Trade lifecycle engine
├── Counterparty & entity model
├── Pricing & curve framework
├── Position & risk engine
├── Settlement & invoicing
└── Reporting & audit

COMMODITY MODULES (plug in one at a time)
├── Oil & Petroleum ← implement first
├── Power & Gas     ← second
├── Agricultural    ← third
└── Metals & Mining ← fourth
```

---

## 4. Database Schema — Complete Table Inventory

**Base schema: 116 tables across 9 legacy scripts; extended by V28–V35 Flyway migrations (see §13)**

### Script 1: Master Data v2.0 (42 tables)
`etrm_master_data_v2.0.sql`

**GROUP 1 — Pure reference**
- `lookup_value` — generic key-value store for all system picklists
- `currency` — ISO 4217 currency reference (seeded: 12 currencies)
- `commodity` — top-level commodity classification (seeded: 5 commodities)
- `unit_of_measure` — all units across all commodities (seeded: 14 UOMs)
- `location_type` — location classifications (seeded: 11 types)
- `credit_rating` — S&P + internal ratings (seeded: 22 ratings)
- `incoterm` — ICC Incoterms 2020 (seeded: 11 terms)
- `pricing_type` — FLAT, INDEX, DIFFERENTIAL, FORMULA, FLOATING, TBN
- `price_index` — benchmark references (Dated Brent, WTI, TTF etc.)
- `holiday_calendar` — settlement/trading calendars (seeded: 9 calendars)

**GROUP 2 — Polymorphic shared (entity_type + entity_id pattern)**
- `address` — covers legal_entity, counterparty, location, storage_facility, contact
- `tax_registration` — VAT, GST, EIN, UTR etc. covers legal_entity, counterparty
- `bank_account` — SETTLEMENT, COLLATERAL, FEE accounts for legal_entity, counterparty
- `contact` — covers legal_entity and counterparty

**GROUP 3 — Organisation**
- `legal_entity` — internal trading companies (temporal table, self-ref for group hierarchy)
- `app_user` — all system users (temporal table)
- `user_role` — time-bounded RBAC role assignments
- `desk` — trading desks within legal entity
- `book` — trading books, P&L segregation unit (temporal table)

**GROUP 4 — Counterparty**
- `counterparty` — external trading counterparties (temporal table)
- `netting_agreement` — ISDA/EFET master netting agreements
- `cp_legal_entity_link` — authorised trading pairs with per-pair credit limits

**GROUP 5 — Commodity & product**
- `commodity` — top-level commodity (OIL, GAS, POWER, METALS, AGRICULTURAL). Added V23: `commodity_subtype` (23 enum values), `default_uom_id`, `default_currency_id`
- `product` — tradeable products. Added V23: `grade_code`, `product_family` (17 families), `bloomberg_ticker`, `reuters_ric`, `platts_code`, `is_exchange_traded`, `is_otc`. Added V24: `is_blend BIT`, `blend_notes VARCHAR(500)`. Added V25: 7 pricing basis fields — `density_estimate_kg_m3` / `density_base_kg_m3` (OIL BBL↔MT), `cv_gross_mj_scm` / `cv_net_mj_scm` (GAS vol↔energy), `purity_basis_pct` (METALS grade), `moisture_basis_pct` / `protein_basis_pct` (AGRI quality adjustments)
- `product_blend_component` — (V24) M:M bridge for blended products; stores min/target/max/tolerance % per component
- `product_spec_template` — (V4 schema, V24 seeded) named quality spec per product, linked to issuing body and standard reference
- `product_spec_value` — (V4 schema, V24 seeded) parameter bounds (min/max/typical/exact) within a spec template
- `spec_parameter` — (V4 schema, V24 added 13 new rows, V25 added 24 more) complete catalogue of measurable quality parameters across all commodity types: OIL (28 params incl. TAN, CCR, WAX, asphaltene, ULSD-specific), GAS (16 incl. composition + energy), METALS (11 incl. LME purity, impurity limits), AGRICULTURAL (12 incl. moisture, protein, starch, oil content), POWER (5 incl. CO₂ intensity, renewable cert)
- `uom_conversion` — explicit conversion factors between any two units. V25 seeded 29 rows: universal weight (MT↔KG, MT↔LB), precious metals (Troy Oz↔KG/MT), OIL volume (BBL↔GAL, BBL↔CBM, BBL↔MT defaults), GAS energy (MWH↔MMBTU/GJ/THERM, SCM↔MWH/MMBTU), POWER (GWH↔MWH), AGRI (BUSHEL↔MT). Product-level density/GCV fields override default commodity-level factors
- `product_price_index` — M:M bridge: products ↔ price indices with `role` (PRIMARY_MTM / SETTLEMENT / BACKUP / REFERENCE) and `is_primary` flag

**GROUP 6 — Commercial terms**
- `payment_term` — redesigned V22: `term_code`, `base_date_event` (11 values), `month_offset`, `offset_days`, `fixed_day_of_month`, `business_day_convention` (5 values), `holiday_calendar_id`, `discount_days`, `discount_pct`, `payment_method`, `invoice_lead_days`, `is_default`. Seeded: 20 commodity-representative terms
- `credit_term` — credit period, collateral, netting (seeded: 8 terms)
- `gtc` — master General Terms & Conditions
- `gtc_version` — versioned GTC documents
- `cp_commercial_terms` — default payment/credit terms per counterparty/entity pair
- `cp_gtc_agreement` — signed GTC per counterparty

**GROUP 7 — Location & geography**
- `location` — ports, hubs, grid nodes, warehouses
- `pipeline` — pipeline infrastructure (thin version — replaced in later script)
- `storage_facility` — tanks, warehouses, LNG terminals
- `cp_location` — counterparty ↔ location operating roles

**GROUP 8 — Currency & calendar**
- `fx_rate` — daily FX rates
- `holiday` — individual holiday dates per calendar
- `settlement_calendar` — product ↔ calendar links

**GROUP 9 — System & audit**
- `audit_log` — immutable application-level audit (partitioned by date)
- `document_store` — document metadata (files in blob/S3/NAS)
- `system_config` — key-value config store (seeded: 10 defaults)

---

### Script 2: Trader Patch v2.1 (2 tables)
`etrm_trader_patch_v2.1.sql`

Replaces flat trader table — splits into person identity and commodity-specific limits.

- `trader` — who the person is: identity, desk, global approver (temporal table)
- `trader_commodity_limit` — limits per commodity, fully independent per trader. One row per trader per commodity (OIL and POWER get separate rows with different limits, different approvers). Temporal table.

**Key design:** A trader authorised for OIL and POWER gets two `trader_commodity_limit` rows — completely independent daily limits, position limits, tenor limits, and approvers per commodity.

---

### Script 3: Market / Price Source / Period (11 tables)
`etrm_market_source_period_v1.0.sql`

- `exchange` — ICE, NYMEX, LME, EEX, CBOT, SGX, ICAP, Tradition (seeded: 9)
- `market` — individual trading markets (exchange or OTC)
- `market_hours` — open/close per day per market with session types
- `market_holiday_calendar` — market ↔ calendar links
- `market_product` — products tradeable on each market with market-specific overrides
- `price_source` — Platts, Argus, Bloomberg, ICE Data etc. (seeded: 10 sources)
- `price_index_source` — which source serves which index with role (PRIMARY_MTM, SETTLEMENT, BACKUP)
- `market_product_source` — which source serves which product on which market
- `period` — unified trading + risk period table (seeded: rolling + concrete 2026–2031)
- `market_product_period` — valid periods per market/product
- `period_mapping` — hierarchical period decomposition (Cal→12 months, Q→3 months)

---

### Script 4: MPP Dates Patch v1.1 (ALTER TABLE only)
`etrm_mpp_dates_patch_v1.1.sql`

Adds to `market_product_period`:
- Concrete dates: `last_trading_date`, `first_notice_date`, `settlement_price_date`, `delivery_start_date`, `delivery_end_date`, `expiry_date`, `cash_settlement_date`
- Offset rules: `ltd_offset_days/type`, `fnd_offset_days/type`, `settlement_offset_days/type`, `offset_calendar_id`, `ltd_reference_date_rule`

---

### Script 5: Product Spec / MOT / Pipeline (29 tables)
`etrm_product_spec_mot_pipeline_v1.0.sql`

**GROUP A — Product specifications**
- `spec_parameter` — measurable quality parameters per commodity (seeded: 37 params across Oil/Gas/Agri/Metals/Power)
- `spec_parameter_uom` — valid UOMs per parameter
- `product_spec_template` — named specification per product (e.g. "North Sea Forties Standard")
- `product_spec_value` — min/max/typical values per parameter per template (Option A: separate columns)
- `spec_override` — polymorphic tighter specs for pipeline/vessel/tank/location

**GROUP B — MOT core**
- `mot_type` — VESSEL, BARGE, PIPELINE, TRUCK, RAILCAR, ISO_CONTAINER, FLEXIBAG, WAREHOUSE_TRANSFER, BOOK_TRANSFER (seeded: 9)
- `transport_operator` — shipping lines, hauliers, rail operators, TSOs
- `transport_route` — generic origin → destination for any MOT type
- `transport_document_type` — BOL, CMR, rail waybill, pipeline ticket etc. (seeded: 16 types)

**GROUP C — Vessel**
- `vessel` — IMO number, type (VLCC/Suezmax/Aframax/LNG Carrier etc.), vetting status
- `vessel_certificate` — SIRE, CDI, P&I, hull, class, MARPOL, RightShip

**GROUP D — Land transport**
- `truck` — registration, ADR certification, capacity
- `railcar` — DOT classification, approved commodities, cert expiry
- `container` — ISO tank, flexibag, CSC plate

**GROUP E — Storage & tanks**
- `tank` — individual tank within facility: type (fixed roof/floating roof/cryogenic etc.), capacity, status
- `tank_calibration` — strapping tables (height → volume), innage/ullage
- `tank_status` — operational status history log

**GROUP F — Inspection**
- `inspection_type` — SIRE, CDI, API_653, DOT, ADR, CSC etc. (seeded: 12)
- `inspection` — polymorphic: covers vessel, truck, railcar, container, tank, pipeline

**GROUP G — Pipeline (full version replaces thin v1)**
- `pipeline` — full: type, commodity, TSO code, regulatory body, flow direction, fungibility, batch scheduling
- `pipeline_point` — entry/exit/interconnect/storage_link/metering/compressor points
- `pipeline_segment` — segments between points, capacity per segment, outage status
- `pipeline_cycle` — KEY table: nomination/confirmation/scheduling cycles (INTRADAY/DAILY/MONTHLY)
- `pipeline_tariff` — firm/interruptible tariff rates per point pair per season
- `pipeline_operator_agreement` — our shipper agreements with TSOs

**GROUP H — Product approvals (three-level)**
- `pipeline_product_approval` — pipeline level: what products allowed + which spec template
- `pipeline_point_product` — point level: product restrictions at specific entry/exit points
- `pipeline_segment_product` — segment level: older/smaller segments may restrict products
- `mot_asset_product_approval` — polymorphic: product approvals for vessel/truck/railcar/container/tank

---

### Script 6: Financial & Operational Master Data (22 tables)
`etrm_financial_operational_md_v1.0.sql`

**GROUP A — Events**
- `event_category` — 9 categories: TRADE, DELIVERY, SETTLEMENT, RISK, CREDIT, MARKET_DATA, REGULATORY, SYSTEM, USER
- `event_type` — 42 event types seeded across all workflows with severity, SLA, regulatory flag

**GROUP B — Formula**
- `formula_template` — reusable pricing formula patterns (INDEX, DIFFERENTIAL, AVERAGE, WEIGHTED_AVERAGE, BLEND, SPREAD, FORMULA)
- `formula_component` — individual index/differential components within a formula

**GROUP C — Interest rates**
- `interest_rate_index` — SOFR, EURIBOR, SONIA, €STR, TONAR, FEDFUNDS etc. (seeded: 12)
- `interest_rate` — daily rate values per index
- `rate_fixing` — official fixing values (ISDA fallback, ECB reference)

**GROUP D — Insurance**
- `insurance_provider` — P&I clubs, underwriters, Lloyd's syndicates
- `insurance_policy` — P&I, hull, cargo, trade credit, political risk, storage
- `insurance_policy_coverage` — specific coverage clauses and endorsements

**GROUP E — Credit instruments**
- `letter_of_credit` — full LC lifecycle: IRREVOCABLE/STANDBY/REVOLVING/TRANSFERABLE. Computed `amount_available` column
- `bank_guarantee` — PERFORMANCE/PAYMENT/ADVANCE_PAYMENT/BID_BOND
- `lc_amendment` — all amendments to each LC
- `bg_amendment` — all amendments to each bank guarantee

**GROUP F — Margin & collateral**
- `margin_account` — exchange margin accounts per legal entity per market
- `margin_call` — individual calls: INITIAL/VARIATION/INTRADAY/EXCESS_RETURN
- `collateral_type` — CASH, GOV_BOND, CORP_BOND, LC, BG with standard haircuts (seeded: 9)
- `collateral` — posted or received collateral with computed `eligible_value`

**GROUP G — Regulatory**
- `regulatory_report_type` — EMIR, REMIT, UK EMIR, CFTC, MiFID II, SFTR (seeded: 9)
- `regulatory_obligation` — which entities must report under which regulation
- `trade_repository` — DTCC, ICAP, UnaVista, REGIS-TR etc.
- `reporting_counterparty` — which trade repository each entity uses per regulation

---

### Script 7: Pricing Triggers, Window Rules & Pricing Rules (4 tables)
`etrm_pricing_triggers_rules_v1.0.sql`

- `pricing_trigger_event_type` — 30 trigger types seeded:
  - Documentary: BL, NOR, COD, COL, EOL, EOD_DISCHARGE, OUTTURN, PIPELINE_ENTRY/EXIT, TRUCK_LOADING, TRUCK_DELIVERY, RAIL_DEPARTURE, RAIL_ARRIVAL
  - Deemed/fallback: DEEMED_BL, DEEMED_ARRIVAL, DEEMED_DELIVERY, CONTRACTUAL_DATE
  - Time-based: ACTUAL_DATE, PRICING_PERIOD_START/END, DELIVERY_MONTH_START/END
  - Exchange: EXPIRY_DATE, FIXING_DATE, LME_CASH, LME_3MONTH, PUBLICATION_DATE
  - Settlement/inspection: INVOICE_DATE, INSPECTION_DATE

- `pricing_window_rule` — 14 standard windows seeded:
  - SINGLE_DAY, 3DAY_SYMMETRIC (BL-1/0/+1), 5DAY_SYMMETRIC, 5DAY_FORWARD_COD, 3DAY_FORWARD_NOR, 5DAY_BACKWARD_BL, MONTHLY_AVG_ALL, GAS_MONTHLY_BIZ, POWER_MONTHLY_PEAK, LME_CASH_SINGLE, LME_QP_MONTHLY, CBOT_SINGLE, AGRI_5DAY_BL, FULL_DELIVERY_PERIOD

- `pricing_trigger_product` — valid triggers per product/market with fallback trigger linkage and deadline days

- `pricing_rule` — complete assembled pricing rule: product + market + incoterm + pricing_type + price_index + formula_template + primary/fallback triggers + window rule + FX handling + late pricing + invoice timing. **Temporal table.**

---

### Script 8: Pricing Lifecycle (6 tables)
`etrm_pricing_lifecycle_v1.0.sql`

**Flow:** trade → schedule → pricing events → staging (raw feed) → validation → formula evaluation → dispute → confirmed price → invoice

- `trade_pricing_schedule` — master pricing record per trade. Status: PENDING → TRIGGER_SET → FIXING_IN_PROGRESS → FIXINGS_COMPLETE → DISPUTED → CONFIRMED → INVOICED → CLOSED. **Temporal table.** NOTE: trade_id FK added via ALTER after trade table created.
- `pricing_event` — one row per fixing date per index. Tracks raw/actual/fallback/value_used. Override audit preserved.
- `pricing_event_staging` — raw feed values before validation. Option B two-step gate: feed → staging → validation → pricing_event. Cross-source deviation % + spike detection.
- `formula_evaluation_log` — immutable audit. JSON `component_values` captures full input snapshot. Types: PROVISIONAL/INTERIM/FINAL/POST_DISPUTE.
- `pricing_dispute` — SINGLE_FIXING/MULTIPLE_FIXINGS/FORMULA_RESULT/TRIGGER_DATE/WINDOW_DEFINITION. Resolution: AGREED/FALLBACK/ARBITRATION/SPLIT_DIFFERENCE.
- `missing_fixing_rule` — per-index fallback rules. PRIOR_DAY/BACKUP_SOURCE/INTERPOLATE/EXCLUDE/SUSPEND. Max consecutive missing days before escalation.

---

### Script 9: Product Spec / MOT / Pipeline (combined with Script 5 above)

---

## 5. Key Design Decisions

### Polymorphic shared tables
`address`, `tax_registration`, `bank_account`, `contact` all use `entity_type + entity_id` pattern. Enforced via CHECK constraint + application layer. Covers legal_entity, counterparty, location, storage_facility.

### Temporal tables (SQL Server system versioning)
Applied to: `legal_entity`, `app_user`, `book`, `counterparty`, `trader`, `trader_commodity_limit`, `pricing_rule`, `trade_pricing_schedule`. Every change auto-historised by SQL Server — zero application code required. Regulatory requirement.

### Trader limits split
`trader` = person identity only. `trader_commodity_limit` = authorisation per commodity. One trader covering OIL and POWER gets two limit rows — independent daily limits, position limits, approvers per commodity. Time-bounded for temporary limit changes.

### Product specs
Three-level spec hierarchy: `product_spec_template` → `product_spec_value` (min/max/typical per parameter). `spec_override` for pipeline/vessel/tank tighter requirements. Option A chosen: separate min/max/typical columns (not range table).

### Pipeline product approval — three levels
1. Pipeline level: `pipeline_product_approval` (what products allowed on this pipeline)
2. Point level: `pipeline_point_product` (restrictions at specific entry/exit points)
3. Segment level: `pipeline_segment_product` (older segments may restrict certain products)

### MOT asset product approval
`mot_asset_product_approval` is polymorphic covering vessel, truck, railcar, container, tank — same concept as pipeline approval but for individual physical assets.

### Pricing lifecycle (Option B two-step validation)
Raw feed → `pricing_event_staging` (with spike detection + cross-source check) → validation gate → `pricing_event.actual_value`. Gives clean audit trail and prevents bad data hitting formula calculation.

### Period table (unified)
Single `period` table serves both trading periods and risk buckets via `is_trading_period` and `is_risk_period` flags. Rolling periods (M+1, Q+1, CAL+1) use offset rules resolved at runtime. Concrete periods pre-generated 2026–2031.

---

## 6. RBAC Roles

| Role | Permissions |
|---|---|
| TRADER | Create/amend own trades, view own positions, view market data |
| SENIOR_TRADER | All TRADER + approve trades up to credit limit |
| RISK_MANAGER | Read-only all trades, full risk reports, set limits |
| BACK_OFFICE | Settlement, invoicing, counterparty management |
| COMPLIANCE | Read-only all data, regulatory reports, audit log |
| ADMIN | Full system access, user management, reference data |
| APPROVER | Approve trades above trader threshold |
| SYSTEM | Internal service-to-service only |

---

## 7. REST API Endpoints (core)

Base URL: `/api/v1/`

| Method | Endpoint | Description |
|---|---|---|
| POST | /legal-entities | Create legal entity |
| GET | /legal-entities | List (paginated) |
| PUT | /legal-entities/{id} | Update |
| DELETE | /legal-entities/{id} | Deactivate |
| POST | /counterparties | Create counterparty |
| GET | /counterparties | List with filters |
| POST | /traders | Create trader |
| POST | /traders/{id}/limits | Add commodity limit |
| POST | /trades | Create trade |
| GET | /trades | List trades |
| PATCH | /trades/{id} | Amend trade |
| DELETE | /trades/{id} | Cancel trade |
| GET | /positions | Net positions |
| POST | /pricing/mtm | Request MTM (→ Python) |
| GET | /risk/var | VaR calculation |
| GET | /risk/exposure | Credit exposure |
| GET | /settlements | Settlement list |
| GET | /reports/pnl | Daily P&L |
| GET | /reports/regulatory | Regulatory report |

---

## 8. Python Quant Engine Endpoints

Internal only — not exposed externally. Called by Spring Boot.

| Endpoint | Input | Output |
|---|---|---|
| POST /internal/v1/pricing/mtm | tradeId, commodity, quantity, price, curve[], valuationDate | mtmValue, currency, calculatedAt |
| POST /internal/v1/risk/var | portfolioId, positions[], curves[], confidenceLevel, horizon | var95, var99, expectedShortfall |
| POST /internal/v1/curves/build | commodity, marketQuotes[], interpolationMethod | curvePoints[], buildDate |
| POST /internal/v1/pricing/formula | scheduleId, components[], fixings[], windowRule | calculatedPrice, steps[], evaluation_id |

---

## 9. Implementation Phases

| Phase | Duration | Deliverables |
|---|---|---|
| Phase 0 — Foundation | Weeks 1–4 | CI/CD, DB schema, auth, audit, Spring skeleton, Python skeleton, React shell |
| Phase 1 — Oil Trade Capture | Months 2–5 | Full trade lifecycle for oil, counterparty mgmt, trade blotter UI, basic position calc |
| Phase 2 — Risk & Pricing | Months 6–9 | Curve management, MTM, P&L, VaR, credit exposure, risk dashboards |
| Phase 3 — Settlement & Ops | Months 10–13 | Settlement workflow, invoicing, reconciliation, oil delivery mgmt |
| Phase 4 — Regulatory & Reporting | Months 14–16 | EMIR/REMIT/CFTC reporting, management dashboards |
| Phase 5 — Commodity Expansion | Months 17+ | Gas & Power, then Agricultural, then Metals |

---

## 10. What's Been Built

### Master data GUI (React / TypeScript full-stack prototype)

**NonameETRM full application** running on Vite + React 18, Ant Design 5, AG Grid, React Query, Zustand, MSW (Mock Service Worker).

**Organization & Reference:**
- Legal entity, counterparty (with KYC status), trader management
- Desks, books, brokers with fee agreement setup
- Currencies, UoM, UoM conversions, countries, incoterms

**Markets & Products:**
- Markets, exchanges, price indices, price sources
- Products — with quality spec tabs (blend recipe + spec template accordion), pricing basis fields

**Logistics & Calendar:**
- Locations, vessels, pipelines, trucks, storage facilities
- Holiday calendars, trading periods

**Pricing:**
- Pricing rules (assembled: product + market + trigger + window + FX handling)
- Price sources

**Contracts:**
- Payment terms (redesigned: base date event, month offset, business day convention, discount %)
- Payment methods, GTCs, broker fee agreements

**Finance (expanded V50):**
- **GL Accounts** — chart of accounts for trade P&L, fee, and settlement postings: type (Revenue/Cost/Asset/Liability/Equity/P&L), normal balance (Debit/Credit), optional booking company (legal entity) and book (portfolio) scope for P&L attribution, parent account for hierarchy/rollups, currency, cost centre, external GL code (mapping to the ERP/GL system of record), control-account flag

**Credit & Risk (V35, expanded V49):**
- **Margin Agreements** — CSA/pledge setup per counterparty: threshold, MTA, independent amount, eligible collateral, valuation frequency, governing law
- **Credit Limits** — pre-settlement/settlement/delivery/MTM/total-aggregate limits, scoped per commodity type or umbrella (ALL); DIRECT limits or ALLOCATED (carved from a parent/group umbrella via `parentLimitId`); country + country-risk-rating per limit; credit analyst assignment; review governance (frequency, last/next review with auto-derivation, outcome, internal/external rating); collateral offset + temp uplift with expiry; tenor cap; instrument-class sub-limits (physical/futures/forwards/swaps/options/storage&transport) as line items; warning/critical thresholds with configurable breach action; internal + counterparty alerting with an alert history timeline; computed traffic-light health indicator
- **Letters of Credit** — standby/documentary/revolving/transferable LCs: face value, drawdown tracking, evergreen/auto-renewal provisions, expiry alert index; summary stats band (total face value, total available, total drawdown, active count)
- **Credit Hub** — hub card page at `/credit` linking to all three sections

**Trade Capture:**
- **Trade Blotter** — Trade → Order/Leg → Item three-tier hierarchy, full-width two-column drawers:
  - Trade header: counterparty, trader, trade date, contract number, term type SPOT/RFP, deal indicator INTERNAL/EXTERNAL, **instrument type** (PHYSICAL/CERTIFICATE_TRANSFER/FUTURES/FORWARD/SWAP_FIXED_FLOAT/SWAP_FLOAT_FLOAT/OPTION_LISTED/OPTION_OTC_AMERICAN/OPTION_OTC_ASIAN/OPTION_OTC_EUROPEAN/STORAGE_AGREEMENT/TRANSPORT_AGREEMENT, filtered per commodity via server-side `commodity_instrument_type_config`), `specialReference` (180-char text, not a boolean)
  - RFP fields (min/max qty, start/end dates, frequency) shown conditionally when term_type = RFP
  - Legs panel always visible below trade grid; first leg auto-tagged TEMPLATE; commodity-specific delivery sections (OIL/GAS/POWER/LNG/METALS/AGRI/FREIGHT/RINS/ENVIRONMENTAL) plus swap/option/storage-agreement/transport-agreement detail sections keyed off instrument type
  - Physical legs: origin country, demurrage & laytime (rate/basis/allowed hours/despatch), price adjustments line-item table (API gravity, density, heat content, sulfur, protein, moisture, TC/RC, quality premium/discount, tax, markup, FX differential)
  - Items section shown when a leg is selected

**Admin:**
- System users (incl. CREDIT_ANALYST role), roles & permissions, field-level permissions (EDIT/VIEW/HIDDEN per field per role profile)

**Infrastructure:**
- AppRouter with lazy-loaded routes for all modules
- AppShell with collapsible sidebar (hub-group accordion submenus, auto-open on current route), dark/light theme toggle, API activity log drawer
- MSW handlers for all endpoints (crudHandlers helper + custom denormalizing/computing handlers registered before the generic spread, e.g. trades and credit limits)
- React Query cache with `['resource']` keys; useMutation with cache invalidation on success
- **Minimize-panel / draft-resume** (`src/components/smart/formDraft.ts` + `MinimizedDraftsDock.tsx`): navigating away from an open capture drawer/modal/page mid-edit pins it in a persistent bottom-left dock instead of losing the work; clicking the pin explicitly restores it (never auto-fires on page load). Multiple in-progress records (e.g. a new trade and a separate edit) get independent pins. Covers all drawer/modal forms plus routed pages (`CounterpartyFormPage`) via `usePageFormDraft`. Every drawer also offers Save (stays open) and Save & Close.
- **Uniform date field** (`src/components/smart/AppDatePicker.tsx`): one typeable + calendar date control used for every date field app-wide — always use this for new date fields, never bare `DatePicker` or `Input`.

---

## 11. What's Next

**Phase 2 — Risk & Pricing (Months 6–9):**
- Spring Boot service layer for trades, positions, credit
- Python quant engine: MTM, curve building, VaR
- Position engine: net positions per book per commodity, base-UoM normalisation (V28)
- Credit exposure engine: real-time utilisation against `dbo.credit_limit`, breach alerts
- Margin call workflow: link to `dbo.margin_agreement` thresholds

**Phase 3 — Settlement & Ops (Months 10–13):**
- Settlement workflow, invoicing, reconciliation
- LC drawdown processing: link trade invoices to `dbo.letter_of_credit` drawdown_amount
- Delivery management

**Immediate next (frontend prototype):**
- Position & P&L page (route `/position` already exists, placeholder)
- Pricing lifecycle UI (pricing schedule, fixing events)

---

## 12. Open Decisions

| Item | Decision needed | Impact |
|---|---|---|
| Deployment target | Cloud (Azure/AWS/GCP) vs On-Premise vs Hybrid | Infrastructure design, CI/CD, DR |
| Market data vendor | Bloomberg, Platts, Argus, ICE — which primary? | Curve building timeline |
| Regulatory jurisdictions | EU (EMIR/REMIT) vs US (CFTC) vs both | Reporting module scope |
| Message queue | Kafka vs RabbitMQ for async position calc | Needed before Phase 2 |
| ERP integration | SAP vs Oracle vs other | Settlement/GL interface |
| Multi-tenancy | Single client vs SaaS multi-tenant | Major data isolation change |
| Real product name | "NonameETRM" is a placeholder — user hasn't decided on a final name yet | Rename everywhere once decided (header, docs, seed data) |

---

## 13. Flyway Migration History

All migrations live in `etrm-backend/src/main/resources/db/migration/` and are mirrored for reference to `etrm-system/database/`.

| Version | File | Summary |
|---------|------|---------|
| V1–V8 | `V1__...` – `V8__...` | Initial schema: master data, trader, market/price, product spec, MOT/pipeline, pricing |
| V9 | `V9__trade_schema.sql` | Trade blotter tables + commodity extension tables (oil/gas/power/metals/agri) |
| V10 | `V10__position_schema.sql` | Position ledger |
| V11 | `V11__power_schema.sql` | Power-specific: grid nodes, transmission rights, balancing |
| V12 | `V12__power_transmission_rights.sql` | Transmission right detail |
| V13 | `V13__parent_company_guarantee.sql` | PCG for counterparty credit |
| V14 | `V14__master_data_table_registry.sql` | `md_table_registry` — powers Static Data admin UI |
| V15 | `V15__temporal_tables_fix.sql` | Temporal table DDL corrections |
| V17 | `V17__parent_lookup_tables.sql` | First wave of parent lookup tables (commodity type, UoM class, etc.) |
| V18 | `V18__address_phone_contact_entity_type.sql` | Polymorphic contact/address entity types |
| V19 | `V19__entity_address_contact_link_tables.sql` | Entity ↔ address/contact junction tables |
| V20 | `V20__rbac_roles_functions.sql` | RBAC: `app_function`, `app_role`, `role_function_grant`, `user_role` |
| V21 | `V21__address_contact_rbac_user_profile.sql` | `user_profile` table; address/contact linking |
| V22 | `V22__payment_term_redesign.sql` | **Payment Term redesign** — adds `base_date_event`, `month_offset`, `business_day_convention`, `holiday_calendar_id`, `discount_pct`, `payment_method`, `invoice_lead_days`, `is_default`. Re-seeds 20 commodity-representative terms |
| V23 | `V23__base_date_event_commodity_product_fields.sql` | **Lookup tables + commodity/product enrichment**: creates `base_date_event_type` (11 rows) and `business_day_convention_type` (5 rows) as managed static data; adds `commodity_subtype`, `default_uom_id`, `default_currency_id` to commodity; adds `grade_code`, `product_family`, `bloomberg_ticker`, `reuters_ric`, `platts_code`, `is_exchange_traded`, `is_otc` to product |
| V24 | `V24__product_blend_spec_seeds.sql` | **Product blend model + quality spec seeds**: adds `is_blend BIT` and `blend_notes VARCHAR(500)` to `product`; adds 13 new `spec_parameter` rows (ULSD/diesel quality, gas composition, metals purity, agri); creates `product_blend_component` M:M bridge table (parent_product_id, component_product_id, min/target/max_pct, tolerance_pct); seeds 3 products (ULSD-10PPM, ETHANOL, GAS97-BLEND); seeds 2 blend component rows for GAS97-BLEND recipe (97% ULSD + 3% Ethanol); seeds 6 `product_spec_template` rows (Brent/BFOE, WTI/NYMEX, TTF/EFET, LME Grade A Copper, EN590 ULSD, GAS97 internal); seeds 32 `product_spec_value` rows with industry-standard min/max/typical bounds |
| V25 | `V25__pricing_basis_uom_conversion_spec_additions.sql` | **Pricing basis fields + UoM conversion seeds + extended spec catalogue**: adds 7 pricing basis columns to `product` (`density_estimate_kg_m3`, `density_base_kg_m3`, `cv_gross_mj_scm`, `cv_net_mj_scm`, `purity_basis_pct`, `moisture_basis_pct`, `protein_basis_pct`); adds 6 UoM rows (GJ commodity_type=NULL, SCM/MMSCM with self-referential VOLUME base, LB commodity_type=NULL, GAL, CBM); seeds 21 `uom_conversion` rows covering universal weight, precious metals, OIL volume (VOLUME↔VOLUME only — no BBL↔MT as these require per-product density), GAS energy (ENERGY↔ENERGY only — no SCM↔MWH as these require per-product GCV), POWER, and AGRI; adds 24 more `spec_parameter` rows; UPDATEs 16 products with pricing basis values (including ETHANOL density 794/789 kg/m³) |
| V26 | `V26__field_level_permissions.sql` | **Field-level permission system**: creates `screen_field_registry` (developer-owned catalogue of configurable fields per screen), `field_permission_profile` (client-admin-named role profiles), `field_permission_rule` (per-field EDIT/VIEW/HIDDEN setting per profile), `object_lock_rule` (Layer 1 lifecycle-state locks); seeds 63 `screen_field_registry` rows for TRADE_BLOTTER screen across 10 field groups; seeds 3 sample profiles (Trader Full Access, Credit Manager, Read-Only Viewer) |
| V27 | `V27__blend_component_needs_position_gen.sql` | **Blend component position flag**: adds `needs_position_gen BIT NOT NULL DEFAULT 1` to `product_blend_component`; when TRUE, the position engine generates individual sub-positions for that component in addition to the blended product position; backfills existing rows to TRUE |
| V28 | `V28__position_base_uom_columns.sql` | **Position base-UoM normalisation**: adds `quantity_base_uom` and `base_uom_code` to `position` and `position_eod_snapshot`; position engine stores both traded quantity and commodity-normalised quantity (OIL/METALS/AGRI → MT; GAS/POWER → MWH). Conversion factors sourced from `product.density_estimate_kg_m3` and `product.cv_gross_mj_scm` |
| V29 | `V29__trade_blotter_field_expansion.sql` | **Trade field expansion**: adds `contract_type` (SPOT/DAILY/WEEKLY/MONTHLY/QUARTERLY/ANNUAL/TERM), `risk_start_date`, `risk_end_date`, `broker_id` (FK to new `dbo.broker` table), `broker_fee_type/fee/currency`, `credit_term_code`, `credit_approval_status`, `credit_limit_used`, `gtc_reference` to `dbo.trade`; adds `mot_type` and other MOT fields to `trade_oil_detail` |
| V30 | `V30__freight_trade_detail.sql` | **Freight trade detail table**: `dbo.trade_freight_detail` for FREIGHT commodity trades; covers voyage charters, time charters and COA; stores vessel_type (VLCC/SUEZMAX/AFRAMAX/LR2/LR1/MR/CAPE/PANAMAX/SUPRAMAX/HANDYSIZE), charter_type, route_code (TD3C, TC2, C3…), cargo_size_mt, freight_rate_type (WORLDSCALE/FLAT_RATE/LUMPSUM/TCE), rate, laycan_start/end |
| V31 | `V31__broker_type_description.sql` | **Broker table enhancement**: adds `broker_type` (VOICE/ELECTRONIC/HYBRID), `description`, `contact_name/email/phone`, `website`, `country_code` to `dbo.broker`. Clarifies that `broker` holds IDB (inter-dealer broker) firms only — FCM and Prime Brokers are managed in `dbo.counterparty` |
| V32 | `V32__broker_fee_agreement.sql` | **Broker fee agreement table**: `dbo.broker_fee_agreement` — standing rate cards between the firm and each IDB; stores fee_type (PER_LOT/PCT_NOTIONAL/FLAT_PER_TRADE/FLAT_MONTHLY), rate, currency, effective/expiry dates, pay_period (PER_TRADE/MONTHLY); supports multi-commodity/multi-product override rows per broker |
| V33 | `V33__trade_order_item.sql` | **Three-tier deal structure**: creates `dbo.trade_order` (delivery legs — product, market, pricing_rule, risk dates, qty, price, settlement, incoterm, delivery_location, commodity detail) and `dbo.trade_item` (sub-line items within a leg); `order_sequence=1` is the TEMPLATE leg; subsequent legs are detail legs |
| V34 | `V34__trade_userdata_tables.sql` | **Trade header refactor**: ALTERs `dbo.trade` — adds `contract_number`, `term_type` (SPOT/RFP, NOT NULL DEFAULT 'SPOT'), `deal_indicator` (INTERNAL/EXTERNAL, auto-set from CP type), `rfp_min_qty`, `rfp_max_qty`, `rfp_start_date`, `rfp_end_date`, `rfp_frequency` (DAILY/WEEKLY/MONTHLY/QUARTERLY); adds CHECK constraint requiring rfp_* fields when `term_type='RFP'`; ALTERs `dbo.trade_order` — adds `is_template BIT DEFAULT 0`; DROPs old delivery columns (product_id, market_id, quantity, price, settlement_type, etc.) that are now on trade_order only |
| V35 | `V35__credit_margin_lc.sql` | **Credit & Risk master data tables**: `dbo.margin_agreement` — CSA/pledge parameters per counterparty (threshold, MTA, independent amount, eligible collateral, valuation frequency, governing law); `dbo.credit_limit` — pre-settlement/settlement/delivery/MTM limits per counterparty with used_amount tracking; `dbo.letter_of_credit` — standby/documentary/revolving/transferable LCs with face value, drawdown tracking, evergreen/auto-renewal provisions, place of expiry, applicable law (UCP 600/ISP98) |
| V36 | `V36__carbon_environmental.sql` | **Carbon & Environmental master data**: `dbo.emission_scheme` (EU-ETS, UK-ETS, CBAM, CA-CCAES, RGGI, AUS-SAFEGUARD, CER, VCS, GOLD-STANDARD, JCM — 9 schemes seeded); `dbo.environmental_product` (EUAs, UKAUs, 10 products seeded); `dbo.carbon_registry` (EUTL, UK Registry, CBAM, 8 registries seeded); `dbo.emission_obligation` (per-entity/per-scheme annual compliance obligation, 6 seed rows) |
| V37 | `V37__gl_account.sql` | **Chart of accounts**: `dbo.gl_account` — trading entity's GL account catalogue; stores account_code, account_name, account_type (ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE/CONTRA), commodity_type (nullable), cost_center, description. Seeded with 11 representative accounts (trade receivables, cash, payables, revenue, PnL, unrealised MTM, etc.) |
| V38 | `V38__rins.sql` | **RINs (Renewable Fuel Standard)**: `dbo.rin_fuel_category` — D-codes D3–D7 with equivalence values; `dbo.rin_account` — EPA company/facility accounts per legal entity; `dbo.rin_transaction` — generate/separate/transfer/retire events; `dbo.rin_obligation` — annual RVO per compliance year. Seeded: 5 D-code rows, 2 RIN accounts, 8 transactions, 4 obligations |
| V39 | `V39__tas.sql` | **Trade-at-Settlement (TAS)**: `dbo.settlement_price` — daily exchange settlement prices for TAS contracts (CLZ26, CLF27, NGF27, BZN26 etc.); `pricing_rule` extended with `tas_exchange`, `tas_contract_series`, `tas_tick_size` columns; 12 seed settlement prices |
| V40 | `V40__bolmo.sql` | **Book-Out / Last Month Option (BOLMO)**: `dbo.bolmo_agreement` and `dbo.bolmo_leg` — BOLMO master agreement between two parties to book out back-to-back OTC positions at a mutually agreed price; leg stores each priced-out position with commodity, quantity, price, reference trade |
| V41 | `V41__balmo.sql` | **Balance-of-Month Option (BALMO)**: `dbo.balmo_product` — exchange-traded BALMO contract series (CME/NYMEX WTI BALMO, ICE Brent BALMO, NG BALMO, HO BALMO); stores pricing_start_date, pricing_end_date, last_trading_date, settlement_price_ticker, tick_size; 6 seed rows |
| V42 | `V42__trade_header_tolerance.sql` | **Trade header enhancements + order tolerance + broker legal/commission**: ALTERs `dbo.trade` — adds `hedge_flag BIT`, `cin VARCHAR(50)`, `payment_calendar_code`, `contract_periodicity` (DAILY/WEEKLY/MONTHLY/QUARTERLY), `contract_status` (DRAFT/ACTIVE/SUSPENDED/TERMINATED), `special_contract_flag BIT`; ALTERs `dbo.trade_order` — adds `tolerance_type` (RATE/FLAT), `tolerance_plus`, `tolerance_minus`, `tolerance_for_scheduling BIT`; ALTERs `dbo.broker` — adds `legal_doc_id`, `commission_uom_code`, `commission_notes` |
| V43 | `V43__master_data_alignment.sql` | **Master data alignment**: extends commodity_type CHECK constraints on `dbo.book`, `dbo.desk`, `dbo.gl_account` to include MULTI and OTHER (previously only 5 values); adds `go_live_date DATE` and `description NVARCHAR(500)` to `dbo.book`; creates `dbo.trader_commodity_limit` junction table — per-commodity trade/position limits normalised out of the flat trader table (one row per trader per commodity: single_trade_limit, daily_trade_limit, position_limit, limit_currency, effective dates); seeds from existing trader flat-limit rows via STRING_SPLIT on `commodity_types` CSV |
| V44 | `V44__instrument_types_and_deal_detail_tables.sql` | **Instrument types & deal detail tables**: adds `instrument_type VARCHAR(30)` to `dbo.trade` with CHECK constraint (12 values including CERTIFICATE_TRANSFER); extends `mot_type` CHECK on `dbo.trade_order` to include CERTIFICATE; seeds `instrument_type`, `storage_agreement_type`, `transport_agreement_type` rows into `dbo.lookup_value` (using its `category`/`code`/`display_name` columns); creates four deal-type detail tables that mirror the TS interfaces column-for-column, each keyed `order_id FK → dbo.trade_order ON DELETE CASCADE`: `dbo.trade_swap_detail` (fixed rate/ccy/uom, floating_index_code + floating_index2_code for basis swaps, reset/payment frequency incl. ANNUAL, notional, averaging method), `dbo.trade_option_detail` (put/call, strike + strike uom, expiry/exercise, premium + pay date, underlying product/contract, lot size, number of lots, is_exercised, exercised_price), `dbo.trade_storage_agreement_detail` (agreement type, facility code, country, capacity reserved, injection/withdrawal per day, tariff rate/ccy/uom, minimum throughput), `dbo.trade_transport_agreement_detail` (agreement type, carrier, vessel + IMO, pipeline code, load/discharge/route, capacity per lift, laycan, agreement dates, number of lifts, freight rate/type/ccy); seeds `instrument_type` onto demo trades 1–15 |
| V45 | `V45__commodity_instrument_type_config.sql` | **Commodity → instrument type mapping**: creates `dbo.commodity_instrument_type_config` (PK: commodity_type + instrument_type; is_active, sort_order). Authoritative DB-side config — frontend fetches via `GET /commodity-instrument-map` (staleTime: Infinity); no UI CRUD, only DBA/vendor adds rows via migration. Captures market-specific rules: RINS/ENVIRONMENTAL have CERTIFICATE_TRANSFER not PHYSICAL; POWER has no TRANSPORT_AGREEMENT; FREIGHT = FFA market only (no storage, limited options). Seed: 9 commodities × their valid instrument types. |
| V46 | `V46__physical_price_adjustments_demurrage.sql` | **Physical leg enrichments — origin country, demurrage, price adjustments**: ALTERs `dbo.trade_order` to add `origin_country_code CHAR(2)` (ISO 3166-1 alpha-2, for sanctions screening), `demurrage_rate`, `demurrage_currency`, `demurrage_basis` (REVERSIBLE / NON_REVERSIBLE / AVERAGED), `allowed_laytime_hours`, `despatch_rate`; creates `dbo.trade_order_price_adjustment` (adjustment_id PK, order_id FK CASCADE, adjustment_type CHECK 15 values, adjustment_value, currency, uom_code, sort_order, notes); seeds `price_adjustment_type` (15 rows: API_GRAVITY, DENSITY, HEAT_CONTENT, SULFUR, PROTEIN, MOISTURE, TEST_WEIGHT, ASSAY, TREATMENT_CHARGE, REFINING_CHARGE, QUALITY_PREMIUM, QUALITY_DISCOUNT, TAX, MARKUP, FX_DIFFERENTIAL) and `demurrage_basis` (3 rows) into `dbo.lookup_value`; seeds origin country and demo price adjustments onto existing physical orders |
| V47 | `V47__storage_type_commodity_type_alignment.sql` | **Storage type canonicalization + commodity type extension**: remaps legacy `dbo.storage_facility.facility_type` codes to the canonical vocabulary (TANK→TANK_FARM, CAVERN→SALT_CAVERN, LNG_TERMINAL→LNG_TANK, GRAIN_SILO→SILO) and replaces the CHECK with the canonical 14 codes (TANK_FARM, FLOATING_STORAGE, WAREHOUSE, SALT_CAVERN, GAS_STORAGE, PIPELINE_LINEFILL, LNG_TANK, SILO, REFRIGERATED_STORAGE, CHEMICAL_TANK, FSRU, REFINERY, VAULT, OTHER — matches frontend STORAGE_TYPES exactly); updates `dbo.storage_facility_type` parent lookup in place and inserts the 6 new codes; extends the commodity_type CHECK on `dbo.book`, `dbo.desk`, `dbo.gl_account`, `dbo.trader_commodity_limit` from 7 to 11 values (adds LNG, FREIGHT, RINS, ENVIRONMENTAL) so desks/books/GL accounts can be classified for every tradeable commodity. **Also fixed in this pass (in-place, migrations not yet run):** V36/V37/V38/V44/V46 `lookup_value` INSERTs corrected from non-existent `(table_name, type_code, type_name, description)` columns to the actual `(category, code, display_name, notes)` schema defined in V1 |
| V48 | `V48__special_reference.sql` | **Special reference replaces special contract flag**: adds `special_reference NVARCHAR(180) NULL` to `dbo.trade` (free-text reference to side letters / bespoke clauses — a special contract carries a reference, not a boolean); migrates rows where `special_contract_flag = 1` to a LEGACY placeholder text, then drops the flag column and its default constraint. TS: `Trade.specialReference: string \| null` replaces `specialContractFlag: boolean`; form shows a 180-char counted Input in Contract Controls |
| V49 | `V49__credit_limit_expansion.sql` | **Credit limit module expansion**: ALTERs `dbo.credit_limit` with 22 new columns across four groups — *scope*: `commodity_type` (ALL + 11 commodities), `limit_basis` (DIRECT / ALLOCATED), `parent_limit_id` self-FK for group-umbrella hierarchies, `cp_country_code`, `country_risk_rating` (LOW→SEVERE); *amounts*: `collateral_offset` + `collateral_ref` (LC/PCG raises capacity), `temp_uplift_amount` + `temp_uplift_expiry`, `tenor_cap_months`; *governance*: `credit_analyst_user_id/name`, `review_frequency_days`, `last/next_review_date` (next auto-derived), `last_review_outcome` (MAINTAIN/INCREASE/DECREASE/SUSPEND/ESCALATE), `internal_rating`, `external_rating`; *monitoring*: `warning/critical_threshold_pct`, `breach_action` (ALERT_ONLY / BLOCK_NEW_TRADES / BLOCK_ALL), `alert_internal`, `alert_counterparty` + `cp_alert_email`. `limit_type` CHECK gains TOTAL_AGGREGATE; status gains UNDER_REVIEW. New tables: `dbo.credit_limit_line_item` (instrument-class sub-limits: PHYSICAL/FUTURES/FORWARDS/SWAPS/OPTIONS/STORAGE_TRANSPORT, unique per limit+class, CASCADE) and `dbo.credit_limit_alert` (event log: threshold/breach/review-due/expiry/status alerts with recipients INTERNAL/COUNTERPARTY/BOTH and acknowledgement tracking). Seeds 6 lookup categories. Frontend: rebuilt CreditLimitsPage — two-column drawer, analyst dropdown from app users, auto country fill from CP, parent-limit select for allocations, sub-limits Form.List, read-only alert timeline; MSW computes availability/utilisation/traffic-light server-side |
| V50 | `V50__gl_account_enhancements.sql` | **GL Account enhancements**: ALTERs `dbo.gl_account` to add `legal_entity_id` (FK → `legal_entity`, nullable — NULL = shared/corporate account across all booking entities), `book_id` (FK → `book`, nullable — portfolio scope for P&L attribution), `parent_account_id` (self-FK → `gl_account`, for chart-of-accounts hierarchy/rollups), `normal_balance NVARCHAR(10)` CHECK (DEBIT/CREDIT), `currency_code CHAR(3)` nullable, `external_gl_code NVARCHAR(50)` (mapping to the ERP/GL system of record — SAP/Oracle — since this ETRM posts to, not replaces, the GL), `is_control_account BIT`. Seeds `gl_normal_balance` lookup category. Frontend: `GlAccountsPage.tsx` gained Booking Company / Book / Parent Account / Currency Select fields (Legal Entity and Book pull from the real master-data hooks, not a shadow list — see the CRITICAL note on the two legal-entity mock stores at the top of §0); MSW `computeGlAccount()` denormalizes `legalEntityCode`/`bookCode`/`parentAccountCode` server-side, same pattern as `computeCreditLimit` |

---

## 14. Static Data Admin UI — Lookup Table Design

Payment term dropdowns (Base Date Event and Business Day Convention) are driven by managed lookup tables, not hardcoded TypeScript enums. This means operations teams can add new event types without code changes.

**Pattern:**
1. Lookup table in SQL (e.g. `base_date_event_type`) with `type_code` matching the CHECK constraint on the data column
2. Entry in `PARENT_LOOKUP_TABLES` array in `referenceData.ts` — auto-registers the table in the Tier 2 Static Data UI
3. Frontend uses `useTableRows('base_date_event_type')` hook to load options at runtime
4. Form select uses grouped options (`applicableCommodity` as group header) with search enabled

**Tables managed via Static Data UI:**
- `base_date_event_type` — 11 payment date anchors (BL_DATE, DELIVERY_DATE, END_OF_DELIVERY_MONTH, etc.)
- `business_day_convention_type` — 5 BD rolling rules (MOD_FOLLOWING, FOLLOWING, etc.)
- `crude_grade_type` — 14 named crude grades (BRENT, WTI, FORTIES, URALS, DUBAI, ESPO, etc.) with region and benchmark index
- `metal_shape` — 9 physical metal forms (CATHODE, INGOT, BILLET, COIL, ROD, SLAB, WIRE, POWDER, T_BAR)
- `gas_day_type` — 3 gas day boundary types (STANDARD 06:00–06:00, MIDNIGHT, EXTENDED)
- `nomination_type` — 3 gas nomination types (FIRM, INTERRUPTIBLE, RENOMINATABLE)
- `lng_price_basis` — 6 LNG price linkages (JCC, HH, TTF, NBP, DES_SPOT, HYBRID)
- `power_load_type` — 4 power load profiles (BASELOAD, PEAK, OFF_PEAK, SHAPED)
- All other `PARENT_LOOKUP_TABLES` entries (commodity type, pricing type, UoM class, etc.)

**TradeBlotter dropdowns** — all formerly-hardcoded option arrays replaced with `useTableRows()` hooks and `useUom()`:
| Previously hardcoded | Now served by |
|---|---|
| `UOM_OPTIONS` | `useUom()` → `/api/v1/uom` |
| `CURRENCY_OPTIONS` | `useTableRows('currency')` |
| `CRUDE_GRADES` | `useTableRows('crude_grade_type')` |
| `METALS_SHAPES` | `useTableRows('metal_shape')` |
| `LNG_PRICE_BASES` | `useTableRows('lng_price_basis')` |
| inline `nominationType` options | `useTableRows('nomination_type')` |
| inline `gasDayType` options | `useTableRows('gas_day_type')` |
| inline `loadType` options | `useTableRows('power_load_type')` |

## 14a. Product Blend & Quality Spec Data Model

### Blend Products
A product can be flagged `is_blend = true` to indicate it is manufactured by blending component products. The recipe is stored in `product_blend_component`:

```
product_blend_component
├── parent_product_id    → blended product (e.g. GAS97-BLEND)
├── component_product_id → a constituent (e.g. ULSD-10PPM, ETHANOL)
├── sequence_no          → display order
├── min_pct / target_pct / max_pct  → volume-basis blending recipe
├── tolerance_pct        → allowable variance from target
└── needs_position_gen   → (V27) BIT; TRUE = position engine creates a sub-position for this
                           component in addition to the parent blend position;
                           FALSE = component tracked only within the blended product position
```

**Example**: GAS97-BLEND = Component 1: ULSD-10PPM (target 97%vol ±0.5%) + Component 2: ETHANOL (target 3%vol ±0.25%).

### Quality Spec Templates
Spec data flows through three linked tables:

```
spec_parameter (parameter catalogue — API gravity, sulphur %, GCV, purity %, etc.)
    └── product_spec_template (named spec per product — e.g. EN590_10PPM for ULSD)
            └── product_spec_value (min/max/typical bounds per parameter)
                    └── spec_override (pipeline or vessel tighter requirements) [future]
```

**Seeded standards** (V24):
| Template Code | Product | Standard |
|---|---|---|
| DTBRT_BFOE_STD | BRENT-CRUDE | BFOE MoU 2023 |
| WTI_NYMEX_STD | WTI-CRUDE | NYMEX Rule 200 |
| TTF_EFET_2020 | TTF-GAS | NTA 8000 / EFET 2020 |
| LME_CU_GRADE_A | LME-COPPER | LME Annex A / BS EN 1978 |
| EN590_10PPM | ULSD-10PPM | EN 590:2022+A1 |
| GAS97_INTERNAL | GAS97-BLEND | EN 228:2012 / Internal |

### Frontend — ProductsPage Quality Specs Tab
The `ProductsPage.tsx` drawer now has 4 tabs:
- **Details** — all product fields including `isBlend` switch and `blendNotes` (shown when blend enabled)
- **Price Indices** — link/unlink price index relationships
- **Markets** — read-only view of market listings
- **Quality Specs** — blend recipe (when `isBlend=true`) + spec template accordion with parameter bounds table

---

## 14b. UoM Conversion Architecture — Cross-Type Constraint

**Only same-type conversions belong in `uom_conversion`.**

| Same-type (stored in `uom_conversion`) | Cross-type (product-specific only) |
|---|---|
| VOLUME → VOLUME (BBL→GAL, BBL→CBM) | VOLUME → WEIGHT (BBL→MT requires density) |
| WEIGHT → WEIGHT (MT→KG, MT→LB) | VOLUME → ENERGY (SCM→MWH requires GCV) |
| ENERGY → ENERGY (MWH→MMBTU, MWH→GJ) | WEIGHT → ENERGY (not currently traded) |

Cross-type conversions (e.g. BBL↔MT, SCM↔MWH) are **not** stored as commodity-level defaults because the conversion factor differs for every product:

| Product | density (kg/m³) | 1 BBL → MT |
|---|---|---|
| Brent crude | ~833 | 0.13240 |
| WTI crude | ~825 | 0.13113 |
| ULSD | ~845 | 0.13432 |
| Fuel Oil 380 | ~990 | 0.15741 |

Instead, the position engine reads from the `product` table pricing basis fields:
- **OIL**: `density_estimate_kg_m3` / `density_base_kg_m3` → `MT = BBL × 0.158987 × density / 1000`
- **GAS**: `cv_gross_mj_scm` / `cv_net_mj_scm` → `MWH = SCM × cv_gross / 3600`; `MMBTU = SCM × cv_gross / 1055.056`

`density_estimate_kg_m3` is used for daily MTM; `density_base_kg_m3` is the reference/contract value for invoice settlement.

---

## 14c. Field-Level Permission Architecture (V26)

Two-layer model. Layer 1 always wins over Layer 2.

### Layer 1 — Object Lifecycle Locks (`object_lock_rule`)
Developer-owned, deployed via Flyway only. When an entity reaches a lifecycle state (CONFIRMED, MATURED, CLOSED, CANCELLED, INVOICED), specified fields are automatically locked to READ_ONLY or HIDDEN regardless of user role. Examples:
- Trade CONFIRMED → price, quantity, currency → READONLY
- Trade CLOSED → all fields → READONLY

### Layer 2 — Field Permission Profiles (`field_permission_profile` + `field_permission_rule`)
Client-admin-configurable via the **Field-Level Permissions** admin page. Profiles are scoped to one screen. Each profile assigns per-field access (EDIT / VIEW / HIDDEN) to a role. `is_required_field=1` fields cannot be set below VIEW by either layer.

**Merge rule**: `effective = min(Layer1, Layer2)` where HIDDEN < VIEW < EDIT.

### Frontend Hook
`useFieldPermissions(screenCode, roleIds)` → returns a map `fieldKey → AccessLevel`. Used by `PermissionField` wrapper component which renders fields as editable/read-only/hidden based on effective access level.

---

## 15. Script Execution Order (Legacy)

```
1.  etrm_master_data_v2.0.sql
2.  etrm_trader_patch_v2.1.sql
3.  etrm_market_source_period_v1.0.sql
4.  etrm_mpp_dates_patch_v1.1.sql
5.  etrm_product_spec_mot_pipeline_v1.0.sql
6.  etrm_financial_operational_md_v1.0.sql
7.  etrm_pricing_triggers_rules_v1.0.sql
8.  etrm_pricing_lifecycle_v1.0.sql
-- All now superseded by Flyway migrations V1–V23 above
```

---

*Document generated June 2026 — ETRM System Build Project*
