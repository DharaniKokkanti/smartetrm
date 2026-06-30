-- =============================================================================
-- V25 — Pricing Basis Fields + UoM Conversion Seeds + Additional Spec Parameters
--
-- 1. ALTER product         — add commodity-specific pricing basis columns
--                            (density, calorific value, moisture, purity)
-- 2. ADD unit_of_measure   — GJ, LB, SCM, GWH_GAS rows for gas/power/metals
-- 3. SEED uom_conversion   — all commodity-standard conversion factors
-- 4. UPDATE products       — populate pricing basis for seeded products
-- 5. INSERT spec_parameter — fill gaps for OIL, GAS, METALS, AGRI, POWER
-- =============================================================================

-- =============================================================================
-- 1. PRICING BASIS COLUMNS ON dbo.product
-- These are the "default" values used for position/P&L calculations when
-- exact cargo figures are not yet known (e.g. before B/L analysis results).
-- Override at trade level via trade_detail columns.
-- =============================================================================
ALTER TABLE dbo.product ADD
    -- OIL: density for BBL ↔ MT conversion (kg/m³ at 15°C)
    density_estimate_kg_m3  DECIMAL(10,3) NULL,   -- typical cargo estimate
    density_base_kg_m3      DECIMAL(10,3) NULL,   -- reference/contract base density

    -- GAS: calorific value for MMBTU/SCM ↔ MWH conversion
    cv_gross_mj_scm         DECIMAL(10,4) NULL,   -- GCV in MJ/scm (higher heating value)
    cv_net_mj_scm           DECIMAL(10,4) NULL,   -- NCV in MJ/scm (lower heating value)

    -- METALS: purity basis used for pricing (%)
    -- e.g. LME Cu Grade A = 99.9935, gold = 999.9 fineness (enter as 99.99)
    purity_basis_pct        DECIMAL(10,4) NULL,

    -- AGRI: standard moisture basis for pricing (%)
    -- Price is typically adjusted if actual moisture differs from this standard
    moisture_basis_pct      DECIMAL(5,2)  NULL,

    -- AGRI: protein basis for wheat pricing (%)
    protein_basis_pct       DECIMAL(5,2)  NULL;
GO

-- =============================================================================
-- 2. ADDITIONAL UNIT_OF_MEASURE ROWS
-- =============================================================================
INSERT INTO dbo.unit_of_measure (uom_code, uom_name, uom_category, commodity_type, base_uom_code, conversion_factor)
VALUES
    -- GJ: universal energy unit (used in GAS and POWER), base = MWH (1 GJ = 0.277778 MWh)
    ('GJ',     'Gigajoule',                'ENERGY', NULL,           'MWH',    0.277778),
    -- SCM: VOLUME unit — base is itself (SCM). Cross-type SCM↔MWH requires product GCV (see section 4)
    ('SCM',    'Standard Cubic Metre',     'VOLUME', NULL,           'SCM',    1.0),
    -- MMSCM: VOLUME unit — 1 MMSCM = 1,000,000 SCM
    ('MMSCM',  'Million Standard Cu Metres','VOLUME',NULL,           'SCM',    1000000.0),
    -- LB: universal weight unit (used in AGRI and METALS), base = MT
    ('LB',     'Pound',                    'WEIGHT', NULL,           'MT',     0.000454),  -- 1 lb = 0.4536 kg
    ('GAL',    'US Gallon',                'VOLUME', 'OIL',          'BBL',    0.023810),  -- 1 gal = 1/42 BBL
    ('CBM',    'Cubic Metre',              'VOLUME', 'OIL',          'BBL',    6.289814);  -- 1 m³ = 6.289814 BBL
GO

-- =============================================================================
-- 3. UOM_CONVERSION SEED DATA
-- factor: from_uom × factor = to_uom
-- commodity_type NULL = universal (not commodity-specific)
-- =============================================================================

-- ── UNIVERSAL (no commodity_type) ─────────────────────────────────────────────
-- Weight
INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 1000.0000000000, NULL,
    '1 MT = 1,000 kg — universal weight conversion'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'MT' AND t.uom_code = 'KG';

INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 0.0010000000, NULL,
    '1 kg = 0.001 MT — universal weight conversion'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'KG' AND t.uom_code = 'MT';

INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 2204.6226218000, NULL,
    '1 MT = 2,204.62 lb — universal weight conversion'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'MT' AND t.uom_code = 'LB';

INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 0.0004535924, NULL,
    '1 lb = 0.0004536 MT'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'LB' AND t.uom_code = 'MT';

