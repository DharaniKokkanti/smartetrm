-- V198: dbo.market_interval_price + dbo.market_product_link get
-- created_src_id/updated_src_id too -- two more AuditableEntity-shaped
-- JPA entities (MarketIntervalPrice.java, MarketProductLink.java) that
-- V194's registry-driven rollout missed, same root cause as V196's
-- settlement_instruction: neither is registered in
-- dbo.master_data_table_registry (confirmed live), so the Tier2 sweep never
-- targeted them, and neither extends the shared AuditableEntity base class,
-- so they weren't covered by that fix either. Found by directly auditing
-- every table in the DB against the created_src_id/updated_src_id column
-- set (not just the registry-driven or AuditableEntity-driven subsets) --
-- Dharani asked directly whether every table was covered; this is the
-- answer being made true.
--
-- Neither table is temporal (temporal_type = 0), both have row_version (the
-- V153 guard trigger applies -- bump it in the backfill). market_product_link
-- has 12 real rows; market_interval_price has 0.

USE ETRM_DB;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DECLARE @tableName SYSNAME;
DECLARE tbl_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT name FROM (VALUES ('market_interval_price'), ('market_product_link')) AS v(name);
OPEN tbl_cursor;
FETCH NEXT FROM tbl_cursor INTO @tableName;

WHILE @@FETCH_STATUS = 0
BEGIN
    DECLARE @qTable SYSNAME = QUOTENAME(@tableName);

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.' + @tableName) AND name = 'created_src_id')
    BEGIN
        EXEC('ALTER TABLE dbo.' + @qTable + ' ADD created_src_id TINYINT NULL, updated_src_id TINYINT NULL');
    END

    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.' + @tableName) AND name = 'created_src_id' AND is_nullable = 1)
    BEGIN
        DECLARE @sysId TINYINT = (SELECT source_system_id FROM dbo.source_system WHERE source_code = 'TIER1_APPLICATION_SCREEN');
        DECLARE @sysIdStr VARCHAR(5) = CAST(@sysId AS VARCHAR(5));
        EXEC('UPDATE dbo.' + @qTable + ' SET created_src_id = ' + @sysIdStr + ', updated_src_id = ' + @sysIdStr + ', row_version = row_version + 1 WHERE created_src_id IS NULL');
        EXEC('ALTER TABLE dbo.' + @qTable + ' ALTER COLUMN created_src_id TINYINT NOT NULL');
        EXEC('ALTER TABLE dbo.' + @qTable + ' ALTER COLUMN updated_src_id TINYINT NOT NULL');
    END

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_' + @tableName + '_created_src')
        EXEC('ALTER TABLE dbo.' + @qTable + ' ADD CONSTRAINT fk_' + @tableName + '_created_src FOREIGN KEY (created_src_id) REFERENCES dbo.source_system(source_system_id)');
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_' + @tableName + '_updated_src')
        EXEC('ALTER TABLE dbo.' + @qTable + ' ADD CONSTRAINT fk_' + @tableName + '_updated_src FOREIGN KEY (updated_src_id) REFERENCES dbo.source_system(source_system_id)');

    FETCH NEXT FROM tbl_cursor INTO @tableName;
END

CLOSE tbl_cursor;
DEALLOCATE tbl_cursor;
GO
