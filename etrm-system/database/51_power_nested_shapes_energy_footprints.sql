-- V51 — Power master data: nested load shape structure + distributed energy footprints
--
-- Closes two gaps in the V11 power schema:
--
-- 1. NESTED SHAPE STRUCTURE. load_shape_template only describes a single
--    contiguous hour window (start_hour..end_hour) per day-class. Real power
--    delivery shapes need two more layers:
--      - load_shape_interval:  per-interval weighting under a shape — the
--        hour-by-hour (or 15/30-min) profile that makes a solar bell curve,
--        an EV overnight-charging curve, or an industrial demand shape
--        expressible at all. interval_factor is the fraction of contract MW
--        delivered in that interval (1.0 = full MW, 0.35 = 35% of MW).
--      - load_shape_component: shape-of-shapes nesting — a parent shape
--        composed of weighted child shapes, optionally scoped to a month
--        window for seasonal variants (e.g. ATC = PEAK + OFFPEAK, or a
--        solar annual shape = summer sub-shape May–Sep + winter sub-shape
--        Oct–Apr). Nesting is recursive: a component child may itself be
--        composite.
--    load_shape_template gains interval_minutes (60/30/15) so EU 15-minute
--    settlement shapes are representable, and is_composite marking shapes
--    whose definition lives in load_shape_component rather than their own
--    hour window / intervals.
--
-- 2. SOLAR / EV CHARGING NETWORK FOOTPRINTS. generation_asset models a
--    single plant at a single location — it cannot represent a portfolio of
--    distributed sites traded/hedged as one unit: a rooftop-solar portfolio,
--    an EV charging network (a *load* footprint, not generation), a battery
--    fleet, or a demand-response aggregation.
--      - energy_footprint:       the portfolio/network master record — what
--        the desk actually contracts against (one PPA, one supply deal).
--      - energy_footprint_site:  the member sites with per-site location,
--        zone, capacity, and technology detail (solar array vs EV charging
--        hub vs battery unit). A site MAY additionally link to a registered
--        generation_asset when it is grid-registered in its own right.
--
-- Master data only — no trade table changes. Linking trade_power_detail to
-- an energy_footprint (PPA source) is a follow-up alongside the existing
-- source_generation_asset_id column.

-- ─── 1a. load_shape_template extensions ──────────────────────────────────────
ALTER TABLE dbo.load_shape_template ADD
    interval_minutes    SMALLINT        NOT NULL
        CONSTRAINT df_lst_interval_minutes DEFAULT 60
        CONSTRAINT chk_lst_interval_minutes CHECK (interval_minutes IN (15, 30, 60)),
    is_composite        BIT             NOT NULL
        CONSTRAINT df_lst_is_composite DEFAULT 0;
GO

-- ─── 1b. load_shape_interval — per-interval weights under a shape ────────────
CREATE TABLE dbo.load_shape_interval (
    shape_interval_id       INT             NOT NULL IDENTITY(1,1),
    load_shape_id           INT             NOT NULL,
    day_type                VARCHAR(20)     NOT NULL DEFAULT 'ALL'
        CONSTRAINT chk_lsi_day_type CHECK (day_type IN (
            'ALL','WEEKDAYS','WEEKENDS','MONDAY','TUESDAY','WEDNESDAY',
            'THURSDAY','FRIDAY','SATURDAY','SUNDAY','HOLIDAY'
        )),
    interval_no             SMALLINT        NOT NULL,   -- 0-based, local time: 0-23 hourly, 0-47 half-hourly, 0-95 quarter-hourly
    interval_factor         DECIMAL(8,6)    NOT NULL,   -- fraction of contract MW delivered this interval (0..1+, >1 allowed for over-delivery shapes)
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,
    updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_load_shape_interval   PRIMARY KEY (shape_interval_id),
    CONSTRAINT uq_lsi_shape_day_interval UNIQUE     (load_shape_id, day_type, interval_no),
    CONSTRAINT fk_lsi_shape             FOREIGN KEY (load_shape_id) REFERENCES dbo.load_shape_template(load_shape_id),
    CONSTRAINT chk_lsi_interval_no      CHECK (interval_no BETWEEN 0 AND 95),
    CONSTRAINT chk_lsi_factor           CHECK (interval_factor >= 0)
);
GO
CREATE INDEX ix_lsi_shape ON dbo.load_shape_interval (load_shape_id, day_type, interval_no);
GO