-- Precious metals: Troy Ounce
INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 0.0311034768, NULL,
    '1 Troy Oz = 31.1035 g = 0.0311035 kg — London good delivery standard'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'TROY_OZ' AND t.uom_code = 'KG';

INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 32.1507465700, NULL,
    '1 kg = 32.1507 Troy Oz'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'KG' AND t.uom_code = 'TROY_OZ';

INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 32150.7465700, NULL,
    '1 MT = 32,150.75 Troy Oz'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'MT' AND t.uom_code = 'TROY_OZ';

INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 0.0000311035, NULL,
    '1 Troy Oz = 0.0000311035 MT'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'TROY_OZ' AND t.uom_code = 'MT';

-- ── OIL VOLUME ────────────────────────────────────────────────────────────────
INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 42.0000000000, 'OIL',
    '1 BBL = 42 US gallons — exact, API standard'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'BBL' AND t.uom_code = 'GAL';

INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 0.0238095238, 'OIL',
    '1 US gallon = 1/42 BBL'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'GAL' AND t.uom_code = 'BBL';

INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 0.1589872950, 'OIL',
    '1 BBL = 0.158987 m³ (US barrel = 42 gal × 3.785412 L) — exact'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'BBL' AND t.uom_code = 'CBM';

INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 6.2898107704, 'OIL',
    '1 m³ = 6.28981 BBL'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'CBM' AND t.uom_code = 'BBL';

-- BBL ↔ MT and CBM ↔ MT are NOT seeded here.
-- These are cross-type (VOLUME→WEIGHT) conversions that require product-specific density.
-- Every OIL product has a different density:
--   Brent crude  ~833 kg/m³  → 1 BBL = 0.13245 MT
--   WTI crude    ~825 kg/m³  → 1 BBL = 0.13118 MT
--   Gas Oil/ULSD ~845 kg/m³  → 1 BBL = 0.13436 MT
--   Naphtha      ~720 kg/m³  → 1 BBL = 0.11447 MT
--   Fuel Oil 380 ~990 kg/m³  → 1 BBL = 0.15741 MT
-- A single commodity-level factor would be wrong for almost every product.
-- Formula used by the position engine: MT = BBL × 0.158987 × density_kg_m3 / 1000
-- Set density_estimate_kg_m3 and density_base_kg_m3 on each product in section 4 below.

-- ── ENERGY — GAS ──────────────────────────────────────────────────────────────
INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 3.4121414800, 'GAS',
    '1 MWh = 3.412142 MMBTU — exact thermodynamic (1 BTU = 0.293071 Wh)'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'MWH' AND t.uom_code = 'MMBTU';

INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 0.2930710800, 'GAS',
    '1 MMBTU = 0.293071 MWh'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'MMBTU' AND t.uom_code = 'MWH';

INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 34.1214148000, 'GAS',
    '1 MWh = 34.1214 Therms'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'MWH' AND t.uom_code = 'THERM';

INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 0.0293071080, 'GAS',
    '1 Therm = 0.0293071 MWh (= 100,000 BTU)'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'THERM' AND t.uom_code = 'MWH';

INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 3.6000000000, 'GAS',
    '1 MWh = 3.6 GJ — exact (1 W = 1 J/s)'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'MWH' AND t.uom_code = 'GJ';

INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 0.2777777778, 'GAS',
    '1 GJ = 0.27778 MWh'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'GJ' AND t.uom_code = 'MWH';

INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 1.0550558526, 'GAS',
    '1 MMBTU = 1.055056 GJ — exact (1 BTU = 1055.06 J)'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'MMBTU' AND t.uom_code = 'GJ';

INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 0.9478171203, 'GAS',
    '1 GJ = 0.947817 MMBTU'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'GJ' AND t.uom_code = 'MMBTU';

-- SCM ↔ MMBTU and SCM ↔ MWH are NOT seeded here.
-- These are cross-type (VOLUME→ENERGY) conversions that require product-specific GCV.
-- Every GAS product has a different calorific value:
--   TTF H-Gas  GCV ~38.5 MJ/scm → 1 SCM = 0.010694 MWh = 0.036490 MMBTU
--   NBP        GCV ~39.5 MJ/scm → 1 SCM = 0.010972 MWh = 0.037451 MMBTU
--   JKM LNG    GCV ~50.4 MJ/scm → 1 SCM = 0.014000 MWh = 0.047774 MMBTU
--   L-Gas      GCV ~33.5 MJ/scm → 1 SCM = 0.009306 MWh = 0.031761 MMBTU
-- A single commodity-level factor would be wrong for every product.
-- Formula used by the position engine:
--   MWh   = SCM × cv_gross_mj_scm / 3600
--   MMBTU = SCM × cv_gross_mj_scm / 1055.056
-- Set cv_gross_mj_scm and cv_net_mj_scm on each product in section 4 below.

