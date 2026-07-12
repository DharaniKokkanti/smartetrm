-- =============================================================================
-- V96 — Commodity-specific master data: Metals warrants/assay, LNG boil-off,
--        Power pnode/ancillary services, Agri moisture/crop-year, and
--        multi-country intercompany/payment-calendar guardrails
-- =============================================================================
-- User supplied a 10-table wishlist across Metals/Oil&LNG/Power/Agri/
-- Intercompany and asked for a careful review against what already exists
-- before building anything ("we might have already added some or missing
-- just one or two columns or missing entirely").
--
-- Findings from that review:
--   1. mst_metal_warrant                 — MISSING ENTIRELY. New table.
--   2. mst_metal_assay_component_rule    — MISSING ENTIRELY. New table.
--   3. mst_terminal_tank_heel            — PARTIAL DUPLICATE. dbo.tank
--      already has heel_volume_m3 (V4, "minimum/unavoidable heel"), which is
--      exactly unpumpable_heel_volume. Only heel_product_id,
--      min_operating_level, max_safe_fill_level were actually missing.
--      Fixed by ALTER TABLE dbo.tank instead of creating a duplicate 1:1
--      table around a heel volume column that already exists.
--   4. mst_lng_boil_off_rule             — COMPLEMENTS, not duplicates,
--      dbo.vessel.guaranteed_boil_off_rate_pct_per_day (V53). That column is
--      a single nameplate/contractual spec per vessel; this table is a real
--      rule set (multiple named rules per vessel AND/OR storage_facility,
--      e.g. laden vs ballast, lab-measured vs guaranteed) that the risk/
--      actualization engines can select from. New table, kept distinct.
--   5. mst_power_pnode                   — MISSING ENTIRELY. New table.
--   6. mst_power_ancillary_service_type  — MISSING ENTIRELY, but explicitly
--      flagged as a known future gap in V11's own header comment
--      ("Ancillary services & capacity market product types ... dedicated
--      reference tables ... are not built yet") — this is that follow-up.
--   7. mst_agri_moisture_discount_scale  — MISSING ENTIRELY. New table.
--      Scoped to commodity_grade_standard (V67), not product, matching that
--      table's own family-level scoping rationale.
--   8. mst_agri_crop_year_lifecycle      — MISSING ENTIRELY. New table.
--   9. mst_intercompany_transfer_rule    — MISSING ENTIRELY. Real gap:
--      trade.is_intercompany / counterparty.is_intercompany (V62) only mark
--      a deal or counterparty as intercompany after the fact; nothing
--      automates the back-to-back leg or its transfer-pricing markup.
--  10. mst_payment_calendar_assignment   — MISSING ENTIRELY. Distinct from
--      trade.payment_calendar_code (single FK per trade, V91/V92): this is
--      the lookup matrix (payment_term x currency x location -> which
--      calendar pair to default to), not a duplicate of the per-trade value.
--
-- Naming/FK conventions applied throughout (matching V86/V87/V95 and the
-- V67/V68/V83 precedent, NOT the user's literal "mst_" prefix, which this
-- schema has never used):
--   - No mst_ prefix; plain dbo.<noun> table names, consistent with every
--     other master data table in this schema.
--   - Every code-shaped reference is a surrogate *_id FK to a real table
--     (country_id -> dbo.country, currency_id -> dbo.currency, etc.), never
--     a bare CHAR/VARCHAR code — the exact class of gap V86/V87/V95 fixed
--     across the rest of the schema.
--   - Fixed-set enums are inline CHECK constraints (matching chk_mb_form,
--     chk_ba_market_type, chk_tank_type, ...), not lookup_value rows.
--   - Standard audit columns (created_at/created_by/updated_at/updated_by)
--     and is_active on every table, matching every other master table added
--     since V59.
--   - Every new table registered in dbo.master_data_table_registry so it is
--     visible on the generic Static Data screen (the exact gap V65 fixed for
--     Power, and the same category of miss the user is checking for here).
-- =============================================================================

USE ETRM_DB;
GO

IF OBJECT_ID('dbo.payment_calendar_assignment', 'U')  IS NOT NULL DROP TABLE dbo.payment_calendar_assignment;
IF OBJECT_ID('dbo.intercompany_transfer_rule', 'U')   IS NOT NULL DROP TABLE dbo.intercompany_transfer_rule;
IF OBJECT_ID('dbo.agri_crop_year_lifecycle', 'U')     IS NOT NULL DROP TABLE dbo.agri_crop_year_lifecycle;
IF OBJECT_ID('dbo.agri_moisture_discount_scale', 'U') IS NOT NULL DROP TABLE dbo.agri_moisture_discount_scale;
IF OBJECT_ID('dbo.power_ancillary_service_type', 'U') IS NOT NULL DROP TABLE dbo.power_ancillary_service_type;
IF OBJECT_ID('dbo.power_pnode', 'U')                  IS NOT NULL DROP TABLE dbo.power_pnode;
IF OBJECT_ID('dbo.lng_boil_off_rule', 'U')            IS NOT NULL DROP TABLE dbo.lng_boil_off_rule;
IF OBJECT_ID('dbo.metal_assay_component_rule', 'U')   IS NOT NULL DROP TABLE dbo.metal_assay_component_rule;
IF OBJECT_ID('dbo.metal_warrant', 'U')                IS NOT NULL DROP TABLE dbo.metal_warrant;
GO

-- =============================================================================
-- 1. METAL_WARRANT
-- Securitized title document for a specific, discrete physical lot in an
-- exchange-approved vault (LME/CME), distinct from generic volumetric
-- storage_facility capacity. Added product_id/metal_brand_id/metal_shape_id
-- so a warrant actually identifies WHAT metal lot it covers (brand+shape
-- alone don't pin down the underlying product/commodity), net_weight_mt so
-- it has a real physical quantity, and holder_counterparty_id so title has
-- an actual current holder — a warrant record with no quantity or holder
-- isn't usable as a title document.
-- =============================================================================
CREATE TABLE dbo.metal_warrant (
    warrant_id              INT             NOT NULL IDENTITY(1,1),
    warrant_number          VARCHAR(50)     NOT NULL,
    facility_id             INT             NOT NULL,   -- exchange-approved vault (dbo.storage_facility, facility_type IN VAULT/WAREHOUSE)
    product_id              INT             NOT NULL,
    metal_brand_id          INT             NOT NULL,
    metal_shape_id          INT             NOT NULL,
    slot_vault_location     VARCHAR(50)     NULL,        -- bin/lot slot number within the vault
    net_weight_mt           DECIMAL(18,4)   NOT NULL,
    warrant_date            DATE            NOT NULL,
    rent_paid_through_date  DATE            NULL,        -- date rent is paid up to; NULL = rent not current. Fixed from the user's "is_rent_paid_to_date BIT" — a paid-through date, not a flag, is what "to date" actually means and what actualization needs.
    is_pledged_collateral   BIT             NOT NULL DEFAULT 0,
    holder_counterparty_id  INT             NULL,        -- current title holder
    is_active               BIT             NOT NULL DEFAULT 1,
    notes                   VARCHAR(500)    NULL,
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,
    updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_metal_warrant       PRIMARY KEY (warrant_id),
    CONSTRAINT uq_metal_warrant_num   UNIQUE      (warrant_number),
    CONSTRAINT fk_mw_facility         FOREIGN KEY (facility_id)            REFERENCES dbo.storage_facility(facility_id),
    CONSTRAINT fk_mw_product          FOREIGN KEY (product_id)             REFERENCES dbo.product(product_id),
    CONSTRAINT fk_mw_brand            FOREIGN KEY (metal_brand_id)         REFERENCES dbo.metal_brand(metal_brand_id),
    CONSTRAINT fk_mw_shape            FOREIGN KEY (metal_shape_id)         REFERENCES dbo.metal_shape(metal_shape_id),
    CONSTRAINT fk_mw_holder           FOREIGN KEY (holder_counterparty_id) REFERENCES dbo.counterparty(counterparty_id)
);
GO
CREATE INDEX ix_mw_facility ON dbo.metal_warrant (facility_id, is_active);
CREATE INDEX ix_mw_holder   ON dbo.metal_warrant (holder_counterparty_id, is_active);
GO

-- =============================================================================
-- 2. METAL_ASSAY_COMPONENT_RULE
-- Financial scaling rules applied to concentrate actualizations to calculate
-- premiums/penalties from lab assays. Added penalty_currency_id/penalty_uom_id
-- — a "penalty per ppm over base" figure is meaningless without a currency
-- and the unit basis (per dmt, per lb) it's quoted against.
-- =============================================================================
CREATE TABLE dbo.metal_assay_component_rule (
    rule_id                     INT             NOT NULL IDENTITY(1,1),
    product_id                  INT             NOT NULL,
    element_code                VARCHAR(10)     NOT NULL,   -- 'CU','AS','PB', etc. — chemical symbol, not a lookup_value (fixed periodic-table set)
    element_type                VARCHAR(20)     NOT NULL
        CONSTRAINT chk_marc_element_type CHECK (element_type IN (
            'PAYABLE','PENALTY','IMPURITY'
        )),
    base_content_pct            DECIMAL(9,5)    NOT NULL,
    rejection_threshold_pct     DECIMAL(9,5)    NULL,
    penalty_per_ppm_over_base   DECIMAL(18,6)   NULL,
    penalty_currency_id         INT             NULL,
    penalty_uom_id              INT             NULL,
    is_active                   BIT             NOT NULL DEFAULT 1,
    notes                       VARCHAR(500)    NULL,
    created_at                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                  VARCHAR(100)    NOT NULL,
    updated_at                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                  VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_metal_assay_component_rule PRIMARY KEY (rule_id),
    CONSTRAINT uq_marc_product_element       UNIQUE      (product_id, element_code),
    CONSTRAINT fk_marc_product                FOREIGN KEY (product_id)          REFERENCES dbo.product(product_id),
    CONSTRAINT fk_marc_currency                FOREIGN KEY (penalty_currency_id) REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_marc_uom                     FOREIGN KEY (penalty_uom_id)      REFERENCES dbo.unit_of_measure(uom_id)
);
GO
CREATE INDEX ix_marc_product ON dbo.metal_assay_component_rule (product_id, is_active);
GO

-- =============================================================================
-- 3. TANK — heel fields completing what V4 started
-- dbo.tank already has heel_volume_m3 (the unpumpable dead-stock volume
-- itself). Only the operating envelope and heel-product identity were
-- actually missing, so those are added directly to tank rather than via a
-- redundant 1:1 "tank_heel" table duplicating heel_volume_m3.
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.tank') AND name = 'heel_product_id')
  ALTER TABLE dbo.tank ADD
    heel_product_id        INT             NULL,   -- product actually sitting in the heel (may differ from primary_product_id after a service change)
    min_operating_level_m3 DECIMAL(12,3)   NULL,
    max_safe_fill_level_m3 DECIMAL(12,3)   NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_tank_heel_product')
  ALTER TABLE dbo.tank ADD CONSTRAINT fk_tank_heel_product FOREIGN KEY (heel_product_id) REFERENCES dbo.product(product_id);
GO

-- =============================================================================
-- 4. LNG_BOIL_OFF_RULE
-- Cryogenic transit/storage vaporization loss curves for the risk and
-- actualization engines. Distinct from vessel.guaranteed_boil_off_rate_pct_
-- per_day (V53) — that's a single per-vessel nameplate spec; this is a rule
-- set, scoped to a vessel and/or a storage facility (both NULL = a generic
-- default rule), so multiple named rules (laden vs ballast, lab-measured vs
-- contractual-guaranteed) can be modeled and selected per calculation.
-- =============================================================================
CREATE TABLE dbo.lng_boil_off_rule (
    rule_id                      INT             NOT NULL IDENTITY(1,1),
    rule_code                    VARCHAR(30)     NOT NULL,
    rule_name                    VARCHAR(150)    NOT NULL,
    vessel_id                    INT             NULL,
    facility_id                  INT             NULL,
    daily_boil_off_rate_pct      DECIMAL(6,4)    NOT NULL,
    is_forcing_boil_off_allowed  BIT             NOT NULL DEFAULT 0,
    effective_from               DATE            NULL,
    effective_to                 DATE            NULL,
    is_active                    BIT             NOT NULL DEFAULT 1,
    notes                        VARCHAR(500)    NULL,
    created_at                   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                   VARCHAR(100)    NOT NULL,
    updated_at                   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                   VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_lng_boil_off_rule     PRIMARY KEY (rule_id),
    CONSTRAINT uq_lbor_code              UNIQUE      (rule_code),
    CONSTRAINT fk_lbor_vessel             FOREIGN KEY (vessel_id)   REFERENCES dbo.vessel(vessel_id),
    CONSTRAINT fk_lbor_facility            FOREIGN KEY (facility_id) REFERENCES dbo.storage_facility(facility_id),
    CONSTRAINT chk_lbor_effective_dates       CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from)
);
GO
CREATE INDEX ix_lbor_vessel   ON dbo.lng_boil_off_rule (vessel_id, is_active);
CREATE INDEX ix_lbor_facility ON dbo.lng_boil_off_rule (facility_id, is_active);
GO

-- =============================================================================
-- 5. POWER_PNODE
-- Low-level LMP settlement granularity — thousands of physical grid
-- injection/withdrawal nodes under a balancing authority (ISO/RTO standard).
-- =============================================================================
CREATE TABLE dbo.power_pnode (
    pnode_id                INT             NOT NULL IDENTITY(1,1),
    pnode_market_name        VARCHAR(50)     NOT NULL,   -- ISO identifier string
    balancing_authority_id   INT             NOT NULL,
    transmission_zone_id     INT             NULL,
    node_type                VARCHAR(20)     NOT NULL
        CONSTRAINT chk_pnode_type CHECK (node_type IN (
            'HUB','INTERFACE','BUS','ZONE'
        )),
    is_active                BIT             NOT NULL DEFAULT 1,
    notes                    VARCHAR(500)    NULL,
    created_at               DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by               VARCHAR(100)    NOT NULL,
    updated_at                DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                VARCHAR(100)   NOT NULL,

    CONSTRAINT pk_power_pnode          PRIMARY KEY (pnode_id),
    CONSTRAINT uq_pnode_ba_name             UNIQUE      (balancing_authority_id, pnode_market_name),
    CONSTRAINT fk_pnode_ba                   FOREIGN KEY (balancing_authority_id) REFERENCES dbo.balancing_authority(balancing_authority_id),
    CONSTRAINT fk_pnode_zone                   FOREIGN KEY (transmission_zone_id)  REFERENCES dbo.transmission_zone(zone_id)
);
GO
CREATE INDEX ix_pnode_ba ON dbo.power_pnode (balancing_authority_id, is_active);
GO

-- =============================================================================
-- 6. POWER_ANCILLARY_SERVICE_TYPE
-- Grid-reliability products traded alongside standard MWh power blocks.
-- This is the follow-up V11 explicitly flagged as not-yet-built when it
-- added power_product_detail.is_ancillary_service.
-- =============================================================================
CREATE TABLE dbo.power_ancillary_service_type (
    service_type_id          INT             NOT NULL IDENTITY(1,1),
    service_code             VARCHAR(30)     NOT NULL,   -- 'SPINNING_RESERVE','REG_UP','VOLTAGE_SUPPORT'
    service_name             VARCHAR(150)    NOT NULL,
    balancing_authority_id   INT             NOT NULL,
    description              VARCHAR(500)    NULL,
    is_active                BIT             NOT NULL DEFAULT 1,
    created_at               DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by               VARCHAR(100)    NOT NULL,
    updated_at               DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by               VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_power_ancillary_service_type PRIMARY KEY (service_type_id),
    CONSTRAINT uq_past_ba_code                     UNIQUE      (balancing_authority_id, service_code),
    CONSTRAINT fk_past_ba                            FOREIGN KEY (balancing_authority_id) REFERENCES dbo.balancing_authority(balancing_authority_id)
);
GO
CREATE INDEX ix_past_ba ON dbo.power_ancillary_service_type (balancing_authority_id, is_active);
GO

-- Seed: real PJM/ERCOT ancillary products against the BAs seeded in V11.
INSERT INTO dbo.power_ancillary_service_type (service_code, service_name, balancing_authority_id, description, created_by, updated_by)
SELECT v.service_code, v.service_name, ba.balancing_authority_id, v.description, 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('PJM',   'SPINNING_RESERVE', 'Synchronized Reserve',        'Online generation capable of responding within 10 minutes to a system contingency.'),
    ('PJM',   'REG_UP',           'Regulation Up',                'AGC-dispatched capacity that increases output to follow system frequency.'),
    ('PJM',   'REG_DOWN',         'Regulation Down',              'AGC-dispatched capacity that decreases output to follow system frequency.'),
    ('ERCOT', 'RRS',              'Responsive Reserve Service',   'Fast-responding reserve (10 minutes) for large frequency deviations.'),
    ('ERCOT', 'REGUP',            'Regulation Up Service',        'ERCOT AGC regulation-up ancillary service.')
) AS v(ba_code, service_code, service_name, description)
JOIN dbo.balancing_authority ba ON ba.ba_code = v.ba_code
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.power_ancillary_service_type p
    WHERE p.balancing_authority_id = ba.balancing_authority_id AND p.service_code = v.service_code
);
GO

