-- =============================================================================
-- V24 — Product Blend Components + Quality Spec Seed Data
--
-- 1. ALTER product     — add is_blend flag + blend_notes
-- 2. ALTER spec_parameter — add refined-product parameters (density, cetane, etc.)
-- 3. CREATE product_blend_component — M:M bridge for blended products
-- 4. INSERT products   — ULSD-10PPM, ETHANOL (components) + GAS97-BLEND (parent)
-- 5. INSERT blend components for GAS97-BLEND (97% ULSD + 3% Ethanol)
-- 6. INSERT product_spec_template — Brent, WTI, TTF Gas, LME Copper, ULSD-10PPM
-- 7. INSERT product_spec_value   — industry-standard min/max/typical bounds
-- =============================================================================

-- =============================================================================
-- 1. ADD is_blend + blend_notes TO dbo.product
-- =============================================================================
ALTER TABLE dbo.product
    ADD is_blend    BIT          NOT NULL DEFAULT 0,
        blend_notes VARCHAR(500) NULL;
GO

-- =============================================================================
-- 2. ADDITIONAL SPEC PARAMETERS — Refined products / ULSD / diesel quality
-- (supplements the 38 seeded in V4 for OIL commodity)
-- =============================================================================
INSERT INTO dbo.spec_parameter
    (commodity_type, parameter_code, parameter_name, parameter_category, data_type, decimal_places, description)
VALUES
('OIL','DENSITY_KGL',    'Density @ 15°C (kg/L)',          'PHYSICAL', 'DECIMAL', 4,
 'Density of petroleum product at 15°C. ULSD/EN590: 0.820–0.845 kg/L. Crude typically 0.82–0.92.'),

('OIL','CETANE_INDEX',   'Cetane Index / Number',           'QUALITY',  'DECIMAL', 0,
 'Ignition quality of diesel fuel. EN590 minimum 51. Higher = better cold weather combustion.'),

('OIL','DISTILL_T90',    'Distillation T90 (°C)',           'PHYSICAL', 'DECIMAL', 0,
 'Temperature at which 90% of sample evaporates (ASTM D86 / EN ISO 3405).'),

('OIL','DISTILL_T95',    'Distillation T95 (°C)',           'PHYSICAL', 'DECIMAL', 0,
 'Temperature at which 95% of sample evaporates. EN590 max 360°C for ULSD.'),

('OIL','LUBRICITY',      'Lubricity HFRR (µm)',             'PHYSICAL', 'DECIMAL', 0,
 'High Frequency Reciprocating Rig wear scar diameter. EN590 max 460 µm.'),

('OIL','POLYCYCLIC_PCT', 'Polycyclic Aromatic HC (%m/m)',   'CHEMICAL', 'DECIMAL', 1,
 'Polycyclic aromatic hydrocarbon content by mass. EN590 max 8%.'),

('OIL','ETHANOL_PCT',    'Ethanol Blend Content (%vol)',    'QUALITY',  'DECIMAL', 1,
 'Volumetric percentage of ethanol in blended fuel. E5 = max 5%, E10 = max 10%.'),

('OIL','FAME_PCT',       'FAME / Biodiesel Content (%vol)', 'QUALITY',  'DECIMAL', 1,
 'Fatty Acid Methyl Ester content. B7 diesel = max 7% FAME per EN14214.'),

-- Gas — additional
('GAS','ETHANE_PCT',     'Ethane Content (%mol)',            'CHEMICAL', 'DECIMAL', 3,
 'Ethane mole fraction in natural gas. Relevant for LNG composition and heating value.'),

('GAS','NITROGEN_PCT',   'Nitrogen Content (%mol)',          'CHEMICAL', 'DECIMAL', 3,
 'Nitrogen mole fraction. High N2 reduces heating value — affects Wobbe index.'),

