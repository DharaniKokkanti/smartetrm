-- =============================================================================
-- ETRM SYSTEM — TRADE SCHEMA
-- Base trade record (commodity-agnostic) + Oil extension + Freight/Charter extension
-- SQL Server 2022 | Version 1.0 | June 2026
-- =============================================================================
-- Run AFTER:
--   etrm_master_data_v2.0.sql
--   etrm_trader_patch_v2.1.sql
--   etrm_market_source_period_v1.0.sql
--   etrm_mpp_dates_patch_v1.1.sql
--   etrm_product_spec_mot_pipeline_v1.0.sql
--   etrm_financial_operational_md_v1.0.sql
--   etrm_pricing_triggers_rules_v1.0.sql
--   etrm_pricing_lifecycle_v1.0.sql
--   etrm_freight_external_md_patch_v1.0.sql
-- =============================================================================
-- ADDS 3 TABLES:
--   01. trade                  — base trade record, commodity-agnostic, temporal
--   02. trade_oil_detail       — 1:1 oil extension
--   03. trade_freight_detail   — 1:1 freight/charter extension (voyage, time
--                                 charter, bareboat, COA — modelled AS a trade,
--                                 same pattern as trade_oil_detail)
-- PLUS:
--   Wires the trade_id FK on trade_pricing_schedule (stubbed in script 8)
--   Extends book.commodity_type to permit 'FREIGHT' books/desks
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- HELPER: drop tables if re-running (reverse FK order)
-- =============================================================================
IF OBJECT_ID('dbo.trade_freight_detail', 'U') IS NOT NULL DROP TABLE dbo.trade_freight_detail;
IF OBJECT_ID('dbo.trade_oil_detail', 'U')     IS NOT NULL DROP TABLE dbo.trade_oil_detail;
IF OBJECT_ID('dbo.trade', 'U')                IS NOT NULL DROP TABLE dbo.trade;
IF OBJECT_ID('dbo.trade_history', 'U')        IS NOT NULL DROP TABLE dbo.trade_history;
GO

