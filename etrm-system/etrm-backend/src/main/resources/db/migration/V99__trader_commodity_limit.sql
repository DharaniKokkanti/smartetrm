-- =============================================================================
-- V99 — dbo.trader_commodity_limit + dbo.desk audit column gap
-- =============================================================================
-- BUG 1: the frontend Trader type/form (organization/traders) already has a
-- `commodityLimits: TraderCommodityLimit[]` field — per-commodity
-- daily/single-trade/position limit overrides, distinct from the flat
-- trader-level limits already on dbo.trader — but no table backing it was
-- ever built. Found while building TraderController (this table's backend
-- had zero implementation, same class of gap as currency/country).
--
-- FIX: new child table, one row per (trader, commodity_type) override. FK on
-- commodity_type -> dbo.commodity_type(commodity_type_id), the dedicated
-- table V85 built and redirected dbo.desk.commodity_type/dbo.book.commodity_type
-- onto (superseding V55's original lookup_value-based version).
--
-- BUG 2: dbo.desk only ever had created_at/created_by (V1) — never got
-- updated_at/updated_by like dbo.book/dbo.trader did — but the frontend
-- Desk type already has `updatedAt`. Found building DeskController. Adds
-- the missing pair, backfilled from created_at/created_by for existing rows
-- (no real update history to recover), same pattern as every other
-- AuditableEntity-shaped table in the schema.
-- =============================================================================

CREATE TABLE dbo.trader_commodity_limit (
    trader_commodity_limit_id  INT             NOT NULL IDENTITY(1,1),
    trader_id                  INT             NOT NULL,
    commodity_type             INT             NOT NULL,
    daily_trade_limit          DECIMAL(18,2)   NULL,
    single_trade_limit         DECIMAL(18,2)   NULL,
    position_limit             DECIMAL(18,4)   NULL,

    CONSTRAINT pk_trader_commodity_limit    PRIMARY KEY (trader_commodity_limit_id),
    CONSTRAINT fk_tcl_trader                FOREIGN KEY (trader_id) REFERENCES dbo.trader(trader_id),
    CONSTRAINT fk_tcl_commodity_type        FOREIGN KEY (commodity_type) REFERENCES dbo.commodity_type(commodity_type_id),
    CONSTRAINT uq_tcl_trader_commodity      UNIQUE (trader_id, commodity_type)
);
GO

ALTER TABLE dbo.desk ADD updated_at DATETIME2 NULL;
GO
ALTER TABLE dbo.desk ADD updated_by VARCHAR(100) NULL;
GO
UPDATE dbo.desk SET updated_at = created_at, updated_by = created_by;
GO
ALTER TABLE dbo.desk ALTER COLUMN updated_at DATETIME2 NOT NULL;
GO
ALTER TABLE dbo.desk ALTER COLUMN updated_by VARCHAR(100) NOT NULL;
GO

PRINT '============================================================';
PRINT 'V99 — TRADER_COMMODITY_LIMIT TABLE ADDED; DESK AUDIT COLUMNS FIXED';
PRINT '  dbo.trader_commodity_limit backs Trader.commodityLimits, which';
PRINT '  the frontend already had UI for but no table existed until now.';
PRINT '  dbo.desk +updated_at/+updated_by, backfilled from created_at/by.';
PRINT '============================================================';
GO
