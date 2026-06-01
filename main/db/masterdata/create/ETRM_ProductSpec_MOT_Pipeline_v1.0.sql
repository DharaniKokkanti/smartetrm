-- =============================================================================
-- ETRM SYSTEM — PRODUCT SPECIFICATIONS, MOT & PIPELINE MASTER DATA
-- SQL Server 2022 | Version 1.0 | May 2026
-- =============================================================================
-- TABLES (29 total):
--
-- GROUP A — PRODUCT SPECIFICATIONS (5 tables)
--   01. spec_parameter
--   02. spec_parameter_uom
--   03. product_spec_template
--   04. product_spec_value
--   05. spec_override
--
-- GROUP B — MOT CORE (4 tables)
--   06. mot_type
--   07. transport_operator
--   08. transport_route
--   09. transport_document_type
--
-- GROUP C — VESSEL (2 tables)
--   10. vessel
--   11. vessel_certificate
--
-- GROUP D — LAND TRANSPORT (3 tables)
--   12. truck
--   13. railcar
--   14. container
--
-- GROUP E — STORAGE & TANKS (3 tables)
--   15. tank
--   16. tank_calibration
--   17. tank_status
--
-- GROUP F — INSPECTION (2 tables)
--   18. inspection_type
--   19. inspection
--
-- GROUP G — PIPELINE EXPANDED (6 tables)
--   20. pipeline          (DROP & RECREATE — replaces thin version)
--   21. pipeline_point
--   22. pipeline_segment
--   23. pipeline_cycle
--   24. pipeline_tariff
--   25. pipeline_operator_agreement
--
-- GROUP H — PRODUCT APPROVALS (4 tables)
--   26. pipeline_product_approval
--   27. pipeline_point_product
--   28. pipeline_segment_product
--   29. mot_asset_product_approval
--
-- =============================================================================
-- Run AFTER:
--   etrm_master_data_v2.0.sql
--   etrm_trader_patch_v2.1.sql
--   etrm_market_source_period_v1.0.sql
--   etrm_mpp_dates_patch_v1.1.sql
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- CLEANUP — reverse FK order
-- =============================================================================
IF OBJECT_ID('dbo.mot_asset_product_approval',    'U') IS NOT NULL DROP TABLE dbo.mot_asset_product_approval;
IF OBJECT_ID('dbo.pipeline_segment_product',      'U') IS NOT NULL DROP TABLE dbo.pipeline_segment_product;
IF OBJECT_ID('dbo.pipeline_point_product',        'U') IS NOT NULL DROP TABLE dbo.pipeline_point_product;
IF OBJECT_ID('dbo.pipeline_product_approval',     'U') IS NOT NULL DROP TABLE dbo.pipeline_product_approval;
IF OBJECT_ID('dbo.pipeline_operator_agreement',   'U') IS NOT NULL DROP TABLE dbo.pipeline_operator_agreement;
IF OBJECT_ID('dbo.pipeline_tariff',               'U') IS NOT NULL DROP TABLE dbo.pipeline_tariff;
IF OBJECT_ID('dbo.pipeline_cycle',                'U') IS NOT NULL DROP TABLE dbo.pipeline_cycle;
IF OBJECT_ID('dbo.pipeline_segment',              'U') IS NOT NULL DROP TABLE dbo.pipeline_segment;
IF OBJECT_ID('dbo.pipeline_point',                'U') IS NOT NULL DROP TABLE dbo.pipeline_point;
IF OBJECT_ID('dbo.pipeline',                      'U') IS NOT NULL DROP TABLE dbo.pipeline;
IF OBJECT_ID('dbo.inspection',                    'U') IS NOT NULL DROP TABLE dbo.inspection;
IF OBJECT_ID('dbo.inspection_type',               'U') IS NOT NULL DROP TABLE dbo.inspection_type;
IF OBJECT_ID('dbo.tank_status',                   'U') IS NOT NULL DROP TABLE dbo.tank_status;
IF OBJECT_ID('dbo.tank_calibration',              'U') IS NOT NULL DROP TABLE dbo.tank_calibration;
IF OBJECT_ID('dbo.tank',                          'U') IS NOT NULL DROP TABLE dbo.tank;
IF OBJECT_ID('dbo.container',                     'U') IS NOT NULL DROP TABLE dbo.container;
IF OBJECT_ID('dbo.railcar',                       'U') IS NOT NULL DROP TABLE dbo.railcar;
IF OBJECT_ID('dbo.truck',                         'U') IS NOT NULL DROP TABLE dbo.truck;
IF OBJECT_ID('dbo.vessel_certificate',            'U') IS NOT NULL DROP TABLE dbo.vessel_certificate;
IF OBJECT_ID('dbo.vessel',                        'U') IS NOT NULL DROP TABLE dbo.vessel;
IF OBJECT_ID('dbo.transport_document_type',       'U') IS NOT NULL DROP TABLE dbo.transport_document_type;
IF OBJECT_ID('dbo.transport_route',               'U') IS NOT NULL DROP TABLE dbo.transport_route;
IF OBJECT_ID('dbo.transport_operator',            'U') IS NOT NULL DROP TABLE dbo.transport_operator;
IF OBJECT_ID('dbo.mot_type',                      'U') IS NOT NULL DROP TABLE dbo.mot_type;
IF OBJECT_ID('dbo.spec_override',                 'U') IS NOT NULL DROP TABLE dbo.spec_override;
IF OBJECT_ID('dbo.product_spec_value',            'U') IS NOT NULL DROP TABLE dbo.product_spec_value;
IF OBJECT_ID('dbo.product_spec_template',         'U') IS NOT NULL DROP TABLE dbo.product_spec_template;
IF OBJECT_ID('dbo.spec_parameter_uom',            'U') IS NOT NULL DROP TABLE dbo.spec_parameter_uom;
IF OBJECT_ID('dbo.spec_parameter',                'U') IS NOT NULL DROP TABLE dbo.spec_parameter;
GO


-- =============================================================================
-- GROUP A — PRODUCT SPECIFICATIONS
-- =============================================================================

-- 01. SPEC_PARAMETER
-- Individual measurable quality parameters across all commodity types.
-- e.g. API_GRAVITY, SULPHUR_PCT, GCV, MOISTURE_PCT, PURITY_PCT
-- data_type controls how values are stored and validated.
-- =============================================================================
CREATE TABLE dbo.spec_parameter (
    parameter_id        INT             NOT NULL IDENTITY(1,1),
    commodity_type      VARCHAR(20)     NULL,       -- NULL = cross-commodity
    parameter_code      VARCHAR(30)     NOT NULL,   -- 'API_GRAVITY','SULPHUR_PCT','GCV'
    parameter_name      VARCHAR(200)    NOT NULL,
    parameter_category  VARCHAR(30)     NOT NULL
        CONSTRAINT chk_sp_category CHECK (parameter_category IN (
            'PHYSICAL',     -- density, viscosity, pour point
            'CHEMICAL',     -- sulphur, nitrogen, metals content
            'ENERGY',       -- GCV, Wobbe index, calorific value
            'QUALITY',      -- grade, purity, moisture
            'SAFETY',       -- flash point, H2S, RVP
            'REGULATORY',   -- GMO status, LME brand, REGO source
            'OTHER'
        )),
    data_type           VARCHAR(20)     NOT NULL DEFAULT 'DECIMAL'
        CONSTRAINT chk_sp_data_type CHECK (data_type IN (
            'DECIMAL',      -- numeric value (API, sulphur %)
            'INTEGER',      -- whole number (grade number)
            'BOOLEAN',      -- yes/no (GMO, LME approved)
            'TEXT',         -- free text (brand name, source type)
            'ENUM'          -- from fixed list (stored in notes)
        )),
    default_uom_id      INT             NULL,       -- FK to unit_of_measure
    decimal_places      TINYINT         NOT NULL DEFAULT 2,
    description         VARCHAR(500)    NULL,
    is_active           BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_spec_parameter        PRIMARY KEY (parameter_id),
    CONSTRAINT uq_spec_parameter_code   UNIQUE      (parameter_code),
    CONSTRAINT fk_sp_uom                FOREIGN KEY (default_uom_id)
                                        REFERENCES  dbo.unit_of_measure(uom_id)
);
GO
CREATE INDEX ix_sp_commodity ON dbo.spec_parameter (commodity_type, parameter_category, is_active);
GO


-- 02. SPEC_PARAMETER_UOM
-- Valid units of measure for each parameter.
-- Some parameters are valid in multiple UOMs
-- e.g. viscosity: cSt at 40°C OR cSt at 50°C OR Redwood seconds.
-- =============================================================================
CREATE TABLE dbo.spec_parameter_uom (
    spu_id              INT             NOT NULL IDENTITY(1,1),
    parameter_id        INT             NOT NULL,
    uom_id              INT             NOT NULL,
    is_default          BIT             NOT NULL DEFAULT 0,
    conversion_to_default DECIMAL(20,10) NULL,      -- factor to convert to default UOM

    CONSTRAINT pk_spu               PRIMARY KEY (spu_id),
    CONSTRAINT uq_spu               UNIQUE      (parameter_id, uom_id),
    CONSTRAINT fk_spu_parameter     FOREIGN KEY (parameter_id) REFERENCES dbo.spec_parameter(parameter_id),
    CONSTRAINT fk_spu_uom           FOREIGN KEY (uom_id)       REFERENCES dbo.unit_of_measure(uom_id)
);
GO


