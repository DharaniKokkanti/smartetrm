-- =============================================================================
-- ETRM SYSTEM — FIELD-LEVEL PERMISSION SYSTEM
-- SQL Server 2022 | V26 | June 2026
-- =============================================================================
-- Run AFTER: V25__pricing_basis_uom_conversion_spec_additions.sql
-- =============================================================================
-- DESIGN
--   Two-layer field permission model:
--
--   LAYER 1 — object_lock_rule (Developer/BA owned, Flyway-only)
--     When an entity reaches a lifecycle state (e.g. CONFIRMED, INVOICED),
--     specific fields are automatically locked to READ_ONLY or HIDDEN.
--     Clients cannot modify these rules — they are architecture decisions.
--
--   LAYER 2 — field_permission_profile + field_permission_rule (Client Admin)
--     Client admins assign a permission profile to each user_role.
--     Each profile specifies per-field access: EDIT | VIEW | HIDDEN.
--     Profiles are scoped to one screen.
--
--   MERGE RULE: effective = min(layer1, layer2)
--     HIDDEN < VIEW < EDIT — the most restrictive always wins.
--     is_required_field=1 fields cannot be set below VIEW by either layer.
-- =============================================================================

-- ── screen_field_registry ─────────────────────────────────────────────────────
-- Developer-seeded catalogue of every configurable field on every screen.
CREATE TABLE dbo.screen_field_registry (
    field_id            INT             IDENTITY(1,1)   NOT NULL,
    screen_code         VARCHAR(100)    NOT NULL,
    field_key           VARCHAR(200)    NOT NULL,
    field_label         VARCHAR(200)    NOT NULL,
    field_group         VARCHAR(100)    NULL,
    is_required_field   BIT             NOT NULL    DEFAULT 0,
    sort_order          INT             NOT NULL    DEFAULT 0,
    is_active           BIT             NOT NULL    DEFAULT 1,
    CONSTRAINT pk_sfr           PRIMARY KEY (field_id),
    CONSTRAINT uq_sfr_key       UNIQUE (screen_code, field_key)
);
GO

-- ── object_lock_rule ──────────────────────────────────────────────────────────
-- Layer 1: lifecycle-driven locks. Flyway-only — not editable via admin UI.
CREATE TABLE dbo.object_lock_rule (
    lock_rule_id        INT             IDENTITY(1,1)   NOT NULL,
    screen_code         VARCHAR(100)    NOT NULL,
    field_key           VARCHAR(200)    NOT NULL,       -- '*' means all fields on this screen
    condition_type      VARCHAR(50)     NOT NULL,       -- TRADE_STATUS | HAS_INVOICE | HAS_COST | HAS_SHIPMENT | TRADE_TYPE
    condition_values    VARCHAR(500)    NOT NULL,       -- comma-separated trigger values e.g. 'CONFIRMED,MATURED,CLOSED'
    locked_to           VARCHAR(10)     NOT NULL,       -- VIEW | HIDDEN
    lock_reason         VARCHAR(500)    NULL,
    sort_order          INT             NOT NULL    DEFAULT 0,
    is_active           BIT             NOT NULL    DEFAULT 1,
    CONSTRAINT pk_olr           PRIMARY KEY (lock_rule_id),
    CONSTRAINT chk_olr_locked   CHECK (locked_to IN ('VIEW', 'HIDDEN'))
);
GO

-- ── field_permission_profile ──────────────────────────────────────────────────
-- A named configuration profile scoped to one screen. Client admin creates these.
CREATE TABLE dbo.field_permission_profile (
    profile_id          INT             IDENTITY(1,1)   NOT NULL,
    profile_code        VARCHAR(100)    NOT NULL,
    profile_name        VARCHAR(200)    NOT NULL,
    description         VARCHAR(500)    NULL,
    screen_code         VARCHAR(100)    NOT NULL,
    is_active           BIT             NOT NULL    DEFAULT 1,
    created_at          DATETIME2       NOT NULL    DEFAULT SYSDATETIME(),
    created_by          VARCHAR(100)    NOT NULL    DEFAULT 'SYSTEM',
    updated_at          DATETIME2       NOT NULL    DEFAULT SYSDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL    DEFAULT 'SYSTEM',
    CONSTRAINT pk_fpp           PRIMARY KEY (profile_id),
    CONSTRAINT uq_fpp_code      UNIQUE (profile_code)
);
GO

