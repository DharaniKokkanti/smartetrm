-- =============================================================================
-- V262 — ref_derivative_contract_specification settlement method (Dharani, 2026-08-20)
-- =============================================================================
-- Dharani: "don't have settlement type" — checked V161's original table:
-- exercise_type already exists (PHYSICAL/CASH) but its own comment scopes it
-- to "only meaningful for OPTION/SWAPTION/SPREAD_OPTION" — a FUTURE contract
-- spec has nowhere to declare whether it settles physically (e.g. NYMEX WTI)
-- or in cash (e.g. many ICE Brent-cash-settled contracts), exactly the gap
-- V261's new tran_trade_futures_detail needs answered.
--
-- Added as a NEW column (settlement_method) rather than broadening
-- exercise_type's own scope: exercise_type answers "what happens when this
-- OPTION is exercised" (a choice the option holder makes); settlement_method
-- answers "how does this CONTRACT settle at expiry/delivery" (a fixed
-- property of the contract itself, applies to FUTURE/SWAP/FORWARD too, not
-- just option-family instruments) — different questions, conflating them
-- into one column would make future exercise_type reads/writes ambiguous
-- about which meaning applies for a given instrument_type.
-- =============================================================================

USE ETRM_DB;
GO

ALTER TABLE dbo.ref_derivative_contract_specification ADD
    settlement_method   VARCHAR(10) NULL   -- applies to ALL instrument_type values, not just option-family (contrast exercise_type above)
        CONSTRAINT chk_rdcs_settlement_method CHECK (settlement_method IS NULL OR settlement_method IN ('PHYSICAL', 'CASH'));
GO

PRINT '============================================================';
PRINT 'V262 APPLIED — ref_derivative_contract_specification.settlement_method added';
PRINT '============================================================';
GO
