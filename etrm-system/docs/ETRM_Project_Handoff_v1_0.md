# ETRM System — Project Handoff Document
**Version:** 2.3 | **Date:** July 2026 | **Status:** Trade Capture + Credit & Risk Module Complete — migration frontier V73

---

## 0. Session Recap (read this first when resuming)

**Migration frontier: V73.** Next migration is **V74**. Every SQL change must be written to BOTH `etrm-system/database/NN_name.sql` (no V prefix) AND `etrm-backend/src/main/resources/db/migration/VNN__name.sql` (V prefix) — keep them byte-identical.

**CRITICAL — typecheck command:** `npx tsc --noEmit` in `etrm-frontend/` is **vacuous** — the root `tsconfig.json` is solution-style (`"files": []`, references only) and exits clean without checking anything. Always use `npx tsc -b --noEmit` (matches the real build script `tsc -b && vite build`). This bit us once this session — 24 real errors were hiding behind a false-clean `tsc --noEmit`.

**CRITICAL — there are two separate, non-interchangeable "legal entity" mock stores in the frontend.** `src/mocks/handlers.ts` exports `legalEntityStore` (seeded from `src/mocks/data.ts`: ACME-UK / ACME-US / GLOBEX-SG) — this is the **real, canonical, CRUD-backed** one, registered first in `browser.ts` so it's what `GET /legal-entities` actually returns and what `useLegalEntities()` shows everywhere. `src/mocks/etrmHandlers.ts` separately has an internal `legalEntitiesRef` shadow array (SETRM-LTD / SETRM-NL / SETRM-SG) used only to denormalize desk/book/trader seed rows — it is dead code as far as the `/legal-entities` endpoint goes (shadowed by registration order) and must never be used for anything a user can look up by legal entity id, or the displayed code won't match any real, editable record. Desk/book/trader `legalEntityCode` values were found stale (pointing at the shadow codes) this session and corrected to the real ones — if you add a new master-data entity that references `legalEntityId`, denormalize against `legalEntityStore`, not `legalEntitiesRef`.

