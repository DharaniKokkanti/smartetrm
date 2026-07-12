-- =============================================================================
-- ETRM SYSTEM — MARKET, PRICE SOURCE & PERIOD TABLES
-- SQL Server 2022 | Version 1.0 | May 2026
-- 11 tables across 3 groups:
--   Market group        : exchange, market, market_hours,
--                         market_holiday_calendar, market_product
--   Price source group  : price_source, price_index_source,
--                         market_product_source
--   Period group        : period, market_product_period, period_mapping
-- =============================================================================
-- Run AFTER:
--   etrm_master_data_v2.0.sql   (currency, commodity, product,
--                                price_index, holiday_calendar)
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- CLEANUP — safe re-run, reverse FK order
-- =============================================================================
IF OBJECT_ID('dbo.period_mapping',          'U') IS NOT NULL DROP TABLE dbo.period_mapping;
IF OBJECT_ID('dbo.market_product_period',   'U') IS NOT NULL DROP TABLE dbo.market_product_period;
IF OBJECT_ID('dbo.period',                  'U') IS NOT NULL DROP TABLE dbo.period;
IF OBJECT_ID('dbo.market_product_source',   'U') IS NOT NULL DROP TABLE dbo.market_product_source;
IF OBJECT_ID('dbo.price_index_source',      'U') IS NOT NULL DROP TABLE dbo.price_index_source;
IF OBJECT_ID('dbo.price_source',            'U') IS NOT NULL DROP TABLE dbo.price_source;
IF OBJECT_ID('dbo.market_product',          'U') IS NOT NULL DROP TABLE dbo.market_product;
IF OBJECT_ID('dbo.market_holiday_calendar', 'U') IS NOT NULL DROP TABLE dbo.market_holiday_calendar;
IF OBJECT_ID('dbo.market_hours',            'U') IS NOT NULL DROP TABLE dbo.market_hours;
IF OBJECT_ID('dbo.market',                  'U') IS NOT NULL DROP TABLE dbo.market;
IF OBJECT_ID('dbo.exchange',                'U') IS NOT NULL DROP TABLE dbo.exchange;
GO


-- =============================================================================
-- GROUP 1 — MARKET
-- =============================================================================

-- 01. EXCHANGE
-- The exchange entity. One exchange runs multiple markets.
-- e.g. ICE runs ICE Brent Futures AND ICE Gas markets.
-- OTC markets have no exchange — market.exchange_id is NULL for those.
-- =============================================================================
CREATE TABLE dbo.exchange (
    exchange_id         INT             NOT NULL IDENTITY(1,1),
    exchange_code       VARCHAR(20)     NOT NULL,   -- 'ICE','NYMEX','LME','EEX','CBOT'
    exchange_name       VARCHAR(200)    NOT NULL,
    exchange_type       VARCHAR(20)     NOT NULL
        CONSTRAINT chk_exch_type CHECK (exchange_type IN (
            'EXCHANGE',     -- regulated exchange
            'ECN',          -- electronic communication network
            'DARK_POOL',    -- dark pool / alternative venue
            'OTC_PLATFORM'  -- OTC platform (e.g. Tradition, ICAP)
        )),
    country_code        CHAR(2)         NOT NULL,
    city                VARCHAR(100)    NULL,
    timezone            VARCHAR(50)     NOT NULL,   -- IANA e.g. 'America/New_York'
    currency_id         INT             NOT NULL,   -- exchange's native currency
    regulator           VARCHAR(100)    NULL,       -- 'FCA','CFTC','BaFin','MAS'
    regulatory_code     VARCHAR(50)     NULL,       -- exchange's regulatory identifier
    mic_code            CHAR(4)         NULL,       -- ISO 10383 Market Identifier Code
    website             VARCHAR(200)    NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_exchange          PRIMARY KEY (exchange_id),
    CONSTRAINT uq_exchange_code     UNIQUE      (exchange_code),
    CONSTRAINT fk_exch_currency     FOREIGN KEY (currency_id) REFERENCES dbo.currency(currency_id)
);
GO
-- Filtered unique index, not a table-level UNIQUE constraint: mic_code is
-- nullable and SQL Server treats multiple NULLs as duplicates under a plain
-- UNIQUE constraint (unlike Postgres) — OTC platforms (ICAP, TRAD) have no
-- MIC code, so a plain UNIQUE constraint here rejects the second NULL row.
CREATE UNIQUE INDEX uq_exchange_mic ON dbo.exchange (mic_code) WHERE mic_code IS NOT NULL;
GO
CREATE INDEX ix_exchange_country ON dbo.exchange (country_code, is_active);
GO


