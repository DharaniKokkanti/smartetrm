-- =============================================================================
-- V108 -- Voyage / Time Charter / Bunker management operational backbone.
--
-- Per etrm-charter-bunker-demurrage-prompt.md: the existing freight/demurrage
-- reference data (V8/V53/V54 -- charter_party_type, freight_rate_index,
-- laytime_term_template, demurrage_dispatch_rate, laytime_exception_type)
-- and the vessel master table are all reference data, with no operational
-- entity for an actual voyage or an actual charter party fixture. This adds
-- that backbone: Vessel (unchanged) -> Voyage -> Charter Party -> Cargo
-- Parcel (bridge to trade_order/trade_item) -> Bunker Stem + ROB ledger ->
-- SOF events -> Laytime Calculation (versioned data capture, not a calc
-- engine). Commodity-agnostic throughout -- commodity comes from the linked
-- product on voyage_cargo_parcel, never hardcoded.
--
-- Explicitly deferred to a later phase (per user direction): claims workflow,
-- hire statement/redelivery reconciliation calc engines, a laytime calc
-- engine, and all position/P&L/invoicing.
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- 1. BUNKER_FUEL_GRADE -- lookup
-- =============================================================================
CREATE TABLE dbo.bunker_fuel_grade (
    fuel_grade_id         INT             NOT NULL IDENTITY(1,1),
    grade_code             VARCHAR(30)     NOT NULL,
    grade_name              VARCHAR(150)    NOT NULL,
    is_alternative_fuel        BIT             NOT NULL DEFAULT 0,   -- biofuel blend / methanol / LNG boil-off vs conventional
    description                  VARCHAR(300)    NULL,
    sort_order                     SMALLINT        NOT NULL DEFAULT 0,
    is_active                        BIT             NOT NULL DEFAULT 1,
    created_at                         DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                           VARCHAR(100)    NOT NULL,
    updated_at                             DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                               VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_bunker_fuel_grade   PRIMARY KEY (fuel_grade_id),
    CONSTRAINT uq_bfg_code              UNIQUE      (grade_code)
);
GO
CREATE INDEX ix_bunker_fuel_grade_active ON dbo.bunker_fuel_grade (is_active, sort_order);
GO

INSERT INTO dbo.bunker_fuel_grade (grade_code, grade_name, is_alternative_fuel, sort_order, created_by, updated_by)
VALUES
    ('VLSFO',           'Very Low Sulphur Fuel Oil (0.5%)',   0, 1, 'SYSTEM', 'SYSTEM'),
    ('HSFO',             'High Sulphur Fuel Oil',               0, 2, 'SYSTEM', 'SYSTEM'),
    ('ULSFO',              'Ultra Low Sulphur Fuel Oil',            0, 3, 'SYSTEM', 'SYSTEM'),
    ('LSMGO',                'Low Sulphur Marine Gas Oil',              0, 4, 'SYSTEM', 'SYSTEM'),
    ('MGO',                    'Marine Gas Oil',                            0, 5, 'SYSTEM', 'SYSTEM'),
    ('METHANOL',                 'Methanol (marine fuel)',                     1, 6, 'SYSTEM', 'SYSTEM'),
    ('LNG_BOG',                    'LNG Boil-Off Gas (as fuel)',                    1, 7, 'SYSTEM', 'SYSTEM'),
    ('BIOFUEL_BLEND',                 'Biofuel Blend (e.g. B24/B30)',                    1, 8, 'SYSTEM', 'SYSTEM');
GO

-- =============================================================================
-- 2. SOF_EVENT_TYPE -- lookup
-- =============================================================================
CREATE TABLE dbo.sof_event_type (
    sof_event_type_id       INT             NOT NULL IDENTITY(1,1),
    event_code                VARCHAR(30)     NOT NULL,
    event_name                  VARCHAR(150)    NOT NULL,
    event_sequence_order            SMALLINT        NOT NULL DEFAULT 0,   -- typical chronological order within a port call, for display
    description                        VARCHAR(300)    NULL,
    is_active                            BIT             NOT NULL DEFAULT 1,
    created_at                              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                VARCHAR(100)    NOT NULL,
    updated_at                                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                    VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_sof_event_type   PRIMARY KEY (sof_event_type_id),
    CONSTRAINT uq_set_code           UNIQUE      (event_code)
);
GO
CREATE INDEX ix_sof_event_type_active ON dbo.sof_event_type (is_active, event_sequence_order);
GO