-- ── field_permission_rule ─────────────────────────────────────────────────────
-- Per-profile, per-field access level. One row per field per profile.
CREATE TABLE dbo.field_permission_rule (
    rule_id             INT             IDENTITY(1,1)   NOT NULL,
    profile_id          INT             NOT NULL,
    field_id            INT             NOT NULL,
    field_permission    VARCHAR(10)     NOT NULL    DEFAULT 'EDIT',  -- EDIT | VIEW | HIDDEN
    CONSTRAINT pk_fpr               PRIMARY KEY (rule_id),
    CONSTRAINT uq_fpr_profile_field UNIQUE (profile_id, field_id),
    CONSTRAINT fk_fpr_profile       FOREIGN KEY (profile_id)    REFERENCES dbo.field_permission_profile(profile_id),
    CONSTRAINT fk_fpr_field         FOREIGN KEY (field_id)      REFERENCES dbo.screen_field_registry(field_id),
    CONSTRAINT chk_fpr_permission   CHECK (field_permission IN ('EDIT', 'VIEW', 'HIDDEN'))
);
GO

-- ── role_field_profile ────────────────────────────────────────────────────────
-- Links a user_role to a field_permission_profile for a screen.
CREATE TABLE dbo.role_field_profile (
    mapping_id          INT             IDENTITY(1,1)   NOT NULL,
    role_id             INT             NOT NULL,
    profile_id          INT             NOT NULL,
    CONSTRAINT pk_rfp               PRIMARY KEY (mapping_id),
    CONSTRAINT uq_rfp_role_profile  UNIQUE (role_id, profile_id),
    CONSTRAINT fk_rfp_role          FOREIGN KEY (role_id)       REFERENCES dbo.user_role(role_id),
    CONSTRAINT fk_rfp_profile       FOREIGN KEY (profile_id)    REFERENCES dbo.field_permission_profile(profile_id)
);
GO

