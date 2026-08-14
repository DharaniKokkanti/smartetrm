-- V227: mst_ prefix, first execution of this category (Dharani, 2026-08-14
-- naming-convention rollout, resumed). Covers the "Reference" and
-- "Sanctions & Regulatory Reporting" module_group batches: physical_asset
-- and regulatory_report_type are both SYSTEM-locked (allow_create/edit/
-- delete = 0), the documented mst_ candidate criterion (MASTER_DATA_
-- ARCHITECTURE.md Sec.8). Neither is a temporal table; no native/raw SQL
-- references either name anywhere in the backend.
--
-- dbo.trade_repository (also in Sanctions & Regulatory Reporting) is
-- deliberately EXCLUDED again, per the same explicit user instruction that
-- excluded it from the V221 Trade Capture tran_ batch.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.physical_asset', 'mst_physical_asset';
GO
EXEC sp_rename 'dbo.regulatory_report_type', 'mst_regulatory_report_type';
GO

UPDATE dbo.master_data_table_registry
SET table_name = 'mst_physical_asset', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1
WHERE table_name = 'physical_asset';
GO
UPDATE dbo.master_data_table_registry
SET table_name = 'mst_regulatory_report_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1
WHERE table_name = 'regulatory_report_type';
GO
