-- V184: dbo.market column cleanup
--
-- Reviewed 2026-07-29:
--   - currency_id: market's own "quoting currency" attribute, NOT NULL
--     since inception (V2), but never joined/consumed downstream by any
--     other table or by pricing (settlement_price has its own independent
--     tick_currency_id). Redundant display-only field. Drop it.
--   - price_quotation: free-text field ('USD per barrel' etc.), no CHECK
--     constraint, never consumed downstream. Drop it.
--   - timezone: NOT NULL since inception, but many markets are
--     global/index-based with no single meaningful timezone. Relax to
--     nullable, info-only field.
--
-- Dharani confirmed (2026-07-29): drop currency_id + price_quotation,
-- make timezone nullable.

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.market') AND name = 'currency_id')
BEGIN
    DECLARE @fk_currency VARCHAR(128) = (
        SELECT fk.name FROM sys.foreign_keys fk
        WHERE fk.parent_object_id = OBJECT_ID('dbo.market')
          AND fk.name = 'fk_mkt_currency'
    );
    IF @fk_currency IS NOT NULL
        EXEC('ALTER TABLE dbo.market DROP CONSTRAINT ' + @fk_currency);

    ALTER TABLE dbo.market DROP COLUMN currency_id;
END

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.market') AND name = 'price_quotation')
BEGIN
    ALTER TABLE dbo.market DROP COLUMN price_quotation;
END

IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.market') AND name = 'timezone' AND is_nullable = 0
)
BEGIN
    ALTER TABLE dbo.market ALTER COLUMN timezone VARCHAR(50) NULL;
END

PRINT 'V184: dropped dbo.market.currency_id and price_quotation, relaxed timezone to nullable.';
