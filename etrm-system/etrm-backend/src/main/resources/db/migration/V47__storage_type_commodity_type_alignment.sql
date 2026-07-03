-- V47: Storage facility type canonicalization + commodity type extension
--
-- Part A: dbo.storage_facility.facility_type had 8 legacy codes (TANK, WAREHOUSE,
--   LNG_TERMINAL, GRAIN_SILO, REFINERY, CAVERN, VAULT, OTHER) while the frontend
--   STORAGE_TYPES vocabulary has 11 operational codes. This migration maps legacy
--   rows onto the canonical vocabulary and replaces the CHECK with the union (14).
--
-- Part B: commodity_type CHECK on book / desk / gl_account / trader_commodity_limit
--   only allowed 7 values (V43). Trading desks and books now need LNG, FREIGHT,
--   RINS and ENVIRONMENTAL classifications — extend to 11 values.

-- ============================================================
-- A1. Remap legacy facility_type codes to canonical vocabulary
-- ============================================================
-- Legacy → canonical: TANK → TANK_FARM, CAVERN → SALT_CAVERN,
--                     LNG_TERMINAL → LNG_TANK, GRAIN_SILO → SILO.
-- REFINERY, VAULT, OTHER, WAREHOUSE stay as-is (already canonical).
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_fac_type')
  ALTER TABLE dbo.storage_facility DROP CONSTRAINT chk_fac_type;
GO

UPDATE dbo.storage_facility SET facility_type = 'TANK_FARM'   WHERE facility_type = 'TANK';
UPDATE dbo.storage_facility SET facility_type = 'SALT_CAVERN' WHERE facility_type = 'CAVERN';
UPDATE dbo.storage_facility SET facility_type = 'LNG_TANK'    WHERE facility_type = 'LNG_TERMINAL';
UPDATE dbo.storage_facility SET facility_type = 'SILO'        WHERE facility_type = 'GRAIN_SILO';
GO

ALTER TABLE dbo.storage_facility
  ADD CONSTRAINT chk_fac_type CHECK (facility_type IN (
    'TANK_FARM', 'FLOATING_STORAGE', 'WAREHOUSE', 'SALT_CAVERN', 'GAS_STORAGE',
    'PIPELINE_LINEFILL', 'LNG_TANK', 'SILO',
    'REFRIGERATED_STORAGE', 'CHEMICAL_TANK', 'FSRU',
    'REFINERY', 'VAULT', 'OTHER'
  ));
GO

-- ============================================================
-- A2. Refresh dbo.storage_facility_type parent lookup to the canonical 14
-- ============================================================
-- Remap the 4 renamed codes in place (preserves FK usage / IDs), then insert new codes.
UPDATE dbo.storage_facility_type SET type_code = 'TANK_FARM',   type_name = 'Tank Farm',    description = 'Fixed or floating-roof above-ground tanks (crude, refined products)' WHERE type_code = 'TANK';
UPDATE dbo.storage_facility_type SET type_code = 'SALT_CAVERN', type_name = 'Salt Cavern',  description = 'Underground salt cavern for crude, gas, or LPG storage'              WHERE type_code = 'CAVERN';
UPDATE dbo.storage_facility_type SET type_code = 'LNG_TANK',    type_name = 'LNG Tank',     description = 'Cryogenic LNG storage tank at an import/export terminal'              WHERE type_code = 'LNG_TERMINAL';
UPDATE dbo.storage_facility_type SET type_code = 'SILO',        type_name = 'Silo',         description = 'Grain or dry-bulk silo / elevator'                                    WHERE type_code = 'GRAIN_SILO';
GO

INSERT INTO dbo.storage_facility_type (type_code, type_name, description, sort_order, created_by, updated_by)
SELECT v.type_code, v.type_name, v.description, v.sort_order, 'SYSTEM', 'SYSTEM'
FROM (VALUES
  ('FLOATING_STORAGE',    'Floating Storage',     'Vessel used as offshore storage unit (FSU)',                         9),
  ('GAS_STORAGE',         'Gas Storage',          'Depleted reservoir or aquifer underground gas storage',             10),
  ('PIPELINE_LINEFILL',   'Pipeline Linefill',    'Product held in an active pipeline as operational stock',           11),
  ('REFRIGERATED_STORAGE','Refrigerated Storage', 'Pressure/refrigerated storage for LPG, ammonia, ethylene',          12),
  ('CHEMICAL_TANK',       'Chemical Tank',        'Specialised tank for petrochemicals, solvents, acids',              13),
  ('FSRU',                'FSRU',                 'Floating Storage and Regasification Unit',                          14)
) AS v(type_code, type_name, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM dbo.storage_facility_type t WHERE t.type_code = v.type_code);
GO

-- ============================================================
-- B. Extend commodity_type CHECKs to the full 11-value vocabulary
--    (aligns master data with tradeable commodities incl. RINS/ENVIRONMENTAL)
-- ============================================================
ALTER TABLE dbo.book DROP CONSTRAINT IF EXISTS ck_book_commodity_type;
ALTER TABLE dbo.book ADD
    CONSTRAINT ck_book_commodity_type
        CHECK (commodity_type IS NULL OR
               commodity_type IN ('OIL','GAS','POWER','LNG','AGRICULTURAL','METALS','FREIGHT','RINS','ENVIRONMENTAL','MULTI','OTHER'));
GO

ALTER TABLE dbo.desk DROP CONSTRAINT IF EXISTS ck_desk_commodity_type;
ALTER TABLE dbo.desk ADD
    CONSTRAINT ck_desk_commodity_type
        CHECK (commodity_type IS NULL OR
               commodity_type IN ('OIL','GAS','POWER','LNG','AGRICULTURAL','METALS','FREIGHT','RINS','ENVIRONMENTAL','MULTI','OTHER'));
GO

ALTER TABLE dbo.gl_account DROP CONSTRAINT IF EXISTS ck_gl_account_commodity_type;
ALTER TABLE dbo.gl_account ADD
    CONSTRAINT ck_gl_account_commodity_type
        CHECK (commodity_type IS NULL OR
               commodity_type IN ('OIL','GAS','POWER','LNG','AGRICULTURAL','METALS','FREIGHT','RINS','ENVIRONMENTAL','MULTI','OTHER'));
GO

ALTER TABLE dbo.trader_commodity_limit DROP CONSTRAINT IF EXISTS ck_tcl_commodity_type;
ALTER TABLE dbo.trader_commodity_limit ADD
    CONSTRAINT ck_tcl_commodity_type
        CHECK (commodity_type IN ('OIL','GAS','POWER','LNG','AGRICULTURAL','METALS','FREIGHT','RINS','ENVIRONMENTAL','MULTI','OTHER'));
GO
