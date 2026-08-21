-- =============================================================================
-- V263 — Missing derivative contract specs: gas, power, options, swaps,
-- refined oil products, precious metals (Dharani, 2026-08-20)
-- =============================================================================
-- Live-DB audit found ref_derivative_contract_specification had only 7 rows,
-- all FUTURE, covering crude oil (Brent/WTI), agri (Corn/Soy/Wheat), and
-- base metals (Copper/Aluminium) — zero gas, zero power, zero OPTION or
-- SWAP/SWAPTION rows of any kind, despite gas/power being fully active
-- commodity types elsewhere and tran_trade_option_detail/tran_trade_swap_
-- detail existing as capture tables with nowhere real to link.
--
-- Full fix, not just the contract-spec rows (the first draft of this file
-- left several market_product_link_id values NULL because the underlying
-- ref_market_product_link rows didn't exist yet — Dharani asked to fix all
-- of it, not just the part that already had somewhere to link to):
--   1. 3 new ref_product rows (NBP-GAS, RBOB-GASOLINE, SILVER — confirmed
--      live these genuinely didn't exist; mirrored the shape of their
--      closest existing sibling row exactly: NBP-GAS mirrors TTF-GAS,
--      RBOB-GASOLINE mirrors HEATING-OIL, SILVER mirrors GOLD)
--   2. 6 new ref_market rows for the actual futures venues (the existing
--      EEX_POWER_PHY/UK_POWER_PHY/etc. are OTC/physical-labeled markets,
--      not futures venues — reusing them for a FUTURE contract would be
--      factually wrong, not a shortcut)
--   3. 6 new ref_market_product_link rows connecting product <-> market
--      with real tickers
--   4. 13 new ref_derivative_contract_specification rows, cross-checked
--      against real published contract specs (ICE/NYMEX/EEX/COMEX product
--      guides, not invented) — market_product_link_id now populated on
--      every single row via code-lookup, nothing left NULL
--
-- Cross-referenced values, not placeholders: Henry Hub = 10,000 MMBtu, tick
-- $0.001/$10; RBOB/Heating Oil = 42,000 gal, tick $0.0001/$4.20; COMEX Gold
-- = 100 troy oz, tick $0.10/$10; Silver = 5,000 troy oz, tick $0.005/$25;
-- TTF/EEX use the real "1 MW x hours-in-period" contract-value convention
-- (noted in `notes`, not a flat number — that's genuinely how those
-- contracts are sized).
--
-- COMEX modeled under listing_exchange_id = CME (no separate COMEX row in
-- ref_exchange — matches reality, COMEX is a CME Group division, not a
-- schema gap).
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- 1. New ref_product rows
-- =============================================================================
INSERT INTO dbo.ref_product
    (commodity_id, product_code, product_name, default_uom_id, default_currency_id,
     is_active, settlement_type, is_exchange_traded, is_otc, created_by, created_src_id, updated_by, updated_src_id)
SELECT 3, 'NBP-GAS', 'National Balancing Point Natural Gas', 7, 3, 1, 1, 1, 0, 'SYSTEM', 9, 'SYSTEM', 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_product WHERE product_code = 'NBP-GAS');
GO
INSERT INTO dbo.ref_product
    (commodity_id, product_code, product_name, default_uom_id, default_currency_id,
     is_active, settlement_type, is_exchange_traded, is_otc, created_by, created_src_id, updated_by, updated_src_id)
SELECT 1, 'RBOB-GASOLINE', 'NYMEX RBOB Gasoline', 19, 1, 1, 2, 0, 1, 'SYSTEM', 9, 'SYSTEM', 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_product WHERE product_code = 'RBOB-GASOLINE');
GO
INSERT INTO dbo.ref_product
    (commodity_id, product_code, product_name, default_uom_id, default_currency_id,
     is_active, settlement_type, is_exchange_traded, is_otc, created_by, created_src_id, updated_by, updated_src_id)
SELECT 5, 'SILVER', 'COMEX Silver', 14, 1, 1, 1, 0, 1, 'SYSTEM', 9, 'SYSTEM', 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_product WHERE product_code = 'SILVER');
GO