-- ── POWER ─────────────────────────────────────────────────────────────────────
INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 1000.0000000000, 'POWER',
    '1 GWh = 1,000 MWh'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'GWH' AND t.uom_code = 'MWH';

INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 0.0010000000, 'POWER',
    '1 MWh = 0.001 GWh'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'MWH' AND t.uom_code = 'GWH';

INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 3.6000000000, 'POWER',
    '1 MWh = 3.6 GJ — exact'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'MWH' AND t.uom_code = 'GJ';

-- ── AGRICULTURAL ──────────────────────────────────────────────────────────────
-- 60-lb bushel (wheat, corn, soybeans — all 60 lb per CBOT standard)
INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 0.0272155000, 'AGRICULTURAL',
    '1 bushel (60 lb) = 27.2155 kg = 0.0272155 MT. '
    + 'Applies to wheat, corn, soybeans (all 60 lb/bu per CBOT). '
    + 'Sorghum: 56 lb/bu → 0.02540 MT/bu.'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'BUSHEL' AND t.uom_code = 'MT';

INSERT INTO dbo.uom_conversion (from_uom_id, to_uom_id, factor, commodity_type, notes)
SELECT f.uom_id, t.uom_id, 36.7437000000, 'AGRICULTURAL',
    '1 MT = 36.7437 bushels (60 lb/bu wheat/corn/soy standard)'
FROM dbo.unit_of_measure f, dbo.unit_of_measure t
WHERE f.uom_code = 'MT' AND t.uom_code = 'BUSHEL';

-- =============================================================================
-- 4. UPDATE EXISTING SEEDED PRODUCTS WITH PRICING BASIS
-- =============================================================================

-- OIL — crude and refined products (density in kg/m³)
-- Brent crude: API ~38.5° → density ~833 kg/m³. Range 28–46° API = 792–884 kg/m³
UPDATE dbo.product
    SET density_estimate_kg_m3 = 833.0, density_base_kg_m3 = 833.0
WHERE product_code = 'BRENT-CRUDE';

UPDATE dbo.product
    SET density_estimate_kg_m3 = 825.0, density_base_kg_m3 = 825.0
WHERE product_code = 'WTI-CRUDE';

UPDATE dbo.product
    SET density_estimate_kg_m3 = 833.0, density_base_kg_m3 = 833.0
WHERE product_code = 'BRENT-FUTURES';

UPDATE dbo.product
    SET density_estimate_kg_m3 = 833.0, density_base_kg_m3 = 833.0
WHERE product_code = 'ICE-BRENT-OPT';

UPDATE dbo.product
    SET density_estimate_kg_m3 = 845.0, density_base_kg_m3 = 845.0
WHERE product_code = 'HEATING-OIL';   -- Gas Oil / Heating Oil

UPDATE dbo.product
    SET density_estimate_kg_m3 = 845.0, density_base_kg_m3 = 845.0
WHERE product_code = 'ULSD-10PPM';    -- EN590 ULSD density range 820–845 kg/m³

-- GAS — calorific values
-- TTF H-Gas: GCV 35.17–41.89 MJ/scm (typical ~38.5), NCV ~34.6 MJ/scm
UPDATE dbo.product
    SET cv_gross_mj_scm = 38.500, cv_net_mj_scm = 34.640
WHERE product_code = 'TTF-GAS';

UPDATE dbo.product
    SET cv_gross_mj_scm = 39.500, cv_net_mj_scm = 35.670
WHERE product_code = 'NBP-GAS';

-- LNG: JKM cargo GCV ~50.4 MJ/kg (higher than pipeline gas due to liquid form)
UPDATE dbo.product
    SET cv_gross_mj_scm = 50.4, cv_net_mj_scm = 45.6
WHERE product_code = 'JKM-LNG';

-- METALS — purity basis
UPDATE dbo.product SET purity_basis_pct = 99.9935 WHERE product_code = 'LME-COPPER';
UPDATE dbo.product SET purity_basis_pct = 99.700  WHERE product_code = 'LME-ALUMINIUM';

