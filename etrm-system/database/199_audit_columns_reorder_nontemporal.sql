-- V199: reorder audit columns (row_version, created_at, created_by, updated_at,
-- updated_by, created_src_id, updated_src_id) into one contiguous block at the
-- true end of every table -- Dharani flagged that "audit fields should be at
-- end for every single table" and a direct audit found 85 tables where the
-- block sits in the middle (columns added after the original table design
-- pushed past it).
--
-- created_src_id/updated_src_id ARE already the physically last columns
-- everywhere (V194/V197/V198 only ever used ALTER TABLE ADD, which always
-- appends) -- but that means a naive fix that only moves the other 5 columns
-- would land them AFTER created_src_id/updated_src_id, not before, which was
-- caught in dry-run testing on 'address'/'broker' before running this against
-- all 85: the real desired final order (matching the pattern already
-- established on the newest tables, e.g. dbo.settlement_instruction) is
-- row_version, created_at, created_by, updated_at, updated_by,
-- created_src_id, updated_src_id -- so all 7 columns are shuffled together,
-- including the 2 that are individually already "at the end" today.
--
-- SQL Server has no in-place column-reorder operation -- the only way to change
-- physical column order (column_id) is: add new column(s) at the end, copy data,
-- drop the old column(s), rename the new one(s) into the vacated names. Confirmed
-- safe to do generically before writing this: no index (PK/unique/any) contains
-- any of these 7 columns, no CHECK constraint references them. DEFAULT
-- constraints on the first 5 (definitions vary: sysutcdatetime()/getutcdate()/
-- getdate()/((0))/('SYSTEM'), all observed live) and the outgoing FK from
-- created_src_id/updated_src_id to dbo.source_system(source_system_id) are
-- captured and reapplied dynamically per table, not hardcoded. Column types
-- are 100% uniform across every table that has them (verified via sys.columns
-- before writing this): row_version INT, created_at/updated_at DATETIME2(7),
-- created_by/updated_by VARCHAR(100), created_src_id/updated_src_id TINYINT --
-- hardcoded below rather than derived per-column.
--
-- V153's row_version guard trigger (AFTER UPDATE, rejects any UPDATE on a
-- row_version-bearing table that doesn't explicitly bump row_version) applies
-- to every UPDATE this migration issues against such a table -- the single
-- combined UPDATE per table below always bumps row_version when the table has
-- one, even though that bump is immediately discarded (the original row_version
-- column is dropped right after; only the pre-bump value copied into the shadow
-- column survives under the final name).
--
-- Scoped to the 78 NON-temporal tables in the 85-table gap list. The other 7
-- (app_user, book, counterparty, legal_entity, pricing_rule, trade,
-- trade_pricing_schedule) are SQL Server system-versioned temporal tables and
-- need SYSTEM_VERSIONING OFF/ON handling around the DROP COLUMN step -- done
-- separately in V200 after this one is verified live.
--
-- Each table is processed in its own TRY/CATCH + transaction so one table's
-- failure doesn't abort the run; failures are printed, not swallowed silently.

USE ETRM_DB;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DECLARE @tables TABLE (name SYSNAME);
INSERT INTO @tables (name) VALUES
('address'),('balancing_authority'),('balmo_product'),('bank_account'),
('blend_recipe_component'),('bolmo_agreement'),('bolmo_leg'),('broker'),
('broker_fee_agreement'),('carbon_registry'),('charter_party'),
('commodity_grade_standard'),('contact'),('credit_limit'),('customs_duty_rule'),
('delivery_instruction'),('demurrage_dispatch_rate'),
('derivative_contract_specification'),('emission_obligation'),
('emission_scheme'),('environmental_product'),('exchange'),
('freight_rate_index'),('fx_rate'),('gl_account'),('gtc'),
('insurance_provider'),('laytime_term_template'),('letter_of_credit'),
('lng_terminal_detail'),('load_shape_component'),('load_shape_interval'),
('load_shape_template'),('loading_rack'),('location'),('margin_agreement'),
('market'),('market_interval_price'),('master_data_table_registry'),
('metal_brand'),('netting_agreement'),('nomination'),('payment_method'),
('period'),('period_mapping'),('pipeline_cycle'),('power_product_detail'),
('price_index'),('price_index_source'),('price_source'),
('pricing_window_rule'),('product'),('product_blend_component'),
('product_reporting_group'),('railcar'),('reporting_group'),
('rin_obligation'),('rin_transaction'),('settlement_price'),
('source_system'),('storage_facility'),('tank'),('tax_registration'),
('tax_rule'),('throughput_agreement'),('trade_agri_detail'),('trade_cost'),
('trade_item'),('trade_lng_detail'),('trade_metals_detail'),
('trade_oil_detail'),('trade_option_detail'),('trade_order'),
('trade_order_cost'),('trade_order_price_adjustment'),
('trade_storage_agreement_detail'),('trade_swap_detail'),
('trade_transport_agreement_detail'),('trader'),('transport_operator'),
('truck'),('user_role'),('vessel'),('voyage_cargo_parcel');