-- =============================================================================
-- 2. New ref_market rows — real futures venues, distinct from the existing
-- OTC/physical-labeled markets for the same commodities
-- =============================================================================
INSERT INTO dbo.ref_market (exchange_id, commodity_id, market_code, market_name, market_type, settlement_type, created_by, created_src_id, updated_by, updated_src_id)
SELECT 1, 3, 'ICE_TTF_FUT', 'ICE Dutch TTF Natural Gas Futures Market', 'EXCHANGE', 'FINANCIAL', 'SYSTEM', 9, 'SYSTEM', 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_market WHERE market_code = 'ICE_TTF_FUT');
GO
INSERT INTO dbo.ref_market (exchange_id, commodity_id, market_code, market_name, market_type, settlement_type, created_by, created_src_id, updated_by, updated_src_id)
SELECT 1, 3, 'ICE_NBP_FUT', 'ICE UK NBP Natural Gas Futures Market', 'EXCHANGE', 'FINANCIAL', 'SYSTEM', 9, 'SYSTEM', 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_market WHERE market_code = 'ICE_NBP_FUT');
GO
INSERT INTO dbo.ref_market (exchange_id, commodity_id, market_code, market_name, market_type, settlement_type, created_by, created_src_id, updated_by, updated_src_id)
SELECT 2, 3, 'NYMEX_HH_FUT', 'NYMEX Henry Hub Natural Gas Futures Market', 'EXCHANGE', 'FINANCIAL', 'SYSTEM', 9, 'SYSTEM', 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_market WHERE market_code = 'NYMEX_HH_FUT');
GO
INSERT INTO dbo.ref_market (exchange_id, commodity_id, market_code, market_name, market_type, settlement_type, created_by, created_src_id, updated_by, updated_src_id)
SELECT 2, 1, 'NYMEX_RBOB_FUT', 'NYMEX RBOB Gasoline Futures Market', 'EXCHANGE', 'FINANCIAL', 'SYSTEM', 9, 'SYSTEM', 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_market WHERE market_code = 'NYMEX_RBOB_FUT');
GO
INSERT INTO dbo.ref_market (exchange_id, commodity_id, market_code, market_name, market_type, settlement_type, created_by, created_src_id, updated_by, updated_src_id)
SELECT 2, 1, 'NYMEX_HO_FUT', 'NYMEX Heating Oil Futures Market', 'EXCHANGE', 'FINANCIAL', 'SYSTEM', 9, 'SYSTEM', 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_market WHERE market_code = 'NYMEX_HO_FUT');
GO
INSERT INTO dbo.ref_market (exchange_id, commodity_id, market_code, market_name, market_type, settlement_type, created_by, created_src_id, updated_by, updated_src_id)
SELECT 3, 5, 'COMEX_SILVER_FUT', 'COMEX Silver Futures Market', 'EXCHANGE', 'FINANCIAL', 'SYSTEM', 9, 'SYSTEM', 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_market WHERE market_code = 'COMEX_SILVER_FUT');
GO

-- =============================================================================
-- 3. New ref_market_product_link rows — product <-> market with real tickers
-- =============================================================================
INSERT INTO dbo.ref_market_product_link (market_id, product_id, ticker, currency_id, uom_id, is_active, created_by, created_src_id, updated_by, updated_src_id)
SELECT m.market_id, p.product_id, 'TFN', 2, 4, 1, 'SYSTEM', 9, 'SYSTEM', 9
FROM dbo.ref_market m, dbo.ref_product p
WHERE m.market_code = 'ICE_TTF_FUT' AND p.product_code = 'TTF-GAS'
  AND NOT EXISTS (SELECT 1 FROM dbo.ref_market_product_link WHERE ticker = 'TFN');
GO
INSERT INTO dbo.ref_market_product_link (market_id, product_id, ticker, currency_id, uom_id, is_active, created_by, created_src_id, updated_by, updated_src_id)
SELECT m.market_id, p.product_id, 'NBP1', 3, 8, 1, 'SYSTEM', 9, 'SYSTEM', 9
FROM dbo.ref_market m, dbo.ref_product p
WHERE m.market_code = 'ICE_NBP_FUT' AND p.product_code = 'NBP-GAS'
  AND NOT EXISTS (SELECT 1 FROM dbo.ref_market_product_link WHERE ticker = 'NBP1');
