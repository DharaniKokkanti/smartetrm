-- =============================================================================
-- V115 — drop the duplicate commodity_instrument_map table
--
-- V113 (this same session) built a new commodity_instrument_map table
-- without checking whether this data already existed under a different
-- name. It did — V45 (an earlier session) already created
-- dbo.commodity_instrument_type_config for exactly this purpose, already
-- seeded with the identical 77 rows, already documented as "the
-- authoritative DB-side config" for GET /commodity-instrument-map. The
-- application code (com.etrm.system.commodityinstrumentmap package) has
-- been repointed at the real table; this migration removes the redundant
-- one V113 created so there's only one source of truth.
-- =============================================================================

IF OBJECT_ID('dbo.commodity_instrument_map', 'U') IS NOT NULL
    DROP TABLE dbo.commodity_instrument_map;
GO
