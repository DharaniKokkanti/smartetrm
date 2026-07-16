-- =============================================================================
-- V109 -- voyage_cargo_parcel.commodity_type: VARCHAR -> real FK
--
-- Found during a post-build review of V108: voyage_cargo_parcel.commodity_type
-- was added as a plain VARCHAR(20), following the old (pre-V85) pattern still
-- used by dbo.location.commodity_type. But this table's real sibling tables in
-- the SAME feature domain -- freight_rate_index, laytime_term_template,
-- demurrage_dispatch_rate (all V53/V54) -- were converted at some point after
-- V54 (confirmed via live schema, not trusted from the old migration file's
-- text) from VARCHAR+CHECK into a real commodity_type_id INT FK against
-- dbo.commodity_type (the V85 dedicated 11-value table: OIL/GAS/POWER/LNG/
-- AGRICULTURAL/METALS/FREIGHT/RINS/ENVIRONMENTAL/MULTI/OTHER). A plain string
-- column here can never be matched against those FK-based rows -- in
-- particular it could never resolve to 'LNG' specifically (dbo.commodity,
-- which voyage_cargo_parcel.product_id resolves through, only has 5 broad
-- values with no LNG row), silently breaking any future attempt to match an
-- LNG cargo parcel against the LNG-specific laytime_term_template/
-- demurrage_dispatch_rate/freight_rate_index rows this module already seeds.
--
-- No data exists yet in this table (V108 shipped the same session), so this
-- is a straight drop+add rather than a backfill migration.
-- =============================================================================

USE ETRM_DB;
GO

ALTER TABLE dbo.voyage_cargo_parcel DROP COLUMN commodity_type;
GO

ALTER TABLE dbo.voyage_cargo_parcel ADD commodity_type_id INT NULL;
GO

ALTER TABLE dbo.voyage_cargo_parcel ADD CONSTRAINT fk_vcp_commodity_type FOREIGN KEY (commodity_type_id) REFERENCES dbo.commodity_type(commodity_type_id);
GO
