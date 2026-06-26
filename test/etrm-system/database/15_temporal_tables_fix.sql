-- =============================================================================
-- ETRM SYSTEM — TEMPORAL TABLE SETUP FIX (CRITICAL)
-- SQL Server 2022 | Version 1.0 | June 2026
-- =============================================================================
-- BUG: every ALTER TABLE ... SET (SYSTEM_VERSIONING = ON ...) statement built
-- so far is missing the required PERIOD FOR SYSTEM_TIME (start_col, end_col)
-- clause. SQL Server requires this to be declared in the SAME ALTER TABLE ADD
-- statement as the GENERATED ALWAYS AS ROW START/END columns — without it,
-- enabling system versioning on the table fails. This affects every temporal
-- table built across the whole project, going back to script 1.
--
-- AFFECTED TABLES (7):
--   legal_entity, app_user, book, counterparty   <- ETRM_Master_Data_Schema_v2_0.sql
--   pricing_rule                                  <- ETRM_Pricing_Triggers_Rules_v1_0.sql
--   trade_pricing_schedule                         <- ETRM_Pricing_Lifecycle_v1_0.sql
--   trade                                            <- ETRM_Trade_Schema_v1_0.sql (ALREADY FIXED
--                                                       directly in that file — included here too
--                                                       for completeness/idempotency)
--
-- HOW TO USE THIS FILE:
--   If you have not yet run the original scripts against a real SQL Server
--   instance, the cleanest fix is to replace the broken ALTER block in each
--   source script with the corrected version below, then run as normal —
--   this patch becomes unnecessary.
--
--   If the original scripts WERE already run and failed partway through
--   (most likely: the ADD COLUMN step itself raised an error, so the table
--   exists WITHOUT valid_from/valid_to and WITHOUT versioning), this script
--   is idempotent and safe to run as-is: it checks each table's current
--   state and only applies what's missing.
-- =============================================================================

USE ETRM_DB;
GO

-- Helper: re-apply correctly for a table, tolerant of partial/failed prior attempts
-- (checks via sys.columns / sys.tables rather than assuming a clean slate)

-- ---------------------------------------------------------------------------
-- LEGAL_ENTITY
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.legal_entity') AND name = 'valid_from')
BEGIN
    ALTER TABLE dbo.legal_entity
        ADD valid_from DATETIME2 GENERATED ALWAYS AS ROW START HIDDEN
                CONSTRAINT df_le_vf DEFAULT SYSUTCDATETIME(),
            valid_to   DATETIME2 GENERATED ALWAYS AS ROW END   HIDDEN
                CONSTRAINT df_le_vt DEFAULT CONVERT(DATETIME2,'9999-12-31 23:59:59.9999999'),
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to);
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE temporal_type = 2 AND object_id = OBJECT_ID('dbo.legal_entity'))
BEGIN
    ALTER TABLE dbo.legal_entity
        SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.legal_entity_history));
END
GO

-- ---------------------------------------------------------------------------
-- APP_USER
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.app_user') AND name = 'valid_from')
BEGIN
    ALTER TABLE dbo.app_user
        ADD valid_from DATETIME2 GENERATED ALWAYS AS ROW START HIDDEN
                CONSTRAINT df_au_vf DEFAULT SYSUTCDATETIME(),
            valid_to   DATETIME2 GENERATED ALWAYS AS ROW END   HIDDEN
                CONSTRAINT df_au_vt DEFAULT CONVERT(DATETIME2,'9999-12-31 23:59:59.9999999'),
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to);
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE temporal_type = 2 AND object_id = OBJECT_ID('dbo.app_user'))
BEGIN
    ALTER TABLE dbo.app_user
        SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.app_user_history));
END
GO

-- ---------------------------------------------------------------------------
-- BOOK
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.book') AND name = 'valid_from')
BEGIN
    ALTER TABLE dbo.book
        ADD valid_from DATETIME2 GENERATED ALWAYS AS ROW START HIDDEN
                CONSTRAINT df_bk_vf DEFAULT SYSUTCDATETIME(),
            valid_to   DATETIME2 GENERATED ALWAYS AS ROW END   HIDDEN
                CONSTRAINT df_bk_vt DEFAULT CONVERT(DATETIME2,'9999-12-31 23:59:59.9999999'),
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to);
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE temporal_type = 2 AND object_id = OBJECT_ID('dbo.book'))
BEGIN
    ALTER TABLE dbo.book
        SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.book_history));
