-- =============================================================================
-- ETRM SYSTEM — FREIGHT / CHARTER PARTY REFERENCE DATA
-- + EXTERNAL SYSTEM MASTER & GENERIC MAPPING PATCH
-- SQL Server 2022 | Version 1.0 | June 2026
-- =============================================================================
-- Run AFTER:
--   etrm_master_data_v2.0.sql        (currency, unit_of_measure, counterparty)
--   etrm_product_spec_mot_pipeline_v1.0.sql   (vessel, transport_operator, mot_type)
-- Run BEFORE:
--   etrm_trade_schema.sql            (trade_freight_detail / charter_party will FK
--                                      back to charter_party_type, freight_rate_index)
-- =============================================================================
-- ADDS 6 TABLES:
--   01. charter_party_type        — VOYAGE / TIME / BAREBOAT / COA reference
--   02. freight_rate_index        — Baltic indices, Worldscale flat rates
--   03. laytime_term_template     — SHINC/SHEX/WWD standard laytime templates
--   04. demurrage_dispatch_rate   — standard demurrage/dispatch rates by vessel type
--   05. external_system           — master list of all external systems integrated
--   06. external_system_mapping   — generic polymorphic crosswalk: any internal
--                                    master record <-> any external system's ID
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- HELPER: drop tables if re-running (reverse FK order)
-- =============================================================================
IF OBJECT_ID('dbo.external_system_mapping', 'U')  IS NOT NULL DROP TABLE dbo.external_system_mapping;
IF OBJECT_ID('dbo.external_system', 'U')           IS NOT NULL DROP TABLE dbo.external_system;
IF OBJECT_ID('dbo.demurrage_dispatch_rate', 'U')   IS NOT NULL DROP TABLE dbo.demurrage_dispatch_rate;
IF OBJECT_ID('dbo.laytime_term_template', 'U')     IS NOT NULL DROP TABLE dbo.laytime_term_template;
IF OBJECT_ID('dbo.freight_rate_index', 'U')        IS NOT NULL DROP TABLE dbo.freight_rate_index;
IF OBJECT_ID('dbo.charter_party_type', 'U')        IS NOT NULL DROP TABLE dbo.charter_party_type;
GO

-- =============================================================================
-- 01. CHARTER_PARTY_TYPE
-- Reference list of charter arrangement types. Drives rate basis and which
-- fields are mandatory on the future charter_party / trade_freight_detail
-- table (trade schema phase).
-- =============================================================================
CREATE TABLE dbo.charter_party_type (
    charter_party_type_id   INT             NOT NULL IDENTITY(1,1),
    type_code                VARCHAR(20)     NOT NULL,
    type_name                VARCHAR(100)    NOT NULL,
    rate_basis                VARCHAR(20)     NOT NULL
        CONSTRAINT chk_cpt_rate_basis CHECK (rate_basis IN (
            'PER_DAY',      -- time charter hire
            'PER_TONNE',    -- voyage / COA freight rate
            'LUMPSUM',      -- single fixed freight regardless of quantity
            'PER_CBM',      -- gas/LNG carriers
            'WORLDSCALE'    -- voyage rate expressed as % of WS flat rate
        )),
    duration_basis            VARCHAR(20)     NOT NULL
        CONSTRAINT chk_cpt_duration CHECK (duration_basis IN (
            'SINGLE_VOYAGE','TIME_PERIOD','BAREBOAT_PERIOD','CONTRACT_PERIOD'
        )),
    standard_form_reference   VARCHAR(100)    NULL,   -- e.g. 'ASBATANKVOY','SHELLTIME4','BPVOY4'
    description                VARCHAR(300)    NULL,
    is_active                  BIT             NOT NULL DEFAULT 1,
    created_at                 DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                 VARCHAR(100)    NOT NULL,
    updated_at                 DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                 VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_charter_party_type   PRIMARY KEY (charter_party_type_id),
    CONSTRAINT uq_cpt_code              UNIQUE      (type_code)
);
GO

