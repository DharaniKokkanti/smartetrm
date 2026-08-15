-- V248: carbon_registry_type is a type-lookup table (type_code/type_name)
-- referenced by carbon_registry.registry_type. Dharani confirmed it should
-- be ref_, not mst_.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.mst_carbon_registry_type', 'ref_carbon_registry_type';
GO

UPDATE dbo.sys_master_data_table_registry
SET table_name = 'ref_carbon_registry_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1
WHERE table_name = 'mst_carbon_registry_type';
GO
