-- =============================================================================
-- ETRM SYSTEM — POWER TRANSMISSION RIGHTS (FTR / CRR / TCC)
-- The power-market equivalent of a freight differential: a financial
-- instrument that hedges the cost of moving power from one grid location to
-- another, rather than a physical transport service.
-- SQL Server 2022 | Version 1.0 | June 2026
-- =============================================================================
-- Run AFTER:
--   etrm_power_schema_v1.0.sql   (balancing_authority, transmission_zone, trade)
-- =============================================================================
-- ADDS 2 TABLES:
--   01. transmission_right_type     — reference: FTR / CRR / TCC terminology,
--                                      settlement basis, allocation method
--   02. trade_transmission_right_detail — 1:1 trade extension: source/sink
--                                      zone pair, obligation vs option, MW
-- =============================================================================
-- DESIGN NOTE: no new trade.trade_type value needed. An FTR/CRR/TCC
-- "obligation" settles like any other financial power trade (trade_type =
-- 'FINANCIAL'); an FTR "option" settles like any other power option
-- (trade_type = 'OPTION'). Both already exist on `trade`. What's different
-- is the payoff structure (source/sink price difference instead of a single
-- index), which is what this extension table captures.
-- =============================================================================

USE ETRM_DB;
GO

IF OBJECT_ID('dbo.trade_transmission_right_detail', 'U') IS NOT NULL DROP TABLE dbo.trade_transmission_right_detail;
IF OBJECT_ID('dbo.transmission_right_type', 'U')          IS NOT NULL DROP TABLE dbo.transmission_right_type;
GO


-- =============================================================================
-- 01. TRANSMISSION_RIGHT_TYPE
-- Reference table for the different regional names this same instrument
-- trades under. PJM/MISO call it FTR, CAISO/ERCOT call it CRR, NYISO calls
-- it TCC — same economic concept, different market terminology and rules.
-- =============================================================================
CREATE TABLE dbo.transmission_right_type (
    right_type_id            INT             NOT NULL IDENTITY(1,1),
    type_code                   VARCHAR(10)     NOT NULL,   -- 'FTR','CRR','TCC','ARR'
    type_name                     VARCHAR(100)    NOT NULL,
    home_balancing_authority_id     INT             NULL,   -- typical/originating market for this terminology — informational, not a hard restriction
    settlement_basis                  VARCHAR(30)     NOT NULL
        CONSTRAINT chk_trt_settlement CHECK (settlement_basis IN (
            'DA_LMP_DIFFERENCE',   -- settles off day-ahead locational marginal price difference, source vs sink
            'RT_LMP_DIFFERENCE'    -- settles off real-time LMP difference
        )),
    allocation_method                   VARCHAR(20)     NOT NULL
        CONSTRAINT chk_trt_allocation CHECK (allocation_method IN (
            'AUCTION',              -- acquired via the ISO/RTO's periodic FTR/CRR auction
            'ARR_ALLOCATION',       -- allocated to load-serving entities based on historical/firm transmission rights
            'BILATERAL_TRANSFER'    -- acquired via OTC secondary-market transfer from another holder
        )),
    description                           VARCHAR(300)    NULL,
    is_active                               BIT             NOT NULL DEFAULT 1,
    created_at                                DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                VARCHAR(100)    NOT NULL,
    updated_at                                DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_transmission_right_type   PRIMARY KEY (right_type_id),
    CONSTRAINT uq_trt_code                     UNIQUE      (type_code),
    CONSTRAINT fk_trt_ba                         FOREIGN KEY (home_balancing_authority_id) REFERENCES dbo.balancing_authority(balancing_authority_id)
);
GO


