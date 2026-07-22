# Pending Project — Dedicated (non-Tier2) master-data governance gap

> **Persona for this doc:** You are an ETRM master-data governance expert — apply that expertise when auditing dedicated (non-Tier2) entities for the same audit-column/optimistic-locking shape enforced everywhere else on this platform.

**Status: RESOLVED (2026-07-21, V144-V151).** All 80 tables fixed — see the
handoff doc's §0 "2026-07-21 — Dedicated-entity governance-column sweep"
entry for the full record (8 parallel batches, migrations V144-V151, live
JUnit + curl verification). Kept below for historical reference on how the
gap was found and classified. Two corrections vs. the original writeup:
the row_version count was **17**, not 15 (`balmo_product` and
`pipeline_operator_agreement` were missed in the original tally); 11 of the
80 tables turned out to have no backing Java entity at all (schema-only
fixes) — full list in the handoff doc entry.

## What this is

V136 (row_version) and V137 (audit columns) governance audits both scoped
themselves to `dbo.master_data_table_registry` only — the ~107 tables
reachable through the generic Tier 2 CRUD grid. That's why both kept
missing real gaps on **dedicated** (non-Tier2) tables: `gl_account` (found
and fixed 2026-07-21) and `storage_facility` (found the same session, not
yet fixed) both have real, user-facing CRUD via their own dedicated
Spring controllers, but neither was ever in the registry, so neither was
ever checked.

## What V143 already did

Added `data_category` to `master_data_table_registry`
(`MASTER_CONFIG`/`MASTER_DATA`/`TRANSACTIONAL`/`DERIVED`) and backfilled a
catalog-only row (`is_enabled=0`, `allow_create/edit/delete/excel_upload=0`
— invisible on the Static Data page, exists purely for governance queries)
for all 186 tables that were previously uncataloged entirely. Classified
via a code-derived heuristic: real `@PostMapping`/`@PutMapping` presence in
the entity's own dedicated controller, plus naming convention for
event/junction/history-shaped tables. First-pass, not a manual table-by-
table review — a few boundary calls (e.g. `document_store`,
`credit_limit_alert` vs `collateral`) are judgment calls, not verified
facts, and can be corrected with a simple `UPDATE` later with zero
functional impact (these rows don't drive any live behavior).

## The confirmed gap

Querying `WHERE data_category = 'MASTER_DATA' AND is_enabled = 0` (i.e.
real dedicated master-data tables, judgment calls aside) cross-referenced
against `sys.columns` found **80 tables** with a partial or total gap in
`created_at`/`created_by`/`updated_at`/`updated_by`, and of those, **15
also have zero `row_version`** (`custom_field_definition`, `document_store`,
`formula_component`, `holiday`, `insurance_policy_coverage`,
`interest_rate`, `market_hours`, `missing_fixing_rule`,
`pricing_trigger_event_type`, `pricing_trigger_product`,
`pricing_window_rule`, `rate_fixing`, `reporting_counterparty`,
`spec_override`, `tank_calibration`).

Full 80-table list (has_created_at / has_created_by / has_updated_at /
has_updated_by / has_row_version), most common shape is
`1/0/0/0` or `1/1/0/0` (had create-side columns from earlier work, never
got update-side — same shape as the V137 7-table group):

```
app_function, app_module, balmo_product, book_access_grant,
book_classification, book_ownership, book_trader, broker,
broker_fee_agreement, calendar_holiday, carbon_registry, container,
country, cp_gtc_agreement, credit_limit, credit_limit_line_item,
custom_field_definition, document_store, emission_obligation,
emission_scheme, environmental_product, field_permission_rule,
formula_component, formula_template, gtc, gtc_version, holiday,
holiday_calendar, insurance_policy_coverage, interest_rate,
legal_entity_ownership, letter_of_credit, location, margin_account,
margin_agreement, market_hours, market_product, market_product_period,
market_product_source, missing_fixing_rule, mot_asset_product_approval,
netting_agreement, object_lock_rule, payment_term, period, pipeline_cycle,
pipeline_operator_agreement, pipeline_point, pipeline_segment,
pipeline_tariff, price_index, price_index_source, pricing_trigger_event_type,
pricing_trigger_product, pricing_window_rule, product_blend_component,
product_price_index, product_spec_value, railcar, rate_fixing,
regulatory_obligation, reporting_counterparty, rin_account,
rin_fuel_category, rin_obligation, role_field_profile, role_function,
screen_field_registry, settlement_price, spec_override, spec_parameter,
storage_facility, tank_calibration, trader_commodity_limit,
transport_route, truck, unit_of_measure, uom_conversion,
user_role_assignment, vessel_certificate
```

## Why this is bigger than V137

V137 fixed 29 Tier2 tables with a **schema-only** migration — the generic
`ReferenceDataCrudService` already introspects live column metadata and
populates `created_by`/`updated_by`/`updated_at` automatically whenever the
column exists, so zero backend code changed.

These 80 are **dedicated** entities — each needs its own
`@CreatedDate`/`@CreatedBy`/`@LastModifiedDate`/`@LastModifiedBy` +
`@EntityListeners(AuditingEntityListener.class)` added to its individual
Java entity class, plus (per the `NettingAgreement`/`MarginAccount`
precedent) each service's `update()` method needs to preserve
`createdAt`/`createdBy` from the existing row. That's a real Java change
times 80 entities, not one migration — the same shape as today's
`gl_account`/`GlAccount.java` fix, repeated 80 times, plus 15 of those also
need `@Version row_version` wired in (the `GlAccount`/`MarginAccount`
V127-133 pattern).

## Next steps when this gets picked up

1. Confirm the ~15-20 borderline `data_category` calls noted above are
   correctly tagged (quick manual pass, not a blocker to starting).
2. Batch the 80 tables into manageable migration + entity-fix passes
   (mirroring V127-136's own phased rollout) rather than one giant change —
   real risk of Hibernate validation or JUnit fallout if rushed.
3. Live-verify each batch the same way `gl_account` was verified this
   session: migrate, `mvn compile`, boot against the real DB, curl
   create/update proof, not just schema-level trust.
4. `storage_facility` is the best first candidate — already confirmed as a
   live, real CRUD gap (`StoragePage.tsx` + `StorageFacilityController`),
   same shape as `gl_account`, good template for the rest.