-- =============================================================================
-- 02. FREIGHT_RATE_INDEX
-- Freight benchmark references — the freight-market equivalent of price_index.
-- Used to set/escalate time charter hire or to benchmark voyage freight
-- against a Worldscale flat rate.
-- =============================================================================
CREATE TABLE dbo.freight_rate_index (
    freight_rate_index_id    INT             NOT NULL IDENTITY(1,1),
    index_code                 VARCHAR(30)     NOT NULL,   -- 'BDTI','BCTI','BDI','WS_FLAT_TD3C'
    index_name                 VARCHAR(200)    NOT NULL,
    index_type                  VARCHAR(20)     NOT NULL
        CONSTRAINT chk_fri_type CHECK (index_type IN (
            'BALTIC',       -- Baltic Exchange dry/tanker indices
            'WORLDSCALE',   -- Worldscale flat rate, route-specific
            'ASSESSED',     -- broker-assessed market rate
            'OTHER'
        )),
    vessel_type                 VARCHAR(30)     NULL,   -- informational, mirrors vessel.vessel_type values
    route_description           VARCHAR(200)    NULL,   -- e.g. 'AG-Japan TD3C' for Worldscale routes
    commodity_type               VARCHAR(20)     NULL,   -- NULL = all commodities
    currency_id                  INT             NULL,
    uom_id                        INT             NULL,   -- rate unit (per day, per tonne) — NULL for index-point series
    publication_source            VARCHAR(100)    NULL,   -- 'Baltic Exchange','Worldscale Association'
    publication_frequency         VARCHAR(20)     NULL
        CONSTRAINT chk_fri_freq CHECK (publication_frequency IN ('DAILY','WEEKLY','ANNUAL',NULL)),
    description                   VARCHAR(300)    NULL,
    is_active                     BIT             NOT NULL DEFAULT 1,
    created_at                    DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                    VARCHAR(100)    NOT NULL,
    updated_at                    DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                    VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_freight_rate_index   PRIMARY KEY (freight_rate_index_id),
    CONSTRAINT uq_fri_code               UNIQUE      (index_code),
    CONSTRAINT fk_fri_currency           FOREIGN KEY (currency_id) REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_fri_uom                FOREIGN KEY (uom_id)      REFERENCES dbo.unit_of_measure(uom_id)
);
GO

-- =============================================================================
-- 03. LAYTIME_TERM_TEMPLATE
-- Standard laytime calculation templates referenced by charter parties.
-- Defines which days count against laytime and whether load/discharge
-- allowances are reversible.
-- =============================================================================
CREATE TABLE dbo.laytime_term_template (
    laytime_term_id         INT             NOT NULL IDENTITY(1,1),
    term_code                 VARCHAR(20)     NOT NULL,   -- 'SHINC','SHEX','WWDSHEXUU'
    term_name                  VARCHAR(150)    NOT NULL,
    exclusion_basis              VARCHAR(20)     NOT NULL
        CONSTRAINT chk_ltt_exclusion CHECK (exclusion_basis IN (
            'SHINC',        -- Sundays/Holidays Included
            'SHEX',         -- Sundays/Holidays Excluded
            'SHEXEIU',      -- SHEX Even If Used
            'SHEXUU',       -- SHEX Unless Used
            'WWD',          -- Weather Working Days
            'WWDSHEXUU',    -- Weather Working Days, SHEX Unless Used
            'FHEX'          -- Fridays/Holidays Excluded (some jurisdictions)
        )),
    is_reversible                 BIT             NOT NULL DEFAULT 0,
    -- TRUE: load + discharge laytime pooled into one allowance (reversible laytime)
    -- FALSE: separate laytime allowance at each port (non-reversible)
    description                    VARCHAR(300)    NULL,
    is_active                       BIT             NOT NULL DEFAULT 1,
    created_at                      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                      VARCHAR(100)    NOT NULL,
    updated_at                      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                      VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_laytime_term_template  PRIMARY KEY (laytime_term_id),
    CONSTRAINT uq_ltt_code                 UNIQUE      (term_code)
);
GO