-- Metals — additional
('METALS','SILVER_PCT',  'Silver Content (%)',               'CHEMICAL', 'DECIMAL', 4,
 'Silver content. Included in LME Grade A copper purity (Cu+Ag ≥ 99.9935%).'),

-- Agricultural — additional
('AGRICULTURAL','FALLING_NUMBER', 'Falling Number (sec)',    'QUALITY',  'DECIMAL', 0,
 'Measure of grain enzyme activity — indirect indicator of sprout damage. Milling wheat min 250 sec.'),

('AGRICULTURAL','GLUTEN_PCT',     'Wet Gluten Content (%)',  'QUALITY',  'DECIMAL', 1,
 'Gluten content for milling wheat. EU premium wheat: typically min 28%. Affects bread-making suitability.');
GO

-- =============================================================================
-- 3. CREATE product_blend_component
-- Stores the recipe for blended products (e.g. GAS97 = 97% ULSD + 3% Ethanol).
-- All percentages are on a VOLUME basis unless noted in the notes field.
-- =============================================================================
IF OBJECT_ID('dbo.product_blend_component', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.product_blend_component (
        blend_component_id    INT          NOT NULL IDENTITY(1,1),
        parent_product_id     INT          NOT NULL,   -- the blended product
        component_product_id  INT          NOT NULL,   -- a constituent product
        sequence_no           TINYINT      NOT NULL DEFAULT 1,  -- display order
        min_pct               DECIMAL(5,2) NULL,       -- minimum acceptable % (volume basis)
        target_pct            DECIMAL(5,2) NOT NULL,   -- target/nominal % (volume basis)
        max_pct               DECIMAL(5,2) NULL,       -- maximum acceptable % (volume basis)
        tolerance_pct         DECIMAL(5,2) NOT NULL DEFAULT 0.50,  -- blending tolerance
        notes                 VARCHAR(500) NULL,
        is_active             BIT          NOT NULL DEFAULT 1,
        created_at            DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by            VARCHAR(100) NULL,

        CONSTRAINT pk_pbc            PRIMARY KEY (blend_component_id),
        CONSTRAINT uq_pbc            UNIQUE      (parent_product_id, component_product_id),
        CONSTRAINT fk_pbc_parent     FOREIGN KEY (parent_product_id)
                                     REFERENCES  dbo.product(product_id),
        CONSTRAINT fk_pbc_component  FOREIGN KEY (component_product_id)
                                     REFERENCES  dbo.product(product_id),
        CONSTRAINT chk_pbc_self      CHECK (parent_product_id <> component_product_id),
        CONSTRAINT chk_pbc_target    CHECK (target_pct > 0 AND target_pct <= 100),
        CONSTRAINT chk_pbc_range     CHECK (min_pct IS NULL OR max_pct IS NULL
                                            OR max_pct >= min_pct)
    );
END
GO
CREATE INDEX ix_pbc_parent ON dbo.product_blend_component (parent_product_id, is_active);
GO

-- =============================================================================
-- 4. SEED PRODUCTS — blend component products + example blended product
-- All FK lookups use subqueries (no hardcoded IDs)
-- =============================================================================

-- ULSD-10PPM (base component)
INSERT INTO dbo.product
    (commodity_id, product_code, product_name, settlement_type,
     default_pricing_type_id, default_uom_id, default_currency_id, default_incoterm_id,
     grade_code, product_family, bloomberg_ticker, reuters_ric, platts_code,
     is_exchange_traded, is_otc, is_blend, description, is_active, created_by)
SELECT
    (SELECT commodity_id FROM dbo.commodity WHERE commodity_code = 'OIL'),
    'ULSD-10PPM', 'Ultra-Low Sulphur Diesel 10ppm', 'PHYSICAL',
    (SELECT pricing_type_id FROM dbo.pricing_type WHERE type_code = 'DIFFERENTIAL'),
    (SELECT uom_id FROM dbo.unit_of_measure WHERE uom_code = 'MT'),
    (SELECT currency_id FROM dbo.currency WHERE currency_code = 'USD'),
    (SELECT incoterm_id FROM dbo.incoterm WHERE code = 'CIF'),
    'ULSD_10PPM', 'REFINED_PRODUCTS', 'QS1 Comdty', 'LGOc1', 'AAGLD00',
    0, 1, 0,
    'EN590 Ultra-Low Sulphur Diesel, max 10ppm sulphur. European road diesel standard. Platts Barges FOB ARA benchmark.',
    1, 'SYSTEM';
GO

-- ETHANOL (base component — fuel grade, denatured)
INSERT INTO dbo.product
    (commodity_id, product_code, product_name, settlement_type,
     default_pricing_type_id, default_uom_id, default_currency_id, default_incoterm_id,
     grade_code, product_family,
     is_exchange_traded, is_otc, is_blend, description, is_active, created_by)
SELECT
    (SELECT commodity_id FROM dbo.commodity WHERE commodity_code = 'OIL'),
    'ETHANOL', 'Fuel Ethanol (Denatured, Industrial Grade)', 'PHYSICAL',
    (SELECT pricing_type_id FROM dbo.pricing_type WHERE type_code = 'INDEX'),
    (SELECT uom_id FROM dbo.unit_of_measure WHERE uom_code = 'MT'),
    (SELECT currency_id FROM dbo.currency WHERE currency_code = 'USD'),
    (SELECT incoterm_id FROM dbo.incoterm WHERE code = 'FOB'),
    'DENATURED', 'REFINED_PRODUCTS',
    0, 1, 0,
    'Denatured fuel-grade ethanol (99.7% purity, water max 0.3%) for blending into road fuel. Used in E5/E10/E85. Typically traded $/mt or $/m³.',
    1, 'SYSTEM';
GO

-- GAS97-BLEND (blended product — 97% ULSD + 3% Ethanol)
INSERT INTO dbo.product
    (commodity_id, product_code, product_name, settlement_type,
     default_pricing_type_id, default_uom_id, default_currency_id, default_incoterm_id,
     grade_code, product_family,
     is_exchange_traded, is_otc, is_blend, blend_notes, description, is_active, created_by)
SELECT
    (SELECT commodity_id FROM dbo.commodity WHERE commodity_code = 'OIL'),
    'GAS97-BLEND', 'Gasoline 97 E3 (97%vol ULSD / 3%vol Ethanol)', 'PHYSICAL',
    (SELECT pricing_type_id FROM dbo.pricing_type WHERE type_code = 'FORMULA'),
    (SELECT uom_id FROM dbo.unit_of_measure WHERE uom_code = 'MT'),
    (SELECT currency_id FROM dbo.currency WHERE currency_code = 'USD'),
    (SELECT incoterm_id FROM dbo.incoterm WHERE code = 'CIF'),
    'EURO_5', 'REFINED_PRODUCTS',
    0, 1, 1,
    'Recipe: 97%vol ULSD-10PPM base + 3%vol denatured fuel ethanol. Final blend meets EN228 Euro-5. Sulphur max 10ppm after blending. API gravity approx 36–38°.',
    'Blended road fuel — 97 octane Euro-5 gasoline. Manufactured by in-line or splash blending of ULSD-10PPM base stock with denatured fuel ethanol. Pricing = weighted average of component prices by volume.',
    1, 'SYSTEM';
GO

-- =============================================================================
-- 5. BLEND COMPONENTS for GAS97-BLEND
-- =============================================================================
INSERT INTO dbo.product_blend_component
    (parent_product_id, component_product_id, sequence_no,
     min_pct, target_pct, max_pct, tolerance_pct, notes, created_by)
SELECT
    (SELECT product_id FROM dbo.product WHERE product_code = 'GAS97-BLEND'),
    (SELECT product_id FROM dbo.product WHERE product_code = 'ULSD-10PPM'),
    1, 95.00, 97.00, 99.00, 0.50,
    'ULSD-10PPM base component — volume basis. Target 97%vol, tolerance ±0.5%vol. Sulphur must be ≤10ppm before blending.',
    'SYSTEM';

INSERT INTO dbo.product_blend_component
    (parent_product_id, component_product_id, sequence_no,
     min_pct, target_pct, max_pct, tolerance_pct, notes, created_by)
SELECT
    (SELECT product_id FROM dbo.product WHERE product_code = 'GAS97-BLEND'),
    (SELECT product_id FROM dbo.product WHERE product_code = 'ETHANOL'),
    2, 1.00, 3.00, 5.00, 0.25,
    'Denatured ethanol component — volume basis. Target 3%vol (E3). Max 5%vol (EN228 E5 limit). Must meet EN15376 ethanol quality.',
    'SYSTEM';
GO

-- =============================================================================
-- 5b. SEED BENCHMARK PRODUCTS referenced by section 6 below
-- (BRENT-CRUDE, WTI-CRUDE, TTF-GAS, LME-COPPER were never seeded anywhere
-- in the migration chain before this file assumed they already existed —
-- V23's own UPDATE ... WHERE product_code = 'BRENT-CRUDE' etc. is a
-- harmless no-op against a nonexistent row, which is how this went
-- unnoticed until section 6's INSERT ... SELECT hit a NOT NULL violation.)
-- =============================================================================
INSERT INTO dbo.product
    (commodity_id, product_code, product_name, settlement_type,
     default_pricing_type_id, default_uom_id, default_currency_id, default_incoterm_id,
     is_exchange_traded, is_otc, is_blend, description, is_active, created_by)
SELECT
    (SELECT commodity_id FROM dbo.commodity WHERE commodity_code = 'OIL'),
    'BRENT-CRUDE', 'Dated Brent Crude Oil', 'PHYSICAL',
    (SELECT pricing_type_id FROM dbo.pricing_type WHERE type_code = 'INDEX'),
    (SELECT uom_id FROM dbo.unit_of_measure WHERE uom_code = 'BBL'),
    (SELECT currency_id FROM dbo.currency WHERE currency_code = 'USD'),
    (SELECT incoterm_id FROM dbo.incoterm WHERE code = 'FOB'),
    0, 1, 0,
    'Dated Brent physical crude — Forties/Oseberg/Ekofisk/Brent (BFOE) basket, North Sea loadable quality.',
    1, 'SYSTEM';
GO

INSERT INTO dbo.product
    (commodity_id, product_code, product_name, settlement_type,
     default_pricing_type_id, default_uom_id, default_currency_id, default_incoterm_id,
     is_exchange_traded, is_otc, is_blend, description, is_active, created_by)
SELECT
    (SELECT commodity_id FROM dbo.commodity WHERE commodity_code = 'OIL'),
    'WTI-CRUDE', 'West Texas Intermediate Crude Oil', 'PHYSICAL',
    (SELECT pricing_type_id FROM dbo.pricing_type WHERE type_code = 'INDEX'),
    (SELECT uom_id FROM dbo.unit_of_measure WHERE uom_code = 'BBL'),
    (SELECT currency_id FROM dbo.currency WHERE currency_code = 'USD'),
    (SELECT incoterm_id FROM dbo.incoterm WHERE code = 'FOB'),
    0, 1, 0,
    'WTI light sweet crude, Cushing OK delivery — NYMEX benchmark grade.',
    1, 'SYSTEM';
GO

INSERT INTO dbo.product
    (commodity_id, product_code, product_name, settlement_type,
     default_pricing_type_id, default_uom_id, default_currency_id, default_incoterm_id,
     is_exchange_traded, is_otc, is_blend, description, is_active, created_by)
SELECT
    (SELECT commodity_id FROM dbo.commodity WHERE commodity_code = 'GAS'),
    'TTF-GAS', 'Title Transfer Facility Natural Gas', 'PHYSICAL',
    (SELECT pricing_type_id FROM dbo.pricing_type WHERE type_code = 'INDEX'),
    (SELECT uom_id FROM dbo.unit_of_measure WHERE uom_code = 'MMBTU'),
    (SELECT currency_id FROM dbo.currency WHERE currency_code = 'EUR'),
    NULL,
    1, 0, 0,
    'TTF — Dutch virtual gas trading hub, primary European gas benchmark (ICE Endex futures).',
    1, 'SYSTEM';
GO

INSERT INTO dbo.product
    (commodity_id, product_code, product_name, settlement_type,
     default_pricing_type_id, default_uom_id, default_currency_id, default_incoterm_id,
     is_exchange_traded, is_otc, is_blend, description, is_active, created_by)
SELECT
    (SELECT commodity_id FROM dbo.commodity WHERE commodity_code = 'METALS'),
    'LME-COPPER', 'LME Grade A Copper', 'PHYSICAL',
    (SELECT pricing_type_id FROM dbo.pricing_type WHERE type_code = 'INDEX'),
    (SELECT uom_id FROM dbo.unit_of_measure WHERE uom_code = 'MT_MET'),
    (SELECT currency_id FROM dbo.currency WHERE currency_code = 'USD'),
    NULL,
    1, 0, 0,
    'LME Grade A copper cathode, min 99.9935% purity per BS EN 1978:1998.',
    1, 'SYSTEM';
GO

-- =============================================================================
-- 6. PRODUCT_SPEC_TEMPLATE — one per product, real market standards
-- =============================================================================

-- Dated Brent / BFOE Standard
INSERT INTO dbo.product_spec_template
    (product_id, template_code, template_name, commodity_type, is_default,
     issuing_body, standard_ref, version, effective_from, is_active, notes, created_by, updated_by)
SELECT
    (SELECT product_id FROM dbo.product WHERE product_code = 'BRENT-CRUDE'),
    'DTBRT_BFOE_STD', 'Dated Brent / BFOE Standard Loadable Quality', 'OIL', 1,
    'Platts / Shell / BP / TotalEnergies', 'BFOE Memorandum of Understanding', '2023', '2023-01-01', 1,
    'Forties, Oseberg, Ekofisk, Brent blend loadable quality. Basis for Dated Brent price assessment.',
    'SYSTEM', 'SYSTEM';

-- WTI Crude NYMEX
INSERT INTO dbo.product_spec_template
    (product_id, template_code, template_name, commodity_type, is_default,
     issuing_body, standard_ref, version, effective_from, is_active, notes, created_by, updated_by)
SELECT
    (SELECT product_id FROM dbo.product WHERE product_code = 'WTI-CRUDE'),
    'WTI_NYMEX_STD', 'WTI Crude NYMEX Contract Specification', 'OIL', 1,
    'CME Group / NYMEX', 'NYMEX Rule 200.00 — Light Sweet Crude Oil', '2023', '1983-03-30', 1,
    'Light sweet crude deliverable into Cushing OK pipeline network per NYMEX futures contract spec.',
    'SYSTEM', 'SYSTEM';

-- TTF Natural Gas EFET
INSERT INTO dbo.product_spec_template
    (product_id, template_code, template_name, commodity_type, is_default,
     issuing_body, standard_ref, version, effective_from, is_active, notes, created_by, updated_by)
SELECT
    (SELECT product_id FROM dbo.product WHERE product_code = 'TTF-GAS'),
    'TTF_EFET_2020', 'TTF Natural Gas — H-Gas Quality per GTS Network Code', 'GAS', 1,
    'EFET / GTS (Gasunie Transport Services)', 'NTA 8000 / Interconnection Agreement', '2020', '2020-01-01', 1,
    'H-Gas quality specification for delivery at TTF virtual trading point. GCV range, Wobbe index, methane content per NTA 8000.',
    'SYSTEM', 'SYSTEM';

-- LME Grade A Copper
INSERT INTO dbo.product_spec_template
    (product_id, template_code, template_name, commodity_type, is_default,
     issuing_body, standard_ref, version, effective_from, is_active, notes, created_by, updated_by)
SELECT
    (SELECT product_id FROM dbo.product WHERE product_code = 'LME-COPPER'),
    'LME_CU_GRADE_A', 'LME Grade A Copper Chemical Specification', 'METALS', 1,
    'London Metal Exchange', 'LME Rules and Regulations — Annex A / BS EN 1978:1998', '2022', '1993-01-01', 1,
    'Cathodes, wire-bars, billets and rods. Cu+Ag ≥ 99.9935%. Must be from LME-registered brand.',
    'SYSTEM', 'SYSTEM';

-- ULSD-10PPM EN590
INSERT INTO dbo.product_spec_template
    (product_id, template_code, template_name, commodity_type, is_default,
     issuing_body, standard_ref, version, effective_from, is_active, notes, created_by, updated_by)
SELECT
    (SELECT product_id FROM dbo.product WHERE product_code = 'ULSD-10PPM'),
    'EN590_10PPM', 'EN 590 Ultra-Low Sulphur Diesel — European Road Fuel Standard', 'OIL', 1,
    'European Committee for Standardization (CEN)', 'EN 590:2022+A1', '2022', '2022-01-01', 1,
    'European standard for automotive diesel. Applies to FOB Rotterdam barges, CIF ARA, and inland EU deliveries.',
    'SYSTEM', 'SYSTEM';

-- GAS97-BLEND internal blend spec
INSERT INTO dbo.product_spec_template
    (product_id, template_code, template_name, commodity_type, is_default,
     issuing_body, standard_ref, version, effective_from, is_active, notes, created_by, updated_by)
SELECT
    (SELECT product_id FROM dbo.product WHERE product_code = 'GAS97-BLEND'),
    'GAS97_INTERNAL', 'Gasoline 97 E3 Internal Blend Specification', 'OIL', 1,
    'Internal / EN 228', 'EN 228:2012+A1 (E5 max) / Internal Blend Spec v2.1', '2023', '2023-01-01', 1,
    'Internal quality spec for 97%vol ULSD + 3%vol ethanol blend. Final product must meet EN228 Euro-5.',
    'SYSTEM', 'SYSTEM';
GO

-- =============================================================================
-- 7. PRODUCT_SPEC_VALUE — actual quality bounds per template
-- All parameter lookups by parameter_code to avoid hardcoded IDs
-- =============================================================================

-- ── BRENT CRUDE / DTBRT_BFOE_STD ──────────────────────────────────────────────
INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_min, value_max, value_typical, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'RANGE', 28.0, 46.0, 38.5, 1, 'ASTM D5002',
    'Forties ~40-41°, Oseberg ~34-36°, Ekofisk ~41-43°, Brent ~38-39°'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'DTBRT_BFOE_STD' AND p.parameter_code = 'API_GRAVITY';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_max, value_typical, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'MAX_ONLY', 0.60, 0.26, 1, 'ASTM D4294',
    'Sweet crude. Forties: ~0.26%. Ekofisk: ~0.15%.'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'DTBRT_BFOE_STD' AND p.parameter_code = 'SULPHUR_PCT';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_max, is_mandatory, test_method)
SELECT t.template_id, p.parameter_id, 'MAX_ONLY', 0.50, 1, 'ASTM D4006'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'DTBRT_BFOE_STD' AND p.parameter_code = 'BSW_PCT';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_max, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'MAX_ONLY', 50.0, 1, 'ASTM D1748',
    'Salt max 50 ptb (pounds per thousand barrels)'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'DTBRT_BFOE_STD' AND p.parameter_code = 'SALT_PTB';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_max, is_mandatory, test_method)
