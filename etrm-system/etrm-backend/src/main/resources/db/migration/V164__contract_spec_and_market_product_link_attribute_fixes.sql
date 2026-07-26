-- =============================================================================
-- ETRM SYSTEM — CONTRACT-SPEC + MARKET_PRODUCT_LINK ATTRIBUTE FIXES
-- =============================================================================
-- Per Dharani's direct review of the live schema:
--   1. dbo.derivative_contract_specification — drop commodity_family_id/
--      product_id (a contract spec should scope to a real market listing, not
--      a bare product/commodity-family), link market_product_link_id instead;
--      add price_uom_id, lot_uom_id, price_freq.
--   2. dbo.market_product_link — drop listed_date/delisted_date (redundant:
--      V162 already made dbo.period the home for lifecycle dates —
--      first_trade_date covers "when did this listing start trading" per
--      concrete period, is_active covers current listing status); add
--      alt_price_source_id, mtm_price_source_id.
-- Also cleans up one leftover inactive test row on derivative_contract_
-- specification (TEST-WTI-OPT, contract_spec_id=1) from an earlier
-- live-verification pass that was never deleted.
-- =============================================================================

USE ETRM_DB;
GO

DELETE FROM dbo.derivative_contract_specification WHERE spec_code = 'TEST-WTI-OPT';
GO

-- =============================================================================
-- 1. derivative_contract_specification
-- =============================================================================
ALTER TABLE dbo.derivative_contract_specification DROP CONSTRAINT fk_dcs_commodity_family;
ALTER TABLE dbo.derivative_contract_specification DROP CONSTRAINT fk_dcs_product;
ALTER TABLE dbo.derivative_contract_specification DROP COLUMN commodity_family_id, product_id;
GO

ALTER TABLE dbo.derivative_contract_specification ADD
    market_product_link_id   INT             NULL,
    price_uom_id              INT             NULL,   -- UOM prices are quoted in (e.g. USD per BBL) — distinct from contract_size_uom_id (physical quantity per contract)
    lot_uom_id                INT             NULL,   -- UOM a single lot is denominated in
    price_freq                VARCHAR(20)     NULL     -- how often this instrument's price is quoted/published
        CONSTRAINT chk_dcs_price_freq CHECK (price_freq IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', NULL));
GO

ALTER TABLE dbo.derivative_contract_specification
    ADD CONSTRAINT fk_dcs_market_product_link FOREIGN KEY (market_product_link_id) REFERENCES dbo.market_product_link(market_product_link_id),
        CONSTRAINT fk_dcs_price_uom            FOREIGN KEY (price_uom_id)          REFERENCES dbo.unit_of_measure(uom_id),
        CONSTRAINT fk_dcs_lot_uom              FOREIGN KEY (lot_uom_id)            REFERENCES dbo.unit_of_measure(uom_id);
GO

CREATE INDEX ix_dcs_market_product_link ON dbo.derivative_contract_specification (market_product_link_id) WHERE market_product_link_id IS NOT NULL;
GO

-- =============================================================================
-- 2. market_product_link
-- =============================================================================
ALTER TABLE dbo.market_product_link DROP COLUMN listed_date, delisted_date;
GO

ALTER TABLE dbo.market_product_link ADD
    alt_price_source_id       INT             NULL,   -- alternate/backup price source for this listing
    mtm_price_source_id       INT             NULL;    -- primary mark-to-market price source for this listing
GO

ALTER TABLE dbo.market_product_link
    ADD CONSTRAINT fk_mpl_alt_price_source FOREIGN KEY (alt_price_source_id) REFERENCES dbo.price_source(price_source_id),
        CONSTRAINT fk_mpl_mtm_price_source FOREIGN KEY (mtm_price_source_id) REFERENCES dbo.price_source(price_source_id);
GO
