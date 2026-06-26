-- =============================================================================
-- ETRM SYSTEM — POSITION ENGINE SCHEMA
-- Single position table (position_type discriminator: COMMODITY / FREIGHT)
-- + EOD historical snapshot + MTM valuation results
-- SQL Server 2022 | Version 1.0 | June 2026
-- =============================================================================
-- Run AFTER:
--   etrm_trade_schema_v1.0.sql
-- =============================================================================
-- ADDS 3 TABLES:
--   01. position                — current/live net position per risk bucket
--   02. position_eod_snapshot   — append-only historical copy, one row per
--                                  bucket per snapshot_date (audit trail + VaR time series)
--   03. position_valuation      — MTM results from the Python quant engine,
--                                  against either a live position or an EOD snapshot
-- =============================================================================
-- DESIGN NOTE — single table, position_type discriminator:
-- A position row is a thin aggregation (quantity + price per bucket), unlike
-- `trade` which needed extension tables because of many rich type-specific
-- operational fields (laycan, vessel certs, etc.). Here COMMODITY and FREIGHT
-- buckets differ only in which dimension columns are populated:
--   COMMODITY bucket = book + product + period
--   FREIGHT   bucket = book + vessel_type + route + charter_party_type
-- `period_id` is shared by both — freight exposure is still laid out by time
-- bucket (e.g. "Q1-27 freight exposure on TD3C"), it just uses period rows
-- with commodity_type = NULL (the "applies to all commodities" rows already
-- supported by the period table) instead of an OIL/GAS/etc. period.
--
-- NOT included in v1 (flagged for a later pass, not forgotten):
--   - position_trade_link (row-level traceability: which trades fed this
--     bucket) — position is a recalculated aggregate, not a join table, so
--     this is optional and adds real storage/write cost. Add if/when audit
--     requirements demand "show me every trade behind this number."
--   - risk_factor / VaR covariance tables — Phase 2 per the implementation
--     roadmap, sits on top of position_eod_snapshot once built.
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- HELPER: drop tables if re-running (reverse FK order)
-- =============================================================================
IF OBJECT_ID('dbo.position_valuation', 'U')    IS NOT NULL DROP TABLE dbo.position_valuation;
IF OBJECT_ID('dbo.position_eod_snapshot', 'U')  IS NOT NULL DROP TABLE dbo.position_eod_snapshot;
IF OBJECT_ID('dbo.position', 'U')                IS NOT NULL DROP TABLE dbo.position;
GO