-- OIL blends — component products with density
-- Ethanol: density 789 kg/m³ (anhydrous), estimate 794 kg/m³ (denatured grade)
UPDATE dbo.product
    SET density_estimate_kg_m3 = 794.0, density_base_kg_m3 = 789.0
WHERE product_code = 'ETHANOL';

-- AGRI — moisture and protein basis
-- CBOT Corn No.2 Yellow: standard moisture 15.5%, min test weight 56 lb/bu
UPDATE dbo.product
    SET moisture_basis_pct = 14.5, protein_basis_pct = NULL
WHERE product_code = 'CBOT-CORN';

-- =============================================================================
-- 5. ADDITIONAL SPEC_PARAMETER ROWS — filling commodity gaps
-- =============================================================================

INSERT INTO dbo.spec_parameter
    (commodity_type, parameter_code, parameter_name, parameter_category, data_type, decimal_places, description)
VALUES

-- ── OIL — additional (refinery/crude quality parameters) ─────────────────────
('OIL','TAN',           'Total Acid Number (mg KOH/g)', 'CHEMICAL',  'DECIMAL', 3,
 'Corrosivity indicator. Crude TAN > 0.5 mg KOH/g = high-acid crude (HAC). Affects refinery margins and equipment cost.'),

('OIL','CCR_PCT',       'Conradson Carbon Residue (%wt)', 'CHEMICAL', 'DECIMAL', 2,
 'Coke-forming tendency. High CCR (>5%) degrades FCC/coker feedstock. Key metric for heavy crude upgrading economics.'),

('OIL','WAX_PCT',       'Wax Content (%wt)',           'PHYSICAL',  'DECIMAL', 1,
 'Paraffin wax content. High wax (>10%) raises pour point, creating flow assurance problems in sub-Arctic pipelines.'),

('OIL','ASPHALTENE_PCT','Asphaltene Content (%wt)',    'CHEMICAL',  'DECIMAL', 2,
 'Heavy aromatic fraction. High asphaltenes cause fouling, emulsification, and sludge in processing. Key for VRU economics.'),

('OIL','NAPHTHA_YIELD', 'Naphtha Yield (%vol)',        'QUALITY',   'DECIMAL', 1,
 'Light naphtha fraction (IBP–150°C) from crude assay. Higher yield = more gasoline blending stock value.'),

('OIL','DISTILLATE_YIELD','Distillate Yield (%vol)',   'QUALITY',   'DECIMAL', 1,
 'Middle distillate fraction (150–370°C) — jet fuel + gasoil/diesel yield. Key crude quality driver for European refiners.'),

('OIL','RESIDUE_YIELD', 'Vacuum Residue Yield (%wt)', 'QUALITY',   'DECIMAL', 1,
 'Bottom-of-barrel fraction (vacuum residue, 565°C+). Drives coker/upgrader margin. Higher residue = lower crude value.'),

('OIL','CLOUD_POINT',   'Cloud Point (°C)',            'PHYSICAL',  'DECIMAL', 0,
 'Temperature at which wax crystals first appear. Critical for diesel cold flow specification in winter-grade fuel markets.'),

('OIL','COLD_FILTER',   'Cold Filter Plugging Point (°C)', 'PHYSICAL','DECIMAL',0,
 'CFPP — temperature at which fuel fails to pass through a filter. EN590 winter/arctic grades: max –20°C to –44°C.'),

-- ── GAS — additional ─────────────────────────────────────────────────────────
('GAS','PROPANE_PCT',   'Propane Content (%mol)',      'CHEMICAL',  'DECIMAL', 3,
 'Propane mole fraction. High propane raises calorific value but may cause condensation. TTF H-Gas: typically <5%.'),

('GAS','BUTANE_PCT',    'Butane Content (%mol)',       'CHEMICAL',  'DECIMAL', 3,
 'n-Butane + iso-Butane combined mole fraction. Contributes to LPG recovery and calorific value.'),

('GAS','C5PLUS_PCT',    'C5+ Heavier Hydrocarbons (%mol)', 'CHEMICAL','DECIMAL', 3,
 'Pentane and heavier. Presence increases risk of retrograde condensation in pipelines. Hydrocarbon dew point concern.'),

('GAS','RELATIVE_DENSITY','Relative Density (vs air)', 'PHYSICAL', 'DECIMAL', 4,
 'Gas specific gravity relative to air (= 1.0). Methane pure = 0.5539. Higher value = heavier, lower Wobbe Index.'),

