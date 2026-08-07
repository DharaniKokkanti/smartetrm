-- V194: created_source_system_id / updated_source_system_id rolled out to
-- every Tier2-registered table (dbo.master_data_table_registry), the
-- ~302-table Phase 2 rollout flagged as open work after V192/V193 (which
-- only covered dbo.trade). One dynamic, cursor-driven migration rather than
-- 302 hand-authored ALTER TABLE statements -- iterates the registry itself
-- at runtime, so it stays correct as new tables are registered later.
--
-- Same shape as dbo.trade (V193), applied generically to every table:
-- created_source_system_id (NOT NULL FK, set once) + updated_source_system_id
-- (NOT NULL FK, re-stamped on every write) -- mirrors created_by/updated_by.
-- Every pre-existing row (this is dev data, no real provenance history to
-- preserve) is backfilled to SYSTEM_MIGRATION, same rationale V191/V193 used
-- for dbo.trade's pre-existing rows.
--
-- Handles the 7 tables in the registry that are system-versioned temporal
-- tables (legal_entity, trade_pricing_schedule, app_user, trade, book,
-- counterparty, pricing_rule) with the same OFF/backfill-history/ON toggle
-- V191/V193 established -- confirmed live 2026-08-07 that a plain ADD COLUMN
-- on the live table auto-propagates to the linked history table (DDL, not
-- DML), so the history branch here does NOT re-add the columns, only
-- backfills them (re-adding caused "Column names in each table must be
-- unique", hit and fixed in V193 first).
--
-- Skips: 'trade' (already done by V193 -- guarded by the same
-- IF NOT EXISTS-per-table check every other table uses, so this is safe to
-- re-run) and 'market_product' (a stale registry row with no matching
-- physical table -- OBJECT_ID filter excludes it, confirmed live: 303
-- registry rows, 302 have a real backing table).
--
-- Deliberately NOT scoped to is_enabled=1 rows only (114 of 303) -- is_enabled
-- gates whether a table shows up as a Static Data screen, a UI-visibility
-- concern, not whether the underlying table can receive writes (seeds,
-- future enablement, direct SQL). Provenance tracking applies to the
-- physical table regardless of its current UI-visibility flag.

USE ETRM_DB;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DECLARE @systemMigrationId INT = (SELECT source_system_id FROM dbo.source_system WHERE source_code = 'SYSTEM_MIGRATION');
DECLARE @tableName SYSNAME;

-- master_data_table_registry is itself one of the looped tables (registered
-- in itself). Reading the cursor directly off it while also ALTERing it
-- mid-loop invalidates the cursor ("table schema changed after the cursor
-- was declared", Msg 16943 -- hit and fixed live 2026-08-07). Snapshot the
-- table list into a temp table first so the loop is decoupled from any
-- table it might itself alter.
-- Excludes two categories of stale registry rows, discovered live
-- 2026-08-07 (real data-quality debt in master_data_table_registry, not
-- something this migration should silently "fix" by deregistering --
-- flagged in the handoff doc for Dharani instead):
--   1. 'flyway_schema_history' -- Flyway's own internal bookkeeping table.
--      Adding a NOT NULL column with no default to it would have broken
--      every future Flyway migration (Flyway's own INSERTs don't know about
--      application-added columns). Hit live, reverted by hand, excluded here
--      so a fresh environment applying this migration never repeats it.
--   2. '*_history' tables (app_user_history, book_history, etc. -- 7 of
--      them registered as if they were independent business tables). A
--      temporal history table already receives created_source_system_id/
--      updated_source_system_id automatically via DDL propagation when its
--      live counterpart is altered (same mechanism V191/V193 rely on) --
--      independently targeting the _history row too is redundant, and
--      SQL Server outright rejects a FOREIGN KEY on a history table
--      (Msg 13565 "A temporal history table cannot be used in a foreign key
--      definition", hit live) -- silently fails past that step under
--      default (non-XACT_ABORT) error handling, leaving it FK-less forever.
--      Simplest correct fix: never target these rows in the first place.
IF OBJECT_ID('tempdb..#tablesToUpdate') IS NOT NULL DROP TABLE #tablesToUpdate;
SELECT DISTINCT r.table_name
INTO #tablesToUpdate
FROM dbo.master_data_table_registry r
WHERE OBJECT_ID('dbo.' + r.table_name, 'U') IS NOT NULL
  AND r.table_name <> 'flyway_schema_history'
  AND r.table_name NOT LIKE '%\_history' ESCAPE '\';

DECLARE tbl_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT table_name FROM #tablesToUpdate ORDER BY table_name;

OPEN tbl_cursor;
FETCH NEXT FROM tbl_cursor INTO @tableName;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Step 1 (add) and steps 2-4 (backfill/finalize) are guarded
    -- independently, not as one all-or-nothing block: a table that errored
    -- out between them on a prior run (e.g. dbo.address hit the row_version
    -- guard trigger mid-backfill on the first attempt here, live
    -- 2026-08-07) would otherwise be skipped forever, since the column
    -- already exists but was never finalized. Re-running must heal that.
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.' + @tableName) AND name = 'created_source_system_id')
    BEGIN
        DECLARE @qTableAdd SYSNAME = QUOTENAME(@tableName);
        EXEC('ALTER TABLE dbo.' + @qTableAdd + ' ADD created_source_system_id INT NULL, updated_source_system_id INT NULL');
    END

    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.' + @tableName) AND name = 'created_source_system_id' AND is_nullable = 1)
    BEGIN
        DECLARE @isTemporal BIT = (SELECT CASE WHEN temporal_type = 2 THEN 1 ELSE 0 END FROM sys.tables WHERE name = @tableName);
        DECLARE @historyTable SYSNAME = (SELECT h.name FROM sys.tables t JOIN sys.tables h ON h.object_id = t.history_table_id WHERE t.name = @tableName);
        DECLARE @sysIdStr VARCHAR(10) = CAST(@systemMigrationId AS VARCHAR(10));
        -- EXEC('...' + expr) only accepts string variables/literals in its
        -- concatenation grammar, not inline function calls -- QUOTENAME(...)
        -- used directly inside EXEC(...) fails with "Incorrect syntax near
        -- 'QUOTENAME'" (hit and fixed live 2026-08-07); pre-compute instead.
        DECLARE @qTable SYSNAME = QUOTENAME(@tableName);
        DECLARE @qHistory SYSNAME = QUOTENAME(@historyTable);
        -- The V153 row_version guard trigger rejects any UPDATE on a
        -- row_version-bearing table that doesn't explicitly bump it (same
        -- gotcha the V185 price_index backfill hit) -- detect and append.
        DECLARE @hasRowVersion BIT = (SELECT CASE WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.' + @tableName) AND name = 'row_version') THEN 1 ELSE 0 END);
        DECLARE @rvSet VARCHAR(50) = CASE WHEN @hasRowVersion = 1 THEN ', row_version = row_version + 1' ELSE '' END;

        -- 2. Backfill the live table.
        EXEC('UPDATE dbo.' + @qTable + ' SET created_source_system_id = ' + @sysIdStr + ', updated_source_system_id = ' + @sysIdStr + @rvSet + ' WHERE created_source_system_id IS NULL');

        -- 3. Temporal tables: unlink, backfill history, relink.
        IF @isTemporal = 1
        BEGIN
            EXEC('ALTER TABLE dbo.' + @qTable + ' SET (SYSTEM_VERSIONING = OFF)');
            EXEC('UPDATE dbo.' + @qHistory + ' SET created_source_system_id = ' + @sysIdStr + ', updated_source_system_id = ' + @sysIdStr + ' WHERE created_source_system_id IS NULL');
            EXEC('ALTER TABLE dbo.' + @qTable + ' SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.' + @qHistory + '))');
        END

        -- 4. Finalize NOT NULL + FK (same no-default discipline as
        -- created_by/updated_by -- every future INSERT/UPDATE must state it).
        EXEC('ALTER TABLE dbo.' + @qTable + ' ALTER COLUMN created_source_system_id INT NOT NULL');
        EXEC('ALTER TABLE dbo.' + @qTable + ' ALTER COLUMN updated_source_system_id INT NOT NULL');
        IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_' + @tableName + '_created_src')
            EXEC('ALTER TABLE dbo.' + @qTable + ' ADD CONSTRAINT fk_' + @tableName + '_created_src FOREIGN KEY (created_source_system_id) REFERENCES dbo.source_system(source_system_id)');
        IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_' + @tableName + '_updated_src')
            EXEC('ALTER TABLE dbo.' + @qTable + ' ADD CONSTRAINT fk_' + @tableName + '_updated_src FOREIGN KEY (updated_source_system_id) REFERENCES dbo.source_system(source_system_id)');
    END

    FETCH NEXT FROM tbl_cursor INTO @tableName;
END

CLOSE tbl_cursor;
DEALLOCATE tbl_cursor;
DROP TABLE #tablesToUpdate;
GO