-- =============================================================================
-- 01. TRADE
-- Base trade record — commodity-agnostic. Commodity-specific detail lives in
-- extension tables (trade_oil_detail, trade_freight_detail, and future
-- trade_power_detail / trade_gas_detail / trade_agri_detail / trade_metals_detail).
-- Temporal table: every field-level change is auto-historised.
-- Amendments ALSO create a new trade row chained via parent_trade_id — this is
-- the standard ETRM pattern where an amendment is itself a tradeable, bookable
-- event (new trade_reference, references the original), distinct from the
-- temporal system tracking in-place corrections.
-- =============================================================================
CREATE TABLE dbo.trade (
    trade_id                 INT             NOT NULL IDENTITY(1,1),
    trade_reference           VARCHAR(50)     NOT NULL,   -- human-readable: 'OIL-2026-000123'
    trade_date                 DATE            NOT NULL,
    execution_datetime           DATETIME2       NULL,    -- exact execution timestamp, if captured
    commodity_type                 VARCHAR(20)     NOT NULL
        CONSTRAINT chk_trade_commodity CHECK (commodity_type IN (
            'OIL','POWER','GAS','AGRICULTURAL','METALS','FREIGHT'
        )),
    trade_type                       VARCHAR(20)     NOT NULL
        CONSTRAINT chk_trade_type CHECK (trade_type IN (
            'PHYSICAL','FINANCIAL','OPTION','FREIGHT'
        )),
    direction                          VARCHAR(4)      NOT NULL
        CONSTRAINT chk_trade_direction CHECK (direction IN ('BUY','SELL')),
    -- For FREIGHT trades: BUY = chartering in (we hire the vessel),
    --                     SELL = chartering out / sub-letting (we provide the vessel)

    -- ── Quantity / price ──────────────────────────────────────────────────────
    quantity                            DECIMAL(18,4)   NOT NULL,
    uom_id                                INT             NOT NULL,
    price                                  DECIMAL(18,6)   NULL,   -- NULL until priced (e.g. unfixed formula trades)
    currency_id                            INT             NOT NULL,

    -- ── Parties ───────────────────────────────────────────────────────────────
    counterparty_id                          INT             NOT NULL,
    trader_id                                  INT             NOT NULL,
    book_id                                      INT             NOT NULL,
    legal_entity_id                                INT             NOT NULL,

    -- ── Product / market context ─────────────────────────────────────────────
    product_id                                       INT             NULL,   -- NULL for freight (no commodity product)
    market_id                                          INT             NULL,   -- NULL for OTC bilateral / freight
    pricing_rule_id                                      INT             NULL,   -- NULL for freight / unpriced trades
    incoterm_id                                            INT             NULL,
    delivery_location_id                                     INT             NULL,
    period_id                                                  INT             NULL,   -- NULL for freight (uses laycan instead)

    -- ── Settlement & status ──────────────────────────────────────────────────
    settlement_type                                              VARCHAR(20)     NOT NULL
        CONSTRAINT chk_trade_settlement CHECK (settlement_type IN (
            'PHYSICAL','FINANCIAL','NETTED'
        )),
    status                                                          VARCHAR(20)     NOT NULL DEFAULT 'DRAFT'
        CONSTRAINT chk_trade_status CHECK (status IN (
            'DRAFT','CONFIRMED','AMENDED','CANCELLED','MATURED','CLOSED'
        )),

    -- ── Amendment chain ───────────────────────────────────────────────────────
    parent_trade_id                                                    INT             NULL,
    amendment_number                                                     SMALLINT        NOT NULL DEFAULT 0,
    -- 0 = original trade. Amendments increment and point parent_trade_id at
    -- the trade they supersede (which may itself be an amendment).
    is_latest_version                                                      BIT             NOT NULL DEFAULT 1,
    -- FALSE once a later amendment supersedes this row — lets queries find the
    -- live version of a trade chain without walking parent_trade_id manually.

    cancelled_reason                                                         VARCHAR(300)    NULL,
    cancelled_at                                                               DATETIME2       NULL,
    cancelled_by                                                                 VARCHAR(100)    NULL,

    notes                                                                         VARCHAR(1000)   NULL,
    created_at                                                                     DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                                                     VARCHAR(100)    NOT NULL,
    updated_at                                                                     DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                                                     VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_trade                 PRIMARY KEY (trade_id),
    CONSTRAINT uq_trade_reference         UNIQUE      (trade_reference),
    CONSTRAINT fk_trade_uom               FOREIGN KEY (uom_id)              REFERENCES dbo.unit_of_measure(uom_id),
    CONSTRAINT fk_trade_currency           FOREIGN KEY (currency_id)         REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_trade_counterparty         FOREIGN KEY (counterparty_id)     REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT fk_trade_trader                 FOREIGN KEY (trader_id)           REFERENCES dbo.trader(trader_id),
    CONSTRAINT fk_trade_book                     FOREIGN KEY (book_id)             REFERENCES dbo.book(book_id),
    CONSTRAINT fk_trade_entity                     FOREIGN KEY (legal_entity_id)     REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_trade_product                      FOREIGN KEY (product_id)          REFERENCES dbo.product(product_id),
    CONSTRAINT fk_trade_market                         FOREIGN KEY (market_id)           REFERENCES dbo.market(market_id),
    CONSTRAINT fk_trade_pricing_rule                     FOREIGN KEY (pricing_rule_id)     REFERENCES dbo.pricing_rule(pricing_rule_id),
    CONSTRAINT fk_trade_incoterm                           FOREIGN KEY (incoterm_id)         REFERENCES dbo.incoterm(incoterm_id),
    CONSTRAINT fk_trade_delivery_location                    FOREIGN KEY (delivery_location_id) REFERENCES dbo.location(location_id),
    CONSTRAINT fk_trade_period                                  FOREIGN KEY (period_id)           REFERENCES dbo.period(period_id),
    CONSTRAINT fk_trade_parent                                    FOREIGN KEY (parent_trade_id)     REFERENCES dbo.trade(trade_id),

    -- A FREIGHT trade has no commodity product/period; a non-FREIGHT trade should have a product
    CONSTRAINT chk_trade_freight_product CHECK (
        (trade_type = 'FREIGHT' AND product_id IS NULL)
        OR (trade_type <> 'FREIGHT')
    ),
    -- Amendments must reference a parent and increment past 0
    CONSTRAINT chk_trade_amendment CHECK (
        (amendment_number = 0 AND parent_trade_id IS NULL)
        OR (amendment_number > 0 AND parent_trade_id IS NOT NULL)
    )
) WITH (DATA_COMPRESSION = ROW);
GO

