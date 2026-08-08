-- V207: catalog the 5 margin-call-management tables (V202-V206) in
-- dbo.master_data_table_registry for governance-sweep visibility. Mirrors
-- margin_account's own row: is_enabled=0 for clearing_account and
-- margin_account (both hand-built pages under /credit/*, not generic Tier2
-- Static Data screens); contract_margin_rate/margin_offset_rule/
-- margin_valuation are schema-only with no UI yet (same as margin_call's
-- existing V143 row), so is_enabled=0 with all CRUD/upload flags off too.

USE ETRM_DB;
GO

DECLARE @src TINYINT = (SELECT source_system_id FROM dbo.source_system WHERE source_code = 'TIER1_APPLICATION_SCREEN');
DECLARE @now DATETIME2 = SYSUTCDATETIME();
DECLARE @by VARCHAR(100) = 'flyway_migration';

INSERT INTO dbo.master_data_table_registry
    (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload,
     is_enabled, display_order, sub_group, description, data_category,
     created_at, created_by, updated_at, updated_by, created_src_id, updated_src_id)
VALUES
    ('clearing_account', 'Clearing Account', 'Credit & Collateral', 0, 0, 0, 0,
     0, 910, NULL, 'FCM/clearing-broker-level accounts a legal entity holds margin balances under -- one account can span multiple markets. Hand-built page, not generic Tier2 CRUD.', 'MASTER_DATA',
     @now, @by, @now, @by, @src, @src),
    ('contract_margin_rate', 'Contract Margin Rate', 'Credit & Collateral', 0, 0, 0, 0,
     0, 912, NULL, 'Exchange-published initial/maintenance margin rate per derivative contract spec, effective-dated. Schema-only, no backend CRUD yet.', 'MASTER_DATA',
     @now, @by, @now, @by, @src, @src),
    ('margin_offset_rule', 'Margin Offset Rule', 'Credit & Collateral', 0, 0, 0, 0,
     0, 913, NULL, 'Inter-commodity margin offset/netting rules (spark/dark/crack spreads). Schema-only, no backend CRUD yet.', 'MASTER_DATA',
     @now, @by, @now, @by, @src, @src),
    ('margin_valuation', 'Margin Valuation', 'Credit & Collateral', 0, 0, 0, 0,
     0, 914, NULL, 'Daily/intraday EOD margin computation and FCM-statement-reconciliation run per clearing account. Schema-only, no backend CRUD yet.', 'TRANSACTIONAL',
     @now, @by, @now, @by, @src, @src);
GO
