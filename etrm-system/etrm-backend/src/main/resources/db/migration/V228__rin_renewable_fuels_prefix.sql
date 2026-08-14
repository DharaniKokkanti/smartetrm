-- V228: RIN & Renewable Fuels module_group. rin_account, rin_fuel_category,
-- rin_obligation are SYSTEM-locked (allow_create/edit/delete = 0) -> mst_.
-- rin_transaction is data_category = TRANSACTIONAL: real business events
-- (RIN credit generation/purchase/sale/retirement under EPA RFS), the
-- tran_ criterion, not reference or master data. None temporal; FKs bind
-- by object_id so sp_rename is safe for all four.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.rin_account', 'mst_rin_account';
GO
EXEC sp_rename 'dbo.rin_fuel_category', 'mst_rin_fuel_category';
GO
EXEC sp_rename 'dbo.rin_obligation', 'mst_rin_obligation';
GO
EXEC sp_rename 'dbo.rin_transaction', 'tran_rin_transaction';
GO

UPDATE dbo.master_data_table_registry SET table_name = 'mst_rin_account', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'rin_account';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_rin_fuel_category', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'rin_fuel_category';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_rin_obligation', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'rin_obligation';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'tran_rin_transaction', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'rin_transaction';
GO
