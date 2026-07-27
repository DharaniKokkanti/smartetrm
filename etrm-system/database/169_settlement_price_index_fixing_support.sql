-- =============================================================================
-- V169 — dbo.settlement_price becomes the single table for all non-power/gas
-- prices: exchange futures/option settlement (as before) AND daily
-- physical/OTC index fixings (Platts, Argus, internal, other sources) for
-- physicals and swaps. Power/gas sub-hourly interval prices stay on
-- dbo.market_interval_price (V168) — built for a genuinely different grain
-- and left as-is, per explicit decision.
--
-- Why one table instead of a second near-duplicate: settlement_price
-- already has the right shape (fixing date + value + source + confirm
-- workflow + audit), and there was no third, independent identity concept
-- needed — just a second way to IDENTIFY the row (an index fixing instead
-- of an exchange contract). price_kind is the discriminator; exactly one of
-- (exchange, contract_ticker) or (price_index_id) must be populated,
-- enforced by chk_sp_identity below. tick_size (a futures/option-specific
-- concept — minimum exchange price movement) is the only column that
-- becomes optional; everything else (settle_price, currency, uom, source,
-- is_confirmed, audit) already applied equally to both kinds.
--
-- The existing SettlementPricesPage.tsx / TAS futures form is UNCHANGED in
-- behavior for existing rows — this is purely additive. A new "Price Kind"
-- selector will switch the form between the two field sets (frontend
-- follow-up, not part of this migration).
-- =============================================================================

ALTER TABLE dbo.settlement_price ADD price_kind VARCHAR(20) NOT NULL
    CONSTRAINT df_sp_price_kind DEFAULT 'FUTURES_SETTLE'
    CONSTRAINT chk_sp_price_kind CHECK (price_kind IN (
        'FUTURES_SETTLE',  -- exchange futures daily settle (existing behavior)
        'OPTION_SETTLE',   -- exchange option daily settle (same shape, contract_ticker = option series)
        'INDEX_FIXING'     -- daily published physical/OTC index value (Platts/Argus/internal/other) for physicals and swaps
    ));
GO

ALTER TABLE dbo.settlement_price ADD price_index_id INT NULL;
GO
ALTER TABLE dbo.settlement_price ADD CONSTRAINT fk_sp_price_index FOREIGN KEY (price_index_id) REFERENCES dbo.price_index(price_index_id);
GO

-- contract_ticker/exchange/tick_size are only meaningful for FUTURES_SETTLE/
-- OPTION_SETTLE rows; INDEX_FIXING rows have no contract or tick concept.
ALTER TABLE dbo.settlement_price ALTER COLUMN contract_ticker NVARCHAR(20) NULL;
GO
ALTER TABLE dbo.settlement_price ALTER COLUMN exchange NVARCHAR(40) NULL;
GO
ALTER TABLE dbo.settlement_price ALTER COLUMN tick_size DECIMAL(12,6) NULL;
GO

ALTER TABLE dbo.settlement_price DROP CONSTRAINT uq_settlement_price;
GO

ALTER TABLE dbo.settlement_price ADD CONSTRAINT chk_sp_identity CHECK (
    (price_kind IN ('FUTURES_SETTLE', 'OPTION_SETTLE') AND contract_ticker IS NOT NULL AND exchange IS NOT NULL AND price_index_id IS NULL)
    OR
    (price_kind = 'INDEX_FIXING' AND price_index_id IS NOT NULL AND contract_ticker IS NULL AND exchange IS NULL)
);
GO

-- Two filtered unique indexes replace the single 3-column UNIQUE constraint,
-- one per identity path (a plain composite UNIQUE would collide across
-- different INDEX_FIXING rows on the same date, since SQL Server treats
-- NULL as equal to NULL for uniqueness purposes).
CREATE UNIQUE INDEX ux_sp_contract_date ON dbo.settlement_price (exchange, contract_ticker, settle_date) WHERE contract_ticker IS NOT NULL;
GO
CREATE UNIQUE INDEX ux_sp_index_date ON dbo.settlement_price (price_index_id, settle_date) WHERE price_index_id IS NOT NULL;
GO

PRINT '============================================================';
PRINT 'V169 — settlement_price: +price_kind, +price_index_id;';
PRINT '       contract_ticker/exchange/tick_size now nullable;';
PRINT '       chk_sp_identity enforces exactly one identity path;';
PRINT '       ux_sp_contract_date / ux_sp_index_date replace uq_settlement_price.';
PRINT '============================================================';
GO
