-- =============================================================================
-- V90 — Whole-project FK integrity sweep (batch 1): uom_code family + credit
-- analyst user reference
-- =============================================================================
-- Prompted by a full-codebase review. dbo.unit_of_measure.uom_code has carried
-- a real UNIQUE constraint (uq_uom_code, V01) since the schema's foundation,
-- but every *_uom_code column added across later migrations (trade capture,
-- BALMO/BOLMO, TAS settlement, broker commissions, price adjustments, grade
-- standards) was left as a bare VARCHAR with no FK — the exact same class of
-- gap the V86/V87 currency_code/country_code sweep already fixed, just never
-- extended to UoM. All values below were verified against the actual seed
-- rows in dbo.unit_of_measure (BBL, MT, MWH, MMBTU, GAL, THERM, BUSHEL, ...)
-- before adding the constraint.
--
-- Also fixes credit_limit.credit_analyst_user_id -> app_user(user_id), a
-- plain missing "_user_id" FK of the same shape as the already-fixed
-- user_role_assignment.user_id example the handoff doc uses as the canonical
-- bug pattern.
-- =============================================================================
USE ETRM_DB;
GO

-- ── UoM code FKs ──────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_order_uom')
  ALTER TABLE dbo.trade_order ADD CONSTRAINT fk_trade_order_uom FOREIGN KEY (uom_code) REFERENCES dbo.unit_of_measure(uom_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_item_uom')
  ALTER TABLE dbo.trade_item ADD CONSTRAINT fk_trade_item_uom FOREIGN KEY (uom_code) REFERENCES dbo.unit_of_measure(uom_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_bolmo_agreement_uom')
  ALTER TABLE dbo.bolmo_agreement ADD CONSTRAINT fk_bolmo_agreement_uom FOREIGN KEY (uom_code) REFERENCES dbo.unit_of_measure(uom_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_bolmo_leg_uom')
  ALTER TABLE dbo.bolmo_leg ADD CONSTRAINT fk_bolmo_leg_uom FOREIGN KEY (uom_code) REFERENCES dbo.unit_of_measure(uom_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_balmo_product_uom')
  ALTER TABLE dbo.balmo_product ADD CONSTRAINT fk_balmo_product_uom FOREIGN KEY (uom_code) REFERENCES dbo.unit_of_measure(uom_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_settlement_price_uom')
  ALTER TABLE dbo.settlement_price ADD CONSTRAINT fk_settlement_price_uom FOREIGN KEY (uom_code) REFERENCES dbo.unit_of_measure(uom_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_broker_commission_uom')
  ALTER TABLE dbo.broker ADD CONSTRAINT fk_broker_commission_uom FOREIGN KEY (commission_uom_code) REFERENCES dbo.unit_of_measure(uom_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_broker_fee_agreement_uom')
  ALTER TABLE dbo.broker_fee_agreement ADD CONSTRAINT fk_broker_fee_agreement_uom FOREIGN KEY (uom_code) REFERENCES dbo.unit_of_measure(uom_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_option_strike_uom')
  ALTER TABLE dbo.trade_option_detail ADD CONSTRAINT fk_trade_option_strike_uom FOREIGN KEY (strike_uom_code) REFERENCES dbo.unit_of_measure(uom_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_storage_capacity_uom')
  ALTER TABLE dbo.trade_storage_agreement_detail ADD CONSTRAINT fk_trade_storage_capacity_uom FOREIGN KEY (capacity_uom_code) REFERENCES dbo.unit_of_measure(uom_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_storage_tariff_uom')
  ALTER TABLE dbo.trade_storage_agreement_detail ADD CONSTRAINT fk_trade_storage_tariff_uom FOREIGN KEY (tariff_uom_code) REFERENCES dbo.unit_of_measure(uom_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_swap_fixed_uom')
  ALTER TABLE dbo.trade_swap_detail ADD CONSTRAINT fk_trade_swap_fixed_uom FOREIGN KEY (fixed_uom_code) REFERENCES dbo.unit_of_measure(uom_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_swap_notional_uom')
  ALTER TABLE dbo.trade_swap_detail ADD CONSTRAINT fk_trade_swap_notional_uom FOREIGN KEY (notional_uom_code) REFERENCES dbo.unit_of_measure(uom_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_transport_capacity_uom')
  ALTER TABLE dbo.trade_transport_agreement_detail ADD CONSTRAINT fk_trade_transport_capacity_uom FOREIGN KEY (capacity_uom_code) REFERENCES dbo.unit_of_measure(uom_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_price_adjustment_uom')
  ALTER TABLE dbo.trade_order_price_adjustment ADD CONSTRAINT fk_price_adjustment_uom FOREIGN KEY (adjustment_uom_code) REFERENCES dbo.unit_of_measure(uom_code);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_grade_standard_uom')
  ALTER TABLE dbo.commodity_grade_standard ADD CONSTRAINT fk_grade_standard_uom FOREIGN KEY (adjustment_uom_code) REFERENCES dbo.unit_of_measure(uom_code);
GO

-- ── Credit analyst user reference ──────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_credit_limit_analyst')
  ALTER TABLE dbo.credit_limit ADD CONSTRAINT fk_credit_limit_analyst FOREIGN KEY (credit_analyst_user_id) REFERENCES dbo.app_user(user_id);
GO
