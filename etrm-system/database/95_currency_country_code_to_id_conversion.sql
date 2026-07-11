-- =============================================================================
-- V95 -- Convert currency_code/country_code/jurisdiction natural-key FKs to
-- surrogate-key (currency_id/country_id) FKs, closing the largest remaining
-- code-based-FK family flagged in the V94 "future work" inventory.
--
-- Same pattern as V94: add the new *_id column nullable, backfill by joining
-- the old code column to the master table, drop the old FK + old code
-- column, restore NOT NULL where the original was, add a DEFAULT matching
-- the old string default (USD = currency_id 1) where one existed, then add
-- the real FK on the id.
--
-- Two latent findings, discovered while verifying scope (same discipline as
-- V30/V91's precedent -- verify structure directly against the live schema
-- before writing an ALTER, don't trust an earlier migration's comment):
--   1. V87's ALTER for dbo.pipeline.country_code targeted a column that does
--      not exist on the live table (04_product_spec_mot_pipeline.sql drops
--      and recreates dbo.pipeline with only a CSV `country_codes
--      VARCHAR(100)` column). Fixed in place in
--      87_currency_country_reference_integrity.sql (guarded with
--      IF EXISTS(sys.columns), matching the V91 fix to V30's dead CREATE) --
--      not repeated here. dbo.pipeline is excluded from this migration
--      entirely -- there is no single-value column to convert.
--   2. dbo.legal_entity.base_currency was CHAR(3) code-based (`fk_le_currency`,
--      added in V01) and never appeared in V87's currency sweep -- included
--      here as the 32nd currency column.
--
-- Also closes 3 genuine gaps found during the inventory: dbo.insurance_provider
-- .country_code, dbo.regulatory_report_type.jurisdiction, and
-- dbo.trade_repository.jurisdiction had no FK constraint at all (bare
-- columns) -- these get the surrogate id + FK added fresh, not converted
-- from an existing constraint.
-- =============================================================================
USE ETRM_DB;
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- CURRENCY FAMILY (32 columns)
-- ─────────────────────────────────────────────────────────────────────────────

-- trader.limit_currency -> limit_currency_id
ALTER TABLE dbo.trader ADD limit_currency_id INT NULL;
GO
UPDATE t SET t.limit_currency_id = c.currency_id FROM dbo.trader t JOIN dbo.currency c ON c.currency_code = t.limit_currency;
GO
ALTER TABLE dbo.trader DROP CONSTRAINT IF EXISTS fk_trader_limit_ccy;
ALTER TABLE dbo.trader DROP COLUMN IF EXISTS limit_currency;
GO
ALTER TABLE dbo.trader ADD CONSTRAINT df_trader_limit_currency_id DEFAULT 1 FOR limit_currency_id;
ALTER TABLE dbo.trader ALTER COLUMN limit_currency_id INT NOT NULL;
GO
ALTER TABLE dbo.trader ADD CONSTRAINT fk_trader_limit_ccy FOREIGN KEY (limit_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- book.base_currency -> base_currency_id
ALTER TABLE dbo.book ADD base_currency_id INT NULL;
GO
UPDATE t SET t.base_currency_id = c.currency_id FROM dbo.book t JOIN dbo.currency c ON c.currency_code = t.base_currency;
GO
ALTER TABLE dbo.book DROP CONSTRAINT IF EXISTS fk_book_base_ccy;
ALTER TABLE dbo.book DROP COLUMN IF EXISTS base_currency;
GO
ALTER TABLE dbo.book ADD CONSTRAINT df_book_base_currency_id DEFAULT 1 FOR base_currency_id;
ALTER TABLE dbo.book ALTER COLUMN base_currency_id INT NOT NULL;
GO
ALTER TABLE dbo.book ADD CONSTRAINT fk_book_base_ccy FOREIGN KEY (base_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- counterparty.credit_limit_currency -> credit_limit_currency_id
ALTER TABLE dbo.counterparty ADD credit_limit_currency_id INT NULL;
GO
UPDATE t SET t.credit_limit_currency_id = c.currency_id FROM dbo.counterparty t JOIN dbo.currency c ON c.currency_code = t.credit_limit_currency;
GO
ALTER TABLE dbo.counterparty DROP CONSTRAINT IF EXISTS fk_cp_credit_limit_ccy;
ALTER TABLE dbo.counterparty DROP COLUMN IF EXISTS credit_limit_currency;
GO
ALTER TABLE dbo.counterparty ADD CONSTRAINT df_counterparty_credit_limit_currency_id DEFAULT 1 FOR credit_limit_currency_id;
ALTER TABLE dbo.counterparty ALTER COLUMN credit_limit_currency_id INT NOT NULL;
GO
ALTER TABLE dbo.counterparty ADD CONSTRAINT fk_cp_credit_limit_ccy FOREIGN KEY (credit_limit_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- cp_legal_entity_link.limit_currency -> limit_currency_id
ALTER TABLE dbo.cp_legal_entity_link ADD limit_currency_id INT NULL;
GO
UPDATE t SET t.limit_currency_id = c.currency_id FROM dbo.cp_legal_entity_link t JOIN dbo.currency c ON c.currency_code = t.limit_currency;
GO
ALTER TABLE dbo.cp_legal_entity_link DROP CONSTRAINT IF EXISTS fk_cplink_limit_ccy;
ALTER TABLE dbo.cp_legal_entity_link DROP COLUMN IF EXISTS limit_currency;
GO
ALTER TABLE dbo.cp_legal_entity_link ADD CONSTRAINT df_cp_legal_entity_link_limit_currency_id DEFAULT 1 FOR limit_currency_id;
ALTER TABLE dbo.cp_legal_entity_link ALTER COLUMN limit_currency_id INT NOT NULL;
GO
ALTER TABLE dbo.cp_legal_entity_link ADD CONSTRAINT fk_cplink_limit_ccy FOREIGN KEY (limit_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- credit_term.margin_call_currency -> margin_call_currency_id
ALTER TABLE dbo.credit_term ADD margin_call_currency_id INT NULL;
GO
UPDATE t SET t.margin_call_currency_id = c.currency_id FROM dbo.credit_term t JOIN dbo.currency c ON c.currency_code = t.margin_call_currency;
GO
ALTER TABLE dbo.credit_term DROP CONSTRAINT IF EXISTS fk_credit_term_margin_ccy;
ALTER TABLE dbo.credit_term DROP COLUMN IF EXISTS margin_call_currency;
GO
ALTER TABLE dbo.credit_term ADD CONSTRAINT df_credit_term_margin_call_currency_id DEFAULT 1 FOR margin_call_currency_id;
ALTER TABLE dbo.credit_term ALTER COLUMN margin_call_currency_id INT NOT NULL;
GO
ALTER TABLE dbo.credit_term ADD CONSTRAINT fk_credit_term_margin_ccy FOREIGN KEY (margin_call_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- legal_entity.base_currency -> base_currency_id
ALTER TABLE dbo.legal_entity ADD base_currency_id INT NULL;
GO
UPDATE t SET t.base_currency_id = c.currency_id FROM dbo.legal_entity t JOIN dbo.currency c ON c.currency_code = t.base_currency;
GO
ALTER TABLE dbo.legal_entity DROP CONSTRAINT IF EXISTS fk_le_currency;
ALTER TABLE dbo.legal_entity DROP COLUMN IF EXISTS base_currency;
GO
ALTER TABLE dbo.legal_entity ADD CONSTRAINT df_legal_entity_base_currency_id DEFAULT 1 FOR base_currency_id;
ALTER TABLE dbo.legal_entity ALTER COLUMN base_currency_id INT NOT NULL;
GO
ALTER TABLE dbo.legal_entity ADD CONSTRAINT fk_le_currency FOREIGN KEY (base_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- broker_fee_agreement.fee_currency_code -> fee_currency_id
ALTER TABLE dbo.broker_fee_agreement ADD fee_currency_id INT NULL;
GO
UPDATE t SET t.fee_currency_id = c.currency_id FROM dbo.broker_fee_agreement t JOIN dbo.currency c ON c.currency_code = t.fee_currency_code;
GO
ALTER TABLE dbo.broker_fee_agreement DROP CONSTRAINT IF EXISTS fk_bfa_fee_ccy;
ALTER TABLE dbo.broker_fee_agreement DROP COLUMN IF EXISTS fee_currency_code;
GO
ALTER TABLE dbo.broker_fee_agreement ADD CONSTRAINT df_broker_fee_agreement_fee_currency_id DEFAULT 1 FOR fee_currency_id;
ALTER TABLE dbo.broker_fee_agreement ALTER COLUMN fee_currency_id INT NOT NULL;
GO
ALTER TABLE dbo.broker_fee_agreement ADD CONSTRAINT fk_bfa_fee_ccy FOREIGN KEY (fee_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- margin_agreement.threshold_currency -> threshold_currency_id
ALTER TABLE dbo.margin_agreement ADD threshold_currency_id INT NULL;
GO
UPDATE t SET t.threshold_currency_id = c.currency_id FROM dbo.margin_agreement t JOIN dbo.currency c ON c.currency_code = t.threshold_currency;
GO
ALTER TABLE dbo.margin_agreement DROP CONSTRAINT IF EXISTS fk_ma_threshold_ccy;
ALTER TABLE dbo.margin_agreement DROP COLUMN IF EXISTS threshold_currency;
GO
ALTER TABLE dbo.margin_agreement ADD CONSTRAINT df_margin_agreement_threshold_currency_id DEFAULT 1 FOR threshold_currency_id;
ALTER TABLE dbo.margin_agreement ALTER COLUMN threshold_currency_id INT NOT NULL;
GO
ALTER TABLE dbo.margin_agreement ADD CONSTRAINT fk_ma_threshold_ccy FOREIGN KEY (threshold_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- margin_agreement.cp_threshold_currency -> cp_threshold_currency_id
ALTER TABLE dbo.margin_agreement ADD cp_threshold_currency_id INT NULL;
GO
UPDATE t SET t.cp_threshold_currency_id = c.currency_id FROM dbo.margin_agreement t JOIN dbo.currency c ON c.currency_code = t.cp_threshold_currency;
GO
ALTER TABLE dbo.margin_agreement DROP CONSTRAINT IF EXISTS fk_ma_cp_threshold_ccy;
ALTER TABLE dbo.margin_agreement DROP COLUMN IF EXISTS cp_threshold_currency;
GO
ALTER TABLE dbo.margin_agreement ADD CONSTRAINT df_margin_agreement_cp_threshold_currency_id DEFAULT 1 FOR cp_threshold_currency_id;
ALTER TABLE dbo.margin_agreement ALTER COLUMN cp_threshold_currency_id INT NOT NULL;
GO
ALTER TABLE dbo.margin_agreement ADD CONSTRAINT fk_ma_cp_threshold_ccy FOREIGN KEY (cp_threshold_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- margin_agreement.mta_currency -> mta_currency_id
ALTER TABLE dbo.margin_agreement ADD mta_currency_id INT NULL;
GO
UPDATE t SET t.mta_currency_id = c.currency_id FROM dbo.margin_agreement t JOIN dbo.currency c ON c.currency_code = t.mta_currency;
GO
ALTER TABLE dbo.margin_agreement DROP CONSTRAINT IF EXISTS fk_ma_mta_ccy;
ALTER TABLE dbo.margin_agreement DROP COLUMN IF EXISTS mta_currency;
GO
ALTER TABLE dbo.margin_agreement ADD CONSTRAINT df_margin_agreement_mta_currency_id DEFAULT 1 FOR mta_currency_id;
ALTER TABLE dbo.margin_agreement ALTER COLUMN mta_currency_id INT NOT NULL;
GO
ALTER TABLE dbo.margin_agreement ADD CONSTRAINT fk_ma_mta_ccy FOREIGN KEY (mta_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- margin_agreement.independent_amount_currency -> independent_amount_currency_id
ALTER TABLE dbo.margin_agreement ADD independent_amount_currency_id INT NULL;
GO
UPDATE t SET t.independent_amount_currency_id = c.currency_id FROM dbo.margin_agreement t JOIN dbo.currency c ON c.currency_code = t.independent_amount_currency;
GO
ALTER TABLE dbo.margin_agreement DROP CONSTRAINT IF EXISTS fk_ma_indep_amt_ccy;
ALTER TABLE dbo.margin_agreement DROP COLUMN IF EXISTS independent_amount_currency;
GO
ALTER TABLE dbo.margin_agreement ADD CONSTRAINT fk_ma_indep_amt_ccy FOREIGN KEY (independent_amount_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- credit_limit.limit_currency -> limit_currency_id
ALTER TABLE dbo.credit_limit ADD limit_currency_id INT NULL;
GO
UPDATE t SET t.limit_currency_id = c.currency_id FROM dbo.credit_limit t JOIN dbo.currency c ON c.currency_code = t.limit_currency;
GO
ALTER TABLE dbo.credit_limit DROP CONSTRAINT IF EXISTS fk_cl_limit_ccy;
ALTER TABLE dbo.credit_limit DROP COLUMN IF EXISTS limit_currency;
GO
ALTER TABLE dbo.credit_limit ADD CONSTRAINT df_credit_limit_limit_currency_id DEFAULT 1 FOR limit_currency_id;
ALTER TABLE dbo.credit_limit ALTER COLUMN limit_currency_id INT NOT NULL;
GO
ALTER TABLE dbo.credit_limit ADD CONSTRAINT fk_cl_limit_ccy FOREIGN KEY (limit_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- letter_of_credit.lc_currency -> lc_currency_id
ALTER TABLE dbo.letter_of_credit ADD lc_currency_id INT NULL;
GO
UPDATE t SET t.lc_currency_id = c.currency_id FROM dbo.letter_of_credit t JOIN dbo.currency c ON c.currency_code = t.lc_currency;
GO
ALTER TABLE dbo.letter_of_credit DROP CONSTRAINT IF EXISTS fk_lc_lc_ccy;
ALTER TABLE dbo.letter_of_credit DROP COLUMN IF EXISTS lc_currency;
GO
ALTER TABLE dbo.letter_of_credit ADD CONSTRAINT df_letter_of_credit_lc_currency_id DEFAULT 1 FOR lc_currency_id;
ALTER TABLE dbo.letter_of_credit ALTER COLUMN lc_currency_id INT NOT NULL;
GO
ALTER TABLE dbo.letter_of_credit ADD CONSTRAINT fk_lc_lc_ccy FOREIGN KEY (lc_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- trade_order.currency_code -> currency_id
ALTER TABLE dbo.trade_order ADD currency_id INT NULL;
GO
UPDATE t SET t.currency_id = c.currency_id FROM dbo.trade_order t JOIN dbo.currency c ON c.currency_code = t.currency_code;
GO
ALTER TABLE dbo.trade_order DROP CONSTRAINT IF EXISTS fk_to_currency_code;
ALTER TABLE dbo.trade_order DROP COLUMN IF EXISTS currency_code;
GO
ALTER TABLE dbo.trade_order ALTER COLUMN currency_id INT NOT NULL;
GO
ALTER TABLE dbo.trade_order ADD CONSTRAINT fk_to_currency_code FOREIGN KEY (currency_id) REFERENCES dbo.currency(currency_id);
GO

-- trade_item.currency_code -> currency_id
ALTER TABLE dbo.trade_item ADD currency_id INT NULL;
GO
UPDATE t SET t.currency_id = c.currency_id FROM dbo.trade_item t JOIN dbo.currency c ON c.currency_code = t.currency_code;
GO
ALTER TABLE dbo.trade_item DROP CONSTRAINT IF EXISTS fk_ti_currency_code;
ALTER TABLE dbo.trade_item DROP COLUMN IF EXISTS currency_code;
GO
ALTER TABLE dbo.trade_item ADD CONSTRAINT df_trade_item_currency_id DEFAULT 1 FOR currency_id;
ALTER TABLE dbo.trade_item ALTER COLUMN currency_id INT NOT NULL;
GO
ALTER TABLE dbo.trade_item ADD CONSTRAINT fk_ti_currency_code FOREIGN KEY (currency_id) REFERENCES dbo.currency(currency_id);
GO

-- settlement_price.tick_currency -> tick_currency_id
ALTER TABLE dbo.settlement_price ADD tick_currency_id INT NULL;
GO
UPDATE t SET t.tick_currency_id = c.currency_id FROM dbo.settlement_price t JOIN dbo.currency c ON c.currency_code = t.tick_currency;
GO
ALTER TABLE dbo.settlement_price DROP CONSTRAINT IF EXISTS fk_sp_tick_ccy;
ALTER TABLE dbo.settlement_price DROP COLUMN IF EXISTS tick_currency;
GO
ALTER TABLE dbo.settlement_price ADD CONSTRAINT df_settlement_price_tick_currency_id DEFAULT 1 FOR tick_currency_id;
ALTER TABLE dbo.settlement_price ALTER COLUMN tick_currency_id INT NOT NULL;
GO
ALTER TABLE dbo.settlement_price ADD CONSTRAINT fk_sp_tick_ccy FOREIGN KEY (tick_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- bolmo_agreement.currency_code -> currency_id
ALTER TABLE dbo.bolmo_agreement ADD currency_id INT NULL;
GO
UPDATE t SET t.currency_id = c.currency_id FROM dbo.bolmo_agreement t JOIN dbo.currency c ON c.currency_code = t.currency_code;
GO
ALTER TABLE dbo.bolmo_agreement DROP CONSTRAINT IF EXISTS fk_bolmo_currency_code;
ALTER TABLE dbo.bolmo_agreement DROP COLUMN IF EXISTS currency_code;
GO
ALTER TABLE dbo.bolmo_agreement ADD CONSTRAINT df_bolmo_agreement_currency_id DEFAULT 1 FOR currency_id;
ALTER TABLE dbo.bolmo_agreement ALTER COLUMN currency_id INT NOT NULL;
GO
ALTER TABLE dbo.bolmo_agreement ADD CONSTRAINT fk_bolmo_currency_code FOREIGN KEY (currency_id) REFERENCES dbo.currency(currency_id);
GO

-- balmo_product.tick_currency -> tick_currency_id
ALTER TABLE dbo.balmo_product ADD tick_currency_id INT NULL;
GO
UPDATE t SET t.tick_currency_id = c.currency_id FROM dbo.balmo_product t JOIN dbo.currency c ON c.currency_code = t.tick_currency;
GO
ALTER TABLE dbo.balmo_product DROP CONSTRAINT IF EXISTS fk_balmo_tick_ccy;
ALTER TABLE dbo.balmo_product DROP COLUMN IF EXISTS tick_currency;
GO
ALTER TABLE dbo.balmo_product ADD CONSTRAINT df_balmo_product_tick_currency_id DEFAULT 1 FOR tick_currency_id;
ALTER TABLE dbo.balmo_product ALTER COLUMN tick_currency_id INT NOT NULL;
GO
ALTER TABLE dbo.balmo_product ADD CONSTRAINT fk_balmo_tick_ccy FOREIGN KEY (tick_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- trader_commodity_limit.limit_currency -> limit_currency_id
ALTER TABLE dbo.trader_commodity_limit ADD limit_currency_id INT NULL;
GO
UPDATE t SET t.limit_currency_id = c.currency_id FROM dbo.trader_commodity_limit t JOIN dbo.currency c ON c.currency_code = t.limit_currency;
GO
ALTER TABLE dbo.trader_commodity_limit DROP CONSTRAINT IF EXISTS fk_tcl_limit_ccy;
ALTER TABLE dbo.trader_commodity_limit DROP COLUMN IF EXISTS limit_currency;
GO
ALTER TABLE dbo.trader_commodity_limit ADD CONSTRAINT df_trader_commodity_limit_limit_currency_id DEFAULT 1 FOR limit_currency_id;
ALTER TABLE dbo.trader_commodity_limit ALTER COLUMN limit_currency_id INT NOT NULL;
GO
ALTER TABLE dbo.trader_commodity_limit ADD CONSTRAINT fk_tcl_limit_ccy FOREIGN KEY (limit_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- trade_swap_detail.fixed_currency_code -> fixed_currency_id
ALTER TABLE dbo.trade_swap_detail ADD fixed_currency_id INT NULL;
GO
UPDATE t SET t.fixed_currency_id = c.currency_id FROM dbo.trade_swap_detail t JOIN dbo.currency c ON c.currency_code = t.fixed_currency_code;
GO
ALTER TABLE dbo.trade_swap_detail DROP CONSTRAINT IF EXISTS fk_swap_fixed_ccy;
ALTER TABLE dbo.trade_swap_detail DROP COLUMN IF EXISTS fixed_currency_code;
GO
ALTER TABLE dbo.trade_swap_detail ADD CONSTRAINT fk_swap_fixed_ccy FOREIGN KEY (fixed_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- trade_option_detail.strike_currency_code -> strike_currency_id
ALTER TABLE dbo.trade_option_detail ADD strike_currency_id INT NULL;
GO
UPDATE t SET t.strike_currency_id = c.currency_id FROM dbo.trade_option_detail t JOIN dbo.currency c ON c.currency_code = t.strike_currency_code;
GO
ALTER TABLE dbo.trade_option_detail DROP CONSTRAINT IF EXISTS fk_option_strike_ccy;
ALTER TABLE dbo.trade_option_detail DROP COLUMN IF EXISTS strike_currency_code;
GO
ALTER TABLE dbo.trade_option_detail ADD CONSTRAINT fk_option_strike_ccy FOREIGN KEY (strike_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- trade_option_detail.premium_currency_code -> premium_currency_id
ALTER TABLE dbo.trade_option_detail ADD premium_currency_id INT NULL;
GO
UPDATE t SET t.premium_currency_id = c.currency_id FROM dbo.trade_option_detail t JOIN dbo.currency c ON c.currency_code = t.premium_currency_code;
GO
ALTER TABLE dbo.trade_option_detail DROP CONSTRAINT IF EXISTS fk_option_premium_ccy;
ALTER TABLE dbo.trade_option_detail DROP COLUMN IF EXISTS premium_currency_code;
GO
ALTER TABLE dbo.trade_option_detail ADD CONSTRAINT fk_option_premium_ccy FOREIGN KEY (premium_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- trade_storage_agreement_detail.tariff_currency_code -> tariff_currency_id
ALTER TABLE dbo.trade_storage_agreement_detail ADD tariff_currency_id INT NULL;
GO
UPDATE t SET t.tariff_currency_id = c.currency_id FROM dbo.trade_storage_agreement_detail t JOIN dbo.currency c ON c.currency_code = t.tariff_currency_code;
GO
ALTER TABLE dbo.trade_storage_agreement_detail DROP CONSTRAINT IF EXISTS fk_storage_agr_tariff_ccy;
ALTER TABLE dbo.trade_storage_agreement_detail DROP COLUMN IF EXISTS tariff_currency_code;
GO
ALTER TABLE dbo.trade_storage_agreement_detail ADD CONSTRAINT fk_storage_agr_tariff_ccy FOREIGN KEY (tariff_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- trade_transport_agreement_detail.freight_currency_code -> freight_currency_id
ALTER TABLE dbo.trade_transport_agreement_detail ADD freight_currency_id INT NULL;
GO
UPDATE t SET t.freight_currency_id = c.currency_id FROM dbo.trade_transport_agreement_detail t JOIN dbo.currency c ON c.currency_code = t.freight_currency_code;
GO
ALTER TABLE dbo.trade_transport_agreement_detail DROP CONSTRAINT IF EXISTS fk_transport_agr_freight_ccy;
ALTER TABLE dbo.trade_transport_agreement_detail DROP COLUMN IF EXISTS freight_currency_code;
GO
ALTER TABLE dbo.trade_transport_agreement_detail ADD CONSTRAINT fk_transport_agr_freight_ccy FOREIGN KEY (freight_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- trade_order.demurrage_currency -> demurrage_currency_id
ALTER TABLE dbo.trade_order ADD demurrage_currency_id INT NULL;
GO
UPDATE t SET t.demurrage_currency_id = c.currency_id FROM dbo.trade_order t JOIN dbo.currency c ON c.currency_code = t.demurrage_currency;
GO
ALTER TABLE dbo.trade_order DROP CONSTRAINT IF EXISTS fk_to_demurrage_ccy;
ALTER TABLE dbo.trade_order DROP COLUMN IF EXISTS demurrage_currency;
GO
ALTER TABLE dbo.trade_order ADD CONSTRAINT fk_to_demurrage_ccy FOREIGN KEY (demurrage_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- trade_order_price_adjustment.adjustment_currency -> adjustment_currency_id
ALTER TABLE dbo.trade_order_price_adjustment ADD adjustment_currency_id INT NULL;
GO
UPDATE t SET t.adjustment_currency_id = c.currency_id FROM dbo.trade_order_price_adjustment t JOIN dbo.currency c ON c.currency_code = t.adjustment_currency;
GO
ALTER TABLE dbo.trade_order_price_adjustment DROP CONSTRAINT IF EXISTS fk_topa_adjustment_ccy;
ALTER TABLE dbo.trade_order_price_adjustment DROP COLUMN IF EXISTS adjustment_currency;
GO
ALTER TABLE dbo.trade_order_price_adjustment ADD CONSTRAINT fk_topa_adjustment_ccy FOREIGN KEY (adjustment_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- gl_account.currency_code -> currency_id
ALTER TABLE dbo.gl_account ADD currency_id INT NULL;
GO
UPDATE t SET t.currency_id = c.currency_id FROM dbo.gl_account t JOIN dbo.currency c ON c.currency_code = t.currency_code;
GO
ALTER TABLE dbo.gl_account DROP CONSTRAINT IF EXISTS fk_gl_account_ccy;
ALTER TABLE dbo.gl_account DROP COLUMN IF EXISTS currency_code;
GO
ALTER TABLE dbo.gl_account ADD CONSTRAINT fk_gl_account_ccy FOREIGN KEY (currency_id) REFERENCES dbo.currency(currency_id);
GO

-- commodity_grade_standard.adjustment_currency_code -> adjustment_currency_id
ALTER TABLE dbo.commodity_grade_standard ADD adjustment_currency_id INT NULL;
GO
UPDATE t SET t.adjustment_currency_id = c.currency_id FROM dbo.commodity_grade_standard t JOIN dbo.currency c ON c.currency_code = t.adjustment_currency_code;
GO
ALTER TABLE dbo.commodity_grade_standard DROP CONSTRAINT IF EXISTS fk_cgs_adjustment_ccy;
ALTER TABLE dbo.commodity_grade_standard DROP COLUMN IF EXISTS adjustment_currency_code;
GO
ALTER TABLE dbo.commodity_grade_standard ADD CONSTRAINT fk_cgs_adjustment_ccy FOREIGN KEY (adjustment_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- trade_cost.currency_code -> currency_id
ALTER TABLE dbo.trade_cost ADD currency_id INT NULL;
GO
UPDATE t SET t.currency_id = c.currency_id FROM dbo.trade_cost t JOIN dbo.currency c ON c.currency_code = t.currency_code;
GO
ALTER TABLE dbo.trade_cost DROP CONSTRAINT IF EXISTS fk_tc_currency;
ALTER TABLE dbo.trade_cost DROP COLUMN IF EXISTS currency_code;
GO
ALTER TABLE dbo.trade_cost ALTER COLUMN currency_id INT NOT NULL;
GO
ALTER TABLE dbo.trade_cost ADD CONSTRAINT fk_tc_currency FOREIGN KEY (currency_id) REFERENCES dbo.currency(currency_id);
GO

-- trade_order_cost.currency_code -> currency_id
ALTER TABLE dbo.trade_order_cost ADD currency_id INT NULL;
GO
UPDATE t SET t.currency_id = c.currency_id FROM dbo.trade_order_cost t JOIN dbo.currency c ON c.currency_code = t.currency_code;
GO
ALTER TABLE dbo.trade_order_cost DROP CONSTRAINT IF EXISTS fk_toc_currency;
ALTER TABLE dbo.trade_order_cost DROP COLUMN IF EXISTS currency_code;
GO
ALTER TABLE dbo.trade_order_cost ALTER COLUMN currency_id INT NOT NULL;
GO
ALTER TABLE dbo.trade_order_cost ADD CONSTRAINT fk_toc_currency FOREIGN KEY (currency_id) REFERENCES dbo.currency(currency_id);
GO

-- trade_order.broker_fee_currency_code -> broker_fee_currency_id
ALTER TABLE dbo.trade_order ADD broker_fee_currency_id INT NULL;
GO
UPDATE t SET t.broker_fee_currency_id = c.currency_id FROM dbo.trade_order t JOIN dbo.currency c ON c.currency_code = t.broker_fee_currency_code;
GO
ALTER TABLE dbo.trade_order DROP CONSTRAINT IF EXISTS fk_to_broker_fee_currency;
ALTER TABLE dbo.trade_order DROP COLUMN IF EXISTS broker_fee_currency_code;
GO
ALTER TABLE dbo.trade_order ADD CONSTRAINT fk_to_broker_fee_currency FOREIGN KEY (broker_fee_currency_id) REFERENCES dbo.currency(currency_id);
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- COUNTRY FAMILY (21 columns, existing FKs converted)
-- ─────────────────────────────────────────────────────────────────────────────

-- holiday_calendar.country_code -> country_id
ALTER TABLE dbo.holiday_calendar ADD country_id INT NULL;
GO
UPDATE t SET t.country_id = c.country_id FROM dbo.holiday_calendar t JOIN dbo.country c ON c.country_code = t.country_code;
GO
ALTER TABLE dbo.holiday_calendar DROP CONSTRAINT IF EXISTS fk_hc_country;
ALTER TABLE dbo.holiday_calendar DROP COLUMN IF EXISTS country_code;
GO
ALTER TABLE dbo.holiday_calendar ADD CONSTRAINT fk_hc_country FOREIGN KEY (country_id) REFERENCES dbo.country(country_id);
GO

-- address.country_code -> country_id
ALTER TABLE dbo.address ADD country_id INT NULL;
GO
UPDATE t SET t.country_id = c.country_id FROM dbo.address t JOIN dbo.country c ON c.country_code = t.country_code;
GO
ALTER TABLE dbo.address DROP CONSTRAINT IF EXISTS fk_address_country;
ALTER TABLE dbo.address DROP COLUMN IF EXISTS country_code;
GO
ALTER TABLE dbo.address ALTER COLUMN country_id INT NOT NULL;
GO
ALTER TABLE dbo.address ADD CONSTRAINT fk_address_country FOREIGN KEY (country_id) REFERENCES dbo.country(country_id);
GO

-- location.country_code -> country_id
ALTER TABLE dbo.location ADD country_id INT NULL;
GO
UPDATE t SET t.country_id = c.country_id FROM dbo.location t JOIN dbo.country c ON c.country_code = t.country_code;
GO
ALTER TABLE dbo.location DROP CONSTRAINT IF EXISTS fk_location_country;
ALTER TABLE dbo.location DROP COLUMN IF EXISTS country_code;
GO
ALTER TABLE dbo.location ALTER COLUMN country_id INT NOT NULL;
GO
ALTER TABLE dbo.location ADD CONSTRAINT fk_location_country FOREIGN KEY (country_id) REFERENCES dbo.country(country_id);
GO

-- tax_registration.jurisdiction -> jurisdiction_id
ALTER TABLE dbo.tax_registration ADD jurisdiction_id INT NULL;
GO
UPDATE t SET t.jurisdiction_id = c.country_id FROM dbo.tax_registration t JOIN dbo.country c ON c.country_code = t.jurisdiction;
GO
ALTER TABLE dbo.tax_registration DROP CONSTRAINT IF EXISTS fk_taxreg_jurisdiction;
ALTER TABLE dbo.tax_registration DROP COLUMN IF EXISTS jurisdiction;
GO
ALTER TABLE dbo.tax_registration ALTER COLUMN jurisdiction_id INT NOT NULL;
GO
ALTER TABLE dbo.tax_registration ADD CONSTRAINT fk_taxreg_jurisdiction FOREIGN KEY (jurisdiction_id) REFERENCES dbo.country(country_id);
GO

-- legal_entity.jurisdiction -> jurisdiction_id
ALTER TABLE dbo.legal_entity ADD jurisdiction_id INT NULL;
GO
UPDATE t SET t.jurisdiction_id = c.country_id FROM dbo.legal_entity t JOIN dbo.country c ON c.country_code = t.jurisdiction;
GO
ALTER TABLE dbo.legal_entity DROP CONSTRAINT IF EXISTS fk_le_jurisdiction;
ALTER TABLE dbo.legal_entity DROP COLUMN IF EXISTS jurisdiction;
GO
ALTER TABLE dbo.legal_entity ALTER COLUMN jurisdiction_id INT NOT NULL;
GO
ALTER TABLE dbo.legal_entity ADD CONSTRAINT fk_le_jurisdiction FOREIGN KEY (jurisdiction_id) REFERENCES dbo.country(country_id);
GO

-- counterparty.jurisdiction -> jurisdiction_id
ALTER TABLE dbo.counterparty ADD jurisdiction_id INT NULL;
GO
UPDATE t SET t.jurisdiction_id = c.country_id FROM dbo.counterparty t JOIN dbo.country c ON c.country_code = t.jurisdiction;
GO
ALTER TABLE dbo.counterparty DROP CONSTRAINT IF EXISTS fk_cp_jurisdiction;
ALTER TABLE dbo.counterparty DROP COLUMN IF EXISTS jurisdiction;
GO
ALTER TABLE dbo.counterparty ALTER COLUMN jurisdiction_id INT NOT NULL;
GO
ALTER TABLE dbo.counterparty ADD CONSTRAINT fk_cp_jurisdiction FOREIGN KEY (jurisdiction_id) REFERENCES dbo.country(country_id);
GO

-- gtc.jurisdiction -> jurisdiction_id
ALTER TABLE dbo.gtc ADD jurisdiction_id INT NULL;
GO
UPDATE t SET t.jurisdiction_id = c.country_id FROM dbo.gtc t JOIN dbo.country c ON c.country_code = t.jurisdiction;
GO
ALTER TABLE dbo.gtc DROP CONSTRAINT IF EXISTS fk_gtc_jurisdiction;
ALTER TABLE dbo.gtc DROP COLUMN IF EXISTS jurisdiction;
GO
ALTER TABLE dbo.gtc ADD CONSTRAINT fk_gtc_jurisdiction FOREIGN KEY (jurisdiction_id) REFERENCES dbo.country(country_id);
GO

-- legal_entity.incorporation_country -> incorporation_country_id
ALTER TABLE dbo.legal_entity ADD incorporation_country_id INT NULL;
GO
UPDATE t SET t.incorporation_country_id = c.country_id FROM dbo.legal_entity t JOIN dbo.country c ON c.country_code = t.incorporation_country;
GO
ALTER TABLE dbo.legal_entity DROP CONSTRAINT IF EXISTS fk_le_incorporation_country;
ALTER TABLE dbo.legal_entity DROP COLUMN IF EXISTS incorporation_country;
GO
ALTER TABLE dbo.legal_entity ADD CONSTRAINT fk_le_incorporation_country FOREIGN KEY (incorporation_country_id) REFERENCES dbo.country(country_id);
GO

-- exchange.country_code -> country_id
ALTER TABLE dbo.exchange ADD country_id INT NULL;
GO
UPDATE t SET t.country_id = c.country_id FROM dbo.exchange t JOIN dbo.country c ON c.country_code = t.country_code;
GO
ALTER TABLE dbo.exchange DROP CONSTRAINT IF EXISTS fk_exchange_country;
ALTER TABLE dbo.exchange DROP COLUMN IF EXISTS country_code;
GO
ALTER TABLE dbo.exchange ALTER COLUMN country_id INT NOT NULL;
GO
ALTER TABLE dbo.exchange ADD CONSTRAINT fk_exchange_country FOREIGN KEY (country_id) REFERENCES dbo.country(country_id);
GO

-- market.country_code -> country_id
ALTER TABLE dbo.market ADD country_id INT NULL;
GO
UPDATE t SET t.country_id = c.country_id FROM dbo.market t JOIN dbo.country c ON c.country_code = t.country_code;
GO
ALTER TABLE dbo.market DROP CONSTRAINT IF EXISTS fk_market_country;
ALTER TABLE dbo.market DROP COLUMN IF EXISTS country_code;
GO
ALTER TABLE dbo.market ADD CONSTRAINT fk_market_country FOREIGN KEY (country_id) REFERENCES dbo.country(country_id);
GO

-- transport_operator.country_code -> country_id
ALTER TABLE dbo.transport_operator ADD country_id INT NULL;
GO
UPDATE t SET t.country_id = c.country_id FROM dbo.transport_operator t JOIN dbo.country c ON c.country_code = t.country_code;
GO
ALTER TABLE dbo.transport_operator DROP CONSTRAINT IF EXISTS fk_transport_op_country;
ALTER TABLE dbo.transport_operator DROP COLUMN IF EXISTS country_code;
GO
ALTER TABLE dbo.transport_operator ADD CONSTRAINT fk_transport_op_country FOREIGN KEY (country_id) REFERENCES dbo.country(country_id);
GO

-- vessel.flag_country -> flag_country_id
ALTER TABLE dbo.vessel ADD flag_country_id INT NULL;
GO
UPDATE t SET t.flag_country_id = c.country_id FROM dbo.vessel t JOIN dbo.country c ON c.country_code = t.flag_country;
GO
ALTER TABLE dbo.vessel DROP CONSTRAINT IF EXISTS fk_vessel_flag_country;
ALTER TABLE dbo.vessel DROP COLUMN IF EXISTS flag_country;
GO
ALTER TABLE dbo.vessel ALTER COLUMN flag_country_id INT NOT NULL;
GO
ALTER TABLE dbo.vessel ADD CONSTRAINT fk_vessel_flag_country FOREIGN KEY (flag_country_id) REFERENCES dbo.country(country_id);
GO

-- vessel.build_country -> build_country_id
ALTER TABLE dbo.vessel ADD build_country_id INT NULL;
GO
UPDATE t SET t.build_country_id = c.country_id FROM dbo.vessel t JOIN dbo.country c ON c.country_code = t.build_country;
GO
ALTER TABLE dbo.vessel DROP CONSTRAINT IF EXISTS fk_vessel_build_country;
ALTER TABLE dbo.vessel DROP COLUMN IF EXISTS build_country;
GO
ALTER TABLE dbo.vessel ADD CONSTRAINT fk_vessel_build_country FOREIGN KEY (build_country_id) REFERENCES dbo.country(country_id);
GO

-- truck.country_code -> country_id
ALTER TABLE dbo.truck ADD country_id INT NULL;
GO
UPDATE t SET t.country_id = c.country_id FROM dbo.truck t JOIN dbo.country c ON c.country_code = t.country_code;
GO
ALTER TABLE dbo.truck DROP CONSTRAINT IF EXISTS fk_truck_country;
ALTER TABLE dbo.truck DROP COLUMN IF EXISTS country_code;
GO
ALTER TABLE dbo.truck ALTER COLUMN country_id INT NOT NULL;
GO
ALTER TABLE dbo.truck ADD CONSTRAINT fk_truck_country FOREIGN KEY (country_id) REFERENCES dbo.country(country_id);
GO

-- railcar.country_code -> country_id
ALTER TABLE dbo.railcar ADD country_id INT NULL;
GO
UPDATE t SET t.country_id = c.country_id FROM dbo.railcar t JOIN dbo.country c ON c.country_code = t.country_code;
GO
ALTER TABLE dbo.railcar DROP CONSTRAINT IF EXISTS fk_railcar_country;
ALTER TABLE dbo.railcar DROP COLUMN IF EXISTS country_code;
GO
ALTER TABLE dbo.railcar ALTER COLUMN country_id INT NOT NULL;
GO
ALTER TABLE dbo.railcar ADD CONSTRAINT fk_railcar_country FOREIGN KEY (country_id) REFERENCES dbo.country(country_id);
GO

-- balancing_authority.country_code -> country_id
ALTER TABLE dbo.balancing_authority ADD country_id INT NULL;
GO
UPDATE t SET t.country_id = c.country_id FROM dbo.balancing_authority t JOIN dbo.country c ON c.country_code = t.country_code;
GO
ALTER TABLE dbo.balancing_authority DROP CONSTRAINT IF EXISTS fk_ba_country;
ALTER TABLE dbo.balancing_authority DROP COLUMN IF EXISTS country_code;
GO
ALTER TABLE dbo.balancing_authority ALTER COLUMN country_id INT NOT NULL;
GO
ALTER TABLE dbo.balancing_authority ADD CONSTRAINT fk_ba_country FOREIGN KEY (country_id) REFERENCES dbo.country(country_id);
GO

-- broker.country_code -> country_id
ALTER TABLE dbo.broker ADD country_id INT NULL;
GO
UPDATE t SET t.country_id = c.country_id FROM dbo.broker t JOIN dbo.country c ON c.country_code = t.country_code;
GO
ALTER TABLE dbo.broker DROP CONSTRAINT IF EXISTS fk_broker_country;
ALTER TABLE dbo.broker DROP COLUMN IF EXISTS country_code;
GO
ALTER TABLE dbo.broker ADD CONSTRAINT fk_broker_country FOREIGN KEY (country_id) REFERENCES dbo.country(country_id);
GO

-- metal_brand.country_of_origin -> country_of_origin_id
ALTER TABLE dbo.metal_brand ADD country_of_origin_id INT NULL;
GO
UPDATE t SET t.country_of_origin_id = c.country_id FROM dbo.metal_brand t JOIN dbo.country c ON c.country_code = t.country_of_origin;
GO
ALTER TABLE dbo.metal_brand DROP CONSTRAINT IF EXISTS fk_metal_brand_country;
ALTER TABLE dbo.metal_brand DROP COLUMN IF EXISTS country_of_origin;
GO
ALTER TABLE dbo.metal_brand ADD CONSTRAINT fk_metal_brand_country FOREIGN KEY (country_of_origin_id) REFERENCES dbo.country(country_id);
GO

-- credit_limit.cp_country_code -> cp_country_id
ALTER TABLE dbo.credit_limit ADD cp_country_id INT NULL;
GO
UPDATE t SET t.cp_country_id = c.country_id FROM dbo.credit_limit t JOIN dbo.country c ON c.country_code = t.cp_country_code;
GO
ALTER TABLE dbo.credit_limit DROP CONSTRAINT IF EXISTS fk_cl_cp_country;
ALTER TABLE dbo.credit_limit DROP COLUMN IF EXISTS cp_country_code;
GO
ALTER TABLE dbo.credit_limit ADD CONSTRAINT fk_cl_cp_country FOREIGN KEY (cp_country_id) REFERENCES dbo.country(country_id);
GO

-- trade_order.origin_country_code -> origin_country_id
ALTER TABLE dbo.trade_order ADD origin_country_id INT NULL;
GO
UPDATE t SET t.origin_country_id = c.country_id FROM dbo.trade_order t JOIN dbo.country c ON c.country_code = t.origin_country_code;
GO
ALTER TABLE dbo.trade_order DROP CONSTRAINT IF EXISTS fk_to_origin_country;
ALTER TABLE dbo.trade_order DROP COLUMN IF EXISTS origin_country_code;
GO
ALTER TABLE dbo.trade_order ADD CONSTRAINT fk_to_origin_country FOREIGN KEY (origin_country_id) REFERENCES dbo.country(country_id);
GO

-- trade_storage_agreement_detail.storage_country_code -> storage_country_id
ALTER TABLE dbo.trade_storage_agreement_detail ADD storage_country_id INT NULL;
GO
UPDATE t SET t.storage_country_id = c.country_id FROM dbo.trade_storage_agreement_detail t JOIN dbo.country c ON c.country_code = t.storage_country_code;
GO
ALTER TABLE dbo.trade_storage_agreement_detail DROP CONSTRAINT IF EXISTS fk_storage_agr_country;
ALTER TABLE dbo.trade_storage_agreement_detail DROP COLUMN IF EXISTS storage_country_code;
GO
ALTER TABLE dbo.trade_storage_agreement_detail ADD CONSTRAINT fk_storage_agr_country FOREIGN KEY (storage_country_id) REFERENCES dbo.country(country_id);
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- COUNTRY FAMILY -- genuine gaps, no prior FK existed (add fresh)
-- ─────────────────────────────────────────────────────────────────────────────

-- insurance_provider.country_code -> country_id (fresh -- was never FK'd)
ALTER TABLE dbo.insurance_provider ADD country_id INT NULL;
GO
UPDATE t SET t.country_id = c.country_id FROM dbo.insurance_provider t JOIN dbo.country c ON c.country_code = t.country_code;
GO
ALTER TABLE dbo.insurance_provider DROP COLUMN IF EXISTS country_code;
GO
ALTER TABLE dbo.insurance_provider ADD CONSTRAINT fk_insurance_provider_country_id FOREIGN KEY (country_id) REFERENCES dbo.country(country_id);
GO

-- regulatory_report_type.jurisdiction -> jurisdiction_id (fresh -- was never FK'd)
ALTER TABLE dbo.regulatory_report_type ADD jurisdiction_id INT NULL;
GO
UPDATE t SET t.jurisdiction_id = c.country_id FROM dbo.regulatory_report_type t JOIN dbo.country c ON c.country_code = t.jurisdiction;
GO
ALTER TABLE dbo.regulatory_report_type DROP COLUMN IF EXISTS jurisdiction;
GO
ALTER TABLE dbo.regulatory_report_type ADD CONSTRAINT fk_regulatory_report_type_jurisdiction_id FOREIGN KEY (jurisdiction_id) REFERENCES dbo.country(country_id);
GO

-- trade_repository.jurisdiction -> jurisdiction_id (fresh -- was never FK'd)
ALTER TABLE dbo.trade_repository ADD jurisdiction_id INT NULL;
GO
UPDATE t SET t.jurisdiction_id = c.country_id FROM dbo.trade_repository t JOIN dbo.country c ON c.country_code = t.jurisdiction;
GO
ALTER TABLE dbo.trade_repository DROP COLUMN IF EXISTS jurisdiction;
GO
ALTER TABLE dbo.trade_repository ADD CONSTRAINT fk_trade_repository_jurisdiction_id FOREIGN KEY (jurisdiction_id) REFERENCES dbo.country(country_id);
GO

PRINT 'V95 APPLIED: currency_code/country_code/jurisdiction converted to surrogate currency_id/country_id FKs -- 32 currency columns, 21 converted + 3 fresh country columns.';
