-- =============================================================================
-- V157 — lock down SYSTEM-only static/reference tables
--
-- Executes docs/masterdata_pending_project_01.md's proposed lock list: sets
-- allow_create=0, allow_edit=0, allow_delete=0 on every table that is either
-- an ISO/external standard code, internal enum vocabulary the app's own
-- logic keys off, an externally-standardized named registry, or a
-- structural table backing generic dropdowns. From now on, only Flyway
-- migrations (created_by/updated_by = 'SYSTEM') should ever change these
-- rows — not even an admin through the generic Tier 2 screen.
--
-- Scope decision (2026-07-23, confirmed with user): lookup_value,
-- lookup_category, and lookup_category_binding are DELIBERATELY EXCLUDED
-- from this pass, despite being in the original doc's "structural" bucket.
-- lookup_value is a single flat table shared across every lookup category
-- app-wide (category, code) with no per-category lock granularity today —
-- locking it at the table level would block admins from ever adding a new
-- row to ANY category through Static Data, including legitimately-editable
-- ones (e.g. gl_account_type). Revisit only once/if a per-category lock
-- mechanism exists (e.g. an is_locked flag on lookup_category, enforced in
-- the lookup_value CRUD path) — not attempted here, that's materially
-- larger scope than a registry-flag lock-down.
--
-- All 51 table names below were confirmed live against master_data_table_registry
-- before writing this migration (registry_id present, all currently
-- allow_create=1/allow_edit=1) — not assumed from the pending doc's text.
-- =============================================================================

USE ETRM_DB;
GO

UPDATE dbo.master_data_table_registry
SET allow_create = 0,
    allow_edit = 0,
    allow_delete = 0,
    notes = COALESCE(notes + ' ', '') + 'Locked SYSTEM-only by V157 (2026-07-23) — see docs/masterdata_pending_project_01.md.',
    row_version = row_version + 1
WHERE table_name IN (
    -- ISO / external standard codes
    'currency', 'incoterm', 'credit_rating', 'mot_type',
    -- Internal enum vocab the app's own logic keys off
    'uom_type', 'deal_type', 'settlement_type', 'commodity_type',
    'payment_method', 'transport_document_type', 'counterparty_type',
    'kyc_status', 'netting_agreement_type', 'address_type',
    'bank_account_type', 'margin_agreement_type',
    'valuation_frequency_type', 'governing_law_type', 'credit_limit_type',
    'credit_limit_status_type', 'lc_type', 'lc_status_type', 'tax_type',
    'collateral_type', 'storage_facility_type', 'location_type',
    'inspection_type', 'contact_role', 'book_type', 'legal_entity_type',
    'event_category', 'event_type', 'transmission_right_type', 'fx_period',
    'pricing_type', 'metal_shape', 'laytime_exception_type',
    'power_ancillary_service_type', 'emission_scheme_type',
    'carbon_registry_type', 'environmental_product_type',
    'emission_obligation_status', 'regulatory_report_type',
    -- Externally standardized named registries
    'interest_rate_index', 'balancing_authority', 'power_pnode',
    'metal_brand', 'trade_repository', 'freight_rate_index',
    -- Structural tables (excluding lookup_value/lookup_category/lookup_category_binding — see note above)
    'commodity', 'commodity_family', 'reporting_group'
);

PRINT '============================================================';
PRINT 'V157 APPLIED — ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' tables locked SYSTEM-only (create/edit/delete disabled).';
GO
