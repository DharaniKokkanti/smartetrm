-- =============================================================================
-- ETRM SYSTEM — POWER COMMODITY SCHEMA
-- Grid topology, generation assets, load shapes, power product/trade
-- extensions, and scheduling cycles.
-- SQL Server 2022 | Version 1.0 | June 2026
-- =============================================================================
-- Run AFTER:
--   etrm_master_data_v2.0.sql        (location, counterparty, product, commodity)
--   etrm_trade_schema_v1.0.sql       (trade — trade_power_detail FKs to it directly,
--                                      no ALTER/stub needed, trade already exists)
-- =============================================================================
-- ADDS 8 TABLES:
--   Grid & Generation Infrastructure
--     01. balancing_authority    — ISO/RTO/TSO master record
--     02. transmission_zone      — load zones / GSP groups within a BA
--     03. interconnector         — cross-zone/cross-border transmission links
--     04. generation_asset       — plant-level technical master data
--   Product Definition
--     05. load_shape_template    — BASELOAD/PEAK/OFFPEAK/custom delivery shapes
--     06. power_product_detail   — 1:1 product extension (load shape, voltage, settlement point)
--   Trade Extension
--     07. trade_power_detail     — 1:1 trade extension, same role trade_oil_detail plays
--   Scheduling
--     08. power_schedule_cycle   — day-ahead/intraday/real-time gate closure times
-- =============================================================================
-- NOT included (deliberately, not forgotten):
--   Hourly schedule/nomination submissions against a confirmed trade — that is
--   operational/transactional data, not master data, and belongs in the
--   settlement/ops phase alongside oil delivery confirmation.
--   Ancillary services & capacity market product types — flagged as a follow-up
--   if/when the desk actually trades them; power_product_detail has an
--   is_ancillary_service flag ready for that, but the dedicated reference
--   tables (service types, capacity auction structure) are not built yet.
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- HELPER: drop tables if re-running (reverse FK order)
-- =============================================================================
IF OBJECT_ID('dbo.power_schedule_cycle', 'U') IS NOT NULL DROP TABLE dbo.power_schedule_cycle;
IF OBJECT_ID('dbo.trade_power_detail', 'U')   IS NOT NULL DROP TABLE dbo.trade_power_detail;
IF OBJECT_ID('dbo.power_product_detail', 'U') IS NOT NULL DROP TABLE dbo.power_product_detail;
IF OBJECT_ID('dbo.load_shape_template', 'U')  IS NOT NULL DROP TABLE dbo.load_shape_template;
IF OBJECT_ID('dbo.generation_asset', 'U')     IS NOT NULL DROP TABLE dbo.generation_asset;
IF OBJECT_ID('dbo.interconnector', 'U')       IS NOT NULL DROP TABLE dbo.interconnector;
IF OBJECT_ID('dbo.transmission_zone', 'U')    IS NOT NULL DROP TABLE dbo.transmission_zone;
IF OBJECT_ID('dbo.balancing_authority', 'U')  IS NOT NULL DROP TABLE dbo.balancing_authority;
GO


-- =============================================================================
-- 01. BALANCING_AUTHORITY
-- ISO / RTO / TSO master record — the top of the power grid hierarchy.
-- Everything else (zones, interconnectors, generation, schedules) sits under one.
-- =============================================================================
CREATE TABLE dbo.balancing_authority (
    balancing_authority_id    INT             NOT NULL IDENTITY(1,1),
    ba_code                     VARCHAR(20)     NOT NULL,   -- 'PJM','ERCOT','NGESO','CAISO'
    ba_name                      VARCHAR(200)    NOT NULL,
    country_code                   CHAR(2)         NOT NULL,
    region                           VARCHAR(100)    NULL,
    market_type                       VARCHAR(30)     NOT NULL
        CONSTRAINT chk_ba_market_type CHECK (market_type IN (
            'ISO',                      -- Independent System Operator (US)
            'RTO',                      -- Regional Transmission Organization (US)
            'TSO',                      -- Transmission System Operator (EU/UK)
            'VERTICALLY_INTEGRATED',    -- single utility, no organized wholesale market
            'OTHER'
        )),
    timezone                             VARCHAR(50)     NULL,   -- IANA tz, governs "peak hour" convention for this BA
    website                                VARCHAR(300)    NULL,
    is_active                                BIT             NOT NULL DEFAULT 1,
    notes                                      VARCHAR(500)    NULL,
    created_at                                   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                   VARCHAR(100)    NOT NULL,
    updated_at                                   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                   VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_balancing_authority   PRIMARY KEY (balancing_authority_id),
    CONSTRAINT uq_ba_code                 UNIQUE      (ba_code)
);
GO


