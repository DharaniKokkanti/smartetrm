-- V201: finish the V200 audit-column reorder for dbo.trade, which V200 left
-- half-done. V200's generic per-table logic didn't account for
-- ix_trade_created_src (a non-unique index on (created_src_id, trade_date),
-- the only such index found on created_src_id/updated_src_id anywhere in the
-- whole schema -- confirmed via a direct sys.index_columns sweep after this
-- failure, not present on any of the other 84 tables V199/V200 already
-- reordered successfully) -- DROP COLUMN failed because the index still
-- referenced it, V200's own TRY/CATCH rolled dbo.trade back to its original
-- column order, but dbo.trade_history had already been reordered
-- independently in the same phase 2 and was NOT rolled back -- leaving the
-- pair column-order-mismatched and dbo.trade stuck as a plain (non-temporal)
-- table (V200 phase 3 correctly refused to re-link SYSTEM_VERSIONING given
-- the mismatch, rather than risk it).
--
-- This migration: drops the index, redoes the same reorder V200 already ran
-- successfully on every other table (dbo.trade has no row_version, matching
-- the 6-column audit set already established for it), recreates the index
-- against the new column, then re-links SYSTEM_VERSIONING to
-- dbo.trade_history (already in the correct order from V200, untouched here).

USE ETRM_DB;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

BEGIN TRY
    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'trade' AND temporal_type = 2)
    BEGIN
        BEGIN TRAN;

        -- dbo.trade has no row_version (confirmed: audit_col_count=6 in the
        -- original gap audit), so no V153 guard trigger applies to it here.
        IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.trade') AND name = 'ix_trade_created_src')
            DROP INDEX ix_trade_created_src ON dbo.trade;

        IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_created_src')
            ALTER TABLE dbo.trade DROP CONSTRAINT fk_trade_created_src;
        IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_updated_src')
            ALTER TABLE dbo.trade DROP CONSTRAINT fk_trade_updated_src;

        DECLARE @auditMinId INT, @nonAuditMaxId INT;
        SELECT @auditMinId = MIN(column_id) FROM sys.columns
          WHERE object_id = OBJECT_ID('dbo.trade') AND name IN ('created_at','created_by','updated_at','updated_by','created_src_id','updated_src_id');
        SELECT @nonAuditMaxId = MAX(column_id) FROM sys.columns
          WHERE object_id = OBJECT_ID('dbo.trade') AND name NOT IN ('created_at','created_by','updated_at','updated_by','created_src_id','updated_src_id');

        IF @auditMinId < @nonAuditMaxId
        BEGIN
            EXEC('ALTER TABLE dbo.trade ADD
                created_at__v201ro DATETIME2(7) NULL,
                created_by__v201ro VARCHAR(100) NULL,
                updated_at__v201ro DATETIME2(7) NULL,
                updated_by__v201ro VARCHAR(100) NULL,
                created_src_id__v201ro TINYINT NULL,
                updated_src_id__v201ro TINYINT NULL');

            EXEC('UPDATE dbo.trade SET
                created_at__v201ro = created_at,
                created_by__v201ro = created_by,
                updated_at__v201ro = updated_at,
                updated_by__v201ro = updated_by,
                created_src_id__v201ro = created_src_id,
                updated_src_id__v201ro = updated_src_id');

            DECLARE @defName SYSNAME, @qDefName SYSNAME;
            SELECT @defName = dc.name FROM sys.default_constraints dc
              JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
              WHERE dc.parent_object_id = OBJECT_ID('dbo.trade') AND c.name = 'created_at';
            IF @defName IS NOT NULL
            BEGIN
                SET @qDefName = QUOTENAME(@defName);
                EXEC('ALTER TABLE dbo.trade DROP CONSTRAINT ' + @qDefName);
            END

            SET @defName = NULL;
            SELECT @defName = dc.name FROM sys.default_constraints dc
              JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
              WHERE dc.parent_object_id = OBJECT_ID('dbo.trade') AND c.name = 'updated_at';
            IF @defName IS NOT NULL
            BEGIN
                SET @qDefName = QUOTENAME(@defName);
                EXEC('ALTER TABLE dbo.trade DROP CONSTRAINT ' + @qDefName);
            END

            EXEC('ALTER TABLE dbo.trade DROP COLUMN created_at, created_by, updated_at, updated_by, created_src_id, updated_src_id');

            EXEC sp_rename 'dbo.trade.created_at__v201ro', 'created_at', 'COLUMN';
            EXEC sp_rename 'dbo.trade.created_by__v201ro', 'created_by', 'COLUMN';
            EXEC sp_rename 'dbo.trade.updated_at__v201ro', 'updated_at', 'COLUMN';
            EXEC sp_rename 'dbo.trade.updated_by__v201ro', 'updated_by', 'COLUMN';
            EXEC sp_rename 'dbo.trade.created_src_id__v201ro', 'created_src_id', 'COLUMN';
            EXEC sp_rename 'dbo.trade.updated_src_id__v201ro', 'updated_src_id', 'COLUMN';

            EXEC('ALTER TABLE dbo.trade ALTER COLUMN created_at DATETIME2(7) NOT NULL');
            EXEC('ALTER TABLE dbo.trade ALTER COLUMN created_by VARCHAR(100) NOT NULL');
            EXEC('ALTER TABLE dbo.trade ALTER COLUMN updated_at DATETIME2(7) NOT NULL');
            EXEC('ALTER TABLE dbo.trade ALTER COLUMN updated_by VARCHAR(100) NOT NULL');
            EXEC('ALTER TABLE dbo.trade ALTER COLUMN created_src_id TINYINT NOT NULL');
            EXEC('ALTER TABLE dbo.trade ALTER COLUMN updated_src_id TINYINT NOT NULL');

            EXEC('ALTER TABLE dbo.trade ADD DEFAULT (sysutcdatetime()) FOR created_at');
            EXEC('ALTER TABLE dbo.trade ADD DEFAULT (sysutcdatetime()) FOR updated_at');
        END

        IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_created_src')
            ALTER TABLE dbo.trade ADD CONSTRAINT fk_trade_created_src FOREIGN KEY (created_src_id) REFERENCES dbo.source_system(source_system_id);
        IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_updated_src')
            ALTER TABLE dbo.trade ADD CONSTRAINT fk_trade_updated_src FOREIGN KEY (updated_src_id) REFERENCES dbo.source_system(source_system_id);

        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.trade') AND name = 'ix_trade_created_src')
            CREATE INDEX ix_trade_created_src ON dbo.trade (created_src_id, trade_date);

        COMMIT TRAN;
        PRINT 'V201: dbo.trade column reorder completed.';

        ALTER TABLE dbo.trade SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.trade_history));
        PRINT 'V201: SYSTEM_VERSIONING re-enabled on dbo.trade.';
    END
    ELSE
    BEGIN
        PRINT 'V201 SKIP: dbo.trade is already temporal (nothing to fix).';
    END
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    PRINT 'V201 FAILED: ' + ERROR_MESSAGE();
    THROW;
END CATCH
GO