-- =============================================================================
-- SEED: TRADE_BLOTTER screen fields
-- field_key matches the React Form.Item name attribute (dot-notation for nested)
-- =============================================================================
INSERT INTO dbo.screen_field_registry (screen_code, field_key, field_label, field_group, is_required_field, sort_order) VALUES
    -- Core Trade
    ('TRADE_BLOTTER', 'tradeDate',              'Trade Date',               'Core Trade',       1, 10),
    ('TRADE_BLOTTER', 'executionDatetime',       'Execution Date/Time',      'Core Trade',       0, 20),
    ('TRADE_BLOTTER', 'commodityType',           'Commodity Type',           'Core Trade',       1, 30),
    ('TRADE_BLOTTER', 'tradeType',               'Trade Type',               'Core Trade',       1, 40),
    ('TRADE_BLOTTER', 'direction',               'Direction (Buy/Sell)',      'Core Trade',       1, 50),
    ('TRADE_BLOTTER', 'status',                  'Trade Status',             'Core Trade',       1, 60),
    ('TRADE_BLOTTER', 'notes',                   'Notes',                    'Core Trade',       0, 70),
    -- Counterparty & Book
    ('TRADE_BLOTTER', 'counterpartyId',          'Counterparty',             'Counterparty & Book', 1, 80),
    ('TRADE_BLOTTER', 'traderId',                'Trader',                   'Counterparty & Book', 1, 90),
    ('TRADE_BLOTTER', 'bookId',                  'Book',                     'Counterparty & Book', 1, 100),
    ('TRADE_BLOTTER', 'legalEntityId',           'Legal Entity',             'Counterparty & Book', 1, 110),
    -- Product & Market
    ('TRADE_BLOTTER', 'productId',               'Product',                  'Product & Market', 0, 120),
    ('TRADE_BLOTTER', 'marketId',                'Market',                   'Product & Market', 0, 130),
    ('TRADE_BLOTTER', 'pricingRuleId',           'Pricing Rule',             'Product & Market', 0, 140),
    ('TRADE_BLOTTER', 'periodCode',              'Delivery Period',          'Product & Market', 0, 150),
    -- Quantity & Price
    ('TRADE_BLOTTER', 'quantity',                'Quantity',                 'Quantity & Price', 1, 160),
    ('TRADE_BLOTTER', 'uomCode',                 'Unit of Measure',          'Quantity & Price', 1, 170),
    ('TRADE_BLOTTER', 'price',                   'Price',                    'Quantity & Price', 1, 180),
    ('TRADE_BLOTTER', 'currencyCode',            'Currency',                 'Quantity & Price', 1, 190),
    ('TRADE_BLOTTER', 'settlementType',          'Settlement Type',          'Quantity & Price', 1, 200),
    -- Logistics
    ('TRADE_BLOTTER', 'incotermCode',            'Incoterm',                 'Logistics',        0, 210),
    ('TRADE_BLOTTER', 'deliveryLocationCode',    'Delivery Location',        'Logistics',        0, 220),
    -- Oil Details
    ('TRADE_BLOTTER', 'oilDetail.crudeGrade',        'Crude Grade',          'Oil Details',      0, 300),
    ('TRADE_BLOTTER', 'oilDetail.apiGravity',        'API Gravity',          'Oil Details',      0, 310),
    ('TRADE_BLOTTER', 'oilDetail.sulphurPct',        'Sulphur %',            'Oil Details',      0, 320),
    ('TRADE_BLOTTER', 'oilDetail.loadLocationCode',  'Load Port',            'Oil Details',      0, 330),
    ('TRADE_BLOTTER', 'oilDetail.dischargeLocationCode', 'Discharge Port',   'Oil Details',      0, 340),
    ('TRADE_BLOTTER', 'oilDetail.vesselName',        'Vessel',               'Oil Details',      0, 350),
    ('TRADE_BLOTTER', 'oilDetail.laycanStart',       'Laycan Start',         'Oil Details',      0, 360),
    ('TRADE_BLOTTER', 'oilDetail.laycanEnd',         'Laycan End',           'Oil Details',      0, 370),
    ('TRADE_BLOTTER', 'oilDetail.blDate',            'B/L Date',             'Oil Details',      0, 380),
    ('TRADE_BLOTTER', 'oilDetail.norsTenderedDate',  'NOR Tendered',         'Oil Details',      0, 390),
    ('TRADE_BLOTTER', 'oilDetail.codDate',           'COD Date',             'Oil Details',      0, 400),
    ('TRADE_BLOTTER', 'oilDetail.pipelineId',        'Pipeline',             'Oil Details',      0, 410),
    -- Gas Details
    ('TRADE_BLOTTER', 'gasDetail.deliveryHub',       'Delivery Hub',         'Gas Details',      0, 500),
    ('TRADE_BLOTTER', 'gasDetail.gasDeliveryStart',  'Gas Delivery Start',   'Gas Details',      0, 510),
    ('TRADE_BLOTTER', 'gasDetail.gasDeliveryEnd',    'Gas Delivery End',     'Gas Details',      0, 520),
    ('TRADE_BLOTTER', 'gasDetail.swingPct',          'Swing %',              'Gas Details',      0, 530),
    ('TRADE_BLOTTER', 'gasDetail.gasDayType',        'Gas Day Type',         'Gas Details',      0, 540),
    ('TRADE_BLOTTER', 'gasDetail.nominationType',    'Nomination Type',      'Gas Details',      0, 550),
    -- Power Details
    ('TRADE_BLOTTER', 'powerDetail.loadType',        'Load Type',            'Power Details',    0, 600),
    ('TRADE_BLOTTER', 'powerDetail.mwCapacity',      'MW Capacity',          'Power Details',    0, 610),
    ('TRADE_BLOTTER', 'powerDetail.mwhVolume',       'MWh Volume',           'Power Details',    0, 620),
    ('TRADE_BLOTTER', 'powerDetail.gridNodeCode',    'Grid Node',            'Power Details',    0, 630),
    ('TRADE_BLOTTER', 'powerDetail.interconnector',  'Interconnector',       'Power Details',    0, 640),
    ('TRADE_BLOTTER', 'powerDetail.deliveryStart',   'Delivery Start',       'Power Details',    0, 650),
    ('TRADE_BLOTTER', 'powerDetail.deliveryEnd',     'Delivery End',         'Power Details',    0, 660),
    -- LNG Details
    ('TRADE_BLOTTER', 'lngDetail.loadTerminalCode',      'Load Terminal',    'LNG Details',      0, 700),
    ('TRADE_BLOTTER', 'lngDetail.dischargeTerminalCode', 'Discharge Terminal','LNG Details',     0, 710),
    ('TRADE_BLOTTER', 'lngDetail.cargoVolumeMmbtu',      'Cargo Volume MMBTU','LNG Details',    0, 720),
    ('TRADE_BLOTTER', 'lngDetail.priceBasis',            'Price Basis',      'LNG Details',      0, 730),
    -- Metals Details
    ('TRADE_BLOTTER', 'metalsDetail.metalGrade',         'Metal Grade',      'Metals Details',   0, 800),
    ('TRADE_BLOTTER', 'metalsDetail.shape',              'Shape',            'Metals Details',   0, 810),
    ('TRADE_BLOTTER', 'metalsDetail.lmeDate',            'LME Date',         'Metals Details',   0, 820),
    ('TRADE_BLOTTER', 'metalsDetail.warehouseLocationCode', 'Warehouse',     'Metals Details',   0, 830),
    ('TRADE_BLOTTER', 'metalsDetail.brand',              'Brand',            'Metals Details',   0, 840),
    -- Agri Details
    ('TRADE_BLOTTER', 'agriDetail.cropYear',             'Crop Year',        'Agri Details',     0, 900),
    ('TRADE_BLOTTER', 'agriDetail.gradeQuality',         'Grade / Quality',  'Agri Details',     0, 910),
    ('TRADE_BLOTTER', 'agriDetail.originCountry',        'Origin Country',   'Agri Details',     0, 920),
    ('TRADE_BLOTTER', 'agriDetail.deliveryBasis',        'Delivery Basis',   'Agri Details',     0, 930);