-- =============================================================================
-- 01. POSITION
-- Current/live net position per risk bucket. One row per bucket — upserted in
-- place every time a contributing trade event fires or a recalculation batch
-- runs (REALTIME) and once more at end of day (EOD), which is also when it
-- gets copied into position_eod_snapshot for permanent history.
-- =============================================================================
CREATE TABLE dbo.position (
    position_id              INT             NOT NULL IDENTITY(1,1),
    position_type              VARCHAR(20)     NOT NULL
        CONSTRAINT chk_pos_type CHECK (position_type IN ('COMMODITY','FREIGHT')),

    -- ── Segregation ──────────────────────────────────────────────────────────
    book_id                      INT             NOT NULL,
    legal_entity_id                INT             NOT NULL,   -- denormalized from book, matches trade's pattern

    -- ── Commodity bucket dimensions (NULL for FREIGHT) ──────────────────────
    commodity_type                  VARCHAR(20)     NOT NULL
        CONSTRAINT chk_pos_commodity CHECK (commodity_type IN (
            'OIL','POWER','GAS','AGRICULTURAL','METALS','FREIGHT'
        )),
    product_id                        INT             NULL,
    period_id                           INT             NULL,   -- time bucket, used by BOTH position types

    -- ── Freight bucket dimensions (NULL for COMMODITY) ──────────────────────
    vessel_type                           VARCHAR(30)     NULL,   -- mirrors vessel.vessel_type
    route_id                                INT             NULL,   -- FK transport_route
    charter_party_type_id                     INT             NULL,

    -- ── Quantity / price ─────────────────────────────────────────────────────
    quantity_uom_id                             INT             NOT NULL,
    net_quantity                                  DECIMAL(18,4)   NOT NULL DEFAULT 0,
    -- Sign convention: positive = net long (net BUY), negative = net short (net SELL)
    gross_buy_quantity                              DECIMAL(18,4)   NOT NULL DEFAULT 0,
    gross_sell_quantity                               DECIMAL(18,4)   NOT NULL DEFAULT 0,
    trade_count                                         INT             NOT NULL DEFAULT 0,
    avg_price                                             DECIMAL(18,6)   NULL,   -- volume-weighted avg price/rate across contributing trades
    currency_id                                             INT             NOT NULL,

    -- ── Calculation metadata ─────────────────────────────────────────────────
    calculation_type                                          VARCHAR(20)     NOT NULL DEFAULT 'EOD'
        CONSTRAINT chk_pos_calc_type CHECK (calculation_type IN (
            'REALTIME',     -- live, recalculated on each trade event
            'EOD',          -- end-of-day batch calculation
            'INTRADAY'      -- ad-hoc intraday recalculation (risk request)
        )),
    calculated_at                                               DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    calculated_by                                                 VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',

    CONSTRAINT pk_position                PRIMARY KEY (position_id),
    CONSTRAINT fk_pos_book                  FOREIGN KEY (book_id)               REFERENCES dbo.book(book_id),
    CONSTRAINT fk_pos_entity                  FOREIGN KEY (legal_entity_id)       REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_pos_product                   FOREIGN KEY (product_id)            REFERENCES dbo.product(product_id),
    CONSTRAINT fk_pos_period                      FOREIGN KEY (period_id)             REFERENCES dbo.period(period_id),
    CONSTRAINT fk_pos_route                         FOREIGN KEY (route_id)              REFERENCES dbo.transport_route(route_id),
    CONSTRAINT fk_pos_cp_type                         FOREIGN KEY (charter_party_type_id) REFERENCES dbo.charter_party_type(charter_party_type_id),
    CONSTRAINT fk_pos_uom                               FOREIGN KEY (quantity_uom_id)       REFERENCES dbo.unit_of_measure(uom_id),
    CONSTRAINT fk_pos_currency                            FOREIGN KEY (currency_id)           REFERENCES dbo.currency(currency_id),

    -- A COMMODITY position carries no freight bucket dimensions; a FREIGHT
    -- position carries no product (period is allowed on both — see design note)
    CONSTRAINT chk_pos_bucket_shape CHECK (
        (position_type = 'COMMODITY' AND vessel_type IS NULL AND route_id IS NULL AND charter_party_type_id IS NULL)
        OR
        (position_type = 'FREIGHT'   AND product_id IS NULL)
    ),
    -- commodity_type must agree with position_type
    CONSTRAINT chk_pos_type_commodity_match CHECK (
        (position_type = 'FREIGHT'   AND commodity_type = 'FREIGHT')
        OR
        (position_type = 'COMMODITY' AND commodity_type <> 'FREIGHT')
    ),

    -- One live row per risk bucket. NULLable columns are fine here: SQL Server
    -- unique constraints compare full row tuples, and book_id/commodity_type
    -- (always populated) combined with whichever dimension columns ARE
    -- populated for that position_type guarantee genuine bucket uniqueness.
    CONSTRAINT uq_position_bucket UNIQUE (
        position_type, book_id, commodity_type, product_id, period_id,
        vessel_type, route_id, charter_party_type_id, currency_id
    )
) WITH (DATA_COMPRESSION = ROW);
GO

CREATE INDEX ix_position_book     ON dbo.position (book_id, position_type) INCLUDE (net_quantity, currency_id);
CREATE INDEX ix_position_product  ON dbo.position (product_id, period_id) WHERE product_id IS NOT NULL;
CREATE INDEX ix_position_period   ON dbo.position (period_id) WHERE period_id IS NOT NULL;
CREATE INDEX ix_position_route    ON dbo.position (route_id, vessel_type) WHERE route_id IS NOT NULL;
GO


