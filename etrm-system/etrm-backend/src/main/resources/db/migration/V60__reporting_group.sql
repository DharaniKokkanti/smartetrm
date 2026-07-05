-- =============================================================================
-- V60 — dbo.reporting_group / dbo.product_reporting_group: independent
-- per-report classification axes for a product (Position, VaR/Risk,
-- Settlement/GL, etc.), separate from commodity_family
-- =============================================================================
-- User need: commodity_family (V59) is one classification axis — the
-- commodity taxonomy (Crude/Refined/Base Metal/...). But different reporting
-- consumers group products differently: Position Reporting may want to
-- bucket ULSD-10PPM and GAS97-BLEND together as "Light Distillates", while
-- VaR/Risk groups the same two products under a broader "Energy Risk Class",
-- and Settlement/GL groups them by a GL posting segment — three genuinely
-- independent groupings of the same product, not a single hierarchy.
--
-- Design (asked via AskUserQuestion — user picked "generic classification
-- table" over per-axis FK columns on product, so new reporting axes can be
-- added later without a new column/migration):
--   dbo.reporting_group: reporting_group_id, classification_type (plain,
--   unconstrained VARCHAR — e.g. POSITION, VAR, SETTLEMENT — same "no fixed
--   vocabulary" treatment as commodity_family.family_type in V59), group_code,
--   group_name, description, is_active, audit columns. UNIQUE per
--   (classification_type, group_code).
--   dbo.product_reporting_group: bridge table, product_id -> reporting_group_id,
--   UNIQUE(product_id, reporting_group_id) so the same group can't be attached
--   twice; a product having multiple groups within one classification_type is
--   allowed at the DB level (not artificially restricted), the product form UI
--   enforces one active selection per axis in practice.
-- =============================================================================

USE ETRM_DB;
GO

CREATE TABLE dbo.reporting_group (
    reporting_group_id INT             NOT NULL IDENTITY(1,1),
    classification_type VARCHAR(30)    NOT NULL,   -- e.g. POSITION, VAR, SETTLEMENT — descriptive only, no fixed vocabulary
    group_code          VARCHAR(30)    NOT NULL,
    group_name          VARCHAR(100)   NOT NULL,
    description         VARCHAR(500)   NULL,
    is_active           BIT            NOT NULL DEFAULT 1,
    created_at          DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)   NOT NULL,
    updated_at          DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)   NOT NULL,

    CONSTRAINT pk_reporting_group      PRIMARY KEY (reporting_group_id),
    CONSTRAINT uq_reporting_group_code UNIQUE      (classification_type, group_code)
);
GO
CREATE INDEX ix_reporting_group_type ON dbo.reporting_group (classification_type, is_active);
GO

INSERT INTO dbo.reporting_group (classification_type, group_code, group_name, description, created_by, updated_by)
VALUES
    ('POSITION', 'LIGHT_DISTILLATES', 'Light Distillates',        'Diesel, gasoline, jet fuel — position reports grouped by refined product slate.', 'SYSTEM', 'SYSTEM'),
    ('POSITION', 'CRUDE_OIL',         'Crude Oil',                'Crude and crude futures position reporting bucket.', 'SYSTEM', 'SYSTEM'),
    ('POSITION', 'NATURAL_GAS',       'Natural Gas',              'Pipeline gas and LNG position reporting bucket.', 'SYSTEM', 'SYSTEM'),
    ('POSITION', 'POWER',             'Power',                    'Wholesale electricity position reporting bucket.', 'SYSTEM', 'SYSTEM'),
    ('POSITION', 'METALS',            'Metals',                   'Base and precious metals position reporting bucket.', 'SYSTEM', 'SYSTEM'),
    ('POSITION', 'AGRICULTURAL',      'Agricultural',             'Grains and softs position reporting bucket.', 'SYSTEM', 'SYSTEM'),
    ('VAR',      'ENERGY_RISK',       'Energy Risk Class',        'VaR risk class covering oil, gas, and power products.', 'SYSTEM', 'SYSTEM'),
    ('VAR',      'METALS_RISK',       'Metals Risk Class',        'VaR risk class covering base and precious metals.', 'SYSTEM', 'SYSTEM'),
    ('VAR',      'AGRI_RISK',         'Agricultural Risk Class',  'VaR risk class covering grains and softs.', 'SYSTEM', 'SYSTEM'),
    ('SETTLEMENT', 'GL_ENERGY',       'GL — Energy',              'Settlement/invoicing GL posting group for oil, gas, and power products.', 'SYSTEM', 'SYSTEM'),
    ('SETTLEMENT', 'GL_METALS',       'GL — Metals',              'Settlement/invoicing GL posting group for metals products.', 'SYSTEM', 'SYSTEM'),
    ('SETTLEMENT', 'GL_AGRI',         'GL — Agricultural',        'Settlement/invoicing GL posting group for agricultural products.', 'SYSTEM', 'SYSTEM');
