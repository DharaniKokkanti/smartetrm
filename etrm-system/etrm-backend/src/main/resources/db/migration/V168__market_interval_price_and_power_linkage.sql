-- =============================================================================
-- V168 — Sub-hourly settlement granularity for real-time/day-ahead power
-- (and, going forward, any other market needing intraday interval prices —
-- e.g. gas balancing), plus closing a market/pnode linkage gap surfaced
-- while designing it.
--
-- Schema previously assumed daily-close granularity everywhere a price is
-- actually stored (dbo.settlement_price.settle_date is DATE — correct for
-- futures contract settlements across ALL commodities including power
-- futures, not being changed here; dbo.price_index has a single daily
-- fixing_time). Real power markets settle real-time at 5-minute (CAISO) or
-- 15-minute (ERCOT/PJM/MISO/SPP) intervals layered under hourly day-ahead —
-- a different data concept from settlement_price entirely (no
-- exchange/contract_ticker; identity is index/node + interval timestamp,
-- not a traded futures instrument). dbo.period (week/month/quarter tenor)
-- is also not the right home for this — that's listed contract tenor, not
-- intraday settlement interval.
--
-- 1. dbo.price_index: +settlement_interval_type (an index's own observation
--    granularity — non-power/existing indices default to DAILY, unchanged
--    behavior), +pnode_id (nullable FK to power_pnode, for indices tied to
--    a specific LMP settlement node), +price_type (DA/RT, NULL for non-power
--    indices). price_type lives here, not on the interval-price rows,
--    because DA and RT are different published series with different
--    values/timing — same convention as index_code already encoding
--    identity (DATED_BRENT vs WTI are separate rows, not a discriminator
--    column on one row) — e.g. "CAISO_SP15_DA" and "CAISO_SP15_RT" would be
--    two separate price_index rows, each with its own settlement_interval_type.
-- 2. dbo.market_interval_price: new time-series table for the actual
--    sub-hourly observations, keyed on (price_index_id, interval_start_utc).
--    Modeled on dbo.settlement_price, including row_version + full audit
--    columns — settlement_price itself only got those retrofitted later
--    (row_version via V131, created_by/updated_by via V150), so this table
--    starts with the current governance shape rather than settlement_price's
--    original pre-V131 one. Named market-neutral (not power_interval_price)
--    since other markets (e.g. gas balancing) will want the same shape
--    later rather than a third copy.
-- 3. dbo.market: +balancing_authority_id (nullable FK to balancing_authority)
--    — closes a real gap found while tracing the consumption chain: neither
--    power_pnode nor balancing_authority/transmission_zone link to
--    dbo.market, so there was no way to confirm a market-listed power
--    product (via market_product_link.market_id / pricing_rule.market_id)
--    actually corresponds to the same grid operator as the pnode its price
--    index resolves to. NULL for non-power markets.
-- 4. dbo.pricing_window_rule: +price_granularity so a pricing rule can
--    declare it averages sub-hourly interval prices (market_interval_price)
--    rather than daily closes (settlement_price). Averaging-engine logic
--    for interval-aware windows is a later implementation step — this only
--    adds the declarative field.
-- 5. dbo.formula_template.averaging_type: +INTRADAY_AVERAGE option, for
--    formulas that average sub-hourly interval prices rather than daily
--    fixings.
-- =============================================================================

ALTER TABLE dbo.price_index ADD settlement_interval_type VARCHAR(20) NOT NULL
    CONSTRAINT df_pi_settlement_interval DEFAULT 'DAILY'
    CONSTRAINT chk_pi_settlement_interval CHECK (settlement_interval_type IN (
        'DAILY',        -- existing behavior: one fixing/close per day (oil, gas, most indices)
        'HOURLY',       -- day-ahead power (PJM/MISO/ERCOT hourly nodes)
        'FIFTEEN_MIN',  -- real-time power settlement (ERCOT, PJM, MISO, SPP)
        'FIVE_MIN'      -- real-time power settlement (CAISO)
    ));