SELECT t.template_id, p.parameter_id, 'MAX_ONLY', 12.0, 0, 'ASTM D7042'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'DTBRT_BFOE_STD' AND p.parameter_code = 'VISCOSITY_50';

-- ── WTI CRUDE / WTI_NYMEX_STD ─────────────────────────────────────────────────
INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_min, value_max, value_typical, is_mandatory, test_method)
SELECT t.template_id, p.parameter_id,
    'RANGE', 37.0, 42.0, 39.6, 1, 'ASTM D5002'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'WTI_NYMEX_STD' AND p.parameter_code = 'API_GRAVITY';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_max, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'MAX_ONLY', 0.42, 1, 'ASTM D4294',
    'Light sweet per NYMEX Rule 200 — max 0.42% sulphur'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'WTI_NYMEX_STD' AND p.parameter_code = 'SULPHUR_PCT';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_max, is_mandatory, test_method)
SELECT t.template_id, p.parameter_id, 'MAX_ONLY', 1.00, 1, 'ASTM D4006'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'WTI_NYMEX_STD' AND p.parameter_code = 'BSW_PCT';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_min, is_mandatory, test_method)
SELECT t.template_id, p.parameter_id, 'MIN_ONLY', -20.0, 0, 'ASTM D97'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'WTI_NYMEX_STD' AND p.parameter_code = 'POUR_POINT';