ALTER TABLE dbo.trade
    ADD valid_from DATETIME2 GENERATED ALWAYS AS ROW START HIDDEN
            CONSTRAINT df_trade_vf DEFAULT SYSUTCDATETIME(),
        valid_to   DATETIME2 GENERATED ALWAYS AS ROW END   HIDDEN
            CONSTRAINT df_trade_vt DEFAULT CONVERT(DATETIME2,'9999-12-31 23:59:59.9999999'),
        PERIOD FOR SYSTEM_TIME (valid_from, valid_to);
GO
ALTER TABLE dbo.trade
    SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.trade_history));
GO

CREATE INDEX ix_trade_counterparty ON dbo.trade (counterparty_id, status, trade_date);
CREATE INDEX ix_trade_book         ON dbo.trade (book_id, trade_date) INCLUDE (status, commodity_type);
CREATE INDEX ix_trade_trader       ON dbo.trade (trader_id, trade_date);
CREATE INDEX ix_trade_product      ON dbo.trade (product_id, commodity_type, status) WHERE product_id IS NOT NULL;
CREATE INDEX ix_trade_status       ON dbo.trade (status, trade_date);
CREATE INDEX ix_trade_parent       ON dbo.trade (parent_trade_id) WHERE parent_trade_id IS NOT NULL;
CREATE INDEX ix_trade_latest       ON dbo.trade (is_latest_version, status) WHERE is_latest_version = 1;
GO

-- Now that trade exists, wire the FK that trade_pricing_schedule was stubbed for
ALTER TABLE dbo.trade_pricing_schedule
    ADD CONSTRAINT fk_tps_trade FOREIGN KEY (trade_id) REFERENCES dbo.trade(trade_id);
GO

-- Extend book.commodity_type so freight desks/books can be tagged precisely
-- instead of falling back to 'OTHER'
ALTER TABLE dbo.book DROP CONSTRAINT chk_book_commodity;
GO
ALTER TABLE dbo.book ADD CONSTRAINT chk_book_commodity CHECK (commodity_type IN (
    'OIL','POWER','GAS','AGRICULTURAL','METALS','FREIGHT','MULTI','OTHER'
));
GO


-- =============================================================================
-- 02. TRADE_OIL_DETAIL
-- 1:1 oil extension. Only populated when trade.commodity_type = 'OIL'.
-- =============================================================================
CREATE TABLE dbo.trade_oil_detail (
    trade_id                INT             NOT NULL,
    crude_grade               VARCHAR(100)    NULL,   -- e.g. 'Forties','Bonny Light','WTI Midland'
    api_gravity                  DECIMAL(5,2)    NULL,
    sulphur_pct                    DECIMAL(5,3)    NULL,
    load_location_id                  INT             NULL,
    discharge_location_id               INT             NULL,
    vessel_id                             INT             NULL,   -- NULL until nominated
    laycan_start                            DATE            NULL,
    laycan_end                                DATE            NULL,
    bl_date                                     DATE            NULL,
    nors_tendered_date                            DATE            NULL,
    cod_date                                        DATE            NULL,
    pipeline_id                                       INT             NULL,
    pipeline_point_id                                   INT             NULL,
    notes                                                 VARCHAR(1000)   NULL,
    created_at                                              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                              VARCHAR(100)    NOT NULL,
    updated_at                                              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_trade_oil_detail        PRIMARY KEY (trade_id),
    CONSTRAINT uq_tod_trade                 UNIQUE      (trade_id),
    CONSTRAINT fk_tod_trade                   FOREIGN KEY (trade_id)              REFERENCES dbo.trade(trade_id),
    CONSTRAINT fk_tod_load_location             FOREIGN KEY (load_location_id)      REFERENCES dbo.location(location_id),
    CONSTRAINT fk_tod_discharge_location           FOREIGN KEY (discharge_location_id) REFERENCES dbo.location(location_id),
    CONSTRAINT fk_tod_vessel                         FOREIGN KEY (vessel_id)             REFERENCES dbo.vessel(vessel_id),
    CONSTRAINT fk_tod_pipeline                         FOREIGN KEY (pipeline_id)           REFERENCES dbo.pipeline(pipeline_id),
    CONSTRAINT fk_tod_pipeline_point                     FOREIGN KEY (pipeline_point_id)     REFERENCES dbo.pipeline_point(point_id),
    CONSTRAINT chk_tod_laycan_order                        CHECK (laycan_end IS NULL OR laycan_start IS NULL OR laycan_end >= laycan_start)
);
GO
CREATE INDEX ix_tod_vessel ON dbo.trade_oil_detail (vessel_id) WHERE vessel_id IS NOT NULL;
GO