DECLARE @tableName SYSNAME;
DECLARE @succeeded INT = 0, @failed INT = 0;

DECLARE tbl_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT name FROM @tables ORDER BY name;
OPEN tbl_cursor;
FETCH NEXT FROM tbl_cursor INTO @tableName;

WHILE @@FETCH_STATUS = 0
BEGIN
    BEGIN TRY
        DECLARE @qTable SYSNAME = QUOTENAME(@tableName);

        -- Present audit columns for this table, in desired final order.
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
            PRINT 'V199 SKIP (no audit columns found): ' + @tableName;
        END
        ELSE
        BEGIN
            DECLARE @hasRowVersion BIT = CASE WHEN EXISTS (SELECT 1 FROM @cols WHERE colname = 'row_version') THEN 1 ELSE 0 END;
            DECLARE @addSql NVARCHAR(MAX) = N'ALTER TABLE dbo.' + @qTable + N' ADD ';
            DECLARE @updateSetList NVARCHAR(MAX) = N'';
            DECLARE @dropColList NVARCHAR(MAX) = N'';
            DECLARE @first BIT = 1;

            DECLARE @colName SYSNAME, @ordCur INT;
            DECLARE col_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT colname FROM @cols ORDER BY ord;
            OPEN col_cursor;
            FETCH NEXT FROM col_cursor INTO @colName;
            WHILE @@FETCH_STATUS = 0
            BEGIN
                DECLARE @qCol SYSNAME = QUOTENAME(@colName);
                DECLARE @qShadow SYSNAME = QUOTENAME(@colName + N'__v199ro');
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

            -- 1. add shadow columns (nullable, correct final order -> ascending column_id)
            EXEC(@addSql);

            -- 2. copy data (single UPDATE; bumps row_version once to satisfy V153 guard, discarded on drop below)
            EXEC(N'UPDATE dbo.' + @qTable + N' SET ' + @updateSetList);

            -- 3a. drop FK constraints on created_src_id/updated_src_id (DROP COLUMN fails if left in place)
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

            -- 3b. drop old default constraints (DROP COLUMN fails if left in place)
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

            -- 4. drop the original (now-vacatable) columns
            EXEC(N'ALTER TABLE dbo.' + @qTable + N' DROP COLUMN ' + @dropColList);

            -- 5. rename shadow columns into the vacated final names
            DECLARE @renameFrom NVARCHAR(300), @renameTo SYSNAME;
            DECLARE ren_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT colname FROM @cols ORDER BY ord;
            OPEN ren_cursor;
            FETCH NEXT FROM ren_cursor INTO @renameTo;
            WHILE @@FETCH_STATUS = 0
            BEGIN
                SET @renameFrom = 'dbo.' + @tableName + '.' + @renameTo + '__v199ro';
                EXEC sp_rename @renameFrom, @renameTo, 'COLUMN';
                FETCH NEXT FROM ren_cursor INTO @renameTo;
            END
            CLOSE ren_cursor;
            DEALLOCATE ren_cursor;

            -- 6. re-apply NOT NULL where the original column had it
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

            -- 7. re-apply DEFAULT constraints captured in step 3, auto-named this time
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

            -- 8. re-create FK constraints (created_src_id/updated_src_id -> dbo.source_system), auto-named
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
            PRINT 'V199 OK: ' + @tableName;
        END
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRAN;
        SET @failed = @failed + 1;
        PRINT 'V199 FAILED: ' + @tableName + ' -- ' + ERROR_MESSAGE();
    END CATCH

    FETCH NEXT FROM tbl_cursor INTO @tableName;
END

CLOSE tbl_cursor;
DEALLOCATE tbl_cursor;

PRINT '============================================================';
PRINT 'V199 audit-column reorder (non-temporal tables) complete.';
PRINT '  Succeeded: ' + CAST(@succeeded AS VARCHAR(10));
PRINT '  Failed: ' + CAST(@failed AS VARCHAR(10));
PRINT '============================================================';
GO