-- =============================================================================
-- 02. TRANSMISSION_ZONE
-- Load zones / GSP groups / pricing-node groups within a balancing authority.
-- This is the level most power trades actually settle against — "PJM WEST HUB",
-- "ERCOT NORTH", "NGESO GSP Group _A" — rather than the BA itself.
-- =============================================================================
CREATE TABLE dbo.transmission_zone (
    zone_id                  INT             NOT NULL IDENTITY(1,1),
    balancing_authority_id      INT             NOT NULL,
    zone_code                     VARCHAR(30)     NOT NULL,
    zone_name                       VARCHAR(200)    NOT NULL,
    zone_type                         VARCHAR(30)     NOT NULL
        CONSTRAINT chk_tz_type CHECK (zone_type IN (
            'LOAD_ZONE','GSP_GROUP','PRICING_NODE_GROUP','HUB','OTHER'
        )),
    location_id                         INT             NULL,   -- representative/reference location (location_type = GRID_NODE)
    is_active                             BIT             NOT NULL DEFAULT 1,
    notes                                   VARCHAR(500)    NULL,
    created_at                               DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                               VARCHAR(100)    NOT NULL,
    updated_at                               DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                               VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_transmission_zone     PRIMARY KEY (zone_id),
    CONSTRAINT uq_tz_code                 UNIQUE      (balancing_authority_id, zone_code),
    CONSTRAINT fk_tz_ba                     FOREIGN KEY (balancing_authority_id) REFERENCES dbo.balancing_authority(balancing_authority_id),
    CONSTRAINT fk_tz_location                 FOREIGN KEY (location_id)            REFERENCES dbo.location(location_id)
);
GO
CREATE INDEX ix_tz_ba ON dbo.transmission_zone (balancing_authority_id, is_active);
GO


-- =============================================================================
-- 03. INTERCONNECTOR
-- Cross-zone / cross-border transmission links. Mirrors transport_route's
-- role for freight, but for grid capacity rather than physical vessel routing.
-- =============================================================================
CREATE TABLE dbo.interconnector (
    interconnector_id        INT             NOT NULL IDENTITY(1,1),
    interconnector_code         VARCHAR(30)     NOT NULL,
    interconnector_name           VARCHAR(200)    NOT NULL,
    from_zone_id                    INT             NOT NULL,
    to_zone_id                        INT             NOT NULL,
    capacity_mw                         DECIMAL(14,2)   NULL,
    direction_type                        VARCHAR(20)     NOT NULL
        CONSTRAINT chk_ic_direction CHECK (direction_type IN ('UNIDIRECTIONAL','BIDIRECTIONAL')),
    operator                                VARCHAR(200)    NULL,
    is_active                                 BIT             NOT NULL DEFAULT 1,
    notes                                       VARCHAR(500)    NULL,
    created_at                                   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                   VARCHAR(100)    NOT NULL,
    updated_at                                   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                   VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_interconnector       PRIMARY KEY (interconnector_id),
    CONSTRAINT uq_ic_code                UNIQUE      (interconnector_code),
    CONSTRAINT fk_ic_from                  FOREIGN KEY (from_zone_id) REFERENCES dbo.transmission_zone(zone_id),
    CONSTRAINT fk_ic_to                      FOREIGN KEY (to_zone_id)   REFERENCES dbo.transmission_zone(zone_id),
    CONSTRAINT chk_ic_no_self                  CHECK (from_zone_id <> to_zone_id)
);
GO
CREATE INDEX ix_ic_zones ON dbo.interconnector (from_zone_id, to_zone_id, is_active);
GO


