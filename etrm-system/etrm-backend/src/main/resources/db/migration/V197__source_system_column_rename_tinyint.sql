-- V197: created_source_system_id/updated_source_system_id -> created_src_id/
-- updated_src_id, INT -> TINYINT, on every table that has them (dbo.trade,
-- dbo.source_system itself, dbo.settlement_instruction, every Tier2 table
-- from V194, and every Tier1 entity mapped so far). Dharani's call: the
-- column names were too long and the FK never needs to exceed 255 distinct
-- source_system rows -- TINYINT is 4 bytes smaller per row and the shorter
-- name matches this schema's general preference for compact column names.
--
-- Cascades further than just the FK-side columns: SQL Server requires an FK
-- column's type to EXACTLY match the referenced PK column's type, so
-- dbo.source_system.source_system_id (the PK every one of these FKs points
-- at) must also become TINYINT, which meant a full rebuild -- SQL Server
-- won't let you ALTER COLUMN a PK/IDENTITY column with ~300 live FK
-- dependents in one step (Msg 5074, hit live). Real order that worked:
--   1. Drop every FK anywhere in the DB that references
--      dbo.source_system(source_system_id) -- looked up generically via
--      sys.foreign_keys, not guessed by name.
--   2. Rebuild source_system_id as TINYINT (new column, copy values, drop
--      old, rename into place, re-add PK) -- couldn't ALTER COLUMN an
--      IDENTITY column's type in place, and re-seeding IDENTITY to resume
--      from the current max was simpler than trying to preserve identity
--      metadata across the rebuild.
--   3. THEN the per-table loop: rename+retype each table's own
--      created/updated columns and re-add the FK against the now-TINYINT PK.
--
-- Idempotent against a partial prior run (a first attempt got ~294 tables
-- renamed before failing on the PK-type mismatch, live 2026-08-07, each
-- statement auto-commits outside an explicit transaction) -- every step
-- checks current state (old name vs. new name, current data type) rather
-- than assuming a clean starting point.
--
-- Dynamic, sys.columns-driven (not registry-driven like V194) so it also
-- catches settlement_instruction and dbo.trade, which aren't Tier2-registered.
-- Same temporal-table handling as V191/V193/V194 (SYSTEM_VERSIONING OFF
-- while history-table DDL/rename is applied, back ON after).

USE ETRM_DB;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- 1. Drop every FK anywhere in the DB referencing dbo.source_system.
-- ============================================================================
DECLARE @dropAllSql NVARCHAR(MAX) = '';
SELECT @dropAllSql = @dropAllSql + 'ALTER TABLE dbo.' + QUOTENAME(OBJECT_NAME(fk.parent_object_id)) + ' DROP CONSTRAINT ' + QUOTENAME(fk.name) + '; '
FROM sys.foreign_keys fk
WHERE fk.referenced_object_id = OBJECT_ID('dbo.source_system');
IF LEN(@dropAllSql) > 0 EXEC(@dropAllSql);
GO

-- ============================================================================
-- 2. Rebuild dbo.source_system.source_system_id as TINYINT (was INT IDENTITY).
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.source_system') AND name = 'source_system_id_new')
   AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.source_system') AND name = 'source_system_id' AND system_type_id <> TYPE_ID('tinyint'))
BEGIN
    ALTER TABLE dbo.source_system ADD source_system_id_new TINYINT NULL;
END
GO

-- Separate batch -- deferred name resolution rejects referencing a column
-- added earlier in the same batch (hit live, same gotcha V185 hit). EXEC()
-- wrapping is ALSO required here beyond just the batch-separation, and not
-- optional on a re-run: unlike inside a stored procedure, an ad-hoc batch's
-- column references are validated at parse time even inside a conditional
-- that's false at runtime -- once this column is renamed away by a prior
-- run, a bare (non-EXEC) reference to it here fails with Msg 207 even
-- though the IF EXISTS guards it correctly at the logic level (hit live via
-- Flyway/JDBC 2026-08-07, did not reproduce via sqlcmd -- different
-- validation strictness between the two execution paths).
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.source_system') AND name = 'source_system_id_new')
BEGIN
    EXEC('UPDATE dbo.source_system SET source_system_id_new = CAST(source_system_id AS TINYINT) WHERE source_system_id_new IS NULL');
END
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.source_system') AND name = 'source_system_id_new')
BEGIN
    IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'pk_source_system' AND parent_object_id = OBJECT_ID('dbo.source_system'))
        ALTER TABLE dbo.source_system DROP CONSTRAINT pk_source_system;
    ALTER TABLE dbo.source_system DROP COLUMN source_system_id;
    EXEC sp_rename 'dbo.source_system.source_system_id_new', 'source_system_id', 'COLUMN';
    ALTER TABLE dbo.source_system ALTER COLUMN source_system_id TINYINT NOT NULL;
    ALTER TABLE dbo.source_system ADD CONSTRAINT pk_source_system PRIMARY KEY (source_system_id);
    -- No longer IDENTITY after the rebuild -- this table is seed-only
    -- (migration-managed rows, not a runtime insert target), so future
    -- migrations adding a source_system row must supply the next id
    -- explicitly (SELECT MAX(source_system_id)+1), same as any other
    -- append-only seed table without IDENTITY in this schema.