-- =============================================================================
-- 02. POSITION_EOD_SNAPSHOT
-- Append-only historical copy of `position`, one row per bucket per
-- snapshot_date. Never updated in place — this is the system of record for
-- "what was our position on date X", used by VaR time series, regulatory
-- reporting, and audit. Conceptually partitioned by snapshot_date (same
-- pattern as audit_log) — add a physical partition scheme once data volumes
-- justify it.
-- =============================================================================
CREATE TABLE dbo.position_eod_snapshot (
    snapshot_id               BIGINT          NOT NULL IDENTITY(1,1),
    snapshot_date                DATE            NOT NULL,
    source_position_id             INT             NULL,   -- traceability back to the live position row, if it still exists
    position_type                    VARCHAR(20)     NOT NULL
        CONSTRAINT chk_pes_type CHECK (position_type IN ('COMMODITY','FREIGHT')),

    book_id                            INT             NOT NULL,
    legal_entity_id                      INT             NOT NULL,

    commodity_type                         VARCHAR(20)     NOT NULL
        CONSTRAINT chk_pes_commodity CHECK (commodity_type IN (
            'OIL','POWER','GAS','AGRICULTURAL','METALS','FREIGHT'
        )),
    product_id                                INT             NULL,
    period_id                                   INT             NULL,

    vessel_type                                   VARCHAR(30)     NULL,
    route_id                                        INT             NULL,
    charter_party_type_id                             INT             NULL,

    quantity_uom_id                                     INT             NOT NULL,
    net_quantity                                          DECIMAL(18,4)   NOT NULL,
    gross_buy_quantity                                      DECIMAL(18,4)   NOT NULL,
    gross_sell_quantity                                       DECIMAL(18,4)   NOT NULL,
    trade_count                                                 INT             NOT NULL,
    avg_price                                                     DECIMAL(18,6)   NULL,
    currency_id                                                     INT             NOT NULL,

    calculated_at                                                     DATETIME2       NOT NULL,
    calculated_by                                                       VARCHAR(100)    NOT NULL,
    snapshot_taken_at                                                     DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_position_eod_snapshot   PRIMARY KEY (snapshot_id),
    CONSTRAINT fk_pes_position              FOREIGN KEY (source_position_id)    REFERENCES dbo.position(position_id),
    CONSTRAINT fk_pes_book                    FOREIGN KEY (book_id)               REFERENCES dbo.book(book_id),
    CONSTRAINT fk_pes_entity                    FOREIGN KEY (legal_entity_id)       REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_pes_product                     FOREIGN KEY (product_id)            REFERENCES dbo.product(product_id),
    CONSTRAINT fk_pes_period                        FOREIGN KEY (period_id)             REFERENCES dbo.period(period_id),
    CONSTRAINT fk_pes_route                           FOREIGN KEY (route_id)              REFERENCES dbo.transport_route(route_id),
    CONSTRAINT fk_pes_cp_type                           FOREIGN KEY (charter_party_type_id) REFERENCES dbo.charter_party_type(charter_party_type_id),
    CONSTRAINT fk_pes_uom                                 FOREIGN KEY (quantity_uom_id)       REFERENCES dbo.unit_of_measure(uom_id),
    CONSTRAINT fk_pes_currency                              FOREIGN KEY (currency_id)           REFERENCES dbo.currency(currency_id),

    -- One snapshot row per bucket per day
    CONSTRAINT uq_position_snapshot_bucket UNIQUE (
        snapshot_date, position_type, book_id, commodity_type, product_id,
        period_id, vessel_type, route_id, charter_party_type_id, currency_id
    )
) WITH (DATA_COMPRESSION = PAGE);
GO

CREATE INDEX ix_pes_date         ON dbo.position_eod_snapshot (snapshot_date, position_type);
CREATE INDEX ix_pes_book_date    ON dbo.position_eod_snapshot (book_id, snapshot_date) INCLUDE (net_quantity, currency_id);
CREATE INDEX ix_pes_product_date ON dbo.position_eod_snapshot (product_id, period_id, snapshot_date) WHERE product_id IS NOT NULL;
GO


-- =============================================================================
-- 03. POSITION_VALUATION
-- MTM results returned by the Python quant engine, against either a live
-- position or a historical EOD snapshot. calculation_method records which
-- internal endpoint produced the number, since commodity and freight MTM use
-- genuinely different math (forward curve vs. day-rate/Worldscale differential).
-- =============================================================================
CREATE TABLE dbo.position_valuation (
    position_valuation_id    INT             NOT NULL IDENTITY(1,1),
    position_id                INT             NULL,   -- set for live/intraday valuation
    snapshot_id                  BIGINT          NULL,   -- set for EOD valuation
    valuation_date                 DATE            NOT NULL,
    valuation_type                   VARCHAR(20)     NOT NULL
        CONSTRAINT chk_pv_type CHECK (valuation_type IN ('PROVISIONAL','EOD','FINAL')),
    calculation_method                 VARCHAR(20)     NOT NULL
        CONSTRAINT chk_pv_calc_method CHECK (calculation_method IN ('COMMODITY_MTM','FREIGHT_MTM')),

    mtm_value                            DECIMAL(18,2)   NOT NULL,
    currency_id                            INT             NOT NULL,
    underlying_rate_used                     DECIMAL(18,6)   NULL,   -- curve price or freight rate/index value used
    quant_engine_ref                           VARCHAR(100)    NULL,   -- evaluation_id / correlation id returned by Python

    calculated_at                                DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    calculated_by                                  VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',

    CONSTRAINT pk_position_valuation   PRIMARY KEY (position_valuation_id),
    CONSTRAINT fk_pv_position            FOREIGN KEY (position_id)   REFERENCES dbo.position(position_id),
    CONSTRAINT fk_pv_snapshot              FOREIGN KEY (snapshot_id)   REFERENCES dbo.position_eod_snapshot(snapshot_id),
    CONSTRAINT fk_pv_currency                FOREIGN KEY (currency_id)   REFERENCES dbo.currency(currency_id),

    -- Exactly one of position_id / snapshot_id must be set
    CONSTRAINT chk_pv_one_source CHECK (
        (position_id IS NULL AND snapshot_id IS NOT NULL)
        OR (position_id IS NOT NULL AND snapshot_id IS NULL)
    )
);
GO