-- =============================================================================
-- 04. DEMURRAGE_DISPATCH_RATE
-- Standard/default demurrage and dispatch rates, typically negotiated per
-- vessel class or charter party template and used as a fallback when a
-- specific fixture does not override them.
-- =============================================================================
CREATE TABLE dbo.demurrage_dispatch_rate (
    demurrage_rate_id          INT             NOT NULL IDENTITY(1,1),
    vessel_type                  VARCHAR(30)     NULL,   -- mirrors vessel.vessel_type; NULL = generic/all
    charter_party_type_id         INT             NULL,
    demurrage_rate_per_day          DECIMAL(14,2)   NOT NULL,
    dispatch_rate_per_day            DECIMAL(14,2)   NULL,
    -- Dispatch is conventionally half demurrage unless otherwise agreed —
    -- store explicitly rather than always deriving, since some fixtures deviate.
    currency_id                       INT             NOT NULL,
    effective_from                     DATE            NOT NULL,
    effective_to                        DATE            NULL,
    notes                                VARCHAR(500)    NULL,
    is_active                            BIT             NOT NULL DEFAULT 1,
    created_at                           DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                           VARCHAR(100)    NOT NULL,
    updated_at                           DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                           VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_demurrage_dispatch_rate   PRIMARY KEY (demurrage_rate_id),
    CONSTRAINT fk_ddr_cp_type                 FOREIGN KEY (charter_party_type_id) REFERENCES dbo.charter_party_type(charter_party_type_id),
    CONSTRAINT fk_ddr_currency                FOREIGN KEY (currency_id)           REFERENCES dbo.currency(currency_id),
    CONSTRAINT chk_ddr_date_range              CHECK (effective_to IS NULL OR effective_to >= effective_from)
);
GO
CREATE INDEX ix_ddr_vessel_type ON dbo.demurrage_dispatch_rate (vessel_type, is_active);
GO

-- =============================================================================
-- 05. EXTERNAL_SYSTEM
-- Master list of every external system this ETRM integrates with —
-- market data vendors, ERP, CTRM, shipping/AIS, banks, regulatory repositories.
-- =============================================================================
CREATE TABLE dbo.external_system (
    external_system_id     INT             NOT NULL IDENTITY(1,1),
    system_code              VARCHAR(30)     NOT NULL,   -- 'BLOOMBERG','SAP_ERP','DTCC_GTR'
    system_name               VARCHAR(150)    NOT NULL,
    system_type                VARCHAR(20)     NOT NULL
        CONSTRAINT chk_es_type CHECK (system_type IN (
            'MARKET_DATA','ERP','CTRM','SHIPPING','BANK',
            'REGULATORY','RISK','AIS_TRACKING','OTHER'
        )),
    vendor_name                 VARCHAR(150)    NULL,
    connection_type               VARCHAR(20)     NULL
        CONSTRAINT chk_es_conn CHECK (connection_type IN (
            'API','SFTP','FILE','MANUAL','MESSAGE_QUEUE',NULL
        )),
    base_url                      VARCHAR(500)    NULL,
    owner_team                     VARCHAR(100)    NULL,
    is_active                       BIT             NOT NULL DEFAULT 1,
    notes                            VARCHAR(500)    NULL,
    created_at                       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                       VARCHAR(100)    NOT NULL,
    updated_at                       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                       VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_external_system   PRIMARY KEY (external_system_id),
    CONSTRAINT uq_es_code             UNIQUE      (system_code)
);
GO

-- =============================================================================
-- 06. EXTERNAL_SYSTEM_MAPPING
-- Generic polymorphic crosswalk: maps ANY internal master record to its
-- equivalent ID/code in ANY external system, instead of a separate
-- "_external_id" column or table per integration. Follows the same
-- entity_type + entity_id pattern used by address/contact/tax_registration.
-- =============================================================================
CREATE TABLE dbo.external_system_mapping (
    mapping_id                 INT             NOT NULL IDENTITY(1,1),
    external_system_id           INT             NOT NULL,
    entity_type                    VARCHAR(30)     NOT NULL
        CONSTRAINT chk_esm_entity_type CHECK (entity_type IN (
            'COUNTERPARTY','VESSEL','PRODUCT','LOCATION','TRADER','BOOK',
            'LEGAL_ENTITY','PRICE_INDEX','FREIGHT_RATE_INDEX','CURRENCY',
            'TRADE','STORAGE_FACILITY','TRANSPORT_OPERATOR','OTHER'
        )),
    entity_id                       INT             NOT NULL,   -- internal PK value of the row above
    external_code                    VARCHAR(100)    NOT NULL,  -- the external system's code/ticker/ID
    external_id                       VARCHAR(100)    NULL,     -- external system's internal surrogate key, if different from code
    external_name                      VARCHAR(300)    NULL,    -- external system's display name, for human cross-checking
    sync_direction                      VARCHAR(20)     NOT NULL DEFAULT 'BIDIRECTIONAL'
        CONSTRAINT chk_esm_sync_dir CHECK (sync_direction IN (
            'INBOUND','OUTBOUND','BIDIRECTIONAL'
        )),
    is_active                            BIT             NOT NULL DEFAULT 1,
    last_synced_at                        DATETIME2       NULL,
    last_sync_status                       VARCHAR(20)     NULL
        CONSTRAINT chk_esm_sync_status CHECK (last_sync_status IN (
            'SUCCESS','FAILED','PENDING',NULL
        )),
    notes                                    VARCHAR(500)    NULL,
    created_at                               DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                               VARCHAR(100)    NOT NULL,
    updated_at                               DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                               VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_external_system_mapping   PRIMARY KEY (mapping_id),
    CONSTRAINT fk_esm_system                  FOREIGN KEY (external_system_id) REFERENCES dbo.external_system(external_system_id),
    -- One mapping per internal record per external system
    CONSTRAINT uq_esm_entity                   UNIQUE (external_system_id, entity_type, entity_id),
    -- An external code should not be claimed by two internal records in the same system/entity_type
    CONSTRAINT uq_esm_external_code             UNIQUE (external_system_id, entity_type, external_code)
);
GO
-- Fast lookup: "give me every external mapping for this internal record"
CREATE INDEX ix_esm_entity_lookup ON dbo.external_system_mapping (entity_type, entity_id, is_active);
GO


