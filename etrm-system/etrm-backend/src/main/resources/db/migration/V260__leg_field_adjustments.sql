-- =============================================================================
-- V260 — Leg field adjustments (Dharani, 2026-08-20)
-- =============================================================================
-- 1. Drop trade_leg_price (V259) — Dharani: "we've price", redundant with the
--    existing dbo.tran_leg.price column. Dropping rather than leaving unused.
-- 2. Add load_location_id — the leg only had a generic delivery_location_id
--    (which dbo.tran_trade_oil_detail's own discharge_location_id treats as
--    the discharge point). Physical legs need both ends of the movement at
--    the generic leg level, not just in the oil-specific extension table.
-- 3. Three pricing-nature indicator flags, denormalized onto the leg for
--    fast filtering/reporting without joining to pricing_rule every time:
--      mkt_formula_ind        — price is driven by a market index/formula
--                                (vs a flat fixed price)
--      leg_price_formula_ind  — this leg's own price is formula-derived
--                                (distinct from the order-level price, same
--                                per-leg-independence pattern as V89's
--                                entity/book/broker)
--      leg_prelim_formula_ind — the current price is a PRELIMINARY/provisional
--                                formula value, not yet finalized — physical
--                                deals are routinely invoiced provisionally
--                                pending the final pricing-period average
-- =============================================================================

USE ETRM_DB;
GO

ALTER TABLE dbo.tran_leg DROP COLUMN trade_leg_price;
GO

ALTER TABLE dbo.tran_leg ADD
    load_location_id        INT NULL,
    mkt_formula_ind          BIT NOT NULL CONSTRAINT df_tran_leg_mkt_formula_ind DEFAULT (0),
    leg_price_formula_ind     BIT NOT NULL CONSTRAINT df_tran_leg_leg_price_formula_ind DEFAULT (0),
    leg_prelim_formula_ind     BIT NOT NULL CONSTRAINT df_tran_leg_leg_prelim_formula_ind DEFAULT (0);
GO

ALTER TABLE dbo.tran_leg
    ADD CONSTRAINT fk_tran_leg_load_location FOREIGN KEY (load_location_id) REFERENCES dbo.ref_location(location_id);
GO

PRINT '============================================================';
PRINT 'V260 APPLIED — tran_leg field adjustments';
PRINT '  dropped: trade_leg_price';
PRINT '  added: load_location_id, mkt_formula_ind, leg_price_formula_ind, leg_prelim_formula_ind';
PRINT '============================================================';
GO