INSERT INTO dbo.sof_event_type (event_code, event_name, event_sequence_order, created_by, updated_by)
VALUES
    ('NOR_TENDERED',           'Notice of Readiness Tendered',      1,  'SYSTEM', 'SYSTEM'),
    ('ANCHORED',                 'Vessel Anchored',                     2,  'SYSTEM', 'SYSTEM'),
    ('PILOT_ON_BOARD',             'Pilot On Board',                       3,  'SYSTEM', 'SYSTEM'),
    ('BERTHED',                       'Vessel Berthed',                        4,  'SYSTEM', 'SYSTEM'),
    ('HOSES_CONNECTED',                 'Hoses Connected',                         5,  'SYSTEM', 'SYSTEM'),
    ('COMMENCED_LOADING',                  'Commenced Loading',                        6,  'SYSTEM', 'SYSTEM'),
    ('COMPLETED_LOADING',                     'Completed Loading',                          7,  'SYSTEM', 'SYSTEM'),
    ('COMMENCED_DISCHARGE',                      'Commenced Discharge',                          8,  'SYSTEM', 'SYSTEM'),
    ('COMPLETED_DISCHARGE',                         'Completed Discharge',                            9,  'SYSTEM', 'SYSTEM'),
    ('HOSES_DISCONNECTED',                             'Hoses Disconnected',                               10, 'SYSTEM', 'SYSTEM'),
    ('VESSEL_DEPARTED',                                   'Vessel Departed',                                     11, 'SYSTEM', 'SYSTEM');
GO

-- =============================================================================
-- 3. OFF_HIRE_REASON_TYPE -- lookup
-- =============================================================================
CREATE TABLE dbo.off_hire_reason_type (
    off_hire_reason_type_id   INT             NOT NULL IDENTITY(1,1),
    reason_code                 VARCHAR(30)     NOT NULL,
    reason_name                   VARCHAR(150)    NOT NULL,
    description                     VARCHAR(300)    NULL,
    is_active                         BIT             NOT NULL DEFAULT 1,
    created_at                          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                            VARCHAR(100)    NOT NULL,
    updated_at                              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_off_hire_reason_type   PRIMARY KEY (off_hire_reason_type_id),
    CONSTRAINT uq_ohrt_code                 UNIQUE      (reason_code)
);
GO

INSERT INTO dbo.off_hire_reason_type (reason_code, reason_name, created_by, updated_by)
VALUES
    ('BREAKDOWN',           'Machinery / Equipment Breakdown', 'SYSTEM', 'SYSTEM'),
    ('DRY_DOCKING',           'Dry-Docking / Special Survey',      'SYSTEM', 'SYSTEM'),
    ('DEVIATION',               'Deviation from Voyage Orders',        'SYSTEM', 'SYSTEM'),
    ('AWAITING_ORDERS',           'Awaiting Charterer Orders',              'SYSTEM', 'SYSTEM'),
    ('CREW_ISSUE',                   'Crew Issue / Illness',                     'SYSTEM', 'SYSTEM'),
    ('INSPECTION',                     'Vetting / Port State Inspection',             'SYSTEM', 'SYSTEM'),
    ('OTHER',                            'Other',                                         'SYSTEM', 'SYSTEM');
GO