-- 02. MARKET
-- Individual trading market — exchange-traded or OTC.
-- A market belongs to one commodity type and one optional exchange.
-- OTC markets: exchange_id = NULL, market_type = 'OTC' or 'BILATERAL'.
-- =============================================================================
CREATE TABLE dbo.market (
    market_id           INT             NOT NULL IDENTITY(1,1),
    exchange_id         INT             NULL,       -- NULL for OTC/bilateral markets
    commodity_id        INT             NOT NULL,
    market_code         VARCHAR(30)     NOT NULL,   -- 'ICE_BRENT','NYMEX_WTI','OTC_NS_PHYSICAL'
    market_name         VARCHAR(200)    NOT NULL,
    market_type         VARCHAR(20)     NOT NULL
        CONSTRAINT chk_mkt_type CHECK (market_type IN (
            'EXCHANGE',     -- listed on an exchange, cleared
            'OTC_CLEARED',  -- OTC but centrally cleared
            'OTC_BILATERAL',-- OTC bilateral, no central clearing
            'BROKER',       -- intermediated by broker
            'INTERNAL'      -- internal/intercompany market
        )),
    settlement_type     VARCHAR(20)     NOT NULL
        CONSTRAINT chk_mkt_settle CHECK (settlement_type IN (
            'PHYSICAL',     -- physical delivery
            'FINANCIAL',    -- cash settled
            'BOTH'          -- both available depending on product
        )),
    currency_id         INT             NOT NULL,   -- market's quoting currency
    timezone            VARCHAR(50)     NOT NULL,   -- market's primary timezone
    country_code        CHAR(2)         NULL,       -- primary jurisdiction
    clearing_house      VARCHAR(100)    NULL,       -- e.g. 'LCH','CME_Clearing','ICE_Clear'
    contract_size       DECIMAL(18,4)   NULL,       -- standard lot/contract size
    contract_uom_id     INT             NULL,       -- UOM for contract size
    price_quotation     VARCHAR(100)    NULL,       -- e.g. 'USD per barrel','EUR per MWh'
    tick_size           DECIMAL(18,6)   NULL,       -- minimum price movement
    is_active           BIT             NOT NULL DEFAULT 1,
    go_live_date        DATE            NULL,
    close_date          DATE            NULL,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_market            PRIMARY KEY (market_id),
    CONSTRAINT uq_market_code       UNIQUE      (market_code),
    CONSTRAINT fk_mkt_exchange      FOREIGN KEY (exchange_id)    REFERENCES dbo.exchange(exchange_id),
    CONSTRAINT fk_mkt_commodity     FOREIGN KEY (commodity_id)   REFERENCES dbo.commodity(commodity_id),
    CONSTRAINT fk_mkt_currency      FOREIGN KEY (currency_id)    REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_mkt_uom           FOREIGN KEY (contract_uom_id) REFERENCES dbo.unit_of_measure(uom_id)
) WITH (DATA_COMPRESSION = ROW);
GO
CREATE INDEX ix_market_commodity ON dbo.market (commodity_id, market_type, is_active);
CREATE INDEX ix_market_exchange  ON dbo.market (exchange_id, is_active) WHERE exchange_id IS NOT NULL;
GO


-- 03. MARKET_HOURS
-- Trading session hours per market per day of week.
-- A market can have multiple sessions per day (pre-market, main, after-hours).
-- All times stored in UTC — converted for display using market.timezone.
-- =============================================================================
CREATE TABLE dbo.market_hours (
    market_hours_id     INT             NOT NULL IDENTITY(1,1),
    market_id           INT             NOT NULL,
    day_of_week         TINYINT         NOT NULL    -- 1=Monday ... 7=Sunday (ISO 8601)
        CONSTRAINT chk_mh_dow CHECK (day_of_week BETWEEN 1 AND 7),
    session_type        VARCHAR(20)     NOT NULL DEFAULT 'MAIN'
        CONSTRAINT chk_mh_session CHECK (session_type IN (
            'PRE_MARKET',   -- pre-open / pre-trade session
            'MAIN',         -- main trading session
            'AFTER_HOURS',  -- after-hours / evening session
            'AUCTION'       -- opening or closing auction window
        )),
    open_time_utc       TIME            NOT NULL,
    close_time_utc      TIME            NOT NULL,
    is_trading_day      BIT             NOT NULL DEFAULT 1,  -- FALSE = market closed this day
    effective_from      DATE            NOT NULL DEFAULT '2020-01-01',
    effective_to        DATE            NULL,       -- NULL = currently in effect
    notes               VARCHAR(200)    NULL,

    CONSTRAINT pk_market_hours      PRIMARY KEY (market_hours_id),
    CONSTRAINT uq_market_hours      UNIQUE      (market_id, day_of_week, session_type, effective_from),
    CONSTRAINT fk_mh_market         FOREIGN KEY (market_id) REFERENCES dbo.market(market_id),
    CONSTRAINT chk_mh_times         CHECK       (close_time_utc > open_time_utc)
);
GO
CREATE INDEX ix_market_hours_mkt ON dbo.market_hours (market_id, day_of_week, is_trading_day);
GO


-- 04. MARKET_HOLIDAY_CALENDAR
-- Links a market to one or more holiday calendars.
-- A market may observe multiple calendars (e.g. UK + US bank holidays).
-- =============================================================================
CREATE TABLE dbo.market_holiday_calendar (
    mhc_id              INT             NOT NULL IDENTITY(1,1),
    market_id           INT             NOT NULL,
    calendar_id         INT             NOT NULL,
    priority            TINYINT         NOT NULL DEFAULT 1,   -- 1 = primary calendar
    is_active           BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_mhc               PRIMARY KEY (mhc_id),
    CONSTRAINT uq_mhc               UNIQUE      (market_id, calendar_id),
    CONSTRAINT fk_mhc_market        FOREIGN KEY (market_id)   REFERENCES dbo.market(market_id),
    CONSTRAINT fk_mhc_calendar      FOREIGN KEY (calendar_id) REFERENCES dbo.holiday_calendar(calendar_id)
);
GO


