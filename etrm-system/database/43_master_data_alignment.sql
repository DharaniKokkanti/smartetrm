-- ============================================================
-- V43 — Master data alignment
--
-- Fixes gaps identified between TypeScript types, MSW seed data,
-- and the SQL schema:
--
--   1. book / desk / gl_account — add MULTI and OTHER to commodity_type
--      check constraints (DB was missing these, TS now includes them)
--
--   2. book — add go_live_date and description columns
--      (already present in some tables but missing in book specifically)
--
--   3. trader_commodity_limit — new junction table to back the per-
--      commodity limit structure already modelled in TypeScript and MSW
--      (trader table only had flat global limits previously)
-- ============================================================

-- ── 1. COMMODITY TYPE CHECK CONSTRAINTS — extend to include MULTI / OTHER ──

-- book.commodity_type
ALTER TABLE dbo.book DROP CONSTRAINT IF EXISTS ck_book_commodity_type;
ALTER TABLE dbo.book ADD
    CONSTRAINT ck_book_commodity_type
        CHECK (commodity_type IS NULL OR
               commodity_type IN ('OIL','GAS','POWER','AGRICULTURAL','METALS','MULTI','OTHER'));

-- desk.commodity_type
ALTER TABLE dbo.desk DROP CONSTRAINT IF EXISTS ck_desk_commodity_type;
ALTER TABLE dbo.desk ADD
    CONSTRAINT ck_desk_commodity_type
        CHECK (commodity_type IS NULL OR
               commodity_type IN ('OIL','GAS','POWER','AGRICULTURAL','METALS','MULTI','OTHER'));

-- gl_account.commodity_type (if constrained)
ALTER TABLE dbo.gl_account DROP CONSTRAINT IF EXISTS ck_gl_account_commodity_type;
ALTER TABLE dbo.gl_account ADD
    CONSTRAINT ck_gl_account_commodity_type
        CHECK (commodity_type IS NULL OR
               commodity_type IN ('OIL','GAS','POWER','AGRICULTURAL','METALS','MULTI','OTHER'));

-- ── 2. BOOK — add go_live_date and description if not present ──────────────
-- Guarded with IF NOT EXISTS pattern (SQL Server ≥ 2016)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.book') AND name = 'go_live_date'
)
    ALTER TABLE dbo.book ADD go_live_date DATE NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.book') AND name = 'description'
)
    ALTER TABLE dbo.book ADD description NVARCHAR(500) NULL;

-- ── 3. TRADER_COMMODITY_LIMIT — per-commodity trade and position limits ────
--
-- Replaces the flat global columns (daily_trade_limit, single_trade_limit,
-- position_limit) on dbo.trader with a normalised junction table.
-- Old columns are kept for backward compatibility; new API should use this table.
CREATE TABLE dbo.trader_commodity_limit (
    commodity_limit_id  INT             NOT NULL IDENTITY(1,1)  PRIMARY KEY,
    trader_id           INT             NOT NULL,
    commodity_type      VARCHAR(20)     NOT NULL,
    single_trade_limit  DECIMAL(18,2)   NULL,   -- max notional per single trade
    daily_trade_limit   DECIMAL(18,2)   NULL,   -- aggregate notional cap per day
    position_limit      DECIMAL(18,4)   NULL,   -- max net open position (physical UoM)
    limit_currency      CHAR(3)         NOT NULL DEFAULT 'USD',
    effective_from      DATE            NULL,
    effective_to        DATE            NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NULL,

    CONSTRAINT fk_tcl_trader
        FOREIGN KEY (trader_id) REFERENCES dbo.trader(trader_id),
    CONSTRAINT ck_tcl_commodity_type
        CHECK (commodity_type IN ('OIL','GAS','POWER','AGRICULTURAL','METALS','MULTI','OTHER')),
    CONSTRAINT uq_tcl_trader_commodity
        UNIQUE (trader_id, commodity_type)   -- one active row per trader/commodity
);

CREATE INDEX ix_tcl_trader ON dbo.trader_commodity_limit (trader_id);

-- Seed per-commodity limits from the existing flat rows on dbo.trader
-- (populates the junction table from current data for all active traders)
INSERT INTO dbo.trader_commodity_limit
    (trader_id, commodity_type, single_trade_limit, daily_trade_limit, position_limit, limit_currency)
SELECT
    t.trader_id,
    ct.commodity_type,
    t.single_trade_limit,
    t.daily_trade_limit,
    t.position_limit,
    ISNULL(t.limit_currency, 'USD')
FROM dbo.trader t
CROSS APPLY (
    -- Expand commodity_types CSV into rows
    SELECT TRIM(value) AS commodity_type
    FROM STRING_SPLIT(ISNULL(t.commodity_types, ''), ',')
    WHERE TRIM(value) <> ''
) ct
WHERE t.is_active = 1
  AND t.daily_trade_limit IS NOT NULL;
