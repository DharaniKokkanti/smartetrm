-- =============================================================================
-- V87 — Currency & country reference integrity sweep
-- =============================================================================
-- Follow-up to V86 (Legal Entity only). User asked to extend the same fix to
-- every other currency/country column found during that review's audit.
--
-- Two independent groups of changes:
--   1. ~28 currency-code columns (CHAR(3)/VARCHAR(3)/VARCHAR(5)/NCHAR(3)) that
--      store an ISO 4217 code directly (not a currency_id surrogate) get a
--      real FK -> dbo.currency(currency_code), matching the pattern already
--      used by legal_entity.base_currency since V1.
--   2. ~18 country-code columns (CHAR(2)) get a real FK -> dbo.country
--      (country_code), now that V86 created that table.
--
-- Before adding each FK, every table's existing seed data (INSERTs/UPDATEs
-- across all prior migrations) was checked for values that would violate the
-- new constraint. Three country codes turn up that aren't in V86's 18-row
-- seed: 'CL' (Chile — dbo.metal_brand's Codelco brand and dbo.trade_order's
-- LME copper demo order's origin_country_code), 'PL' (Poland —
-- dbo.metal_brand's KGHM brand), and 'NG' (Nigeria — not in any seed row,
-- but named as a live example in TradeBlotter.tsx's originCountryCode hint
-- text ("GB / SA / NG / RU") — adding it so that pre-existing hint doesn't
-- silently start lying once the field becomes a real country picker). All
-- three added to dbo.country below, before any FK is added.
--
-- Most of the tables below currently have zero seed rows in SQL (the app's
-- demo data mostly lives only in the frontend MSW mock) — those FKs are pure
-- forward-guards with no backfill risk at all.
--
-- Deliberately EXCLUDED: dbo.emission_scheme.jurisdiction is NVARCHAR(200)
-- free text (e.g. 'European Union', 'California'), not a CHAR(2) ISO code —
-- emission trading schemes routinely span multiple countries or are
-- sub-national, so this is correctly modelled as free text already, not a
-- gap. Do not FK this one or force it into a country picker.
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- 0. Extend dbo.country with the 2 codes real seed data already uses that
--    weren't in V86's original 18-row list.
-- =============================================================================
INSERT INTO dbo.country (country_code, country_name, region, phone_code, fatf_status, sanction_status, is_active)
VALUES
    ('CL', 'Chile',   'AMERICAS', '+56',  'COMPLIANT', 'CLEAR', 1),
    ('PL', 'Poland',  'EUROPE',   '+48',  'COMPLIANT', 'CLEAR', 1),
    ('NG', 'Nigeria', 'AFRICA',   '+234', 'COMPLIANT', 'CLEAR', 1);
GO

-- =============================================================================
-- 1. Currency-code columns -> dbo.currency(currency_code)
-- =============================================================================
ALTER TABLE dbo.trader                            ADD CONSTRAINT fk_trader_limit_ccy      FOREIGN KEY (limit_currency)              REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.book                              ADD CONSTRAINT fk_book_base_ccy          FOREIGN KEY (base_currency)               REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.counterparty                      ADD CONSTRAINT fk_cp_credit_limit_ccy    FOREIGN KEY (credit_limit_currency)       REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.cp_legal_entity_link              ADD CONSTRAINT fk_cplink_limit_ccy       FOREIGN KEY (limit_currency)              REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.credit_term                       ADD CONSTRAINT fk_credit_term_margin_ccy FOREIGN KEY (margin_call_currency)        REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.trade                             ADD CONSTRAINT fk_trade_broker_fee_ccy   FOREIGN KEY (broker_fee_currency_code)    REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.broker_fee_agreement              ADD CONSTRAINT fk_bfa_fee_ccy            FOREIGN KEY (fee_currency_code)           REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.margin_agreement                  ADD CONSTRAINT fk_ma_threshold_ccy       FOREIGN KEY (threshold_currency)          REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.margin_agreement                  ADD CONSTRAINT fk_ma_cp_threshold_ccy    FOREIGN KEY (cp_threshold_currency)       REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.margin_agreement                  ADD CONSTRAINT fk_ma_mta_ccy             FOREIGN KEY (mta_currency)                REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.margin_agreement                  ADD CONSTRAINT fk_ma_indep_amt_ccy       FOREIGN KEY (independent_amount_currency) REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.credit_limit                      ADD CONSTRAINT fk_cl_limit_ccy           FOREIGN KEY (limit_currency)              REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.letter_of_credit                  ADD CONSTRAINT fk_lc_lc_ccy              FOREIGN KEY (lc_currency)                 REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.trade_order                       ADD CONSTRAINT fk_to_currency_code       FOREIGN KEY (currency_code)               REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.trade_item                        ADD CONSTRAINT fk_ti_currency_code       FOREIGN KEY (currency_code)               REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.settlement_price                  ADD CONSTRAINT fk_sp_tick_ccy            FOREIGN KEY (tick_currency)               REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.bolmo_agreement                   ADD CONSTRAINT fk_bolmo_currency_code    FOREIGN KEY (currency_code)               REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.balmo_product                     ADD CONSTRAINT fk_balmo_tick_ccy         FOREIGN KEY (tick_currency)               REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.trader_commodity_limit            ADD CONSTRAINT fk_tcl_limit_ccy          FOREIGN KEY (limit_currency)              REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.trade_swap_detail                 ADD CONSTRAINT fk_swap_fixed_ccy         FOREIGN KEY (fixed_currency_code)         REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.trade_option_detail               ADD CONSTRAINT fk_option_strike_ccy      FOREIGN KEY (strike_currency_code)        REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.trade_option_detail               ADD CONSTRAINT fk_option_premium_ccy     FOREIGN KEY (premium_currency_code)       REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.trade_storage_agreement_detail    ADD CONSTRAINT fk_storage_agr_tariff_ccy FOREIGN KEY (tariff_currency_code)        REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.trade_transport_agreement_detail  ADD CONSTRAINT fk_transport_agr_freight_ccy FOREIGN KEY (freight_currency_code)    REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.trade_order                       ADD CONSTRAINT fk_to_demurrage_ccy       FOREIGN KEY (demurrage_currency)          REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.trade_order_price_adjustment      ADD CONSTRAINT fk_topa_adjustment_ccy    FOREIGN KEY (adjustment_currency)         REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.gl_account                        ADD CONSTRAINT fk_gl_account_ccy         FOREIGN KEY (currency_code)               REFERENCES dbo.currency(currency_code);
ALTER TABLE dbo.commodity_grade_standard          ADD CONSTRAINT fk_cgs_adjustment_ccy     FOREIGN KEY (adjustment_currency_code)    REFERENCES dbo.currency(currency_code);
GO

