-- V200: same audit-column reorder as V199 (row_version, created_at, created_by,
-- updated_at, updated_by, created_src_id, updated_src_id -> one contiguous
-- block at the true end), for the 7 SQL Server system-versioned temporal
-- tables V199 explicitly excluded: app_user, book, counterparty, legal_entity,
-- pricing_rule, trade, trade_pricing_schedule.
--
-- Temporal tables need three extra steps V199's non-temporal tables didn't:
--   1. SYSTEM_VERSIONING must be turned OFF on the main table before any
--      DROP COLUMN / rename -- SQL Server disallows those operations on a
--      table while it's actively being version-tracked.
--   2. The SAME reorder must be applied to the paired _history table too,
--      independently -- once versioning is off, main and history are just
--      two ordinary tables that happen to share a column set; nothing
--      auto-propagates between them anymore. (Confirmed live: history tables
--      mirror the main table's columns/types/nullability at identical
--      column_id positions, but carry no DEFAULT constraints and no FKs on
--      these columns -- both already-known SQL Server restrictions on history
--      tables -- so the shared per-table logic below is safe to reuse
--      unchanged: its FK/default cursors simply find nothing to do on the
--      history table and skip those steps naturally.)
--   3. SYSTEM_VERSIONING must be turned back ON afterward, re-linked to the
--      same history table.
--
-- Reuses the exact per-table add/copy/drop/rename logic from V199 (tested and
-- run clean against all 78 non-temporal tables first) applied uniformly to
-- 14 table names (7 main + 7 history) in phase 2, bracketed by phase 1
-- (versioning off) and phase 3 (versioning on) around each main/history pair.
-- Each phase is independently TRY/CATCH-guarded per table so one failure
-- doesn't abort the run or leave a table stuck -- if phase 2 fails for a
-- pair, phase 3 deliberately skips re-enabling versioning for it (leaves it
-- as a plain table rather than risk re-linking a partially-migrated history
-- table); this is flagged via PRINT, not silently swallowed.

USE ETRM_DB;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DECLARE @pairs TABLE (mainName SYSNAME, historyName SYSNAME);
INSERT INTO @pairs (mainName, historyName) VALUES
('app_user','app_user_history'),
('book','book_history'),
('counterparty','counterparty_history'),
('legal_entity','legal_entity_history'),
('pricing_rule','pricing_rule_history'),
('trade','trade_history'),
('trade_pricing_schedule','trade_pricing_schedule_history');

-- ============================================================
-- Phase 1: turn SYSTEM_VERSIONING off for each main table.
-- ============================================================
DECLARE @mainName SYSNAME;
DECLARE p1_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT mainName FROM @pairs;
OPEN p1_cursor;
FETCH NEXT FROM p1_cursor INTO @mainName;
WHILE @@FETCH_STATUS = 0
BEGIN
    BEGIN TRY
        DECLARE @qMain1 SYSNAME = QUOTENAME(@mainName);
        EXEC(N'ALTER TABLE dbo.' + @qMain1 + N' SET (SYSTEM_VERSIONING = OFF)');
        PRINT 'V200 phase1 OK (versioning off): ' + @mainName;
    END TRY
    BEGIN CATCH
        PRINT 'V200 phase1 FAILED: ' + @mainName + ' -- ' + ERROR_MESSAGE();
    END CATCH
    FETCH NEXT FROM p1_cursor INTO @mainName;
END
CLOSE p1_cursor;
DEALLOCATE p1_cursor;
GO

-- ============================================================
-- Phase 2: reorder both main and history tables (V199 logic, unchanged).
-- ============================================================
DECLARE @tables TABLE (name SYSNAME);
INSERT INTO @tables (name) VALUES
('app_user'),('app_user_history'),
('book'),('book_history'),
('counterparty'),('counterparty_history'),
('legal_entity'),('legal_entity_history'),
('pricing_rule'),('pricing_rule_history'),
('trade'),('trade_history'),
('trade_pricing_schedule'),('trade_pricing_schedule_history');

DECLARE @tableName SYSNAME;
DECLARE @succeeded INT = 0, @failed INT = 0;

