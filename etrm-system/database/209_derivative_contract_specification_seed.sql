-- =============================================================================
-- ETRM SYSTEM — SEED REAL DERIVATIVE CONTRACT SPECIFICATIONS
-- =============================================================================
-- dbo.derivative_contract_specification (V161, redesigned V164 to scope via
-- market_product_link_id rather than a bare product_id) has been an empty
-- Tier2 CRUD table since creation — no futures contracts were ever entered,
-- which left the new margin-rate features (contract_margin_rate V204,
-- clearing_account_margin_rate V208) with nothing to attach to in their
-- Contract Spec dropdown.
--
-- Seeds one real, industry-standard FUTURE contract spec for each of the 7
-- genuine EXCHANGE-listed dbo.market_product_link rows already in the DB
-- (ICE Brent, NYMEX WTI, CBOT Corn/Soybeans/Wheat, LME Copper/Aluminium).
-- Deliberately skips market_product_link_id=5 (TEST_V166/ETHANOL — test
-- scaffolding data) and the 4 OTC_BILATERAL links (ICAP Brent OTC, EEX/UK
-- power physical, LBMA gold — bilateral/physical listings, not exchange
-- futures, so no exchange contract spec applies).
-- =============================================================================

USE ETRM_DB;
GO

DECLARE @src TINYINT = (SELECT source_system_id FROM dbo.source_system WHERE source_code = 'TIER1_APPLICATION_SCREEN');
DECLARE @now DATETIME2 = SYSUTCDATETIME();
DECLARE @by VARCHAR(100) = 'SYSTEM';

INSERT INTO dbo.derivative_contract_specification
  (spec_code, spec_name, instrument_type, listing_exchange_id, contract_size, contract_size_uom_id,
   tick_size, tick_value, tick_value_currency_id, notice_date_convention, expiry_convention,
   settlement_roll_convention, is_active, notes, market_product_link_id, price_uom_id, lot_uom_id,
   price_freq, row_version, created_at, created_by, updated_at, updated_by, created_src_id, updated_src_id)
VALUES
  ('ICE-BRENT-FUT', 'ICE Brent Crude Futures', 'FUTURE', 1, 1000, 1,
   0.01, 10.00, 1, 'Cash-settled against ICE Brent Index; no physical delivery notice.',
   'Trading ceases at the close of business 2 business days prior to the 15th day of the month before the contract month (or the preceding business day if the 15th is not a business day).',
   'BUSINESS_DAY_OFFSET', 1, 'Seeded V209 — real ICE contract spec.', 1003, 1, 1,
   'DAILY', 0, @now, @by, @now, @by, @src, @src),

  ('NYMEX-WTI-FUT', 'NYMEX WTI Light Sweet Crude Oil Futures', 'FUTURE', 2, 1000, 1,
   0.01, 10.00, 1, 'Physical delivery FOB at Cushing, Oklahoma; notice given per NYMEX delivery schedule.',
   'Trading ceases 3 business days prior to the 25th calendar day of the month preceding the contract month.',
   'BUSINESS_DAY_OFFSET', 1, 'Seeded V209 — real NYMEX contract spec.', 1004, 1, 1,
   'DAILY', 0, @now, @by, @now, @by, @src, @src),

  ('CBOT-CORN-FUT', 'CBOT Corn Futures', 'FUTURE', 6, 5000, 10,
   0.0025, 12.50, 1, 'Physical delivery via shipping certificate at designated CBOT delivery points.',
   'Trading ceases on the business day prior to the 15th calendar day of the contract month.',
   'FIXED_CALENDAR_DAY', 1, 'Seeded V209 — real CBOT contract spec.', 1008, 10, 10,
   'DAILY', 0, @now, @by, @now, @by, @src, @src),

  ('CBOT-SOY-FUT', 'CBOT Soybean Futures', 'FUTURE', 6, 5000, 10,
   0.0025, 12.50, 1, 'Physical delivery via shipping certificate at designated CBOT delivery points.',
   'Trading ceases on the business day prior to the 15th calendar day of the contract month.',
   'FIXED_CALENDAR_DAY', 1, 'Seeded V209 — real CBOT contract spec.', 1009, 10, 10,
   'DAILY', 0, @now, @by, @now, @by, @src, @src),

  ('CBOT-WHEAT-FUT', 'CBOT Soft Red Winter Wheat Futures', 'FUTURE', 6, 5000, 10,
   0.0025, 12.50, 1, 'Physical delivery via shipping certificate at designated CBOT delivery points.',
   'Trading ceases on the business day prior to the 15th calendar day of the contract month.',
   'FIXED_CALENDAR_DAY', 1, 'Seeded V209 — real CBOT contract spec.', 1010, 10, 10,
   'DAILY', 0, @now, @by, @now, @by, @src, @src),

  ('LME-COPPER-FUT', 'LME Copper Futures (Grade A)', 'FUTURE', 4, 25, 12,
   0.50, 12.50, 1, 'Physical delivery at LME-listed warehouses; standard LME prompt-date delivery.',
   'Daily/monthly prompt dates per LME calendar; 3-month rolling prompt is the reference contract.',
   'OTHER', 1, 'Seeded V209 — real LME contract spec.', 1011, 12, 12,
   'DAILY', 0, @now, @by, @now, @by, @src, @src),

  ('LME-ALUMINIUM-FUT', 'LME Primary Aluminium Futures', 'FUTURE', 4, 25, 12,
   0.50, 12.50, 1, 'Physical delivery at LME-listed warehouses; standard LME prompt-date delivery.',
   'Daily/monthly prompt dates per LME calendar; 3-month rolling prompt is the reference contract.',
   'OTHER', 1, 'Seeded V209 — real LME contract spec.', 1012, 12, 12,
   'DAILY', 0, @now, @by, @now, @by, @src, @src);
GO

PRINT 'V209 — derivative_contract_specification seeded with 7 real exchange contract specs;';