-- =============================================================================
-- 03. TRADE_FREIGHT_DETAIL
-- 1:1 freight/charter extension. Only populated when trade.trade_type = 'FREIGHT'.
-- A charter fixture is modelled AS a trade (counterparty = owner/charterer or
-- broker, book/trader/legal_entity apply identically) rather than as a separate
-- entity hanging off the position/settlement engines — this lets freight flow
-- through the same lifecycle, status, amendment-chain, and settlement
-- machinery as every other trade, with chartering-specific fields captured here.
-- =============================================================================
CREATE TABLE dbo.trade_freight_detail (
    trade_id                  INT             NOT NULL,
    charter_party_type_id       INT             NOT NULL,
    charter_party_reference        VARCHAR(50)     NULL,   -- recap/fixture reference
    charter_party_date               DATE            NULL,   -- date fixture concluded ("fixed on subjects lifted")
    broker_cp_id                       INT             NULL,   -- FK counterparty, typically cp_type = 'BROKER'
    broker_commission_pct                DECIMAL(5,3)    NULL,

    -- ── Vessel & route ────────────────────────────────────────────────────────
    vessel_id                              INT             NULL,   -- NULL until nominated
    laytime_term_id                          INT             NULL,
    load_location_id                           INT             NULL,
    discharge_location_id                        INT             NULL,
    laycan_start                                   DATE            NULL,
    laycan_end                                       DATE            NULL,
    nor_tendered_load_date                             DATETIME2       NULL,
    nor_tendered_discharge_date                          DATETIME2       NULL,

    -- ── Rate ──────────────────────────────────────────────────────────────────
    -- rate_basis / duration_basis come from charter_party_type; this stores the
    -- actual NEGOTIATED value for this fixture (e.g. WS points, USD/day, USD/tonne, lumpsum)
    freight_rate_value                                     DECIMAL(18,4)   NULL,
    freight_rate_uom_id                                      INT             NULL,
    freight_rate_index_id                                      INT             NULL,   -- set for Worldscale / index-linked fixtures

    -- ── Time charter specific (NULL for voyage/COA) ─────────────────────────────
    hire_commencement_date                                       DATETIME2       NULL,   -- vessel delivery into charter
    hire_redelivery_date                                           DATETIME2       NULL,   -- vessel redelivery out of charter
    off_hire_days                                                    DECIMAL(8,3)    NULL,   -- cumulative off-hire to date; detail events live in a future off_hire_event table

    -- ── Demurrage / dispatch ──────────────────────────────────────────────────
    demurrage_rate_id                                                  INT             NULL,   -- default rate reference, if used as-is
    demurrage_rate_per_day_override                                      DECIMAL(14,2)   NULL,   -- explicit fixture rate, overrides the default
    dispatch_rate_per_day_override                                         DECIMAL(14,2)   NULL,
    demurrage_claim_deadline_days                                            SMALLINT        NULL,

    notes                                                                     VARCHAR(1000)   NULL,
    created_at                                                                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                                                  VARCHAR(100)    NOT NULL,
    updated_at                                                                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                                                  VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_trade_freight_detail        PRIMARY KEY (trade_id),
    CONSTRAINT uq_tfd_trade                     UNIQUE      (trade_id),
    CONSTRAINT fk_tfd_trade                       FOREIGN KEY (trade_id)              REFERENCES dbo.trade(trade_id),
    CONSTRAINT fk_tfd_cp_type                       FOREIGN KEY (charter_party_type_id) REFERENCES dbo.charter_party_type(charter_party_type_id),
    CONSTRAINT fk_tfd_broker                          FOREIGN KEY (broker_cp_id)          REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT fk_tfd_vessel                            FOREIGN KEY (vessel_id)             REFERENCES dbo.vessel(vessel_id),
    CONSTRAINT fk_tfd_laytime_term                        FOREIGN KEY (laytime_term_id)       REFERENCES dbo.laytime_term_template(laytime_term_id),
    CONSTRAINT fk_tfd_load_location                          FOREIGN KEY (load_location_id)      REFERENCES dbo.location(location_id),
    CONSTRAINT fk_tfd_discharge_location                        FOREIGN KEY (discharge_location_id) REFERENCES dbo.location(location_id),
    CONSTRAINT fk_tfd_rate_uom                                    FOREIGN KEY (freight_rate_uom_id)   REFERENCES dbo.unit_of_measure(uom_id),
    CONSTRAINT fk_tfd_rate_index                                    FOREIGN KEY (freight_rate_index_id) REFERENCES dbo.freight_rate_index(freight_rate_index_id),
    CONSTRAINT fk_tfd_demurrage_rate                                  FOREIGN KEY (demurrage_rate_id)     REFERENCES dbo.demurrage_dispatch_rate(demurrage_rate_id),
    CONSTRAINT chk_tfd_laycan_order                                      CHECK (laycan_end IS NULL OR laycan_start IS NULL OR laycan_end >= laycan_start),
    CONSTRAINT chk_tfd_hire_order                                          CHECK (hire_redelivery_date IS NULL OR hire_commencement_date IS NULL OR hire_redelivery_date >= hire_commencement_date)
);
GO
CREATE INDEX ix_tfd_vessel    ON dbo.trade_freight_detail (vessel_id) WHERE vessel_id IS NOT NULL;
CREATE INDEX ix_tfd_cp_type   ON dbo.trade_freight_detail (charter_party_type_id);
GO


