-- V243: sys_ prefix, new 5th category (Dharani, 2026-08-14) for the 9
-- tables reverted from usr_ by V234 -- platform self-description/
-- governance infrastructure, distinct from usr_ (real user/permission
-- data), ref_ (business-managed reference data), mst_ (vendor-locked
-- vocab), and tran_ (business events). Considered cfg_ first; sys_ chosen
-- since several of these (master_data_table_registry, app_function,
-- app_module, screen_field_registry) are catalogs describing the platform
-- itself, not tunable settings a "config" label would imply.
--
-- master_data_table_registry, source_system, external_system(+mapping),
-- system_config, app_function, app_module, screen_field_registry,
-- object_lock_rule. None temporal. 3 raw JdbcTemplate call sites fixed in
-- the same commit as this migration (UserPermissionService,
-- SourceSystemDefaults, ReferenceDataCrudService) -- same class of
-- native-SQL risk already found once in the original usr_ batch (V233).

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.master_data_table_registry', 'sys_master_data_table_registry';
GO
EXEC sp_rename 'dbo.source_system', 'sys_source_system';
GO
EXEC sp_rename 'dbo.external_system', 'sys_external_system';
GO
EXEC sp_rename 'dbo.external_system_mapping', 'sys_external_system_mapping';
GO
EXEC sp_rename 'dbo.system_config', 'sys_system_config';
GO
EXEC sp_rename 'dbo.app_function', 'sys_app_function';
GO
EXEC sp_rename 'dbo.app_module', 'sys_app_module';
GO
EXEC sp_rename 'dbo.screen_field_registry', 'sys_screen_field_registry';
GO
EXEC sp_rename 'dbo.object_lock_rule', 'sys_object_lock_rule';
GO

UPDATE dbo.sys_master_data_table_registry SET table_name = 'sys_master_data_table_registry', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'master_data_table_registry';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'sys_source_system', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'source_system';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'sys_external_system', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'external_system';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'sys_external_system_mapping', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'external_system_mapping';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'sys_system_config', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'system_config';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'sys_app_function', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'app_function';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'sys_app_module', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'app_module';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'sys_screen_field_registry', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'screen_field_registry';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'sys_object_lock_rule', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'object_lock_rule';
GO
