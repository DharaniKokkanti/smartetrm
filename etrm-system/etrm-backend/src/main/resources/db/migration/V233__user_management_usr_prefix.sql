-- V233: usr_ prefix, first execution of this category (Dharani, 2026-08-14,
-- prioritized ahead of the remaining ref_ batches per direct instruction).
-- Covers the identity/RBAC/audit/governance-infrastructure core of the
-- "Organization & Users" module_group -- NOT the whole 57-table bucket,
-- which also holds real business tables (book, trader, broker, price_index,
-- position, ...) that get their own ref_/mst_/tran_ classification in a
-- later pass, not usr_.
--
-- 18 tables: app_user(+history, system-versioned temporal -- OFF/rename/ON
-- dance), user_role, user_role_assignment, role_function, app_function,
-- app_module, field_permission_profile, field_permission_rule,
-- role_field_profile, screen_field_registry, object_lock_rule,
-- user_audit_log, master_data_table_registry itself, source_system,
-- external_system(+mapping), system_config.
--
-- source_system and external_system(+mapping) are allow_create/edit=1 in
-- the registry (business-admin-editable in practice) which would suggest
-- ref_ by the pure allow-flag test used for every other batch this session
-- -- but MASTER_DATA_ARCHITECTURE.md Sec.8 explicitly names
-- "provenance/source-system registry" as a usr_ example: these tables
-- answer "who/what wrote this row" (platform governance infrastructure),
-- not "what does the business look like" (the ref_ test), so category
-- wins over the mechanical allow-flag signal here -- the one deliberate
-- exception in this session's classification method, called out explicitly
-- rather than silently applied.
--
-- 11 of the 18 have real dedicated JPA entities; blast radius confirmed
-- before writing this migration: zero nativeQuery hits reference any of
-- these table names, zero live (non-mock) frontend files hardcode a
-- generic '/reference-data/{table}' call against any of them (all are
-- either dedicated pages with real hooks, or the two Tier2 registry
-- entries -- external_system, source_system -- whose literal refs are
-- confined to MasterDataHub.tsx + mocks/referenceData.ts, both updated in
-- the same commit). None of the 15 incoming FKs into this batch's tables
-- are native/raw SQL -- all bind by object_id, sp_rename-safe.

USE ETRM_DB;
GO

-- Temporal pair: app_user / app_user_history
ALTER TABLE dbo.app_user SET (SYSTEM_VERSIONING = OFF);
GO
EXEC sp_rename 'dbo.app_user', 'usr_app_user';
GO
EXEC sp_rename 'dbo.app_user_history', 'usr_app_user_history';
GO
ALTER TABLE dbo.usr_app_user SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.usr_app_user_history));
GO

EXEC sp_rename 'dbo.user_role', 'usr_user_role';
GO
EXEC sp_rename 'dbo.user_role_assignment', 'usr_user_role_assignment';
GO
EXEC sp_rename 'dbo.role_function', 'usr_role_function';
GO
EXEC sp_rename 'dbo.app_function', 'usr_app_function';
GO
EXEC sp_rename 'dbo.app_module', 'usr_app_module';
GO
EXEC sp_rename 'dbo.field_permission_profile', 'usr_field_permission_profile';
GO
EXEC sp_rename 'dbo.field_permission_rule', 'usr_field_permission_rule';
GO
EXEC sp_rename 'dbo.role_field_profile', 'usr_role_field_profile';
GO
EXEC sp_rename 'dbo.screen_field_registry', 'usr_screen_field_registry';
GO
EXEC sp_rename 'dbo.object_lock_rule', 'usr_object_lock_rule';
GO
EXEC sp_rename 'dbo.user_audit_log', 'usr_user_audit_log';
GO
EXEC sp_rename 'dbo.master_data_table_registry', 'usr_master_data_table_registry';
GO
EXEC sp_rename 'dbo.source_system', 'usr_source_system';
GO
EXEC sp_rename 'dbo.external_system', 'usr_external_system';
GO
EXEC sp_rename 'dbo.external_system_mapping', 'usr_external_system_mapping';
GO
EXEC sp_rename 'dbo.system_config', 'usr_system_config';
GO

UPDATE dbo.usr_master_data_table_registry SET table_name = 'usr_app_user', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'app_user';
GO
UPDATE dbo.usr_master_data_table_registry SET table_name = 'usr_app_user_history', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'app_user_history';
GO
UPDATE dbo.usr_master_data_table_registry SET table_name = 'usr_user_role', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'user_role';
GO
UPDATE dbo.usr_master_data_table_registry SET table_name = 'usr_user_role_assignment', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'user_role_assignment';
GO
UPDATE dbo.usr_master_data_table_registry SET table_name = 'usr_role_function', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'role_function';
GO
UPDATE dbo.usr_master_data_table_registry SET table_name = 'usr_app_function', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'app_function';
GO
UPDATE dbo.usr_master_data_table_registry SET table_name = 'usr_app_module', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'app_module';
GO
UPDATE dbo.usr_master_data_table_registry SET table_name = 'usr_field_permission_profile', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'field_permission_profile';
GO
UPDATE dbo.usr_master_data_table_registry SET table_name = 'usr_field_permission_rule', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'field_permission_rule';
GO
UPDATE dbo.usr_master_data_table_registry SET table_name = 'usr_role_field_profile', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'role_field_profile';
GO
UPDATE dbo.usr_master_data_table_registry SET table_name = 'usr_screen_field_registry', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'screen_field_registry';
GO
UPDATE dbo.usr_master_data_table_registry SET table_name = 'usr_object_lock_rule', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'object_lock_rule';
GO
UPDATE dbo.usr_master_data_table_registry SET table_name = 'usr_user_audit_log', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'user_audit_log';
GO
UPDATE dbo.usr_master_data_table_registry SET table_name = 'usr_master_data_table_registry', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'master_data_table_registry';
GO
UPDATE dbo.usr_master_data_table_registry SET table_name = 'usr_source_system', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'source_system';
GO
UPDATE dbo.usr_master_data_table_registry SET table_name = 'usr_external_system', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'external_system';
GO
UPDATE dbo.usr_master_data_table_registry SET table_name = 'usr_external_system_mapping', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'external_system_mapping';
GO
UPDATE dbo.usr_master_data_table_registry SET table_name = 'usr_system_config', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'system_config';
GO
