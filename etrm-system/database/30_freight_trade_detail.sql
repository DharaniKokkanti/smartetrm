-- =============================================================================
-- V30 — Freight Trade Detail
--
-- Adds freight/charter detail table for FREIGHT commodity trades.
-- Covers voyage charters, time charters, and Contracts of Affreightment (COA)
-- across tanker (dirty/clean products), dry bulk, and LNG freight trades.
--
--   NEW TABLE: trade_freight_detail
--     vessel_type          — VLCC | SUEZMAX | AFRAMAX | LR2 | LR1 | MR | CAPE | PANAMAX | SUPRAMAX | HANDYSIZE
--     charter_type         — VOYAGE | TIME | COA
--     route_code           — Benchmark route (TD3C, TC2, C3, etc.)
--     load_location_code   — Load port (FK to location)
--     discharge_location_code — Discharge port (FK to location)
--     cargo_size_mt        — Cargo size in metric tons
--     freight_rate_type    — WORLDSCALE | FLAT_RATE | LUMPSUM | TCE
--     freight_rate         — Rate in selected type (WS points, $/MT, $, $/day)
--     laycan_start         — Vessel presentation window start
--     laycan_end           — Vessel presentation window end
-- =============================================================================

CREATE TABLE dbo.trade_freight_detail (
    trade_id                    INT             NOT NULL,
    vessel_type                 VARCHAR(20)     NULL,
    charter_type                VARCHAR(20)     NULL,
    route_code                  VARCHAR(20)     NULL,
    load_location_code          VARCHAR(30)     NULL,
    discharge_location_code     VARCHAR(30)     NULL,
    cargo_size_mt               DECIMAL(14,2)   NULL,
    freight_rate_type           VARCHAR(20)     NULL,
    freight_rate                DECIMAL(14,6)   NULL,
    laycan_start                DATE            NULL,
    laycan_end                  DATE            NULL,

    CONSTRAINT pk_trade_freight_detail  PRIMARY KEY (trade_id),
    CONSTRAINT fk_freight_trade         FOREIGN KEY (trade_id) REFERENCES dbo.trade(trade_id),
    CONSTRAINT chk_freight_vessel_type  CHECK (vessel_type IS NULL OR vessel_type IN (
        'VLCC','SUEZMAX','AFRAMAX','LR2','LR1','MR','CAPE','PANAMAX','SUPRAMAX','HANDYSIZE'
    )),
    CONSTRAINT chk_freight_charter_type CHECK (charter_type IS NULL OR charter_type IN ('VOYAGE','TIME','COA')),
    CONSTRAINT chk_freight_rate_type    CHECK (freight_rate_type IS NULL OR freight_rate_type IN (
        'WORLDSCALE','FLAT_RATE','LUMPSUM','TCE'
    ))
);
GO

PRINT 'V30 APPLIED: Freight trade detail table created.';
PRINT '  trade_freight_detail: vessel_type, charter_type, route_code, load/discharge location,';
PRINT '    cargo_size_mt, freight_rate_type, freight_rate, laycan_start, laycan_end';
PRINT '';
PRINT 'NOTE: The trade table commodity_type = FREIGHT identifies freight trades.';
PRINT '  For freight: quantity/uom represent the nominal cargo (e.g. 280000 MT),';
PRINT '  price represents the flat rate equivalent ($/MT). Worldscale trades should';
PRINT '  store the agreed WS points in freight_rate and compute $/MT via the';
PRINT '  Worldscale flat rate for the route (route_code).';
