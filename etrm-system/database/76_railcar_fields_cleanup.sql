-- =============================================================================
-- V76 — railcar: drop free-text approved_commodities, add build_year + weight class
-- =============================================================================
-- User asked, reviewing the Rail Cars page: "is it commodity or product?" for
-- approved_commodities (VARCHAR(500) CSV of commodity codes, no FK, dead-end
-- free text). The schema already answers this — dbo.mot_asset_product_approval
-- (V4) is a polymorphic PRODUCT-level approval table (asset_type IN VESSEL,
-- TRUCK, RAILCAR, CONTAINER, TANK) with approval status + validity dates, but
-- had zero frontend wiring anywhere. Rather than keep patching the inferior
-- flat-CSV duplicate, drop it and wire the real table for RAILCAR (frontend-
-- only work, no further migration needed there — the table already exists).
--
-- Also researched real-world railcar master data (AAR Umler Data Spec Manual)
-- against what this app already models for the closest comparable asset
-- (vessel has build_year; truck has gvw for weight class). Two genuine gaps
-- for railcars, not over-fitting UMLER's full 50+ field mechanical detail:
--   - build_year: matters operationally for tank-car compliance (older
--     DOT-111s being phased out of crude/ethanol service under post-2015
--     PHMSA rules following Lac-Mégantic).
--   - gross_rail_load_lbs: the actual AAR/FRA weight-class figure (263,000 /
--     286,000 / 315,000 lbs) that determines which track/line a car is even
--     allowed to run on — a regulatory constraint, not a nice-to-have.
-- =============================================================================

USE ETRM_DB;
GO

ALTER TABLE dbo.railcar DROP COLUMN approved_commodities;
GO

ALTER TABLE dbo.railcar ADD build_year INT NULL;
ALTER TABLE dbo.railcar ADD gross_rail_load_lbs DECIMAL(10,2) NULL;
GO

PRINT '============================================================';
PRINT 'V76 — RAILCAR FIELDS CLEANUP';
PRINT '  Dropped railcar.approved_commodities (free-text CSV, no FK) —';
PRINT '  superseded by dbo.mot_asset_product_approval (asset_type=RAILCAR).';
PRINT '  Added railcar.build_year, railcar.gross_rail_load_lbs (AAR/FRA';
PRINT '  weight class, e.g. 286000 lbs).';
PRINT '============================================================';
GO