-- 03. PRODUCT_SPEC_TEMPLATE
-- Named specification for a product.
-- A product can have multiple templates:
--   e.g. Forties crude has 'FORTIES_STANDARD' and 'FORTIES_BLEND' specs.
-- is_default = 1 means this is the market standard spec used for MTM/pricing.
-- =============================================================================
CREATE TABLE dbo.product_spec_template (
    template_id         INT             NOT NULL IDENTITY(1,1),
    product_id          INT             NOT NULL,
    template_code       VARCHAR(30)     NOT NULL,
    template_name       VARCHAR(200)    NOT NULL,
    commodity_type      VARCHAR(20)     NOT NULL,
    is_default          BIT             NOT NULL DEFAULT 0,
    issuing_body        VARCHAR(200)    NULL,    -- 'IP','ASTM','ISO','EFET','ICE'
    standard_ref        VARCHAR(100)    NULL,    -- standard reference e.g. 'ASTM D86'
    version             VARCHAR(20)     NULL,
    effective_from      DATE            NULL,
    effective_to        DATE            NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_pst               PRIMARY KEY (template_id),
    CONSTRAINT uq_pst_code          UNIQUE      (product_id, template_code),
    CONSTRAINT fk_pst_product       FOREIGN KEY (product_id) REFERENCES dbo.product(product_id)
);
GO
CREATE INDEX ix_pst_product ON dbo.product_spec_template (product_id, is_default, is_active);
GO


-- 04. PRODUCT_SPEC_VALUE
-- The actual min/max/typical values for each parameter within a spec template.
-- Option A design: separate min/max/typical/exact columns — simple and queryable.
-- All bounds are inclusive unless noted in notes field.
-- =============================================================================
CREATE TABLE dbo.product_spec_value (
    spec_value_id       INT             NOT NULL IDENTITY(1,1),
    template_id         INT             NOT NULL,
    parameter_id        INT             NOT NULL,
    uom_id              INT             NULL,        -- NULL = use parameter default UOM
    -- Bounds — all optional, set what applies per parameter
    value_min           DECIMAL(18,6)   NULL,        -- minimum acceptable value
    value_max           DECIMAL(18,6)   NULL,        -- maximum acceptable value
    value_typical       DECIMAL(18,6)   NULL,        -- typical/reference value
    value_exact         DECIMAL(18,6)   NULL,        -- exact required value (rare)
    value_text          VARCHAR(200)    NULL,        -- for TEXT/ENUM/BOOLEAN parameters
    -- Direction constraint
    bound_direction     VARCHAR(20)     NOT NULL DEFAULT 'RANGE'
        CONSTRAINT chk_psv_direction CHECK (bound_direction IN (
            'RANGE',        -- between min and max
            'MIN_ONLY',     -- must be >= min (no upper bound)
            'MAX_ONLY',     -- must be <= max (no lower bound)
            'EXACT',        -- must equal exact value
            'REPORT_ONLY',  -- measured and reported but not a pass/fail criterion
            'NOT_EXCEED'    -- must not exceed max (same as MAX_ONLY but explicit)
        )),
    is_mandatory        BIT             NOT NULL DEFAULT 1,  -- if 0 = optional test
    test_method         VARCHAR(100)    NULL,        -- e.g. 'ASTM D4052','IP 160'
    notes               VARCHAR(300)    NULL,

    CONSTRAINT pk_psv               PRIMARY KEY (spec_value_id),
    CONSTRAINT uq_psv               UNIQUE      (template_id, parameter_id),
    CONSTRAINT fk_psv_template      FOREIGN KEY (template_id)  REFERENCES dbo.product_spec_template(template_id),
    CONSTRAINT fk_psv_parameter     FOREIGN KEY (parameter_id) REFERENCES dbo.spec_parameter(parameter_id),
    CONSTRAINT fk_psv_uom           FOREIGN KEY (uom_id)       REFERENCES dbo.unit_of_measure(uom_id),
    CONSTRAINT chk_psv_range        CHECK       (value_min IS NULL OR value_max IS NULL
                                                OR value_max >= value_min)
);
GO
CREATE INDEX ix_psv_template ON dbo.product_spec_value (template_id, parameter_id);
GO


-- 05. SPEC_OVERRIDE
-- Tighter or different spec requirements imposed by a specific
-- pipeline, vessel, storage facility, or delivery point.
-- Polymorphic: entity_type identifies what is imposing the override.
-- Only parameters that DIFFER from the product standard spec are stored here.
-- =============================================================================
CREATE TABLE dbo.spec_override (
    override_id         INT             NOT NULL IDENTITY(1,1),
    -- What is imposing the tighter spec
    entity_type         VARCHAR(30)     NOT NULL
        CONSTRAINT chk_so_entity_type CHECK (entity_type IN (
            'PIPELINE',
            'PIPELINE_POINT',
            'PIPELINE_SEGMENT',
            'VESSEL',
            'TANK',
            'STORAGE_FACILITY',
            'LOCATION',
            'MARKET'
        )),
    entity_id           INT             NOT NULL,
    -- Which product and parameter is being overridden
    product_id          INT             NOT NULL,
    parameter_id        INT             NOT NULL,
    uom_id              INT             NULL,
    -- Override values (same structure as product_spec_value)
    value_min           DECIMAL(18,6)   NULL,
    value_max           DECIMAL(18,6)   NULL,
    value_exact         DECIMAL(18,6)   NULL,
    value_text          VARCHAR(200)    NULL,
    bound_direction     VARCHAR(20)     NOT NULL DEFAULT 'RANGE'
        CONSTRAINT chk_so_direction CHECK (bound_direction IN (
            'RANGE','MIN_ONLY','MAX_ONLY','EXACT','NOT_EXCEED','REPORT_ONLY'
        )),
    -- Why and when
    override_reason     VARCHAR(300)    NULL,
    regulatory_ref      VARCHAR(100)    NULL,
    effective_from      DATE            NOT NULL,
    effective_to        DATE            NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_spec_override     PRIMARY KEY (override_id),
    CONSTRAINT uq_spec_override     UNIQUE      (entity_type, entity_id, product_id,
                                                 parameter_id, effective_from),
    CONSTRAINT fk_so_product        FOREIGN KEY (product_id)   REFERENCES dbo.product(product_id),
    CONSTRAINT fk_so_parameter      FOREIGN KEY (parameter_id) REFERENCES dbo.spec_parameter(parameter_id),
    CONSTRAINT fk_so_uom            FOREIGN KEY (uom_id)       REFERENCES dbo.unit_of_measure(uom_id)
);
GO
CREATE INDEX ix_so_entity   ON dbo.spec_override (entity_type, entity_id, is_active);
CREATE INDEX ix_so_product  ON dbo.spec_override (product_id,  parameter_id, is_active);
GO


-- =============================================================================
-- GROUP B — MOT CORE
-- =============================================================================

-- 06. MOT_TYPE
-- Reference table for all modes of transport.
-- =============================================================================
CREATE TABLE dbo.mot_type (
    mot_type_id         INT             NOT NULL IDENTITY(1,1),
    mot_code            VARCHAR(30)     NOT NULL,
    mot_name            VARCHAR(100)    NOT NULL,
    transport_medium    VARCHAR(20)     NOT NULL
        CONSTRAINT chk_mot_medium CHECK (transport_medium IN (
            'SEA',          -- vessel, barge
            'LAND',         -- truck, railcar, container
            'PIPELINE',     -- pipeline
            'AIR',          -- air freight (metals, speciality)
            'VIRTUAL'       -- book transfer, title transfer only
        )),
    requires_physical_asset BIT         NOT NULL DEFAULT 1,
    -- FALSE for PIPELINE (tracked at pipeline level) and VIRTUAL
    requires_routing    BIT             NOT NULL DEFAULT 1,
    -- FALSE for VIRTUAL transfers
    typical_commodities VARCHAR(200)    NULL,   -- informational CSV
    description         VARCHAR(300)    NULL,
    is_active           BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_mot_type          PRIMARY KEY (mot_type_id),
    CONSTRAINT uq_mot_code          UNIQUE      (mot_code)
);
GO


-- 07. TRANSPORT_OPERATOR
-- Company operating a transport asset — shipping line, haulier, rail operator.
-- Linked to counterparty if they are also a trading counterparty.
-- =============================================================================
CREATE TABLE dbo.transport_operator (
    operator_id         INT             NOT NULL IDENTITY(1,1),
    operator_code       VARCHAR(20)     NOT NULL,
    operator_name       VARCHAR(200)    NOT NULL,
    operator_type       VARCHAR(20)     NOT NULL
        CONSTRAINT chk_to_type CHECK (operator_type IN (
            'SHIPPING_LINE', -- vessel operator
            'SHIP_MANAGER',  -- technical manager of vessels
            'HAULIER',       -- road transport
            'RAIL_OPERATOR', -- rail/freight operator
            'PIPELINE_TSO',  -- transmission system operator
            'TERMINAL_OP',   -- terminal/storage operator
            'MULTI_MODAL',   -- operates multiple transport types
            'OTHER'
        )),
    mot_type_id         INT             NULL,   -- primary MOT type
    country_code        CHAR(2)         NULL,
    counterparty_id     INT             NULL,   -- FK if also a trading counterparty
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_transport_operator    PRIMARY KEY (operator_id),
    CONSTRAINT uq_operator_code         UNIQUE      (operator_code),
    CONSTRAINT fk_to_mot_type           FOREIGN KEY (mot_type_id)     REFERENCES dbo.mot_type(mot_type_id),
    CONSTRAINT fk_to_counterparty       FOREIGN KEY (counterparty_id) REFERENCES dbo.counterparty(counterparty_id)
);
GO


-- 08. TRANSPORT_ROUTE
-- Generic origin → destination route for any MOT type.
-- Reusable across multiple cargoes/trades.
-- =============================================================================
CREATE TABLE dbo.transport_route (
    route_id            INT             NOT NULL IDENTITY(1,1),
    mot_type_id         INT             NOT NULL,
    route_code          VARCHAR(30)     NOT NULL,
    route_name          VARCHAR(200)    NOT NULL,
    origin_location_id  INT             NOT NULL,
    dest_location_id    INT             NOT NULL,
    -- Via points (optional intermediate stops)
    via_location_ids    VARCHAR(500)    NULL,   -- CSV of location_ids
    -- Distance and time estimates
    distance_km         DECIMAL(10,2)   NULL,
    transit_days_min    SMALLINT        NULL,
    transit_days_max    SMALLINT        NULL,
    -- Constraints
    commodity_type      VARCHAR(20)     NULL,   -- NULL = all commodities
    max_vessel_size     VARCHAR(50)     NULL,   -- e.g. 'SUEZMAX' — vessel routes
    seasonal_restriction VARCHAR(200)   NULL,   -- e.g. 'Winter: ice class required'
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_transport_route   PRIMARY KEY (route_id),
    CONSTRAINT uq_route_code        UNIQUE      (route_code),
    CONSTRAINT fk_tr_mot_type       FOREIGN KEY (mot_type_id)         REFERENCES dbo.mot_type(mot_type_id),
    CONSTRAINT fk_tr_origin         FOREIGN KEY (origin_location_id)  REFERENCES dbo.location(location_id),
    CONSTRAINT fk_tr_dest           FOREIGN KEY (dest_location_id)    REFERENCES dbo.location(location_id),
    CONSTRAINT chk_tr_no_self       CHECK       (origin_location_id <> dest_location_id)
);
GO
CREATE INDEX ix_tr_route ON dbo.transport_route (origin_location_id, dest_location_id, mot_type_id);
GO


-- 09. TRANSPORT_DOCUMENT_TYPE
-- Reference table for transport document types per MOT.
-- =============================================================================
CREATE TABLE dbo.transport_document_type (
    doc_type_id         INT             NOT NULL IDENTITY(1,1),
    mot_type_id         INT             NULL,       -- NULL = applies to all MOT types
    doc_type_code       VARCHAR(30)     NOT NULL,
    doc_type_name       VARCHAR(200)    NOT NULL,
    is_mandatory        BIT             NOT NULL DEFAULT 0,
    description         VARCHAR(300)    NULL,
    is_active           BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_tdt               PRIMARY KEY (doc_type_id),
    CONSTRAINT uq_tdt_code          UNIQUE      (doc_type_code),
    CONSTRAINT fk_tdt_mot           FOREIGN KEY (mot_type_id) REFERENCES dbo.mot_type(mot_type_id)
);
GO


-- =============================================================================
-- GROUP C — VESSEL
-- =============================================================================

-- 10. VESSEL
-- Full vessel master. IMO number is the global unique identifier.
-- =============================================================================
CREATE TABLE dbo.vessel (
    vessel_id           INT             NOT NULL IDENTITY(1,1),
    imo_number          VARCHAR(10)     NOT NULL,   -- IMO: 'IMO' + 7 digits
    vessel_name         VARCHAR(200)    NOT NULL,
    vessel_type         VARCHAR(30)     NOT NULL
        CONSTRAINT chk_ves_type CHECK (vessel_type IN (
            'VLCC',             -- Very Large Crude Carrier (200-320k DWT)
            'SUEZMAX',          -- Suezmax (120-200k DWT)
            'AFRAMAX',          -- Aframax (80-120k DWT)
            'PANAMAX',          -- Panamax tanker
            'HANDYSIZE',        -- Handysize tanker
            'MR_TANKER',        -- Medium Range product tanker
            'LR1_TANKER',       -- Long Range 1 product tanker
            'LR2_TANKER',       -- Long Range 2 product tanker
            'LNG_CARRIER',      -- LNG carrier
            'LPG_CARRIER',      -- LPG carrier
            'CHEMICAL_TANKER',  -- Chemical/specialty tanker
            'BULK_CARRIER',     -- Dry bulk (agri, metals)
            'BARGE',            -- River/coastal barge
            'OTHER'
        )),
    flag_country        CHAR(2)         NOT NULL,   -- ISO flag state
    call_sign           VARCHAR(10)     NULL,
    mmsi                VARCHAR(9)      NULL,       -- Maritime Mobile Service Identity (AIS)
    -- Ownership
    owner_operator_id   INT             NULL,       -- FK transport_operator (owner)
    manager_operator_id INT             NULL,       -- FK transport_operator (technical mgr)
    charterer_cp_id     INT             NULL,       -- FK counterparty if on charter
    -- Physical specifications
    dwt                 DECIMAL(12,2)   NULL,       -- Deadweight tonnage
    gross_tonnage       DECIMAL(12,2)   NULL,
    net_tonnage         DECIMAL(12,2)   NULL,
    cargo_capacity_cbm  DECIMAL(12,2)   NULL,       -- Cubic metres
    cargo_capacity_mt   DECIMAL(12,2)   NULL,       -- Metric tonnes (typical cargo)
    num_cargo_tanks     SMALLINT        NULL,
    num_segregations    SMALLINT        NULL,       -- independent cargo segregations
    -- Dimensions
    length_overall_m    DECIMAL(8,2)    NULL,
    beam_m              DECIMAL(8,2)    NULL,
    draft_max_m         DECIMAL(6,2)    NULL,
    -- Ice class (Arctic/winter routing)
    ice_class           VARCHAR(20)     NULL,       -- 'IA_SUPER','IA','IB','IC',NULL
    -- Build details
    build_year          SMALLINT        NULL,
    build_country       CHAR(2)         NULL,
    shipyard            VARCHAR(200)    NULL,
    -- Classification
    classification_society VARCHAR(50)  NULL,       -- 'LR','DNV','BV','ABS','ClassNK'
    class_notation      VARCHAR(100)    NULL,
    -- Vetting status
    vetting_status      VARCHAR(20)     NOT NULL DEFAULT 'PENDING'
        CONSTRAINT chk_ves_vetting CHECK (vetting_status IN (
            'APPROVED',     -- approved for use
            'PENDING',      -- awaiting vetting
            'CONDITIONAL',  -- approved with conditions
            'REJECTED',     -- rejected — do not use
            'EXPIRED'       -- vetting expired
        )),
    vetting_expiry      DATE            NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(1000)   NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_vessel            PRIMARY KEY (vessel_id),
    CONSTRAINT uq_vessel_imo        UNIQUE      (imo_number),
    CONSTRAINT uq_vessel_mmsi       UNIQUE      (mmsi),
    CONSTRAINT fk_ves_owner         FOREIGN KEY (owner_operator_id)   REFERENCES dbo.transport_operator(operator_id),
    CONSTRAINT fk_ves_manager       FOREIGN KEY (manager_operator_id) REFERENCES dbo.transport_operator(operator_id),
    CONSTRAINT fk_ves_charterer     FOREIGN KEY (charterer_cp_id)     REFERENCES dbo.counterparty(counterparty_id)
) WITH (DATA_COMPRESSION = ROW);
GO
CREATE INDEX ix_vessel_type     ON dbo.vessel (vessel_type, vetting_status, is_active);
CREATE INDEX ix_vessel_vetting  ON dbo.vessel (vetting_expiry, vetting_status)
    WHERE vetting_expiry IS NOT NULL;
GO


-- 11. VESSEL_CERTIFICATE
-- Regulatory and industry certificates per vessel.
-- Tracks expiry for compliance alerts.
-- =============================================================================
CREATE TABLE dbo.vessel_certificate (
    cert_id             INT             NOT NULL IDENTITY(1,1),
    vessel_id           INT             NOT NULL,
    cert_type           VARCHAR(30)     NOT NULL
        CONSTRAINT chk_vc_type CHECK (cert_type IN (
            'SIRE',             -- Ship Inspection Report Programme (OCIMF)
            'CDI',              -- Chemical Distribution Institute
            'PI_INSURANCE',     -- P&I Club insurance
            'HULL_INSURANCE',   -- Hull and machinery insurance
            'CLASS_CERT',       -- Classification society certificate
            'ISM',              -- International Safety Management
            'ISPS',             -- Ship security certificate
            'MARPOL',           -- MARPOL compliance
            'USCG',             -- US Coast Guard approval
            'RIGHTSHIP',        -- RightShip vetting
            'ITOPF',            -- Oil spill response capability
            'OTHER'
        )),
    cert_number         VARCHAR(100)    NULL,
    issuing_body        VARCHAR(200)    NULL,
    issue_date          DATE            NULL,
    expiry_date         DATE            NULL,
    is_current          BIT             NOT NULL DEFAULT 1,
    document_store_id   INT             NULL,   -- FK to document_store
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_vessel_cert       PRIMARY KEY (cert_id),
    CONSTRAINT fk_vc_vessel         FOREIGN KEY (vessel_id)        REFERENCES dbo.vessel(vessel_id),
    CONSTRAINT fk_vc_doc            FOREIGN KEY (document_store_id) REFERENCES dbo.document_store(document_id)
);
GO
CREATE INDEX ix_vc_vessel  ON dbo.vessel_certificate (vessel_id, cert_type, is_current);
CREATE INDEX ix_vc_expiry  ON dbo.vessel_certificate (expiry_date, cert_type, is_current)
    WHERE expiry_date IS NOT NULL;
GO


-- =============================================================================
-- GROUP D — LAND TRANSPORT
-- =============================================================================

-- 12. TRUCK
-- Road tanker / truck master.
-- ADR = European hazardous materials road transport regulation.
-- =============================================================================
CREATE TABLE dbo.truck (
    truck_id            INT             NOT NULL IDENTITY(1,1),
    registration_no     VARCHAR(30)     NOT NULL,
    fleet_no            VARCHAR(20)     NULL,       -- internal fleet number
    operator_id         INT             NOT NULL,
    truck_type          VARCHAR(30)     NOT NULL
        CONSTRAINT chk_truck_type CHECK (truck_type IN (
            'ROAD_TANKER',      -- liquid bulk tanker
            'DRY_BULK',         -- grain/minerals
            'FLATBED',          -- metals/general
            'CONTAINER_TRUCK',  -- pulls ISO containers
            'REFRIGERATED',     -- temp-controlled
            'OTHER'
        )),
    capacity_litres     DECIMAL(12,2)   NULL,
    capacity_mt         DECIMAL(10,3)   NULL,
    num_compartments    TINYINT         NULL,
    country_code        CHAR(2)         NOT NULL,
    -- ADR / hazmat certification
    adr_certified       BIT             NOT NULL DEFAULT 0,
    adr_classes         VARCHAR(100)    NULL,   -- approved hazmat classes e.g. '3,6.1'
    adr_expiry          DATE            NULL,
    -- Inspection
    last_inspection_date DATE           NULL,
    next_inspection_date DATE           NULL,
    -- Status
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(300)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_truck             PRIMARY KEY (truck_id),
    CONSTRAINT uq_truck_reg         UNIQUE      (registration_no),
    CONSTRAINT fk_truck_operator    FOREIGN KEY (operator_id) REFERENCES dbo.transport_operator(operator_id)
);
GO


-- 13. RAILCAR
-- Tank car / railcar master.
-- DOT = US Department of Transport classification.
-- =============================================================================
CREATE TABLE dbo.railcar (
    railcar_id          INT             NOT NULL IDENTITY(1,1),
    car_number          VARCHAR(30)     NOT NULL,   -- reporting mark + number e.g. 'TILX 123456'
    car_type            VARCHAR(30)     NOT NULL
        CONSTRAINT chk_rc_type CHECK (car_type IN (
            'TANK_CAR',         -- liquid commodities
            'HOPPER_CAR',       -- grain, dry bulk
            'COVERED_HOPPER',   -- grain, cement
            'FLATCAR',          -- metals, machinery
            'BOXCAR',           -- general cargo
            'OTHER'
        )),
    operator_id         INT             NOT NULL,
    capacity_litres     DECIMAL(12,2)   NULL,
    capacity_mt         DECIMAL(10,3)   NULL,
    -- DOT / AAR classification
    dot_class           VARCHAR(20)     NULL,   -- e.g. 'DOT-111','DOT-117','TC-117'
    aar_class           VARCHAR(20)     NULL,
    approved_commodities VARCHAR(500)   NULL,   -- CSV of commodity codes
    -- Certification
    last_test_date      DATE            NULL,
    next_test_date      DATE            NULL,
    cert_expiry         DATE            NULL,
    -- Routing
    home_railroad       VARCHAR(100)    NULL,
    country_code        CHAR(2)         NOT NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(300)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_railcar           PRIMARY KEY (railcar_id),
    CONSTRAINT uq_railcar_number    UNIQUE      (car_number),
    CONSTRAINT fk_rc_operator       FOREIGN KEY (operator_id) REFERENCES dbo.transport_operator(operator_id)
);
GO


-- 14. CONTAINER
-- ISO tank container and flexibag master.
-- =============================================================================
CREATE TABLE dbo.container (
    container_id        INT             NOT NULL IDENTITY(1,1),
    container_number    VARCHAR(20)     NOT NULL,   -- ISO 6346 e.g. 'TTNU1234567'
    container_type      VARCHAR(20)     NOT NULL
        CONSTRAINT chk_cont_type CHECK (container_type IN (
            'ISO_TANK',         -- pressurised/non-pressurised tank container
            'FLEXIBAG',         -- flexibag inside standard container
            'DRY_BULK',         -- dry bulk container
            'REEFER',           -- refrigerated container
            'STANDARD',         -- general purpose
            'OTHER'
        )),
    operator_id         INT             NOT NULL,
    capacity_litres     DECIMAL(12,2)   NULL,
    capacity_mt         DECIMAL(10,3)   NULL,
    tare_weight_kg      DECIMAL(10,2)   NULL,
    max_gross_weight_kg DECIMAL(10,2)   NULL,
    -- UN approval (for hazmat)
    un_approval         VARCHAR(50)     NULL,   -- UN portable tank instruction e.g. 'T11'
    approved_commodities VARCHAR(500)   NULL,
    -- Certification
    csc_plate_expiry    DATE            NULL,   -- Container Safety Convention plate
    last_inspection_date DATE           NULL,
    next_inspection_date DATE           NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(300)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_container         PRIMARY KEY (container_id),
    CONSTRAINT uq_container_number  UNIQUE      (container_number),
    CONSTRAINT fk_cont_operator     FOREIGN KEY (operator_id) REFERENCES dbo.transport_operator(operator_id)
);
GO


-- =============================================================================
-- GROUP E — STORAGE & TANKS
-- =============================================================================

-- 15. TANK
-- Individual storage tank within a storage facility.
-- =============================================================================
CREATE TABLE dbo.tank (
    tank_id             INT             NOT NULL IDENTITY(1,1),
    facility_id         INT             NOT NULL,
    tank_number         VARCHAR(30)     NOT NULL,
    tank_name           VARCHAR(200)    NULL,
    tank_type           VARCHAR(30)     NOT NULL
        CONSTRAINT chk_tank_type CHECK (tank_type IN (
            'FIXED_ROOF',       -- standard crude/fuel oil
            'FLOATING_ROOF',    -- volatile products (crude, gasoline)
            'INTERNAL_FLOAT',   -- fixed roof + floating pan
            'PRESSURE_SPHERE',  -- LPG, butane
            'CRYOGENIC',        -- LNG, ethylene
            'UNDERGROUND',      -- strategic reserves
            'OPEN_TOP',         -- non-volatile bulk
            'SILO',             -- dry bulk (grain, cement)
            'OTHER'
        )),
    commodity_type      VARCHAR(20)     NOT NULL,
    -- Approved products for this tank
    primary_product_id  INT             NULL,   -- main product stored
    -- Capacity
    nominal_capacity_m3 DECIMAL(12,3)   NULL,   -- nominal/nameplate capacity
    working_capacity_m3 DECIMAL(12,3)   NULL,   -- usable working capacity
    heel_volume_m3      DECIMAL(10,3)   NULL,   -- minimum/unavoidable heel
    -- Physical
    diameter_m          DECIMAL(8,2)    NULL,
    height_m            DECIMAL(8,2)    NULL,
    -- Heating (heavy crude, fuel oil)
    is_heated           BIT             NOT NULL DEFAULT 0,
    max_temp_celsius    DECIMAL(5,1)    NULL,
    -- Metering
    has_metering        BIT             NOT NULL DEFAULT 1,
    meter_ref           VARCHAR(50)     NULL,
    -- Status
    tank_status         VARCHAR(20)     NOT NULL DEFAULT 'IN_SERVICE'
        CONSTRAINT chk_tank_status CHECK (tank_status IN (
            'IN_SERVICE',
            'MAINTENANCE',
            'CLEANING',
            'INSPECTION',
            'MOTHBALLED',
            'DECOMMISSIONED'
        )),
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_tank              PRIMARY KEY (tank_id),
    CONSTRAINT uq_tank_number       UNIQUE      (facility_id, tank_number),
    CONSTRAINT fk_tank_facility     FOREIGN KEY (facility_id)       REFERENCES dbo.storage_facility(facility_id),
    CONSTRAINT fk_tank_product      FOREIGN KEY (primary_product_id) REFERENCES dbo.product(product_id)
) WITH (DATA_COMPRESSION = ROW);
GO
CREATE INDEX ix_tank_facility   ON dbo.tank (facility_id, tank_status, is_active);
CREATE INDEX ix_tank_commodity  ON dbo.tank (commodity_type, tank_status, is_active);
GO


-- 16. TANK_CALIBRATION
-- Strapping table for each tank — volume at each measured height (ullage/innage).
-- Used by operations to convert gauge readings to volume.
-- One row per measurement point per tank.
-- =============================================================================
CREATE TABLE dbo.tank_calibration (
    calibration_id      INT             NOT NULL IDENTITY(1,1),
    tank_id             INT             NOT NULL,
    version             VARCHAR(20)     NOT NULL DEFAULT '1.0',
    effective_from      DATE            NOT NULL,
    effective_to        DATE            NULL,
    -- Measurement point
    height_mm           DECIMAL(10,2)   NOT NULL,   -- height from tank bottom in mm
    volume_m3           DECIMAL(14,6)   NOT NULL,   -- corresponding volume in m3
    measurement_type    VARCHAR(10)     NOT NULL DEFAULT 'INNAGE'
        CONSTRAINT chk_tc_mtype CHECK (measurement_type IN (
            'INNAGE',   -- measured from bottom (depth of liquid)
            'ULLAGE'    -- measured from top (space above liquid)
        )),
    is_active           BIT             NOT NULL DEFAULT 1,
    calibrated_by       VARCHAR(200)    NULL,   -- surveyor/company name
    calibration_date    DATE            NULL,
    cert_ref            VARCHAR(100)    NULL,   -- calibration certificate reference

    CONSTRAINT pk_tank_calibration  PRIMARY KEY (calibration_id),
    CONSTRAINT uq_tc_height         UNIQUE      (tank_id, version, height_mm, measurement_type),
    CONSTRAINT fk_tc_tank           FOREIGN KEY (tank_id) REFERENCES dbo.tank(tank_id)
);
GO
CREATE INDEX ix_tc_tank_height ON dbo.tank_calibration (tank_id, height_mm, is_active)
    INCLUDE (volume_m3, measurement_type);
GO


-- 17. TANK_STATUS
-- Historical log of tank operational status changes.
-- =============================================================================
CREATE TABLE dbo.tank_status (
    status_id           INT             NOT NULL IDENTITY(1,1),
    tank_id             INT             NOT NULL,
    status              VARCHAR(20)     NOT NULL
        CONSTRAINT chk_ts_status CHECK (status IN (
            'IN_SERVICE','MAINTENANCE','CLEANING',
            'INSPECTION','MOTHBALLED','DECOMMISSIONED'
        )),
    status_from         DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    status_to           DATETIME2       NULL,
    reason              VARCHAR(300)    NULL,
    work_order_ref      VARCHAR(100)    NULL,
    changed_by          VARCHAR(100)    NOT NULL,
    notes               VARCHAR(500)    NULL,

    CONSTRAINT pk_tank_status       PRIMARY KEY (status_id),
    CONSTRAINT fk_ts_tank           FOREIGN KEY (tank_id) REFERENCES dbo.tank(tank_id)
);
GO
CREATE INDEX ix_ts_tank ON dbo.tank_status (tank_id, status_from DESC);
GO


-- =============================================================================
-- GROUP F — INSPECTION
-- =============================================================================

-- 18. INSPECTION_TYPE
-- Reference table for all inspection types across all asset types.
-- =============================================================================
CREATE TABLE dbo.inspection_type (
    inspection_type_id  INT             NOT NULL IDENTITY(1,1),
    type_code           VARCHAR(30)     NOT NULL,
    type_name           VARCHAR(200)    NOT NULL,
    applicable_to       VARCHAR(200)    NULL,   -- CSV: 'VESSEL,TANK,TRUCK'
    issuing_body        VARCHAR(200)    NULL,
    validity_months     SMALLINT        NULL,   -- standard validity period
    is_mandatory        BIT             NOT NULL DEFAULT 0,
    description         VARCHAR(300)    NULL,
    is_active           BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_inspection_type   PRIMARY KEY (inspection_type_id),
    CONSTRAINT uq_insp_type_code    UNIQUE      (type_code)
);
GO


-- 19. INSPECTION
-- Polymorphic inspection record — covers all asset types.
-- entity_type identifies what was inspected.
-- =============================================================================
CREATE TABLE dbo.inspection (
    inspection_id       INT             NOT NULL IDENTITY(1,1),
    inspection_type_id  INT             NOT NULL,
    entity_type         VARCHAR(30)     NOT NULL
        CONSTRAINT chk_insp_entity CHECK (entity_type IN (
            'VESSEL','TRUCK','RAILCAR','CONTAINER','TANK','STORAGE_FACILITY','PIPELINE'
        )),
    entity_id           INT             NOT NULL,
    inspection_date     DATE            NOT NULL,
    expiry_date         DATE            NULL,
    result              VARCHAR(20)     NOT NULL DEFAULT 'PASSED'
        CONSTRAINT chk_insp_result CHECK (result IN (
            'PASSED','PASSED_WITH_CONDITIONS','FAILED','PENDING','WAIVED'
        )),
    inspector_name      VARCHAR(200)    NULL,
    inspector_company   VARCHAR(200)    NULL,
    cert_number         VARCHAR(100)    NULL,
    document_store_id   INT             NULL,
    observations        VARCHAR(1000)   NULL,
    conditions          VARCHAR(1000)   NULL,   -- if PASSED_WITH_CONDITIONS
    next_inspection_date DATE           NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_inspection        PRIMARY KEY (inspection_id),
    CONSTRAINT fk_insp_type         FOREIGN KEY (inspection_type_id) REFERENCES dbo.inspection_type(inspection_type_id),
    CONSTRAINT fk_insp_doc          FOREIGN KEY (document_store_id)  REFERENCES dbo.document_store(document_id)
);
GO
CREATE INDEX ix_insp_entity  ON dbo.inspection (entity_type, entity_id, inspection_date DESC);
CREATE INDEX ix_insp_expiry  ON dbo.inspection (expiry_date, entity_type, result)
    WHERE expiry_date IS NOT NULL;
GO


-- =============================================================================
-- GROUP G — PIPELINE EXPANDED
-- Replaces thin pipeline table from master data v2.0
-- =============================================================================

-- 20. PIPELINE (full version)
-- =============================================================================
CREATE TABLE dbo.pipeline (
    pipeline_id             INT             NOT NULL IDENTITY(1,1),
    pipeline_code           VARCHAR(30)     NOT NULL,
    pipeline_name           VARCHAR(200)    NOT NULL,
    pipeline_type           VARCHAR(20)     NOT NULL
        CONSTRAINT chk_pl_type CHECK (pipeline_type IN (
            'CRUDE',            -- crude oil transmission
            'PRODUCTS',         -- refined products
            'GAS_TRANSMISSION', -- high-pressure gas transmission
            'GAS_DISTRIBUTION', -- low-pressure gas distribution
            'LNG',              -- LNG pipeline
            'MULTI_PRODUCT',    -- can carry multiple products in batches
            'OTHER'
        )),
    commodity_type          VARCHAR(20)     NOT NULL
        CONSTRAINT chk_pl_commodity CHECK (commodity_type IN (
            'OIL','GAS','MULTI','OTHER'
        )),
    operator_id             INT             NOT NULL,   -- TSO / pipeline operator
    owner_operator_id       INT             NULL,       -- owning company (may differ)
    -- Regulatory
    tso_code                VARCHAR(50)     NULL,   -- TSO identifier (OFGEM, ENTSOG etc.)
    regulatory_body         VARCHAR(100)    NULL,   -- 'OFGEM','FERC','ACER','ERA'
    regulatory_ref          VARCHAR(100)    NULL,
    -- Physical specifications
    length_km               DECIMAL(10,2)   NULL,
    diameter_mm             SMALLINT        NULL,
    max_operating_pressure  DECIMAL(8,2)    NULL,   -- bar(g)
    max_capacity            DECIMAL(18,4)   NULL,
    max_capacity_uom_id     INT             NULL,
    flow_direction          VARCHAR(20)     NOT NULL DEFAULT 'UNIDIRECTIONAL'
        CONSTRAINT chk_pl_flow CHECK (flow_direction IN (
            'UNIDIRECTIONAL','BIDIRECTIONAL','VARIABLE'
        )),
    -- Geography
    country_codes           VARCHAR(100)    NULL,   -- CSV for cross-border pipelines
    is_cross_border         BIT             NOT NULL DEFAULT 0,
    -- Operational
    is_fungible             BIT             NOT NULL DEFAULT 1,
    -- FALSE = products must be tracked/segregated (e.g. products pipeline)
    -- TRUE  = batches commingled (e.g. crude)
    batch_scheduling        BIT             NOT NULL DEFAULT 0,
    -- Status
    is_active               BIT             NOT NULL DEFAULT 1,
    commissioned_date       DATE            NULL,
    decommissioned_date     DATE            NULL,
    notes                   VARCHAR(1000)   NULL,
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,
    updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_pipeline          PRIMARY KEY (pipeline_id),
    CONSTRAINT uq_pipeline_code     UNIQUE      (pipeline_code),
    CONSTRAINT fk_pl_operator       FOREIGN KEY (operator_id)       REFERENCES dbo.transport_operator(operator_id),
    CONSTRAINT fk_pl_owner          FOREIGN KEY (owner_operator_id) REFERENCES dbo.transport_operator(operator_id),
    CONSTRAINT fk_pl_uom            FOREIGN KEY (max_capacity_uom_id) REFERENCES dbo.unit_of_measure(uom_id)
) WITH (DATA_COMPRESSION = ROW);
GO


-- 21. PIPELINE_POINT
-- Individual entry, exit, interconnect, metering points on a pipeline.
-- Each point links to a location.
-- =============================================================================
CREATE TABLE dbo.pipeline_point (
    point_id            INT             NOT NULL IDENTITY(1,1),
    pipeline_id         INT             NOT NULL,
    location_id         INT             NOT NULL,
    point_code          VARCHAR(30)     NOT NULL,
    point_name          VARCHAR(200)    NOT NULL,
    point_type          VARCHAR(20)     NOT NULL
        CONSTRAINT chk_pp_type CHECK (point_type IN (
            'ENTRY',            -- injection point
            'EXIT',             -- offtake point
            'INTERCONNECT',     -- connection to another pipeline
            'STORAGE_LINK',     -- connection to storage facility
            'METERING',         -- fiscal metering point
            'COMPRESSOR',       -- compressor station
            'PRESSURE_REDUCE'   -- pressure reduction station
        )),
    flow_direction      VARCHAR(20)     NOT NULL DEFAULT 'BOTH'
        CONSTRAINT chk_pp_flow CHECK (flow_direction IN ('ENTRY_ONLY','EXIT_ONLY','BOTH')),
    -- Capacity at this point (may differ from mainline)
    capacity            DECIMAL(18,4)   NULL,
    capacity_uom_id     INT             NULL,
    -- Metering
    meter_ref           VARCHAR(50)     NULL,
    meter_type          VARCHAR(50)     NULL,
    -- Interconnected pipeline (if INTERCONNECT type)
    interconnect_pipeline_id INT        NULL,
    -- Linked storage (if STORAGE_LINK type)
    facility_id         INT             NULL,
    -- Tariff zone identifier
    tariff_zone         VARCHAR(30)     NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(300)    NULL,

    CONSTRAINT pk_pipeline_point    PRIMARY KEY (point_id),
    CONSTRAINT uq_pp_code           UNIQUE      (pipeline_id, point_code),
    CONSTRAINT fk_pp_pipeline       FOREIGN KEY (pipeline_id)           REFERENCES dbo.pipeline(pipeline_id),
    CONSTRAINT fk_pp_location       FOREIGN KEY (location_id)           REFERENCES dbo.location(location_id),
    CONSTRAINT fk_pp_uom            FOREIGN KEY (capacity_uom_id)       REFERENCES dbo.unit_of_measure(uom_id),
    CONSTRAINT fk_pp_interconnect   FOREIGN KEY (interconnect_pipeline_id) REFERENCES dbo.pipeline(pipeline_id),
    CONSTRAINT fk_pp_facility       FOREIGN KEY (facility_id)           REFERENCES dbo.storage_facility(facility_id)
);
GO
CREATE INDEX ix_pp_pipeline ON dbo.pipeline_point (pipeline_id, point_type, is_active);
CREATE INDEX ix_pp_location ON dbo.pipeline_point (location_id);
GO


-- 22. PIPELINE_SEGMENT
-- Segment of pipeline between two consecutive points.
-- Enables partial outage modelling and segment-level capacity tracking.
-- =============================================================================
CREATE TABLE dbo.pipeline_segment (
    segment_id          INT             NOT NULL IDENTITY(1,1),
    pipeline_id         INT             NOT NULL,
    from_point_id       INT             NOT NULL,
    to_point_id         INT             NOT NULL,
    segment_code        VARCHAR(30)     NOT NULL,
    segment_name        VARCHAR(200)    NULL,
    -- Physical
    length_km           DECIMAL(8,2)    NULL,
    diameter_mm         SMALLINT        NULL,
    max_operating_pressure DECIMAL(8,2) NULL,   -- bar(g)
    -- Capacity
    forward_capacity    DECIMAL(18,4)   NULL,
    reverse_capacity    DECIMAL(18,4)   NULL,   -- NULL if unidirectional
    capacity_uom_id     INT             NULL,
    -- Tariff
    tariff_zone         VARCHAR(30)     NULL,
    -- Status
    operational_status  VARCHAR(20)     NOT NULL DEFAULT 'IN_SERVICE'
        CONSTRAINT chk_ps_opstatus CHECK (operational_status IN (
            'IN_SERVICE','REDUCED_CAPACITY','MAINTENANCE','OUTAGE','DECOMMISSIONED'
        )),
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(300)    NULL,

    CONSTRAINT pk_pipeline_segment  PRIMARY KEY (segment_id),
    CONSTRAINT uq_ps_code           UNIQUE      (pipeline_id, segment_code),
    CONSTRAINT fk_ps_pipeline       FOREIGN KEY (pipeline_id)     REFERENCES dbo.pipeline(pipeline_id),
    CONSTRAINT fk_ps_from           FOREIGN KEY (from_point_id)   REFERENCES dbo.pipeline_point(point_id),
    CONSTRAINT fk_ps_to             FOREIGN KEY (to_point_id)     REFERENCES dbo.pipeline_point(point_id),
    CONSTRAINT fk_ps_uom            FOREIGN KEY (capacity_uom_id) REFERENCES dbo.unit_of_measure(uom_id),
    CONSTRAINT chk_ps_no_self       CHECK       (from_point_id <> to_point_id)
);
GO


-- 23. PIPELINE_CYCLE
-- Operational scheduling cycle for a pipeline.
-- KEY master data table — defines the nomination/confirmation/scheduling rhythm.
-- =============================================================================
CREATE TABLE dbo.pipeline_cycle (
    cycle_id            INT             NOT NULL IDENTITY(1,1),
    pipeline_id         INT             NOT NULL,
    cycle_type          VARCHAR(20)     NOT NULL
        CONSTRAINT chk_pc_type CHECK (cycle_type IN (
            'INTRADAY',     -- multiple cycles per gas day (WD1,WD2,WD3 on NBP)
            'DAILY',        -- once per gas/oil day
            'MONTHLY',      -- monthly batch (oil products pipelines)
            'ADHOC'         -- operator-initiated
        )),
    cycle_code          VARCHAR(20)     NOT NULL,   -- e.g. 'WD1','WD2','D+1','M1'
    cycle_name          VARCHAR(100)    NOT NULL,   -- e.g. 'Within Day 1','Day Ahead'
    -- Timing (all times in UTC)
    nomination_deadline TIME            NULL,   -- shippers must nominate by this time
    confirmation_deadline TIME          NULL,   -- operator confirms by this time
    scheduling_deadline TIME            NULL,   -- final schedule published
    effective_start     TIME            NULL,   -- start of the delivery window
    effective_end       TIME            NULL,   -- end of the delivery window
    -- Applicable calendar
    calendar_id         INT             NULL,   -- holiday calendar for this cycle
    applies_to_days     VARCHAR(20)     NOT NULL DEFAULT 'WEEKDAYS'
        CONSTRAINT chk_pc_days CHECK (applies_to_days IN (
            'ALL','WEEKDAYS','WEEKENDS','MONDAY','TUESDAY',
            'WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'
        )),
    -- Nomination tolerance
    tolerance_pct       DECIMAL(5,2)    NULL,   -- % above/below nomination allowed
    -- Priority
    cycle_priority      TINYINT         NOT NULL DEFAULT 1,
    -- 1=highest priority cycle for the day
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_pipeline_cycle    PRIMARY KEY (cycle_id),
    CONSTRAINT uq_pc_code           UNIQUE      (pipeline_id, cycle_code),
    CONSTRAINT fk_pc_pipeline       FOREIGN KEY (pipeline_id) REFERENCES dbo.pipeline(pipeline_id),
    CONSTRAINT fk_pc_calendar       FOREIGN KEY (calendar_id) REFERENCES dbo.holiday_calendar(calendar_id)
);
GO
CREATE INDEX ix_pc_pipeline ON dbo.pipeline_cycle (pipeline_id, cycle_type, is_active);
GO


-- 24. PIPELINE_TARIFF
-- Tariff rates for using the pipeline per point pair.
-- Firm vs interruptible capacity pricing.
-- =============================================================================
CREATE TABLE dbo.pipeline_tariff (
    tariff_id           INT             NOT NULL IDENTITY(1,1),
    pipeline_id         INT             NOT NULL,
    from_point_id       INT             NOT NULL,
    to_point_id         INT             NOT NULL,
    product_id          INT             NULL,       -- NULL = all products
    tariff_type         VARCHAR(20)     NOT NULL
        CONSTRAINT chk_pt_type CHECK (tariff_type IN (
            'FIRM',             -- guaranteed capacity
            'INTERRUPTIBLE',    -- best-efforts capacity
            'CAPACITY_BOOKING', -- reserved capacity charge
            'COMMODITY',        -- per-unit flow charge
            'CONNECTION'        -- connection/access fee
        )),
    capacity_type       VARCHAR(20)     NOT NULL DEFAULT 'ENTRY_EXIT'
        CONSTRAINT chk_pt_cap_type CHECK (capacity_type IN (
            'ENTRY','EXIT','ENTRY_EXIT','WITHIN_ZONE'
        )),
    currency_id         INT             NOT NULL,
    rate                DECIMAL(18,8)   NOT NULL,
    rate_uom_id         INT             NOT NULL,   -- per unit: per MWh, per BBL etc.
    -- Seasonal
    season              VARCHAR(20)     NULL
        CONSTRAINT chk_pt_season CHECK (season IN (
            'SUMMER','WINTER','ALL',NULL
        )),
    effective_from      DATE            NOT NULL,
    effective_to        DATE            NULL,
    regulatory_ref      VARCHAR(100)    NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(300)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_pipeline_tariff   PRIMARY KEY (tariff_id),
    CONSTRAINT uq_pt                UNIQUE      (pipeline_id, from_point_id, to_point_id,
                                                tariff_type, capacity_type, effective_from),
    CONSTRAINT fk_ptar_pipeline     FOREIGN KEY (pipeline_id)   REFERENCES dbo.pipeline(pipeline_id),
    CONSTRAINT fk_ptar_from         FOREIGN KEY (from_point_id) REFERENCES dbo.pipeline_point(point_id),
    CONSTRAINT fk_ptar_to           FOREIGN KEY (to_point_id)   REFERENCES dbo.pipeline_point(point_id),
    CONSTRAINT fk_ptar_product      FOREIGN KEY (product_id)    REFERENCES dbo.product(product_id),
    CONSTRAINT fk_ptar_currency     FOREIGN KEY (currency_id)   REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_ptar_uom          FOREIGN KEY (rate_uom_id)   REFERENCES dbo.unit_of_measure(uom_id)
);
GO


-- 25. PIPELINE_OPERATOR_AGREEMENT
-- Shipper agreements between our legal entities and pipeline TSOs.
-- =============================================================================
CREATE TABLE dbo.pipeline_operator_agreement (
    agreement_id        INT             NOT NULL IDENTITY(1,1),
    pipeline_id         INT             NOT NULL,
    legal_entity_id     INT             NOT NULL,
    shipper_code        VARCHAR(50)     NOT NULL,   -- code assigned by TSO
    agreement_ref       VARCHAR(100)    NULL,
    agreement_type      VARCHAR(20)     NOT NULL DEFAULT 'SHIPPER'
        CONSTRAINT chk_poa_type CHECK (agreement_type IN (
            'SHIPPER',          -- standard shipper agreement
            'STORAGE_OPERATOR', -- storage operator agreement
            'CAPACITY_BOOKING', -- specific capacity booking
            'INTERCONNECT'      -- interconnection agreement
        )),
    approved_commodities VARCHAR(200)   NULL,   -- CSV, NULL = all
    firm_capacity       DECIMAL(18,4)   NULL,
    firm_capacity_uom_id INT            NULL,
    effective_from      DATE            NOT NULL,
    effective_to        DATE            NULL,
    regulatory_ref      VARCHAR(100)    NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_poa               PRIMARY KEY (agreement_id),
    CONSTRAINT uq_poa               UNIQUE      (pipeline_id, legal_entity_id, agreement_type),
    CONSTRAINT fk_poa_pipeline      FOREIGN KEY (pipeline_id)     REFERENCES dbo.pipeline(pipeline_id),
    CONSTRAINT fk_poa_entity        FOREIGN KEY (legal_entity_id) REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_poa_uom           FOREIGN KEY (firm_capacity_uom_id) REFERENCES dbo.unit_of_measure(uom_id)
);
GO


-- =============================================================================
-- GROUP H — PRODUCT APPROVALS
-- =============================================================================

-- 26. PIPELINE_PRODUCT_APPROVAL
-- Which products are approved to flow on each pipeline.
-- References a spec template — pipeline can impose tighter specs via spec_override.
-- =============================================================================
CREATE TABLE dbo.pipeline_product_approval (
    approval_id         INT             NOT NULL IDENTITY(1,1),
    pipeline_id         INT             NOT NULL,
    product_id          INT             NOT NULL,
    spec_template_id    INT             NULL,       -- which spec this pipeline uses
    -- Flow constraints
    approved_flow       VARCHAR(20)     NOT NULL DEFAULT 'BOTH'
        CONSTRAINT chk_ppa_flow CHECK (approved_flow IN (
            'ENTRY_ONLY','EXIT_ONLY','BOTH'
        )),
    -- Batching
    batch_required      BIT             NOT NULL DEFAULT 0,
    segregation_required BIT            NOT NULL DEFAULT 0,
    -- Approval
    approval_status     VARCHAR(20)     NOT NULL DEFAULT 'APPROVED'
        CONSTRAINT chk_ppa_status CHECK (approval_status IN (
            'APPROVED','CONDITIONAL','SUSPENDED','REJECTED'
        )),
    conditions          VARCHAR(500)    NULL,
    regulatory_ref      VARCHAR(100)    NULL,
    effective_from      DATE            NOT NULL,
    effective_to        DATE            NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    approved_by         VARCHAR(100)    NULL,
    notes               VARCHAR(300)    NULL,

    CONSTRAINT pk_ppa               PRIMARY KEY (approval_id),
    CONSTRAINT uq_ppa               UNIQUE      (pipeline_id, product_id, effective_from),
    CONSTRAINT fk_ppa_pipeline      FOREIGN KEY (pipeline_id)      REFERENCES dbo.pipeline(pipeline_id),
    CONSTRAINT fk_ppa_product       FOREIGN KEY (product_id)       REFERENCES dbo.product(product_id),
    CONSTRAINT fk_ppa_template      FOREIGN KEY (spec_template_id) REFERENCES dbo.product_spec_template(template_id)
);
GO
CREATE INDEX ix_ppa_pipeline ON dbo.pipeline_product_approval (pipeline_id, approval_status, is_active);
CREATE INDEX ix_ppa_product  ON dbo.pipeline_product_approval (product_id,  approval_status, is_active);
GO


-- 27. PIPELINE_POINT_PRODUCT
-- Product approvals at specific entry/exit points.
-- A point may be more restrictive than the pipeline as a whole.
-- =============================================================================
CREATE TABLE dbo.pipeline_point_product (
    ppp_id              INT             NOT NULL IDENTITY(1,1),
    point_id            INT             NOT NULL,
    product_id          INT             NOT NULL,
    spec_template_id    INT             NULL,
    approved_flow       VARCHAR(20)     NOT NULL DEFAULT 'BOTH'
        CONSTRAINT chk_ppp_flow CHECK (approved_flow IN ('ENTRY_ONLY','EXIT_ONLY','BOTH')),
    max_flow_rate       DECIMAL(18,4)   NULL,
    flow_rate_uom_id    INT             NULL,
    approval_status     VARCHAR(20)     NOT NULL DEFAULT 'APPROVED'
        CONSTRAINT chk_ppp_status CHECK (approval_status IN (
            'APPROVED','CONDITIONAL','SUSPENDED','REJECTED'
        )),
    effective_from      DATE            NOT NULL,
    effective_to        DATE            NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(300)    NULL,

    CONSTRAINT pk_ppp               PRIMARY KEY (ppp_id),
    CONSTRAINT uq_ppp               UNIQUE      (point_id, product_id, effective_from),
    CONSTRAINT fk_ppp_point         FOREIGN KEY (point_id)         REFERENCES dbo.pipeline_point(point_id),
    CONSTRAINT fk_ppp_product       FOREIGN KEY (product_id)       REFERENCES dbo.product(product_id),
    CONSTRAINT fk_ppp_template      FOREIGN KEY (spec_template_id) REFERENCES dbo.product_spec_template(template_id),
    CONSTRAINT fk_ppp_uom           FOREIGN KEY (flow_rate_uom_id) REFERENCES dbo.unit_of_measure(uom_id)
);
GO


-- 28. PIPELINE_SEGMENT_PRODUCT
-- Segment-level product restrictions.
-- Used when an older/smaller segment limits which products can flow.
-- =============================================================================
CREATE TABLE dbo.pipeline_segment_product (
    psp_id              INT             NOT NULL IDENTITY(1,1),
    segment_id          INT             NOT NULL,
    product_id          INT             NOT NULL,
    spec_template_id    INT             NULL,
    max_flow_rate       DECIMAL(18,4)   NULL,
    flow_rate_uom_id    INT             NULL,
    restriction_reason  VARCHAR(300)    NULL,
    approval_status     VARCHAR(20)     NOT NULL DEFAULT 'APPROVED'
        CONSTRAINT chk_psp_status CHECK (approval_status IN (
            'APPROVED','CONDITIONAL','SUSPENDED','REJECTED'
        )),
    effective_from      DATE            NOT NULL,
    effective_to        DATE            NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(300)    NULL,

    CONSTRAINT pk_psp               PRIMARY KEY (psp_id),
    CONSTRAINT uq_psp               UNIQUE      (segment_id, product_id, effective_from),
    CONSTRAINT fk_psp_segment       FOREIGN KEY (segment_id)       REFERENCES dbo.pipeline_segment(segment_id),
    CONSTRAINT fk_psp_product       FOREIGN KEY (product_id)       REFERENCES dbo.product(product_id),
    CONSTRAINT fk_psp_template      FOREIGN KEY (spec_template_id) REFERENCES dbo.product_spec_template(template_id),
    CONSTRAINT fk_psp_uom           FOREIGN KEY (flow_rate_uom_id) REFERENCES dbo.unit_of_measure(uom_id)
);
GO


-- 29. MOT_ASSET_PRODUCT_APPROVAL
-- Product approvals for individual transport assets:
-- vessel, truck, railcar, container, tank.
-- Same concept as pipeline product approval but for physical assets.
-- References spec template + allows spec_override for asset-specific requirements.
-- =============================================================================
CREATE TABLE dbo.mot_asset_product_approval (
    asset_approval_id   INT             NOT NULL IDENTITY(1,1),
    -- The asset
    asset_type          VARCHAR(20)     NOT NULL
        CONSTRAINT chk_mapa_type CHECK (asset_type IN (
            'VESSEL','TRUCK','RAILCAR','CONTAINER','TANK'
        )),
    asset_id            INT             NOT NULL,
    -- The product
    product_id          INT             NOT NULL,
    spec_template_id    INT             NULL,
    -- Asset-specific constraints
    max_quantity        DECIMAL(18,4)   NULL,
    quantity_uom_id     INT             NULL,
    -- Approval
    approval_status     VARCHAR(20)     NOT NULL DEFAULT 'APPROVED'
        CONSTRAINT chk_mapa_status CHECK (approval_status IN (
            'APPROVED','CONDITIONAL','SUSPENDED','REJECTED'
        )),
    conditions          VARCHAR(500)    NULL,
    regulatory_ref      VARCHAR(100)    NULL,
    -- Validity
    effective_from      DATE            NOT NULL,
    effective_to        DATE            NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    approved_by         VARCHAR(100)    NULL,
    notes               VARCHAR(300)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_mapa              PRIMARY KEY (asset_approval_id),
    CONSTRAINT uq_mapa              UNIQUE      (asset_type, asset_id, product_id, effective_from),
    CONSTRAINT fk_mapa_product      FOREIGN KEY (product_id)       REFERENCES dbo.product(product_id),
    CONSTRAINT fk_mapa_template     FOREIGN KEY (spec_template_id) REFERENCES dbo.product_spec_template(template_id),
    CONSTRAINT fk_mapa_uom          FOREIGN KEY (quantity_uom_id)  REFERENCES dbo.unit_of_measure(uom_id)
);
GO
CREATE INDEX ix_mapa_asset   ON dbo.mot_asset_product_approval (asset_type, asset_id, is_active);
CREATE INDEX ix_mapa_product ON dbo.mot_asset_product_approval (product_id, asset_type,  is_active);
GO


-- =============================================================================
-- REFERENCE DATA SEEDS
-- =============================================================================

-- MOT types
INSERT INTO dbo.mot_type (mot_code, mot_name, transport_medium, requires_physical_asset, requires_routing, typical_commodities)
VALUES
    ('VESSEL',              'Ocean Vessel / Tanker',    'SEA',      1, 1, 'OIL,GAS,AGRICULTURAL,METALS'),
    ('BARGE',               'River / Coastal Barge',    'SEA',      1, 1, 'OIL,GAS,AGRICULTURAL'),
    ('PIPELINE',            'Pipeline',                 'PIPELINE', 0, 1, 'OIL,GAS'),
    ('TRUCK',               'Road Tanker / Truck',      'LAND',     1, 1, 'OIL,AGRICULTURAL,METALS'),
    ('RAILCAR',             'Tank Car / Railcar',       'LAND',     1, 1, 'OIL,AGRICULTURAL,METALS'),
    ('ISO_CONTAINER',       'ISO Tank Container',       'LAND',     1, 1, 'OIL,METALS'),
    ('FLEXIBAG',            'Flexibag Container',       'LAND',     1, 1, 'AGRICULTURAL'),
    ('WAREHOUSE_TRANSFER',  'Warehouse / Storage Transfer','VIRTUAL',0, 0, 'METALS,AGRICULTURAL'),
    ('BOOK_TRANSFER',       'Book Transfer / Title Only','VIRTUAL', 0, 0, 'OIL,GAS,METALS');
GO

-- Inspection types
INSERT INTO dbo.inspection_type (type_code, type_name, applicable_to, issuing_body, validity_months, is_mandatory)
VALUES
    ('SIRE',        'Ship Inspection Report (SIRE)',       'VESSEL',               'OCIMF',            12, 1),
    ('CDI',         'Chemical Distribution Institute',     'VESSEL',               'CDI',              12, 0),
    ('RIGHTSHIP',   'RightShip Vetting',                   'VESSEL',               'RightShip',        12, 0),
    ('USCG_COC',    'US Coast Guard Certificate of Compliance','VESSEL',           'USCG',             12, 0),
    ('CLASS_ANNUAL','Annual Class Survey',                 'VESSEL',               'Class Society',    12, 1),
    ('CLASS_SPEC',  'Special Survey (5-yearly)',           'VESSEL',               'Class Society',    60, 1),
    ('API_653',     'API 653 Tank Inspection',             'TANK',                 'API',              60, 1),
    ('API_570',     'API 570 Piping Inspection',           'PIPELINE',             'API',              60, 0),
    ('DOT_SP',      'DOT Special Permit Inspection',       'RAILCAR,TRUCK',        'DOT',              12, 1),
    ('ADR',         'ADR Hazmat Road Transport Cert',      'TRUCK',                'National Authority',12,1),
    ('CSC',         'Container Safety Convention Plate',   'CONTAINER',            'Flag State',       30, 1),
    ('ISO_TANK_INS','ISO Tank Annual Inspection',          'CONTAINER',            'Third Party',      12, 1);
GO

-- Transport document types
INSERT INTO dbo.transport_document_type (mot_type_id, doc_type_code, doc_type_name, is_mandatory, description)
VALUES
    (NULL, 'BOL',           'Bill of Lading',                   1, 'Title document for sea shipments'),
    (NULL, 'COQ',           'Certificate of Quality',           1, 'Lab analysis of cargo quality'),
    (NULL, 'COO',           'Certificate of Origin',            0, 'Country of origin certificate'),
    (NULL, 'COQTY',         'Certificate of Quantity',          1, 'Independent quantity measurement'),
    (NULL, 'NOR',           'Notice of Readiness',              1, 'Vessel ready to load/discharge'),
    (NULL, 'ULLAGE_RPT',    'Ullage/Gauge Report',              1, 'Tank measurement report'),
    (NULL, 'SGS_RPT',       'Independent Inspection Report',    0, 'SGS/Saybolt/Bureau Veritas report'),
    ((SELECT mot_type_id FROM dbo.mot_type WHERE mot_code='TRUCK'),
           'CMR',           'CMR Road Consignment Note',        1, 'Road transport waybill (Europe)'),
    ((SELECT mot_type_id FROM dbo.mot_type WHERE mot_code='TRUCK'),
           'ADR_DOCS',      'ADR Dangerous Goods Documents',    1, 'Hazmat road transport papers'),
    ((SELECT mot_type_id FROM dbo.mot_type WHERE mot_code='RAILCAR'),
           'RAIL_WAYBILL',  'Rail Waybill (CIM/SMGS)',          1, 'Rail transport document'),
    ((SELECT mot_type_id FROM dbo.mot_type WHERE mot_code='PIPELINE'),
           'PIPELINE_TICKET','Pipeline Allocation Ticket',      1, 'Pipeline measurement/allocation'),
    ((SELECT mot_type_id FROM dbo.mot_type WHERE mot_code='PIPELINE'),
           'GAS_SCHEDULE',  'Gas Nomination/Schedule',          1, 'Pipeline gas scheduling document'),
    ((SELECT mot_type_id FROM dbo.mot_type WHERE mot_code='ISO_CONTAINER'),
           'CONTAINER_CERT','Container Inspection Certificate', 1, 'CSC/ISO tank certificate'),
    (NULL, 'IMPORT_LICENCE','Import Licence',                   0, 'Required for certain commodities/countries'),
    (NULL, 'EXPORT_LICENCE','Export Licence',                   0, 'Required for certain commodities/countries'),
    (NULL, 'PHYTO_CERT',    'Phytosanitary Certificate',        0, 'Required for agricultural imports');
GO

-- Spec parameters — oil
INSERT INTO dbo.spec_parameter (commodity_type, parameter_code, parameter_name, parameter_category, data_type, decimal_places)
VALUES
    ('OIL','API_GRAVITY',       'API Gravity',                  'PHYSICAL',  'DECIMAL', 1),
    ('OIL','SULPHUR_PCT',       'Sulphur Content (%wt)',        'CHEMICAL',  'DECIMAL', 4),
    ('OIL','VISCOSITY_40',      'Kinematic Viscosity @ 40°C',   'PHYSICAL',  'DECIMAL', 2),
    ('OIL','VISCOSITY_50',      'Kinematic Viscosity @ 50°C',   'PHYSICAL',  'DECIMAL', 2),
    ('OIL','POUR_POINT',        'Pour Point (°C)',               'PHYSICAL',  'DECIMAL', 0),
    ('OIL','RVP',               'Reid Vapour Pressure (psi)',    'SAFETY',    'DECIMAL', 2),
    ('OIL','BSW_PCT',           'Basic Sediment & Water (%vol)', 'QUALITY',   'DECIMAL', 4),
    ('OIL','SALT_PTB',          'Salt Content (ptb)',            'CHEMICAL',  'DECIMAL', 1),
    ('OIL','WATER_PCT',         'Free Water Content (%vol)',     'QUALITY',   'DECIMAL', 3),
    ('OIL','NICKEL_PPM',        'Nickel Content (ppm)',          'CHEMICAL',  'DECIMAL', 1),
    ('OIL','VANADIUM_PPM',      'Vanadium Content (ppm)',        'CHEMICAL',  'DECIMAL', 1),
    ('OIL','FLASH_POINT',       'Flash Point (°C)',              'SAFETY',    'DECIMAL', 0),
    ('OIL','NITROGEN_PPM',      'Nitrogen Content (ppm)',        'CHEMICAL',  'DECIMAL', 0),
    -- Gas parameters
    ('GAS','GCV_MJSCM',         'Gross Calorific Value (MJ/scm)','ENERGY',   'DECIMAL', 3),
    ('GAS','WOBBE_INDEX',       'Wobbe Index (MJ/scm)',          'ENERGY',    'DECIMAL', 3),
    ('GAS','METHANE_PCT',       'Methane Content (%mol)',        'CHEMICAL',  'DECIMAL', 3),
    ('GAS','CO2_PCT',           'CO2 Content (%mol)',            'CHEMICAL',  'DECIMAL', 3),
    ('GAS','H2S_MG',            'H2S Content (mg/Nm3)',         'SAFETY',    'DECIMAL', 2),
    ('GAS','WATER_DEW',         'Water Dew Point (°C at bar)',   'QUALITY',   'DECIMAL', 1),
    ('GAS','HC_DEW',            'Hydrocarbon Dew Point (°C)',    'QUALITY',   'DECIMAL', 1),
    ('GAS','OXYGEN_PPM',        'Oxygen Content (ppm)',          'CHEMICAL',  'DECIMAL', 0),
    ('GAS','TOTAL_SULPHUR',     'Total Sulphur (mg/Nm3)',        'CHEMICAL',  'DECIMAL', 2),
    -- Agricultural parameters
    ('AGRICULTURAL','MOISTURE_PCT',   'Moisture Content (%)',     'QUALITY', 'DECIMAL', 1),
    ('AGRICULTURAL','PROTEIN_PCT',    'Protein Content (%)',      'QUALITY', 'DECIMAL', 1),
    ('AGRICULTURAL','TEST_WEIGHT',    'Test Weight (kg/hl)',       'PHYSICAL','DECIMAL', 1),
    ('AGRICULTURAL','FOREIGN_MATTER', 'Foreign Matter (%)',        'QUALITY', 'DECIMAL', 1),
    ('AGRICULTURAL','BROKEN_KERNELS', 'Broken/Damaged Kernels (%)', 'QUALITY','DECIMAL',1),
    ('AGRICULTURAL','AFLATOXIN_PPB',  'Aflatoxin (ppb)',           'SAFETY',  'DECIMAL', 1),
    ('AGRICULTURAL','GMO_STATUS',     'GMO Status',                'REGULATORY','BOOLEAN',0),
    -- Metals parameters
    ('METALS','PURITY_PCT',     'Purity (%)',                    'QUALITY',   'DECIMAL', 3),
    ('METALS','LME_BRAND',      'LME Approved Brand',            'REGULATORY','BOOLEAN', 0),
    ('METALS','COPPER_PCT',     'Copper Content (%)',            'CHEMICAL',  'DECIMAL', 3),
    ('METALS','ZINC_PCT',       'Zinc Content (%)',              'CHEMICAL',  'DECIMAL', 3),
    ('METALS','LEAD_PCT',       'Lead Content (%)',              'CHEMICAL',  'DECIMAL', 3),
    -- Power parameters
    ('POWER','VOLTAGE_KV',      'Voltage (kV)',                  'PHYSICAL',  'DECIMAL', 1),
    ('POWER','FREQUENCY_HZ',    'Frequency (Hz)',                'PHYSICAL',  'DECIMAL', 3),
    ('POWER','POWER_FACTOR',    'Power Factor',                  'PHYSICAL',  'DECIMAL', 3),
    ('POWER','GEN_SOURCE',      'Generation Source',             'REGULATORY','TEXT',    0);
GO

PRINT '============================================================';
PRINT 'PRODUCT SPEC / MOT / PIPELINE MASTER DATA v1.0 APPLIED';
PRINT '  Group A — Product Specs  : spec_parameter, spec_parameter_uom,';
PRINT '                             product_spec_template, product_spec_value,';
PRINT '                             spec_override';
PRINT '  Group B — MOT Core       : mot_type, transport_operator,';
PRINT '                             transport_route, transport_document_type';
PRINT '  Group C — Vessel         : vessel, vessel_certificate';
PRINT '  Group D — Land Transport : truck, railcar, container';
PRINT '  Group E — Storage/Tanks  : tank, tank_calibration, tank_status';
PRINT '  Group F — Inspection     : inspection_type, inspection';
PRINT '  Group G — Pipeline       : pipeline (full), pipeline_point,';
PRINT '                             pipeline_segment, pipeline_cycle,';
PRINT '                             pipeline_tariff, pipeline_operator_agreement';
PRINT '  Group H — Product Approv : pipeline_product_approval,';
PRINT '                             pipeline_point_product,';
PRINT '                             pipeline_segment_product,';
PRINT '                             mot_asset_product_approval';
PRINT '============================================================';
GO