-- 05. MARKET_PRODUCT
-- Which products are tradeable on which market.
-- A product can trade on multiple markets (e.g. WTI on NYMEX and ICE).
-- Carries market-specific product attributes that override product defaults.
-- =============================================================================
CREATE TABLE dbo.market_product (
    market_product_id   INT             NOT NULL IDENTITY(1,1),
    market_id           INT             NOT NULL,
    product_id          INT             NOT NULL,
    -- Market-specific overrides (NULL = use product defaults)
    ticker              VARCHAR(50)     NULL,       -- exchange ticker / contract code
    currency_id         INT             NULL,       -- if different from market default
    uom_id              INT             NULL,       -- if different from product default
    lot_size            DECIMAL(18,4)   NULL,
    min_quantity        DECIMAL(18,4)   NULL,
    max_quantity        DECIMAL(18,4)   NULL,
    price_precision     TINYINT         NULL,       -- decimal places for price display
    -- Settlement
    settlement_type     VARCHAR(20)     NULL        -- override product-level if needed
        CONSTRAINT chk_mp_settle CHECK (settlement_type IN (
            'PHYSICAL','FINANCIAL','OPTIONS','SWAP',NULL
        )),
    first_notice_day_offset SMALLINT    NULL,       -- days before expiry for FND
    last_trading_day_offset SMALLINT    NULL,       -- days before delivery month end
    -- Status
    is_active           BIT             NOT NULL DEFAULT 1,
    listed_date         DATE            NULL,
    delisted_date       DATE            NULL,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_market_product    PRIMARY KEY (market_product_id),
    CONSTRAINT uq_market_product    UNIQUE      (market_id, product_id),
    CONSTRAINT fk_mp_market         FOREIGN KEY (market_id)   REFERENCES dbo.market(market_id),
    CONSTRAINT fk_mp_product        FOREIGN KEY (product_id)  REFERENCES dbo.product(product_id),
    CONSTRAINT fk_mp_currency       FOREIGN KEY (currency_id) REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_mp_uom            FOREIGN KEY (uom_id)      REFERENCES dbo.unit_of_measure(uom_id)
);
GO
CREATE INDEX ix_mp_market   ON dbo.market_product (market_id,  is_active) INCLUDE (product_id, ticker);
CREATE INDEX ix_mp_product  ON dbo.market_product (product_id, is_active) INCLUDE (market_id,  ticker);
GO


-- =============================================================================
-- GROUP 2 — PRICE SOURCE
-- =============================================================================

-- 06. PRICE_SOURCE
-- The vendor, exchange, or mechanism that publishes prices.
-- Separate from market and price_index — one source can serve many markets
-- and one index can have multiple sources (Platts vs Argus Dated Brent).
-- =============================================================================
CREATE TABLE dbo.price_source (
    price_source_id     INT             NOT NULL IDENTITY(1,1),
    source_code         VARCHAR(30)     NOT NULL,   -- 'PLATTS','ARGUS','BLOOMBERG','ICE_DATA'
    source_name         VARCHAR(200)    NOT NULL,
    source_type         VARCHAR(20)     NOT NULL
        CONSTRAINT chk_ps_type CHECK (source_type IN (
            'EXCHANGE',     -- exchange official prices (ICE, NYMEX settlement)
            'VENDOR',       -- price reporting agency (Platts, Argus, ICIS)
            'BROKER',       -- broker mid/composite prices
            'BLOOMBERG',    -- Bloomberg terminal feed
            'REUTERS',      -- Refinitiv/Reuters feed
            'INTERNAL',     -- manually entered or internally calculated
            'OTHER'
        )),
    delivery_method     VARCHAR(20)     NOT NULL DEFAULT 'API'
        CONSTRAINT chk_ps_delivery CHECK (delivery_method IN (
            'API',          -- REST/FIX/proprietary API
            'FTP',          -- file delivery via FTP/SFTP
            'EMAIL',        -- emailed price sheets
            'MANUAL',       -- manually keyed
            'REAL_TIME_FEED'-- streaming feed (e.g. Bloomberg B-PIPE)
        )),
    frequency           VARCHAR(20)     NOT NULL DEFAULT 'EOD'
        CONSTRAINT chk_ps_freq CHECK (frequency IN (
            'REAL_TIME',    -- tick-by-tick
            'INTRADAY',     -- multiple times per day
            'EOD',          -- end of day
            'WEEKLY',
            'MANUAL'        -- no fixed schedule
        )),
    timezone            VARCHAR(50)     NULL,       -- timezone of published prices
    base_url            VARCHAR(300)    NULL,       -- API endpoint / FTP host
    credentials_ref     VARCHAR(100)    NULL,       -- reference to secrets vault key
    -- NEVER store actual credentials in the database
    sla_minutes         SMALLINT        NULL,       -- expected delivery SLA in minutes after close
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_price_source      PRIMARY KEY (price_source_id),
    CONSTRAINT uq_price_source_code UNIQUE      (source_code)
);
GO


-- 07. PRICE_INDEX_SOURCE
-- Which price source(s) serve each price index.
-- One index can have multiple sources with different roles:
--   PRIMARY_MTM   = used for daily mark-to-market
--   SETTLEMENT    = used for contract settlement / expiry
--   BACKUP        = fallback if primary unavailable
--   REFERENCE     = reference / cross-check only
-- =============================================================================
CREATE TABLE dbo.price_index_source (
    pis_id              INT             NOT NULL IDENTITY(1,1),
    price_index_id      INT             NOT NULL,
    price_source_id     INT             NOT NULL,
    source_role         VARCHAR(20)     NOT NULL
        CONSTRAINT chk_pis_role CHECK (source_role IN (
            'PRIMARY_MTM',  -- daily MTM valuation
            'SETTLEMENT',   -- contract settlement/expiry
            'BACKUP',       -- fallback if primary fails
            'REFERENCE'     -- cross-check / secondary
        )),
    -- Source-specific field mapping
    source_field_code   VARCHAR(100)    NULL,  -- vendor-specific field e.g. 'PCAAS00' (Platts)
    source_ticker       VARCHAR(100)    NULL,  -- Bloomberg ticker or equivalent
    price_multiplier    DECIMAL(10,6)   NOT NULL DEFAULT 1.0, -- apply to raw price if needed
    price_offset        DECIMAL(18,4)   NOT NULL DEFAULT 0.0, -- add to raw price if needed
    -- Validity
    effective_from      DATE            NOT NULL,
    effective_to        DATE            NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(300)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_pis               PRIMARY KEY (pis_id),
    CONSTRAINT uq_pis               UNIQUE      (price_index_id, price_source_id, source_role),
    CONSTRAINT fk_pis_index         FOREIGN KEY (price_index_id)  REFERENCES dbo.price_index(price_index_id),
    CONSTRAINT fk_pis_source        FOREIGN KEY (price_source_id) REFERENCES dbo.price_source(price_source_id)
);
GO
CREATE INDEX ix_pis_index  ON dbo.price_index_source (price_index_id,  is_active, source_role);
CREATE INDEX ix_pis_source ON dbo.price_index_source (price_source_id, is_active);
GO


