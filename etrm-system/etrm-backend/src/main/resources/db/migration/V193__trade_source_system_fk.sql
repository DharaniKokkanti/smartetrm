-- V193: dbo.trade.source_channel_code (V191 CHECK-enum) -> two FK columns
-- against dbo.source_system (V192): created_source_system_id + updated_source_system_id.
--
-- V191 shipped a provisional CHECK-enum shape flagged in the handoff doc as
-- "very likely need to change once the model is decided" -- this migration
-- is that reconciliation. dbo.trade has 0 real rows in the live DB (Trade
-- Capture has no dedicated Java backend yet, mock-only), so this is a clean
-- schema swap, not a data-preserving migration.
--
-- TWO columns, not one: Dharani clarified 2026-08-07 this must be captured
-- on EVERY mutating action (create, update, deactivate, delete), exactly
-- the way created_by/updated_by already work on this same table -- e.g. a
-- trade created via EXTERNAL_API but later cancelled via the Trade Capture
-- GUI must show both facts, not just the original creator. So this mirrors
-- created_by/updated_by exactly: created_source_system_id is set once and
-- never changes; updated_source_system_id is re-stamped on every subsequent
-- write (including a status change like CANCELLED), same as updated_by is
-- today. Both start equal to the same mapped value on this backfill since
-- only one historical value (source_channel_code) existed to map from.
--
-- Mapping from the old CHECK values to the new source_system rows:
--   MANUAL              -> TRADE_CAPTURE_SCREEN
--   EXCEL_UPLOAD         -> BULK_EXCEL_UPLOAD
--   EXTERNAL_API          -> EXTERNAL_API_GENERIC
--   EXCHANGE_FEED_ICE      -> EXCHANGE_FEED_ICE
--   EXCHANGE_FEED_NYMEX     -> EXCHANGE_FEED_NYMEX
--   SYSTEM                   -> SYSTEM_MIGRATION
--
-- dbo.trade is still system-versioned (HISTORY_TABLE = dbo.trade_history) --
-- same handling as V191: QUOTED_IDENTIFIER/ANSI_NULLS must be explicitly SET
-- ON for this session (sqlcmd defaults both off, Msg 1934), and a NOT NULL
-- column addition must backfill the history table too (toggle
-- SYSTEM_VERSIONING off, backfill, back on, each its own batch) or the final
-- ALTER COLUMN ... NOT NULL fails on old NULL history rows (Msg 515/13561).
-- DROP COLUMN itself does not need the same toggle -- SQL Server propagates
-- DDL (not DML) to the linked history table automatically; only backfilling
-- pre-existing history rows via UPDATE requires unlinking.

USE ETRM_DB;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- 1. Add the two new nullable FK columns.
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trade') AND name = 'created_source_system_id')
BEGIN
    ALTER TABLE dbo.trade ADD created_source_system_id INT NULL, updated_source_system_id INT NULL;
END
GO

-- 2. Backfill the live table from the old CHECK values -- both columns get
-- the same mapped value, since only one historical value exists to map from.
UPDATE t
SET t.created_source_system_id = ss.source_system_id,
    t.updated_source_system_id = ss.source_system_id
FROM dbo.trade t
JOIN dbo.source_system ss ON ss.source_code = CASE t.source_channel_code
    WHEN 'MANUAL'               THEN 'TRADE_CAPTURE_SCREEN'
    WHEN 'EXCEL_UPLOAD'         THEN 'BULK_EXCEL_UPLOAD'
    WHEN 'EXTERNAL_API'         THEN 'EXTERNAL_API_GENERIC'
    WHEN 'EXCHANGE_FEED_ICE'    THEN 'EXCHANGE_FEED_ICE'
    WHEN 'EXCHANGE_FEED_NYMEX'  THEN 'EXCHANGE_FEED_NYMEX'
    WHEN 'SYSTEM'               THEN 'SYSTEM_MIGRATION'
END
WHERE t.created_source_system_id IS NULL;
GO

-- 3. Backfill the history table too (unlink versioning, write, relink) --
-- only needed the first time this runs (guarded on the live column still
-- being nullable), same EXEC() sub-batch pattern V191 used.
-- Note: step 1's ADD COLUMN on the live table already auto-propagated both
-- columns onto dbo.trade_history too (DDL, not DML, propagates automatically
-- for a linked temporal pair) -- adding them again here would fail with
-- "Column names in each table must be unique" (hit and fixed live 2026-08-07).
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trade') AND name = 'created_source_system_id' AND is_nullable = 1)
   AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trade_history') AND name = 'source_channel_code')
BEGIN
    EXEC('ALTER TABLE dbo.trade SET (SYSTEM_VERSIONING = OFF)');
    EXEC('
        UPDATE h
        SET h.created_source_system_id = ss.source_system_id,
            h.updated_source_system_id = ss.source_system_id
        FROM dbo.trade_history h
        JOIN dbo.source_system ss ON ss.source_code = CASE h.source_channel_code
            WHEN ''MANUAL''               THEN ''TRADE_CAPTURE_SCREEN''
            WHEN ''EXCEL_UPLOAD''         THEN ''BULK_EXCEL_UPLOAD''
            WHEN ''EXTERNAL_API''         THEN ''EXTERNAL_API_GENERIC''
            WHEN ''EXCHANGE_FEED_ICE''    THEN ''EXCHANGE_FEED_ICE''
            WHEN ''EXCHANGE_FEED_NYMEX''  THEN ''EXCHANGE_FEED_NYMEX''
            WHEN ''SYSTEM''               THEN ''SYSTEM_MIGRATION''
        END
        WHERE h.created_source_system_id IS NULL
    ');
    EXEC('ALTER TABLE dbo.trade SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.trade_history))');
END
GO

-- 4. Drop the old CHECK constraint + index + column (live table; DDL
-- propagates to the linked history table automatically).
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_trade_source_channel')
BEGIN
    ALTER TABLE dbo.trade DROP CONSTRAINT chk_trade_source_channel;
END
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_trade_source_channel' AND object_id = OBJECT_ID('dbo.trade'))
BEGIN
    DROP INDEX ix_trade_source_channel ON dbo.trade;
END
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trade') AND name = 'source_channel_code')
BEGIN
    ALTER TABLE dbo.trade DROP COLUMN source_channel_code;
END
GO

-- 5. Finalize both columns as NOT NULL + FK + index (same no-default
-- discipline as created_by/updated_by/V191 -- every future INSERT/UPDATE
-- must state the source explicitly, no silent fallback).
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trade') AND name = 'created_source_system_id' AND is_nullable = 1)
BEGIN
    ALTER TABLE dbo.trade ALTER COLUMN created_source_system_id INT NOT NULL;
    ALTER TABLE dbo.trade ALTER COLUMN updated_source_system_id INT NOT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_created_source_system')
BEGIN
    ALTER TABLE dbo.trade ADD CONSTRAINT fk_trade_created_source_system FOREIGN KEY (created_source_system_id) REFERENCES dbo.source_system(source_system_id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_updated_source_system')
BEGIN
    ALTER TABLE dbo.trade ADD CONSTRAINT fk_trade_updated_source_system FOREIGN KEY (updated_source_system_id) REFERENCES dbo.source_system(source_system_id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_trade_created_source_system' AND object_id = OBJECT_ID('dbo.trade'))
BEGIN
    CREATE INDEX ix_trade_created_source_system ON dbo.trade (created_source_system_id, trade_date);
END
GO
