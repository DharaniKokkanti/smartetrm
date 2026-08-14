-- V221: platform-wide table-naming convention introduced by Dharani
-- (2026-08-14) -- mst_ for system/admin-only master data, ref_ for
-- user-managed reference data, tran_ for transaction tables (trade capture,
-- and eventually position/P&L/pricing/cost engines as they get built).
--
-- This migration covers the first, safe tranche: the 25 real Trade Capture
-- tables get the tran_ prefix. Chosen to go first because none of them has
-- a live JPA entity or real backend controller yet (Trade Capture is
-- schema-only/mock-only per this project's own handoff doc) -- so this is a
-- pure DB-layer rename with zero live Java/frontend breakage, unlike the
-- much larger mst_/ref_ split still pending across the other ~430 tables
-- (many of which back live, working pages and need a staged, code-aware
-- pass, not a blind rename).
--
-- trade_repository deliberately excluded (Dharani: exclude it) -- it is
-- reference/regulatory data (data_category=MASTER_DATA), not a transaction,
-- despite living in the trade_ table family; it'll get mst_/ref_ in that
-- later pass instead.
--
-- trade and trade_pricing_schedule are SQL Server system-versioned temporal
-- tables -- SYSTEM_VERSIONING must be turned off, both the main and history
-- table renamed, then re-linked, exactly the pattern already proven in
-- V200/V201 for this same table.

USE ETRM_DB;
GO

-- 1. Suspend system versioning on the two temporal pairs before renaming
ALTER TABLE dbo.trade SET (SYSTEM_VERSIONING = OFF);
GO
ALTER TABLE dbo.trade_pricing_schedule SET (SYSTEM_VERSIONING = OFF);
GO

-- 2. Rename every Trade Capture table (main tables, history tables, and the
--    12 commodity/instrument detail + order-support + cost/custom-field
--    tables)
EXEC sp_rename 'dbo.trade', 'tran_trade', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_history', 'tran_trade_history', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_order', 'tran_trade_order', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_item', 'tran_trade_item', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_agri_detail', 'tran_trade_agri_detail', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_freight_detail', 'tran_trade_freight_detail', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_lng_detail', 'tran_trade_lng_detail', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_metals_detail', 'tran_trade_metals_detail', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_oil_detail', 'tran_trade_oil_detail', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_power_detail', 'tran_trade_power_detail', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_option_detail', 'tran_trade_option_detail', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_swap_detail', 'tran_trade_swap_detail', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_storage_agreement_detail', 'tran_trade_storage_agreement_detail', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_transport_agreement_detail', 'tran_trade_transport_agreement_detail', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_transmission_right_detail', 'tran_trade_transmission_right_detail', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_order_assay_result', 'tran_trade_order_assay_result', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_order_balmo', 'tran_trade_order_balmo', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_order_tas', 'tran_trade_order_tas', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_order_cost', 'tran_trade_order_cost', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_order_price_adjustment', 'tran_trade_order_price_adjustment', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_order_custom_field_value', 'tran_trade_order_custom_field_value', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_cost', 'tran_trade_cost', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_custom_field_value', 'tran_trade_custom_field_value', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_pricing_schedule', 'tran_trade_pricing_schedule', 'OBJECT';
GO
EXEC sp_rename 'dbo.trade_pricing_schedule_history', 'tran_trade_pricing_schedule_history', 'OBJECT';
GO

-- 3. Re-link system versioning under the new names
ALTER TABLE dbo.tran_trade SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.tran_trade_history));
GO
ALTER TABLE dbo.tran_trade_pricing_schedule SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.tran_trade_pricing_schedule_history));
GO

-- 4. The two row_version-guard triggers added in V219 hardcode the old
--    table name in their RAISERROR text -- drop and recreate against the
--    renamed tables so the error text stays accurate. sp_rename does not
--    touch trigger body text, only object bindings.
DROP TRIGGER dbo.trg_trade_order_row_version_guard;
GO
DROP TRIGGER dbo.trg_trade_item_row_version_guard;
GO

CREATE TRIGGER dbo.trg_tran_trade_order_row_version_guard ON dbo.tran_trade_order AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.tran_trade_order (bypass write rejected by trg_tran_trade_order_row_version_guard)', 16, 1);
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
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.tran_trade_order (stale or reused version rejected by trg_tran_trade_order_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO

CREATE TRIGGER dbo.trg_tran_trade_item_row_version_guard ON dbo.tran_trade_item AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.tran_trade_item (bypass write rejected by trg_tran_trade_item_row_version_guard)', 16, 1);
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
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.tran_trade_item (stale or reused version rejected by trg_tran_trade_item_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO

-- 5. Keep the registry in sync with the real table names
UPDATE dbo.master_data_table_registry
SET table_name = 'tran_' + table_name,
    updated_at = SYSUTCDATETIME(),
    updated_by = 'flyway_migration',
    row_version = row_version + 1
WHERE table_name IN (
    'trade', 'trade_item', 'trade_order', 'trade_history',
    'trade_agri_detail', 'trade_freight_detail', 'trade_lng_detail',
    'trade_metals_detail', 'trade_oil_detail', 'trade_power_detail',
    'trade_option_detail', 'trade_swap_detail',
    'trade_storage_agreement_detail', 'trade_transport_agreement_detail',
    'trade_transmission_right_detail', 'trade_order_assay_result',
    'trade_order_balmo', 'trade_order_tas', 'trade_order_cost',
    'trade_order_price_adjustment', 'trade_order_custom_field_value',
    'trade_cost', 'trade_custom_field_value', 'trade_pricing_schedule',
    'trade_pricing_schedule_history'
);
GO