-- =============================================================================
-- REFERENCE DATA SEEDS
-- =============================================================================

-- Charter party types
INSERT INTO dbo.charter_party_type (type_code, type_name, rate_basis, duration_basis, standard_form_reference, description, created_by, updated_by)
VALUES
    ('VOYAGE',   'Voyage Charter',                'PER_TONNE',  'SINGLE_VOYAGE',    'ASBATANKVOY / GENCON', 'Single voyage, freight per tonne or lumpsum, owner bears voyage costs and risk.', 'SYSTEM', 'SYSTEM'),
    ('TC',       'Time Charter',                  'PER_DAY',    'TIME_PERIOD',      'SHELLTIME4 / NYPE',     'Vessel hired for a fixed period; charterer directs voyages and pays bunkers/port costs; owner paid daily hire.', 'SYSTEM', 'SYSTEM'),
    ('BAREBOAT', 'Bareboat / Demise Charter',      'PER_DAY',    'BAREBOAT_PERIOD',  'BARECON',                'Charterer takes full operational control including crewing; owner provides vessel only.', 'SYSTEM', 'SYSTEM'),
    ('COA',      'Contract of Affreightment',      'PER_TONNE',  'CONTRACT_PERIOD',  NULL,                     'Commitment to carry multiple cargoes of agreed total quantity over a period, owner nominates vessels per shipment.', 'SYSTEM', 'SYSTEM'),
    ('WS_VOYAGE','Voyage Charter — Worldscale',    'WORLDSCALE', 'SINGLE_VOYAGE',    'ASBATANKVOY',            'Voyage charter where freight is quoted as a % of the published Worldscale flat rate for the route.', 'SYSTEM', 'SYSTEM');
GO

-- Freight rate indices (Baltic Exchange — seed common dry/tanker indices)
INSERT INTO dbo.freight_rate_index (index_code, index_name, index_type, vessel_type, route_description, commodity_type, publication_source, publication_frequency, description, created_by, updated_by)
VALUES
    ('BDTI',  'Baltic Dirty Tanker Index',  'BALTIC', NULL,        NULL, 'OIL', 'Baltic Exchange', 'DAILY', 'Composite index tracking crude/dirty product tanker freight rates across major routes.', 'SYSTEM', 'SYSTEM'),
    ('BCTI',  'Baltic Clean Tanker Index',  'BALTIC', NULL,        NULL, 'OIL', 'Baltic Exchange', 'DAILY', 'Composite index tracking clean petroleum product tanker freight rates.', 'SYSTEM', 'SYSTEM'),
    ('BDI',   'Baltic Dry Index',           'BALTIC', 'BULK_CARRIER', NULL, 'AGRICULTURAL', 'Baltic Exchange', 'DAILY', 'Composite dry bulk freight index (Capesize/Panamax/Supramax/Handysize).', 'SYSTEM', 'SYSTEM'),
    ('BPI',   'Baltic Panamax Index',       'BALTIC', 'PANAMAX',    NULL, 'AGRICULTURAL', 'Baltic Exchange', 'DAILY', 'Panamax dry bulk freight index.', 'SYSTEM', 'SYSTEM'),
    ('BSI',   'Baltic Supramax Index',      'BALTIC', 'OTHER',      NULL, 'AGRICULTURAL', 'Baltic Exchange', 'DAILY', 'Supramax dry bulk freight index.', 'SYSTEM', 'SYSTEM'),
    ('BHSI',  'Baltic Handysize Index',     'BALTIC', 'HANDYSIZE',  NULL, 'AGRICULTURAL', 'Baltic Exchange', 'DAILY', 'Handysize dry bulk freight index.', 'SYSTEM', 'SYSTEM'),
    ('WS_FLAT_TD3C', 'Worldscale Flat Rate — TD3C (AG-China VLCC)', 'WORLDSCALE', 'VLCC', 'Arabian Gulf to China', 'OIL', 'Worldscale Association', 'ANNUAL', 'Annually published Worldscale 100 (WS100) flat rate in USD/tonne for the AG-China VLCC benchmark route.', 'SYSTEM', 'SYSTEM');
