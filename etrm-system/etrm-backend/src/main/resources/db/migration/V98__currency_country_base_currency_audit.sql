-- =============================================================================
-- V98 — dbo.currency: add country_id, is_base_currency, created_at
-- =============================================================================
-- BUG: the frontend's dedicated Currencies page (CurrenciesPage.tsx, built
-- against a bespoke /api/v1/currencies contract, not the generic Tier 2
-- mechanism) and the Master Data Hub's own description ("...with decimal
-- places and base currency flag. USD is the system base currency.") both
-- already assume dbo.currency has a country link, a base-currency flag, and
-- a created_at timestamp. None of the three exist — dbo.currency has only
-- had currency_id/currency_code/currency_name/symbol/decimal_places/
-- is_active since V1. The backend for this table was never built at all
-- (confirmed: zero Java references to "currency" as its own entity/
-- repository/controller anywhere in the codebase), so this was never
-- exercised against the real schema before now.
--
-- FIX: add the three columns the already-shipped frontend needs, closing
-- the gap rather than trimming the UI down to the incomplete schema.
--   - country_id: nullable FK to dbo.country — not every currency has one
--     obvious country (EUR is supranational), matching countryCode's
--     nullable typing on the frontend.
--   - is_base_currency: NOT NULL, defaults false; USD (the system's
--     documented base/reporting currency — see legal_entity.base_currency_id
--     and every FX/pricing table's default) is flagged true.
--   - created_at: NOT NULL, defaults to now for existing rows going
--     forward. dbo.currency does NOT get the full AuditableEntity treatment
--     (created_by/updated_at/updated_by) — the frontend Currency type only
--     ever asked for created_at, and this table was one of the ones
--     deliberately left without the rest (see
--     ReferenceDataCrudService's "~48 of 154 don't" note, currency named
--     explicitly) — no reason to add more than what's actually used.
-- =============================================================================

ALTER TABLE dbo.currency ADD country_id INT NULL;
GO
ALTER TABLE dbo.currency ADD CONSTRAINT fk_currency_country FOREIGN KEY (country_id) REFERENCES dbo.country(country_id);
GO

ALTER TABLE dbo.currency ADD is_base_currency BIT NOT NULL DEFAULT 0;
GO

ALTER TABLE dbo.currency ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME();
GO

UPDATE dbo.currency SET is_base_currency = 1 WHERE currency_code = 'USD';
GO

PRINT '============================================================';
PRINT 'V98 — CURRENCY COUNTRY LINK + BASE CURRENCY FLAG + AUDIT TIMESTAMP';
PRINT '  dbo.currency: +country_id (FK dbo.country, nullable),';
PRINT '  +is_base_currency (bit, default 0, USD=1), +created_at.';
PRINT '  Backs the dedicated /api/v1/currencies + /api/v1/countries';
PRINT '  controllers — this table had zero backend implementation before.';
PRINT '============================================================';
GO