-- =============================================================================
-- 7. AGRI_MOISTURE_DISCOUNT_SCALE
-- Connects to weighbridge actualization loops; financial weight shrinkage
-- and pricing penalties based on grain water content. Scoped to
-- commodity_grade_standard (V67), the same family-level scoping V67 itself
-- uses, rather than product directly.
-- =============================================================================
CREATE TABLE dbo.agri_moisture_discount_scale (
    scale_id                     INT             NOT NULL IDENTITY(1,1),
    grade_standard_id            INT             NOT NULL,
    moisture_pct_min              DECIMAL(5,2)    NOT NULL,
    moisture_pct_max              DECIMAL(5,2)    NOT NULL,
    price_discount_per_uom         DECIMAL(10,4)   NOT NULL,
    discount_currency_id             INT             NOT NULL,
    discount_uom_id                    INT             NOT NULL,
    weight_shrinkage_factor_pct           DECIMAL(6,4)    NULL,
    is_active                               BIT             NOT NULL DEFAULT 1,
    notes                                      VARCHAR(500)    NULL,
    created_at                                   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                   VARCHAR(100)    NOT NULL,
    updated_at                                     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                     VARCHAR(100)  NOT NULL,

    CONSTRAINT pk_agri_moisture_discount_scale PRIMARY KEY (scale_id),
    CONSTRAINT uq_amds_grade_range                  UNIQUE      (grade_standard_id, moisture_pct_min, moisture_pct_max),
    CONSTRAINT fk_amds_grade                          FOREIGN KEY (grade_standard_id)  REFERENCES dbo.commodity_grade_standard(grade_standard_id),
    CONSTRAINT fk_amds_currency                         FOREIGN KEY (discount_currency_id) REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_amds_uom                                FOREIGN KEY (discount_uom_id)      REFERENCES dbo.unit_of_measure(uom_id),
    CONSTRAINT chk_amds_range                               CHECK (moisture_pct_max > moisture_pct_min)
);
GO
CREATE INDEX ix_amds_grade ON dbo.agri_moisture_discount_scale (grade_standard_id, is_active);
GO

