-- =============================================================================
-- ETRM SYSTEM — MARKET/PRODUCT FIELD CLEANUP + CLEARING HOUSE AS COUNTERPARTY
-- =============================================================================
-- Per Dharani's direct review:
--   1. dbo.market — contract_size/tick_size are redundant with V161's
--      derivative_contract_specification (contract_size/tick_size scoped per
--      instrument) and market_product_link.lot_size (per-listing override);
--      country_id is redundant with dbo.exchange.country_id for EXCHANGE-type
--      markets (the only case where exchange_id is populated). clearing_house
--      was a free-text VARCHAR with no governance — reusing dbo.counterparty
--      (a CCP is a real legal entity you have credit/membership exposure to,
--      same as any other counterparty) instead of a bespoke master table.
--      OTC_CLEARED markets have no exchange_id at all, so clearing_house_id
--      stays on market rather than moving to exchange.
--   2. dbo.product — lot_size/min_quantity/max_quantity are redundant with
--      market_product_link's per-listing lot_size/min_quantity/max_quantity
--      (lot conventions vary by venue, not by product itself — every real
--      listing needs its own market_product_link row anyway). default_uom_id
--      stays; it's still needed as the base unit for the product's other
--      fields (density/CV/pricing), not something being removed here.
-- Zero live-data risk: dbo.market has 0 rows, every product's lot_size/
-- min_quantity/max_quantity is NULL in the live dev DB (confirmed via direct
-- query before writing this migration).
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- 1. New counterparty_type: CLEARING_HOUSE (CCP) — distinct from EXCHANGE
--    (the trading venue) and FCM (clears through a CCP on the trading firm's
--    behalf, doesn't hold margin at the CCP itself).
-- =============================================================================
INSERT INTO dbo.counterparty_type (type_code, type_name, description, sort_order, created_by, updated_by)
VALUES ('CLEARING_HOUSE', 'Clearing House (CCP)',
        'Central counterparty that actually holds margin and guarantees settlement -- distinct from the exchange/venue itself and from an FCM (which clears through a CCP on the trading firm''s behalf, rather than being the CCP). LCH, ICE Clear Europe/US, CME Clearing, LME Clear.',
        5, 'SYSTEM', 'SYSTEM');
GO

-- Seed the real-world CCPs referenced by the exchanges already in dbo.exchange
-- (ICE/NYMEX/CME/LME/EEX) so market.clearing_house_id has real options to
-- pick from immediately, matching the existing precedent of pre-seeding
-- dbo.exchange itself with real venues.
DECLARE @clearingHouseTypeId INT = (SELECT counterparty_type_id FROM dbo.counterparty_type WHERE type_code = 'CLEARING_HOUSE');
DECLARE @kycApproved INT = (SELECT kyc_status_id FROM dbo.kyc_status WHERE type_code = 'APPROVED');
DECLARE @gb INT = (SELECT country_id FROM dbo.country WHERE country_code = 'GB');
DECLARE @us INT = (SELECT country_id FROM dbo.country WHERE country_code = 'US');
DECLARE @usd INT = (SELECT currency_id FROM dbo.currency WHERE currency_code = 'USD');
DECLARE @gbp INT = (SELECT currency_id FROM dbo.currency WHERE currency_code = 'GBP');

INSERT INTO dbo.counterparty (cp_code, legal_name, short_name, jurisdiction_id, cp_type, is_intercompany, kyc_status, credit_limit_currency_id, parent_ind, created_by, updated_by)
VALUES
    ('ICE-CLEAR-EU', 'ICE Clear Europe Ltd', 'ICE Clear Europe', @gb, @clearingHouseTypeId, 0, @kycApproved, @gbp, 0, 'SYSTEM', 'SYSTEM'),
    ('ICE-CLEAR-US', 'ICE Clear US Inc',     'ICE Clear US',     @us, @clearingHouseTypeId, 0, @kycApproved, @usd, 0, 'SYSTEM', 'SYSTEM'),
    ('CME-CLEARING', 'CME Clearing (CME Inc.)', 'CME Clearing',  @us, @clearingHouseTypeId, 0, @kycApproved, @usd, 0, 'SYSTEM', 'SYSTEM'),
    ('LME-CLEAR',    'LME Clear Ltd',        'LME Clear',        @gb, @clearingHouseTypeId, 0, @kycApproved, @gbp, 0, 'SYSTEM', 'SYSTEM'),
    ('LCH-LTD',      'LCH Ltd',              'LCH',              @gb, @clearingHouseTypeId, 0, @kycApproved, @gbp, 0, 'SYSTEM', 'SYSTEM');
GO

-- =============================================================================
-- 2. dbo.market cleanup
-- =============================================================================
ALTER TABLE dbo.market DROP CONSTRAINT fk_market_country;
GO
ALTER TABLE dbo.market DROP COLUMN country_id, contract_size, tick_size, clearing_house;
GO

ALTER TABLE dbo.market ADD clearing_house_id INT NULL;
GO
ALTER TABLE dbo.market ADD CONSTRAINT fk_market_clearing_house FOREIGN KEY (clearing_house_id) REFERENCES dbo.counterparty(counterparty_id);
GO

-- =============================================================================
-- 3. dbo.product cleanup
-- =============================================================================
ALTER TABLE dbo.product DROP COLUMN lot_size, min_quantity, max_quantity;
GO