-- 08. MARKET_PRODUCT_SOURCE
-- Which price source provides prices for a specific product on a specific market.
-- Links the market_product to its data feed.
-- e.g. ICE Brent Futures prices come from ICE Data Services (primary)
--      and Bloomberg (backup).
-- =============================================================================
CREATE TABLE dbo.market_product_source (
    mps_id              INT             NOT NULL IDENTITY(1,1),
    market_product_id   INT             NOT NULL,
    price_source_id     INT             NOT NULL,
    source_role         VARCHAR(20)     NOT NULL
        CONSTRAINT chk_mps_role CHECK (source_role IN (
            'PRIMARY_MTM','SETTLEMENT','BACKUP','REFERENCE'
        )),
    source_ticker       VARCHAR(100)    NULL,   -- market/product specific ticker
    source_field_code   VARCHAR(100)    NULL,   -- vendor field identifier
    effective_from      DATE            NOT NULL,
    effective_to        DATE            NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(300)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_mps               PRIMARY KEY (mps_id),
    CONSTRAINT uq_mps               UNIQUE      (market_product_id, price_source_id, source_role),
    CONSTRAINT fk_mps_mktprod       FOREIGN KEY (market_product_id) REFERENCES dbo.market_product(market_product_id),
    CONSTRAINT fk_mps_source        FOREIGN KEY (price_source_id)   REFERENCES dbo.price_source(price_source_id)
);
GO
CREATE INDEX ix_mps_mktprod ON dbo.market_product_source (market_product_id, is_active, source_role);
GO


-- =============================================================================
-- GROUP 3 — PERIOD
-- =============================================================================

-- 09. PERIOD
-- Unified period table — serves both trading periods and risk buckets.
-- is_trading_period = 1 : available for selection on trade capture
-- is_risk_period    = 1 : used as a risk bucket in position/VaR engine
-- A period can be both simultaneously.
--
-- Two kinds of rows:
--   is_rolling = 1  : forward curve points that roll (M+1, Q+1, Cal+1)
--                     period_start/period_end resolved at runtime
--   is_rolling = 0  : concrete periods with fixed dates
--                     (Jan-2027, Q1-2027, Cal-2027, Peak-Jan-2027)
--
-- commodity_type = NULL means the period applies to all commodities.
-- =============================================================================
CREATE TABLE dbo.period (
    period_id           INT             NOT NULL IDENTITY(1,1),
    commodity_type      VARCHAR(20)     NULL        -- NULL = all commodities
        CONSTRAINT chk_period_comm CHECK (commodity_type IN (
            'OIL','POWER','GAS','AGRICULTURAL','METALS',NULL
        )),
    period_code         VARCHAR(30)     NOT NULL,   -- 'M+1','Q1-2027','CAL-2027','GAS-DAY','PEAK'
    period_name         VARCHAR(200)    NOT NULL,   -- 'Prompt Month','Q1 2027','Cal 2027'
    period_type         VARCHAR(20)     NOT NULL
        CONSTRAINT chk_period_type CHECK (period_type IN (
            'SPOT',         -- spot / prompt
            'INTRADAY',     -- within-day (gas, power)
            'DAY',          -- single gas/power day
            'WEEK',         -- weekly period
            'MONTH',        -- calendar month
            'QUARTER',      -- Q1/Q2/Q3/Q4
            'SEASON',       -- summer/winter (power/gas)
            'HALF_YEAR',    -- H1/H2
            'YEAR',         -- calendar year
            'CROP_YEAR',    -- agricultural crop year
            'CUSTOM'        -- bespoke date range
        )),
    -- Rolling vs concrete
    is_rolling          BIT             NOT NULL DEFAULT 0,
    roll_offset         SMALLINT        NULL,   -- 0=prompt,1=2nd month etc. (rolling only)
    roll_unit           VARCHAR(10)     NULL    -- 'MONTH','QUARTER','YEAR' (rolling only)
        CONSTRAINT chk_period_roll_unit CHECK (roll_unit IN (
            'DAY','WEEK','MONTH','QUARTER','YEAR',NULL
        )),
    -- Concrete period dates (NULL for rolling — resolved at runtime)
    period_start        DATE            NULL,
    period_end          DATE            NULL,
    -- Forward curve label (used by quant engine and UI)
    curve_label         VARCHAR(30)     NULL,   -- e.g. 'M+1','Q1-27','CAL-27','WIN-26'
    -- Usage flags
    is_trading_period   BIT             NOT NULL DEFAULT 1, -- available in trade capture
    is_risk_period      BIT             NOT NULL DEFAULT 1, -- used as risk bucket
    is_settlement_period BIT            NOT NULL DEFAULT 0, -- used for settlement price calc
    -- Power-specific sub-period (peak/off-peak/base)
    load_type           VARCHAR(20)     NULL
        CONSTRAINT chk_period_load CHECK (load_type IN (
            'BASE',         -- all hours (00:00-24:00)
            'PEAK',         -- peak hours (market defined)
            'OFF_PEAK',     -- off-peak hours
            'EXTENDED_PEAK',
            'OVERNIGHT',    NULL
        )),
    -- Gas-specific
    gas_day_type        VARCHAR(20)     NULL
        CONSTRAINT chk_period_gas CHECK (gas_day_type IN (
            'GAS_DAY',      -- standard 06:00-06:00 gas day
            'WITHIN_DAY',   -- intraday gas
            'DAY_AHEAD',
            'WEEKEND',      NULL
        )),
    -- Status
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(300)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_period            PRIMARY KEY (period_id),
    CONSTRAINT uq_period_code_comm  UNIQUE      (period_code, commodity_type),
    -- Rolling periods must have roll_offset and roll_unit
    CONSTRAINT chk_period_rolling   CHECK (
        is_rolling = 0
        OR (is_rolling = 1 AND roll_offset IS NOT NULL AND roll_unit IS NOT NULL)
    ),
    -- Dates come as a pair or not at all — NOT a blanket "non-rolling implies
    -- dated" rule, since some non-rolling period types (SPOT, intraday/day
    -- windows like GAS-DAY, GAS-WKD) are template rows with no fixed
    -- calendar dates by design, resolved at runtime same as rolling periods.
    CONSTRAINT chk_period_dates     CHECK (
        (period_start IS NULL AND period_end IS NULL)
        OR (period_start IS NOT NULL AND period_end IS NOT NULL)
    ),
    CONSTRAINT chk_period_date_order CHECK (
        period_start IS NULL OR period_end IS NULL OR period_end >= period_start
    )
);
GO
CREATE INDEX ix_period_comm_type ON dbo.period (commodity_type, period_type, is_active);
CREATE INDEX ix_period_dates     ON dbo.period (period_start, period_end, commodity_type)
    WHERE period_start IS NOT NULL;
