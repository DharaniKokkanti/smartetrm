-- =============================================================================
-- V160 — fix Unicode corruption in dbo.currency.symbol (AED)
--
-- dbo.currency.symbol was declared VARCHAR(5) (non-Unicode) in V1. The AED
-- row's seed literal is the Arabic Dirham symbol 'د.إ', which cannot be
-- represented in the database's non-Unicode codepage — SQL Server silently
-- replaced each unmappable character with '?' at insert time, so the stored
-- value has been '?.?' (not a display/font issue — the bytes themselves are
-- wrong) since V1. Found while reviewing the Static Data currency screen.
--
-- Fix: widen the column to NVARCHAR so it can hold any symbol regardless of
-- script, then repair the one row already corrupted. Every other currency's
-- symbol (all Latin/common) survived V1 undamaged, so no other row needs a
-- data fix — only the column type, to prevent this recurring for a future
-- non-Latin currency symbol.
-- =============================================================================

ALTER TABLE dbo.currency ALTER COLUMN symbol NVARCHAR(5) NULL;
GO

-- row_version must be bumped explicitly on every UPDATE (trg_currency_row_version_guard, V153).
UPDATE dbo.currency SET symbol = N'د.إ', row_version = row_version + 1 WHERE currency_code = 'AED';
GO
