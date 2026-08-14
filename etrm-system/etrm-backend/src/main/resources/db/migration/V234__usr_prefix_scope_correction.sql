-- V234: scope correction on V233. Dharani caught that V233 lumped
-- platform-governance/catalog tables into usr_ just because they shared
-- the "Organization & Users" registry bucket with real user-management
-- tables -- not because they're actually about user identity/permissions.
-- usr_ means "who can do what" (accounts, roles, permission grants,
-- user audit trail). It does not mean "any table RBAC happens to
-- reference" or "any table that isn't obviously business data."
--
-- Reverting 9 of V233's 18 renames back to their original names, pending a
-- real classification decision for each (they are NOT re-tagged ref_/mst_/
-- tran_ here either -- that would be the same mistake, just in a different
-- direction. They stay unprefixed until deliberately classified):
--   master_data_table_registry -- the whole-platform table governance
--     catalog, not user data.
--   source_system, external_system(+mapping) -- data-provenance /
--     integration-endpoint registries, governance not identity.
--   system_config -- generic app configuration.
--   app_function, app_module -- catalog of *what can be permissioned*,
--     referenced BY the permission system, not user/permission data
--     itself.
--   screen_field_registry -- catalog of *what fields exist* for
--     field-permission rules to point at, same reasoning.
--   object_lock_rule -- record-locking workflow rules, not user identity.
--
-- Stays usr_ (the real, narrow scope): app_user(+history), user_role,
-- user_role_assignment, role_function, field_permission_profile,
-- field_permission_rule, role_field_profile, user_audit_log.
--
-- None of these 9 are temporal; FKs bind by object_id so sp_rename is
-- safe in both directions, same as every prior batch.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.usr_master_data_table_registry', 'master_data_table_registry';
GO
EXEC sp_rename 'dbo.usr_source_system', 'source_system';
GO
EXEC sp_rename 'dbo.usr_external_system', 'external_system';
GO
EXEC sp_rename 'dbo.usr_external_system_mapping', 'external_system_mapping';
GO
EXEC sp_rename 'dbo.usr_system_config', 'system_config';
GO
EXEC sp_rename 'dbo.usr_app_function', 'app_function';
GO
EXEC sp_rename 'dbo.usr_app_module', 'app_module';
GO
EXEC sp_rename 'dbo.usr_screen_field_registry', 'screen_field_registry';
GO
EXEC sp_rename 'dbo.usr_object_lock_rule', 'object_lock_rule';
GO

UPDATE dbo.master_data_table_registry SET table_name = 'master_data_table_registry', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'usr_master_data_table_registry';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'source_system', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'usr_source_system';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'external_system', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'usr_external_system';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'external_system_mapping', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'usr_external_system_mapping';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'system_config', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'usr_system_config';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'app_function', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'usr_app_function';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'app_module', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'usr_app_module';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'screen_field_registry', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'usr_screen_field_registry';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'object_lock_rule', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'usr_object_lock_rule';
GO