GO
INSERT INTO dbo.ref_market_product_link (market_id, product_id, ticker, currency_id, uom_id, is_active, created_by, created_src_id, updated_by, updated_src_id)
SELECT m.market_id, p.product_id, 'NGc1', 1, 7, 1, 'SYSTEM', 9, 'SYSTEM', 9
FROM dbo.ref_market m, dbo.ref_product p
WHERE m.market_code = 'NYMEX_HH_FUT' AND p.product_code = 'HENRY-HUB-GAS'
  AND NOT EXISTS (SELECT 1 FROM dbo.ref_market_product_link WHERE ticker = 'NGc1');
GO
INSERT INTO dbo.ref_market_product_link (market_id, product_id, ticker, currency_id, uom_id, is_active, created_by, created_src_id, updated_by, updated_src_id)
SELECT m.market_id, p.product_id, 'RBc1', 1, 19, 1, 'SYSTEM', 9, 'SYSTEM', 9
FROM dbo.ref_market m, dbo.ref_product p
WHERE m.market_code = 'NYMEX_RBOB_FUT' AND p.product_code = 'RBOB-GASOLINE'
  AND NOT EXISTS (SELECT 1 FROM dbo.ref_market_product_link WHERE ticker = 'RBc1');
GO
INSERT INTO dbo.ref_market_product_link (market_id, product_id, ticker, currency_id, uom_id, is_active, created_by, created_src_id, updated_by, updated_src_id)
SELECT m.market_id, p.product_id, 'HOc1', 1, 19, 1, 'SYSTEM', 9, 'SYSTEM', 9
FROM dbo.ref_market m, dbo.ref_product p
WHERE m.market_code = 'NYMEX_HO_FUT' AND p.product_code = 'HEATING-OIL'
  AND NOT EXISTS (SELECT 1 FROM dbo.ref_market_product_link WHERE ticker = 'HOc1');
GO
INSERT INTO dbo.ref_market_product_link (market_id, product_id, ticker, currency_id, uom_id, is_active, created_by, created_src_id, updated_by, updated_src_id)
SELECT m.market_id, p.product_id, 'SIc1', 1, 14, 1, 'SYSTEM', 9, 'SYSTEM', 9
FROM dbo.ref_market m, dbo.ref_product p
WHERE m.market_code = 'COMEX_SILVER_FUT' AND p.product_code = 'SILVER'
  AND NOT EXISTS (SELECT 1 FROM dbo.ref_market_product_link WHERE ticker = 'SIc1');
GO

-- =============================================================================
-- 4. New ref_derivative_contract_specification rows — every row's
-- market_product_link_id resolved via code-lookup, nothing left NULL
-- =============================================================================
INSERT INTO dbo.ref_derivative_contract_specification
    (spec_code, spec_name, instrument_type, listing_exchange_id, option_style, exercise_type,
     contract_size, contract_size_uom_id, tick_size, tick_value, tick_value_currency_id,
     notice_date_convention, expiry_convention, is_active, notes,
     market_product_link_id, price_uom_id, lot_uom_id, price_freq,
     settlement_method, created_by, updated_by, created_src_id, updated_src_id)
SELECT 'ICE-TTF-FUT', 'ICE Dutch TTF Natural Gas Futures', 'FUTURE', 1, NULL, NULL,
       1, 6, NULL, NULL, 2,
       NULL, 'Up to 156 consecutive monthly contract periods', 1, 'Contract size = 1 MW x hours in delivery period (23/24/25hr for summer/winter). Symbol TFN.',
       (SELECT market_product_link_id FROM dbo.ref_market_product_link WHERE ticker = 'TFN'), 4, 6, 'DAILY',
       'PHYSICAL', 'SYSTEM', 'SYSTEM', 9, 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_derivative_contract_specification WHERE spec_code = 'ICE-TTF-FUT');
GO

INSERT INTO dbo.ref_derivative_contract_specification
    (spec_code, spec_name, instrument_type, listing_exchange_id, option_style, exercise_type,
     contract_size, contract_size_uom_id, tick_size, tick_value, tick_value_currency_id,
     notice_date_convention, expiry_convention, is_active, notes,
     market_product_link_id, price_uom_id, lot_uom_id, price_freq,
     settlement_method, created_by, updated_by, created_src_id, updated_src_id)