-- =============================================================================
-- EXAMPLE: how trade + extension tables fit together
-- =============================================================================
/*
SCENARIO 1 — Physical oil cargo, FOB, priced off Dated Brent

trade row:
    trade_reference = 'OIL-2026-000451', commodity_type = 'OIL', trade_type = 'PHYSICAL',
    direction = 'SELL', quantity = 600000, uom_id = <BBL>, currency_id = <USD>,
    counterparty_id = <buyer>, product_id = <Forties product>, incoterm_id = <FOB>,
    pricing_rule_id = <Dated Brent BL +/-3 day rule>, settlement_type = 'PHYSICAL',
    status = 'CONFIRMED'

trade_oil_detail row (same trade_id):
    crude_grade = 'Forties', load_location_id = <Hound Point>,
    vessel_id = <nominated vessel>, laycan_start/end, bl_date (set once loaded)

trade_pricing_schedule row (same trade_id, via wired FK):
    pricing_rule_id snapshot, primary_trigger_type_id = <BL>, pricing_period derived
    from BL date once confirmed

---

SCENARIO 2 — Time charter fixture (chartering in a VLCC)

trade row:
    trade_reference = 'FRT-2026-000089', commodity_type = 'FREIGHT', trade_type = 'FREIGHT',
    direction = 'BUY' (we are chartering in), quantity = <charter period in days>,
    uom_id = <DAY>, currency_id = <USD>, counterparty_id = <shipowner>,
    product_id = NULL, settlement_type = 'FINANCIAL', status = 'CONFIRMED'

trade_freight_detail row (same trade_id):
    charter_party_type_id = <TC>, vessel_id = <fixed vessel>,
    freight_rate_value = 38500.00, freight_rate_uom_id = <PER_DAY equivalent>,
    hire_commencement_date, hire_redelivery_date,
    demurrage_rate_id = <VLCC default>, broker_cp_id = <chartering broker>
*/

PRINT '============================================================';
PRINT 'TRADE SCHEMA v1.0 APPLIED';
PRINT '';
PRINT '  01. trade                  — base trade record, commodity-agnostic';
PRINT '      Temporal table: full field-level history';
PRINT '      Amendment chain: parent_trade_id + amendment_number + is_latest_version';
PRINT '      Status flow: DRAFT -> CONFIRMED -> AMENDED/CANCELLED/MATURED -> CLOSED';
PRINT '';
PRINT '  02. trade_oil_detail       — 1:1 oil extension (crude grade, vessel,';
PRINT '      laycan, BL/NOR/COD dates, pipeline routing)';
PRINT '';
PRINT '  03. trade_freight_detail   — 1:1 freight/charter extension';
PRINT '      Charter fixtures modelled AS trades (voyage/TC/bareboat/COA),';
PRINT '      same lifecycle as every other trade type';
PRINT '';
PRINT '  WIRED: trade_pricing_schedule.trade_id FK (stubbed in script 8)';
PRINT '  ALTERED: book.commodity_type now also permits ''FREIGHT''';
PRINT '============================================================';
GO