**What changed this session, most recent first:**
- **Final group of the four approved backlog groups: Trade Ops + Pricing + Regulatory (`formula_template`, `fx_rate`, `settlement_calendar`, `regulatory_obligation`, `trade_repository`) — all 4 backlog groups from `MasterDataHub.tsx`'s `live: false` list are now complete.** Of the 7 originally scoped items, `nomination`/`delivery_instruction` were skipped (see below) and the other 5 built:
  - **V73 — `fx_rate`, `settlement_calendar`, `trade_repository` built as Static Data** (flat reference/bridge tables, no real workflow — contrasted against `bank_guarantee`/`margin_account`/`collateral` from the prior group, which DO have real lifecycles and got dedicated pages instead). Added a lightweight `holiday_calendar` id/code/name mirror (same FK-resolution-only pattern as `product`/`storage_facility`/`counterparty`) since `settlement_calendar.calendar_id` needed it.
  - **`formula_template` and `regulatory_obligation` built as full dedicated pages** (no new migration — both tables already existed in `05_financial_operational_md.sql`, this session just built the missing frontend): `types.ts`/`api.ts`/`hooks.ts`/`FormulaTemplatesPage.tsx` and `.../RegulatoryObligationsPage.tsx`, mock stores + `computeRegulatoryObligation()` denormalization (formula_template needed no FK denormalization — it has no foreign keys, just enums), both registered in `etrmHandlers.ts` before the generic `crudHandlers()` spread, `AppRouter.tsx` routes (`/pricing/formula-templates`, `/compliance/obligations` — corrected `formula_template`'s stale recorded Hub path from `/pricing/formulas`), and `MasterDataHub.tsx` flips to `live: true`.
  - `regulatory_obligation.reporting_entity_id` (used when `obligation_type = DELEGATED`) resolves against the real `legalEntityStore`/`useLegalEntities()`, not the shadow `legalEntitiesRef` — same discipline as every other new handler this session. `report_type_id` resolves against `regulatory_report_type` (built V70).
  - **Discovered and flagged rather than silently designed: `nomination` and `delivery_instruction` have zero SQL schema anywhere** (`grep -rln "dbo.nomination\b\|dbo.delivery_instruction\b" database/*.sql` returns nothing) — qualitatively different from every other backlog item, which all had real backend intent to build from. Asked the user rather than inventing new schema (consistent with this session's own "research/verify before schema" lesson); user chose to skip both for now. These remain the only two `live: false` items left in the entire 4-group backlog and need a schema-design pass (not just frontend work) before they can be built.
  - Verified via `tsc -b --noEmit` (clean) and a full production `npm run build` (confirmed `FormulaTemplatesPage`/`RegulatoryObligationsPage` compile and code-split correctly).
- **Third full "entity page" group: Logistics assets (`vessel_certificate`, `railcar`, `container`, `tank`, `pipeline_segment`, `pipeline_tariff`) — 6 pages, all under `04_product_spec_mot_pipeline.sql`, no new migration needed.** Same pattern again: `types.ts`/`api.ts`/`hooks.ts`/`Page.tsx`, mock store + `computeXxx()` denormalization, `AppRouter.tsx` route, `MasterDataHub.tsx` flip (all 6 already had the correct path recorded, just needed `live: true`).
  - Consumed FK targets built earlier this session throughout: `transport_operator` (V70) for railcar/container, `storage_facility`+`product` mirrors (V65/V66) for tank, `mot_type` (pre-existing lookup) for vessel type context.
  - Found a genuinely missing concept while building `pipeline_segment`/`pipeline_tariff`: the real backend's `from_point_id`/`to_point_id` reference `dbo.pipeline_point`, a table with **zero frontend representation anywhere** (no page, no mock, not even a lightweight mirror). Rather than inventing a dropdown against a concept that doesn't otherwise exist in this app, modeled both as plain text point codes — flagged in a code comment, same "honest simplification" precedent as other unbuilt-target FKs this session.
  - Verified via `tsc -b --noEmit` (clean) and a full production `npm run build`.
- **Second full "entity page" group: Credit & Collateral (`bank_guarantee`, `insurance_policy`, `margin_account`, `collateral`) — no new migration needed, all four tables already existed in `05_financial_operational_md.sql` with no registry-table involvement (they're full entity pages, not Static Data).** Same pattern as the Counterparty Agreements group: `types.ts`/`api.ts`/`hooks.ts`/`Page.tsx` per entity, mock store + `computeXxx()` denormalization handler pair before `crudHandlers()`, `AppRouter.tsx` route, `MasterDataHub.tsx` flip to `live: true`.
  - `bank_guarantee` models all three parties as existing entities (no new party concept): `issuing_bank_id`/`beneficiary_cp_id` → counterparty, `principal_entity_id` → legal entity. Status lifecycle (DRAFT→ISSUED→...→DISCHARGED/CALLED) handled via the edit drawer's status field, matching the existing `GuaranteeFormDrawer.tsx` PCG pattern (conditional `amountCalled` field only shown when status = CALLED) rather than inventing a new workflow.
  - `insurance_policy` and `margin_account` and `collateral` all resolve FKs against tables built earlier this session (`insurance_provider` from V70, `collateral_type` from V71) via `useTableRows()` — a concrete example of those static tables actually getting consumed, not just existing in isolation.
  - `collateral`'s polymorphic `secured_entity_type`/`secured_entity_id` and `insurance_policy`'s polymorphic `insured_entity_type`/`insured_entity_id` kept as a type enum + plain number ID field (no generic FK dropdown attempted — the target table varies by type, same honest-simplification precedent as other polymorphic fields this session).
  - Verified via `tsc -b --noEmit` (clean) and a full production `npm run build`.
- **V72 — first full "entity page" group from `MasterDataHub.tsx`'s `live: false` backlog: Counterparty Agreements (`credit_term`, `netting_agreement`, `cp_commercial_terms`, `cp_gtc_agreement`).** User approved building out all 4 backlog groups (~21 entities); started with the smallest. Unlike the V65–V71 batches, these are full dedicated feature pages (list grid + drawer form), not simple Static Data tables — except `credit_term`, which turned out to be a reusable reference template (no `counterparty_id` column, same role as `payment_term`) rather than a per-counterparty entity, so it was built as Static Data instead.
  - `netting_agreement`, `cp_commercial_terms`, `cp_gtc_agreement` each got the full stack: `types.ts`/`api.ts`/`hooks.ts`/`Page.tsx` (list + drawer, following `MarginAgreementsPage.tsx`'s exact pattern), a mock store + `computeXxx()` denormalization handler pair registered before the generic `crudHandlers()` spread (same pattern as `computeCreditLimit`), an `AppRouter.tsx` route, and a `MasterDataHub.tsx` `live: false → true` flip with corrected path.
  - Found and reused the established real-vs-shadow-store distinction (previously only documented for legal entities): `etrmHandlers.ts` has its own internal `counterpartiesRef` shadow array (different ids/names than the real counterparty list) used only for unrelated denormalization (broker fee agreements, margin agreements). Exported `cpStore` from `counterpartyHandlers.ts` (previously module-private) so these new handlers denormalize against the real, live counterparty list — the same fix already applied for legal entities via the exported `legalEntityStore`.
  - `cp_gtc_agreement` simplification: the real backend links to `dbo.gtc_version` (a separate versioned-document table, V1), but this frontend's own `Gtc` type already flattens gtc+gtc_version into one row (`version` is a plain string field, no version-history table exists anywhere in the frontend) — linked directly to `gtcId` instead of reintroducing a version table the rest of the app doesn't have.
  - Verified via `tsc -b --noEmit` (clean) and a full production `npm run build` (confirms all three new pages compile and code-split correctly, not just typecheck).
- **V71 — `collateral_type`, `event_category`/`event_type`, `external_system` registered as Static Data.** Continuing the V70 review, five candidate tables had been deliberately excluded from `MasterDataHub.tsx`'s plan (`event_category`, `event_type`, `collateral_type`, `interest_rate_index` [built in V70], `pricing_trigger_event_type`, `external_system`) — investigated why each was left out rather than assuming they were overlooked. Confirmed: `collateral_type` has real seed data (CASH_USD/GOV_US/CORP_IG etc. with `standard_haircut_pct`) and zero frontend references, directly relevant to a known gap (`margin_agreement.eligible_collateral` is free text, not a structured haircut schedule) — built it. `event_category`/`event_type` and `external_system` have real schemas but no consumer built yet (no notification engine, no integrations) — built as plain reference data ahead of those features. **Deliberately excluded `pricing_trigger_event_type`**: traced its actual consumer (`dbo.pricing_window_rule`, V6) and found it has zero frontend representation at all — `PricingRulesPage.tsx`'s real `PricingRule` type is an unrelated, simpler index/differential/formula/TAS/BALMO model with no trigger-event or window-rule concept. Adding the lookup table alone would have been a disconnected orphan pointing at a feature that was never built, not a genuine missing static table — flagged as a bigger "pricing window rule" feature gap instead of forcing it into this batch.
  - Added all three to `MasterDataHub.tsx` (previously absent, not even in the `live: false` backlog) under `Organization & Users` (event_category/event_type/external_system) and `Credit & Collateral` (collateral_type), matching the module groupings of `app_user`/`user_role` and `insurance_provider` respectively.
  - Verified via `tsc -b --noEmit` (clean); V71 migration pair byte-identical.
- **V70 — whole-project master-data review: registered the first batch of genuine Static Data registry orphans (`insurance_provider`, `interest_rate_index`, `regulatory_report_type`, `transport_operator`), fixed a real `lookup_value` backend/frontend registry mismatch, and corrected stale `MasterDataHub.tsx` entries.** User asked for a full project review of what master data is still missing. Three parallel Explore-agent audits covered: (1) a mechanical sweep of every `CREATE TABLE` in `database/*.sql` against every `master_data_table_registry` INSERT, surfacing ~26 candidate orphans; (2) genuine gaps in Oil/Gas/Freight/Carbon/RINs; (3) genuine gaps in Counterparty/Credit/Contracts/Finance/Admin. Before implementing anything, cross-checked the candidate-orphan list against the actual frontend (`find` for dedicated feature pages, and `MasterDataHub.tsx`'s existing `live: true/false` backlog, which turned out to be a far more authoritative source than the SQL-only sweep) — this eliminated the large majority as false positives: `unit_of_measure`, `holiday_calendar`, `exchange`, `price_source`, `mot_type`, `location_type`, `pricing_type`, `inspection_type`, `transport_document_type`, `base_date_event_type`, `business_day_convention_type`, `gl_account`, `carbon_registry`, `emission_scheme`, `environmental_product`, `rin_fuel_category` all already have either a dedicated feature page or a working frontend mock entry (`PARENT_LOOKUP_TABLES`) — only the real backend SQL registry was missing rows for them, which doesn't affect the actual running prototype (100% MSW-mock-driven today). Narrowed to 4 genuine, previously-unbuilt-anywhere tables, all of which independently already appeared in `MasterDataHub.tsx`'s curated `live: false` backlog (confirming they were planned, not overlooked): `insurance_provider`, `interest_rate_index`, `regulatory_report_type`, `transport_operator`. Registered all four (V70, real backend SQL) and built full frontend `TABLE_DEFS`/`registrySeed`/`rowSeed` entries with real seed data drawn from each table's actual SQL `INSERT` statements where available. Added lightweight `counterparty` id/code/name mirror entries (same FK-resolution-only pattern as `product`/`storage_facility` from V65/V66) since `insurance_provider.counterparty_id` and `transport_operator.counterparty_id` needed it.
  - Also fixed a real discrepancy found along the way: V63 added `lookup_value` to the frontend mock's `registrySeed` but never actually inserted the corresponding row into the real backend SQL's `master_data_table_registry` — prototype and intended real schema had quietly diverged.
  - Also corrected `MasterDataHub.tsx`: `generation_asset`/`interconnector` were still marked `live: false` even though V65 registered them as Static Data tables (fixed path to `/static-data/...`, flipped to `live: true`, dropped the stale `kind: 'entity'` tag); `transmission_right_type`'s description still said the old wrong seed data (PTR/ATR) that V65 had already corrected to the real FTR/CRR/TCC; added a missing `power_product_detail` entry (V65 built it, but the Hub file never had a row for it at all).
  - Remaining backlog (not touched this pass, user's call on priority): the other ~30 `MasterDataHub.tsx` `live: false` entries are mostly full entity/CRUD pages (nomination, delivery_instruction, tank, container, railcar, netting_agreement, bank_guarantee, etc.), a materially bigger scope than "static reference table," plus a handful of tables found in the SQL sweep that aren't in the Hub's plan at all (`event_category`, `event_type`, `pricing_trigger_event_type`, `external_system`, `collateral_type`) — flagged as possibly-deliberately-out-of-scope rather than assumed-in-scope.
  - Verified via `tsc -b --noEmit` (clean); V70 migration pair byte-identical.
- **V69 — `commodity_grade_standard` rescoped from `commodity_family_id` to `product_id`; wired into the Trade Blotter to auto-populate price adjustments.** User asked, after V67 shipped: is a grade schedule per commodity or per product, and can the actual delivered grade be captured in the blotter to drive pricing? Researched real practice: CBOT's own rulebook (Chapter 10 Corn, Chapter 14 Wheat) publishes a **separate** grade/class differential schedule per listed contract — Corn's cents-per-bushel schedule is not Wheat's, even though both list under the same GRAINS `commodity_family`. V67's family-level scope was therefore wrong — it implied Corn and Wheat share one schedule. Rescoped the FK to `product_id` (ALTER, backfilled against CBOT-CORN, dropped the old FK/column, matching the established ALTER-not-DROP+CREATE convention). Also researched crude oil's equivalent (pipeline "quality bank" adjustments, computed per-cargo from actual assay vs. reference — RBN Energy/Allocation Specialists LLC methodology) and confirmed that per-trade capture mechanism already exists here (`trade_order_price_adjustment`, V46, `adjustment_type` already includes QUALITY_PREMIUM/QUALITY_DISCOUNT/ASSAY) — what was missing was linking the two. Added a nullable `grade_standard_id` FK on `trade_order_price_adjustment` (NULL for manual/assay-computed adjustments, populated when derived from a published grade standard) and a new `GradeDeliveredSelect` in `TradeBlotter.tsx`'s Price Adjustments section: picking a grade for the order's product auto-adds a price-adjustment row (type/value/currency/UoM from the grade standard, `gradeStandardId` traced via a hidden `Form.Item` matching the existing `tradeId`/`orderId` hidden-field pattern) while manual entry remains fully available for cargo/assay-based adjustments that have no published schedule.
  - Verified via `tsc -b --noEmit` (clean); V69 migration pair byte-identical; no constraint-name collisions.
- **V65–V68 — LNG/Power/Agri/Metals master-data review, researched against real industry structure (GIIGNL LNG terminology, ISO/RTO power market design, USDA grain grading, LME warehouse/brand/warrant conventions) and implemented to fit the existing generic patterns.** User asked to review these four commodity classes' master data specifically and "link them correctly that works for single source of GUI" — i.e. everything should surface through the one generic Tier 2 Static Data screen, not a bespoke one-off UI per table. An Explore-agent audit established ground truth first (what already exists vs. what's genuinely thin), then each gap was closed:
  - **V65 — Power registry orphans (no new schema).** Power turned out to be the most mature of the four (V11/V12/V51: balancing authorities, transmission zones, interconnectors, generation assets, load shapes, transmission rights) but only 3 of 8 real tables were ever registered in `master_data_table_registry` — `interconnector`, `generation_asset`, `power_product_detail`, and `transmission_right_type` had real schemas and seed data but were invisible in the Static Data UI. Registered all four. Deliberately did NOT register `trade_transmission_right_detail` — it's a 1:1 *trade* extension (same family as `trade_swap_detail`/`trade_option_detail`), correctly managed inline from the Trade Blotter, not master data; registering it would have been the same category error in the other direction.
  - **Found and fixed a real, pre-existing frontend bug while wiring this up**: the mock's `transmission_right_type` was a "simple lookup" entry (`PARENT_LOOKUP_TABLES`) with data (FTR/PTR/ATR) that didn't even match the real V12-seeded codes (FTR/CRR/TCC), and the real schema is richer (FK to balancing_authority, two enum columns) than the simple lookup shape supports. Replaced it with a full `TABLE_DEFS` entry matching the real schema and real seed data.
  - **V66 — `lng_terminal_detail`**: new 1:1 extension of `storage_facility` (only populated for `LNG_TANK` rows) — regas send-out capacity (import) or liquefaction nameplate MTPA (export), storage tank/berth count, and min/max cargo-lot size. `storage_facility` itself had no terminal-level capacity concept beyond a single generic `capacity` field.
  - **V67 — `commodity_grade_standard`**: new table for named grade tiers (e.g. USDA No. 2 Yellow Corn) with a flat price adjustment vs. the contract par grade — the genuinely missing piece in Agri master data (quality was already well covered generically via `product_spec_template`/`spec_parameter`, but there was no actual *grade* concept, just loose parameter values). Linked from `commodity_family`, not `product`, since a grade standard is a market-level convention. Deliberately kept separate from the per-parameter spec system to avoid duplicating it.
  - **V68 — `metal_brand`**: new table for an LME-style approved brand register (producer + metal form: cathode/ingot/wire rod/etc., country of origin, approval/delisting date) — replaces the previous boolean-only `LME_BRAND` spec flag, which couldn't represent the real mechanism (a specific producer's brand on a specific form is what's actually deliverable/warrantable, not just "has an LME brand: yes/no").
  - **Cross-store FK-resolution gap found and worked around consistently**: several new FK columns point at tables (`product`, `storage_facility`) that have their own dedicated feature pages with separate mock stores, not present in the generic Static Data mock's `rowSeed` — the same gap `transmission_zone.location_id` had already silently accepted by omission. Added lightweight id/code/name-only mirror entries for `product` and `storage_facility` (metadata + rows, but deliberately **not** added to `registrySeed`, so they resolve FK labels correctly without creating a duplicate products/storage-facilities tab — the dedicated pages remain the single source of truth for editing those records).
  - Verified via `tsc -b --noEmit` (clean) and a full audit of all four new migration files: byte-identical `database/`↔backend pairs, no constraint/index name collisions against the rest of `database/`.
- **Silent-mutation-failure sweep + RolesPage header/loading fix, continuing the GUI audit's punch list.** Added the standard `onError: (e: ProblemDetail) => message.error(...)` pattern (matching `organization/desks/hooks.ts`'s established shape) to every mutation that was missing it: `features/trade/hooks.ts` (all 8 trade/trade-order/trade-item mutations — the busiest module in the app, previously failed completely silently on save/cancel/confirm/delete errors), `admin/roles/hooks.ts` (9 mutations — role CRUD/submit/approve/reject + assignment approve/reject/revoke), and the four one-line reference-data hook files (`reference/currencies`, `reference/incoterms`, `reference/countries`, `reference/uom`).
  - `RolesPage.tsx`: swapped its ad-hoc `<Title>`/`<Text>` header for the shared `PageHeader` component (`moduleGroup="admin"`, matching the pattern used by all 51 other page files); added the missing `loading` prop to the User Assignments tab's table (previously flashed an empty table on load while the Roles tab correctly showed a spinner).
  - Investigated the audit's "several tables lack a custom empty state" finding (`TradeBlotterPage`, `CarbonRegistriesPage`, `LocationsPage`, `RinTransactionsPage`, `ExchangesPage`) and found it was **not actually a gap** — all five use the shared `SmartGrid` component, which already applies a uniform `overlayNoRowsTemplate` ("No records found") to every grid via `AgGridReact`, so they're already consistent with each other; no fix needed.
  - Verified via `tsc -b --noEmit` (clean).
- **Fixed money/date validation gaps in Credit & Risk pages, found via a targeted GUI/validation audit.** User asked for a broader review of missing field validation and UI polish; two Explore-agent audits (validation gaps, GUI/UX consistency) surfaced a prioritized list — user chose to fix the money/date validation gaps first (highest risk since it's financial/risk data). Fixed:
  - `CreditLimitsPage.tsx` — `limitAmount`, `usedAmount`, `collateralOffset`, `tempUpliftAmount`, and the sub-limit list's `subLimitAmount`/`usedAmount` now reject negative values (`min={0}` + a matching Form rule); `effectiveDate`/`expiryDate` now cross-validate (expiry can't be before effective).
  - `MarginAgreementsPage.tsx` — `thresholdAmount`, `cpThresholdAmount`, `mtaAmount`, `roundingAmount`, `independentAmount` all get `min={0}`; `effectiveDate`/`expiryDate` cross-validated the same way.
  - `LettersOfCreditPage.tsx` — `lcAmount`, `drawdownAmount`, `issuedAmount`, `presentationDeadlineDays`, `autoRenewalDays` all get `min={0}`; `issueDate`/`expiryDate` cross-validated. Deliberately did NOT cap `drawdownAmount`/`issuedAmount` against `lcAmount` — the field's own hint text says revolving LCs can have `issuedAmount` exceed face value, so a hard cap would be a wrong constraint.
  - `VesselsPage.tsx` — `guaranteedBoilOffRatePctPerDay` had a `step` but no bounds at all (same bug class as the `versionYear` fix); added `min={0} max={5}` (realistic LNG boil-off range).
  - TS gotcha hit and fixed: adding a literal `min={0}` to a plain (non-generic) `InputNumber` that also has a custom `parser` returning `number` caused TS to infer the component's value type as the literal `0` instead of `number`, conflicting with the parser's return type. Fixed with `min={0 as number}` on the affected instances (in `LettersOfCreditPage.tsx`/`MarginAgreementsPage.tsx`) rather than adding an explicit `<InputNumber<number>>` generic everywhere, to keep the diff minimal.
  - Audit also surfaced (not yet fixed, deferred by user choice): Trade Blotter's ~8 order mutations have zero error feedback (`features/trade/hooks.ts` has no `onError`/`message.error` anywhere); several tables lack custom empty states (`TradeBlotterPage`, `CarbonRegistriesPage`, `LocationsPage`, `RinTransactionsPage`, `ExchangesPage`); `RolesPage.tsx` uses an ad-hoc header instead of the shared `PageHeader` and has an inconsistent `loading` prop between its two tabs' tables. Phone number fields have no format validation anywhere in the app (systemic, not a single-file gap) — noted but not fixed.
  - Verified via `tsc -b --noEmit` (clean).
- **Added missing numeric-range validation for year-like Static Data fields, then upgraded the input to a year-picker calendar.** User flagged `incoterm.versionYear` as unvalidated — the generic Tier 2 form rendered it as a bare `InputNumber` with no bounds, so a user could save `-5`, `3.7`, or `99999` as an Incoterms version year. Added a generic rule (matching the existing `isoRules`/`isCodeColumn` pattern, not a one-off for this table): any `number`-kind column whose name ends in "Year" (`isYearColumn` — catches `versionYear`, and any future `*Year` column added to Static Data without further code changes) gets `min=1900`, `max=currentYear+5`, integer-only, enforced both live and as a submit-time Form rule (`yearRules()`), plus a hint showing the valid range. User then asked for a calendar picker for the same field — replaced the constrained `InputNumber` with antd's `DatePicker` in `picker="year"` mode (a year-grid calendar, not a full date calendar), `disabledDate` enforcing the same min/max bounds; since the stored value is a plain number (e.g. `2020`) not a dayjs object, the `Form.Item` gets conditional `getValueProps`/`normalize` (number ↔ `dayjs(..., 'YYYY')`) only for year columns — the grid/list view is unaffected since it reads the raw stored row value, not the form's display transform. Checked dedicated (non-generic) pages with year fields for the same gap — `TradeBlotter.tsx`'s `rinDetail.vintageYear`/`environmentalDetail.vintageYear` and `RinTransactionsPage.tsx`'s `vintageYear` (a constrained dropdown, not free entry) already had `min`/`max` bounds, so `incoterm.versionYear` was the one real gap; left as plain bounded `InputNumber`/`Select` there rather than converting to a calendar too, since that wasn't asked for. Verified via `tsc -b --noEmit` (clean).
- **Field hints added everywhere they were missing.** First pass added generic, metadata-derived hints (`columnHint()`) to the Tier 2 Static Data admin form (`ReferenceDataTable.tsx`), the one form driven purely by DB-derived metadata rather than hand-written fields. Second pass (user: "still missing for some") audited every remaining dedicated feature form for the `hint()`/`FieldHint` tooltip pattern used across ~30 other pages and found it missing entirely from: `DeskFormDrawer.tsx`, `BookFormDrawer.tsx`, `LegalEntityFormDrawer.tsx`, `GuaranteeFormDrawer.tsx`, `CounterpartyFormPage.tsx`, and all four counterparty child-record sections (`BankAccountsSection`, `TaxRegistrationsSection`, `ContactsSection`, `AddressesSection`) — added hand-authored ETRM-domain hints to the non-obvious fields in each (e.g. LEI Code, parent-company toggles, book type distinctions, guarantor/principal/beneficiary roles, IBAN/SWIFT, KYC status). `GuaranteeFormDrawer.tsx`'s `RoleField` sub-component needed a small structural change (new `hintText` prop, wraps its plain-string `Typography.Text` label with `hint()`) since its label isn't a `Form.Item` label. Only `LoginPage.tsx` (not a domain form) and `ChildRecordSection.tsx` (generic wrapper — renders no labels of its own) remain without hints, correctly. Verified via `tsc -b --noEmit` (clean).
- **Full front/back/SQL/docs review pass — 4 real bugs found and fixed, none by guessing, all via targeted Explore-agent audits + manual verification:**
  1. **V55 `desk.commodity_type` DROP COLUMN without dropping its own CHECK first.** V43/V47 had added `ck_desk_commodity_type`; V55's comment wrongly claimed desk had "no prior CHECK" and dropped the column directly — every sibling table (book/gl_account/trader_commodity_limit) correctly drops its CHECK first. Would fail outright on a real SQL Server run. Fixed by adding `ALTER TABLE dbo.desk DROP CONSTRAINT IF EXISTS ck_desk_commodity_type;` before the `DROP COLUMN`.
  2. **V59 inconsistent idempotency guard**: the `product.commodity_family_id` column-add was guarded (`IF NOT EXISTS ... sys.columns`) but the very next statement, its FK (`fk_product_commodity_family`), wasn't — a rerun would no-op the column and then fail on the FK. Added a matching `IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = ...)` guard.
  3. **`ChildRecordSection.tsx`'s soft-remove-vs-splice check was structurally broken** (predates this session — affects `BankAccountsSection` too, not just the new `TaxRegistrationsSection`): `hasServerId` was `Object.entries(item).some(([k,v]) => k.endsWith('Id') && v !== null)` — every child record has a non-nullable `entityId` (defaults to `0`, ends in "Id"), so this was **always true**, meaning a never-saved record removed before its first Save got soft-deactivated (`isActive:false`) and kept in the array instead of spliced out — on Save this POSTs a brand-new, permanently-inactive orphan row instead of simply not creating anything. Fixed by replacing the heuristic with an explicit `idField` prop naming the record's own real PK (`bankAccountId`/`taxRegId`), checked directly (`item[idField] != null`) instead of guessed by name pattern.
  4. **`LegalEntityFormDrawer.tsx`'s child-record save (`Promise.allSettled`) discarded all results** — unlike `CounterpartyFormPage`'s `useSaveCounterpartyDraft`, which does per-item try/catch and a `message.warning` listing which records failed. A failed address/contact/tax-registration save on a legal entity silently vanished with no user-visible indication. Fixed to match Counterparty's per-item try/catch + warning-toast pattern.
  - Also: handoff doc's §4 table inventory and §13 Flyway history were stale past ~V50 (never updated for V51–V64) — added a scope-note pointer in §4 and backfilled §13's migration table with V51–V64 rows.
  - Confirmed clean (audited, no action needed): all V55–V64 SQL/backend migration pairs byte-identical; no constraint/index naming collisions across the whole `database/` directory; V64's backfill can't leave `classification_type_id` NULL (FK-guaranteed); V62's `SYSTEM_VERSIONING`/`HISTORY_TABLE` wrapping correct for both tables; mock data (`etrmHandlers.ts`, `referenceData.ts`, `counterpartyData.ts`, `data.ts`) has no FK/enum/parentInd inconsistencies or duplicate PKs; `ReferenceDataTable.tsx`'s `fkOptions`/`primaryKeyFieldFor` indexing is correct; `ProductsPage.tsx`'s classification-axis filter has no stale-selection bug (every reopen path resets state via `openAssign()`); `parentInd` clearing (both entities) is correct in both `Switch.onChange` and submit-time payload construction.
  - Verified via `tsc -b --noEmit` (clean, both before and after all fixes).
- **V64 — `dbo.product_reporting_group`: enforce one reporting_group per classification axis per product.** User caught a real gap: V60's `UNIQUE(product_id, reporting_group_id)` only stops the exact same group being attached twice — nothing stopped a product being assigned two different POSITION groups (or two VAR groups) simultaneously, which is meaningless (a product must sit in exactly one bucket per axis). V60's own comment claimed "the UI enforces one active selection per axis in practice" but the UI never actually did this. Fixed at both layers: denormalized `classification_type_id` onto `product_reporting_group` (sourced from `reporting_group.classification_type_id`, backfilled) and added `UNIQUE(product_id, classification_type_id)`; MSW POST handler in `etrmHandlers.ts` now rejects (409) an assignment that would duplicate a product's classification; `ProductsPage.tsx`'s `ReportingGroupsTab` filters the Classification Type dropdown down to axes not yet assigned to the product, with an inline message ("Every classification axis already has a group assigned. Remove one below to reassign it.") when none remain — the existing seed data (7 products, 20 assignments) already happened to respect one-per-axis, so no data fix was needed, only the missing guardrail. Verified via `tsc -b --noEmit` (clean).
- **V63 — `dbo.reporting_group.classification_type` converted from free text to a `dbo.lookup_value` FK; `group_code` dropped.** User: since more reporting axes will likely be added over time, classification_type should be a managed lookup list, not free text (reversing V60's "no fixed vocabulary" choice for this field specifically) — and `group_code` was never actually needed since a product is assigned directly to a named `reporting_group` row (no short code lookup step). Seeded `lookup_value` rows under a new `category = 'REPORTING_CLASSIFICATION_TYPE'` (POSITION/VAR/SETTLEMENT), added `reporting_group.classification_type_id` FK, backfilled, dropped the old `classification_type` and `group_code` columns, renamed the uniqueness constraint to `(classification_type_id, group_name)`.
  - Frontend: this is the **first real usage of `dbo.lookup_value` as a live mock table** — every earlier lookup_value-backed FK in this codebase (V55's commodity_type conversions, etc.) used its own hardcoded id→label array instead (a pre-existing gap noted in the V55/V57 handoff entries); added `lookup_value` as a proper Static Data table (`referenceData.ts` + registry entry) with only the 3 REPORTING_CLASSIFICATION_TYPE rows seeded — does not attempt to backfill every other pre-existing hardcoded lookup array.
  - `ProductsPage.tsx`'s Reporting Groups tab reworked into a **two-step assignment flow**: pick a Classification Type first (from `lookup_value`), then pick a Reporting Group from the list filtered to that type (previously one combined searchable dropdown showing `[TYPE] Name (code)` for every group across all axes at once).
  - Verified via `tsc -b --noEmit` (clean) and headless Chrome: `lookup_value`/`reporting_group` Static Data pages render correctly with resolved FK labels; two-step assignment on ULSD-10PPM correctly excludes already-assigned groups per classification type and offers the remaining ones (Metals Risk Class/Agricultural Risk Class under VaR, with Energy Risk Class correctly excluded since already assigned).
- **V62 — `legal_entity`/`counterparty` parent-company consistency, plus a new `tax_registration` frontend (VAT/organization ID).** User flagged legal_entity as having "something wrong" and asked for a flag deciding whether a parent-company link applies; investigation (via an Explore subagent) found no bad data, just missing safeguards — confirmed via AskUserQuestion before implementing (avoided guessing at an unspecified bug). Added `parent_ind BIT` to both `legal_entity` and `counterparty`, plus CHECK constraints preventing self-parenting and enforcing `parent_ind` agrees with whether the parent FK is populated. `counterparty` had **no parent-company linkage at all** before this (only `is_intercompany`/`internal_entity_id`, a different concept — marks a counterparty as an internal affiliate, not a subsidiary of another counterparty) — added `parent_counterparty_id` as a net-new self-referencing FK. Both tables are system-versioned temporal tables; followed the exact `SET (SYSTEM_VERSIONING = OFF)` → ALTER → `SET (... = ON)` pattern already used for both tables in `17_parent_lookup_tables.sql`.
  - Frontend: `LegalEntityFormDrawer.tsx` and `CounterpartyFormPage.tsx` both got a "Has Parent Entity/Company" `Switch` gating the existing parent `<Select>` (disabled + cleared when off; mirrors the DB CHECK on save).
  - **Separate ask, "add organization id or VAT ID on counterparty" — NOT a new column.** Found `dbo.tax_registration` already exists (V1, `01_master_data_foundation.sql`) as the correct polymorphic home for VAT/tax IDs on both `LEGAL_ENTITY` and `COUNTERPARTY` (`tax_type` already includes `'VAT'`), but was **entirely unbuilt on the frontend** (confirmed via an Explore subagent: no type, no API, no UI — only a `live:false` Master Data Hub placeholder card, same as `bank_account`/`contact`, which stay `live:false` even though fully wired inline — so no registry change needed). Built it properly instead of adding a duplicate flat column: new `TaxRegistrationsSection.tsx` (mirrors `BankAccountsSection.tsx`'s `ChildRecordSection` pattern, polymorphic like `AddressesSection`/`ContactsSection`), new API functions (`fetchEntityTaxRegistrations`/`saveTaxRegistrationAssignment`/`deactivateTaxRegistrationAssignment`), new mock store + MSW handlers, wired into both `CounterpartyFormPage.tsx` (via the existing "draft" save pattern) and `LegalEntityFormDrawer.tsx` (via its direct fetch/save-on-submit pattern) as a new "Tax Registrations" tab. Wired the mock data's existing narrative ("Shell plc — Ultimate parent of Shell Trading International Ltd") into real structure: Shell Trading (`counterpartyId:1`) now has `parentInd:true, parentCounterpartyId:3` (Shell plc) — previously that relationship existed only as a comment, not a link.
  - Verified via `tsc -b --noEmit` (clean) and headless Chrome: ACME-US's parent toggle correctly shows ACME-UK selected and disables/clears the field when toggled off; Shell Trading's parent toggle correctly shows SHELLPLC selected; Tax Registrations tab renders the seeded VAT record (`GB123456789`, HMRC, Primary) with no new console errors (a pre-existing unrelated `useForm not connected` warning was confirmed present before any of this session's interaction, not introduced by it).
- **V61 — reversed part of the V59 design decision: `dbo.commodity_family.family_type` locked to a fixed 9-value list via a CHECK constraint, no longer free text.** V59 deliberately left `family_type` unconstrained (no CHECK, no lookup_value) to avoid a migration per new value. User reconsidered and asked directly whether this specific field should be a closed list — confirmed via AskUserQuestion (offered `family_type` vs `family_name` as the two candidate readings of "family names... not allowed to type random"; user picked `family_type`, since `family_name` is the master row's own defining field and doesn't have a further list to draw from). Added `chk_commodity_family_type CHECK (family_type IN ('CRUDE','REFINED','PETROCHEMICAL','PIPELINE_GAS','LNG','BASE_METAL','PRECIOUS_METAL','GRAIN','ELECTRICITY'))` — the 9 values already seeded in V59, no data change needed. Frontend: changed `familyType`'s column kind from `'string'` to `'enum'` with those 9 `enumValues` in `referenceData.ts` — required **zero new UI code**, since `ReferenceDataTable.tsx`'s generic `fieldControl()` already renders `enum`-kind columns as a `<Select>` (used elsewhere for other CHECK-derived enums). Verified via `tsc -b --noEmit` (clean) and headless Chrome: Family Type field on the Commodity Family edit form now shows a closed 9-option dropdown, no free-text entry possible.
- **Fixed a real, generic gap in the Tier 2 "Static Data" mechanism: foreign-key columns rendered as raw `InputNumber` id inputs, not a dropdown — affecting every registered Static Data table, not just `commodity_family`.** User tried adding a new Commodity Family and immediately hit this — typing a raw `commodityId` integer with no way to know which id maps to which commodity. The metadata contract (`ColumnMetadata.foreignKeyTable`) already existed and was already documented as "so the form can render a searchable lookup instead of a raw integer input" — `ReferenceDataTable.tsx`'s `fieldControl` just never followed through (comment admitted it: "flagged here rather than silently faked"). Fixed in `ReferenceDataTable.tsx`: for any `foreign_key` column, batch-fetches every distinct target table referenced by the current table's columns via `useQueries` (safe because this component remounts per table via `Tier2HomePage`'s `key`), and renders a searchable `<Select>` with options labeled `CODE — Name` (built generically via `fkOptionLabel()`, which looks for the target table's own `*Code`/`*Name` columns case-insensitively, rather than hardcoding a label convention per table). Target row ids initially resolved via a `primaryKeyFieldFor(tableName)` naming-convention guess (`<camelCase table name>Id`) — **this broke on `lookup_value`** (real PK is `lookupId`, not `lookupValueId`) when V63 added it, so a second `useQueries` batch now fetches each FK target's real metadata and reads its actual `primaryKeyColumn` instead of guessing; the naming heuristic is kept only as a fallback if metadata isn't loaded yet. Also fixed the **list/grid view** of the Static Data table itself, which still showed raw FK ids even after the add/edit form was fixed — now resolves via the same `fkOptions` map.
- **Enforced uppercase on code/short-name fields everywhere in master data, not just the two existing ISO sets (currency/country).** User: codes should never be user-typeable in mixed case. `ReferenceDataTable.tsx` already forced uppercase on `ISO_4217_COLS`/`ISO_3166_COLS` only; added a generic `isCodeColumn()` check (any field name ending in `Code`) alongside them, applied in two layers — live uppercase-as-you-type via the `<Input>`'s `onChange`, and a defensive uppercase pass in `handleSave` over the submitted payload (catches paste, IME, or anything that bypasses the keystroke handler — this is the layer that actually matters, verified by typing `test_lower` into Family Code and confirming the saved row shows `TEST_LOWER`). Also applied the same defensive save-time uppercase to `ProductsPage.tsx`'s `productCode` field (was previously CSS-only `textTransform: uppercase` on `BrokerFeeAgreementsPage.tsx`'s similar field elsewhere in the app — visually uppercase but the underlying stored value stayed whatever case was typed; not fixed there this pass, flagged as the same class of bug if it resurfaces).
  - Verified via `tsc -b --noEmit` (clean) and headless Chrome: Commodity Family "Add" form's Commodity field now shows a proper searchable dropdown (`OIL — Oil & Petroleum`, `POWER — Power & Electricity`, etc., 5 options) instead of a bare number input; typed a lowercase Family Code (`test_lower`) and confirmed the saved grid row shows `TEST_LOWER`.
- **V60 — built `dbo.reporting_group` / `dbo.product_reporting_group`: independent per-report classification axes for a product (Position Reporting, VaR/Risk, Settlement/GL), separate from `commodity_family`.** User asked where DIESEL/GASOLINE/LPG/JETFUEL-style groupings belong (answer: these are individual `product` rows under the `REFINED_PRODUCTS` commodity_family, not a new grouping level — `ULSD-10PPM`/`GAS97-BLEND` already exist; LPG/JETFUEL don't have product rows yet, add them the same way), and separately said a product needs *independent* group codes for different reporting contexts — Position Reporting groups Diesel+Gasoline together as "Light Distillates" while VaR groups the same two under a broader "Energy Risk Class" and Settlement/GL groups them by GL posting segment — three genuinely independent axes, not one hierarchy. Asked via AskUserQuestion how to model this: user picked a **generic classification table** over dedicated FK columns per axis (so new axes don't need a new column/migration) or reusing `commodity_family` for everything (rejected — loses the "different group per context" requirement).
  - **`dbo.reporting_group`**: `reporting_group_id, classification_type (plain, unconstrained VARCHAR — e.g. POSITION/VAR/SETTLEMENT, same "no fixed vocabulary" treatment as commodity_family.family_type), group_code, group_name, description, is_active` + audit columns. UNIQUE(classification_type, group_code). Seeded 12 rows across 3 axes (6 POSITION groups, 3 VAR risk classes, 3 SETTLEMENT/GL groups).
  - **`dbo.product_reporting_group`**: bridge table, `product_id -> reporting_group_id`, UNIQUE(product_id, reporting_group_id) — a product can hold multiple groups (one per axis) simultaneously; the UI (not a DB constraint) enforces one selection per axis in practice. Seeded 20 sample assignments across 7 representative products (Brent, WTI, TTF, LME Copper, EEX Power, CBOT Corn, ULSD-10PPM, GAS97-BLEND).
  - Frontend: `reporting_group` added as a new Static Data table (`referenceData.ts` + Master Data Hub card, Products & Markets group) — a generic list managed the same way as `commodity_family`. `product_reporting_group` is a bridge table (not Static Data — same treatment as `product_spec_template`/`product_blend_component`), managed from a new **"Reporting Groups" tab** on the Products page drawer (`ReportingGroupsTab` in `ProductsPage.tsx`): assign/remove a group per product via a searchable `<Select>` (already filters out groups the product is assigned to), grouped visually by classification (color-tagged POSITION/VAR/SETTLEMENT). Added `productReportingGroupApi`/`useProductReportingGroups`/`useAssignReportingGroup`/`useRemoveReportingGroup` following the exact same shape as the existing blend-component/price-index bridge hooks.
  - **Found and fixed a real, pre-existing data bug surfaced by this work**: 8 of the 16 mock `product` rows (TTF-GAS, NBP-GAS, LME-COPPER, LME-ALUMINIUM, EEX-DE-POWER, JKM-LNG, CBOT-CORN, WHEAT-EU) had a `commodityId` FK using the *wrong* id scheme (an old ordering — 1=OIL,2=GAS,3=METALS,4=POWER,5=AGRI — instead of the real `commodity` table's 1=OIL,2=POWER,3=GAS,4=AGRI,5=METALS). This predates this session and was invisible until now because the old `Product.commodityType` string (removed earlier this session, see entry below) was read directly instead of being resolved from `commodityId` — once the grid started deriving the Commodity column from `commodityId` via `resolveCommodityType`, these 8 rows visibly showed the wrong tag (e.g. TTF-GAS showing POWER, LME-COPPER showing GAS). Confirmed via `git show HEAD` this predates the session, and confirmed the real SQL migrations are NOT affected — `24_product_blend_spec_seeds.sql` derives `commodity_id` via `(SELECT commodity_id FROM dbo.commodity WHERE commodity_code = ...)` subqueries, never a hardcoded literal; the bug was frontend-mock-only. Fixed all 8 `commodityId` values in `etrmHandlers.ts`.
  - Verified via `tsc -b --noEmit` (clean) and headless Chrome: Reporting Groups Static Data page renders all 12 seed rows across the 3 axes; Products page's new Reporting Groups tab on ULSD-10PPM correctly shows its 3 seeded assignments (Light Distillates/Energy Risk Class/GL — Energy) with working Assign Group UI; re-verified the Products grid's Commodity column now resolves all 16 rows to the correct commodity (previously 8 were silently wrong).
- **Fixed the `Product.commodityType` duplication flagged (not fixed) in the V59 entry below.** `Product.commodityType` was a frontend-mock-only string that redundantly duplicated the real `Product.commodityId` FK, and was actively read by conditional logic (density/GCV warnings, UoM filtering, `ProductsPage.tsx` grid/filter/form, `SpecsTab`) plus a second consumer, `BrokerFeeAgreementsPage.tsx` (its `filteredProducts` memo filtered `Product[]` by `p.commodityType`). Fix: removed the field from `Product` (`products/types.ts`) and all 16 `productsStore` rows in `etrmHandlers.ts`; added a shared `resolveCommodityType(rows, commodityId)`/`resolveCommodityName(rows, commodityId)` resolver + `CommodityRow` type, exported from `products/types.ts` (not left duplicated locally in `ProductsPage.tsx`, since `BrokerFeeAgreementsPage.tsx` needed the identical logic — extracted once both call sites were confirmed). `ProductsPage.tsx`: grid Commodity column, `filtered` memo, `commodityTypeWatched`, `SpecsTab`'s template/spec-value calls, and the form's Identity section (old raw `commodityId` `InputNumber` replaced with a proper labeled `commodity`-sourced `<Select>`; the separate "Commodity Type" `<Select>` removed entirely) all now derive type from `commodityId` via the resolver instead of a stored duplicate. `BrokerFeeAgreementsPage.tsx`: added `useTableRows('commodity')` and rewired `filteredProducts` to resolve `p.commodityId` the same way — its own `BrokerFeeAgreement.commodityType` field (a `BfaCommodityType`, a different, legitimate per-agreement scoping field, not `Product`'s) was confirmed untouched via full-file read (5 other occurrences all reference the agreement's own field, not `Product`'s). Note: `ProductSpecTemplate.commodityType`/`SpecParameter.commodityType` were also confirmed as legitimately separate (broad scoping fields on different tables, not 1:1 with one product's `commodityId`) and left unchanged. Verified via `tsc -b --noEmit` (clean) and headless Chrome (Products grid renders `commodityId` resolved to OIL/POWER/GAS tags correctly across 48 rows; Broker Fee Agreements grid renders 24 rows with no console/page errors).
- **V59 — built `dbo.commodity_family`, the missing middle tier between `commodity` (sector) and `product` (instrument), and cleaned up two more leftover artifacts on `commodity` surfaced along the way.** User asked to properly normalize `product.product_family` (a raw, unconstrained `VARCHAR(50)` added in migration 23) into a real master table, plus link it correctly and give the family/group its own "type". Researched standard commodity taxonomy first (Hard/Soft commodities, Base/Precious metals, Crude/Refined oil — the UNSPSC Segment/Family/Class/Commodity model) before building:
  1. **New `dbo.commodity_family`**: `commodity_family_id, commodity_id (FK -> commodity), family_code, family_name, family_type, description, is_active` + audit columns. `family_type` is a deliberately plain, unconstrained descriptive column (no CHECK, no lookup_value FK — consistent with this session's "no hardcoded, no generic lookup indirection" direction) holding values like `CRUDE`/`REFINED`/`BASE_METAL`/`PRECIOUS_METAL`/`GRAIN`/`PIPELINE_GAS`/`LNG`/`ELECTRICITY`. Seeded 9 rows spanning the 4 family values actually used in real SQL migrations 23/24 (`CRUDE_OIL`, `NATURAL_GAS`, `BASE_METALS`, `POWER`) plus sensible standard-taxonomy additions (`REFINED_PRODUCTS`, `PETROCHEMICAL`, `LNG`, `PRECIOUS_METALS`, `GRAINS`) matching values already present in the frontend mock.
  2. **`dbo.product.commodity_family_id`** — FK added, backfilled from the old `product_family` string by matching `family_code`, old column dropped.
  3. **Two more duplicate/leftover artifacts found and removed from `dbo.commodity`, prompted by the user directly questioning why `commoditySubtype`/`defaultUomId`/`defaultCurrencyId` existed on it**: verified none of the three were ever real SQL columns on `dbo.commodity` (checked `01_master_data_foundation.sql` and every migration — `commodity` only ever had `commodity_id`/`code`/`name`/`description`/`is_active`; `default_uom_id`/`default_currency_id` are legitimately real, but only on `product`, `market_product`, and `product_spec_template` — never `commodity`) and confirmed nothing outside `referenceData.ts` itself read them. Removed all three from the frontend mock's `commodity` table definition and rowSeed — `commoditySubtype`'s job is now properly done by `commodity_family`; `commodity` is back to being exactly what it's for: the unique list of top-level commodity types this ETRM supports, nothing else.
  4. **Fixed a real, pre-existing bug in the frontend mock's generic "add new row" handler**, `referenceDataHandlers.ts` (confirmed via `git show HEAD` that this predates the session — not something introduced here, but a real gap the user was right to flag): it computed the next id for a newly-added Static Data row as `rows.length + 1` instead of `MAX(existing ids) + 1`. That only worked by coincidence because every table's seed ids happen to be an exact contiguous `1..N` run today — the moment any table's seed has a gap (a removed row, non-sequential seeding), two rows would silently collide on the same id. Fixed to compute the true max id per table via each table's registered `primaryKeyColumn`.
  - Frontend: added `commodity_family` as a new live Static Data table (`referenceData.ts` + Master Data Hub card) and rewired `ProductsPage.tsx`/`features/markets/products/types.ts` — `Product.commodityFamilyId: number | null` replaces the old `productFamily: ProductFamily | null` string; the family `<Select>` now sources `{value: commodityFamilyId, label: familyName}` from `useTableRows('commodity_family')` (same established pattern `GlAccountsPage.tsx` already uses for account types), **filtered to the currently-selected `commodityId`** in the form so a user only sees families that belong to the commodity they picked. Grid column resolves the id to a label via a small `familyLabel()` helper, same shape as the `commodityLabel()` helper built earlier this session for desk/book/gl_account/trader. Updated all 16 mock product rows in `etrmHandlers.ts` from the old family strings to the new numeric ids.
  - Verified via `tsc -b --noEmit` (clean) and headless Chrome: Commodities (5 rows, no leftover fields), Commodity Families (9 rows, all labels render), and Products (all 16 rows resolve to the correct family label — Crude Oil/Refined Products/Petrochemicals/Natural Gas/Liquefied Natural Gas/Base Metals/Grains/Power Generation — checked directly against each row's known commodity, not just spot-checked).
  - **`Product.commodityType` duplication flagged here — fixed in the entry above** (see top of this section).
- **V58 — removed one genuine duplicate reference-data point: `dbo.commodity.commodity_type`.** After the `desk`/`book`/`gl_account`/`trader` fix below, user asked a broader architectural question about commodity_type uniformity and possibly reverting the V55 `lookup_value` FK approach entirely in favour of FK'ing everything to `commodity_id` instead, plus normalizing `product.product_family` into a new `commodity_family` table. Before executing that (large, would have reverted 11 tables), confirmed exactly what V55 had done and hunted for a real duplication rather than guessing: **found exactly one** — `dbo.commodity` has only 5 rows (OIL/POWER/GAS/AGRI/METALS) and *is itself* the master list of commodities, yet its own `commodity_type` column was FK'd to `lookup_value` in V55, which is a strict 1:1 tautology (the OIL commodity row's "type" pointed at a lookup_value row that just says "OIL" again). The other 11 tables converted in V55/V57 (`desk`, `book` incl. `book_type`, `gl_account`, `trader_commodity_limit`, `freight_rate_index`, `laytime_term_template`, `demurrage_dispatch_rate`, `period`, `period_mapping`, `unit_of_measure`, `location_type`) are **not** duplicated — each is a genuine many-to-one categorization (many desks can share one commodity_type) — left untouched, per instruction not to revert those. Fix: dropped `dbo.commodity.commodity_type` (column + FK) entirely — the row's own `commodity_code`/`commodity_name` already fully identify it. Frontend: removed the matching `commodityType` column definition and rowSeed field from `commodity` in `referenceData.ts` (was itself mirroring the same duplication: `commodityCode: 'OIL', ..., commodityType: 1`). Verified via `tsc -b --noEmit` (clean) and headless Chrome (Commodities Static Data page still renders all 5 rows, no errors).
  - **Still open, not yet acted on**: the broader `commodity_family` master-table normalization (replacing `product.product_family`'s raw unconstrained string with a proper FK, mirroring the `product_family` values actually seeded — `CRUDE_OIL`, `NATURAL_GAS`, `BASE_METALS`, `POWER` in real SQL migration 23/24, plus `REFINED_PRODUCTS`/`GRAINS`/`LNG`/`PETROCHEMICAL`/`ELECTRICITY` only in the frontend mock) was raised in the same message but is a separate concern from the duplication fix — not implemented this pass, pending the user confirming they still want it done.
- **Closed the "explicitly deferred" gap from V55: `desk`/`book`/`gl_account`/`trader_commodity_limit` frontend pages now use the numeric `lookup_value` FK id, not the old string code.** These 4 dedicated feature pages (`DesksPage`/`DeskFormDrawer`, `BooksPage`/`BookFormDrawer`, `GlAccountsPage`, `TradersPage` under `features/organization/` and `features/finance/gl-accounts/`) were left on string `commodityType` when V55 converted the real SQL columns to an INT FK — done deliberately at the time due to size, but the user asked to finish it. Audited all 4 areas in full first (via an Explore subagent) rather than guessing, which surfaced the real risk: `CommodityType`/`COMMODITY_TYPES` (the string union) is defined once in `desks/types.ts` and re-used by 7+ *unrelated* pages whose SQL was never converted (`credit-limits`, `products`, `price-indices`, `markets`, `locations`, `uom-conversions`, `trade/positions`) — mutating that shared type in place would have silently broken all of them.
  - Fix: kept `CommodityType`/`COMMODITY_TYPES` completely untouched (still serves the unconverted tables correctly), and added a **new**, separate `COMMODITY_TYPE_LOOKUP` array + `commodityLabel(id)`/`commodityCodeById(id)` helper functions to `desks/types.ts` — a small id→code→label table mirroring the real `lookup_value` seed order (OIL=1 … OTHER=11), since there's still no `lookup_value` mock table in the frontend. Only the 4 target interfaces' fields changed type: `Desk.commodityType`, `Book.commodityType`, `GlAccount.commodityType` → `number | null`; `Trader.commodityTypes` → `number[]`; `TraderCommodityLimit.commodityType` → `number`.
  - Every Select dropdown across the 4 pages now sources `{value: lookupId, label}` from `COMMODITY_TYPE_LOOKUP` instead of `{value: code, label: code}` from `COMMODITY_TYPES` — so the UI still shows "Oil"/"Power"/etc., not raw ids. Every display renderer (grid columns, `Tag`s, the Traders "Trade Limits" hover tooltip) now resolves the id through `commodityLabel()` before rendering; Traders' pre-existing `COMMODITY_COLOR` map (keyed by 5 of the 11 codes, a known pre-existing partial-coverage gap, left as-is) is looked up via `commodityCodeById(id)` first. Preserved each area's existing null-handling convention exactly as found: Desks/Books show a "MULTI" tag on `null`, GL Accounts shows "All". Updated all 4 mock seed stores in `etrmHandlers.ts` (`desksStore`, `booksStore`, `glAccountsStore`, `tradersStore` including nested `commodityLimits`) from string codes to the matching numeric ids.
  - Verified no ripple beyond the 4 areas: grepped for cross-references first (`TradeBlotter.tsx` reads `useDesks`/`useBooks` only for `deskCode`/`bookName` dropdown labels, never `commodityType` — confirmed safe).
  - Verified via headless Chrome: full-page render checks across all 4 pages (labels resolve correctly, no runtime errors); an isolated dropdown-interaction test confirming the Select shows all 11 human labels and correctly redisplays "Oil" after selecting it; a full create→select RINs→save→grid-shows-new-row round trip on Desks. One self-caught test-script false alarm along the way: an unhandled-promise-rejection `PAGE_ERROR` appeared when driving the form via raw `element.value = ...` + a synthetic `dispatchEvent('input')` — that doesn't reliably register with React's controlled-input tracking, so antd's `validateFields()` correctly rejected the (apparently-empty) required text fields; switching to real `page.keyboard.type()` for those unrelated fields fixed it and the round trip then passed cleanly — not a bug in the commodityType change itself.
  - Not touched (pre-existing, unrelated to this fix, not made worse): `Trader`'s `commodityLimits` array still isn't wired into the add/edit form (display-only via the tooltip) — a trader created through the UI still won't get seeded per-commodity limit rows. Also still open, per the V55/V57 scope decisions: `trade`/`location`/`pipeline`/`holiday_calendar`/counterparty-commercial-terms `commodity_type` columns remain on the string representation, untouched.
  - `tsc -b --noEmit` clean throughout.
- **V57 — Market/period master data: lookup FKs (scope-corrected), power hourly granularity, multi-component index sequencing, agri crop-year offset.** User supplied a third reference spec proposing `commodity_type` be converted to a `lookup_value` FK across 7 tables: `market`, `market_product`, `price_source`, `price_index_source`, `market_product_source`, `period`, `period_mapping`. Checked each table directly before writing anything — **only `period` and `period_mapping` actually have a `commodity_type` column.** The other 5 don't, and shouldn't: `market` already has `commodity_id → commodity` (a proper FK); `market_product` and `market_product_source` resolve their commodity via `product.commodity_id`/`market.commodity_id`; `price_index_source` resolves it via `price_index.commodity_id`; `price_source` is deliberately commodity-agnostic (one Bloomberg/Platts feed serves every commodity). Flagged this via AskUserQuestion; user's follow-up ("don't we have a commodity type table and a product table that connects to it — that would be enough to map, no?") confirmed the same conclusion independently — adding a redundant `commodity_type` column to those 5 would have been a denormalization that could drift out of sync with the real `commodity_id` chain. Implemented the corrected scope:
  1. **`period.commodity_type`, `period.load_type`, `period.gas_day_type`** — all three converted from VARCHAR+CHECK to `INT` FK on `lookup_value(lookup_id)` (reusing the `category='commodity_type'` rows seeded in V55; added new `category='load_type'` (5 rows) and `category='gas_day_type'` (4 rows)). This one required recreating **5 indexes** that all included `commodity_type` as a column (`ix_period_comm_type`, `ix_period_dates`, `ix_period_rolling`, `ix_period_trading`, `ix_period_risk`) plus the `uq_period_code_comm` composite UNIQUE — all silently dropped by `DROP COLUMN` and rebuilt after the swap.
  2. **`period.start_time_utc`/`end_time_utc`** (nullable `TIME`) added — `load_type` alone only gives a coarse BASE/PEAK/OFF_PEAK bucket; physical power risk needs exact hour blocks (EEX blocks, PJM hourly nodes, EV charging profiles), which nothing on this table could represent before.
  3. **`period.crop_year_offset_months`** (nullable `TINYINT`) added — `period_type` already had a `CROP_YEAR` value and seeded `AGRI-NEW-CROP`/`AGRI-OLD-CROP` rows, but nothing captured the actual month-offset that defines a crop's marketing year (e.g. US corn/soybean crop year starts September) — a real, previously-unaddressed gap.
  4. **`period_mapping.commodity_type`** converted the same way — required recreating `ix_pm_parent` and the `uq_period_mapping` composite UNIQUE.
  5. **`price_index_source.calculation_sequence`** (`TINYINT NOT NULL DEFAULT 1`) added, for deterministic evaluation order across multi-component/formula indices (e.g. 50% Platts Brent + 50% Argus Brent, or a base index plus a differential). Minor correction to the user's framing: `price_multiplier`/`price_offset` already exist and already support per-source weighting (a `0.5` multiplier already is a 50% weight) — nothing needed to change there, only the missing sequencing column was added.
  - Frontend: this is a real, actively-used feature (`PriceSourcesPage.tsx` / `features/pricing/price-sources/`) — added `calculationSequence` to `PriceIndexSource`/`PriceIndexSourceInput` types, the mock seed (`etrmHandlers.ts`), the index-links table (new "Seq" column), and the add/edit form (required numeric field, default 1). **Correction to what this doc said at the time**: it originally claimed "period/period_mapping/market/etc. have no dedicated frontend page yet" — that was wrong. There IS a real, live page at `/calendar/periods` (`features/calendar/periods/PeriodsPage.tsx`), just registered under a different feature folder than expected, which is why it was missed in the first pass. Caught when the user asked "have you implemented all UI changes for recent changes?" — see the follow-up bullet below for the fix.
- **Follow-up: implemented the missing `PeriodsPage.tsx` UI for V57's `start_time_utc`/`end_time_utc`/`crop_year_offset_months`, after an audit found the gap above.** `PeriodsPage.tsx`'s `Period` type had already diverged from the real SQL `dbo.period` schema before this session (its `PERIOD_TYPES` enum doesn't even match the SQL `period_type` CHECK values) — a pre-existing drift, not something this session caused — but it meant the two capabilities actually requested in V57 (hourly power blocks, agri crop-year) had zero UI. Added `commodityType`/`loadType`/`gasDayType`/`startTimeUtc`/`endTimeUtc`/`cropYearOffsetMonths` to `Period`/`PeriodInput` (`types.ts`), two new illustrative seed rows (`PWR-PEAK-M2026-07` — POWER/PEAK, 07:00–19:00 UTC; `AGRI-CROP-2026` — AGRICULTURAL, crop year starting month 9), and conditional form fields in `PeriodsPage.tsx` (`Form.useWatch('commodityType', ...)`, same pattern as `VesselsPage.tsx`'s conditional dry-bulk/LNG fields): Load Type + Block Start/End only show when commodityType = POWER, Gas Day Type only for GAS, Crop Year Start Month only for AGRICULTURAL. Also asked the user a genuinely open design question first — whether `period`'s power/agri columns should stay flat on the table or move to `period_power_detail`/`period_agri_detail` extension tables matching the `trade`/`trade_oil_detail` polymorphic pattern — and got confirmation to keep them flat, since `period` is a small (~hundreds of rows) reference table with only 4-5 commodity-specific columns, unlike `trade_oil_detail`'s 12+ fields on an unbounded-growth transactional table; `load_type`/`gas_day_type` were already flat on `period` before this session, so this is consistent with the table's own existing convention. Verified via headless Chrome: seed rows render with correct values (07:00 hours, "Month 9"), and the conditional field logic was confirmed correct after two rounds of test-script debugging — the app has 46+ `Drawer`s (many `forceRender`ed), so `document.querySelector('.ant-drawer-body')` kept grabbing an unrelated drawer instead of the Periods one; fixed by scoping to the drawer body that actually contains a temporary debug marker, confirmed the fields toggle correctly, then removed the marker. `tsc -b --noEmit` clean throughout.
  - Verified: `tsc -b --noEmit` clean; headless Chrome confirmed the Price Sources page and its index-links drawer still load with no runtime errors after the type/field addition.
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

**Scope note:** this section's prose was written against the Script 1–9 baseline plus inline V22–V25 annotations and was never updated for V26–V64. For anything added or changed from V26 onward — `reporting_group`/`product_reporting_group`, `commodity_family`, `parent_ind` on `legal_entity`/`counterparty`, `tax_registration`'s frontend build-out, credit/margin/LC tables, carbon/RINs/TAS/BOLMO/BALMO, freight detail tables, field-level permissions, etc. — §13's Flyway history table and §0's session recap are the current source of truth, not the per-table blurbs below.

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
| V51 | `V51__power_nested_shapes_energy_footprints.sql` | **Power nested load shapes + energy footprints**: adds `load_shape_interval` (per-interval weighting, 15/30/60-min granularity) and `load_shape_component` (recursive shape-of-shapes composition, e.g. ATC = PEAK + OFFPEAK, or seasonal solar sub-shapes) under `load_shape_template`; `load_shape_template` gains `interval_minutes` and `is_composite` |
| V52 | `V52__master_data_registry_regroup.sql` | **Registry regroup (data-only)**: UPDATEs `master_data_table_registry.module_group` values so every registered table's Static Data sidebar group matches the Master Data Hub's own group names (`currency`→Finance & Settlement, `commodity`→Products & Markets, `credit_rating`→Counterparties & Agreements, etc.); no schema change |
| V53 | `V53__freight_demurrage_master_data_enhancement.sql` | **Freight/demurrage enhancement**: adds the canonical 11-value `commodity_type` CHECK to `freight_rate_index` (previously none) and corrects its Baltic dry-bulk index seed rows (BDI/BPI/BSI/BHSI) from wrongly-tagged `AGRICULTURAL`-only to NULL (all applicable commodities); adds a Spark30S LNG freight assessment index (LNG previously had no freight benchmark) |
| V54 | `V54__freight_master_data_integrity_constraints.sql` | **Freight integrity constraints**: reviewed against an external reference spec — `charter_party_type` matched exactly; added a CHECK requiring BALTIC/ASSESSED `freight_rate_index` rows to carry currency+UoM (backfilled existing BDTI/BCTI/BDI/BPI/BSI/BHSI/SPARK30S rows accordingly) plus other integrity gaps on `laytime_term_template`/`demurrage_dispatch_rate` |
| V55 | `V55__commodity_type_lookup_fk_refactor.sql` | **commodity_type VARCHAR+CHECK → lookup_value FK, 12 tables**: converts `commodity_type` from a duplicated VARCHAR+CHECK pattern to a single INT FK on `dbo.lookup_value(lookup_id)` across `commodity`, `desk`, `book`, `gl_account`, `trader_commodity_limit`, `freight_rate_index`, `laytime_term_template`, `demurrage_dispatch_rate`, `location_type`, plus others — one managed vocabulary instead of N duplicated CHECK constraints. **Fixed in this pass (this session):** `desk`'s old `ck_desk_commodity_type` CHECK (added V43/V47) was left on the column when V55 first dropped `desk.commodity_type`, which would fail on a real SQL Server run (every sibling table's CHECK is dropped before its column) — the file's own comment wrongly claimed desk had "no prior CHECK"; added the missing `DROP CONSTRAINT IF EXISTS ck_desk_commodity_type` before `DROP COLUMN`, matching book/gl_account/trader_commodity_limit |
| V56 | `V56__fx_period_rate_forward_curve.sql` | **FX forward curve**: adds `dbo.fx_period` (tenor/maturity master, scales to 1000+ forward delivery days without bloating `lookup_value`) linked to a refactored `dbo.fx_rate`; applied via ALTER not DROP+CREATE even though the table has no seed data or frontend usage yet (`live:false` Hub placeholder) — migrations must stay safe against a real populated environment |
| V57 | `V57__period_price_index_source_enhancements.sql` | **Market/period lookup FKs + power/index enhancements**: reviewed an external spec proposing `commodity_type` VARCHAR→FK conversion across 7 market/period tables; found only `period`/`period_mapping` actually have the column (the other 5 correctly resolve commodity via existing FKs — market.commodity_id, product.commodity_id, etc. — so adding a redundant column there was rejected); converts the two real columns; adds power hourly granularity, multi-component index sequencing, and crop-year offset fields |
| V58 | `V58__commodity_type_dedup.sql` | **Removes `dbo.commodity.commodity_type`** — after V55's FK conversion, `commodity`'s own `commodity_type` FK was a strict 1:1 tautology (the OIL commodity row's FK just points at a lookup_value row that says "OIL" again), unlike the other 11 converted tables which are genuine many-to-one categorizations (kept, not reverted) |
| V59 | `V59__commodity_family.sql` | **`dbo.commodity_family`**: new table for a taxonomy layer above individual commodities (Crude/Refined/Petrochemical/Base Metal/etc., `family_type` deliberately left free-text at this point); adds `product.commodity_family_id` FK, replacing the old raw `product_family` string; fixed 8 pre-existing product rows with wrong `commodity_id` values found while wiring this up |
| V60 | `V60__reporting_group.sql` | **`dbo.reporting_group` / `dbo.product_reporting_group`**: independent per-report classification axes for a product (Position Reporting, VaR/Risk, Settlement/GL) — separate from `commodity_family` since the same product groups differently per reporting consumer; generic classification table (not per-axis FK columns) so new axes don't need a migration; seeds 12 rows across 3 axes, 20 sample product assignments |
| V61 | `V61__commodity_family_type_enum.sql` | **Locks `commodity_family.family_type`** to a fixed 9-value CHECK (CRUDE/REFINED/PETROCHEMICAL/PIPELINE_GAS/LNG/BASE_METAL/PRECIOUS_METAL/GRAIN/ELECTRICITY) — reverses V59's deliberate free-text choice for this one field, since users shouldn't be able to type an arbitrary family type |
| V62 | `V62__legal_entity_counterparty_parent_ind.sql` | **`parent_ind` + consistency constraints on `legal_entity`/`counterparty`**: adds `parent_ind BIT` to both (CHECK: flag must agree with whether the parent FK is populated; no self-parenting); `counterparty` gets a net-new `parent_counterparty_id` self-FK (previously had no parent-company concept at all, only the unrelated `is_intercompany` internal-affiliate flag). Both are system-versioned temporal tables — SYSTEM_VERSIONING OFF/ALTER/ON, matching V17's pattern |
| V63 | `V63__reporting_group_classification_lookup.sql` | **`reporting_group.classification_type` → `lookup_value` FK; drops `group_code`**: converts the free-text classification axis (POSITION/VAR/SETTLEMENT) to a managed lookup list (`category='REPORTING_CLASSIFICATION_TYPE'`) since more axes will likely be added over time; `group_code` dropped as unused (a product is assigned directly to a named `reporting_group` row, no short-code lookup step) |
| V64 | `V64__product_reporting_group_one_per_classification.sql` | **One `reporting_group` per classification axis per product**: V60's `UNIQUE(product_id, reporting_group_id)` only stopped the *same* group being attached twice, not two different POSITION (or VAR) groups on one product simultaneously. Denormalizes `classification_type_id` onto `product_reporting_group` (backfilled from `reporting_group`) and adds `UNIQUE(product_id, classification_type_id)`; paired with an MSW 409 rejection and a UI fix (classification dropdown now excludes already-assigned axes) |

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