CREATE INDEX ix_period_rolling   ON dbo.period (is_rolling, commodity_type, is_active)
    WHERE is_rolling = 1;
CREATE INDEX ix_period_trading   ON dbo.period (is_trading_period, commodity_type, is_active)
    WHERE is_trading_period = 1;
CREATE INDEX ix_period_risk      ON dbo.period (is_risk_period, commodity_type, is_active)
    WHERE is_risk_period = 1;
GO


-- 10. MARKET_PRODUCT_PERIOD
-- Which periods are valid for a specific product on a specific market.
-- e.g. ICE Brent lists M+1 through M+72 and Q+1 through Q+8.
-- Controls what a trader can select in deal capture for that market/product.
-- =============================================================================
CREATE TABLE dbo.market_product_period (
    mpp_id              INT             NOT NULL IDENTITY(1,1),
    market_product_id   INT             NOT NULL,
    period_id           INT             NOT NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(200)    NULL,

    CONSTRAINT pk_mpp               PRIMARY KEY (mpp_id),
    CONSTRAINT uq_mpp               UNIQUE      (market_product_id, period_id),
    CONSTRAINT fk_mpp_mktprod       FOREIGN KEY (market_product_id) REFERENCES dbo.market_product(market_product_id),
    CONSTRAINT fk_mpp_period        FOREIGN KEY (period_id)         REFERENCES dbo.period(period_id)
);
GO
CREATE INDEX ix_mpp_mktprod ON dbo.market_product_period (market_product_id, is_active);
CREATE INDEX ix_mpp_period  ON dbo.market_product_period (period_id,         is_active);
GO


-- 11. PERIOD_MAPPING
-- Hierarchical mapping between parent and child periods.
-- Enables decomposition of a trade period into risk buckets.
-- e.g. Cal-2027 (parent) → Jan-2027, Feb-2027 ... Dec-2027 (12 children)
--      Q1-2027  (parent) → Jan-2027, Feb-2027, Mar-2027   (3 children)
--      Peak-Jan-2027     → individual hourly/daily risk buckets
-- The quant engine uses this to distribute a trade's risk across buckets.
-- weight = fraction of parent allocated to this child (must sum to 1.0 per parent)
-- =============================================================================
CREATE TABLE dbo.period_mapping (
    mapping_id          INT             NOT NULL IDENTITY(1,1),
    parent_period_id    INT             NOT NULL,
    child_period_id     INT             NOT NULL,
    weight              DECIMAL(10,8)   NOT NULL DEFAULT 1.0,
    -- e.g. Cal split equally = 1/12 = 0.08333333 per month
    -- Can be non-equal for seasonal weighting or actuals-based splits
    commodity_type      VARCHAR(20)     NULL,   -- NULL = applies to all
    effective_from      DATE            NOT NULL,
    effective_to        DATE            NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(200)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_period_mapping    PRIMARY KEY (mapping_id),
    CONSTRAINT uq_period_mapping    UNIQUE      (parent_period_id, child_period_id, commodity_type, effective_from),
    CONSTRAINT fk_pm_parent         FOREIGN KEY (parent_period_id) REFERENCES dbo.period(period_id),
    CONSTRAINT fk_pm_child          FOREIGN KEY (child_period_id)  REFERENCES dbo.period(period_id),
    CONSTRAINT chk_pm_no_self_ref   CHECK       (parent_period_id <> child_period_id),
    CONSTRAINT chk_pm_weight        CHECK       (weight > 0 AND weight <= 1.0)
);
GO
CREATE INDEX ix_pm_parent ON dbo.period_mapping (parent_period_id, is_active, commodity_type);
CREATE INDEX ix_pm_child  ON dbo.period_mapping (child_period_id,  is_active);
GO


-- =============================================================================
-- REFERENCE DATA SEEDS
-- =============================================================================

-- Exchanges
INSERT INTO dbo.exchange (exchange_code, exchange_name, exchange_type, country_code, city, timezone, currency_id, regulator, mic_code, created_by)
SELECT x.exchange_code, x.exchange_name, x.exchange_type, x.country_code, x.city, x.timezone,
       c.currency_id, x.regulator, x.mic_code, 'SYSTEM'