-- =============================================================================
-- 4. VOYAGE -- the operational spine
-- =============================================================================
CREATE TABLE dbo.voyage (
    voyage_id                INT             NOT NULL IDENTITY(1,1),
    voyage_number              VARCHAR(30)     NOT NULL,
    vessel_id                    INT             NOT NULL,
    charter_party_id                INT             NULL,   -- nullable: a voyage can exist before a fixture is finalized
    status                             VARCHAR(20)     NOT NULL DEFAULT 'PLANNED'
        CONSTRAINT chk_voyage_status CHECK (status IN ('PLANNED','IN_PROGRESS','COMPLETED','CANCELLED')),
    laden_ballast_status                 VARCHAR(10)     NULL
        CONSTRAINT chk_voyage_laden_ballast CHECK (laden_ballast_status IS NULL OR laden_ballast_status IN ('LADEN','BALLAST')),
    laycan_start                            DATE            NULL,
    laycan_end                                DATE            NULL,
    load_location_id                            INT             NULL,
    discharge_location_id                          INT             NULL,
    eta                                                DATETIME2       NULL,
    etd                                                  DATETIME2       NULL,
    notes                                                  VARCHAR(1000)   NULL,
    is_active                                                BIT             NOT NULL DEFAULT 1,
    created_at                                                 DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                                   VARCHAR(100)    NOT NULL,
    updated_at                                                     DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                                       VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_voyage                 PRIMARY KEY (voyage_id),
    CONSTRAINT uq_voyage_number             UNIQUE      (voyage_number),
    CONSTRAINT fk_voyage_vessel               FOREIGN KEY (vessel_id)             REFERENCES dbo.vessel(vessel_id),
    CONSTRAINT fk_voyage_load_location           FOREIGN KEY (load_location_id)      REFERENCES dbo.location(location_id),
    CONSTRAINT fk_voyage_discharge_location         FOREIGN KEY (discharge_location_id) REFERENCES dbo.location(location_id),
    CONSTRAINT chk_voyage_laycan                       CHECK (laycan_end IS NULL OR laycan_start IS NULL OR laycan_end >= laycan_start)
);
GO
CREATE INDEX ix_voyage_vessel ON dbo.voyage (vessel_id, status);
GO

