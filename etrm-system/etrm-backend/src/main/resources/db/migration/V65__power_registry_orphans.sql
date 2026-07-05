-- =============================================================================
-- V65 — Register orphaned Power master data tables in master_data_table_registry
-- =============================================================================
-- User asked for a review of LNG/Power/Agri/Metals master data, comparing
-- against real industry structure, and to "link them correctly that works
-- for single source of GUI" (the generic Tier 2 Static Data screen driven by
-- master_data_table_registry). Auditing the existing V11/V12 power schema
-- found it was already the most complete of the four commodity classes
-- (balancing authorities, transmission zones, interconnectors, generation
-- assets, load shapes, transmission rights) — but only 3 of its 8 tables
-- were ever registered (load_shape_template, balancing_authority,
-- transmission_zone in V14; load_shape_interval/load_shape_component/
-- energy_footprint/energy_footprint_site added in V51). `interconnector`,
-- `generation_asset`, `power_product_detail`, and `transmission_right_type`
-- have real schemas and seed data but are invisible in the Static Data UI —
-- a pure "link it correctly" gap, no new schema needed.
--
-- Deliberately NOT registered here: `trade_transmission_right_detail`. It's
-- a 1:1 *trade* extension (PK = trade_id, FK to dbo.trade), the same family
-- as trade_swap_detail/trade_option_detail (V44) — those are correctly never
-- registered as Static Data since they're per-trade data managed inline from
-- the Trade Blotter, not master/reference data. Registering it here would
-- have been the same category error the audit was checking for, just in the
-- other direction.
-- =============================================================================

USE ETRM_DB;
GO

INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES
    ('interconnector',        'Interconnectors',         'Power & Energy', 1, 1, 1, 0, 4, 'SYSTEM', 'SYSTEM'),
    ('generation_asset',      'Generation Assets',       'Power & Energy', 1, 1, 1, 0, 5, 'SYSTEM', 'SYSTEM'),
    ('power_product_detail',  'Power Product Detail',    'Power & Energy', 1, 1, 1, 0, 6, 'SYSTEM', 'SYSTEM'),
    ('transmission_right_type', 'Transmission Right Types', 'Power & Energy', 1, 1, 0, 0, 7, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'V65 — POWER REGISTRY ORPHANS FIXED';
PRINT '  interconnector, generation_asset, power_product_detail, transmission_right_type';
PRINT '  now visible in the Static Data screen under Power & Energy.';
PRINT '============================================================';
GO