-- =============================================================================
-- 04. GENERATION_ASSET
-- Plant-level technical master data. The location table already has a
-- POWER_PLANT location type for addressing/geography; this is the layer above
-- it that captures what a trading desk actually cares about — fuel, capacity,
-- technology, ownership — same role `vessel` plays for oil shipping.
-- =============================================================================
CREATE TABLE dbo.generation_asset (
    generation_asset_id      INT             NOT NULL IDENTITY(1,1),
    asset_code                  VARCHAR(30)     NOT NULL,
    asset_name                    VARCHAR(200)    NOT NULL,
    location_id                     INT             NOT NULL,
    balancing_authority_id            INT             NULL,
    zone_id                             INT             NULL,
    owner_counterparty_id                 INT             NULL,
    fuel_type                               VARCHAR(30)     NOT NULL
        CONSTRAINT chk_ga_fuel CHECK (fuel_type IN (
            'GAS','COAL','NUCLEAR','HYDRO','WIND','SOLAR','BIOMASS','OIL','STORAGE','OTHER'
        )),
    technology                                VARCHAR(50)     NULL,   -- 'CCGT','OCGT','PWR_REACTOR','ONSHORE_WIND','OFFSHORE_WIND','PV','BESS'
    nameplate_capacity_mw                       DECIMAL(14,2)   NOT NULL,
    commissioning_date                            DATE            NULL,
    decommissioning_date                            DATE            NULL,
    is_active                                         BIT             NOT NULL DEFAULT 1,
    notes                                               VARCHAR(500)    NULL,
    created_at                                           DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                           VARCHAR(100)    NOT NULL,
    updated_at                                           DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                           VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_generation_asset     PRIMARY KEY (generation_asset_id),
    CONSTRAINT uq_ga_code                UNIQUE      (asset_code),
    CONSTRAINT fk_ga_location              FOREIGN KEY (location_id)             REFERENCES dbo.location(location_id),
    CONSTRAINT fk_ga_ba                      FOREIGN KEY (balancing_authority_id)  REFERENCES dbo.balancing_authority(balancing_authority_id),
    CONSTRAINT fk_ga_zone                      FOREIGN KEY (zone_id)                 REFERENCES dbo.transmission_zone(zone_id),
    CONSTRAINT fk_ga_owner                       FOREIGN KEY (owner_counterparty_id)   REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT chk_ga_decommission                 CHECK (decommissioning_date IS NULL OR commissioning_date IS NULL OR decommissioning_date >= commissioning_date)
);
GO
CREATE INDEX ix_ga_zone ON dbo.generation_asset (zone_id, fuel_type, is_active);
GO


-- =============================================================================
-- 05. LOAD_SHAPE_TEMPLATE
-- Defines standard delivery shapes. This is the table that makes power power:
-- a trade isn't just a quantity, it's a quantity delivered according to a
-- specific hourly pattern. timezone_basis matters because "peak hours" is a
-- market convention (e.g. US peak = HE07-22 Mon-Fri local prevailing time,
-- EU peak = 08:00-20:00 Mon-Fri CET) — same shape code can mean different
-- actual hours in different balancing authorities.
-- =============================================================================
CREATE TABLE dbo.load_shape_template (
    load_shape_id            INT             NOT NULL IDENTITY(1,1),
    shape_code                  VARCHAR(30)     NOT NULL,   -- 'BASELOAD','PEAK','OFFPEAK','5X16','7X8','2X16H','CUSTOM'
    shape_name                    VARCHAR(150)    NOT NULL,
    shape_type                      VARCHAR(20)     NOT NULL
        CONSTRAINT chk_lst_type CHECK (shape_type IN ('BASELOAD','PEAK','OFFPEAK','CUSTOM')),
    applicable_days                   VARCHAR(20)     NOT NULL DEFAULT 'WEEKDAYS'
        CONSTRAINT chk_lst_days CHECK (applicable_days IN (
            'ALL','WEEKDAYS','WEEKENDS','MONDAY','TUESDAY',
            'WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'
        )),
    start_hour                          TINYINT         NULL,   -- 0-23, hour-ending or hour-beginning per timezone_basis convention
    end_hour                              TINYINT         NULL,   -- 1-24, exclusive end of window
    hours_per_day                           DECIMAL(4,2)    NULL,   -- display convenience, e.g. 16.00 for a 5x16 peak shape
    timezone_basis                            VARCHAR(50)     NULL,   -- which local convention defines start/end hour, e.g. 'America/New_York','Europe/Berlin'
    description                                 VARCHAR(300)    NULL,
    is_active                                     BIT             NOT NULL DEFAULT 1,
    created_at                                      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                      VARCHAR(100)    NOT NULL,
    updated_at                                      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                      VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_load_shape_template   PRIMARY KEY (load_shape_id),
    CONSTRAINT uq_lst_code                 UNIQUE      (shape_code),
    -- start_hour/end_hour just need to differ — end_hour < start_hour is a
    -- valid overnight wrap (e.g. off-peak 23:00 to 07:00 next day), so this
    -- intentionally does NOT require end_hour > start_hour.
    CONSTRAINT chk_lst_hour_order             CHECK (start_hour IS NULL OR end_hour IS NULL OR end_hour <> start_hour)
);
GO