GO

CREATE TABLE dbo.product_reporting_group (
    product_reporting_group_id INT     NOT NULL IDENTITY(1,1),
    product_id                 INT     NOT NULL,
    reporting_group_id         INT     NOT NULL,
    created_at                 DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                 VARCHAR(100) NOT NULL,
    updated_at                 DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                 VARCHAR(100) NOT NULL,

    CONSTRAINT pk_product_reporting_group PRIMARY KEY (product_reporting_group_id),
    CONSTRAINT uq_product_reporting_group UNIQUE      (product_id, reporting_group_id),
    CONSTRAINT fk_prg_product              FOREIGN KEY (product_id)         REFERENCES dbo.product(product_id),
    CONSTRAINT fk_prg_reporting_group       FOREIGN KEY (reporting_group_id) REFERENCES dbo.reporting_group(reporting_group_id)
);
GO
CREATE INDEX ix_product_reporting_group_product ON dbo.product_reporting_group (product_id);
GO

-- Seed a few representative assignments to demonstrate the multi-axis wiring
-- (products actually seeded in migrations 23/24: Brent=1, WTI=2, TTF=4,
-- LME Copper=6, EEX Power=8, CBOT Corn=12, ULSD-10PPM=13, GAS97-BLEND=15).
INSERT INTO dbo.product_reporting_group (product_id, reporting_group_id, created_by, updated_by)
SELECT p.product_id, rg.reporting_group_id, 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('BRENT-CRUDE',   'POSITION',   'CRUDE_OIL'),
    ('BRENT-CRUDE',   'VAR',        'ENERGY_RISK'),
    ('WTI-CRUDE',     'POSITION',   'CRUDE_OIL'),
    ('WTI-CRUDE',     'VAR',        'ENERGY_RISK'),
    ('TTF-GAS',       'POSITION',   'NATURAL_GAS'),
    ('TTF-GAS',       'VAR',        'ENERGY_RISK'),
    ('TTF-GAS',       'SETTLEMENT', 'GL_ENERGY'),
    ('LME-COPPER',    'POSITION',   'METALS'),
    ('LME-COPPER',    'VAR',        'METALS_RISK'),
    ('LME-COPPER',    'SETTLEMENT', 'GL_METALS'),
    ('EEX-DE-POWER',  'POSITION',   'POWER'),
    ('EEX-DE-POWER',  'VAR',        'ENERGY_RISK'),
    ('CBOT-CORN',     'POSITION',   'AGRICULTURAL'),
    ('CBOT-CORN',     'VAR',        'AGRI_RISK'),
    ('CBOT-CORN',     'SETTLEMENT', 'GL_AGRI'),
    ('ULSD-10PPM',    'POSITION',   'LIGHT_DISTILLATES'),
    ('ULSD-10PPM',    'VAR',        'ENERGY_RISK'),
    ('ULSD-10PPM',    'SETTLEMENT', 'GL_ENERGY'),
    ('GAS97-BLEND',   'POSITION',   'LIGHT_DISTILLATES'),
    ('GAS97-BLEND',   'VAR',        'ENERGY_RISK'),
    ('GAS97-BLEND',   'SETTLEMENT', 'GL_ENERGY')
) AS v(product_code, classification_type, group_code)
JOIN dbo.product p ON p.product_code = v.product_code
JOIN dbo.reporting_group rg ON rg.classification_type = v.classification_type AND rg.group_code = v.group_code;
GO

-- =============================================================================
-- Register reporting_group in master data registry (Static Data page).
-- product_reporting_group is a bridge table managed from the Products page's
-- "Reporting Groups" tab, same as product_spec_template/product_blend_component
-- — not a generic Static Data table, so it is NOT registered here.
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'reporting_group')
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES ('reporting_group', 'Reporting Groups', 'Products & Markets', 1, 1, 1, 0, 4, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'V60 — REPORTING_GROUP APPLIED';
PRINT '  reporting_group — NEW table, 12 rows seeded across POSITION/VAR/SETTLEMENT axes.';
PRINT '  product_reporting_group — NEW bridge table, 20 sample assignments seeded.';
PRINT '============================================================';
GO