-- =============================================================================
-- 8. AGRI_CROP_YEAR_LIFECYCLE
-- Hard time boundaries and rolls for old-crop vs new-crop futures and
-- physical cash market spreads. geography_country_id fixed to country_id
-- against dbo.country (V86), matching the surrogate-FK convention V95
-- applied everywhere else rather than introducing a fresh bare code column.
-- =============================================================================
CREATE TABLE dbo.agri_crop_year_lifecycle (
    lifecycle_id             INT             NOT NULL IDENTITY(1,1),
    commodity_id              INT             NOT NULL,
    country_id                  INT             NOT NULL,
    crop_year_label               VARCHAR(20)     NOT NULL,   -- '2026/2027'
    harvest_start_date               DATE            NOT NULL,
    harvest_end_date                    DATE            NOT NULL,
    regulatory_cutoff_date                 DATE            NULL,
    is_active                                BIT             NOT NULL DEFAULT 1,
    notes                                       VARCHAR(500)    NULL,
    created_at                                     DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                     VARCHAR(100)    NOT NULL,
    updated_at                                       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                       VARCHAR(100)  NOT NULL,

    CONSTRAINT pk_agri_crop_year_lifecycle PRIMARY KEY (lifecycle_id),
    CONSTRAINT uq_acyl_commodity_country_year   UNIQUE      (commodity_id, country_id, crop_year_label),
    CONSTRAINT fk_acyl_commodity                  FOREIGN KEY (commodity_id) REFERENCES dbo.commodity(commodity_id),
    CONSTRAINT fk_acyl_country                      FOREIGN KEY (country_id)   REFERENCES dbo.country(country_id),
    CONSTRAINT chk_acyl_harvest_dates                 CHECK (harvest_end_date >= harvest_start_date)
);
GO
CREATE INDEX ix_acyl_commodity ON dbo.agri_crop_year_lifecycle (commodity_id, country_id, is_active);
GO