GO

ALTER TABLE dbo.price_index ADD pnode_id INT NULL;
GO
ALTER TABLE dbo.price_index ADD CONSTRAINT fk_pi_pnode FOREIGN KEY (pnode_id) REFERENCES dbo.power_pnode(pnode_id);
GO

ALTER TABLE dbo.price_index ADD price_type VARCHAR(2) NULL
    CONSTRAINT chk_pi_price_type CHECK (price_type IN ('DA', 'RT'));
GO

ALTER TABLE dbo.market ADD balancing_authority_id INT NULL;
GO
ALTER TABLE dbo.market ADD CONSTRAINT fk_mkt_balancing_authority FOREIGN KEY (balancing_authority_id) REFERENCES dbo.balancing_authority(balancing_authority_id);
GO

CREATE TABLE dbo.market_interval_price (
    market_interval_price_id BIGINT         NOT NULL IDENTITY(1,1),
    row_version               INT            NOT NULL CONSTRAINT df_mip_row_version DEFAULT 0,
    price_index_id           INT             NOT NULL,
    interval_start_utc       DATETIME2       NOT NULL,
    interval_minutes         TINYINT         NOT NULL
        CONSTRAINT chk_mip_interval CHECK (interval_minutes IN (5, 15, 60)),
    price                     DECIMAL(18,6)  NOT NULL,
    is_confirmed              BIT            NOT NULL CONSTRAINT df_mip_confirmed DEFAULT 0,
    source                    VARCHAR(100)   NULL,
    notes                     VARCHAR(500)   NULL,
    created_at                DATETIME2      NOT NULL CONSTRAINT df_mip_created DEFAULT SYSUTCDATETIME(),
    created_by                VARCHAR(100)   NOT NULL,
    updated_at                DATETIME2      NOT NULL CONSTRAINT df_mip_updated DEFAULT SYSUTCDATETIME(),
    updated_by                VARCHAR(100)   NOT NULL,

    CONSTRAINT pk_market_interval_price  PRIMARY KEY (market_interval_price_id),
    CONSTRAINT fk_mip_price_index        FOREIGN KEY (price_index_id) REFERENCES dbo.price_index(price_index_id),
    CONSTRAINT uq_mip_index_interval     UNIQUE (price_index_id, interval_start_utc)
);
GO
CREATE INDEX ix_mip_index_time ON dbo.market_interval_price (price_index_id, interval_start_utc DESC);
GO

ALTER TABLE dbo.pricing_window_rule ADD price_granularity VARCHAR(20) NOT NULL
    CONSTRAINT df_pwr_granularity DEFAULT 'DAILY'
    CONSTRAINT chk_pwr_granularity CHECK (price_granularity IN (
        'DAILY',        -- existing behavior: average from settlement_price
        'FIFTEEN_MIN',  -- average from market_interval_price, 15-min intervals
        'FIVE_MIN'      -- average from market_interval_price, 5-min intervals
    ));
GO

ALTER TABLE dbo.formula_template DROP CONSTRAINT chk_ft_avg;
GO
ALTER TABLE dbo.formula_template ADD CONSTRAINT chk_ft_avg CHECK (averaging_type IN (
    'DAILY',             -- simple average of daily fixings
    'WEIGHTED_DAILY',    -- volume-weighted daily average
    'MONTHLY_AVERAGE',   -- monthly average publication
    'INTRADAY_AVERAGE',  -- average of sub-hourly interval prices (market_interval_price)
    'NONE',              NULL
));
GO

PRINT '============================================================';
PRINT 'V168 — market_interval_price table created;';
PRINT '       price_index: +settlement_interval_type, +pnode_id, +price_type;';
PRINT '       market: +balancing_authority_id;';
PRINT '       pricing_window_rule: +price_granularity;';
PRINT '       formula_template.averaging_type: +INTRADAY_AVERAGE.';
PRINT '============================================================';
GO