-- =============================================================================
-- 06. POWER_PRODUCT_DETAIL
-- 1:1 extension of `product` for power-specific attributes. Only populated
-- when product.commodity_id resolves to the POWER commodity.
-- =============================================================================
CREATE TABLE dbo.power_product_detail (
    product_id                  INT             NOT NULL,
    default_load_shape_id          INT             NULL,
    voltage_level                     VARCHAR(20)     NULL
        CONSTRAINT chk_ppd_voltage CHECK (voltage_level IN (
            'LOW','MEDIUM','HIGH','EXTRA_HIGH',NULL
        )),
    settlement_point_type               VARCHAR(20)     NULL
        CONSTRAINT chk_ppd_settlement_point CHECK (settlement_point_type IN (
            'NODE','ZONE','HUB','SYSTEM',NULL
        )),
    default_balancing_authority_id        INT             NULL,
    default_zone_id                         INT             NULL,
    is_ancillary_service                      BIT             NOT NULL DEFAULT 0,
    notes                                       VARCHAR(500)    NULL,
    created_at                                    DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                    VARCHAR(100)    NOT NULL,
    updated_at                                    DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                    VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_power_product_detail   PRIMARY KEY (product_id),
    CONSTRAINT uq_ppd_product               UNIQUE      (product_id),
    CONSTRAINT fk_ppd_product                 FOREIGN KEY (product_id)                  REFERENCES dbo.product(product_id),
    CONSTRAINT fk_ppd_load_shape                FOREIGN KEY (default_load_shape_id)       REFERENCES dbo.load_shape_template(load_shape_id),
    CONSTRAINT fk_ppd_ba                          FOREIGN KEY (default_balancing_authority_id) REFERENCES dbo.balancing_authority(balancing_authority_id),
    CONSTRAINT fk_ppd_zone                          FOREIGN KEY (default_zone_id)              REFERENCES dbo.transmission_zone(zone_id)
);
GO