-- =============================================================================
-- 9. INTERCOMPANY_TRANSFER_RULE
-- Automates the matching back-to-back internal transfer deal whenever the
-- central desk passes position/risk to a country business unit. Genuinely
-- new: trade.is_intercompany and counterparty.is_intercompany (V62) only
-- flag a deal/counterparty as intercompany after the fact; nothing existing
-- drives the automatic booking or its markup. Added markup_currency_id — a
-- FLAT markup_value is meaningless without a currency.
-- =============================================================================
CREATE TABLE dbo.intercompany_transfer_rule (
    rule_id                        INT             NOT NULL IDENTITY(1,1),
    source_legal_entity_id          INT             NOT NULL,
    destination_legal_entity_id      INT             NOT NULL,
    transfer_pricing_markup_type       VARCHAR(20)     NOT NULL
        CONSTRAINT chk_itr_markup_type CHECK (transfer_pricing_markup_type IN (
            'FLAT','PERCENT','INDEX_OFFSET'
        )),
    markup_value                          DECIMAL(18,6)   NOT NULL,
    markup_currency_id                      INT             NULL,   -- required in practice when markup_type = FLAT; not DB-enforced (percent/index-offset rules have no currency)
    automatic_booking_enabled                  BIT             NOT NULL DEFAULT 0,
    is_active                                     BIT             NOT NULL DEFAULT 1,
    notes                                            VARCHAR(500)    NULL,
    created_at                                          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                          VARCHAR(100)    NOT NULL,
    updated_at                                            DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                            VARCHAR(100)  NOT NULL,

    CONSTRAINT pk_intercompany_transfer_rule PRIMARY KEY (rule_id),
    CONSTRAINT uq_itr_source_dest                 UNIQUE      (source_legal_entity_id, destination_legal_entity_id),
    CONSTRAINT fk_itr_source                        FOREIGN KEY (source_legal_entity_id)      REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_itr_dest                            FOREIGN KEY (destination_legal_entity_id) REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_itr_currency                          FOREIGN KEY (markup_currency_id)          REFERENCES dbo.currency(currency_id),
    CONSTRAINT chk_itr_source_ne_dest                     CHECK (source_legal_entity_id <> destination_legal_entity_id)
);
GO
CREATE INDEX ix_itr_source ON dbo.intercompany_transfer_rule (source_legal_entity_id, is_active);
GO

