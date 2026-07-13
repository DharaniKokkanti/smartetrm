-- =============================================================================
-- V97 — Fix plain UNIQUE constraints on nullable code columns
-- =============================================================================
-- BUG: uq_legal_entity_lei, uq_cp_lei, and uq_vessel_mmsi were plain (non-
-- filtered) UNIQUE constraints on nullable columns (lei_code, lei_code,
-- mmsi). SQL Server treats every NULL as equal to every other NULL for
-- uniqueness purposes, so a plain UNIQUE constraint on a nullable column
-- allows AT MOST ONE row in the whole table to ever have a NULL value there
-- — every legal entity/counterparty without an LEI code (the normal case;
-- LEI is only mandatory for certain regulated entity types) or vessel
-- without an MMSI collided against the first such row and failed with
-- "Cannot insert duplicate key... duplicate key value is (<NULL>)".
--
-- Found via the new backend integration test suite
-- (LegalEntityControllerTest) — a basic create-with-no-LEI test failed on a
-- completely fresh dev DB, meaning this had been broken since whichever
-- migration first added these constraints; nothing had ever exercised a
-- real create through these endpoints with the LEI/MMSI field actually
-- absent before.
--
-- FIX: same pattern already used elsewhere in this schema for this exact
-- situation (e.g. exchange.uq_exchange_mic, market.ix_market_exchange) —
-- replace the plain UNIQUE constraint with a FILTERED unique index that
-- only enforces uniqueness among the NON-NULL values, so any number of
-- rows can have NULL.
-- =============================================================================

ALTER TABLE dbo.legal_entity DROP CONSTRAINT uq_legal_entity_lei;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE UNIQUE NONCLUSTERED INDEX uq_legal_entity_lei ON dbo.legal_entity(lei_code) WHERE lei_code IS NOT NULL;
GO

ALTER TABLE dbo.counterparty DROP CONSTRAINT uq_cp_lei;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE UNIQUE NONCLUSTERED INDEX uq_cp_lei ON dbo.counterparty(lei_code) WHERE lei_code IS NOT NULL;
GO

ALTER TABLE dbo.vessel DROP CONSTRAINT uq_vessel_mmsi;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE UNIQUE NONCLUSTERED INDEX uq_vessel_mmsi ON dbo.vessel(mmsi) WHERE mmsi IS NOT NULL;
GO

PRINT '============================================================';
PRINT 'V97 — NULLABLE UNIQUE CONSTRAINT FIX APPLIED';
PRINT '  legal_entity.lei_code, counterparty.lei_code, vessel.mmsi:';
PRINT '  plain UNIQUE constraint -> filtered unique index (WHERE col IS NOT NULL).';
PRINT '  Multiple NULLs now allowed; uniqueness still enforced among real values.';
PRINT '============================================================';
GO