-- =============================================================================
-- 02. TRADE_TRANSMISSION_RIGHT_DETAIL
-- 1:1 trade extension. Only populated when the trade is an FTR/CRR/TCC —
-- identifiable by trade.commodity_type = 'POWER' and the presence of this row.
-- =============================================================================
CREATE TABLE dbo.trade_transmission_right_detail (
    trade_id                    INT             NOT NULL,
    right_type_id                  INT             NOT NULL,
    source_zone_id                    INT             NOT NULL,   -- where the right "buys" power from
    sink_zone_id                        INT             NOT NULL,   -- where the right "delivers" power to
    balancing_authority_id                INT             NOT NULL,
    right_form                              VARCHAR(20)     NOT NULL
        CONSTRAINT chk_ttrd_form CHECK (right_form IN ('OBLIGATION','OPTION')),
    -- OBLIGATION: holder pays if source-to-sink spread is negative, receives if positive (two-way)
    -- OPTION:     holder only ever receives when the spread is favorable, never pays (one-way) — priced accordingly
    mw_quantity                               DECIMAL(14,4)   NOT NULL,
    delivery_period_id                          INT             NULL,   -- FK period — the auction round's delivery timeframe (e.g. CAL-27, Q1-27)
    auction_round                                 VARCHAR(50)     NULL,   -- e.g. 'ANNUAL_2027_ROUND1', NULL if acquired via ARR or bilateral transfer
    allocation_method                               VARCHAR(20)     NULL
        CONSTRAINT chk_ttrd_allocation CHECK (allocation_method IN (
            'AUCTION','ARR_ALLOCATION','BILATERAL_TRANSFER',NULL
        )),
    notes                                              VARCHAR(1000)   NULL,
    created_at                                           DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                           VARCHAR(100)    NOT NULL,
    updated_at                                           DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                           VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_trade_transmission_right_detail   PRIMARY KEY (trade_id),
    CONSTRAINT uq_ttrd_trade                           UNIQUE      (trade_id),
    CONSTRAINT fk_ttrd_trade                             FOREIGN KEY (trade_id)             REFERENCES dbo.trade(trade_id),
    CONSTRAINT fk_ttrd_right_type                          FOREIGN KEY (right_type_id)         REFERENCES dbo.transmission_right_type(right_type_id),
    CONSTRAINT fk_ttrd_source_zone                            FOREIGN KEY (source_zone_id)       REFERENCES dbo.transmission_zone(zone_id),
    CONSTRAINT fk_ttrd_sink_zone                                 FOREIGN KEY (sink_zone_id)         REFERENCES dbo.transmission_zone(zone_id),
    CONSTRAINT fk_ttrd_ba                                           FOREIGN KEY (balancing_authority_id) REFERENCES dbo.balancing_authority(balancing_authority_id),
    CONSTRAINT fk_ttrd_period                                         FOREIGN KEY (delivery_period_id)   REFERENCES dbo.period(period_id),
    CONSTRAINT chk_ttrd_no_self_path                                     CHECK (source_zone_id <> sink_zone_id)
);
GO
CREATE INDEX ix_ttrd_path ON dbo.trade_transmission_right_detail (source_zone_id, sink_zone_id, delivery_period_id);
GO


-- =============================================================================
-- REFERENCE DATA SEEDS
-- =============================================================================
INSERT INTO dbo.transmission_right_type (type_code, type_name, home_balancing_authority_id, settlement_basis, allocation_method, description, created_by, updated_by)
SELECT v.type_code, v.type_name, ba.balancing_authority_id, v.settlement_basis, v.allocation_method, v.description, 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('FTR', 'Financial Transmission Right', 'PJM',   'DA_LMP_DIFFERENCE', 'AUCTION', 'PJM/MISO terminology. Hedges day-ahead LMP spread between a source and sink point.'),
    ('CRR', 'Congestion Revenue Right',      'CAISO', 'DA_LMP_DIFFERENCE', 'AUCTION', 'CAISO/ERCOT terminology for the same economic instrument as an FTR.'),
    ('TCC', 'Transmission Congestion Contract', 'NYISO','DA_LMP_DIFFERENCE','AUCTION', 'NYISO terminology for the same economic instrument as an FTR.')
) AS v(type_code, type_name, ba_code, settlement_basis, allocation_method, description)
JOIN dbo.balancing_authority ba ON ba.ba_code = v.ba_code;
GO


-- =============================================================================
-- EXAMPLE USAGE
-- =============================================================================
/*
SCENARIO — PJM FTR obligation, AECO Zone (sink) from PJM West Hub (source), CAL-27

trade row:
    trade_reference = 'FTR-2027-000014', commodity_type = 'POWER', trade_type = 'FINANCIAL',
    direction = 'BUY', quantity = <MW * hours, however you've chosen to express it>,
    uom_id = <MWH>, currency_id = <USD>, counterparty_id = <PJM as auction counterparty,
    or a clearing entity>, product_id = NULL, period_id = <CAL-27>,
    settlement_type = 'FINANCIAL', status = 'CONFIRMED'

trade_transmission_right_detail row (same trade_id):
    right_type_id = <FTR>, source_zone_id = <PJM_WEST>, sink_zone_id = <PJM_AECO>,
    balancing_authority_id = <PJM>, right_form = 'OBLIGATION', mw_quantity = 50,
    delivery_period_id = <CAL-27>, auction_round = 'ANNUAL_2027_ROUND1',
    allocation_method = 'AUCTION'

This nets separately from ordinary PJM West Hub energy positions in the
position engine (different bucket dimensions — source/sink pair vs a single
product+period), exactly as discussed for freight: separate position shape,
shared book-level P&L rollup.
*/

PRINT '============================================================';
PRINT 'POWER TRANSMISSION RIGHTS (FTR/CRR/TCC) v1.0 APPLIED';
PRINT '';
PRINT '  01. transmission_right_type           — 3 rows seeded (FTR, CRR, TCC)';
PRINT '  02. trade_transmission_right_detail    — 1:1 trade extension';
PRINT '      No new trade_type needed — OBLIGATION settles as FINANCIAL,';
PRINT '      OPTION settles as OPTION, both already exist on trade.';
PRINT '============================================================';
GO
