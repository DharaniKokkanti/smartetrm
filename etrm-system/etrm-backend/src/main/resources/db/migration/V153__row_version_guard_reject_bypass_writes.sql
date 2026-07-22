-- =============================================================================
-- V153 — row_version guard: replace V152's silent "bump it for you" triggers
-- with strict, reject-on-violation triggers.
--
-- User decision (2026-07-23), overriding V152's original design: a bypass
-- write (direct SQL, PDI, Airflow, or any future raw UPDATE — including
-- Flyway migrations/seed scripts, no exceptions) that doesn't correctly
-- advance row_version should be REJECTED outright, not silently patched up.
-- See docs/row_version_trigger_pending_04.md for the full history of both
-- designs and why this one superseded V152's.
--
-- What "correctly advance" means, checked per row via the trigger:
--   1. The UPDATE statement must explicitly include row_version in its own
--      SET list (SQL Server's UPDATE(row_version) reports this) — a write
--      that doesn't touch the column at all is rejected.
--   2. The new row_version value must be strictly greater than the row's
--      previous value — a write that sets it to the same value (no-op) or
--      a lower/reused value is rejected. This is what every legitimate
--      writer already does: Hibernate's @Version merge and
--      ReferenceDataCrudService.update() (referencedata/ReferenceDataCrudService.java:273)
--      both generate `row_version = row_version + 1`, so real application
--      traffic is completely unaffected — confirmed by direct code read and
--      live-verified below, not assumed.
--
-- Confirmed no other write path in this backend needs updating for this to
-- be safe: zero @Modifying bulk JPQL/native update queries and zero raw
-- JdbcTemplate UPDATE statements anywhere outside ReferenceDataCrudService
-- (grepped before writing this migration) — every write to a row_version-
-- bearing table already goes through one of the two paths above.
--
-- Mechanics: ROLLBACK TRANSACTION then RAISERROR then RETURN is the
-- standard SQL Server pattern for an AFTER trigger to reject the
-- statement that fired it — the whole implicit (or explicit) transaction
-- the triggering statement was part of is rolled back, not just the one
-- row, which is an inherent property of trigger-based validation in SQL
-- Server (a multi-statement transaction with one bad bypass UPDATE and
-- otherwise-valid statements is rolled back in full). Real application
-- writes never hit this path, so this only affects genuinely non-compliant
-- writers — exactly the intent.
--
-- Same exclusions/generality as V152: skips system-versioned temporal
-- HISTORY tables, discovers each table's real primary key (single or
-- composite) from sys.indexes rather than assuming a hardcoded `id`
-- column, and is idempotent (drops and recreates cleanly on re-run).
--
-- Standing rule this creates, recorded in the handoff doc: any future
-- Flyway migration or seed script that does a raw UPDATE against a
-- row_version-bearing table must now include `row_version = row_version + 1`
-- itself, or the migration will fail at apply time. This applies with no
-- exceptions, per explicit user instruction — there is no escape hatch.
-- =============================================================================

DECLARE @table_schema SYSNAME, @table_name SYSNAME, @old_trigger_name SYSNAME, @new_trigger_name SYSNAME;
DECLARE @join_cond NVARCHAR(MAX), @del_join_cond NVARCHAR(MAX), @sql NVARCHAR(MAX);
DECLARE @created INT = 0, @dropped_old INT = 0, @skipped_no_pk INT = 0;

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
    SET @old_trigger_name = 'trg_' + @table_name + '_row_version_bump';
    SET @new_trigger_name = 'trg_' + @table_name + '_row_version_guard';

    -- Drop V152's "bump" trigger if present (superseded).
    IF EXISTS (SELECT 1 FROM sys.triggers tr INNER JOIN sys.tables tt ON tt.object_id = tr.parent_id WHERE tr.name = @old_trigger_name)
    BEGIN
        SET @sql = N'DROP TRIGGER ' + QUOTENAME(@table_schema) + '.' + QUOTENAME(@old_trigger_name);
        EXEC sp_executesql @sql;
        SET @dropped_old = @dropped_old + 1;
    END

    -- Drop this migration's own trigger too, for idempotent re-runs.
    IF EXISTS (SELECT 1 FROM sys.triggers tr INNER JOIN sys.tables tt ON tt.object_id = tr.parent_id WHERE tr.name = @new_trigger_name)
    BEGIN
        SET @sql = N'DROP TRIGGER ' + QUOTENAME(@table_schema) + '.' + QUOTENAME(@new_trigger_name);
        EXEC sp_executesql @sql;
    END

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes i
        INNER JOIN sys.tables t2 ON t2.object_id = i.object_id
        INNER JOIN sys.schemas s2 ON s2.schema_id = t2.schema_id
        WHERE i.is_primary_key = 1 AND s2.name = @table_schema AND t2.name = @table_name
    )
    BEGIN
        SET @skipped_no_pk = @skipped_no_pk + 1;
        PRINT 'V153 SKIP (no primary key found): ' + @table_schema + '.' + @table_name;
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

        SELECT @del_join_cond = STRING_AGG(CAST('i.' + QUOTENAME(c.name) + ' = d.' + QUOTENAME(c.name) AS NVARCHAR(MAX)), ' AND ')
        FROM sys.indexes idx
        INNER JOIN sys.index_columns ic ON ic.object_id = idx.object_id AND ic.index_id = idx.index_id
        INNER JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
        INNER JOIN sys.tables t2 ON t2.object_id = idx.object_id
        INNER JOIN sys.schemas s2 ON s2.schema_id = t2.schema_id
        WHERE idx.is_primary_key = 1 AND s2.name = @table_schema AND t2.name = @table_name;

        SET @sql = N'CREATE TRIGGER ' + QUOTENAME(@table_schema) + '.' + QUOTENAME(@new_trigger_name) +
            N' ON ' + QUOTENAME(@table_schema) + '.' + QUOTENAME(@table_name) +
            N' AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR(''row_version must be explicitly set on every UPDATE to ' + @table_schema + '.' + @table_name + ' (bypass write rejected by ' + @new_trigger_name + ')'', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN deleted d ON ' + @del_join_cond + N'
        WHERE i.row_version <= d.row_version
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR(''row_version must strictly increase on every UPDATE to ' + @table_schema + '.' + @table_name + ' (stale or reused version rejected by ' + @new_trigger_name + ')'', 16, 1);
        RETURN;
    END
END;';

        EXEC sp_executesql @sql;
        SET @created = @created + 1;
    END

    FETCH NEXT FROM table_cursor INTO @table_schema, @table_name;
END

CLOSE table_cursor;
DEALLOCATE table_cursor;

PRINT '============================================================';
PRINT 'V153 APPLIED — row_version guard triggers (reject on bypass).';
PRINT '  Guard triggers created: ' + CAST(@created AS VARCHAR(10));
PRINT '  Old V152 bump triggers dropped: ' + CAST(@dropped_old AS VARCHAR(10));
PRINT '  No primary key found (skipped): ' + CAST(@skipped_no_pk AS VARCHAR(10));
PRINT '============================================================';
GO