END
GO

-- ---------------------------------------------------------------------------
-- COUNTERPARTY
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.counterparty') AND name = 'valid_from')
BEGIN
    ALTER TABLE dbo.counterparty
        ADD valid_from DATETIME2 GENERATED ALWAYS AS ROW START HIDDEN
                CONSTRAINT df_cp_vf DEFAULT SYSUTCDATETIME(),
            valid_to   DATETIME2 GENERATED ALWAYS AS ROW END   HIDDEN
                CONSTRAINT df_cp_vt DEFAULT CONVERT(DATETIME2,'9999-12-31 23:59:59.9999999'),
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to);
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE temporal_type = 2 AND object_id = OBJECT_ID('dbo.counterparty'))
BEGIN
    ALTER TABLE dbo.counterparty
        SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.counterparty_history));
END
GO

-- ---------------------------------------------------------------------------
-- PRICING_RULE
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pricing_rule') AND name = 'valid_from')
BEGIN
    ALTER TABLE dbo.pricing_rule
        ADD valid_from DATETIME2 GENERATED ALWAYS AS ROW START HIDDEN
                CONSTRAINT df_pr_vf DEFAULT SYSUTCDATETIME(),
            valid_to   DATETIME2 GENERATED ALWAYS AS ROW END   HIDDEN
                CONSTRAINT df_pr_vt DEFAULT CONVERT(DATETIME2,'9999-12-31 23:59:59.9999999'),
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to);
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE temporal_type = 2 AND object_id = OBJECT_ID('dbo.pricing_rule'))
BEGIN
    ALTER TABLE dbo.pricing_rule
        SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.pricing_rule_history));
END
GO

-- ---------------------------------------------------------------------------
-- TRADE_PRICING_SCHEDULE
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trade_pricing_schedule') AND name = 'valid_from')
BEGIN
    ALTER TABLE dbo.trade_pricing_schedule
        ADD valid_from DATETIME2 GENERATED ALWAYS AS ROW START HIDDEN
                CONSTRAINT df_tps_vf DEFAULT SYSUTCDATETIME(),
            valid_to   DATETIME2 GENERATED ALWAYS AS ROW END   HIDDEN
                CONSTRAINT df_tps_vt DEFAULT CONVERT(DATETIME2,'9999-12-31 23:59:59.9999999'),
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to);
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE temporal_type = 2 AND object_id = OBJECT_ID('dbo.trade_pricing_schedule'))
BEGIN
    ALTER TABLE dbo.trade_pricing_schedule
        SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.trade_pricing_schedule_history));
END
GO

-- ---------------------------------------------------------------------------
-- TRADE — already fixed directly in ETRM_Trade_Schema_v1_0.sql; included
-- here too so this patch is a complete, standalone corrective script.
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trade') AND name = 'valid_from')
BEGIN
    ALTER TABLE dbo.trade
        ADD valid_from DATETIME2 GENERATED ALWAYS AS ROW START HIDDEN
                CONSTRAINT df_trade_vf DEFAULT SYSUTCDATETIME(),
            valid_to   DATETIME2 GENERATED ALWAYS AS ROW END   HIDDEN
                CONSTRAINT df_trade_vt DEFAULT CONVERT(DATETIME2,'9999-12-31 23:59:59.9999999'),
            PERIOD FOR SYSTEM_TIME (valid_from, valid_to);
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE temporal_type = 2 AND object_id = OBJECT_ID('dbo.trade'))
BEGIN
    ALTER TABLE dbo.trade
        SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.trade_history));
END
GO

PRINT '============================================================';
PRINT 'TEMPORAL TABLE FIX APPLIED';
PRINT '  Verified/corrected PERIOD FOR SYSTEM_TIME + SYSTEM_VERSIONING';
PRINT '  on: legal_entity, app_user, book, counterparty, pricing_rule,';
PRINT '      trade_pricing_schedule, trade';
PRINT '';
PRINT '  ACTION NEEDED: replace the broken ALTER block in the original';
PRINT '  source scripts (ETRM_Master_Data_Schema_v2_0.sql,';
PRINT '  ETRM_Pricing_Triggers_Rules_v1_0.sql, ETRM_Pricing_Lifecycle_v1_0.sql)';
PRINT '  with the corrected version so future fresh deployments do not';
PRINT '  need this patch at all.';
PRINT '============================================================';
GO