('GAS','OXYGEN_PCT',    'Oxygen Content (%mol)',       'CHEMICAL',  'DECIMAL', 3,
 'Oxygen mole fraction as percentage (not ppm). GTS/EFET limit: max 0.001% mol in H-Gas. Corrosion driver.'),

-- ── METALS — additional (impurity elements per LME/ASTM) ─────────────────────
('METALS','ALUMINIUM_PCT',  'Aluminium Impurity (%)',  'CHEMICAL',  'DECIMAL', 4,
 'Aluminium content (impurity in copper/nickel). LME Cu Grade A: Al < 0.0015%. Affects electrical conductivity.'),

('METALS','IRON_PCT',       'Iron Impurity (%)',       'CHEMICAL',  'DECIMAL', 4,
 'Iron content (impurity). LME Cu Grade A: Fe < 0.005%. Elevated Fe degrades ductility and conductivity.'),

('METALS','ANTIMONY_PCT',   'Antimony Impurity (%)',   'CHEMICAL',  'DECIMAL', 4,
 'Antimony content. LME Cu Grade A: Sb < 0.002%. Highly restricted toxic impurity.'),

('METALS','ARSENIC_PCT',    'Arsenic Impurity (%)',    'CHEMICAL',  'DECIMAL', 4,
 'Arsenic content. LME Cu Grade A: As < 0.0005%. Environmental and health restriction.'),

('METALS','GOLD_FINENESS',  'Gold Fineness (ppt)',     'QUALITY',   'DECIMAL', 1,
 'Gold purity in parts per thousand. LBMA Good Delivery gold bar: minimum 995.0. 24-carat = 999.9 fine.'),

('METALS','NICKEL_PURITY',  'Nickel Purity (%)',       'QUALITY',   'DECIMAL', 3,
 'Nickel content for LME nickel contracts. LME Full-Plate cathode: Ni > 99.80%. Briquettes: Ni > 99.0%.'),

-- ── AGRICULTURAL — additional ─────────────────────────────────────────────────
('AGRICULTURAL','OIL_CONTENT_PCT', 'Oil Content (%)',  'QUALITY',   'DECIMAL', 1,
 'Oil content (fat) by dry basis. Soybeans: typically 18–22%. Rapeseed/Canola: 40–45%. Pricing driver for crush margin.'),

('AGRICULTURAL','STARCH_PCT',      'Starch Content (%)','QUALITY',  'DECIMAL', 1,
 'Starch content. Corn/maize: typically 65–72%. Key feedstock quality for ethanol production. Higher starch = more ethanol yield.'),

('AGRICULTURAL','SCREENINGS_PCT',  'Screenings/Admixture (%)', 'QUALITY','DECIMAL',1,
 'Weed seeds and other grains. CBOT wheat: max 2.0%. EU Grade 1: max 3%. Affects flour yield.'),

('AGRICULTURAL','HECTOLITRE_WT',   'Hectolitre Weight (kg/hl)', 'PHYSICAL','DECIMAL',1,
 'Volume weight of grain. Equivalent to EU test weight. Milling wheat: min 76 kg/hl EU premium. Related to flour extraction rate.'),

-- ── POWER — additional ────────────────────────────────────────────────────────
('POWER','CO2_INTENSITY',   'CO2 Intensity (g/kWh)',   'REGULATORY','DECIMAL', 1,
 'Carbon dioxide emission intensity. Grid average EU: ~230 g/kWh. Gas peaker: ~400. Wind: <10. Used for green power contracts.'),

('POWER','RENEWABLE_CERT',  'Renewable Energy Certificate', 'REGULATORY','BOOLEAN',0,
 'Whether the power is covered by a GO (Guarantee of Origin, EU), REC (US), or equivalent renewable certificate.'),

('POWER','LOAD_FACTOR',     'Load Factor / Capacity Factor (%)', 'QUALITY','DECIMAL',1,
 'Ratio of actual energy produced to maximum possible. Baseload nuclear: ~90%. Offshore wind: ~40–50%. Used in power purchase agreements.');
GO

PRINT '============================================================';
PRINT 'V25 APPLIED: Pricing Basis + UoM Conversions + Spec Parameters';
PRINT '  - 7 pricing basis columns added to product table';
PRINT '  - 6 new unit_of_measure rows (GJ, SCM, MMSCM, LB, GAL, CBM)';
PRINT '  - 21 uom_conversion seed rows (OIL volume-only, GAS energy-only, POWER, AGRI, weight/metals)';
PRINT '  - Seeded pricing basis on 12 existing products';
PRINT '  - 26 new spec_parameter rows across all commodity types';
PRINT '============================================================';