GO

-- =============================================================================
-- SEED: Layer 1 object lock rules for TRADE_BLOTTER
-- =============================================================================

-- When trade is CONFIRMED: lock commercial terms (price, qty, counterparty, etc.)
INSERT INTO dbo.object_lock_rule (screen_code, field_key, condition_type, condition_values, locked_to, lock_reason, sort_order) VALUES
    ('TRADE_BLOTTER', 'counterpartyId',       'TRADE_STATUS', 'CONFIRMED,MATURED,CLOSED', 'VIEW', 'Trade is confirmed — commercial terms are locked', 10),
    ('TRADE_BLOTTER', 'traderId',             'TRADE_STATUS', 'CONFIRMED,MATURED,CLOSED', 'VIEW', 'Trade is confirmed — commercial terms are locked', 20),
    ('TRADE_BLOTTER', 'bookId',               'TRADE_STATUS', 'CONFIRMED,MATURED,CLOSED', 'VIEW', 'Trade is confirmed — commercial terms are locked', 30),
    ('TRADE_BLOTTER', 'legalEntityId',        'TRADE_STATUS', 'CONFIRMED,MATURED,CLOSED', 'VIEW', 'Trade is confirmed — commercial terms are locked', 40),
    ('TRADE_BLOTTER', 'commodityType',        'TRADE_STATUS', 'CONFIRMED,MATURED,CLOSED', 'VIEW', 'Trade is confirmed — commercial terms are locked', 50),
    ('TRADE_BLOTTER', 'tradeType',            'TRADE_STATUS', 'CONFIRMED,MATURED,CLOSED', 'VIEW', 'Trade is confirmed — commercial terms are locked', 60),
    ('TRADE_BLOTTER', 'direction',            'TRADE_STATUS', 'CONFIRMED,MATURED,CLOSED', 'VIEW', 'Trade is confirmed — commercial terms are locked', 70),
    ('TRADE_BLOTTER', 'quantity',             'TRADE_STATUS', 'CONFIRMED,MATURED,CLOSED', 'VIEW', 'Trade is confirmed — commercial terms are locked', 80),
    ('TRADE_BLOTTER', 'uomCode',              'TRADE_STATUS', 'CONFIRMED,MATURED,CLOSED', 'VIEW', 'Trade is confirmed — commercial terms are locked', 90),
    ('TRADE_BLOTTER', 'price',                'TRADE_STATUS', 'CONFIRMED,MATURED,CLOSED', 'VIEW', 'Trade is confirmed — commercial terms are locked', 100),
    ('TRADE_BLOTTER', 'currencyCode',         'TRADE_STATUS', 'CONFIRMED,MATURED,CLOSED', 'VIEW', 'Trade is confirmed — commercial terms are locked', 110),
    ('TRADE_BLOTTER', 'incotermCode',         'TRADE_STATUS', 'CONFIRMED,MATURED,CLOSED', 'VIEW', 'Trade is confirmed — commercial terms are locked', 120),
    ('TRADE_BLOTTER', 'periodCode',           'TRADE_STATUS', 'CONFIRMED,MATURED,CLOSED', 'VIEW', 'Trade is confirmed — commercial terms are locked', 130),
    ('TRADE_BLOTTER', 'settlementType',       'TRADE_STATUS', 'CONFIRMED,MATURED,CLOSED', 'VIEW', 'Trade is confirmed — commercial terms are locked', 140),
    -- Cancelled: everything read-only
    ('TRADE_BLOTTER', '*',                    'TRADE_STATUS', 'CANCELLED',                'VIEW', 'Cancelled trade is read-only', 200),
    -- Matured/Closed: everything read-only
    ('TRADE_BLOTTER', '*',                    'TRADE_STATUS', 'MATURED,CLOSED',            'VIEW', 'Closed or matured trade is read-only', 210),
    -- Invoice issued: lock pricing fields
    ('TRADE_BLOTTER', 'quantity',             'HAS_INVOICE',  'true',                     'VIEW', 'Invoice issued — quantity is locked', 300),
    ('TRADE_BLOTTER', 'price',                'HAS_INVOICE',  'true',                     'VIEW', 'Invoice issued — price is locked', 310),
    ('TRADE_BLOTTER', 'currencyCode',         'HAS_INVOICE',  'true',                     'VIEW', 'Invoice issued — currency is locked', 320);