-- =============================================================================
-- 5. CHARTER_PARTY -- the real fixture (distinct from charter_party_type)
-- =============================================================================
CREATE TABLE dbo.charter_party (
    charter_party_id           INT             NOT NULL IDENTITY(1,1),
    cp_reference                  VARCHAR(50)     NOT NULL,   -- broker fixture note / recap reference
    charter_party_type_id            INT             NOT NULL,
    vessel_id                           INT             NOT NULL,
    counterparty_id                        INT             NOT NULL,   -- "the other side", regardless of direction
    direction                                 VARCHAR(15)     NOT NULL
        CONSTRAINT chk_cp_direction CHECK (direction IN ('CHARTER_IN','CHARTER_OUT')),
    -- Time charter terms (nullable -- only meaningful when charter_party_type_id's duration_basis is TIME_PERIOD)
    hire_rate                                    DECIMAL(14,2)   NULL,
    hire_currency_id                                INT             NULL,
    hire_payment_frequency                             VARCHAR(20)     NULL
        CONSTRAINT chk_cp_hire_freq CHECK (hire_payment_frequency IS NULL OR hire_payment_frequency IN ('MONTHLY','SEMI_MONTHLY','FIFTEEN_DAYS')),
    -- Voyage / COA freight terms (nullable -- only meaningful for SINGLE_VOYAGE/CONTRACT_PERIOD)
    freight_rate                                       DECIMAL(14,4)   NULL,
    freight_rate_basis                                    VARCHAR(20)     NULL
        CONSTRAINT chk_cp_freight_basis CHECK (freight_rate_basis IS NULL OR freight_rate_basis IN ('PER_TONNE','LUMPSUM','PER_CBM','WORLDSCALE')),
    -- Laytime / demurrage (fixture-negotiated, overrides the demurrage_dispatch_rate default when set)
    laytime_term_id                                          INT             NULL,
    demurrage_rate_per_day                                      DECIMAL(14,2)   NULL,
    dispatch_rate_per_day                                          DECIMAL(14,2)   NULL,
    -- Delivery / redelivery (time charter)
    delivery_location_id                                              INT             NULL,
    redelivery_location_id                                               INT             NULL,
    delivery_date                                                           DATE            NULL,
    redelivery_date_estimate                                                   DATE            NULL,
    -- Bunker delivery/redelivery clause
    bunker_clause_basis                                                          VARCHAR(20)     NULL
        CONSTRAINT chk_cp_bunker_clause CHECK (bunker_clause_basis IS NULL OR bunker_clause_basis IN ('SAME_QUANTITY_PCT','AS_ON_DELIVERY','FIXED_PRICE')),
    bunker_clause_tolerance_pct                                                     DECIMAL(5,2)    NULL,
    -- Extension / option periods
    option_period_months                                                               SMALLINT        NULL,
    status                                                                                 VARCHAR(15)     NOT NULL DEFAULT 'ON_SUBS'
        CONSTRAINT chk_cp_status CHECK (status IN ('ON_SUBS','FIXED','CANCELLED','COMPLETED')),
    notes                                                                                       VARCHAR(1000)   NULL,
    is_active                                                                                     BIT             NOT NULL DEFAULT 1,
    created_at                                                                                       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                                                                         VARCHAR(100)    NOT NULL,
    updated_at                                                                                           DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                                                                             VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_charter_party                 PRIMARY KEY (charter_party_id),
    CONSTRAINT uq_charter_party_reference           UNIQUE      (cp_reference),
    CONSTRAINT fk_cp_type                              FOREIGN KEY (charter_party_type_id)   REFERENCES dbo.charter_party_type(charter_party_type_id),
    CONSTRAINT fk_cp_vessel                               FOREIGN KEY (vessel_id)               REFERENCES dbo.vessel(vessel_id),
    CONSTRAINT fk_cp_counterparty                            FOREIGN KEY (counterparty_id)         REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT fk_cp_hire_currency                              FOREIGN KEY (hire_currency_id)        REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_cp_laytime_term                                  FOREIGN KEY (laytime_term_id)          REFERENCES dbo.laytime_term_template(laytime_term_id),
    CONSTRAINT fk_cp_delivery_location                                FOREIGN KEY (delivery_location_id)     REFERENCES dbo.location(location_id),
    CONSTRAINT fk_cp_redelivery_location                                 FOREIGN KEY (redelivery_location_id)   REFERENCES dbo.location(location_id)
);
GO
CREATE INDEX ix_charter_party_vessel ON dbo.charter_party (vessel_id, status);
GO

-- voyage.charter_party_id FK, added after charter_party exists
ALTER TABLE dbo.voyage ADD CONSTRAINT fk_voyage_charter_party FOREIGN KEY (charter_party_id) REFERENCES dbo.charter_party(charter_party_id);
GO

-- =============================================================================
-- 6. CHARTER_OFF_HIRE_EVENT
-- =============================================================================
CREATE TABLE dbo.charter_off_hire_event (
    off_hire_event_id       INT             NOT NULL IDENTITY(1,1),
    charter_party_id           INT             NOT NULL,
    off_hire_reason_type_id       INT             NOT NULL,
    from_ts                          DATETIME2       NOT NULL,
    to_ts                               DATETIME2       NULL,   -- NULL while still ongoing
    hours                                  DECIMAL(10,2)   NULL,   -- computed and stored on save by the service layer once to_ts is known
    notes                                     VARCHAR(500)    NULL,
    created_at                                 DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                   VARCHAR(100)    NOT NULL,
    updated_at                                     DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                       VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_charter_off_hire_event   PRIMARY KEY (off_hire_event_id),
    CONSTRAINT fk_cohe_charter_party           FOREIGN KEY (charter_party_id)     REFERENCES dbo.charter_party(charter_party_id),
    CONSTRAINT fk_cohe_reason_type               FOREIGN KEY (off_hire_reason_type_id) REFERENCES dbo.off_hire_reason_type(off_hire_reason_type_id),
    CONSTRAINT chk_cohe_ts_order                     CHECK (to_ts IS NULL OR to_ts >= from_ts)
);
GO
CREATE INDEX ix_cohe_charter_party ON dbo.charter_off_hire_event (charter_party_id);
GO

-- =============================================================================
-- 7. VOYAGE_CARGO_PARCEL -- the commodity-agnostic bridge to the trade book
-- =============================================================================
CREATE TABLE dbo.voyage_cargo_parcel (
    cargo_parcel_id           INT             NOT NULL IDENTITY(1,1),
    voyage_id                    INT             NOT NULL,
    product_id                      INT             NULL,       -- grade -- references existing dbo.product, never duplicated
    commodity_type                     VARCHAR(20)     NULL,       -- denormalized from product, same convention as desk/book.commodity_type
    quantity                              DECIMAL(18,4)   NOT NULL,
    uom_id                                   INT             NOT NULL,
    load_terminal_location_id                   INT             NULL,
    discharge_terminal_location_id                 INT             NULL,
    trade_order_id                                    INT             NULL,       -- join point back into the existing trade book, by id only
    trade_item_id                                        INT             NULL,
    notes                                                    VARCHAR(500)    NULL,
    is_active                                                  BIT             NOT NULL DEFAULT 1,
    created_at                                                   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                                     VARCHAR(100)    NOT NULL,
    updated_at                                                       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                                         VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_voyage_cargo_parcel                 PRIMARY KEY (cargo_parcel_id),
    CONSTRAINT fk_vcp_voyage                             FOREIGN KEY (voyage_id)                        REFERENCES dbo.voyage(voyage_id),
    CONSTRAINT fk_vcp_product                               FOREIGN KEY (product_id)                       REFERENCES dbo.product(product_id),
    CONSTRAINT fk_vcp_uom                                      FOREIGN KEY (uom_id)                           REFERENCES dbo.unit_of_measure(uom_id),
    CONSTRAINT fk_vcp_load_terminal                               FOREIGN KEY (load_terminal_location_id)        REFERENCES dbo.location(location_id),
    CONSTRAINT fk_vcp_discharge_terminal                             FOREIGN KEY (discharge_terminal_location_id)   REFERENCES dbo.location(location_id),
    CONSTRAINT fk_vcp_trade_order                                       FOREIGN KEY (trade_order_id)                   REFERENCES dbo.trade_order(order_id),
    CONSTRAINT fk_vcp_trade_item                                           FOREIGN KEY (trade_item_id)                    REFERENCES dbo.trade_item(item_id)
);
GO
CREATE INDEX ix_vcp_voyage ON dbo.voyage_cargo_parcel (voyage_id);
GO

-- =============================================================================
-- 8. BUNKER_STEM
-- =============================================================================
CREATE TABLE dbo.bunker_stem (
    bunker_stem_id           INT             NOT NULL IDENTITY(1,1),
    voyage_id                   INT             NULL,       -- nullable: bunkering can occur outside an active voyage leg
    vessel_id                      INT             NOT NULL,
    fuel_grade_id                     INT             NOT NULL,
    quantity_mt                          DECIMAL(14,3)   NOT NULL,
    price_per_mt                            DECIMAL(14,4)   NULL,
    currency_id                                INT             NULL,
    supplier_counterparty_id                      INT             NULL,
    port_location_id                                 INT             NULL,
    rob_before_mt                                       DECIMAL(14,3)   NULL,
    rob_after_mt                                           DECIMAL(14,3)   NULL,
    status                                                    VARCHAR(15)     NOT NULL DEFAULT 'NOMINATED'
        CONSTRAINT chk_bunker_stem_status CHECK (status IN ('NOMINATED','CONFIRMED','DELIVERED','DISPUTED')),
    stem_date                                                     DATE            NULL,
    notes                                                            VARCHAR(500)    NULL,
    is_active                                                          BIT             NOT NULL DEFAULT 1,
    created_at                                                           DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                                             VARCHAR(100)    NOT NULL,
    updated_at                                                               DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                                                 VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_bunker_stem                       PRIMARY KEY (bunker_stem_id),
    CONSTRAINT fk_bs_voyage                             FOREIGN KEY (voyage_id)                  REFERENCES dbo.voyage(voyage_id),
    CONSTRAINT fk_bs_vessel                                FOREIGN KEY (vessel_id)                  REFERENCES dbo.vessel(vessel_id),
    CONSTRAINT fk_bs_fuel_grade                               FOREIGN KEY (fuel_grade_id)              REFERENCES dbo.bunker_fuel_grade(fuel_grade_id),
    CONSTRAINT fk_bs_currency                                    FOREIGN KEY (currency_id)                REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_bs_supplier                                       FOREIGN KEY (supplier_counterparty_id)   REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT fk_bs_port                                              FOREIGN KEY (port_location_id)           REFERENCES dbo.location(location_id)
);
GO
CREATE INDEX ix_bunker_stem_vessel ON dbo.bunker_stem (vessel_id, stem_date);
GO

-- =============================================================================
-- 9. VESSEL_BUNKER_ROB_LEDGER -- event-sourced, insert-only
-- =============================================================================
CREATE TABLE dbo.vessel_bunker_rob_ledger (
    rob_ledger_id             INT             NOT NULL IDENTITY(1,1),
    vessel_id                    INT             NOT NULL,
    fuel_grade_id                   INT             NOT NULL,
    event_type                         VARCHAR(15)     NOT NULL
        CONSTRAINT chk_robl_event_type CHECK (event_type IN ('STEM','CONSUMPTION','TRANSFER')),
    event_time                              DATETIME2       NOT NULL,
    quantity_change_mt                          DECIMAL(14,3)   NOT NULL,   -- signed: +stem, -consumption/-transfer out
    rob_after_mt                                   DECIMAL(14,3)   NOT NULL,
    voyage_id                                         INT             NULL,
    voyage_leg                                           VARCHAR(10)     NULL
        CONSTRAINT chk_robl_leg CHECK (voyage_leg IS NULL OR voyage_leg IN ('LADEN','BALLAST')),
    engine_type                                             VARCHAR(15)     NULL
        CONSTRAINT chk_robl_engine CHECK (engine_type IS NULL OR engine_type IN ('MAIN','AUXILIARY','BOILER')),
    source_bunker_stem_id                                       INT             NULL,
    notes                                                           VARCHAR(500)    NULL,
    created_at                                                       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                                         VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_vessel_bunker_rob_ledger   PRIMARY KEY (rob_ledger_id),
    CONSTRAINT fk_robl_vessel                    FOREIGN KEY (vessel_id)             REFERENCES dbo.vessel(vessel_id),
    CONSTRAINT fk_robl_fuel_grade                    FOREIGN KEY (fuel_grade_id)         REFERENCES dbo.bunker_fuel_grade(fuel_grade_id),
    CONSTRAINT fk_robl_voyage                            FOREIGN KEY (voyage_id)             REFERENCES dbo.voyage(voyage_id),
    CONSTRAINT fk_robl_source_stem                           FOREIGN KEY (source_bunker_stem_id) REFERENCES dbo.bunker_stem(bunker_stem_id)
);
GO
CREATE INDEX ix_robl_vessel_fuel ON dbo.vessel_bunker_rob_ledger (vessel_id, fuel_grade_id, event_time);
GO

-- =============================================================================
-- 10. VOYAGE_SOF_EVENT
-- =============================================================================
CREATE TABLE dbo.voyage_sof_event (
    sof_event_id             INT             NOT NULL IDENTITY(1,1),
    voyage_id                   INT             NOT NULL,
    port_location_id               INT             NOT NULL,
    port_call_sequence                SMALLINT        NOT NULL DEFAULT 1,   -- a voyage can call multiple ports
    sof_event_type_id                    INT             NOT NULL,
    event_timestamp                         DATETIME2       NOT NULL,
    remarks                                    VARCHAR(500)    NULL,
    is_manual_entry                               BIT             NOT NULL DEFAULT 1,   -- vs EDI/terminal feed (no feed integration built yet)
    created_at                                       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                         VARCHAR(100)    NOT NULL,
    updated_at                                           DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                             VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_voyage_sof_event   PRIMARY KEY (sof_event_id),
    CONSTRAINT fk_vse_voyage             FOREIGN KEY (voyage_id)          REFERENCES dbo.voyage(voyage_id),
    CONSTRAINT fk_vse_port                   FOREIGN KEY (port_location_id)   REFERENCES dbo.location(location_id),
    CONSTRAINT fk_vse_event_type                 FOREIGN KEY (sof_event_type_id)  REFERENCES dbo.sof_event_type(sof_event_type_id)
);
GO
CREATE INDEX ix_vse_voyage ON dbo.voyage_sof_event (voyage_id, port_call_sequence, event_timestamp);
GO

-- =============================================================================
-- 11. LAYTIME_CALCULATION -- versioned, insert-only
-- =============================================================================
CREATE TABLE dbo.laytime_calculation (
    laytime_calculation_id     INT             NOT NULL IDENTITY(1,1),
    voyage_id                     INT             NOT NULL,
    port_location_id                 INT             NOT NULL,
    laytime_term_id                     INT             NULL,   -- copied from the charter at calc time -- a later charter-term edit must not retroactively change a settled calc
    allowed_laytime_hours                  DECIMAL(10,2)   NULL,
    used_laytime_hours                        DECIMAL(10,2)   NULL,
    demurrage_hours                              DECIMAL(10,2)   NULL,
    despatch_hours                                  DECIMAL(10,2)   NULL,
    demurrage_amount                                   DECIMAL(14,2)   NULL,
    despatch_amount                                       DECIMAL(14,2)   NULL,
    currency_id                                              INT             NULL,
    version_number                                              INT             NOT NULL DEFAULT 1,
    is_current_version                                             BIT             NOT NULL DEFAULT 1,
    superseded_by_version                                             INT             NULL,
    calculated_at                                                       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    notes                                                                  VARCHAR(1000)   NULL,
    created_at                                                               DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                                                 VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_laytime_calculation   PRIMARY KEY (laytime_calculation_id),
    CONSTRAINT fk_lc_voyage                 FOREIGN KEY (voyage_id)         REFERENCES dbo.voyage(voyage_id),
    CONSTRAINT fk_lc_port                       FOREIGN KEY (port_location_id)  REFERENCES dbo.location(location_id),
    CONSTRAINT fk_lc_laytime_term                   FOREIGN KEY (laytime_term_id)   REFERENCES dbo.laytime_term_template(laytime_term_id),
    CONSTRAINT fk_lc_currency                           FOREIGN KEY (currency_id)       REFERENCES dbo.currency(currency_id)
);
GO
CREATE INDEX ix_lc_voyage_port ON dbo.laytime_calculation (voyage_id, port_location_id, is_current_version);
GO

-- =============================================================================
-- 12. MASTER DATA TABLE REGISTRY -- register the 3 new lookups only
-- (Voyage/Charter Party/Cargo Parcel/Bunker Stem/ROB Ledger/SOF/Laytime are
-- dedicated entities with their own controllers -- not the generic Tier2
-- mechanism -- so they are NOT registered here, matching the vessel/
-- netting_agreement convention.)
-- =============================================================================
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES
    ('bunker_fuel_grade',    'Bunker Fuel Grades',     'Voyage & Charter Ops', 1, 1, 1, 0, 1, 'SYSTEM', 'SYSTEM'),
    ('sof_event_type',        'SOF Event Types',          'Voyage & Charter Ops', 1, 1, 1, 0, 2, 'SYSTEM', 'SYSTEM'),
    ('off_hire_reason_type',    'Off-Hire Reason Types',      'Voyage & Charter Ops', 1, 1, 1, 0, 3, 'SYSTEM', 'SYSTEM');
GO
