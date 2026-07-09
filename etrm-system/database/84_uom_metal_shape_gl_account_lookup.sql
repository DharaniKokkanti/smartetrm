-- =============================================================================
-- V84 — UoM categories + metal shapes as dedicated tables; gl_account_type
-- finishes its lookup_value wiring
-- =============================================================================
-- Continuing the static-data-reference review. Three more real columns:
--   - unit_of_measure.uom_category — real CHECK values are VOLUME/WEIGHT/
--     ENERGY/POWER/TEMPERATURE/COUNT/OTHER (checked against the actual
--     constraint — the frontend mock had guessed a different set: VOLUME/
--     WEIGHT/ENERGY/POWER/QUANTITY/DISTANCE. Built against the real values,
--     not the mock's guess.)
--   - metal_brand.metal_form — real CHECK values are CATHODE/
--     CATHODE_FULL_PLATE/INGOT/WIRE_ROD/PIG/BAR/GRANULES/BRIQUETTE/SLAB/OTHER
--     (again, the mock had guessed a different set — built against the real
--     schema).
--   - gl_account.account_type — turned out to already have its lookup_value
--     rows seeded right in V37 itself (category = 'gl_account_type'), same
--     half-finished-conversion story as V81's seven columns, not a missing
--     table at all. Wired here rather than building a duplicate table.
-- =============================================================================

USE ETRM_DB;
GO

-- ── 1. uom_type ────────────────────────────────────────────────────────────────
CREATE TABLE dbo.uom_type (
    uom_type_id INT          NOT NULL IDENTITY(1,1),
    type_code   VARCHAR(50)  NOT NULL,
    type_name   VARCHAR(100) NOT NULL,
    description VARCHAR(500) NULL,
    sort_order  SMALLINT     NOT NULL DEFAULT 0,
    is_active   BIT          NOT NULL DEFAULT 1,
    created_at  DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by  VARCHAR(100) NOT NULL,
    updated_at  DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by  VARCHAR(100) NOT NULL,
    CONSTRAINT pk_uom_type      PRIMARY KEY (uom_type_id),
    CONSTRAINT uq_uom_type_code UNIQUE      (type_code)
);
GO
CREATE INDEX ix_uom_type_active ON dbo.uom_type (is_active, sort_order);
GO
INSERT INTO dbo.uom_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('VOLUME',      'Volume',      'Liquid or gas volume units — barrels, cubic metres, gallons, litres. Used for crude, refined products, and LNG.', 1, 'SYSTEM', 'SYSTEM'),
    ('WEIGHT',      'Weight',      'Mass units — metric tonnes, short tons, pounds, kilograms. Used for metals, agri commodities, weight-settled cargoes.', 2, 'SYSTEM', 'SYSTEM'),
    ('ENERGY',      'Energy',      'Heat content units — MMBtu, therms, gigajoules. Used for natural gas and LNG priced on a calorific basis.', 3, 'SYSTEM', 'SYSTEM'),
    ('POWER',       'Power',       'Electrical power and energy units — MW, MWh, kWh. Used for power trade quantities and load profiles.', 4, 'SYSTEM', 'SYSTEM'),
    ('TEMPERATURE', 'Temperature', 'Temperature units — used for weather-linked and degree-day products.', 5, 'SYSTEM', 'SYSTEM'),
    ('COUNT',        'Count',        'Discrete count units — lots, cargoes, contracts. Used where a commodity trades in standard-sized units.', 6, 'SYSTEM', 'SYSTEM'),
    ('OTHER',        'Other',        'Unit category not covered by the standard classifications above.', 7, 'SYSTEM', 'SYSTEM');
GO

-- ── 2. metal_shape ────────────────────────────────────────────────────────────
CREATE TABLE dbo.metal_shape (
    metal_shape_id INT          NOT NULL IDENTITY(1,1),
    type_code       VARCHAR(50)  NOT NULL,
    type_name        VARCHAR(100) NOT NULL,
    description       VARCHAR(500) NULL,
    sort_order        SMALLINT     NOT NULL DEFAULT 0,
    is_active         BIT          NOT NULL DEFAULT 1,
    created_at         DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by         VARCHAR(100) NOT NULL,
    updated_at          DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100) NOT NULL,
    CONSTRAINT pk_metal_shape      PRIMARY KEY (metal_shape_id),
    CONSTRAINT uq_metal_shape_code UNIQUE      (type_code)
);
GO
CREATE INDEX ix_metal_shape_active ON dbo.metal_shape (is_active, sort_order);
GO
INSERT INTO dbo.metal_shape (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('CATHODE',            'Cathode',              'Standard refined metal cathode — copper, zinc.', 1, 'SYSTEM', 'SYSTEM'),
    ('CATHODE_FULL_PLATE', 'Cathode (Full Plate)', 'Full-plate cathode form, as distinct from cut cathode.', 2, 'SYSTEM', 'SYSTEM'),
    ('INGOT',              'Ingot',                'Cast metal ingot — aluminium, lead, zinc, tin.', 3, 'SYSTEM', 'SYSTEM'),
    ('WIRE_ROD',           'Wire Rod',             'Drawn wire rod — copper, aluminium.', 4, 'SYSTEM', 'SYSTEM'),
    ('PIG',                'Pig',                  'Pig-cast metal form.', 5, 'SYSTEM', 'SYSTEM'),
    ('BAR',                'Bar',                  'Bar-cast metal form.', 6, 'SYSTEM', 'SYSTEM'),
    ('GRANULES',           'Granules',             'Granulated metal form.', 7, 'SYSTEM', 'SYSTEM'),
    ('BRIQUETTE',          'Briquette',            'Compressed briquette form.', 8, 'SYSTEM', 'SYSTEM'),
    ('SLAB',               'Slab',                 'Slab-cast metal form — aluminium, steel.', 9, 'SYSTEM', 'SYSTEM'),
    ('OTHER',              'Other',                'Physical form not covered by the standard classifications above.', 10, 'SYSTEM', 'SYSTEM');
GO

-- =============================================================================
-- Convert the real consuming columns
-- =============================================================================

-- ── dbo.unit_of_measure.uom_category ──────────────────────────────────────────
ALTER TABLE dbo.unit_of_measure ADD uom_category_new INT NULL;
GO
UPDATE u SET u.uom_category_new = t.uom_type_id
FROM dbo.unit_of_measure u JOIN dbo.uom_type t ON t.type_code = u.uom_category;
GO
ALTER TABLE dbo.unit_of_measure DROP CONSTRAINT IF EXISTS chk_uom_category;
ALTER TABLE dbo.unit_of_measure DROP COLUMN uom_category;
GO
EXEC sp_rename 'dbo.unit_of_measure.uom_category_new', 'uom_category', 'COLUMN';
GO
ALTER TABLE dbo.unit_of_measure ALTER COLUMN uom_category INT NOT NULL;
ALTER TABLE dbo.unit_of_measure ADD CONSTRAINT fk_uom_category FOREIGN KEY (uom_category) REFERENCES dbo.uom_type(uom_type_id);
GO

-- ── dbo.metal_brand.metal_form ────────────────────────────────────────────────
ALTER TABLE dbo.metal_brand ADD metal_form_new INT NULL;
GO
UPDATE m SET m.metal_form_new = t.metal_shape_id
FROM dbo.metal_brand m JOIN dbo.metal_shape t ON t.type_code = m.metal_form;
GO
ALTER TABLE dbo.metal_brand DROP CONSTRAINT IF EXISTS chk_mb_form;
ALTER TABLE dbo.metal_brand DROP COLUMN metal_form;
GO
EXEC sp_rename 'dbo.metal_brand.metal_form_new', 'metal_form', 'COLUMN';
GO
ALTER TABLE dbo.metal_brand ALTER COLUMN metal_form INT NOT NULL;
ALTER TABLE dbo.metal_brand ADD CONSTRAINT fk_mb_metal_form FOREIGN KEY (metal_form) REFERENCES dbo.metal_shape(metal_shape_id);
GO

-- ── dbo.gl_account.account_type — already seeded as lookup_value (V37) ───────
ALTER TABLE dbo.gl_account ADD account_type_new INT NULL;
GO
UPDATE g SET g.account_type_new = lv.lookup_id
FROM dbo.gl_account g JOIN dbo.lookup_value lv ON lv.category = 'gl_account_type' AND lv.code = g.account_type;
GO
ALTER TABLE dbo.gl_account DROP COLUMN account_type;
GO
EXEC sp_rename 'dbo.gl_account.account_type_new', 'account_type', 'COLUMN';
GO
ALTER TABLE dbo.gl_account ALTER COLUMN account_type INT NOT NULL;
ALTER TABLE dbo.gl_account ADD CONSTRAINT fk_gl_account_type FOREIGN KEY (account_type) REFERENCES dbo.lookup_value(lookup_id);
GO

-- ── Register the 2 new dedicated tables in the Static Data GUI ───────────────
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES
    ('uom_type',     'UoM Types',            'Finance & Settlement', 1, 1, 0, 0, 1, 'SYSTEM', 'SYSTEM'),
    ('metal_shape',  'Metal Physical Forms', 'Products & Markets',   1, 1, 0, 0, 1, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'V84 — UOM_TYPE + METAL_SHAPE BUILT; GL_ACCOUNT_TYPE WIRED';
PRINT '  unit_of_measure.uom_category -> FK uom_type (new table)';
PRINT '  metal_brand.metal_form -> FK metal_shape (new table)';
PRINT '  gl_account.account_type -> FK lookup_value (already seeded, V37)';
PRINT '============================================================';
GO