-- =============================================================================
-- 07. TRADE_POWER_DETAIL
-- 1:1 power extension to `trade`. Only populated when trade.commodity_type = 'POWER'.
-- Same role trade_oil_detail plays for oil and trade_freight_detail plays for freight.
-- =============================================================================
CREATE TABLE dbo.trade_power_detail (
    trade_id                    INT             NOT NULL,
    delivery_point_type            VARCHAR(20)     NOT NULL
        CONSTRAINT chk_tpd_point_type CHECK (delivery_point_type IN (
            'NODE','ZONE','HUB','INTERCONNECTOR'
        )),
    delivery_location_id              INT             NULL,   -- grid node, when delivery_point_type = 'NODE'
    zone_id                             INT             NULL,   -- when delivery_point_type IN ('ZONE','HUB')
    balancing_authority_id                INT             NULL,
    load_shape_id                           INT             NOT NULL,
    contract_capacity_mw                      DECIMAL(14,4)   NOT NULL,   -- the MW level of the trade under its load shape
    delivery_start_date                         DATE            NOT NULL,
    delivery_end_date                             DATE            NOT NULL,
    firmness                                        VARCHAR(20)     NOT NULL DEFAULT 'FIRM'
        CONSTRAINT chk_tpd_firmness CHECK (firmness IN ('FIRM','INTERRUPTIBLE','AS_AVAILABLE')),
    source_generation_asset_id                        INT             NULL,   -- PPA / physical source, if directly tied to a plant
    transmission_interconnector_id                      INT             NULL,   -- for cross-zone transmission trades
    notes                                                 VARCHAR(1000)   NULL,
    created_at                                              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                              VARCHAR(100)    NOT NULL,
    updated_at                                              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_trade_power_detail       PRIMARY KEY (trade_id),
    CONSTRAINT uq_tpd_trade                   UNIQUE      (trade_id),
    CONSTRAINT fk_tpd_trade                     FOREIGN KEY (trade_id)                      REFERENCES dbo.trade(trade_id),
    CONSTRAINT fk_tpd_location                    FOREIGN KEY (delivery_location_id)          REFERENCES dbo.location(location_id),
    CONSTRAINT fk_tpd_zone                          FOREIGN KEY (zone_id)                        REFERENCES dbo.transmission_zone(zone_id),
    CONSTRAINT fk_tpd_ba                              FOREIGN KEY (balancing_authority_id)         REFERENCES dbo.balancing_authority(balancing_authority_id),
    CONSTRAINT fk_tpd_load_shape                        FOREIGN KEY (load_shape_id)                  REFERENCES dbo.load_shape_template(load_shape_id),
    CONSTRAINT fk_tpd_generation_asset                    FOREIGN KEY (source_generation_asset_id)     REFERENCES dbo.generation_asset(generation_asset_id),
    CONSTRAINT fk_tpd_interconnector                        FOREIGN KEY (transmission_interconnector_id) REFERENCES dbo.interconnector(interconnector_id),
    CONSTRAINT chk_tpd_delivery_order                          CHECK (delivery_end_date >= delivery_start_date)
);
GO
CREATE INDEX ix_tpd_zone ON dbo.trade_power_detail (zone_id, delivery_start_date);
CREATE INDEX ix_tpd_ba   ON dbo.trade_power_detail (balancing_authority_id, delivery_start_date);
GO


-- =============================================================================
-- 08. POWER_SCHEDULE_CYCLE
-- Day-ahead / intraday / real-time gate closure times per balancing authority.
-- Mirrors pipeline_cycle's role for gas/oil pipeline nominations.
-- =============================================================================
CREATE TABLE dbo.power_schedule_cycle (
    cycle_id                    INT             NOT NULL IDENTITY(1,1),
    balancing_authority_id         INT             NOT NULL,
    cycle_code                       VARCHAR(20)     NOT NULL,   -- 'DA','ID','RT','HA'
    cycle_name                         VARCHAR(100)    NOT NULL,
    cycle_type                           VARCHAR(20)     NOT NULL
        CONSTRAINT chk_psc_type CHECK (cycle_type IN ('DAY_AHEAD','INTRADAY','REAL_TIME','HOUR_AHEAD')),
    nomination_deadline                    TIME            NULL,   -- traders must submit by this time
    gate_closure_time                        TIME            NULL,   -- market closes for this cycle
    publication_time                           TIME            NULL,   -- results/schedules published
    calendar_id                                  INT             NULL,   -- holiday calendar governing which days this cycle runs
    applies_to_days                                VARCHAR(20)     NOT NULL DEFAULT 'ALL'
        CONSTRAINT chk_psc_days CHECK (applies_to_days IN (
            'ALL','WEEKDAYS','WEEKENDS','MONDAY','TUESDAY',
            'WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'
        )),
    is_active                                        BIT             NOT NULL DEFAULT 1,
    notes                                               VARCHAR(500)    NULL,
    created_at                                            DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                            VARCHAR(100)    NOT NULL,
    updated_at                                            DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                            VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_power_schedule_cycle   PRIMARY KEY (cycle_id),
    CONSTRAINT uq_psc_code                  UNIQUE      (balancing_authority_id, cycle_code),
    CONSTRAINT fk_psc_ba                      FOREIGN KEY (balancing_authority_id) REFERENCES dbo.balancing_authority(balancing_authority_id),
    CONSTRAINT fk_psc_calendar                  FOREIGN KEY (calendar_id)            REFERENCES dbo.holiday_calendar(calendar_id)
);
GO
CREATE INDEX ix_psc_ba ON dbo.power_schedule_cycle (balancing_authority_id, is_active);
GO


-- =============================================================================
-- REFERENCE DATA SEEDS
-- =============================================================================