FROM (VALUES
    ('ICE',   'Intercontinental Exchange',          'EXCHANGE',    'GB', 'London',   'Europe/London',      'GBP', 'FCA',   'IFLL'),
    ('NYMEX', 'New York Mercantile Exchange',        'EXCHANGE',    'US', 'New York', 'America/New_York',   'USD', 'CFTC',  'XNYM'),
    ('CME',   'Chicago Mercantile Exchange',         'EXCHANGE',    'US', 'Chicago',  'America/Chicago',    'USD', 'CFTC',  'XCME'),
    ('LME',   'London Metal Exchange',               'EXCHANGE',    'GB', 'London',   'Europe/London',      'USD', 'FCA',   'XLME'),
    ('EEX',   'European Energy Exchange',            'EXCHANGE',    'DE', 'Leipzig',  'Europe/Berlin',      'EUR', 'BaFin', 'XEEE'),
    ('CBOT',  'Chicago Board of Trade',              'EXCHANGE',    'US', 'Chicago',  'America/Chicago',    'USD', 'CFTC',  'XCBT'),
    ('SGX',   'Singapore Exchange',                  'EXCHANGE',    'SG', 'Singapore','Asia/Singapore',     'USD', 'MAS',   'XSES'),
    ('TOCOM', 'Tokyo Commodity Exchange',            'EXCHANGE',    'JP', 'Tokyo',    'Asia/Tokyo',         'JPY', 'METI',  'XTKT'),
    ('ICAP',  'ICAP OTC Platform',                   'OTC_PLATFORM','GB', 'London',   'Europe/London',      'USD', 'FCA',   NULL),
    ('TRAD',  'Tradition OTC Platform',              'OTC_PLATFORM','GB', 'London',   'Europe/London',      'USD', 'FCA',   NULL)
) AS x(exchange_code, exchange_name, exchange_type, country_code, city, timezone, currency_code, regulator, mic_code)
JOIN dbo.currency c ON c.currency_code = x.timezone -- placeholder join, fix below
;
GO
-- Fix: proper seed with currency lookup
DELETE FROM dbo.exchange;
GO
INSERT INTO dbo.exchange (exchange_code, exchange_name, exchange_type, country_code, city, timezone, currency_id, regulator, mic_code, created_by, updated_by)
VALUES
    ('ICE',   'Intercontinental Exchange',      'EXCHANGE',    'GB','London',    'Europe/London',    (SELECT currency_id FROM dbo.currency WHERE currency_code='GBP'),'FCA',  'IFLL','SYSTEM','SYSTEM'),
    ('NYMEX', 'New York Mercantile Exchange',    'EXCHANGE',    'US','New York',  'America/New_York', (SELECT currency_id FROM dbo.currency WHERE currency_code='USD'),'CFTC', 'XNYM','SYSTEM','SYSTEM'),
    ('CME',   'Chicago Mercantile Exchange',     'EXCHANGE',    'US','Chicago',   'America/Chicago',  (SELECT currency_id FROM dbo.currency WHERE currency_code='USD'),'CFTC', 'XCME','SYSTEM','SYSTEM'),
    ('LME',   'London Metal Exchange',           'EXCHANGE',    'GB','London',    'Europe/London',    (SELECT currency_id FROM dbo.currency WHERE currency_code='USD'),'FCA',  'XLME','SYSTEM','SYSTEM'),
    ('EEX',   'European Energy Exchange',        'EXCHANGE',    'DE','Leipzig',   'Europe/Berlin',    (SELECT currency_id FROM dbo.currency WHERE currency_code='EUR'),'BaFin','XEEE','SYSTEM','SYSTEM'),
    ('CBOT',  'Chicago Board of Trade',          'EXCHANGE',    'US','Chicago',   'America/Chicago',  (SELECT currency_id FROM dbo.currency WHERE currency_code='USD'),'CFTC', 'XCBT','SYSTEM','SYSTEM'),
    ('SGX',   'Singapore Exchange',              'EXCHANGE',    'SG','Singapore', 'Asia/Singapore',   (SELECT currency_id FROM dbo.currency WHERE currency_code='USD'),'MAS',  'XSES','SYSTEM','SYSTEM'),
    ('ICAP',  'ICAP OTC Platform',               'OTC_PLATFORM','GB','London',    'Europe/London',    (SELECT currency_id FROM dbo.currency WHERE currency_code='USD'),'FCA',  NULL,  'SYSTEM','SYSTEM'),
    ('TRAD',  'Tradition OTC Platform',          'OTC_PLATFORM','GB','London',    'Europe/London',    (SELECT currency_id FROM dbo.currency WHERE currency_code='USD'),'FCA',  NULL,  'SYSTEM','SYSTEM');
GO

-- Price sources
INSERT INTO dbo.price_source (source_code, source_name, source_type, delivery_method, frequency, timezone, created_by, updated_by)
VALUES
    ('PLATTS',      'S&P Global Platts',            'VENDOR',    'API',            'EOD',       'Europe/London',    'SYSTEM','SYSTEM'),
    ('ARGUS',       'Argus Media',                  'VENDOR',    'API',            'EOD',       'Europe/London',    'SYSTEM','SYSTEM'),
    ('BLOOMBERG',   'Bloomberg',                    'BLOOMBERG', 'REAL_TIME_FEED', 'REAL_TIME', 'America/New_York', 'SYSTEM','SYSTEM'),
    ('REUTERS',     'Refinitiv/Reuters',             'REUTERS',   'REAL_TIME_FEED', 'REAL_TIME', 'America/New_York', 'SYSTEM','SYSTEM'),
    ('ICE_DATA',    'ICE Data Services',            'EXCHANGE',  'API',            'EOD',       'Europe/London',    'SYSTEM','SYSTEM'),
    ('NYMEX_DATA',  'CME Group Market Data',        'EXCHANGE',  'API',            'EOD',       'America/New_York', 'SYSTEM','SYSTEM'),
    ('LME_DATA',    'LME Official Prices',          'EXCHANGE',  'API',            'EOD',       'Europe/London',    'SYSTEM','SYSTEM'),
    ('EEX_DATA',    'EEX Market Data',              'EXCHANGE',  'API',            'EOD',       'Europe/Berlin',    'SYSTEM','SYSTEM'),
    ('ICIS',        'ICIS Price Assessments',       'VENDOR',    'FTP',            'EOD',       'Europe/London',    'SYSTEM','SYSTEM'),
    ('INTERNAL',    'Internal / Manual Entry',      'INTERNAL',  'MANUAL',         'MANUAL',    'UTC',              'SYSTEM','SYSTEM');
GO

