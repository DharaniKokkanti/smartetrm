-- =============================================================================
-- V101 — dbo.price_index: add created_at
-- =============================================================================
-- Found while building PriceIndexController (zero backend existed for this
-- table before — same class of gap as currency/country/period/holiday_calendar
-- earlier this session). dbo.price_index had no audit columns at all, but
-- the frontend PriceIndex type already has createdAt. Small, well-justified
-- addition per this session's standing rule — extend the schema rather than
-- trim the already-built UI.
-- =============================================================================

ALTER TABLE dbo.price_index ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME();
GO

PRINT '============================================================';
PRINT 'V101 — PRICE_INDEX: +created_at';
PRINT '============================================================';
GO
