-- =============================================================================
-- V71 — Register event_category/event_type, collateral_type, and
-- external_system as Static Data tables
-- =============================================================================
-- Continuing the whole-project master-data review (V70). These four tables
-- were flagged as candidate orphans but deliberately NOT in MasterDataHub
-- .tsx's planned backlog — investigated why before adding them:
--   - collateral_type: real seed data (CASH_USD, GOV_US, CORP_IG, etc. with
--     standard_haircut_pct), zero frontend references — directly relevant to
--     a known gap (margin_agreement.eligible_collateral is free text, not a
--     structured haircut schedule). Worth adding now.
--   - event_category/event_type: a notification/workflow event catalog
--     (TRADE_CREATED, MARGIN_CALL_ISSUED, severity/SLA) — no notification
--     engine exists yet to consume it, but it's real reference data.
--   - external_system: integration config (Bloomberg, SAP, DTCC GTR) — no
--     integrations built yet to consume it, but real reference data.
-- pricing_trigger_event_type was investigated too and deliberately EXCLUDED
-- here: its actual consumer (dbo.pricing_window_rule, V6) has zero frontend
-- representation at all — PricingRulesPage.tsx's real PricingRule model is
-- an unrelated, simpler index/differential/formula/TAS/BALMO design with no
-- trigger-event or window-rule concept. Adding the lookup table alone would
-- be a disconnected orphan pointing at a feature that was never built,
-- rather than a genuine missing static table.
-- =============================================================================

USE ETRM_DB;
GO

INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES
    ('collateral_type', 'Collateral Types', 'Credit & Collateral',   1, 1, 1, 0, 10, 'SYSTEM', 'SYSTEM'),
    ('event_category',  'Event Categories',  'Organization & Users', 1, 1, 1, 0, 10, 'SYSTEM', 'SYSTEM'),
    ('event_type',      'Event Types',       'Organization & Users', 1, 1, 1, 0, 11, 'SYSTEM', 'SYSTEM'),
    ('external_system', 'External Systems',  'Organization & Users', 1, 1, 1, 0, 12, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'V71 — EVENT/COLLATERAL/EXTERNAL_SYSTEM REGISTRY ORPHANS FIXED';
PRINT '  collateral_type, event_category, event_type, external_system';
PRINT '  now visible in the Static Data screen.';
PRINT '============================================================';
GO