-- Periods — rolling forward curve points (all commodities)
INSERT INTO dbo.period (commodity_type, period_code, period_name, period_type,
                        is_rolling, roll_offset, roll_unit, curve_label,
                        is_trading_period, is_risk_period, created_by)
VALUES
    -- Generic rolling months (all commodities)
    (NULL, 'M+0',  'Prompt Month',         'MONTH',   1,  0, 'MONTH', 'M+0',  1, 1, 'SYSTEM'),
    (NULL, 'M+1',  'Second Month',         'MONTH',   1,  1, 'MONTH', 'M+1',  1, 1, 'SYSTEM'),
    (NULL, 'M+2',  'Third Month',          'MONTH',   1,  2, 'MONTH', 'M+2',  1, 1, 'SYSTEM'),
    (NULL, 'M+3',  'Fourth Month',         'MONTH',   1,  3, 'MONTH', 'M+3',  1, 1, 'SYSTEM'),
    (NULL, 'M+6',  'Six Months Forward',   'MONTH',   1,  6, 'MONTH', 'M+6',  1, 1, 'SYSTEM'),
    (NULL, 'M+12', 'Twelve Months Forward','MONTH',   1, 12, 'MONTH', 'M+12', 1, 1, 'SYSTEM'),
    -- Rolling quarters
    (NULL, 'Q+0',  'Current Quarter',      'QUARTER', 1,  0, 'QUARTER','Q+0', 1, 1, 'SYSTEM'),
    (NULL, 'Q+1',  'Next Quarter',         'QUARTER', 1,  1, 'QUARTER','Q+1', 1, 1, 'SYSTEM'),
    (NULL, 'Q+2',  'Q+2',                  'QUARTER', 1,  2, 'QUARTER','Q+2', 1, 1, 'SYSTEM'),
    (NULL, 'Q+3',  'Q+3',                  'QUARTER', 1,  3, 'QUARTER','Q+3', 1, 1, 'SYSTEM'),
    (NULL, 'Q+4',  'Q+4',                  'QUARTER', 1,  4, 'QUARTER','Q+4', 1, 1, 'SYSTEM'),
    -- Rolling calendar years
    (NULL, 'CAL+0','Current Year',         'YEAR',    1,  0, 'YEAR',  'CAL+0',1, 1, 'SYSTEM'),
    (NULL, 'CAL+1','Next Year',            'YEAR',    1,  1, 'YEAR',  'CAL+1',1, 1, 'SYSTEM'),
    (NULL, 'CAL+2','Year + 2',             'YEAR',    1,  2, 'YEAR',  'CAL+2',1, 1, 'SYSTEM'),
    (NULL, 'CAL+3','Year + 3',             'YEAR',    1,  3, 'YEAR',  'CAL+3',1, 1, 'SYSTEM'),
    (NULL, 'CAL+4','Year + 4',             'YEAR',    1,  4, 'YEAR',  'CAL+4',1, 1, 'SYSTEM'),
    (NULL, 'CAL+5','Year + 5',             'YEAR',    1,  5, 'YEAR',  'CAL+5',1, 1, 'SYSTEM'),
    -- Spot
    (NULL, 'SPOT', 'Spot',                 'SPOT',    0,  NULL, NULL, 'SPOT', 1, 0, 'SYSTEM'),
    -- Power-specific load types (rolling month)
    ('POWER','PWR-BASE-M+0', 'Power Baseload Prompt Month',  'MONTH', 1, 0,'MONTH','BASE-M+0', 1,1,'SYSTEM'),
    ('POWER','PWR-PEAK-M+0', 'Power Peak Prompt Month',      'MONTH', 1, 0,'MONTH','PEAK-M+0', 1,1,'SYSTEM'),
    ('POWER','PWR-OFFPK-M+0','Power Off-Peak Prompt Month',  'MONTH', 1, 0,'MONTH','OFFPK-M+0',1,1,'SYSTEM'),
    ('POWER','PWR-BASE-Q+1', 'Power Baseload Next Quarter',  'QUARTER',1,1,'QUARTER','BASE-Q+1',1,1,'SYSTEM'),
    ('POWER','PWR-PEAK-Q+1', 'Power Peak Next Quarter',      'QUARTER',1,1,'QUARTER','PEAK-Q+1',1,1,'SYSTEM'),
    -- Gas-specific
    ('GAS',  'GAS-DAY',      'Gas Day (06:00-06:00)',        'DAY',   0, NULL,NULL,'GAS-DAY', 1,1,'SYSTEM'),
    ('GAS',  'GAS-WD',       'Gas Within Day',               'INTRADAY',0,NULL,NULL,'WITHIN-DAY',1,0,'SYSTEM'),
    ('GAS',  'GAS-DA',       'Gas Day-Ahead',                'DAY',   1, 1,'DAY','DA',        1,1,'SYSTEM'),
    ('GAS',  'GAS-WKD',      'Gas Weekend',                  'WEEK',  0, NULL,NULL,'WEEKEND',  1,1,'SYSTEM'),
    -- Oil spot
    ('OIL',  'OIL-SPOT',     'Oil Spot',                     'SPOT',  0, NULL,NULL,'SPOT',     1,0,'SYSTEM'),
    ('OIL',  'OIL-DTDBRENT', 'Dated Brent (physical window)','DAY',   0, NULL,NULL,'DATED',    1,0,'SYSTEM'),
    -- Metals
    ('METALS','MET-NEARBY',  'Metals Nearby',                'SPOT',  1, 0,'MONTH','NEARBY',   1,1,'SYSTEM'),
    ('METALS','MET-3M',      'Metals 3 Month',               'MONTH', 1, 3,'MONTH','3M',       1,1,'SYSTEM'),
    ('METALS','MET-15M',     'Metals 15 Month',              'MONTH', 1,15,'MONTH','15M',       1,1,'SYSTEM'),
    -- Agricultural
    ('AGRICULTURAL','AGRI-NEARBY','Agri Nearby',             'SPOT',  1, 0,'MONTH','NEARBY',   1,1,'SYSTEM'),
    ('AGRICULTURAL','AGRI-NEW-CROP','New Crop',              'CROP_YEAR',0,NULL,NULL,'NEW-CROP',1,1,'SYSTEM'),
    ('AGRICULTURAL','AGRI-OLD-CROP','Old Crop',              'CROP_YEAR',0,NULL,NULL,'OLD-CROP',1,1,'SYSTEM');
