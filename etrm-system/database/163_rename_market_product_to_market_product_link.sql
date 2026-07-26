-- =============================================================================
-- ETRM SYSTEM — RENAME market_product -> market_product_link
-- =============================================================================
-- "market_product" reads like a product listed on a market; the row is
-- really a link record (market x product), so this renames the table and
-- its PK/FK columns to say that. All sp_rename — metadata-only, no data
-- movement, no dependent index/constraint drop-and-recreate needed (unlike
-- V162's BIGINT widening, which needed a real type change).
--
-- market_product_period and market_product_source (junction tables that
-- reference market_product) are NOT being renamed themselves — only their
-- FK column pointing at the renamed table changes.
-- =============================================================================

USE ETRM_DB;
GO

-- The row-version guard trigger's body is plain T-SQL text (RAISERROR
-- messages, [market_product_id] column references) — sp_rename is
-- metadata-only and does NOT rewrite trigger bodies, so this has to be
-- dropped and recreated against the new names rather than just renamed.
IF OBJECT_ID('dbo.trg_market_product_row_version_guard', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_market_product_row_version_guard;
GO

-- Table + its own PK column
EXEC sp_rename 'dbo.market_product', 'market_product_link';
GO
EXEC sp_rename 'dbo.market_product_link.market_product_id', 'market_product_link_id', 'COLUMN';
GO

-- FK columns on every table that references it
EXEC sp_rename 'dbo.market_product_period.market_product_id', 'market_product_link_id', 'COLUMN';
EXEC sp_rename 'dbo.market_product_source.market_product_id', 'market_product_link_id', 'COLUMN';
EXEC sp_rename 'dbo.period.market_product_id', 'market_product_link_id', 'COLUMN';
GO

-- Constraint/index/trigger names, for consistency with the new table name
EXEC sp_rename 'dbo.pk_market_product', 'pk_market_product_link', 'OBJECT';
EXEC sp_rename 'dbo.uq_market_product', 'uq_market_product_link', 'OBJECT';
EXEC sp_rename 'dbo.chk_mp_settle', 'chk_mpl_settle', 'OBJECT';
EXEC sp_rename 'dbo.fk_mp_market', 'fk_mpl_market', 'OBJECT';
EXEC sp_rename 'dbo.fk_mp_product', 'fk_mpl_product', 'OBJECT';
EXEC sp_rename 'dbo.fk_mp_currency', 'fk_mpl_currency', 'OBJECT';
EXEC sp_rename 'dbo.fk_mp_uom', 'fk_mpl_uom', 'OBJECT';
EXEC sp_rename 'dbo.market_product_link.ix_mp_market', 'ix_mpl_market', 'INDEX';
EXEC sp_rename 'dbo.market_product_link.ix_mp_product', 'ix_mpl_product', 'INDEX';
GO

-- FKs on the referencing tables
EXEC sp_rename 'dbo.fk_mps_mktprod', 'fk_mps_mplink', 'OBJECT';
EXEC sp_rename 'dbo.fk_mpp_mktprod', 'fk_mpp_mplink', 'OBJECT';
EXEC sp_rename 'dbo.fk_period_market_product', 'fk_period_market_product_link', 'OBJECT';
EXEC sp_rename 'dbo.uq_period_code_mp', 'uq_period_code_mpl', 'OBJECT';
EXEC sp_rename 'dbo.period.ix_period_market_product', 'ix_period_market_product_link', 'INDEX';
GO

CREATE TRIGGER dbo.trg_market_product_link_row_version_guard ON dbo.market_product_link AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.market_product_link (bypass write rejected by trg_market_product_link_row_version_guard)', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN deleted d ON i.[market_product_link_id] = d.[market_product_link_id]
        WHERE i.row_version <= d.row_version
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.market_product_link (stale or reused version rejected by trg_market_product_link_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO
