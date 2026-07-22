-- =============================================================================
-- V152 — row_version bypass-write protection: AFTER UPDATE trigger on every
-- table that carries row_version.
--
-- The gap: row_version is bumped only by application code today (Hibernate's
-- @Version merge, or the Tier2 CRUD engine's explicit version-check-and-bump).
-- A write that bypasses the Java service layer entirely — direct SQL, a PDI
-- job, Airflow — leaves row_version untouched even though the row changed,
-- so a subsequent app-layer save can silently overwrite that out-of-band
-- change with no conflict ever raised. See docs/row_version_trigger_pending_04.md
-- for the full design rationale, including why row_version stays INT here
-- rather than converting to SQL Server's native ROWVERSION/TIMESTAMP type
-- (hard-incompatible with the system-versioned temporal tables in this
-- schema, among other reasons).
--
-- Double-increment guard: every existing app-level write path already
-- includes row_version in its own UPDATE ... SET list (Hibernate's @Version
-- merge always does; the Tier2 engine's ReferenceDataCrudService explicitly
-- sets `row_version = row_version + 1` itself). SQL Server's UPDATE(col)
-- function inside a trigger reports whether the *triggering statement*
-- included that column in its SET list — true means the app already bumped
-- it in this same statement, so the trigger does nothing; false means the
-- incoming write left row_version untouched (the bypass-write case this
-- exists to catch), so the trigger bumps it by exactly 1.
--
-- Generic over primary key shape: joins `inserted` back to the base table
-- on every column of the table's actual primary key (discovered from
-- sys.indexes), not a hardcoded single `id`/`<table>_id` column name, so it
-- would also work correctly on a composite-PK table if one is ever added to
-- the governed set (junction tables are exempt from row_version entirely
-- today per the governance rule, so none currently need this, but the
-- trigger generation itself doesn't assume a surrogate key).
--
-- Excludes SQL Server system-versioned temporal HISTORY tables
-- (temporal_type = 1) — those aren't directly writable while
-- SYSTEM_VERSIONING is ON and mirror the base table's row_version anyway.
--
-- Known, accepted side effect on temporal tables: the trigger's own UPDATE
-- is a second, distinct statement against the base table, so a bypass write
-- against a temporal table (legal_entity, app_user, book, counterparty,
-- pricing_rule, trade, trade_pricing_schedule) will produce two _history
-- rows instead of one — the original write, then the trigger's row_version
-- bump. Cosmetic history-trail noise, not a functional bug; verified live
-- below.
--
-- Idempotent: skips any table that already has a trigger of this name, so
-- re-running this migration, or a future migration that adds row_version to
-- a new table, can safely re-apply it without erroring on tables already
-- covered.
-- =============================================================================

DECLARE @table_schema SYSNAME, @table_name SYSNAME, @trigger_name SYSNAME;
DECLARE @join_cond NVARCHAR(MAX), @sql NVARCHAR(MAX);
DECLARE @created INT = 0, @skipped_existing INT = 0, @skipped_no_pk INT = 0;

DECLARE table_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT s.name, t.name
    FROM sys.tables t
    INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
    INNER JOIN sys.columns c ON c.object_id = t.object_id AND c.name = 'row_version'
    WHERE t.temporal_type <> 1
    ORDER BY s.name, t.name;

OPEN table_cursor;
FETCH NEXT FROM table_cursor INTO @table_schema, @table_name;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @trigger_name = 'trg_' + @table_name + '_row_version_bump';

    IF EXISTS (
        SELECT 1 FROM sys.triggers tr
        INNER JOIN sys.tables tt ON tt.object_id = tr.parent_id
        WHERE tr.name = @trigger_name
    )
    BEGIN
        SET @skipped_existing = @skipped_existing + 1;
    END
    ELSE IF NOT EXISTS (
        SELECT 1 FROM sys.indexes i
        INNER JOIN sys.tables t2 ON t2.object_id = i.object_id
        INNER JOIN sys.schemas s2 ON s2.schema_id = t2.schema_id
        WHERE i.is_primary_key = 1 AND s2.name = @table_schema AND t2.name = @table_name
    )
    BEGIN
        SET @skipped_no_pk = @skipped_no_pk + 1;
        PRINT 'V152 SKIP (no primary key found): ' + @table_schema + '.' + @table_name;
    END
    ELSE
    BEGIN
        SELECT @join_cond = STRING_AGG(CAST('t.' + QUOTENAME(c.name) + ' = i.' + QUOTENAME(c.name) AS NVARCHAR(MAX)), ' AND ')
        FROM sys.indexes idx
        INNER JOIN sys.index_columns ic ON ic.object_id = idx.object_id AND ic.index_id = idx.index_id
        INNER JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
        INNER JOIN sys.tables t2 ON t2.object_id = idx.object_id
        INNER JOIN sys.schemas s2 ON s2.schema_id = t2.schema_id
        WHERE idx.is_primary_key = 1 AND s2.name = @table_schema AND t2.name = @table_name;

        SET @sql = N'CREATE TRIGGER ' + QUOTENAME(@table_schema) + '.' + QUOTENAME(@trigger_name) +
            N' ON ' + QUOTENAME(@table_schema) + '.' + QUOTENAME(@table_name) +
            N' AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(row_version) RETURN;

    UPDATE t SET t.row_version = t.row_version + 1
    FROM ' + QUOTENAME(@table_schema) + '.' + QUOTENAME(@table_name) + N' t
    INNER JOIN inserted i ON ' + @join_cond + N';
END;';

        EXEC sp_executesql @sql;
        SET @created = @created + 1;
    END

    FETCH NEXT FROM table_cursor INTO @table_schema, @table_name;
END

CLOSE table_cursor;
DEALLOCATE table_cursor;

PRINT '============================================================';
PRINT 'V152 APPLIED — row_version bypass-write trigger rollout.';
PRINT '  Triggers created: ' + CAST(@created AS VARCHAR(10));
PRINT '  Already present (skipped): ' + CAST(@skipped_existing AS VARCHAR(10));
PRINT '  No primary key found (skipped): ' + CAST(@skipped_no_pk AS VARCHAR(10));
PRINT '============================================================';
GO