-- ── TTF GAS / TTF_EFET_2020 ───────────────────────────────────────────────────
INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_min, value_max, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'RANGE', 35.17, 41.89, 1, 'ISO 6976',
    'GCV at 25°C combustion, 15°C metering (MJ/scm, dry basis)'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'TTF_EFET_2020' AND p.parameter_code = 'GCV_MJSCM';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_min, value_max, is_mandatory, test_method)
SELECT t.template_id, p.parameter_id, 'RANGE', 46.07, 56.91, 1, 'ISO 6976'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'TTF_EFET_2020' AND p.parameter_code = 'WOBBE_INDEX';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_min, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'MIN_ONLY', 81.3, 1, 'ISO 6974',
    'H-Gas minimum methane content 81.3% mol'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'TTF_EFET_2020' AND p.parameter_code = 'METHANE_PCT';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_max, is_mandatory, test_method)
SELECT t.template_id, p.parameter_id, 'MAX_ONLY', 2.5, 1, 'ISO 6974'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'TTF_EFET_2020' AND p.parameter_code = 'CO2_PCT';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_max, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'MAX_ONLY', 5.0, 1, 'UOP 212',
    'H2S max 5.0 mg/Nm³ — odour and corrosion control'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'TTF_EFET_2020' AND p.parameter_code = 'H2S_MG';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_max, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'MAX_ONLY', -8.0, 1, 'ISO 6327',
    'Water dew point max -8°C at 70 bar (condensation prevention)'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'TTF_EFET_2020' AND p.parameter_code = 'WATER_DEW';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_max, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'MAX_ONLY', 0.1, 1, 'ISO 6974',
    'Oxygen max 0.1% mol — pipeline corrosion prevention'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'TTF_EFET_2020' AND p.parameter_code = 'OXYGEN_PPM';