GO

-- Laytime term templates
INSERT INTO dbo.laytime_term_template (term_code, term_name, exclusion_basis, is_reversible, description, created_by, updated_by)
VALUES
    ('SHINC',       'Sundays/Holidays Included',                 'SHINC',     0, 'All days count against laytime regardless of Sundays or holidays.', 'SYSTEM', 'SYSTEM'),
    ('SHEX',        'Sundays/Holidays Excluded',                 'SHEX',      0, 'Sundays and holidays do not count against laytime.', 'SYSTEM', 'SYSTEM'),
    ('SHEXEIU',     'SHEX Even If Used',                          'SHEXEIU',   0, 'Sundays/holidays excluded from laytime even if cargo work actually takes place.', 'SYSTEM', 'SYSTEM'),
    ('SHEXUU',      'SHEX Unless Used',                           'SHEXUU',    0, 'Sundays/holidays excluded from laytime unless cargo work actually takes place, in which case time used counts.', 'SYSTEM', 'SYSTEM'),
    ('WWD',         'Weather Working Days',                       'WWD',       0, 'Only days/parts of days when weather permits cargo work count against laytime.', 'SYSTEM', 'SYSTEM'),
    ('WWDSHEXUU',   'Weather Working Days, SHEX Unless Used',     'WWDSHEXUU', 0, 'Combination: weather working days, with Sundays/holidays excluded unless used.', 'SYSTEM', 'SYSTEM'),
    ('WWD_REV',     'Weather Working Days — Reversible',          'WWD',       1, 'Weather working days with load and discharge laytime allowances pooled (reversible).', 'SYSTEM', 'SYSTEM');
GO

-- Demurrage / dispatch standard rates (illustrative defaults by vessel class — USD)
INSERT INTO dbo.demurrage_dispatch_rate (vessel_type, charter_party_type_id, demurrage_rate_per_day, dispatch_rate_per_day, currency_id, effective_from, notes, created_by, updated_by)
SELECT v.vessel_type, cpt.charter_party_type_id, v.demurrage, v.dispatch, c.currency_id, '2026-01-01', 'Indicative default — confirm against fixture recap before use.', 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('VLCC',      45000.00, 22500.00),
    ('SUEZMAX',   32000.00, 16000.00),
    ('AFRAMAX',   25000.00, 12500.00),
    ('PANAMAX',   18000.00, 9000.00),
    ('MR_TANKER', 12000.00, 6000.00)
) AS v(vessel_type, demurrage, dispatch)
CROSS JOIN (SELECT charter_party_type_id FROM dbo.charter_party_type WHERE type_code = 'VOYAGE') cpt
CROSS JOIN (SELECT currency_id FROM dbo.currency WHERE currency_code = 'USD') c;
GO