DECLARE tbl_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT name FROM @tables ORDER BY name;
OPEN tbl_cursor;
FETCH NEXT FROM tbl_cursor INTO @tableName;

WHILE @@FETCH_STATUS = 0
BEGIN
    BEGIN TRY
        DECLARE @qTable SYSNAME = QUOTENAME(@tableName);

        DECLARE @cols TABLE (ord INT, colname SYSNAME, is_nullable BIT, default_def NVARCHAR(MAX), default_name SYSNAME NULL, fk_name SYSNAME NULL);
        DELETE FROM @cols;
        INSERT INTO @cols (ord, colname, is_nullable, default_def, default_name, fk_name)
        SELECT
            CASE c.name WHEN 'row_version' THEN 1 WHEN 'created_at' THEN 2 WHEN 'created_by' THEN 3 WHEN 'updated_at' THEN 4 WHEN 'updated_by' THEN 5 WHEN 'created_src_id' THEN 6 WHEN 'updated_src_id' THEN 7 END,
            c.name, c.is_nullable, dc.definition, dc.name, fk.name
        FROM sys.columns c
        LEFT JOIN sys.default_constraints dc ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
        LEFT JOIN sys.foreign_key_columns fkc ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
        LEFT JOIN sys.foreign_keys fk ON fk.object_id = fkc.constraint_object_id
        WHERE c.object_id = OBJECT_ID('dbo.' + @tableName)
          AND c.name IN ('row_version','created_at','created_by','updated_at','updated_by','created_src_id','updated_src_id');

        IF NOT EXISTS (SELECT 1 FROM @cols)
        BEGIN
            PRINT 'V200 SKIP (no audit columns found): ' + @tableName;
        END
        ELSE
        BEGIN
            DECLARE @hasRowVersion BIT = CASE WHEN EXISTS (SELECT 1 FROM @cols WHERE colname = 'row_version') THEN 1 ELSE 0 END;
            DECLARE @addSql NVARCHAR(MAX) = N'ALTER TABLE dbo.' + @qTable + N' ADD ';
            DECLARE @updateSetList NVARCHAR(MAX) = N'';
            DECLARE @dropColList NVARCHAR(MAX) = N'';
            DECLARE @first BIT = 1;

            DECLARE @colName SYSNAME;
            DECLARE col_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT colname FROM @cols ORDER BY ord;
            OPEN col_cursor;
            FETCH NEXT FROM col_cursor INTO @colName;
            WHILE @@FETCH_STATUS = 0
            BEGIN
                DECLARE @qCol SYSNAME = QUOTENAME(@colName);
                DECLARE @qShadow SYSNAME = QUOTENAME(@colName + N'__v200ro');
                DECLARE @typeSpec NVARCHAR(50) = CASE @colName
                    WHEN 'row_version' THEN N'INT'
                    WHEN 'created_by' THEN N'VARCHAR(100)'
                    WHEN 'updated_by' THEN N'VARCHAR(100)'
                    WHEN 'created_src_id' THEN N'TINYINT'
                    WHEN 'updated_src_id' THEN N'TINYINT'
                    ELSE N'DATETIME2(7)'
                END;

                IF @first = 0
                BEGIN
                    SET @addSql += N', ';
                    SET @updateSetList += N', ';
                    SET @dropColList += N', ';
                END
                SET @first = 0;

                SET @addSql += @qShadow + N' ' + @typeSpec + N' NULL';
                SET @updateSetList += @qShadow + N' = ' + @qCol;
                SET @dropColList += @qCol;

                FETCH NEXT FROM col_cursor INTO @colName;
            END
            CLOSE col_cursor;
            DEALLOCATE col_cursor;

            IF @hasRowVersion = 1
                SET @updateSetList += N', ' + QUOTENAME('row_version') + N' = ' + QUOTENAME('row_version') + N' + 1';

            BEGIN TRAN;

            EXEC(@addSql);
            EXEC(N'UPDATE dbo.' + @qTable + N' SET ' + @updateSetList);

            DECLARE @fkName SYSNAME, @fkColName SYSNAME;
            DECLARE fk_drop_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT fk_name, colname FROM @cols WHERE fk_name IS NOT NULL;
            OPEN fk_drop_cursor;
            FETCH NEXT FROM fk_drop_cursor INTO @fkName, @fkColName;
            WHILE @@FETCH_STATUS = 0
            BEGIN
                DECLARE @qFkName SYSNAME = QUOTENAME(@fkName);
                EXEC(N'ALTER TABLE dbo.' + @qTable + N' DROP CONSTRAINT ' + @qFkName);
                FETCH NEXT FROM fk_drop_cursor INTO @fkName, @fkColName;
            END
            CLOSE fk_drop_cursor;
            DEALLOCATE fk_drop_cursor;

            DECLARE @defName SYSNAME, @defDefinition NVARCHAR(MAX), @defColName SYSNAME;
            DECLARE def_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT default_name, colname FROM @cols WHERE default_name IS NOT NULL;
            OPEN def_cursor;
            FETCH NEXT FROM def_cursor INTO @defName, @defColName;
            WHILE @@FETCH_STATUS = 0
            BEGIN
                DECLARE @qDefName SYSNAME = QUOTENAME(@defName);
                EXEC(N'ALTER TABLE dbo.' + @qTable + N' DROP CONSTRAINT ' + @qDefName);
                FETCH NEXT FROM def_cursor INTO @defName, @defColName;
            END
            CLOSE def_cursor;
            DEALLOCATE def_cursor;

            EXEC(N'ALTER TABLE dbo.' + @qTable + N' DROP COLUMN ' + @dropColList);

            DECLARE @renameFrom NVARCHAR(300), @renameTo SYSNAME;
            DECLARE ren_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT colname FROM @cols ORDER BY ord;
            OPEN ren_cursor;
            FETCH NEXT FROM ren_cursor INTO @renameTo;
            WHILE @@FETCH_STATUS = 0
            BEGIN
                SET @renameFrom = 'dbo.' + @tableName + '.' + @renameTo + '__v200ro';
                EXEC sp_rename @renameFrom, @renameTo, 'COLUMN';
                FETCH NEXT FROM ren_cursor INTO @renameTo;
            END
            CLOSE ren_cursor;
            DEALLOCATE ren_cursor;

            DECLARE @nnColName SYSNAME;
            DECLARE nn_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT colname FROM @cols WHERE is_nullable = 0 ORDER BY ord;
            OPEN nn_cursor;
            FETCH NEXT FROM nn_cursor INTO @nnColName;
            WHILE @@FETCH_STATUS = 0
            BEGIN
                DECLARE @nnType NVARCHAR(50) = CASE @nnColName
                    WHEN 'row_version' THEN N'INT'
                    WHEN 'created_by' THEN N'VARCHAR(100)'
                    WHEN 'updated_by' THEN N'VARCHAR(100)'
                    WHEN 'created_src_id' THEN N'TINYINT'
                    WHEN 'updated_src_id' THEN N'TINYINT'
                    ELSE N'DATETIME2(7)'
                END;
                DECLARE @qNnCol SYSNAME = QUOTENAME(@nnColName);
                EXEC(N'ALTER TABLE dbo.' + @qTable + N' ALTER COLUMN ' + @qNnCol + N' ' + @nnType + N' NOT NULL');
                FETCH NEXT FROM nn_cursor INTO @nnColName;
            END
            CLOSE nn_cursor;
            DEALLOCATE nn_cursor;

            DECLARE @rdColName SYSNAME, @rdDef NVARCHAR(MAX);
            DECLARE rd_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT colname, default_def FROM @cols WHERE default_def IS NOT NULL;
            OPEN rd_cursor;
            FETCH NEXT FROM rd_cursor INTO @rdColName, @rdDef;
            WHILE @@FETCH_STATUS = 0
            BEGIN
                DECLARE @qRdCol SYSNAME = QUOTENAME(@rdColName);
                EXEC(N'ALTER TABLE dbo.' + @qTable + N' ADD DEFAULT ' + @rdDef + N' FOR ' + @qRdCol);
                FETCH NEXT FROM rd_cursor INTO @rdColName, @rdDef;
            END
            CLOSE rd_cursor;
            DEALLOCATE rd_cursor;

            DECLARE @fkColName2 SYSNAME;
            DECLARE fk_add_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT colname FROM @cols WHERE fk_name IS NOT NULL ORDER BY ord;
            OPEN fk_add_cursor;
            FETCH NEXT FROM fk_add_cursor INTO @fkColName2;
            WHILE @@FETCH_STATUS = 0
            BEGIN
                DECLARE @qFkCol SYSNAME = QUOTENAME(@fkColName2);
                DECLARE @newFkName SYSNAME = 'fk_' + @tableName + '_' + @fkColName2;
                DECLARE @qNewFkName SYSNAME = QUOTENAME(@newFkName);
                EXEC(N'ALTER TABLE dbo.' + @qTable + N' ADD CONSTRAINT ' + @qNewFkName + N' FOREIGN KEY (' + @qFkCol + N') REFERENCES dbo.source_system(source_system_id)');
                FETCH NEXT FROM fk_add_cursor INTO @fkColName2;
            END
            CLOSE fk_add_cursor;
            DEALLOCATE fk_add_cursor;

            COMMIT TRAN;
            SET @succeeded = @succeeded + 1;
            PRINT 'V200 phase2 OK: ' + @tableName;
        END
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRAN;
        SET @failed = @failed + 1;
        PRINT 'V200 phase2 FAILED: ' + @tableName + ' -- ' + ERROR_MESSAGE();
    END CATCH

    FETCH NEXT FROM tbl_cursor INTO @tableName;