-- ── LME COPPER / LME_CU_GRADE_A ──────────────────────────────────────────────
INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_min, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'MIN_ONLY', 99.9935, 1, 'EN ISO 1553',
    'Minimum 99.9935% copper + silver combined — LME Grade A requirement'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'LME_CU_GRADE_A' AND p.parameter_code = 'PURITY_PCT';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_text, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'EXACT', 'TRUE', 1, 'LME Brand Register',
    'Must be from LME-approved smelter/refiner brand list'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'LME_CU_GRADE_A' AND p.parameter_code = 'LME_BRAND';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_min, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'MIN_ONLY', 99.0, 1, 'EN ISO 1553',
    'Copper excluding silver ≥ 99.0% — silver is counted in total 99.9935% minimum'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'LME_CU_GRADE_A' AND p.parameter_code = 'COPPER_PCT';

-- ── ULSD-10PPM / EN590_10PPM ──────────────────────────────────────────────────
INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_min, value_max, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'RANGE', 0.820, 0.845, 1, 'EN ISO 12185',
    'Density at 15°C in kg/L'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'EN590_10PPM' AND p.parameter_code = 'DENSITY_KGL';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_max, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'MAX_ONLY', 0.001, 1, 'EN ISO 20884',
    'Sulphur max 10ppm expressed as 0.001% mass — ULSD threshold'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'EN590_10PPM' AND p.parameter_code = 'SULPHUR_PCT';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_min, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'MIN_ONLY', 51.0, 1, 'EN ISO 5165',
    'Cetane index minimum 51 — EN590 diesel combustion quality requirement'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'EN590_10PPM' AND p.parameter_code = 'CETANE_INDEX';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_min, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'MIN_ONLY', 55.0, 1, 'EN ISO 2719',
    'Flash point minimum 55°C — safety classification requirement for diesel'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'EN590_10PPM' AND p.parameter_code = 'FLASH_POINT';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_min, value_max, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'RANGE', 2.00, 4.50, 1, 'EN ISO 3104',
    'Kinematic viscosity at 40°C in mm²/s (cSt). Low viscosity causes pump wear; high = poor atomisation.'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'EN590_10PPM' AND p.parameter_code = 'VISCOSITY_40';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_max, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'MAX_ONLY', 360.0, 1, 'EN ISO 3405',
    'Distillation T95 max 360°C — limits heavy residue contamination'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'EN590_10PPM' AND p.parameter_code = 'DISTILL_T95';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_max, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'MAX_ONLY', 460.0, 1, 'EN ISO 12156-1',
    'HFRR lubricity max 460 µm wear scar diameter at 60°C'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'EN590_10PPM' AND p.parameter_code = 'LUBRICITY';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_max, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'MAX_ONLY', 8.0, 1, 'EN ISO 12916',
    'Polycyclic aromatic hydrocarbons max 8% m/m — EU environmental requirement'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'EN590_10PPM' AND p.parameter_code = 'POLYCYCLIC_PCT';

