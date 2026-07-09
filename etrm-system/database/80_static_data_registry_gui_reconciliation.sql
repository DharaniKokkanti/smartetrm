-- =============================================================================
-- V80 — Static Data registry ↔ GUI reconciliation
-- =============================================================================
-- User asked for a review of static data table references that are wrong or
-- missing "with GUI". A full cross-reference of every master_data_table_registry
-- row against every real dbo.* table and against MasterDataHub.tsx (the
-- frontend's sidebar/hub listing of every static/master data table) found
-- two genuinely wrong mismatches, both fixed here:
--
-- 1. Five tables are already presented in MasterDataHub.tsx as live,
--    working generic Static Data pages (`path: '/static-data/<name>',
--    live: true`) but were never actually registered in
--    master_data_table_registry — ReferenceDataController.requireRegistered()
--    404s any table name not present here, so these five would break the
--    moment the real backend (not the MSW mock) served them:
--    mot_type, location_type, pricing_type, inspection_type,
--    transport_document_type. All five tables themselves already exist
--    (mot_type: 04_product_spec_mot_pipeline.sql; location_type,
--    pricing_type: 01_master_data_foundation.sql; inspection_type,
--    transport_document_type: 04_product_spec_mot_pipeline.sql) — this migration
--    only adds the missing registry rows, no new tables.
--
-- 2. The inverse — seven tables ARE registered here (and in the frontend
--    mock's registrySeed) but have zero entry in MasterDataHub.tsx, so a
--    user has no way to discover or navigate to them at all: address_type,
--    bank_account_type, tax_type, commodity_grade_standard,
--    lng_terminal_detail, metal_brand, lookup_value. That half of the fix is
--    frontend-only (MasterDataHub.tsx) — nothing to do here in SQL, noted
--    for completeness.
-- =============================================================================

USE ETRM_DB;
GO

INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
SELECT v.table_name, v.display_name, v.module_group, v.allow_create, v.allow_edit, v.allow_delete, v.allow_excel_upload, v.display_order, 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('mot_type',                'Modes of Transport',      'Logistics & Delivery', 1, 1, 0, 0, 10),
    ('location_type',           'Location Types',          'Logistics & Delivery', 1, 1, 0, 0, 11),
    ('inspection_type',         'Inspection Types',        'Logistics & Delivery', 1, 1, 0, 0, 12),
    ('pricing_type',            'Pricing Types',            'Pricing & Rates',      1, 1, 0, 0, 8),
    ('transport_document_type', 'Transport Doc Types',      'Contract & Legal',     1, 1, 0, 0, 4)
) AS v(table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.master_data_table_registry r WHERE r.table_name = v.table_name
);
GO

PRINT '============================================================';
PRINT 'V80 — STATIC DATA REGISTRY / GUI RECONCILIATION';
PRINT '  5 registry rows added for tables already live in the GUI:';
PRINT '  mot_type, location_type, inspection_type, pricing_type,';
PRINT '  transport_document_type.';
PRINT '  (7 already-registered tables with no GUI entry point fixed';
PRINT '  frontend-only in MasterDataHub.tsx — no SQL change needed.)';
PRINT '============================================================';
GO