-- ─── 1c. load_shape_component — nested/composite shapes ──────────────────────
CREATE TABLE dbo.load_shape_component (
    shape_component_id      INT             NOT NULL IDENTITY(1,1),
    parent_load_shape_id    INT             NOT NULL,
    child_load_shape_id     INT             NOT NULL,
    weight_factor           DECIMAL(8,4)    NOT NULL DEFAULT 1,     -- scaling applied to the child's MW fraction within the parent
    month_from              TINYINT         NULL,                   -- 1-12; NULL = all year. month_from > month_to is a valid
    month_to                TINYINT         NULL,                   -- winter wrap (e.g. 10..4 = Oct through Apr)
    sequence_no             SMALLINT        NOT NULL DEFAULT 1,
    notes                   VARCHAR(300)    NULL,
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,
    updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_load_shape_component  PRIMARY KEY (shape_component_id),
    CONSTRAINT uq_lsc_parent_child      UNIQUE      (parent_load_shape_id, child_load_shape_id, sequence_no),
    CONSTRAINT fk_lsc_parent            FOREIGN KEY (parent_load_shape_id) REFERENCES dbo.load_shape_template(load_shape_id),
    CONSTRAINT fk_lsc_child             FOREIGN KEY (child_load_shape_id)  REFERENCES dbo.load_shape_template(load_shape_id),
    CONSTRAINT chk_lsc_no_self          CHECK (parent_load_shape_id <> child_load_shape_id),
    CONSTRAINT chk_lsc_weight           CHECK (weight_factor > 0),
    CONSTRAINT chk_lsc_month_from       CHECK (month_from IS NULL OR month_from BETWEEN 1 AND 12),
    CONSTRAINT chk_lsc_month_to         CHECK (month_to   IS NULL OR month_to   BETWEEN 1 AND 12),
    CONSTRAINT chk_lsc_month_pair       CHECK (
        (month_from IS NULL AND month_to IS NULL) OR
        (month_from IS NOT NULL AND month_to IS NOT NULL)
    )
);
GO
CREATE INDEX ix_lsc_parent ON dbo.load_shape_component (parent_load_shape_id, sequence_no);
GO