-- =============================================================================
-- 10. PAYMENT_CALENDAR_ASSIGNMENT
-- Junction matrix mapping multi-currency cash obligations to the right
-- holiday-calendar pair, preventing settlement date miscalculations (e.g.
-- cross-referencing US banking holidays with the local delivery-country
-- calendar). Distinct from trade.payment_calendar_code (V91/V92), which is
-- the single resolved calendar stamped on one trade — this is the lookup
-- matrix that value should be defaulted from.
-- =============================================================================
CREATE TABLE dbo.payment_calendar_assignment (
    assignment_id                    INT             NOT NULL IDENTITY(1,1),
    payment_term_id                   INT             NOT NULL,
    currency_id                        INT             NOT NULL,
    location_id                         INT             NULL,   -- NULL = currency-level default; non-NULL = location-specific override
    primary_holiday_calendar_id            INT             NOT NULL,
    secondary_holiday_calendar_id            INT             NULL,
    is_active                                  BIT             NOT NULL DEFAULT 1,
    notes                                          VARCHAR(500)    NULL,
    created_at                                        DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                        VARCHAR(100)    NOT NULL,
    updated_at                                          DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                          VARCHAR(100)  NOT NULL,

    CONSTRAINT pk_payment_calendar_assignment PRIMARY KEY (assignment_id),
    CONSTRAINT uq_pca_term_ccy_loc                  UNIQUE      (payment_term_id, currency_id, location_id),
    CONSTRAINT fk_pca_term                            FOREIGN KEY (payment_term_id)                 REFERENCES dbo.payment_term(payment_term_id),
    CONSTRAINT fk_pca_currency                          FOREIGN KEY (currency_id)                      REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_pca_location                            FOREIGN KEY (location_id)                      REFERENCES dbo.location(location_id),
    CONSTRAINT fk_pca_primary_cal                           FOREIGN KEY (primary_holiday_calendar_id)      REFERENCES dbo.holiday_calendar(calendar_id),
    CONSTRAINT fk_pca_secondary_cal                           FOREIGN KEY (secondary_holiday_calendar_id)    REFERENCES dbo.holiday_calendar(calendar_id),
    CONSTRAINT chk_pca_cal_distinct                             CHECK (secondary_holiday_calendar_id IS NULL OR secondary_holiday_calendar_id <> primary_holiday_calendar_id)
);
GO
CREATE INDEX ix_pca_term_ccy ON dbo.payment_calendar_assignment (payment_term_id, currency_id, is_active);
GO