-- Balancing authorities — illustrative set covering US ISOs/RTOs + UK/EU TSOs
INSERT INTO dbo.balancing_authority (ba_code, ba_name, country_code, region, market_type, timezone, created_by, updated_by)
VALUES
    ('PJM',    'PJM Interconnection',           'US', 'Mid-Atlantic / Midwest', 'RTO', 'America/New_York', 'SYSTEM', 'SYSTEM'),
    ('ERCOT',  'Electric Reliability Council of Texas', 'US', 'Texas',           'ISO', 'America/Chicago',  'SYSTEM', 'SYSTEM'),
    ('CAISO',  'California ISO',                 'US', 'California',            'ISO', 'America/Los_Angeles','SYSTEM', 'SYSTEM'),
    ('MISO',   'Midcontinent ISO',                'US', 'Midwest',               'RTO', 'America/Chicago',  'SYSTEM', 'SYSTEM'),
    ('NYISO',  'New York ISO',                     'US', 'New York',              'ISO', 'America/New_York', 'SYSTEM', 'SYSTEM'),
    ('NGESO',  'National Grid Electricity System Operator', 'GB', 'Great Britain', 'TSO', 'Europe/London',  'SYSTEM', 'SYSTEM'),
    ('TENNET', 'TenneT TSO',                        'NL', 'Netherlands/Germany',  'TSO', 'Europe/Berlin',    'SYSTEM', 'SYSTEM');
GO

-- Transmission zones — a couple per BA, illustrative
INSERT INTO dbo.transmission_zone (balancing_authority_id, zone_code, zone_name, zone_type, created_by, updated_by)
SELECT ba.balancing_authority_id, z.zone_code, z.zone_name, z.zone_type, 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('PJM',   'PJM_WEST',   'PJM West Hub',        'HUB'),
    ('PJM',   'PJM_AECO',   'AECO Zone',            'LOAD_ZONE'),
    ('ERCOT', 'ERCOT_NORTH','ERCOT North Hub',      'HUB'),
    ('ERCOT', 'ERCOT_HOUSTON','ERCOT Houston Hub',  'HUB'),
    ('NGESO', 'GSP_A',      'GSP Group _A',          'GSP_GROUP'),
    ('NGESO', 'GSP_B',      'GSP Group _B',          'GSP_GROUP')
) AS z(ba_code, zone_code, zone_name, zone_type)
JOIN dbo.balancing_authority ba ON ba.ba_code = z.ba_code;
GO

-- Load shape templates — standard US + EU conventions
INSERT INTO dbo.load_shape_template (shape_code, shape_name, shape_type, applicable_days, start_hour, end_hour, hours_per_day, timezone_basis, description, created_by, updated_by)
VALUES
    ('BASELOAD', 'Baseload (7x24)',           'BASELOAD', 'ALL',      0,  24, 24.00, NULL,                  'Flat delivery every hour, every day.', 'SYSTEM', 'SYSTEM'),
    ('PEAK_US',  'US Peak (5x16, HE07-22)',   'PEAK',     'WEEKDAYS', 7,  23, 16.00, 'America/New_York',   'Standard US on-peak window, hour-ending 07 through 22, weekdays excluding NERC holidays.', 'SYSTEM', 'SYSTEM'),
    ('OFFPEAK_US','US Off-Peak',              'OFFPEAK',  'ALL',      23, 7,  8.00,  'America/New_York',   'All hours outside the US peak window, including weekends.', 'SYSTEM', 'SYSTEM'),
    ('PEAK_EU',  'EU Peak (08:00-20:00 CET)', 'PEAK',     'WEEKDAYS', 8,  20, 12.00, 'Europe/Berlin',      'Standard continental European on-peak window, weekdays.', 'SYSTEM', 'SYSTEM'),
    ('OFFPEAK_EU','EU Off-Peak',              'OFFPEAK',  'ALL',      20, 8,  12.00, 'Europe/Berlin',      'All hours outside the EU peak window, including weekends.', 'SYSTEM', 'SYSTEM'),
    ('WKND_24',  'Weekend 24h',                'CUSTOM',   'WEEKENDS', 0,  24, 24.00, NULL,                  'Full weekend delivery, both days, all hours.', 'SYSTEM', 'SYSTEM');
GO

