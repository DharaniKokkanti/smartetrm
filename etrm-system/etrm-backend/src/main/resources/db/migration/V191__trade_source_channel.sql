-- V191: source/provenance tracking on dbo.trade -- which channel a trade row
-- was captured through (manual entry, Excel upload, external API, exchange
-- feed). Drives the new Trade Blotter monitoring page's Source column/filter
-- (see AppShell.tsx's "Trade Management" > "Trade Blotter" nav entry).
--
-- Scope: dbo.trade only for now, not rolled out across the other 301
-- registered tables -- that broader question (does every master-data table
-- need this too?) is still open and deliberately deferred.
--
-- No DEFAULT on the final column: created_by/updated_by on this same table
-- already require every writer to state who made the change; source_channel_code
-- follows the same discipline so every future INSERT must explicitly state
-- the channel rather than silently defaulting to MANUAL.
--
-- dbo.trade is a system-versioned temporal table (HISTORY_TABLE =
-- dbo.trade_history). Confirmed live against ETRM_DB (2026-08-07) that this
-- needs careful handling, not a plain ALTER TABLE:
--   1. sqlcmd defaults QUOTED_IDENTIFIER/ANSI_NULLS OFF, which SQL Server
--      rejects for ANY DML/DDL touching a temporal current/history pair
--      (Msg 1934) -- both must be explicitly SET ON for this script.
--   2. Adding a NOT NULL column requires backfilling BOTH the live table
--      AND the history table -- existing history rows (pre-dating this
--      column) come back NULL and block the final ALTER COLUMN ... NOT NULL
--      (Msg 515) otherwise. The history table can't be UPDATEd directly
--      while linked (Msg 13561) -- SYSTEM_VERSIONING must be toggled OFF,
--      history backfilled, then back ON, each as its own batch (temporal
--      metadata changes don't take effect until the batch commits).
--   3. The index must be created only after the column is finalized as
--      NOT NULL -- an index already depending on the column blocks the
--      ALTER COLUMN step (Msg 5074/4922).

USE ETRM_DB;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trade') AND name = 'source_channel_code')
BEGIN
    ALTER TABLE dbo.trade ADD source_channel_code VARCHAR(30) NULL;
END
GO

-- Backfill the live table -- every row that existed before this column was
-- tracked predates the feature, so it was necessarily keyed in by hand.
UPDATE dbo.trade SET source_channel_code = 'MANUAL' WHERE source_channel_code IS NULL;
GO

-- Backfill the history table too (must unlink system versioning to write to
-- it directly), or the NOT NULL alter below fails on old NULL history rows.
-- Only needed the first time this runs (guarded on the live column still
-- being nullable) -- dynamic SQL (EXEC) keeps each statement its own
-- sub-batch so the SYSTEM_VERSIONING OFF/ON toggle takes effect immediately,
-- same as separating them with GO, while staying inside one IF block.
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trade') AND name = 'source_channel_code' AND is_nullable = 1)
BEGIN
    EXEC('ALTER TABLE dbo.trade SET (SYSTEM_VERSIONING = OFF)');
    EXEC('UPDATE dbo.trade_history SET source_channel_code = ''MANUAL'' WHERE source_channel_code IS NULL');
    EXEC('ALTER TABLE dbo.trade SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.trade_history))');
END
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trade') AND name = 'source_channel_code' AND is_nullable = 1)
BEGIN
    ALTER TABLE dbo.trade ALTER COLUMN source_channel_code VARCHAR(30) NOT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_trade_source_channel')
BEGIN
    ALTER TABLE dbo.trade ADD CONSTRAINT chk_trade_source_channel CHECK (source_channel_code IN (
        'MANUAL', 'EXCEL_UPLOAD', 'EXTERNAL_API', 'EXCHANGE_FEED_ICE', 'EXCHANGE_FEED_NYMEX', 'SYSTEM'
    ));
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_trade_source_channel' AND object_id = OBJECT_ID('dbo.trade'))
BEGIN
    CREATE INDEX ix_trade_source_channel ON dbo.trade (source_channel_code, trade_date);
END
GO