-- ─── 2a. energy_footprint — distributed asset portfolio / network master ─────
CREATE TABLE dbo.energy_footprint (
    energy_footprint_id     INT             NOT NULL IDENTITY(1,1),
    footprint_code          VARCHAR(30)     NOT NULL,
    footprint_name          VARCHAR(200)    NOT NULL,
    footprint_type          VARCHAR(30)     NOT NULL
        CONSTRAINT chk_ef_type CHECK (footprint_type IN (
            'SOLAR_PORTFOLIO',      -- distributed/utility solar sites traded under one PPA
            'WIND_PORTFOLIO',
            'EV_CHARGING_NETWORK',  -- load footprint: charging hubs/depots supplied under one deal
            'BATTERY_FLEET',
            'DEMAND_RESPONSE',      -- curtailable load aggregation
            'MICROGRID',
            'HYBRID'                -- mixed technologies behind one contract point
        )),
    flow_direction          VARCHAR(20)     NOT NULL
        CONSTRAINT chk_ef_direction CHECK (flow_direction IN ('GENERATION','LOAD','BIDIRECTIONAL')),
    owner_counterparty_id   INT             NULL,   -- who owns the assets (PPA seller / network operator's parent)
    operator_counterparty_id INT            NULL,   -- who operates/aggregates, when different from owner
    balancing_authority_id  INT             NULL,
    default_zone_id         INT             NULL,   -- settlement zone when the footprint clears as one unit
    total_capacity_mw       DECIMAL(14,2)   NULL,   -- aggregate nameplate (generation) or max coincident draw (load)
    default_load_shape_id   INT             NULL,   -- expected aggregate profile (solar bell, overnight EV charge, ...)
    is_aggregated_dispatch  BIT             NOT NULL DEFAULT 0,     -- 1 = scheduled/settled as a single virtual unit (VPP-style)
    commissioning_date      DATE            NULL,
    is_active               BIT             NOT NULL DEFAULT 1,
    notes                   VARCHAR(500)    NULL,
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,
    updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_energy_footprint      PRIMARY KEY (energy_footprint_id),
    CONSTRAINT uq_ef_code               UNIQUE      (footprint_code),
    CONSTRAINT fk_ef_owner              FOREIGN KEY (owner_counterparty_id)    REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT fk_ef_operator           FOREIGN KEY (operator_counterparty_id) REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT fk_ef_ba                 FOREIGN KEY (balancing_authority_id)   REFERENCES dbo.balancing_authority(balancing_authority_id),
    CONSTRAINT fk_ef_zone               FOREIGN KEY (default_zone_id)          REFERENCES dbo.transmission_zone(zone_id),
    CONSTRAINT fk_ef_load_shape         FOREIGN KEY (default_load_shape_id)    REFERENCES dbo.load_shape_template(load_shape_id)
);
GO
CREATE INDEX ix_ef_type ON dbo.energy_footprint (footprint_type, is_active);
GO

-- ─── 2b. energy_footprint_site — member sites of a footprint ─────────────────
CREATE TABLE dbo.energy_footprint_site (
    footprint_site_id       INT             NOT NULL IDENTITY(1,1),
    energy_footprint_id     INT             NOT NULL,
    site_code               VARCHAR(30)     NOT NULL,
    site_name               VARCHAR(200)    NOT NULL,
    site_type               VARCHAR(30)     NOT NULL
        CONSTRAINT chk_efs_type CHECK (site_type IN (
            'SOLAR_ARRAY',          -- ground-mount utility array
            'ROOFTOP_SOLAR',        -- aggregated C&I / residential rooftop cluster
            'WIND_TURBINE_GROUP',
            'EV_CHARGING_HUB',      -- public fast-charging site
            'EV_DEPOT',             -- fleet depot charging (buses, delivery vans)
            'BATTERY_UNIT',
            'CURTAILABLE_LOAD',
            'OTHER'
        )),
    location_id             INT             NULL,
    zone_id                 INT             NULL,   -- settlement zone when sites settle individually, overriding the footprint default
    capacity_mw             DECIMAL(14,4)   NOT NULL,   -- nameplate export (generation) or max draw (load)
    storage_capacity_mwh    DECIMAL(14,4)   NULL,   -- battery sites
    charger_count           INT             NULL,   -- EV sites: number of charge points
    max_charger_kw          DECIMAL(10,2)   NULL,   -- EV sites: rating of the largest charger
    connector_standard      VARCHAR(20)     NULL
        CONSTRAINT chk_efs_connector CHECK (connector_standard IN (
            'CCS','CHADEMO','NACS','TYPE2','MIXED'
        )),
    technology              VARCHAR(50)     NULL,   -- 'MONO_PV','BIFACIAL_PV','TRACKER_PV','DC_FAST','LFP_BESS', ...
    generation_asset_id     INT             NULL,   -- set when the site is grid-registered as a generation asset in its own right
    site_load_shape_id      INT             NULL,   -- per-site profile, when it differs from the footprint default
    commissioning_date      DATE            NULL,
    decommissioning_date    DATE            NULL,
    is_active               BIT             NOT NULL DEFAULT 1,
    notes                   VARCHAR(500)    NULL,
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,
    updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_energy_footprint_site PRIMARY KEY (footprint_site_id),
    CONSTRAINT uq_efs_code              UNIQUE      (energy_footprint_id, site_code),
    CONSTRAINT fk_efs_footprint         FOREIGN KEY (energy_footprint_id) REFERENCES dbo.energy_footprint(energy_footprint_id),
    CONSTRAINT fk_efs_location          FOREIGN KEY (location_id)         REFERENCES dbo.location(location_id),
    CONSTRAINT fk_efs_zone              FOREIGN KEY (zone_id)             REFERENCES dbo.transmission_zone(zone_id),
    CONSTRAINT fk_efs_generation_asset  FOREIGN KEY (generation_asset_id) REFERENCES dbo.generation_asset(generation_asset_id),
    CONSTRAINT fk_efs_load_shape        FOREIGN KEY (site_load_shape_id)  REFERENCES dbo.load_shape_template(load_shape_id),
    CONSTRAINT chk_efs_capacity         CHECK (capacity_mw > 0),
    CONSTRAINT chk_efs_decommission     CHECK (decommissioning_date IS NULL OR commissioning_date IS NULL OR decommissioning_date >= commissioning_date)
);
GO
CREATE INDEX ix_efs_footprint ON dbo.energy_footprint_site (energy_footprint_id, is_active);
GO

-- ─── Seeds ────────────────────────────────────────────────────────────────────

-- New shaped templates: a solar PV bell curve, an EV overnight-charging curve,
-- and a composite ATC (around-the-clock) shape built by nesting PEAK + OFFPEAK.
INSERT INTO dbo.load_shape_template (shape_code, shape_name, shape_type, applicable_days, start_hour, end_hour, hours_per_day, timezone_basis, description, is_composite, created_by, updated_by)
VALUES
    ('SOLAR_PV',  'Solar PV Generation Shape',   'CUSTOM', 'ALL', NULL, NULL, NULL, 'America/Los_Angeles', 'Hourly bell-curve generation profile for PV; interval factors define the shape.', 0, 'SYSTEM', 'SYSTEM'),
    ('EV_NIGHT',  'EV Overnight Charging Shape', 'CUSTOM', 'ALL', NULL, NULL, NULL, 'Europe/London',       'Charging-network demand profile weighted to off-peak overnight hours.',            0, 'SYSTEM', 'SYSTEM'),
    ('ATC_US',    'US Around-the-Clock',         'CUSTOM', 'ALL', NULL, NULL, NULL, 'America/New_York',    'Composite shape: US peak + US off-peak children cover all hours.',                 1, 'SYSTEM', 'SYSTEM');
GO

-- Solar PV hourly factors (daylight bell, zero overnight)
INSERT INTO dbo.load_shape_interval (load_shape_id, day_type, interval_no, interval_factor, created_by, updated_by)
SELECT ls.load_shape_id, 'ALL', v.interval_no, v.factor, 'SYSTEM', 'SYSTEM'
FROM dbo.load_shape_template ls
CROSS APPLY (VALUES
    (6, 0.05), (7, 0.20), (8, 0.45), (9, 0.70), (10, 0.90), (11, 1.00),
    (12, 1.00), (13, 0.95), (14, 0.85), (15, 0.65), (16, 0.40), (17, 0.15), (18, 0.05)
) AS v(interval_no, factor)
WHERE ls.shape_code = 'SOLAR_PV';
GO

-- EV overnight charging factors (heavy 22:00-06:00, light daytime top-up)
INSERT INTO dbo.load_shape_interval (load_shape_id, day_type, interval_no, interval_factor, created_by, updated_by)
SELECT ls.load_shape_id, 'ALL', v.interval_no, v.factor, 'SYSTEM', 'SYSTEM'
FROM dbo.load_shape_template ls
CROSS APPLY (VALUES
    (0, 0.90), (1, 0.95), (2, 1.00), (3, 1.00), (4, 0.90), (5, 0.70),
    (6, 0.40), (7, 0.20), (8, 0.15), (9, 0.10), (10, 0.10), (11, 0.10),
    (12, 0.15), (13, 0.15), (14, 0.10), (15, 0.10), (16, 0.15), (17, 0.25),
    (18, 0.35), (19, 0.40), (20, 0.45), (21, 0.60), (22, 0.75), (23, 0.85)
) AS v(interval_no, factor)
WHERE ls.shape_code = 'EV_NIGHT';
GO

-- Composite ATC = PEAK_US + OFFPEAK_US (all-year, weight 1 each)
INSERT INTO dbo.load_shape_component (parent_load_shape_id, child_load_shape_id, weight_factor, sequence_no, created_by, updated_by)
SELECT p.load_shape_id, c.load_shape_id, 1, s.seq, 'SYSTEM', 'SYSTEM'
FROM dbo.load_shape_template p
JOIN (VALUES ('PEAK_US', 1), ('OFFPEAK_US', 2)) AS s(child_code, seq) ON 1 = 1
JOIN dbo.load_shape_template c ON c.shape_code = s.child_code
WHERE p.shape_code = 'ATC_US';
GO

-- Illustrative footprints: a CAISO solar portfolio and a GB EV charging network
INSERT INTO dbo.energy_footprint (footprint_code, footprint_name, footprint_type, flow_direction, balancing_authority_id, total_capacity_mw, default_load_shape_id, is_aggregated_dispatch, is_active, created_by, updated_by)
SELECT v.code, v.name, v.ftype, v.direction, ba.balancing_authority_id, v.cap_mw, ls.load_shape_id, v.agg, 1, 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('SOLAR_CA_01', 'California Distributed Solar Portfolio', 'SOLAR_PORTFOLIO',     'GENERATION', 'CAISO', 120.00, 'SOLAR_PV', 1),
    ('EVNET_GB_01', 'GB Motorway Fast-Charging Network',      'EV_CHARGING_NETWORK', 'LOAD',       'NGESO',  45.00, 'EV_NIGHT', 0)
) AS v(code, name, ftype, direction, ba_code, cap_mw, shape_code, agg)
JOIN dbo.balancing_authority ba ON ba.ba_code = v.ba_code
JOIN dbo.load_shape_template ls ON ls.shape_code = v.shape_code;
GO

