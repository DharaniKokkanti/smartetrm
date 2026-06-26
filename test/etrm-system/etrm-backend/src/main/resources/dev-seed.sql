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
-- =============================================================================

USE ETRM_DB;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.legal_entity WHERE entity_code = 'DEV-ENTITY')
BEGIN
    INSERT INTO dbo.legal_entity
        (entity_code, entity_name, short_name, entity_type, jurisdiction, base_currency,
         is_internal, created_by, updated_by)
    VALUES
        ('DEV-ENTITY', 'Dev Testing Entity', 'Dev Entity', 'TRADING_COMPANY', 'GB', 'USD',
         1, 'SYSTEM', 'SYSTEM');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.app_user WHERE username = 'dev.admin')
BEGIN
    INSERT INTO dbo.app_user
        (legal_entity_id, username, email, password_hash, full_name, is_active, created_by, updated_by)
    SELECT
        legal_entity_id, 'dev.admin', 'dev.admin@example.com',
        '$2b$10$udJjxDRt1m/7bFZ37hnHnONdO3w57fwq10dk8FM6P/PcNRz3RCvvG',
        'Dev Admin', 1, 'SYSTEM', 'SYSTEM'
    FROM dbo.legal_entity WHERE entity_code = 'DEV-ENTITY';
END
GO

PRINT 'Dev seed user ready: username=dev.admin, password=DevPassword123!';
GO
