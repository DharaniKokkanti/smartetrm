-- =============================================================================
-- V58 — Remove dbo.commodity.commodity_type (redundant self-tag)
-- =============================================================================
-- User asked to check for duplicate reference-data points after V55 converted
-- commodity_type from VARCHAR+CHECK to an INT FK on lookup_value across 12
-- tables (dbo.commodity plus 11 others).
--
-- Found exactly one genuine duplication: dbo.commodity itself only has 5 rows
-- (OIL, POWER, GAS, AGRI, METALS) and IS the master list of commodities — its
-- own commodity_type FK to lookup_value is a strict 1:1 tautology (the OIL
-- commodity row's commodity_type points at a lookup_value row that just says
-- "OIL" again). That's redundant self-tagging, not a real categorization.
--
-- The other 11 tables (desk, book, gl_account, trader_commodity_limit,
-- freight_rate_index, laytime_term_template, demurrage_dispatch_rate, period,
-- period_mapping, unit_of_measure, location_type, plus book.book_type) are
-- NOT duplicated — each is a genuine many-to-one categorization (many desks
-- can share one commodity_type) — left untouched, per instruction not to
-- revert those.
-- =============================================================================

USE ETRM_DB;
GO

ALTER TABLE dbo.commodity DROP CONSTRAINT IF EXISTS fk_commodity_type;
ALTER TABLE dbo.commodity DROP COLUMN IF EXISTS commodity_type;
GO

PRINT '============================================================';
PRINT 'V58 — COMMODITY_TYPE DEDUP APPLIED';
PRINT '  dbo.commodity.commodity_type dropped — the table''s own rows';
PRINT '  (commodity_code/commodity_name) are the authoritative identity;';
PRINT '  the FK to lookup_value was a redundant 1:1 self-tag.';
PRINT '  All other commodity_type/book_type lookup_value FKs (11 tables,';
PRINT '  from V55/V57) are unchanged.';
PRINT '============================================================';
GO