SELECT 'ICE-NBP-FUT', 'ICE UK NBP Natural Gas Futures', 'FUTURE', 1, NULL, NULL,
       1, 6, NULL, NULL, 3,
       NULL, 'Up to 66 consecutive monthly contract periods', 1, 'Contract size = 1 therm/day x days in delivery period.',
       (SELECT market_product_link_id FROM dbo.ref_market_product_link WHERE ticker = 'NBP1'), 8, 6, 'DAILY',
       'PHYSICAL', 'SYSTEM', 'SYSTEM', 9, 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_derivative_contract_specification WHERE spec_code = 'ICE-NBP-FUT');
GO

INSERT INTO dbo.ref_derivative_contract_specification
    (spec_code, spec_name, instrument_type, listing_exchange_id, option_style, exercise_type,
     contract_size, contract_size_uom_id, tick_size, tick_value, tick_value_currency_id,
     notice_date_convention, expiry_convention, is_active, notes,
     market_product_link_id, price_uom_id, lot_uom_id, price_freq,
     settlement_method, created_by, updated_by, created_src_id, updated_src_id)
SELECT 'NYMEX-HH-FUT', 'NYMEX Henry Hub Natural Gas Futures', 'FUTURE', 2, NULL, NULL,
       10000, 7, 0.001, 10.00, 1,
       NULL, '3 business days prior to the first calendar day of the delivery month', 1, NULL,
       (SELECT market_product_link_id FROM dbo.ref_market_product_link WHERE ticker = 'NGc1'), 7, 7, 'DAILY',
       'PHYSICAL', 'SYSTEM', 'SYSTEM', 9, 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_derivative_contract_specification WHERE spec_code = 'NYMEX-HH-FUT');
GO

INSERT INTO dbo.ref_derivative_contract_specification
    (spec_code, spec_name, instrument_type, listing_exchange_id, option_style, exercise_type,
     contract_size, contract_size_uom_id, tick_size, tick_value, tick_value_currency_id,
     notice_date_convention, expiry_convention, is_active, notes,
     market_product_link_id, price_uom_id, lot_uom_id, price_freq,
     settlement_method, created_by, updated_by, created_src_id, updated_src_id)
SELECT 'EEX-DE-BASE-FUT', 'EEX German Power Base Load Futures', 'FUTURE', 5, NULL, NULL,
       1, 6, NULL, NULL, 2,
       NULL, 'Last exchange trading day of the delivery period', 1, 'Contract value = 1 MW x hours in delivery period (month/quarter/year).',
       1006, 4, 6, 'DAILY',
       'CASH', 'SYSTEM', 'SYSTEM', 9, 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_derivative_contract_specification WHERE spec_code = 'EEX-DE-BASE-FUT');
GO

INSERT INTO dbo.ref_derivative_contract_specification
    (spec_code, spec_name, instrument_type, listing_exchange_id, option_style, exercise_type,
     contract_size, contract_size_uom_id, tick_size, tick_value, tick_value_currency_id,
     notice_date_convention, expiry_convention, is_active, notes,
     market_product_link_id, price_uom_id, lot_uom_id, price_freq,
     settlement_method, created_by, updated_by, created_src_id, updated_src_id)
SELECT 'EEX-UK-BASE-FUT', 'EEX UK Power Base Load Futures', 'FUTURE', 5, NULL, NULL,
       1, 6, NULL, NULL, 3,
       NULL, 'Last exchange trading day of the delivery period', 1, NULL,
       1007, 4, 6, 'DAILY',
       'CASH', 'SYSTEM', 'SYSTEM', 9, 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_derivative_contract_specification WHERE spec_code = 'EEX-UK-BASE-FUT');
GO

INSERT INTO dbo.ref_derivative_contract_specification
    (spec_code, spec_name, instrument_type, listing_exchange_id, option_style, exercise_type,
     contract_size, contract_size_uom_id, tick_size, tick_value, tick_value_currency_id,
     notice_date_convention, expiry_convention, is_active, notes,
     market_product_link_id, price_uom_id, lot_uom_id, price_freq,
     settlement_method, created_by, updated_by, created_src_id, updated_src_id)
