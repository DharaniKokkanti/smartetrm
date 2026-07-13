# Pending Project — Lock down SYSTEM-only static/reference tables

**Status: not started — identification only, nothing applied yet.**

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

## Known scope gap — needs separate follow-up work

`country`, `unit_of_measure`, `exchange`, `holiday_calendar`,
`payment_term` are **not in `master_data_table_registry` at all**:

- `exchange`, `holiday_calendar`, `payment_term` have their own dedicated
  Tier 1 pages/controllers — the registry lock mechanism doesn't cover
  them. Locking these down (if desired) means auditing each dedicated
  controller individually, not a registry-flag change.
- `country`, `unit_of_measure` have no CRUD surface at all currently
  (referenced only as dropdown data sourced from elsewhere).

## Next steps when this gets picked up

1. Confirm/adjust the lock list above with the user.
2. Write a new migration (next available `VNN`) that `UPDATE`s
   `master_data_table_registry` setting the three flags to 0 for the
   agreed table list.
3. Decide whether the `country`/`unit_of_measure`/`exchange`/
   `holiday_calendar`/`payment_term` gap is in scope for the same pass or
   deferred further.
4. Verify: confirm the frontend's generic Tier 2 screen actually hides/
   disables the Create/Edit/Delete controls for locked tables (it already
   reads `allow_create`/`allow_edit`/`allow_delete` per the registry
   response — should just work, but verify live, not just assume).
