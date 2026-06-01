-- =============================================================================
-- ETRM SYSTEM — MARKET_PRODUCT_PERIOD DATE FIELDS PATCH
-- Adds last trading date, first notice date, settlement date,
-- delivery dates, expiry date and dynamic offset columns.
-- SQL Server 2022 | Version 1.1 | May 2026
-- =============================================================================
-- Run AFTER:
--   etrm_master_data_v2.0.sql
--   etrm_market_source_period.sql
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- ADD DATE COLUMNS TO MARKET_PRODUCT_PERIOD
-- =============================================================================

ALTER TABLE dbo.market_product_period ADD

    -- ── Concrete dates ────────────────────────────────────────────────────────
    -- Populated for known concrete periods (Jan-2027, Q1-2027 etc.)
    -- NULL for rolling periods — resolved dynamically using offset columns below.

    last_trading_date       DATE            NULL,
    -- Last day this contract can be traded or closed.
    -- After this date: no new positions, only delivery/settlement activity.

    first_notice_date       DATE            NULL,
    -- Physical delivery only.
    -- First day seller can submit notice of intent to deliver.
    -- NULL for financially settled contracts.

    settlement_price_date   DATE            NULL,
    -- The date whose price is used for final cash settlement.
    -- For ICE Brent: settlement price is on expiry day.
    -- For NYMEX WTI: settlement price is on LTD.
    -- Can differ from last_trading_date.

    delivery_start_date     DATE            NULL,
    -- Physical delivery only.
    -- First day of the delivery window.
    -- e.g. Oil: first day of delivery month.
    -- e.g. Power: first hour of delivery period.

    delivery_end_date       DATE            NULL,
    -- Physical delivery only.
    -- Last day of the delivery window.

    expiry_date             DATE            NULL,
    -- Contract expiry date — after this date contract ceases to exist.
    -- Usually same as or 1 day after last_trading_date.

    cash_settlement_date    DATE            NULL,
    -- Date cash actually moves for financially settled contracts.
    -- Calculated as settlement_price_date + settlement_offset_days
    -- adjusted for holiday_calendar. Stored once calculated.

    -- ── Dynamic offset columns ────────────────────────────────────────────────
    -- Used for rolling periods where concrete dates are not known yet.
    -- System resolves concrete dates at runtime:
    --   last_trading_date = period_end - ltd_offset_days (business days)
    --                       adjusted for offset_calendar_id holidays.
    -- Also used as the calculation rule for future concrete period generation.

    ltd_offset_days         SMALLINT        NULL,
    -- Number of business days before period_end that LTD falls.
    -- e.g. ICE Brent: 3 business days before end of month prior to delivery.
    -- e.g. NYMEX WTI: 3 business days before 25th of month prior to delivery.

    ltd_offset_type         VARCHAR(10)     NULL
        CONSTRAINT chk_mpp_ltd_type CHECK (ltd_offset_type IN (
            'CALENDAR',     -- N calendar days before reference date
            'BUSINESS',     -- N business days before reference date
            NULL
        )),

    fnd_offset_days         SMALLINT        NULL,
    -- Business days before period delivery start that FND falls.
    -- Physical delivery only. NULL for financial settlement.

    fnd_offset_type         VARCHAR(10)     NULL
        CONSTRAINT chk_mpp_fnd_type CHECK (fnd_offset_type IN (
            'CALENDAR','BUSINESS',NULL
        )),

    settlement_offset_days  SMALLINT        NULL,
    -- Days after settlement_price_date that cash settlement occurs.
    -- e.g. 2 business days after expiry.

    settlement_offset_type  VARCHAR(10)     NULL
        CONSTRAINT chk_mpp_settle_type CHECK (settlement_offset_type IN (
            'CALENDAR','BUSINESS',NULL
        )),

    offset_calendar_id      INT             NULL,
    -- Holiday calendar used for all business day offset calculations
    -- for this market/product/period combination.
    -- e.g. ICE Brent uses UK_BANK calendar.
    -- e.g. NYMEX WTI uses US_FEDERAL calendar.

    -- ── Reference date for offset calculations ────────────────────────────────
    -- Offsets are calculated relative to a reference date, not always period_end.
    -- e.g. NYMEX WTI LTD = 3 business days before the 25th of the month
    --      prior to delivery — NOT 3 days before period_end.

    ltd_reference_date_rule VARCHAR(50)     NULL,
    -- Plain-language rule for how to find the reference date.
    -- e.g. 'PERIOD_END', '25TH_OF_PRIOR_MONTH', 'LAST_BUSINESS_DAY_OF_PRIOR_MONTH'
    -- Used by the quant engine to resolve LTD for rolling periods.

    -- ── Audit ─────────────────────────────────────────────────────────────────
    dates_populated_at      DATETIME2       NULL,
    -- Timestamp when concrete dates were last calculated/populated.
    -- NULL = dates not yet resolved (rolling period, not yet calculated).

    dates_populated_by      VARCHAR(100)    NULL;
    -- 'SYSTEM' for batch-generated, username for manually overridden.
GO

-- Add FK for offset_calendar_id now that column exists
ALTER TABLE dbo.market_product_period
    ADD CONSTRAINT fk_mpp_calendar
        FOREIGN KEY (offset_calendar_id)
        REFERENCES dbo.holiday_calendar(calendar_id);
GO

-- Index to support date-range queries:
-- "give me all contracts expiring this week"
-- "give me all contracts with LTD in next 5 days" (risk/ops dashboard)
CREATE INDEX ix_mpp_ltd
    ON dbo.market_product_period (last_trading_date, is_active)
    INCLUDE (market_product_id, period_id, first_notice_date, expiry_date)
    WHERE last_trading_date IS NOT NULL;