-- Power schedule cycles — Day-Ahead / Real-Time for the main US ISOs
INSERT INTO dbo.power_schedule_cycle (balancing_authority_id, cycle_code, cycle_name, cycle_type, nomination_deadline, gate_closure_time, publication_time, applies_to_days, created_by, updated_by)
SELECT ba.balancing_authority_id, c.cycle_code, c.cycle_name, c.cycle_type, c.nomination_deadline, c.gate_closure_time, c.publication_time, 'ALL', 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('PJM',   'DA', 'Day-Ahead Market',  'DAY_AHEAD', '10:30:00', '12:00:00', '13:30:00'),
    ('PJM',   'RT', 'Real-Time Market',  'REAL_TIME',  NULL,       NULL,       NULL),
    ('ERCOT', 'DA', 'Day-Ahead Market',  'DAY_AHEAD', '10:00:00', '10:00:00', '13:30:00'),
    ('ERCOT', 'RT', 'Real-Time Market',  'REAL_TIME',  NULL,       NULL,       NULL),
    ('NGESO', 'DA', 'Day-Ahead Auction', 'DAY_AHEAD', '11:00:00', '11:00:00', '11:30:00')
) AS c(ba_code, cycle_code, cycle_name, cycle_type, nomination_deadline, gate_closure_time, publication_time)
JOIN dbo.balancing_authority ba ON ba.ba_code = c.ba_code;
GO


-- =============================================================================
-- EXAMPLE USAGE
-- =============================================================================
/*
SCENARIO — Financial power swap, PJM West Hub, Q1-27 Peak

trade row:
    trade_reference = 'PWR-2027-000201', commodity_type = 'POWER', trade_type = 'FINANCIAL',
    direction = 'BUY', quantity = <MWh for the period>, uom_id = <MWH>, currency_id = <USD>,
    counterparty_id = <cp>, product_id = <PJM West Hub Peak Swap product>,
    period_id = <Q1-27 period>, settlement_type = 'FINANCIAL', status = 'CONFIRMED'

trade_power_detail row (same trade_id):
    delivery_point_type = 'HUB', zone_id = <PJM_WEST zone_id>,
    balancing_authority_id = <PJM>, load_shape_id = <PEAK_US>,
    contract_capacity_mw = 25, delivery_start_date = '2027-01-01',
    delivery_end_date = '2027-03-31', firmness = 'FIRM'

position row (commodity, from the position engine):
    position_type = 'COMMODITY', commodity_type = 'POWER', product_id = <PJM West Hub Peak Swap>,
    period_id = <Q1-27>, net_quantity = ...
    (load shape itself isn't a position bucket dimension — two PJM West Hub Peak
    trades in the same quarter net together regardless of which trade_power_detail
    row they came from, same as oil trades net by product+period regardless of vessel)
*/

PRINT '============================================================';
PRINT 'POWER COMMODITY SCHEMA v1.0 APPLIED';
PRINT '';
PRINT '  Grid & Generation Infrastructure:';
PRINT '  01. balancing_authority    — 7 rows seeded (PJM, ERCOT, CAISO, MISO,';
PRINT '                                 NYISO, NGESO, TenneT)';
PRINT '  02. transmission_zone      — 6 rows seeded (illustrative hubs/zones)';
PRINT '  03. interconnector         — 0 rows (populate per real grid topology)';
PRINT '  04. generation_asset       — 0 rows (populate per real plant register)';
PRINT '';
PRINT '  Product Definition:';
PRINT '  05. load_shape_template    — 6 rows seeded (BASELOAD, US/EU peak+offpeak,';
PRINT '                                 weekend 24h)';
PRINT '  06. power_product_detail   — 1:1 product extension, 0 rows';
PRINT '';
PRINT '  Trade Extension:';
PRINT '  07. trade_power_detail     — 1:1 trade extension, FKs directly to';
PRINT '                                 trade(trade_id) — no stub/ALTER needed';
PRINT '';
PRINT '  Scheduling:';
PRINT '  08. power_schedule_cycle   — 5 rows seeded (PJM/ERCOT/NGESO DA + RT)';
PRINT '';
PRINT '  DEFERRED: hourly schedule/nomination submissions (operational, not';
PRINT '            master data) and ancillary service / capacity market';
PRINT '            reference tables (build when the desk actually trades them)';
PRINT '============================================================';
GO
