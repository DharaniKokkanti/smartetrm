-- V174: settlement_price gains open/high/low/avg alongside settle_price.
-- settle_price stays the authoritative value everything downstream (pricing
-- formulas, MTM, invoicing) already reads unchanged; the four new columns
-- are supplementary daily-range/average context on the same row, not a
-- separate "kind" axis (price_kind was deliberately dropped in V170 as a
-- redundant discriminator — this doesn't reintroduce that, it's additive
-- context on the one row per ticker/index+date that already exists).

ALTER TABLE dbo.settlement_price ADD
    open_price  DECIMAL(18,6) NULL,
    high_price  DECIMAL(18,6) NULL,
    low_price   DECIMAL(18,6) NULL,
    avg_price   DECIMAL(18,6) NULL;
GO

ALTER TABLE dbo.settlement_price ADD CONSTRAINT chk_sp_ohlc_range
    CHECK (high_price IS NULL OR low_price IS NULL OR high_price >= low_price);
GO
