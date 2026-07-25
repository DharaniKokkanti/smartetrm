# Pending Project — Lock down SYSTEM-only static/reference tables

> **Persona for this doc:** You are an ETRM master-data governance expert — apply that expertise to correctly scope which static/reference tables are SYSTEM-only vs. genuinely user-editable in a multi-commodity trading platform.

**Status: DONE for the registry-flag lock-down (2026-07-23, V157) — 52 tables locked (the original ~38-table list plus a few discovered at the same names during live verification). `lookup_value`/`lookup_category`/`lookup_category_binding` deliberately excluded from this pass — see note below. The `country`/`unit_of_measure`/`exchange`/`holiday_calendar`/`payment_term` scope gap is now also DONE (2026-07-25, V158, RBAC path — see addendum below), not via the registry-flag mechanism.**

**2026-07-25 addendum — `country`/`unit_of_measure`/`exchange`/`holiday_calendar`/`payment_term` gap closed via RBAC, not registry flags.** Investigated first, since the premise below turned out to be partly stale: all 5 tables were already inserted into `master_data_table_registry` by `V143` as inert catalog rows (`is_enabled=0`, all 3 write flags `=0`) — but that's irrelevant, because none of the 5 route through the registry-gated generic Tier2 screen (`ReferenceDataController`) at all. Each has its own dedicated Tier 1 controller (`ExchangeController`, `HolidayCalendarController`, `PaymentTermController`, `CountryController`, `UnitOfMeasureController`) with full live CRUD, gated only by the same broad `PERM_MD_CREATE_WRITE`/`PERM_MD_EDIT_WRITE`/`PERM_MD_DELETE_WRITE` authorities used for legal entities, books, vessels, etc. — so a registry-flag fix would have been a no-op. Also corrected: `country` and `unit_of_measure` were assumed read-only in this doc's original text below; both actually have live full-CRUD UIs (`CountriesPage.tsx`, `UomPage.tsx`), same risk profile as the other three.

**Fix (V158)**: added 3 new function codes under the existing `MASTER_DATA` module — `MD_REFDATA_CREATE`/`MD_REFDATA_EDIT`/`MD_REFDATA_DELETE` → authorities `PERM_MD_REFDATA_*_WRITE` — granted to **ADMIN only** (confirmed with user; OPERATIONS keeps write on every other master-data table via its existing `MD_CREATE`/`MD_EDIT`/`MD_DELETE` grant, but loses write specifically on these 5). View stays on the existing `PERM_MD_VIEW`, unchanged. `SecurityConfig.java` updated in the same change: the 5 controllers' POST/PUT/PATCH/DELETE paths were pulled out of the broad `PERM_MD_*_WRITE` matcher arrays into new matcher blocks placed before them (first-match-wins), gated by the new authorities. No controller code changes needed — this codebase's RBAC enforcement is centralized entirely in `SecurityConfig.java`, no `@PreAuthorize` anywhere in these 5 controllers.

**Live-verified**: applied via real `mvn spring-boot:run` (Docker daemon had stopped, relaunched first) — `now at version v158`, zero Hibernate validation errors on boot. Direct `sqlcmd` query confirmed exactly 3 rows in `role_function` for the new codes, all `ADMIN`/`READ_WRITE`, zero `OPERATIONS` rows. `curl` against all 5 endpoints' POST routes returned `403` (consistent with the auth filter firing before route resolution — same caveat V157's verification noted, doesn't independently prove routing correctness, which is instead confirmed by the clean Maven compile + successful boot). Backend stopped after verification; SQL Server container left running.

**2026-07-23 addendum — `lookup_value` scope decision:** the original "Structural tables" bucket below proposed locking `lookup_value` itself. Confirmed with the user this would be wrong to do as-is: `lookup_value` is a single flat `(category, code)` table shared across every lookup category app-wide, with no per-category lock granularity — locking it at the table level would block admins from ever adding a new row to ANY category (including legitimately-editable ones like `gl_account_type`). Excluded from V157; would need a per-category mechanism (e.g. an `is_locked` flag on `lookup_category`, enforced in the `lookup_value` CRUD path) before this table could be locked safely — not attempted here.

## What this is

