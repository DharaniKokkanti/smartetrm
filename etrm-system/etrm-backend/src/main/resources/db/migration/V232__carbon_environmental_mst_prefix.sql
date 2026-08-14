-- V232: Carbon & Environmental module_group -- all 8 tables are
-- SYSTEM-locked (allow_create/edit/delete = 0) -> mst_. None temporal.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.carbon_registry', 'mst_carbon_registry';
GO
EXEC sp_rename 'dbo.carbon_registry_type', 'mst_carbon_registry_type';
GO
EXEC sp_rename 'dbo.emission_obligation', 'mst_emission_obligation';
GO
EXEC sp_rename 'dbo.emission_obligation_status', 'mst_emission_obligation_status';
GO
EXEC sp_rename 'dbo.emission_scheme', 'mst_emission_scheme';
GO
EXEC sp_rename 'dbo.emission_scheme_type', 'mst_emission_scheme_type';
GO
EXEC sp_rename 'dbo.environmental_product', 'mst_environmental_product';
GO
EXEC sp_rename 'dbo.environmental_product_type', 'mst_environmental_product_type';
GO

UPDATE dbo.master_data_table_registry SET table_name = 'mst_carbon_registry', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'carbon_registry';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_carbon_registry_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'carbon_registry_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_emission_obligation', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'emission_obligation';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_emission_obligation_status', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'emission_obligation_status';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_emission_scheme', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'emission_scheme';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_emission_scheme_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'emission_scheme_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_environmental_product', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'environmental_product';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_environmental_product_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'environmental_product_type';
GO
