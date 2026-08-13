-- V217 — rename dbo.audit_log to dbo.user_audit_log
-- The table went from schema-only (V143's data_category sweep flagged it
-- "no backend CRUD yet") to actually written for the first time this
-- session, exclusively for LOGIN/LOGOUT events (AuthController via the new
-- AuditLogService). Renamed to reflect that current, real usage. The
-- table's action CHECK constraint still allows CREATE/UPDATE/DELETE/etc for
-- future general-purpose use — only the physical name changed.
USE ETRM_DB;
GO

EXEC sp_rename 'dbo.audit_log', 'user_audit_log';
GO
-- Not renaming the PK constraint (pk_audit_log): a PK's backing unique
-- index shares its exact name, and sp_rename can't disambiguate which one
-- you mean ("Either the parameter @objname is ambiguous or the claimed
-- @objtype (OBJECT) is wrong" — confirmed live). Cosmetic only, left as-is.
--
-- CHECK constraints are standalone objects in sys.objects (not scoped under
-- the table like a column/index) — the 'table.constraint' form that works
-- for PK/index rename hits the same ambiguity error here; the bare
-- 'schema.constraint_name' form is what actually works (confirmed live).
EXEC sp_rename 'dbo.chk_audit_action', 'chk_user_audit_action', 'OBJECT';
GO
EXEC sp_rename 'dbo.user_audit_log.ix_audit_entity', 'ix_user_audit_entity', 'INDEX';
GO
EXEC sp_rename 'dbo.user_audit_log.ix_audit_user', 'ix_user_audit_user', 'INDEX';
GO
EXEC sp_rename 'dbo.user_audit_log.ix_audit_date', 'ix_user_audit_date', 'INDEX';
GO

UPDATE dbo.master_data_table_registry
SET table_name = 'user_audit_log',
    display_name = 'User Audit Log',
    description = 'Renamed from audit_log (V217) -- login/logout events now written by AuthController via AuditLogService. Still catalog-only/is_enabled=0 (not a Static Data page) and still schema-only for the other action types (CREATE/UPDATE/DELETE/APPROVE/...).',
    row_version = row_version + 1,
    updated_at = SYSUTCDATETIME(),
    updated_by = 'SYSTEM'
WHERE table_name = 'audit_log';
GO

PRINT 'V217 APPLIED: dbo.audit_log renamed to dbo.user_audit_log (table + PK + CHECK constraint + 3 indexes), master_data_table_registry row updated.';