GO

-- =============================================================================
-- SEED: Layer 2 profiles and rules for TRADE_BLOTTER
-- =============================================================================

INSERT INTO dbo.field_permission_profile (profile_code, profile_name, description, screen_code, created_by) VALUES
    ('TRADE_BLOTTER_TRADER',     'Trader — Full Access',       'Full edit access to all trade fields',                                        'TRADE_BLOTTER', 'SYSTEM'),
    ('TRADE_BLOTTER_CREDIT_MGR', 'Credit Manager',             'Can approve trades and add notes; cannot edit commercial or logistics terms',  'TRADE_BLOTTER', 'SYSTEM'),
    ('TRADE_BLOTTER_RISK',       'Risk Manager',               'Can view all fields and approve; cannot edit prices or counterparty details',   'TRADE_BLOTTER', 'SYSTEM'),
    ('TRADE_BLOTTER_VIEWER',     'Read-Only Viewer',           'View-only access to all trade fields',                                        'TRADE_BLOTTER', 'SYSTEM'),
    ('TRADE_BLOTTER_OPS',        'Operations',                 'Can edit logistics and scheduling fields; commercial terms are view-only',      'TRADE_BLOTTER', 'SYSTEM');
GO

-- ── TRADER profile: all fields EDIT ──────────────────────────────────────────
DECLARE @traderProfileId INT = (SELECT profile_id FROM dbo.field_permission_profile WHERE profile_code = 'TRADE_BLOTTER_TRADER');
INSERT INTO dbo.field_permission_rule (profile_id, field_id, field_permission)
SELECT @traderProfileId, field_id, 'EDIT'
FROM dbo.screen_field_registry WHERE screen_code = 'TRADE_BLOTTER' AND is_active = 1;
GO

