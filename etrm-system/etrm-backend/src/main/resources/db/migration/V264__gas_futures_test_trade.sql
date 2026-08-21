-- =============================================================================
-- V264 — Real end-to-end test trade exercising the whole session's schema
-- (Dharani, 2026-08-21)
-- =============================================================================
-- The live DB had zero rows in tran_trade/tran_order/tran_leg, so nothing in
-- V258-V263 had ever been exercised with real, connected data beyond schema
-- checks. This inserts one realistic trade chaining every layer built this
-- session: tran_trade -> tran_order (V258) -> tran_leg with valuation/FX/
-- formula-nature fields populated (V259/V260) -> tran_trade_futures_detail
-- linked to a real contract spec (V261/V262/V263).
--
-- Scenario: NYMEX Henry Hub Natural Gas Futures, September 2026 contract,
-- 10,000 MMBtu (1 lot per NYMEX-HH-FUT spec), bought at $3.75/MMBtu,
-- marked at $3.92/MMBtu as of 2026-08-21 — a realistic unrealized gain.
-- =============================================================================

USE ETRM_DB;
GO

DECLARE @tradeId INT, @orderId INT, @legId INT;

INSERT INTO dbo.tran_trade
    (trade_reference, trade_date, commodity_type, direction, uom_id, currency_id,
     counterparty_id, trader_id, status, amendment_number, is_latest_version,
     trade_type, term_type, deal_indicator, hedge_flag, instrument_type, trade_settlement_type_id,
     created_by, updated_by, created_src_id, updated_src_id)
VALUES
    ('TRD-2026-HHFUT-001', '2026-08-21', 'GAS', 'BUY', 7, 1,
     1, 1, 'CONFIRMED', 0, 1,
     2, 'SPOT', 'EXTERNAL', 0, 77, 2,
     'SYSTEM', 'SYSTEM', 9, 9);
SET @tradeId = SCOPE_IDENTITY();

INSERT INTO dbo.tran_order
    (trade_id, order_sequence, order_reference, status, order_execution_date,
     order_quantity, uom_id, price, currency_id, order_type,
     created_by, updated_by)
VALUES
    (@tradeId, 1, 'TRD-2026-HHFUT-001-01', 'CONFIRMED', '2026-08-21',
     10000, 7, 3.75, 1, 'OUTRIGHT',
     'SYSTEM', 'SYSTEM');
SET @orderId = SCOPE_IDENTITY();

INSERT INTO dbo.tran_leg
    (trade_id, order_id, leg_sequence, leg_reference, status,
     risk_start_date, risk_end_date, product_id, market_id, pricing_rule_id,
     quantity, price, settlement_type, is_template, tolerance_for_scheduling,
     legal_entity_id, book_id, uom_id, currency_id,
     mtm_price, asof_date, trade_value, market_value, unrealized_pnl,
     fx_hedge_ind, fx_rate_operator,
     mkt_formula_ind, leg_price_formula_ind, leg_prelim_formula_ind,
     created_by, updated_by, created_src_id, updated_src_id)
VALUES
    (@tradeId, @orderId, 1, 'TRD-2026-HHFUT-001-01', 'CONFIRMED',
     '2026-09-01', '2026-09-30', 8, 1016, NULL,
     10000, 3.75, 'FINANCIAL', 1, 0,
     1, 1, 7, 1,
     3.92, '2026-08-21', 37500.00, 39200.00, 1700.00,
     0, 'MULTIPLY',
     0, 0, 0,
     'SYSTEM', 'SYSTEM', 9, 9);
SET @legId = SCOPE_IDENTITY();

INSERT INTO dbo.tran_trade_futures_detail
    (order_id, contract_spec_id, contract_month, contract_ticker, last_trading_date, is_exercised_to_physical,
     created_src_id, updated_src_id)
VALUES
    (@legId, 3004, '2026-09', 'NGU26', '2026-08-27', 0,
     9, 9);

PRINT '============================================================';
PRINT 'V264 APPLIED — test trade TRD-2026-HHFUT-001 inserted';
PRINT '  tran_trade -> tran_order -> tran_leg -> tran_trade_futures_detail';
PRINT '  NYMEX Henry Hub Sep26, 10,000 MMBtu, $3.75 -> mark $3.92, +$1,700 unrealized';
PRINT '============================================================';
GO
