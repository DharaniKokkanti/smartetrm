-- V249: Dharani confirmed mst_freight_rate_index, mst_holiday, and
-- mst_period_mapping should all be ref_, not mst_. None have a Java entity;
-- freight_rate_index is a real business-editable table (allowCreate=true in
-- the Tier2 catalog), holiday and period_mapping are disabled/schema-only
-- rows that never had CRUD to begin with -- reclassifying regardless per
-- direct instruction.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.mst_freight_rate_index', 'ref_freight_rate_index';
GO
EXEC sp_rename 'dbo.mst_holiday', 'ref_holiday';
GO
EXEC sp_rename 'dbo.mst_period_mapping', 'ref_period_mapping';
GO

UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_freight_rate_index', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_freight_rate_index';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_holiday', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_holiday';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_period_mapping', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_period_mapping';
GO
