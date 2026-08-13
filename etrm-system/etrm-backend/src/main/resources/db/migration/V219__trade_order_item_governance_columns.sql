-- V219: trade_order and trade_item never got the platform's standard
-- governance columns (row_version + created_by/updated_by; trade_item was
-- also missing updated_at). Both tables have no live JPA entity (Trade
-- Capture has no real backend controller yet) and 0 rows, so every earlier
-- completeness audit (V144-V151, V194, V198 -- all Java-entity-driven) never
-- surfaced them; the schema-driven V199 reorder pass only reordered audit
-- columns that already existed, it did not add missing ones. Found live
-- 2026-08-13 while reviewing the Trade Capture core hierarchy column by
-- column.
--
-- Both tables are 0 rows, so NOT NULL columns can be added directly with no
-- backfill needed. New columns land at the physical end (SQL Server ALTER
-- TABLE ADD always appends) -- matches every other backfill in this
-- project's history; a canonical-order reorder (V199-style) can follow later
-- if desired, it is a purely cosmetic pass, not a correctness one.

USE ETRM_DB;
GO

ALTER TABLE dbo.trade_order
    ADD row_version INT NOT NULL CONSTRAINT df_trade_order_row_version DEFAULT (0),
        created_by VARCHAR(100) NOT NULL,
        updated_by VARCHAR(100) NOT NULL;
GO

ALTER TABLE dbo.trade_item
    ADD row_version INT NOT NULL CONSTRAINT df_trade_item_row_version DEFAULT (0),
        created_by VARCHAR(100) NOT NULL,
        updated_at DATETIME2 NOT NULL CONSTRAINT df_trade_item_updated_at DEFAULT (GETDATE()),
        updated_by VARCHAR(100) NOT NULL;
GO

CREATE TRIGGER dbo.trg_trade_order_row_version_guard ON dbo.trade_order AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.trade_order (bypass write rejected by trg_trade_order_row_version_guard)', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN deleted d ON i.[order_id] = d.[order_id]
        WHERE i.row_version <= d.row_version
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.trade_order (stale or reused version rejected by trg_trade_order_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO

CREATE TRIGGER dbo.trg_trade_item_row_version_guard ON dbo.trade_item AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.trade_item (bypass write rejected by trg_trade_item_row_version_guard)', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN deleted d ON i.[item_id] = d.[item_id]
        WHERE i.row_version <= d.row_version
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.trade_item (stale or reused version rejected by trg_trade_item_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO
