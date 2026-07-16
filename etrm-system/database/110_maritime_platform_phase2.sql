-- =============================================================================
-- V110 -- Maritime Execution Platform phase 2: Fleet, Vessel Performance,
-- Charter Party Templates, Port Activity Templates, Cargo Tank/Hold
-- Configuration, Emission Factors, Operational Status/Delay Codes.
--
-- Per a gap review of V108 against the user's platform spec (commodity-
-- agnostic maritime execution platform covering crude/refined/LNG/LPG/
-- chemicals/coal/iron ore/concentrates/fertilizers/grain/sugar/veg oils):
-- Vessel/Certificates/Inspections/Laytime Rules/Bunker Fuel Types already
-- existed and mapped cleanly; these 7 domains were genuinely missing.
-- Confirmed with the user: stay in-monolith (direct FK references, same
-- pattern as every other module -- no separate service boundary), and build
-- these 7 now (Draft Restrictions/Canal/Weather Rules/Maintenance Windows/
-- Safety Equipment/Voyage Templates stay deferred, lower priority).
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- 1. FLEET_GROUP -- lookup
-- =============================================================================
CREATE TABLE dbo.fleet_group (
    fleet_group_id        INT             NOT NULL IDENTITY(1,1),
    group_code              VARCHAR(30)     NOT NULL,
    group_name                VARCHAR(150)    NOT NULL,
    description                  VARCHAR(500)    NULL,
    is_active                      BIT             NOT NULL DEFAULT 1,
    created_at                       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                         VARCHAR(100)    NOT NULL,
    updated_at                           DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                             VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_fleet_group   PRIMARY KEY (fleet_group_id),
    CONSTRAINT uq_fg_code         UNIQUE      (group_code)
);
GO

-- =============================================================================
-- 2. FLEET -- lookup, FK to fleet_group + transport_operator
-- =============================================================================
CREATE TABLE dbo.fleet (
    fleet_id                INT             NOT NULL IDENTITY(1,1),
    fleet_code                 VARCHAR(30)     NOT NULL,
    fleet_name                    VARCHAR(150)    NOT NULL,
    fleet_group_id                  INT             NULL,
    owner_operator_id                  INT             NULL,
    description                          VARCHAR(500)    NULL,
    is_active                              BIT             NOT NULL DEFAULT 1,
    created_at                               DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                 VARCHAR(100)    NOT NULL,
    updated_at                                   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                     VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_fleet                     PRIMARY KEY (fleet_id),
    CONSTRAINT uq_fleet_code                   UNIQUE      (fleet_code),
    CONSTRAINT fk_fleet_group                     FOREIGN KEY (fleet_group_id)     REFERENCES dbo.fleet_group(fleet_group_id),
    CONSTRAINT fk_fleet_owner_operator                FOREIGN KEY (owner_operator_id)  REFERENCES dbo.transport_operator(operator_id)
);
GO

-- vessel.fleet_id -- assigns a vessel to a fleet
ALTER TABLE dbo.vessel ADD fleet_id INT NULL;
GO
ALTER TABLE dbo.vessel ADD CONSTRAINT fk_vessel_fleet FOREIGN KEY (fleet_id) REFERENCES dbo.fleet(fleet_id);
GO

-- =============================================================================
-- 3. CHARTER_PARTY_TEMPLATE -- lookup, reusable clause-bundle defaults
-- =============================================================================
CREATE TABLE dbo.charter_party_template (
    template_id                  INT             NOT NULL IDENTITY(1,1),
    template_code                   VARCHAR(30)     NOT NULL,
    template_name                      VARCHAR(150)    NOT NULL,
    charter_party_type_id                 INT             NOT NULL,
    default_laytime_term_id                  INT             NULL,
    default_demurrage_rate_per_day               DECIMAL(14,2)   NULL,
    default_dispatch_rate_per_day                   DECIMAL(14,2)   NULL,
    default_bunker_clause_basis                        VARCHAR(20)     NULL
        CONSTRAINT chk_cpt2_bunker_clause CHECK (default_bunker_clause_basis IS NULL OR default_bunker_clause_basis IN ('SAME_QUANTITY_PCT','AS_ON_DELIVERY','FIXED_PRICE')),
    default_bunker_clause_tolerance_pct                     DECIMAL(5,2)    NULL,
    default_hire_payment_frequency                             VARCHAR(20)     NULL
        CONSTRAINT chk_cpt2_hire_freq CHECK (default_hire_payment_frequency IS NULL OR default_hire_payment_frequency IN ('MONTHLY','SEMI_MONTHLY','FIFTEEN_DAYS')),
    description                                                   VARCHAR(500)    NULL,
    is_active                                                       BIT             NOT NULL DEFAULT 1,
    created_at                                                        DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                                          VARCHAR(100)    NOT NULL,
    updated_at                                                            DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                                              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_charter_party_template                 PRIMARY KEY (template_id),
    CONSTRAINT uq_cpt2_code                                 UNIQUE      (template_code),
    CONSTRAINT fk_cpt2_cp_type                                 FOREIGN KEY (charter_party_type_id)      REFERENCES dbo.charter_party_type(charter_party_type_id),
    CONSTRAINT fk_cpt2_laytime_term                               FOREIGN KEY (default_laytime_term_id)    REFERENCES dbo.laytime_term_template(laytime_term_id)
);
GO

-- charter_party.charter_party_template_id -- which template (if any) a fixture started from
ALTER TABLE dbo.charter_party ADD charter_party_template_id INT NULL;
GO
ALTER TABLE dbo.charter_party ADD CONSTRAINT fk_cp_template FOREIGN KEY (charter_party_template_id) REFERENCES dbo.charter_party_template(template_id);
GO

-- =============================================================================
-- 4. PORT_ACTIVITY_TEMPLATE -- lookup
-- =============================================================================
CREATE TABLE dbo.port_activity_template (
    template_id              INT             NOT NULL IDENTITY(1,1),
    template_code               VARCHAR(30)     NOT NULL,
    template_name                  VARCHAR(150)    NOT NULL,
    port_location_id                  INT             NULL,   -- NULL = generic/any port
    commodity_type_id                    INT             NULL,   -- e.g. LNG ports run a different standard sequence
    description                             VARCHAR(500)    NULL,
    is_active                                 BIT             NOT NULL DEFAULT 1,
    created_at                                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                    VARCHAR(100)    NOT NULL,
    updated_at                                      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                        VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_port_activity_template     PRIMARY KEY (template_id),
    CONSTRAINT uq_pat_code                      UNIQUE      (template_code),
    CONSTRAINT fk_pat_port_location                FOREIGN KEY (port_location_id)   REFERENCES dbo.location(location_id),
    CONSTRAINT fk_pat_commodity_type                  FOREIGN KEY (commodity_type_id)  REFERENCES dbo.commodity_type(commodity_type_id)
);
GO

-- =============================================================================
-- 5. PORT_ACTIVITY_TEMPLATE_STEP -- dedicated entity, ordered child of #4
-- =============================================================================
CREATE TABLE dbo.port_activity_template_step (
    step_id                    INT             NOT NULL IDENTITY(1,1),
    template_id                   INT             NOT NULL,
    sof_event_type_id                INT             NOT NULL,
    step_sequence                       SMALLINT        NOT NULL,
    typical_duration_hours                  DECIMAL(6,2)    NULL,
    notes                                       VARCHAR(300)    NULL,
    created_at                                    DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                      VARCHAR(100)    NOT NULL,
    updated_at                                        DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_port_activity_template_step   PRIMARY KEY (step_id),
    CONSTRAINT fk_pats_template                    FOREIGN KEY (template_id)         REFERENCES dbo.port_activity_template(template_id),
    CONSTRAINT fk_pats_event_type                      FOREIGN KEY (sof_event_type_id)   REFERENCES dbo.sof_event_type(sof_event_type_id)
);
GO
CREATE INDEX ix_pats_template ON dbo.port_activity_template_step (template_id, step_sequence);
GO

-- =============================================================================
-- 6. EMISSION_FACTOR -- lookup, per-fuel-grade emission factors
-- =============================================================================
CREATE TABLE dbo.emission_factor (
    factor_id                INT             NOT NULL IDENTITY(1,1),
    fuel_grade_id                INT             NOT NULL,
    emission_type                   VARCHAR(15)     NOT NULL
        CONSTRAINT chk_emf_emission_type CHECK (emission_type IN ('CO2','SOX','NOX','CH4','N2O')),
    factor_value                        DECIMAL(10,6)   NOT NULL,
    uom_basis                              VARCHAR(20)     NOT NULL DEFAULT 'T_PER_T_FUEL',
    source                                    VARCHAR(100)    NULL,
    effective_from                              DATE            NOT NULL DEFAULT CAST(SYSUTCDATETIME() AS DATE),
    notes                                          VARCHAR(500)    NULL,
    is_active                                       BIT             NOT NULL DEFAULT 1,
    created_at                                        DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                          VARCHAR(100)    NOT NULL,
    updated_at                                            DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_emission_factor          PRIMARY KEY (factor_id),
    CONSTRAINT uq_ef_fuel_type                UNIQUE      (fuel_grade_id, emission_type),
    CONSTRAINT fk_ef_fuel_grade                  FOREIGN KEY (fuel_grade_id) REFERENCES dbo.bunker_fuel_grade(fuel_grade_id)
);
GO

-- =============================================================================
-- 7. VESSEL_OPERATIONAL_STATUS_TYPE -- lookup (informational reference only
-- this pass -- not yet wired to a FK, same "master data first" convention as
-- laytime_calculation shipping before any calc engine)
-- =============================================================================
CREATE TABLE dbo.vessel_operational_status_type (
    status_type_id          INT             NOT NULL IDENTITY(1,1),
    status_code                VARCHAR(30)     NOT NULL,
    status_name                    VARCHAR(150)    NOT NULL,
    description                        VARCHAR(300)    NULL,
    is_active                             BIT             NOT NULL DEFAULT 1,
    created_at                               DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                 VARCHAR(100)    NOT NULL,
    updated_at                                   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                     VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_vessel_operational_status_type   PRIMARY KEY (status_type_id),
    CONSTRAINT uq_vost_code                           UNIQUE      (status_code)
);
GO

-- =============================================================================
-- 8. DELAY_REASON_TYPE -- lookup, voyage-level (underway/transit) delay
-- attribution -- distinct scope from off_hire_reason_type (charter off-hire)
-- and laytime_exception_type (in-port laytime exceptions)
-- =============================================================================
CREATE TABLE dbo.delay_reason_type (
    delay_reason_type_id    INT             NOT NULL IDENTITY(1,1),
    reason_code                VARCHAR(30)     NOT NULL,
    reason_name                    VARCHAR(150)    NOT NULL,
    description                        VARCHAR(300)    NULL,
    is_active                             BIT             NOT NULL DEFAULT 1,
    created_at                               DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                 VARCHAR(100)    NOT NULL,
    updated_at                                   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                     VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_delay_reason_type   PRIMARY KEY (delay_reason_type_id),
    CONSTRAINT uq_drt_code               UNIQUE      (reason_code)
);
GO

-- =============================================================================
-- 9. VESSEL_PERFORMANCE_CURVE -- dedicated entity, vessel-scoped
-- =============================================================================
CREATE TABLE dbo.vessel_performance_curve (
    curve_id                 INT             NOT NULL IDENTITY(1,1),
    vessel_id                   INT             NOT NULL,
    condition                      VARCHAR(10)     NOT NULL
        CONSTRAINT chk_vpc_condition CHECK (condition IN ('LADEN','BALLAST')),
    speed_knots                        DECIMAL(5,2)    NOT NULL,
    main_engine_consumption_mt_per_day    DECIMAL(8,3)    NOT NULL,
    aux_engine_consumption_mt_per_day        DECIMAL(8,3)    NULL,
    fuel_grade_id                               INT             NULL,
    effective_from                                 DATE            NULL,
    notes                                             VARCHAR(500)    NULL,
    is_active                                           BIT             NOT NULL DEFAULT 1,
    created_at                                            DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                              VARCHAR(100)    NOT NULL,
    updated_at                                                DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                                  VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_vessel_performance_curve   PRIMARY KEY (curve_id),
    CONSTRAINT fk_vpc_vessel                    FOREIGN KEY (vessel_id)     REFERENCES dbo.vessel(vessel_id),
    CONSTRAINT fk_vpc_fuel_grade                    FOREIGN KEY (fuel_grade_id) REFERENCES dbo.bunker_fuel_grade(fuel_grade_id)
);
GO
CREATE INDEX ix_vpc_vessel ON dbo.vessel_performance_curve (vessel_id, condition);
GO

-- =============================================================================
-- 10. VESSEL_CARGO_TANK -- dedicated entity, vessel-scoped. One table covers
-- both liquid-bulk cargo tanks and dry-bulk cargo holds via tank_type --
-- commodity-agnostic per the platform's own "never commodity-specific" rule,
-- rather than two near-identical tables.
-- =============================================================================
CREATE TABLE dbo.vessel_cargo_tank (
    tank_id                   INT             NOT NULL IDENTITY(1,1),
    vessel_id                    INT             NOT NULL,
    tank_code                       VARCHAR(20)     NOT NULL,
    tank_type                          VARCHAR(15)     NOT NULL
        CONSTRAINT chk_vct_type CHECK (tank_type IN ('CARGO_TANK','CARGO_HOLD')),
    capacity_cbm                          DECIMAL(12,2)   NOT NULL,
    coating_type                             VARCHAR(30)     NULL,   -- chemical/product tanker relevant: EPOXY/ZINC/STAINLESS/UNCOATED
    segregation_group                           VARCHAR(30)     NULL,
    notes                                          VARCHAR(500)    NULL,
    is_active                                       BIT             NOT NULL DEFAULT 1,
    created_at                                        DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                          VARCHAR(100)    NOT NULL,
    updated_at                                            DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_vessel_cargo_tank   PRIMARY KEY (tank_id),
    CONSTRAINT uq_vct_vessel_code        UNIQUE      (vessel_id, tank_code),
    CONSTRAINT fk_vct_vessel                FOREIGN KEY (vessel_id) REFERENCES dbo.vessel(vessel_id)
);
GO

-- =============================================================================
-- 11. MASTER DATA TABLE REGISTRY -- register the 7 new lookups
-- (vessel_performance_curve/vessel_cargo_tank/port_activity_template_step
-- are dedicated entities with their own controllers -- not registered here,
-- same convention as V108's operational tables.)
-- =============================================================================
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES
    ('fleet_group',                    'Fleet Groups',                    'Logistics & Delivery', 1, 1, 1, 0, 20, 'SYSTEM', 'SYSTEM'),
    ('fleet',                          'Fleets',                          'Logistics & Delivery', 1, 1, 1, 0, 21, 'SYSTEM', 'SYSTEM'),
    ('charter_party_template',         'Charter Party Templates',         'Voyage & Charter Ops',  1, 1, 1, 0, 4,  'SYSTEM', 'SYSTEM'),
    ('port_activity_template',         'Port Activity Templates',         'Voyage & Charter Ops',  1, 1, 1, 0, 5,  'SYSTEM', 'SYSTEM'),
    ('emission_factor',                'Emission Factors',                'Voyage & Charter Ops',  1, 1, 1, 0, 6,  'SYSTEM', 'SYSTEM'),
    ('vessel_operational_status_type', 'Vessel Operational Status Types', 'Voyage & Charter Ops',  1, 1, 1, 0, 7,  'SYSTEM', 'SYSTEM'),
    ('delay_reason_type',              'Delay Reason Types',              'Voyage & Charter Ops',  1, 1, 1, 0, 8,  'SYSTEM', 'SYSTEM');
GO