END
GO

-- ============================================================================
-- 3. Per-table loop: rename + retype each table's own columns, re-add FK.
-- ============================================================================
IF OBJECT_ID('tempdb..#srcIdTables') IS NOT NULL DROP TABLE #srcIdTables;
SELECT DISTINCT t.name AS table_name
INTO #srcIdTables
FROM sys.tables t
JOIN sys.columns c ON c.object_id = t.object_id AND c.name IN ('created_source_system_id', 'created_src_id')
WHERE t.name NOT LIKE '%\_history' ESCAPE '\'
  AND t.name <> 'flyway_schema_history';

DECLARE @tableName SYSNAME;
DECLARE tbl_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT table_name FROM #srcIdTables ORDER BY table_name;
OPEN tbl_cursor;
FETCH NEXT FROM tbl_cursor INTO @tableName;

WHILE @@FETCH_STATUS = 0
BEGIN
    DECLARE @qTable SYSNAME = QUOTENAME(@tableName);
    DECLARE @isTemporal BIT = (SELECT CASE WHEN temporal_type = 2 THEN 1 ELSE 0 END FROM sys.tables WHERE name = @tableName);
    DECLARE @historyTable SYSNAME = (SELECT h.name FROM sys.tables t JOIN sys.tables h ON h.object_id = t.history_table_id WHERE t.name = @tableName);
    DECLARE @qHistory SYSNAME = QUOTENAME(@historyTable);

    -- Rename (only if still on the old name -- idempotent against a partial prior run).
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.' + @tableName) AND name = 'created_source_system_id')
    BEGIN
        IF @isTemporal = 1
            EXEC('ALTER TABLE dbo.' + @qTable + ' SET (SYSTEM_VERSIONING = OFF)');

        DECLARE @renameCreated NVARCHAR(300) = @tableName + '.created_source_system_id';
        DECLARE @renameUpdated NVARCHAR(300) = @tableName + '.updated_source_system_id';
        EXEC sp_rename @objname = @renameCreated, @newname = 'created_src_id', @objtype = 'COLUMN';
        EXEC sp_rename @objname = @renameUpdated, @newname = 'updated_src_id', @objtype = 'COLUMN';

        IF @isTemporal = 1
        BEGIN
            DECLARE @renameHistCreated NVARCHAR(300) = @historyTable + '.created_source_system_id';
            DECLARE @renameHistUpdated NVARCHAR(300) = @historyTable + '.updated_source_system_id';
            EXEC sp_rename @objname = @renameHistCreated, @newname = 'created_src_id', @objtype = 'COLUMN';
            EXEC sp_rename @objname = @renameHistUpdated, @newname = 'updated_src_id', @objtype = 'COLUMN';
        END
    END

    -- Retype (only if not already TINYINT -- idempotent).
    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.' + @tableName) AND name = 'created_src_id' AND system_type_id <> TYPE_ID('tinyint'))
    BEGIN
        EXEC('ALTER TABLE dbo.' + @qTable + ' ALTER COLUMN created_src_id TINYINT NOT NULL');
        EXEC('ALTER TABLE dbo.' + @qTable + ' ALTER COLUMN updated_src_id TINYINT NOT NULL');
        IF @isTemporal = 1
        BEGIN
            EXEC('ALTER TABLE dbo.' + @qHistory + ' ALTER COLUMN created_src_id TINYINT NOT NULL');
            EXEC('ALTER TABLE dbo.' + @qHistory + ' ALTER COLUMN updated_src_id TINYINT NOT NULL');
        END
    END

    IF @isTemporal = 1 AND NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = @tableName AND temporal_type = 2)
        EXEC('ALTER TABLE dbo.' + @qTable + ' SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.' + @qHistory + '))');

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_' + @tableName + '_created_src')
        EXEC('ALTER TABLE dbo.' + @qTable + ' ADD CONSTRAINT fk_' + @tableName + '_created_src FOREIGN KEY (created_src_id) REFERENCES dbo.source_system(source_system_id)');
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_' + @tableName + '_updated_src')
        EXEC('ALTER TABLE dbo.' + @qTable + ' ADD CONSTRAINT fk_' + @tableName + '_updated_src FOREIGN KEY (updated_src_id) REFERENCES dbo.source_system(source_system_id)');

    FETCH NEXT FROM tbl_cursor INTO @tableName;
END

CLOSE tbl_cursor;
DEALLOCATE tbl_cursor;
DROP TABLE #srcIdTables;
GO

-- dbo.trade's V193 index referenced the old column name.
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_trade_created_source_system' AND object_id = OBJECT_ID('dbo.trade'))
BEGIN
    DROP INDEX ix_trade_created_source_system ON dbo.trade;
END
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_trade_created_src' AND object_id = OBJECT_ID('dbo.trade'))
BEGIN
    CREATE INDEX ix_trade_created_src ON dbo.trade (created_src_id, trade_date);
END
GO