-- =============================================================================
-- Register the 9 new tables in master_data_table_registry (tank's new columns
-- ride along on the existing tank UI, no separate registry row needed).
-- =============================================================================
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
SELECT v.table_name, v.display_name, v.module_group, v.allow_create, v.allow_edit, v.allow_delete, v.allow_excel_upload, v.display_order, 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('metal_warrant',                'Metal Warrants',                'Products & Markets',       1, 1, 0, 0, 20),
    ('metal_assay_component_rule',   'Metal Assay Component Rules',   'Products & Markets',       1, 1, 1, 0, 21),
    ('lng_boil_off_rule',            'LNG Boil-Off Rules',            'Freight & Shipping',       1, 1, 1, 0, 20),
    ('power_pnode',                  'Power Pricing Nodes',           'Power & Energy',           1, 1, 1, 0, 10),
    ('power_ancillary_service_type', 'Power Ancillary Service Types', 'Power & Energy',           1, 1, 1, 0, 11),
    ('agri_moisture_discount_scale', 'Agri Moisture Discount Scales', 'Products & Markets',       1, 1, 1, 0, 22),
    ('agri_crop_year_lifecycle',     'Agri Crop Year Lifecycle',      'Products & Markets',       1, 1, 1, 0, 23),
    ('intercompany_transfer_rule',   'Intercompany Transfer Rules',   'Counterparties & Agreements', 1, 1, 1, 0, 10),
    ('payment_calendar_assignment',  'Payment Calendar Assignments',  'Calendar & Periods',       1, 1, 1, 0, 5)
) AS v(table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.master_data_table_registry r WHERE r.table_name = v.table_name
);
GO

PRINT '============================================================';
PRINT 'V96 — COMMODITY-SPECIFIC MASTER DATA APPLIED';
PRINT '  NEW: metal_warrant, metal_assay_component_rule, lng_boil_off_rule,';
PRINT '       power_pnode, power_ancillary_service_type,';
PRINT '       agri_moisture_discount_scale, agri_crop_year_lifecycle,';
PRINT '       intercompany_transfer_rule, payment_calendar_assignment.';
PRINT '  ALTERED: tank (heel_product_id, min_operating_level_m3, max_safe_fill_level_m3)';
PRINT '           — heel_volume_m3 already existed since V4, avoided duplicating it.';
PRINT '  All 9 new tables registered in master_data_table_registry.';
PRINT '============================================================';
GO
