-- =============================================================================
-- V59 — dbo.commodity_family: normalize product.product_family into a real
-- master table, linked to both product and commodity
-- =============================================================================
-- User asked to properly build the "family/group" concept flagged as open in
-- V58: dbo.product.product_family was a raw, unconstrained VARCHAR(50) (added
-- in migration 23) with no master table behind it — the same kind of
-- hardcoded classification the whole commodity_type effort was fixing, one
-- level down the hierarchy.
--
-- Researched standard commodity taxonomy first: exchange-traded commodities
-- are conventionally organized as
--   sector (Energy/Metals/Agriculture) -> family/group (e.g. within Metals:
--   Base Metals vs Precious Metals; within Oil: Crude vs Refined Products) ->
--   individual product (Brent, WTI, Copper, Corn...).
-- This matches UNSPSC's Segment/Family/Class/Commodity model and the
-- Hard/Soft, Base/Precious commodity distinctions used across CTRM/ETRM
-- systems. Our schema already has commodity (the "sector") and product (the
-- individual instrument) — commodity_family is the missing middle tier.
--
-- Design:
--   dbo.commodity_family: commodity_family_id, commodity_id (FK -> commodity,
--   the parent sector), family_code, family_name, family_type (a free
--   descriptive tag for the family's own sub-classification — e.g. BASE_METAL
--   vs PRECIOUS_METAL, CRUDE vs REFINED — deliberately NOT a CHECK constraint
--   or a lookup_value FK, consistent with this session's "no hardcoded, no
--   generic lookup indirection" direction; it's simply a plain column with no
--   enforced vocabulary, same treatment as other free descriptive fields
--   like gl_account.cost_center), description, is_active, audit columns.
--   dbo.product.commodity_family_id: FK -> commodity_family, replacing the
--   raw product_family string.
-- =============================================================================

USE ETRM_DB;
GO

CREATE TABLE dbo.commodity_family (
    commodity_family_id INT             NOT NULL IDENTITY(1,1),
    commodity_id           INT             NOT NULL,
    family_code               VARCHAR(30)     NOT NULL,
    family_name                 VARCHAR(100)    NOT NULL,
    family_type                   VARCHAR(30)     NULL,   -- e.g. CRUDE, REFINED, PETROCHEMICAL, PIPELINE_GAS, LNG, BASE_METAL, PRECIOUS_METAL, GRAIN, ELECTRICITY — descriptive only, no fixed vocabulary
    description                     VARCHAR(500)    NULL,
    is_active                         BIT             NOT NULL DEFAULT 1,
    created_at                         DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                           VARCHAR(100)    NOT NULL,
    updated_at                             DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                               VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_commodity_family       PRIMARY KEY (commodity_family_id),
    CONSTRAINT uq_commodity_family_code  UNIQUE      (family_code),
    CONSTRAINT fk_cf_commodity           FOREIGN KEY (commodity_id) REFERENCES dbo.commodity(commodity_id)
);
GO
CREATE INDEX ix_commodity_family_commodity ON dbo.commodity_family (commodity_id, is_active);
GO

INSERT INTO dbo.commodity_family (commodity_id, family_code, family_name, family_type, description, created_by, updated_by)
SELECT c.commodity_id, v.family_code, v.family_name, v.family_type, v.description, 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('OIL',    'CRUDE_OIL',        'Crude Oil',            'CRUDE',        'Unrefined crude — Brent, WTI, Urals, Dubai and other physical/financial crude benchmarks.'),
    ('OIL',    'REFINED_PRODUCTS', 'Refined Products',     'REFINED',      'Refined petroleum products — gasoline, diesel/gasoil, jet fuel, fuel oil.'),
    ('OIL',    'PETROCHEMICAL',    'Petrochemicals',       'PETROCHEMICAL','Naphtha and other petrochemical feedstocks.'),
    ('GAS',    'NATURAL_GAS',      'Natural Gas',          'PIPELINE_GAS', 'Pipeline-delivered natural gas — TTF, NBP, Henry Hub and similar hub products.'),
    ('GAS',    'LNG',              'Liquefied Natural Gas','LNG',          'Liquefied natural gas cargoes — JKM and other LNG benchmarks.'),
    ('METALS', 'BASE_METALS',      'Base Metals',          'BASE_METAL',   'Non-ferrous industrial metals — copper, aluminium, zinc, lead, nickel, tin.'),
    ('METALS', 'PRECIOUS_METALS',  'Precious Metals',      'PRECIOUS_METAL','Gold, silver, platinum, palladium.'),
    ('AGRI',   'GRAINS',           'Grains',               'GRAIN',        'Corn, wheat, soybeans and other grain/oilseed products.'),
    ('POWER',  'POWER',            'Power Generation',     'ELECTRICITY',  'Wholesale electricity — baseload, peak, and off-peak power products.')
) AS v(commodity_code, family_code, family_name, family_type, description)
JOIN dbo.commodity c ON c.commodity_code = v.commodity_code;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.product') AND name = 'commodity_family_id')
  ALTER TABLE dbo.product ADD commodity_family_id INT NULL;
GO
ALTER TABLE dbo.product ADD CONSTRAINT fk_product_commodity_family FOREIGN KEY (commodity_family_id) REFERENCES dbo.commodity_family(commodity_family_id);
GO

-- Backfill from the existing raw product_family string (values actually
-- seeded by migrations 23/24: CRUDE_OIL, NATURAL_GAS, BASE_METALS, POWER).
UPDATE p SET p.commodity_family_id = cf.commodity_family_id
FROM dbo.product p JOIN dbo.commodity_family cf ON cf.family_code = p.product_family;
GO

ALTER TABLE dbo.product DROP COLUMN IF EXISTS product_family;
GO

-- =============================================================================
-- Register in master data registry (Products group)
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'commodity_family')
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES ('commodity_family', 'Commodity Families', 'Products & Markets', 1, 1, 1, 0, 3, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'V59 — COMMODITY_FAMILY APPLIED';
PRINT '  commodity_family — NEW table, 9 rows seeded, linked to commodity.';
PRINT '  product.commodity_family_id — FK added, backfilled from the old';
PRINT '    product_family string, which is now dropped.';
PRINT '============================================================';
GO