-- =============================================================================
-- 2. Country-code columns -> dbo.country(country_code)
-- =============================================================================
ALTER TABLE dbo.holiday_calendar                  ADD CONSTRAINT fk_hc_country             FOREIGN KEY (country_code)         REFERENCES dbo.country(country_code);
ALTER TABLE dbo.address                           ADD CONSTRAINT fk_address_country        FOREIGN KEY (country_code)         REFERENCES dbo.country(country_code);
ALTER TABLE dbo.location                          ADD CONSTRAINT fk_location_country       FOREIGN KEY (country_code)         REFERENCES dbo.country(country_code);
-- dbo.pipeline has no singular country_code column on the live table —
-- 04_product_spec_mot_pipeline.sql drops and recreates dbo.pipeline with
-- only a CSV country_codes VARCHAR(100) column (multi-value, cross-border
-- pipelines). This ALTER would fail with "invalid column name" on any real
-- sequential run; guarded here (found and fixed during V95, same discipline
-- as V30/V91's precedent of fixing a historical migration file's body when
-- its bug is discovered, rather than leaving broken SQL live) so a fresh
-- run no-ops instead of erroring. dbo.pipeline is excluded from V95's
-- surrogate-key conversion entirely — there is no single-value column to
-- convert.
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pipeline') AND name = 'country_code')
  ALTER TABLE dbo.pipeline                        ADD CONSTRAINT fk_pipeline_country       FOREIGN KEY (country_code)         REFERENCES dbo.country(country_code);
ALTER TABLE dbo.exchange                          ADD CONSTRAINT fk_exchange_country       FOREIGN KEY (country_code)         REFERENCES dbo.country(country_code);
ALTER TABLE dbo.market                            ADD CONSTRAINT fk_market_country         FOREIGN KEY (country_code)         REFERENCES dbo.country(country_code);
ALTER TABLE dbo.transport_operator                ADD CONSTRAINT fk_transport_op_country   FOREIGN KEY (country_code)         REFERENCES dbo.country(country_code);
ALTER TABLE dbo.vessel                            ADD CONSTRAINT fk_vessel_flag_country    FOREIGN KEY (flag_country)         REFERENCES dbo.country(country_code);
ALTER TABLE dbo.vessel                            ADD CONSTRAINT fk_vessel_build_country   FOREIGN KEY (build_country)        REFERENCES dbo.country(country_code);
ALTER TABLE dbo.truck                             ADD CONSTRAINT fk_truck_country          FOREIGN KEY (country_code)         REFERENCES dbo.country(country_code);
ALTER TABLE dbo.railcar                           ADD CONSTRAINT fk_railcar_country        FOREIGN KEY (country_code)         REFERENCES dbo.country(country_code);
ALTER TABLE dbo.balancing_authority               ADD CONSTRAINT fk_ba_country             FOREIGN KEY (country_code)         REFERENCES dbo.country(country_code);
ALTER TABLE dbo.metal_brand                       ADD CONSTRAINT fk_metal_brand_country    FOREIGN KEY (country_of_origin)    REFERENCES dbo.country(country_code);
ALTER TABLE dbo.broker                            ADD CONSTRAINT fk_broker_country         FOREIGN KEY (country_code)         REFERENCES dbo.country(country_code);
ALTER TABLE dbo.credit_limit                      ADD CONSTRAINT fk_cl_cp_country          FOREIGN KEY (cp_country_code)      REFERENCES dbo.country(country_code);
ALTER TABLE dbo.trade_order                       ADD CONSTRAINT fk_to_origin_country      FOREIGN KEY (origin_country_code)  REFERENCES dbo.country(country_code);
ALTER TABLE dbo.trade_storage_agreement_detail    ADD CONSTRAINT fk_storage_agr_country    FOREIGN KEY (storage_country_code) REFERENCES dbo.country(country_code);
ALTER TABLE dbo.counterparty                      ADD CONSTRAINT fk_cp_jurisdiction        FOREIGN KEY (jurisdiction)         REFERENCES dbo.country(country_code);
ALTER TABLE dbo.tax_registration                  ADD CONSTRAINT fk_taxreg_jurisdiction    FOREIGN KEY (jurisdiction)         REFERENCES dbo.country(country_code);
ALTER TABLE dbo.gtc                               ADD CONSTRAINT fk_gtc_jurisdiction       FOREIGN KEY (jurisdiction)         REFERENCES dbo.country(country_code);
GO

PRINT '============================================================';
PRINT 'V87 APPLIED';
PRINT '  dbo.country + 3 rows (CL, PL, NG).';
PRINT '  28 currency-code columns now FK -> dbo.currency(currency_code).';
PRINT '  20 country-code columns now FK -> dbo.country(country_code).';
PRINT '============================================================';
GO
