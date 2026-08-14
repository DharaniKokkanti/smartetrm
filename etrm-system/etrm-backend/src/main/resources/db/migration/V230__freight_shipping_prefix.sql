-- V230: Freight & Shipping module_group. freight_rate_index and
-- laytime_exception_type are SYSTEM-locked (allow=0) -> mst_. The other
-- five are business-editable (allow=1) -> ref_. None temporal.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.freight_rate_index', 'mst_freight_rate_index';
GO
EXEC sp_rename 'dbo.laytime_exception_type', 'mst_laytime_exception_type';
GO
EXEC sp_rename 'dbo.charter_party_type', 'ref_charter_party_type';
GO
EXEC sp_rename 'dbo.demurrage_dispatch_rate', 'ref_demurrage_dispatch_rate';
GO
EXEC sp_rename 'dbo.laytime_term_template', 'ref_laytime_term_template';
GO
EXEC sp_rename 'dbo.lng_boil_off_rule', 'ref_lng_boil_off_rule';
GO
EXEC sp_rename 'dbo.lng_terminal_detail', 'ref_lng_terminal_detail';
GO

UPDATE dbo.master_data_table_registry SET table_name = 'mst_freight_rate_index', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'freight_rate_index';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_laytime_exception_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'laytime_exception_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_charter_party_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'charter_party_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_demurrage_dispatch_rate', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'demurrage_dispatch_rate';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_laytime_term_template', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'laytime_term_template';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_lng_boil_off_rule', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'lng_boil_off_rule';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_lng_terminal_detail', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'lng_terminal_detail';
GO
