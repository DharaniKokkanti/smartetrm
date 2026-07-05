-- =============================================================================
-- V73 — Register fx_rate, settlement_calendar, trade_repository as Static Data
-- =============================================================================
-- Final batch of the MasterDataHub.tsx live:false backlog review. These
-- three are genuinely flat reference/bridge tables (2-3 FKs + a few scalar
-- fields, no real workflow/lifecycle) — unlike bank_guarantee/margin_account
-- /collateral (real status lifecycles) or netting_agreement/cp_commercial_
-- terms (per-relationship agreements), so they fit the generic Static Data
-- mechanism rather than a bespoke page, consistent with insurance_provider/
-- interest_rate_index/regulatory_report_type from V70.
-- fx_rate:             daily FX rate per currency pair (V1)
-- settlement_calendar: bridge — which holiday calendars apply to a product (V1)
-- trade_repository:    approved trade repositories for regulatory reporting (V5)
-- =============================================================================

USE ETRM_DB;
GO

INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES
    ('fx_rate',             'FX Rates',              'Pricing & Rates',                  1, 1, 1, 1, 8, 'SYSTEM', 'SYSTEM'),
    ('settlement_calendar', 'Settlement Calendars',  'Calendar & Periods',                1, 1, 1, 0, 1, 'SYSTEM', 'SYSTEM'),
    ('trade_repository',    'Trade Repositories',    'Sanctions & Regulatory Reporting',  1, 1, 1, 0, 2, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'V73 — FX_RATE / SETTLEMENT_CALENDAR / TRADE_REPOSITORY REGISTERED';
PRINT '============================================================';
GO