-- One valuation per (live position, date, type) — partial index, position_id branch
CREATE UNIQUE INDEX uq_pv_position ON dbo.position_valuation (position_id, valuation_date, valuation_type)
    WHERE position_id IS NOT NULL;
-- One valuation per (snapshot, date, type) — partial index, snapshot_id branch
CREATE UNIQUE INDEX uq_pv_snapshot ON dbo.position_valuation (snapshot_id, valuation_date, valuation_type)
    WHERE snapshot_id IS NOT NULL;
GO

CREATE INDEX ix_pv_valuation_date ON dbo.position_valuation (valuation_date, calculation_method);
GO


-- =============================================================================
-- EXAMPLE USAGE
-- =============================================================================
/*
SCENARIO 1 — Commodity position: net Brent exposure, Q1-27, Book OIL-TRADING-1

INSERT INTO dbo.position (position_type, book_id, legal_entity_id, commodity_type,
    product_id, period_id, quantity_uom_id, net_quantity, gross_buy_quantity,
    gross_sell_quantity, trade_count, avg_price, currency_id, calculation_type, calculated_by)
VALUES ('COMMODITY', <book_id>, <legal_entity_id>, 'OIL',
    <Brent product_id>, <Q1-27 period_id>, <BBL uom_id>, 250000, 600000, 350000,
    14, 82.35, <USD currency_id>, 'EOD', 'SYSTEM');

SCENARIO 2 — Freight position: net VLCC AG-China exposure, Q1-27, Book FREIGHT-1

INSERT INTO dbo.position (position_type, book_id, legal_entity_id, commodity_type,
    period_id, vessel_type, route_id, charter_party_type_id, quantity_uom_id,
    net_quantity, gross_buy_quantity, gross_sell_quantity, trade_count, avg_price,
    currency_id, calculation_type, calculated_by)
VALUES ('FREIGHT', <book_id>, <legal_entity_id>, 'FREIGHT',
    <Q1-27 period_id (commodity_type NULL)>, 'VLCC', <TD3C route_id>,
    <VOYAGE charter_party_type_id>, <DAY uom_id>, 12, 18, 6, 5, 41000.00,
    <USD currency_id>, 'EOD', 'SYSTEM');

-- End-of-day batch: copy every live position into the snapshot table
INSERT INTO dbo.position_eod_snapshot (snapshot_date, source_position_id, position_type,
    book_id, legal_entity_id, commodity_type, product_id, period_id, vessel_type,
    route_id, charter_party_type_id, quantity_uom_id, net_quantity, gross_buy_quantity,
    gross_sell_quantity, trade_count, avg_price, currency_id, calculated_at, calculated_by)
SELECT CAST(SYSUTCDATETIME() AS DATE), position_id, position_type,
    book_id, legal_entity_id, commodity_type, product_id, period_id, vessel_type,
    route_id, charter_party_type_id, quantity_uom_id, net_quantity, gross_buy_quantity,
    gross_sell_quantity, trade_count, avg_price, currency_id, calculated_at, calculated_by
FROM dbo.position;

-- Book-level P&L rollup for today — COMMODITY and FREIGHT positions unioned
-- at the aggregation layer (this is the "shared reporting view" referenced
-- in the freight P&L discussion: separate position shape, shared rollup)
SELECT p.book_id, b.book_name, p.position_type, pv.valuation_date,
       SUM(pv.mtm_value) AS total_mtm
FROM dbo.position p
JOIN dbo.position_valuation pv ON pv.position_id = p.position_id
JOIN dbo.book b ON b.book_id = p.book_id
WHERE pv.valuation_date = CAST(SYSUTCDATETIME() AS DATE)
GROUP BY p.book_id, b.book_name, p.position_type, pv.valuation_date
ORDER BY b.book_name, p.position_type;
*/

PRINT '============================================================';
PRINT 'POSITION ENGINE SCHEMA v1.0 APPLIED';
PRINT '';
PRINT '  01. position                — live net position, one row per risk bucket';
PRINT '      position_type discriminator: COMMODITY (book+product+period) /';
PRINT '                                    FREIGHT   (book+vessel_type+route+cp_type)';
PRINT '      period_id shared by both — freight uses commodity_type=NULL periods';
PRINT '';
PRINT '  02. position_eod_snapshot   — append-only daily history, same bucket shape';
PRINT '      Source of truth for VaR time series, regulatory reporting, audit';
PRINT '';
PRINT '  03. position_valuation      — MTM results vs. live position OR EOD snapshot';
PRINT '      calculation_method: COMMODITY_MTM / FREIGHT_MTM (different Python';
PRINT '      endpoints, different underlying math)';
PRINT '';
PRINT '  DEFERRED: position_trade_link (row-level traceability),';
PRINT '            risk_factor / VaR covariance tables (Phase 2)';
PRINT '============================================================';
GO