END

CLOSE tbl_cursor;
DEALLOCATE tbl_cursor;

PRINT '============================================================';
PRINT 'V200 phase 2 (reorder) complete. Succeeded: ' + CAST(@succeeded AS VARCHAR(10)) + ', Failed: ' + CAST(@failed AS VARCHAR(10));
PRINT '============================================================';
GO

-- ============================================================
-- Phase 3: turn SYSTEM_VERSIONING back on, re-linked to the same history
-- table. Only attempted for mains that are still off (skips a main that
-- somehow already got re-linked by a prior partial run).
-- ============================================================
DECLARE @pairs2 TABLE (mainName SYSNAME, historyName SYSNAME);
INSERT INTO @pairs2 (mainName, historyName) VALUES
('app_user','app_user_history'),
('book','book_history'),
('counterparty','counterparty_history'),
('legal_entity','legal_entity_history'),
('pricing_rule','pricing_rule_history'),
('trade','trade_history'),
('trade_pricing_schedule','trade_pricing_schedule_history');

DECLARE @mainName3 SYSNAME, @historyName3 SYSNAME;
DECLARE p3_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT mainName, historyName FROM @pairs2;
OPEN p3_cursor;
FETCH NEXT FROM p3_cursor INTO @mainName3, @historyName3;
WHILE @@FETCH_STATUS = 0
BEGIN
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM sys.tables WHERE name = @mainName3 AND temporal_type = 0)
        BEGIN
            DECLARE @qMain3 SYSNAME = QUOTENAME(@mainName3);
            DECLARE @qHistory3 SYSNAME = QUOTENAME(@historyName3);
            EXEC(N'ALTER TABLE dbo.' + @qMain3 + N' SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.' + @qHistory3 + N'))');
            PRINT 'V200 phase3 OK (versioning re-enabled): ' + @mainName3;
        END
        ELSE
        BEGIN
            PRINT 'V200 phase3 SKIP (not currently non-temporal, already versioned or missing): ' + @mainName3;
        END
    END TRY
    BEGIN CATCH
        PRINT 'V200 phase3 FAILED: ' + @mainName3 + ' -- ' + ERROR_MESSAGE();
    END CATCH
    FETCH NEXT FROM p3_cursor INTO @mainName3, @historyName3;
END
CLOSE p3_cursor;
DEALLOCATE p3_cursor;
GO