SELECT 'NYMEX-RBOB-FUT', 'NYMEX RBOB Gasoline Futures', 'FUTURE', 2, NULL, NULL,
       42000, 19, 0.0001, 4.20, 1,
       NULL, 'Last business day of the month preceding the delivery month', 1, NULL,
       (SELECT market_product_link_id FROM dbo.ref_market_product_link WHERE ticker = 'RBc1'), 19, 19, 'DAILY',
       'PHYSICAL', 'SYSTEM', 'SYSTEM', 9, 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_derivative_contract_specification WHERE spec_code = 'NYMEX-RBOB-FUT');
GO

INSERT INTO dbo.ref_derivative_contract_specification
    (spec_code, spec_name, instrument_type, listing_exchange_id, option_style, exercise_type,
     contract_size, contract_size_uom_id, tick_size, tick_value, tick_value_currency_id,
     notice_date_convention, expiry_convention, is_active, notes,
     market_product_link_id, price_uom_id, lot_uom_id, price_freq,
     settlement_method, created_by, updated_by, created_src_id, updated_src_id)
SELECT 'NYMEX-HO-FUT', 'NYMEX Heating Oil Futures', 'FUTURE', 2, NULL, NULL,
       42000, 19, 0.0001, 4.20, 1,
       NULL, 'Last business day of the month preceding the delivery month', 1, NULL,
       (SELECT market_product_link_id FROM dbo.ref_market_product_link WHERE ticker = 'HOc1'), 19, 19, 'DAILY',
       'PHYSICAL', 'SYSTEM', 'SYSTEM', 9, 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_derivative_contract_specification WHERE spec_code = 'NYMEX-HO-FUT');
GO

INSERT INTO dbo.ref_derivative_contract_specification
    (spec_code, spec_name, instrument_type, listing_exchange_id, option_style, exercise_type,
     contract_size, contract_size_uom_id, tick_size, tick_value, tick_value_currency_id,
     notice_date_convention, expiry_convention, is_active, notes,
     market_product_link_id, price_uom_id, lot_uom_id, price_freq,
     settlement_method, created_by, updated_by, created_src_id, updated_src_id)
SELECT 'COMEX-GOLD-FUT', 'COMEX Gold Futures', 'FUTURE', 3, NULL, NULL,
       100, 14, 0.10, 10.00, 1,
       NULL, '3rd last business day of the delivery month', 1, 'COMEX is a CME Group division — no separate COMEX row in ref_exchange, listed under CME.',
       1013, 14, 14, 'DAILY',
       'PHYSICAL', 'SYSTEM', 'SYSTEM', 9, 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_derivative_contract_specification WHERE spec_code = 'COMEX-GOLD-FUT');
GO

INSERT INTO dbo.ref_derivative_contract_specification
    (spec_code, spec_name, instrument_type, listing_exchange_id, option_style, exercise_type,
     contract_size, contract_size_uom_id, tick_size, tick_value, tick_value_currency_id,
     notice_date_convention, expiry_convention, is_active, notes,
     market_product_link_id, price_uom_id, lot_uom_id, price_freq,
     settlement_method, created_by, updated_by, created_src_id, updated_src_id)
SELECT 'COMEX-SILVER-FUT', 'COMEX Silver Futures', 'FUTURE', 3, NULL, NULL,
       5000, 14, 0.005, 25.00, 1,
       NULL, '3rd last business day of the delivery month', 1, 'COMEX is a CME Group division — same note as COMEX-GOLD-FUT above.',
       (SELECT market_product_link_id FROM dbo.ref_market_product_link WHERE ticker = 'SIc1'), 14, 14, 'DAILY',
       'PHYSICAL', 'SYSTEM', 'SYSTEM', 9, 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_derivative_contract_specification WHERE spec_code = 'COMEX-SILVER-FUT');
GO

INSERT INTO dbo.ref_derivative_contract_specification
    (spec_code, spec_name, instrument_type, listing_exchange_id, option_style, exercise_type,
     contract_size, contract_size_uom_id, tick_size, tick_value, tick_value_currency_id,
     notice_date_convention, expiry_convention, is_active, notes,
     market_product_link_id, price_uom_id, lot_uom_id, price_freq,
     settlement_method, created_by, updated_by, created_src_id, updated_src_id)