-- External systems — seeded as inactive placeholders pending vendor decisions
-- (see handoff doc Section 12 "Open Decisions": market data vendor, ERP not yet finalised).
-- MANUAL_UPLOAD is active by default as the day-1 fallback integration method.
INSERT INTO dbo.external_system (system_code, system_name, system_type, vendor_name, connection_type, is_active, notes, created_by, updated_by)
VALUES
    ('MANUAL_UPLOAD', 'Manual File Upload',         'OTHER',       NULL,         'FILE',    1, 'Default fallback — spreadsheet/CSV upload until a live integration is built for a given data feed.', 'SYSTEM', 'SYSTEM'),
    ('BLOOMBERG',      'Bloomberg Terminal/API',      'MARKET_DATA', 'Bloomberg',  'API',     0, 'Pending vendor decision — see Open Decisions.', 'SYSTEM', 'SYSTEM'),
    ('PLATTS',          'S&P Global Platts',           'MARKET_DATA', 'S&P Global', 'API',     0, 'Pending vendor decision — see Open Decisions.', 'SYSTEM', 'SYSTEM'),
    ('ARGUS',             'Argus Media',                  'MARKET_DATA', 'Argus',      'API',     0, 'Pending vendor decision — see Open Decisions.', 'SYSTEM', 'SYSTEM'),
    ('ICE',                 'ICE Data Services',             'MARKET_DATA', 'ICE',        'API',     0, 'Pending vendor decision — see Open Decisions.', 'SYSTEM', 'SYSTEM'),
    ('SAP_ERP',               'SAP ERP',                        'ERP',         'SAP',        'API',     0, 'Pending ERP integration decision — see Open Decisions.', 'SYSTEM', 'SYSTEM'),
    ('AIS_TRACKING',            'AIS Vessel Tracking Feed',       'AIS_TRACKING','TBD',        'API',     0, 'Pending vendor selection for live vessel position tracking.', 'SYSTEM', 'SYSTEM'),
    ('DTCC_GTR',                  'DTCC Global Trade Repository',   'REGULATORY',  'DTCC',       'API',     0, 'Pending regulatory jurisdiction decision (EMIR/CFTC) — see Open Decisions.', 'SYSTEM', 'SYSTEM');
GO


-- =============================================================================
-- EXAMPLE USAGE
-- =============================================================================
/*
-- Map an internal counterparty to its SAP vendor code once SAP integration goes live:
INSERT INTO dbo.external_system_mapping
    (external_system_id, entity_type, entity_id, external_code, external_name, sync_direction, created_by, updated_by)
SELECT es.external_system_id, 'COUNTERPARTY', cp.counterparty_id, 'SAP-VEND-00123', cp.legal_name, 'BIDIRECTIONAL', 'SYSTEM', 'SYSTEM'
FROM dbo.external_system es, dbo.counterparty cp
WHERE es.system_code = 'SAP_ERP' AND cp.cp_code = 'EXAMPLE_CP';

-- Find every external system a given vessel is mapped to:
SELECT es.system_name, esm.external_code, esm.last_synced_at, esm.last_sync_status
FROM dbo.external_system_mapping esm
JOIN dbo.external_system es ON es.external_system_id = esm.external_system_id
JOIN dbo.vessel v ON v.vessel_id = esm.entity_id AND esm.entity_type = 'VESSEL'
WHERE v.imo_number = 'IMO9876543';
*/

PRINT '============================================================';
PRINT 'FREIGHT / CHARTER + EXTERNAL SYSTEM MD PATCH v1.0 APPLIED';
PRINT '';
PRINT '  01. charter_party_type        — 5 rows seeded (VOYAGE, TC, BAREBOAT, COA, WS_VOYAGE)';
PRINT '  02. freight_rate_index        — 7 rows seeded (Baltic + Worldscale)';
PRINT '  03. laytime_term_template     — 7 rows seeded (SHINC/SHEX/WWD variants)';
PRINT '  04. demurrage_dispatch_rate   — 5 rows seeded (indicative by vessel class)';
PRINT '  05. external_system           — 8 rows seeded (1 active: MANUAL_UPLOAD;';
PRINT '                                    7 inactive pending Open Decisions vendor choice)';
PRINT '  06. external_system_mapping   — generic polymorphic crosswalk, 0 rows';
PRINT '                                    (entity_type + entity_id pattern,';
PRINT '                                    matches address/contact/tax_registration)';
PRINT '';
PRINT '  NOTE: charter_party / trade_freight_detail (the actual fixture/contract';
PRINT '        records) are TRANSACTIONAL — they belong in the trade schema';
PRINT '        phase next, FK''ing back to charter_party_type and';
PRINT '        freight_rate_index defined here.';
PRINT '============================================================';
GO
