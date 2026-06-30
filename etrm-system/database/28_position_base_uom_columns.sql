-- =============================================================================
-- V28 — Position Base UoM Columns
--
-- Adds base-UoM quantity fields to position and position_eod_snapshot so the
-- position engine can store both the traded quantity (in whatever UoM the trade
-- was booked) and the normalised quantity in a standard base UoM per commodity:
--
--   OIL / METALS / AGRICULTURAL  → base UoM = MT
--   GAS / POWER                  → base UoM = MWH
--
-- CONVERSION LOGIC (computed by the position engine, not stored as a procedure):
--
--   OIL (BBL → MT):
--       MT = BBL × 0.158987 m³/BBL × product.density_estimate_kg_m3 / 1000
--       Source column: 'DENSITY_ESTIMATE'
--
--   GAS volume (SCM → MWH):
--       MWH = SCM × product.cv_gross_mj_scm / 3600
--       Source column: 'GCV_GROSS'
--
--   Same-type energy (THERM/MMBTU/GJ → MWH):
--       Uses factors from uom_conversion table (no product property needed)
--       Source column: 'ENERGY_CONVERSION'
--
--   Already in base UoM (MT or MWH):
--       net_quantity_base = net_quantity, base_uom_code = quantity_uom_code
--       Source column: 'SAME_UOM'
--
-- Physical properties (density, GCV) are stored on the product table and are
-- set via the product Pricing Basis section. There is NO commodity-level default
-- because every product has a different physical property — using a commodity
-- default would produce incorrect positions.
-- =============================================================================

ALTER TABLE dbo.position
    ADD net_quantity_base   DECIMAL(18,4)   NULL,  -- quantity in base UoM (MT or MWH)
        base_uom_code       VARCHAR(20)     NULL,  -- 'MT' or 'MWH'
        conversion_source   VARCHAR(30)     NULL   -- 'SAME_UOM' | 'DENSITY_ESTIMATE' | 'GCV_GROSS' | 'ENERGY_CONVERSION' | 'MANUAL'
        CONSTRAINT chk_pos_conv_src CHECK (
            conversion_source IS NULL OR
            conversion_source IN ('SAME_UOM', 'DENSITY_ESTIMATE', 'GCV_GROSS', 'ENERGY_CONVERSION', 'MANUAL')
        );
GO

ALTER TABLE dbo.position_eod_snapshot
    ADD net_quantity_base   DECIMAL(18,4)   NULL,
        base_uom_code       VARCHAR(20)     NULL,
        conversion_source   VARCHAR(30)     NULL
        CONSTRAINT chk_pes_conv_src CHECK (
            conversion_source IS NULL OR
            conversion_source IN ('SAME_UOM', 'DENSITY_ESTIMATE', 'GCV_GROSS', 'ENERGY_CONVERSION', 'MANUAL')
        );
GO

PRINT 'V28 APPLIED: net_quantity_base, base_uom_code, conversion_source added to position + position_eod_snapshot';
PRINT '  OIL:  MT  = BBL × 0.158987 × product.density_estimate_kg_m3 / 1000';
PRINT '  GAS:  MWH = SCM × product.cv_gross_mj_scm / 3600';
PRINT '  ENERGY units: MWH = qty × factor from uom_conversion (THERM, MMBTU, GJ)';
