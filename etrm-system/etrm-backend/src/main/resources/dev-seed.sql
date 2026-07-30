-- =============================================================================
-- DEV-ONLY SEED DATA — for local login testing against a real SQL Server.
-- =============================================================================
-- This is deliberately NOT a Flyway migration (V*.sql in db/migration) —
-- it must never auto-apply to a real environment. Run it manually against
-- your local SQL Server after the Flyway migrations have applied:
--
--   sqlcmd -S localhost -d ETRM_DB -U etrm_app -P <password> -i dev-seed.sql
--
-- Login with: username = dev.admin, password = DevPassword123!
-- The password hash below is a real bcrypt hash (verified against Spring
-- Security's BCryptPasswordEncoder, which accepts $2a$/$2b$/$2y$ variants
-- interchangeably) — not a placeholder string.
--
-- 2026-07-30 — fixed to attach to an existing legal_entity (reuses
-- username='admin''s legal_entity_id) instead of inserting a new
-- 'DEV-ENTITY' row. legal_entity gained required jurisdiction_id/
-- base_currency_id FK columns (replacing the free-text jurisdiction/
-- base_currency this script originally used) and a required int
-- entity_type lookup somewhere along the way, and this script wasn't kept
-- in sync — reusing an existing row sidesteps needing to track
-- legal_entity's exact current shape here at all. Also grants the
-- resulting user the System Administrator role (V139 precedent) so it can
-- actually exercise RBAC-gated endpoints, not just authenticate.
-- =============================================================================

USE ETRM_DB;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.app_user WHERE username = 'dev.admin')
BEGIN
    INSERT INTO dbo.app_user
        (legal_entity_id, username, email, password_hash, full_name, is_active, created_by, updated_by)
    SELECT
        legal_entity_id, 'dev.admin', 'dev.admin@example.com',
        '$2b$10$udJjxDRt1m/7bFZ37hnHnONdO3w57fwq10dk8FM6P/PcNRz3RCvvG',
        'Dev Admin', 1, 'SYSTEM', 'SYSTEM'
    FROM dbo.app_user WHERE username = 'admin';
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.user_role_assignment ura JOIN dbo.app_user u ON u.user_id = ura.user_id WHERE u.username = 'dev.admin')
BEGIN
    INSERT INTO dbo.user_role_assignment (user_id, role_id, status, assigned_by, valid_from, is_active)
    SELECT
        (SELECT user_id FROM dbo.app_user WHERE username = 'dev.admin'),
        (SELECT role_id FROM dbo.user_role WHERE role_name = 'System Administrator'),
        'ACTIVE', 'SYSTEM', CAST(SYSUTCDATETIME() AS DATE), 1;
END
GO

PRINT 'Dev seed user ready: username=dev.admin, password=DevPassword123!, role=System Administrator';
GO