`master_data_table_registry` already has `allow_create` / `allow_edit` /
`allow_delete` columns, and they are genuinely enforced server-side (not
just hidden UI buttons) in
[`ReferenceDataController.java`](../etrm-backend/src/main/java/com/etrm/system/referencedata/ReferenceDataController.java#L72-L96)
— every create/update/delete request checks the flag before touching the
DB. Right now **all 81 registered tables default to
`allow_create=1, allow_edit=1`**, so nothing is actually locked.

The ask: identify which of those tables are pure classification/enum
vocabulary or externally-standardized codes that nobody — not even an
admin — should be able to create/edit/delete through the generic Tier 2
screen. Only Flyway migrations (`created_by`/`updated_by = 'SYSTEM'`)
should ever change these rows.

## Proposed lock list (~38 of 81 registered tables)

Set `allow_create=0, allow_edit=0, allow_delete=0` for:

**ISO / external standard codes**
`currency`, `incoterm`, `credit_rating`, `mot_type`

**Internal enum vocab the app's own logic keys off**
`uom_type`, `deal_type`, `settlement_type`, `commodity_type`,
`payment_method`, `transport_document_type`, `counterparty_type`,
`kyc_status`, `netting_agreement_type`, `address_type`,
`bank_account_type`, `margin_agreement_type`,
`valuation_frequency_type`, `governing_law_type`, `credit_limit_type`,
`credit_limit_status_type`, `lc_type`, `lc_status_type`, `tax_type`,
`collateral_type`, `storage_facility_type`, `location_type`,
`inspection_type`, `contact_role`, `book_type`, `legal_entity_type`,
`event_category`, `event_type`, `transmission_right_type`, `fx_period`,
`pricing_type`, `metal_shape`, `laytime_exception_type`,
`power_ancillary_service_type`, `emission_scheme_type`,
`carbon_registry_type`, `environmental_product_type`,
`emission_obligation_status`, `regulatory_report_type`

**Externally standardized named registries**
`interest_rate_index`, `balancing_authority`, `power_pnode`,
`metal_brand`, `trade_repository`, `freight_rate_index`

**Structural tables that back every generic dropdown**
`lookup_category`, `lookup_value`, `commodity`, `commodity_family`,
`reporting_group`

## Leave editable (the other ~43)

Real named business registries admins legitimately grow
(`insurance_provider`, `transport_operator`, `external_system`,
`generation_asset`, `interconnector`), actual rates/rules/templates that
change over time (`demurrage_dispatch_rate`, `laytime_term_template`,
`load_shape_template`, `metal_assay_component_rule`,
`agri_moisture_discount_scale`), live market data (`fx_rate` — not
reference data at all), and counterparty-specific config
(`settlement_calendar`, `credit_term`, `intercompany_transfer_rule`).

## Known scope gap — RESOLVED 2026-07-25 (V158), see addendum above

**Stale as of 2026-07-25 — kept below verbatim for historical context only.** The claim that these 5 tables are "not in `master_data_table_registry` at all" was wrong (they're inert `is_enabled=0` catalog rows since V143) and `country`/`unit_of_measure` are not read-only-with-no-CRUD-surface (both have live full-CRUD pages). The actual gap — no lock analogous to V157 for any of these 5 dedicated-controller tables — was closed via a narrower RBAC permission (`MD_REFDATA_CREATE`/`_EDIT`/`_DELETE`, ADMIN-only), not a registry-flag change. See the 2026-07-25 addendum above for the real mechanism and live verification.

<details>
<summary>Original (stale) text</summary>

`country`, `unit_of_measure`, `exchange`, `holiday_calendar`,
`payment_term` are **not in `master_data_table_registry` at all**:

- `exchange`, `holiday_calendar`, `payment_term` have their own dedicated
  Tier 1 pages/controllers — the registry lock mechanism doesn't cover
  them. Locking these down (if desired) means auditing each dedicated
  controller individually, not a registry-flag change.
- `country`, `unit_of_measure` have no CRUD surface at all currently
  (referenced only as dropdown data sourced from elsewhere).

</details>

## Next steps

Nothing outstanding from this doc. `lookup_value`/`lookup_category` per-category
locking (noted in the 2026-07-23 addendum above) remains the only known open
thread if picked up later — would need a new `is_locked` mechanism on
`lookup_category`, not attempted here.