INSERT INTO dbo.energy_footprint_site (energy_footprint_id, site_code, site_name, site_type, capacity_mw, storage_capacity_mwh, charger_count, max_charger_kw, connector_standard, technology, is_active, created_by, updated_by)
SELECT ef.energy_footprint_id, v.site_code, v.site_name, v.site_type, v.cap_mw, v.storage_mwh, v.chargers, v.max_kw, v.connector, v.tech, 1, 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('SOLAR_CA_01', 'SC-FRESNO-1',  'Fresno Ground-Mount Array',      'SOLAR_ARRAY',     60.0000, NULL,    NULL, NULL,   NULL,    'TRACKER_PV'),
    ('SOLAR_CA_01', 'SC-KERN-1',    'Kern County Bifacial Array',     'SOLAR_ARRAY',     45.0000, NULL,    NULL, NULL,   NULL,    'BIFACIAL_PV'),
    ('SOLAR_CA_01', 'SC-ROOF-LA',   'LA C&I Rooftop Cluster',         'ROOFTOP_SOLAR',   15.0000, NULL,    NULL, NULL,   NULL,    'MONO_PV'),
    ('EVNET_GB_01', 'EV-M1-JCT15',  'M1 Junction 15 Charging Hub',    'EV_CHARGING_HUB', 12.0000, NULL,    32,   350.00, 'CCS',   'DC_FAST'),
    ('EVNET_GB_01', 'EV-M6-JCT10',  'M6 Junction 10 Charging Hub',    'EV_CHARGING_HUB', 10.0000, NULL,    24,   350.00, 'CCS',   'DC_FAST'),
    ('EVNET_GB_01', 'EV-LDN-DEPOT', 'London Bus Depot',               'EV_DEPOT',        23.0000, NULL,    80,   150.00, 'TYPE2', 'DC_FAST')
) AS v(fp_code, site_code, site_name, site_type, cap_mw, storage_mwh, chargers, max_kw, connector, tech)
JOIN dbo.energy_footprint ef ON ef.footprint_code = v.fp_code;
GO