-- ── CREDIT MANAGER profile ────────────────────────────────────────────────────
DECLARE @cmProfileId INT = (SELECT profile_id FROM dbo.field_permission_profile WHERE profile_code = 'TRADE_BLOTTER_CREDIT_MGR');
INSERT INTO dbo.field_permission_rule (profile_id, field_id, field_permission)
SELECT @cmProfileId, sfr.field_id,
    CASE
        WHEN sfr.field_key IN ('status', 'notes') THEN 'EDIT'
        WHEN sfr.field_group IN ('Oil Details','Gas Details','Power Details','LNG Details','Metals Details','Agri Details') THEN 'HIDDEN'
        ELSE 'VIEW'
    END
FROM dbo.screen_field_registry sfr
WHERE sfr.screen_code = 'TRADE_BLOTTER' AND sfr.is_active = 1;
GO

-- ── RISK MANAGER profile ──────────────────────────────────────────────────────
DECLARE @riskProfileId INT = (SELECT profile_id FROM dbo.field_permission_profile WHERE profile_code = 'TRADE_BLOTTER_RISK');
INSERT INTO dbo.field_permission_rule (profile_id, field_id, field_permission)
SELECT @riskProfileId, sfr.field_id,
    CASE
        WHEN sfr.field_key IN ('status', 'notes') THEN 'EDIT'
        ELSE 'VIEW'
    END
FROM dbo.screen_field_registry sfr
WHERE sfr.screen_code = 'TRADE_BLOTTER' AND sfr.is_active = 1;
GO

-- ── VIEWER profile: all fields VIEW ──────────────────────────────────────────
DECLARE @viewerProfileId INT = (SELECT profile_id FROM dbo.field_permission_profile WHERE profile_code = 'TRADE_BLOTTER_VIEWER');
INSERT INTO dbo.field_permission_rule (profile_id, field_id, field_permission)
SELECT @viewerProfileId, field_id, 'VIEW'
FROM dbo.screen_field_registry WHERE screen_code = 'TRADE_BLOTTER' AND is_active = 1;
GO

-- ── OPERATIONS profile ────────────────────────────────────────────────────────
DECLARE @opsProfileId INT = (SELECT profile_id FROM dbo.field_permission_profile WHERE profile_code = 'TRADE_BLOTTER_OPS');
INSERT INTO dbo.field_permission_rule (profile_id, field_id, field_permission)
SELECT @opsProfileId, sfr.field_id,
    CASE
        WHEN sfr.field_group IN ('Logistics','Oil Details','Gas Details','Power Details','LNG Details','Metals Details','Agri Details') THEN 'EDIT'
        WHEN sfr.field_key IN ('notes') THEN 'EDIT'
        ELSE 'VIEW'
    END
FROM dbo.screen_field_registry sfr
WHERE sfr.screen_code = 'TRADE_BLOTTER' AND sfr.is_active = 1;
GO

-- ── Assign profiles to system roles ──────────────────────────────────────────
INSERT INTO dbo.role_field_profile (role_id, profile_id)
SELECT r.role_id, p.profile_id
FROM dbo.user_role r
JOIN dbo.field_permission_profile p ON 1=1
WHERE
    (r.role_code = 'TRADER'       AND p.profile_code = 'TRADE_BLOTTER_TRADER')
 OR (r.role_code = 'RISK_MANAGER' AND p.profile_code = 'TRADE_BLOTTER_CREDIT_MGR')
 OR (r.role_code = 'OPERATIONS'   AND p.profile_code = 'TRADE_BLOTTER_OPS')
 OR (r.role_code = 'VIEWER'       AND p.profile_code = 'TRADE_BLOTTER_VIEWER')
 OR (r.role_code = 'ADMIN'        AND p.profile_code = 'TRADE_BLOTTER_TRADER')
 OR (r.role_code = 'COMPLIANCE'   AND p.profile_code = 'TRADE_BLOTTER_RISK');
GO