-- ── GAS97-BLEND / GAS97_INTERNAL ──────────────────────────────────────────────
INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_min, value_max, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'RANGE', 0.720, 0.775, 1, 'EN ISO 12185',
    'Final blend density lower than ULSD base due to ethanol addition (ethanol density ~0.789 kg/L)'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'GAS97_INTERNAL' AND p.parameter_code = 'DENSITY_KGL';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_max, is_mandatory, test_method)
SELECT t.template_id, p.parameter_id, 'MAX_ONLY', 0.001, 1, 'EN ISO 20884'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'GAS97_INTERNAL' AND p.parameter_code = 'SULPHUR_PCT';

INSERT INTO dbo.product_spec_value
    (template_id, parameter_id, bound_direction, value_min, value_max, is_mandatory, test_method, notes)
SELECT t.template_id, p.parameter_id,
    'RANGE', 2.70, 3.30, 1, 'EN ISO 5275',
    'Ethanol content 3%vol ± 0.3%vol — blend ratio target'
FROM dbo.product_spec_template t, dbo.spec_parameter p
WHERE t.template_code = 'GAS97_INTERNAL' AND p.parameter_code = 'ETHANOL_PCT';
GO

PRINT '============================================================';
PRINT 'V24 APPLIED: product_blend_component + spec seeds';
PRINT '  - is_blend, blend_notes added to product';
PRINT '  - 13 new spec_parameter rows (refined products/gas/metals/agri)';
PRINT '  - product_blend_component table created';
PRINT '  - 3 new products: ULSD-10PPM, ETHANOL, GAS97-BLEND';
PRINT '  - 2 blend component rows for GAS97-BLEND recipe';
PRINT '  - 6 product_spec_template rows (Brent, WTI, TTF, LME-Cu, ULSD, GAS97)';
PRINT '  - 32 product_spec_value rows with industry-standard bounds';
PRINT '============================================================';