GO

CREATE INDEX ix_mpp_expiry
    ON dbo.market_product_period (expiry_date, is_active)
    INCLUDE (market_product_id, period_id, last_trading_date)
    WHERE expiry_date IS NOT NULL;
GO

CREATE INDEX ix_mpp_delivery
    ON dbo.market_product_period (delivery_start_date, delivery_end_date, is_active)
    INCLUDE (market_product_id, period_id)
    WHERE delivery_start_date IS NOT NULL;
GO


-- =============================================================================
-- EXAMPLE: how offset columns work together
-- =============================================================================
/*
SCENARIO: ICE Brent Crude Futures — Jan 2027 contract

market_product_period row:
    market_product_id       = <ICE Brent market_product row>
    period_id               = <Jan-2027 period row>

    -- Offset rules (defined once at market/product level, apply to all months)
    ltd_offset_days         = 3
    ltd_offset_type         = 'BUSINESS'
    ltd_reference_date_rule = 'LAST_BUSINESS_DAY_OF_PRIOR_MONTH'
    offset_calendar_id      = <UK_BANK calendar>

    settlement_offset_days  = 0          -- settles on expiry day itself
    settlement_offset_type  = 'BUSINESS'

    -- Concrete dates (populated by batch job or at deal capture for near months)
    last_trading_date       = '2026-11-27'   -- 3 business days before Nov month-end
    settlement_price_date   = '2026-11-27'   -- same as LTD for ICE Brent
    expiry_date             = '2026-11-28'
    delivery_start_date     = '2027-01-01'
    delivery_end_date       = '2027-01-31'
    cash_settlement_date    = '2026-11-27'   -- financial: T+0

---

SCENARIO: NYMEX WTI Crude Futures — Jan 2027 contract

    ltd_offset_days         = 3
    ltd_offset_type         = 'BUSINESS'
    ltd_reference_date_rule = '25TH_OF_PRIOR_MONTH'
    -- LTD = 3 business days before 25th December 2026

    last_trading_date       = '2026-12-19'
    first_notice_date       = '2026-12-01'   -- physical delivery FND
    settlement_price_date   = '2026-12-19'
    expiry_date             = '2026-12-19'
    delivery_start_date     = '2027-01-01'
    delivery_end_date       = '2027-01-31'
    cash_settlement_date    = NULL           -- physical: no cash settlement

---

SCENARIO: TTF Gas Month-Ahead (rolling M+1)

    -- Offset rules only — concrete dates resolved at runtime
    ltd_offset_days         = 1
    ltd_offset_type         = 'BUSINESS'
    ltd_reference_date_rule = 'LAST_BUSINESS_DAY_OF_PRIOR_MONTH'
    settlement_offset_days  = 2
    settlement_offset_type  = 'BUSINESS'
    offset_calendar_id      = <TTF_GAS calendar>

    -- Concrete dates NULL until batch job resolves them
    last_trading_date       = NULL
    settlement_price_date   = NULL
    cash_settlement_date    = NULL
*/


-- =============================================================================
-- USAGE QUERIES
-- =============================================================================
/*
-- Q1: All contracts expiring in next 7 days (risk/ops alert dashboard)
SELECT
    m.market_code,
    p.product_code,
    per.period_code,
    mpp.last_trading_date,
    mpp.expiry_date,
    mpp.settlement_price_date,
    mpp.cash_settlement_date
FROM dbo.market_product_period mpp
JOIN dbo.market_product mp  ON mp.market_product_id  = mpp.market_product_id
JOIN dbo.market         m   ON m.market_id           = mp.market_id
JOIN dbo.product        p   ON p.product_id          = mp.product_id
JOIN dbo.period         per ON per.period_id         = mpp.period_id
WHERE mpp.last_trading_date BETWEEN CAST(GETUTCDATE() AS DATE)
                                AND DATEADD(DAY, 7, CAST(GETUTCDATE() AS DATE))
AND   mpp.is_active = 1
ORDER BY mpp.last_trading_date;

-- Q2: All physical contracts with FND in next 5 days
SELECT
    m.market_code,
    p.product_code,
    per.period_code,
    mpp.first_notice_date,
    mpp.delivery_start_date,
    mpp.delivery_end_date
FROM dbo.market_product_period mpp
JOIN dbo.market_product mp  ON mp.market_product_id = mpp.market_product_id
JOIN dbo.market         m   ON m.market_id          = mp.market_id
JOIN dbo.product        p   ON p.product_id         = mp.product_id
JOIN dbo.period         per ON per.period_id        = mpp.period_id
WHERE mpp.first_notice_date BETWEEN CAST(GETUTCDATE() AS DATE)
                                AND DATEADD(DAY, 5, CAST(GETUTCDATE() AS DATE))
AND   mpp.is_active = 1
ORDER BY mpp.first_notice_date;
*/

PRINT '============================================================';
PRINT 'MARKET_PRODUCT_PERIOD DATE FIELDS PATCH v1.1 APPLIED';
PRINT '  Concrete date fields : last_trading_date, first_notice_date,';
PRINT '                         settlement_price_date, delivery_start_date,';
PRINT '                         delivery_end_date, expiry_date,';
PRINT '                         cash_settlement_date';
PRINT '  Offset rule fields   : ltd_offset_days/type, fnd_offset_days/type,';
PRINT '                         settlement_offset_days/type,';
PRINT '                         offset_calendar_id, ltd_reference_date_rule';
PRINT '  Indexes added        : ix_mpp_ltd, ix_mpp_expiry, ix_mpp_delivery';
PRINT '============================================================';
GO