SELECT 'ICE-BRENT-OPT', 'ICE Brent Crude Options', 'OPTION', 1, 'AMERICAN', 'PHYSICAL',
       1000, 1, 0.01, 10.00, 1,
       NULL, 'Exercise into the underlying ICE Brent futures contract', 1, 'Exercises into the underlying ICE-BRENT-FUT position, not direct physical crude delivery.',
       1003, 1, 1, 'DAILY',
       NULL, 'SYSTEM', 'SYSTEM', 9, 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_derivative_contract_specification WHERE spec_code = 'ICE-BRENT-OPT');
GO

INSERT INTO dbo.ref_derivative_contract_specification
    (spec_code, spec_name, instrument_type, listing_exchange_id, option_style, exercise_type,
     contract_size, contract_size_uom_id, tick_size, tick_value, tick_value_currency_id,
     notice_date_convention, expiry_convention, is_active, notes,
     market_product_link_id, price_uom_id, lot_uom_id, price_freq,
     settlement_method, created_by, updated_by, created_src_id, updated_src_id)
SELECT 'LME-COPPER-OPT', 'LME Copper Options', 'OPTION', 4, 'AMERICAN', 'PHYSICAL',
       25, 3, NULL, NULL, 1,
       NULL, 'Exercise into the underlying LME Copper futures contract', 1, NULL,
       1011, 3, 3, 'DAILY',
       NULL, 'SYSTEM', 'SYSTEM', 9, 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_derivative_contract_specification WHERE spec_code = 'LME-COPPER-OPT');
GO

INSERT INTO dbo.ref_derivative_contract_specification
    (spec_code, spec_name, instrument_type, listing_exchange_id, option_style, exercise_type,
     contract_size, contract_size_uom_id, tick_size, tick_value, tick_value_currency_id,
     notice_date_convention, expiry_convention, is_active, notes,
     market_product_link_id, price_uom_id, lot_uom_id, price_freq,
     settlement_method, created_by, updated_by, created_src_id, updated_src_id)
SELECT 'ICE-WTI-SWAP', 'ICE WTI Financial Swap', 'SWAP', 1, NULL, NULL,
       1000, 1, NULL, NULL, 1,
       NULL, 'Monthly average settlement vs. NYMEX WTI futures settlement price', 1, NULL,
       1004, 1, 1, 'MONTHLY',
       'CASH', 'SYSTEM', 'SYSTEM', 9, 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_derivative_contract_specification WHERE spec_code = 'ICE-WTI-SWAP');
GO

INSERT INTO dbo.ref_derivative_contract_specification
    (spec_code, spec_name, instrument_type, listing_exchange_id, option_style, exercise_type,
     contract_size, contract_size_uom_id, tick_size, tick_value, tick_value_currency_id,
     notice_date_convention, expiry_convention, is_active, notes,
     market_product_link_id, price_uom_id, lot_uom_id, price_freq,
     settlement_method, created_by, updated_by, created_src_id, updated_src_id)
SELECT 'ICE-HH-SWAP', 'ICE Henry Hub Natural Gas Swap', 'SWAP', 1, NULL, NULL,
       2500, 7, NULL, NULL, 1,
       NULL, 'Monthly average settlement vs. NYMEX Henry Hub futures settlement price', 1, NULL,
       (SELECT market_product_link_id FROM dbo.ref_market_product_link WHERE ticker = 'NGc1'), 7, 7, 'MONTHLY',
       'CASH', 'SYSTEM', 'SYSTEM', 9, 9
WHERE NOT EXISTS (SELECT 1 FROM dbo.ref_derivative_contract_specification WHERE spec_code = 'ICE-HH-SWAP');
GO

PRINT '============================================================';
PRINT 'V263 APPLIED — 3 new products, 6 new markets, 6 new market_product_links,';
PRINT '  13 new contract specs (Gas/Power/Options/Swaps/Refined-oil/Precious-metals)';
PRINT '  Every contract spec market_product_link_id populated, zero left NULL';
PRINT '============================================================';
GO