-- Registry entries so the generic master-data UI surfaces the new tables
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, sub_group, description, allow_create, allow_edit, allow_delete, allow_excel_upload, is_enabled, display_order, created_by, updated_by)
VALUES
    ('load_shape_interval',   'Load Shape Intervals',   'Power', 'Markets', 'Per-interval MW weighting under a load shape template — the hourly (or 15/30-min) profile behind shaped products such as solar generation or EV charging demand curves.', 1, 1, 1, 0, 1, 4, 'SYSTEM', 'SYSTEM'),
    ('load_shape_component',  'Load Shape Components',  'Power', 'Markets', 'Nested shape structure — composite parent shapes built from weighted child shapes, optionally scoped to a seasonal month window (e.g. ATC = Peak + Off-Peak).',           1, 1, 1, 0, 1, 5, 'SYSTEM', 'SYSTEM'),
    ('energy_footprint',      'Energy Footprints',      'Power', 'Assets',  'Distributed asset portfolios and networks traded as one unit — solar portfolios, EV charging networks, battery fleets, demand-response aggregations.',                     1, 1, 1, 0, 1, 6, 'SYSTEM', 'SYSTEM'),
    ('energy_footprint_site', 'Energy Footprint Sites', 'Power', 'Assets',  'Member sites of an energy footprint — per-site location, settlement zone, capacity, and technology detail (solar array, EV charging hub, battery unit).',                  1, 1, 1, 0, 1, 7, 'SYSTEM', 'SYSTEM');
GO
