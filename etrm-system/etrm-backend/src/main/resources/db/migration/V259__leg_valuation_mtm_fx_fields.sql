-- =============================================================================
-- V259 — Leg-level valuation / MTM / FX fields (Dharani, 2026-08-19)
-- =============================================================================
-- Adds mark-to-market and FX-conversion fields directly on dbo.tran_leg —
-- explicit choice, not the platform's existing dbo.position_valuation
-- pattern (V10, book/product/period bucket + full valuation_date history).
-- position_valuation stays the aggregated, book-level MTM history; these
-- columns are the leg's own cached latest snapshot — one row's worth, no
-- history — for trade-level blotter/P&L display and deal reconciliation.
-- If per-leg valuation HISTORY is ever needed, that's a new leg_valuation
-- table mirroring position_valuation's shape, not more columns here.
--
-- 9 fields requested + 2 obvious companions added to make them functional
-- rather than decorative (flagged, not silently invented):
--   - unrealized_pnl: the direct payoff of having both trade_value and
--     market_value — without it those two columns don't answer anything.
--   - base_currency_value: the payoff of having fx_hedge_rate +
--     fx_rate_operator — without it there's an FX rate with nothing to
--     apply it to.
--
-- Naming: "fx_curr_code" requested, but this table (like the rest of the
-- platform since V94/V95) stores currency as an _id FK with code resolved
-- via join, not a physical _code column — fx_currency_id, matching
-- tran_leg's own existing currency_id pattern exactly.
-- =============================================================================

USE ETRM_DB;
GO

ALTER TABLE dbo.tran_leg ADD
    -- ── Valuation snapshot ──────────────────────────────────────────────────
    -- trade_leg_price is deliberately separate from the existing `price`
    -- column: `price` is the live, capture-time deal price (NULL until fixed
    -- for formula/TAS/BALMO legs — see trade_pricing_schedule); trade_leg_price
    -- is the stable price actually used for the valuation calc as of
    -- asof_date, decoupled from capture-form edits. Sourced from `price`
    -- once fixed; not a redundant duplicate of it while unfixed.
    trade_leg_price       DECIMAL(18,6)   NULL,
    mtm_price             DECIMAL(18,6)   NULL,   -- current mark price used to revalue this leg
    asof_date             DATE            NULL,   -- valuation date this snapshot was computed for
    trade_value           DECIMAL(18,2)   NULL,   -- quantity * trade_leg_price, in tran_leg.currency_id
    market_value          DECIMAL(18,2)   NULL,   -- quantity * mtm_price, in tran_leg.currency_id
    unrealized_pnl        DECIMAL(18,2)   NULL,   -- market_value - trade_value, sign per direction (BUY: mtm-trade; SELL: trade-mtm)

    -- ── FX conversion (trade currency -> reporting/base currency) ───────────
    fx_currency_id        INT             NULL,   -- FK ref_currency — the base/reporting currency being converted to
    fx_hedge_rate         DECIMAL(18,6)   NULL,   -- FX rate applied
    fx_hedge_ind          BIT             NOT NULL CONSTRAINT df_tran_leg_fx_hedge_ind DEFAULT (0),   -- 1 = this leg carries/requires an FX hedge
    fx_rate_operator      VARCHAR(10)     NOT NULL CONSTRAINT df_tran_leg_fx_rate_operator DEFAULT ('MULTIPLY')
        CONSTRAINT chk_tran_leg_fx_rate_operator CHECK (fx_rate_operator IN ('MULTIPLY','DIVIDE')),
    base_currency_value   DECIMAL(18,2)   NULL;   -- trade_value converted via fx_hedge_rate per fx_rate_operator
GO

ALTER TABLE dbo.tran_leg
    ADD CONSTRAINT fk_tran_leg_fx_currency FOREIGN KEY (fx_currency_id) REFERENCES dbo.ref_currency(currency_id);
GO

CREATE INDEX ix_tran_leg_asof_date ON dbo.tran_leg (asof_date) WHERE asof_date IS NOT NULL;
GO

PRINT '============================================================';
PRINT 'V259 APPLIED — leg-level valuation/MTM/FX fields added to tran_leg';
PRINT '  trade_leg_price, mtm_price, asof_date, trade_value, market_value, unrealized_pnl';
PRINT '  fx_currency_id, fx_hedge_rate, fx_hedge_ind, fx_rate_operator, base_currency_value';
PRINT '============================================================';
GO