GO

-- Concrete periods: monthly 2026-2031, quarterly 2026-2031, calendar years 2026-2031
-- (Abbreviated — in production a scheduled job generates these for configurable horizon)
DECLARE @y INT = 2026;
WHILE @y <= 2031
BEGIN
    -- Calendar year
    INSERT INTO dbo.period (commodity_type, period_code, period_name, period_type,
        is_rolling, period_start, period_end, curve_label,
        is_trading_period, is_risk_period, created_by)
    VALUES (NULL, 'CAL-' + CAST(@y AS VARCHAR),
            'Calendar Year ' + CAST(@y AS VARCHAR), 'YEAR', 0,
            CAST(CAST(@y AS VARCHAR) + '-01-01' AS DATE),
            CAST(CAST(@y AS VARCHAR) + '-12-31' AS DATE),
            'CAL-' + RIGHT(CAST(@y AS VARCHAR),2), 1, 1, 'SYSTEM');

    -- Quarters
    INSERT INTO dbo.period (commodity_type, period_code, period_name, period_type,
        is_rolling, period_start, period_end, curve_label,
        is_trading_period, is_risk_period, created_by)
    VALUES
        (NULL,'Q1-'+CAST(@y AS VARCHAR),'Q1 '+CAST(@y AS VARCHAR),'QUARTER',0,
         CAST(CAST(@y AS VARCHAR)+'-01-01' AS DATE),CAST(CAST(@y AS VARCHAR)+'-03-31' AS DATE),'Q1-'+RIGHT(CAST(@y AS VARCHAR),2),1,1,'SYSTEM'),
        (NULL,'Q2-'+CAST(@y AS VARCHAR),'Q2 '+CAST(@y AS VARCHAR),'QUARTER',0,
         CAST(CAST(@y AS VARCHAR)+'-04-01' AS DATE),CAST(CAST(@y AS VARCHAR)+'-06-30' AS DATE),'Q2-'+RIGHT(CAST(@y AS VARCHAR),2),1,1,'SYSTEM'),
        (NULL,'Q3-'+CAST(@y AS VARCHAR),'Q3 '+CAST(@y AS VARCHAR),'QUARTER',0,
         CAST(CAST(@y AS VARCHAR)+'-07-01' AS DATE),CAST(CAST(@y AS VARCHAR)+'-09-30' AS DATE),'Q3-'+RIGHT(CAST(@y AS VARCHAR),2),1,1,'SYSTEM'),
        (NULL,'Q4-'+CAST(@y AS VARCHAR),'Q4 '+CAST(@y AS VARCHAR),'QUARTER',0,
         CAST(CAST(@y AS VARCHAR)+'-10-01' AS DATE),CAST(CAST(@y AS VARCHAR)+'-12-31' AS DATE),'Q4-'+RIGHT(CAST(@y AS VARCHAR),2),1,1,'SYSTEM');

    -- Months
    DECLARE @m INT = 1;
    WHILE @m <= 12
    BEGIN
        DECLARE @ms DATE = DATEFROMPARTS(@y, @m, 1);
        DECLARE @me DATE = EOMONTH(@ms);
        DECLARE @mc VARCHAR(7) = FORMAT(@ms,'MMM-yy');
        DECLARE @mn VARCHAR(20) = FORMAT(@ms,'MMMM yyyy');
        INSERT INTO dbo.period (commodity_type, period_code, period_name, period_type,
            is_rolling, period_start, period_end, curve_label,
            is_trading_period, is_risk_period, created_by)
        VALUES (NULL, @mc, @mn, 'MONTH', 0, @ms, @me, @mc, 1, 1, 'SYSTEM');
        SET @m += 1;
    END;

    -- Power seasons
    INSERT INTO dbo.period (commodity_type, period_code, period_name, period_type,
        is_rolling, period_start, period_end, curve_label,
        is_trading_period, is_risk_period, created_by)
    VALUES
        ('POWER','SUM-'+CAST(@y AS VARCHAR),'Summer '+CAST(@y AS VARCHAR),'SEASON',0,
         CAST(CAST(@y AS VARCHAR)+'-04-01' AS DATE),CAST(CAST(@y AS VARCHAR)+'-09-30' AS DATE),'SUM-'+RIGHT(CAST(@y AS VARCHAR),2),1,1,'SYSTEM'),
        ('POWER','WIN-'+CAST(@y AS VARCHAR),'Winter '+CAST(@y AS VARCHAR),'SEASON',0,
         CAST(CAST(@y AS VARCHAR)+'-10-01' AS DATE),CAST(CAST(@y+1 AS VARCHAR)+'-03-31' AS DATE),'WIN-'+RIGHT(CAST(@y AS VARCHAR),2),1,1,'SYSTEM');

    SET @y += 1;
END;
GO

-- =============================================================================
PRINT '============================================================';
PRINT 'MARKET / PRICE SOURCE / PERIOD TABLES v1.0 APPLIED';
PRINT '  Group 1 — Market     : exchange, market, market_hours,';
PRINT '                         market_holiday_calendar, market_product';
PRINT '  Group 2 — Price src  : price_source, price_index_source,';
PRINT '                         market_product_source';
PRINT '  Group 3 — Period     : period, market_product_period,';
PRINT '                         period_mapping';
PRINT '  Seed data            : 9 exchanges, 10 price sources,';
PRINT '                         rolling + concrete periods 2026-2031';
PRINT '============================================================';
GO
