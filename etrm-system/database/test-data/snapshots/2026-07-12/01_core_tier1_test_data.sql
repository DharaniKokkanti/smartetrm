-- =============================================================================
-- SmartETRM — Core Tier 1 Test/Sample Data (hand-authored, not extracted)
-- =============================================================================
-- GENERATED once, hand-authored realistic sample data — NOT extracted from a
-- live database like the files in database/consolidated/. As of 2026-07-12,
-- the 68 "entity" master data tables (legal_entity, counterparty, trader,
-- book, vessel, pipeline, location, etc.) have ZERO rows anywhere — nobody
-- has ever seeded realistic business data into them. This file exists so
-- the app has something to actually click through when pointed at a real
-- backend, instead of empty grids everywhere outside pure reference/lookup
-- data (currency, country, type codes — see ../../../consolidated/, which
-- IS real/live seed data).
--
-- SCOPE: 24 core Tier 1 tables — the ones most screens/forms actually need
-- to be usable. Deliberately NOT all 68 empty entity tables (deferred: niche
-- commodity-specific ones like metal_warrant, lng_boil_off_rule, power_pnode,
-- rin_account, emission_scheme, agri_crop_year_lifecycle, and others).
--
--   legal_entity, app_user, desk, trader, book, counterparty, contact,
--   bank_account, tax_registration, gtc, gtc_version, netting_agreement,
--   cp_commercial_terms, cp_gtc_agreement, location, transport_operator,
--   vessel, vessel_certificate, pipeline, storage_facility, tank, truck,
--   market, price_index
--
-- One small dataset: a fictional trading group "Meridian Trading" (3 legal
-- entities: UK/US/Singapore) with a handful of counterparties, traders,
-- books, vessels, and locations that reference each other consistently
-- (same style/scale as the frontend's MSW mock data, so the two "look" the
-- same whether you're on mocks or the real backend).
--
-- PREREQUISITE: apply database/consolidated/snapshots/2026-07-12/ first
-- (00_master_data_schema.sql, then 01_master_data_seed.sql) — this file
-- only adds the "entity" rows on top of the already-seeded reference data
--
-- IDEMPOTENT: every INSERT is guarded by
-- `IF NOT EXISTS (SELECT 1 FROM dbo.<table> WHERE <pk> = <id>)`, keyed off
-- the explicit id being inserted. Safe to re-run this file against a
-- database that already has some or all of these rows — it will only
-- insert what's missing, never error or duplicate. The one UPDATE
-- (desk.head_trader_id backfill) is naturally idempotent (re-setting the
-- same value is harmless) and needs no guard. If you hand-edit this file
-- to add more rows, keep the same pattern.

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- ============================================================
-- 1. legal_entity
-- ============================================================
SET IDENTITY_INSERT dbo.legal_entity ON;
IF NOT EXISTS (SELECT 1 FROM dbo.legal_entity WHERE legal_entity_id = 1)
INSERT INTO dbo.legal_entity (legal_entity_id, entity_code, entity_name, short_name, lei_code, parent_entity_id, incorporation_number, default_timezone, regulator, regulatory_licence, is_internal, is_active, go_live_date, notes, created_at, created_by, updated_at, updated_by, entity_type, parent_ind, base_currency_id, jurisdiction_id, incorporation_country_id) VALUES (1, 'MTUK', 'Meridian Trading UK Ltd', 'Meridian UK', '213800ABC1234567890X', NULL, '04851234', 'Europe/London', 'FCA', 'FRN123456', 1, 1, '2020-01-01', 'Primary UK trading entity, holding company for the group.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 1, 0, 3, 1, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.legal_entity WHERE legal_entity_id = 2)
INSERT INTO dbo.legal_entity (legal_entity_id, entity_code, entity_name, short_name, lei_code, parent_entity_id, incorporation_number, default_timezone, regulator, regulatory_licence, is_internal, is_active, go_live_date, notes, created_at, created_by, updated_at, updated_by, entity_type, parent_ind, base_currency_id, jurisdiction_id, incorporation_country_id) VALUES (2, 'MTUS', 'Meridian Trading US LLC', 'Meridian US', '549300XYZ9876543210A', 1, 'DE-4521789', 'America/New_York', 'CFTC', 'NFA0123456', 1, 1, '2020-06-01', 'US subsidiary, registered swap dealer.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 2, 1, 1, 2, 2);
IF NOT EXISTS (SELECT 1 FROM dbo.legal_entity WHERE legal_entity_id = 3)
INSERT INTO dbo.legal_entity (legal_entity_id, entity_code, entity_name, short_name, lei_code, parent_entity_id, incorporation_number, default_timezone, regulator, regulatory_licence, is_internal, is_active, go_live_date, notes, created_at, created_by, updated_at, updated_by, entity_type, parent_ind, base_currency_id, jurisdiction_id, incorporation_country_id) VALUES (3, 'MTSG', 'Meridian Singapore Pte Ltd', 'Meridian SG', '549300SGP1122334455B', 1, '202012345K', 'Asia/Singapore', 'MAS', 'CMS100234', 1, 1, '2021-03-01', 'APAC hub, metals and freight desks.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 2, 1, 6, 8, 8);
SET IDENTITY_INSERT dbo.legal_entity OFF;
GO

-- ============================================================
-- 2. app_user
-- ============================================================
SET IDENTITY_INSERT dbo.app_user ON;
IF NOT EXISTS (SELECT 1 FROM dbo.app_user WHERE user_id = 1)
INSERT INTO dbo.app_user (user_id, legal_entity_id, username, email, password_hash, full_name, display_name, department, default_timezone, mfa_enabled, is_active, created_at, created_by, updated_at, updated_by) VALUES (1, 1, 'j.smith', 'j.smith@meridiantrading.example', '$2a$10$placeholderhashvalue0000000000000000000000000000', 'John Smith', 'John Smith', 'Crude Oil Trading', 'Europe/London', 0, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM');
IF NOT EXISTS (SELECT 1 FROM dbo.app_user WHERE user_id = 2)
INSERT INTO dbo.app_user (user_id, legal_entity_id, username, email, password_hash, full_name, display_name, department, default_timezone, mfa_enabled, is_active, created_at, created_by, updated_at, updated_by) VALUES (2, 3, 'a.chen', 'a.chen@meridiantrading.example', '$2a$10$placeholderhashvalue0000000000000000000000000000', 'Amy Chen', 'Amy Chen', 'Metals Trading', 'Asia/Singapore', 0, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM');
IF NOT EXISTS (SELECT 1 FROM dbo.app_user WHERE user_id = 3)
INSERT INTO dbo.app_user (user_id, legal_entity_id, username, email, password_hash, full_name, display_name, department, default_timezone, mfa_enabled, is_active, created_at, created_by, updated_at, updated_by) VALUES (3, 2, 'r.patel', 'r.patel@meridiantrading.example', '$2a$10$placeholderhashvalue0000000000000000000000000000', 'Raj Patel', 'Raj Patel', 'Power & Gas Trading', 'America/New_York', 0, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM');
IF NOT EXISTS (SELECT 1 FROM dbo.app_user WHERE user_id = 4)
INSERT INTO dbo.app_user (user_id, legal_entity_id, username, email, password_hash, full_name, display_name, department, default_timezone, mfa_enabled, is_active, created_at, created_by, updated_at, updated_by) VALUES (4, 1, 'm.jones', 'm.jones@meridiantrading.example', '$2a$10$placeholderhashvalue0000000000000000000000000000', 'Maria Jones', 'Maria Jones', 'Middle Office', 'Europe/London', 0, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM');
SET IDENTITY_INSERT dbo.app_user OFF;
GO

-- ============================================================
-- 3. desk (head_trader_id left NULL here, backfilled after trader exists)
-- ============================================================
SET IDENTITY_INSERT dbo.desk ON;
IF NOT EXISTS (SELECT 1 FROM dbo.desk WHERE desk_id = 1)
INSERT INTO dbo.desk (desk_id, legal_entity_id, desk_code, desk_name, head_trader_id, is_active, created_at, created_by, commodity_type) VALUES (1, 1, 'CRUDE', 'Crude Oil Desk', NULL, 1, SYSUTCDATETIME(), 'SYSTEM', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.desk WHERE desk_id = 2)
INSERT INTO dbo.desk (desk_id, legal_entity_id, desk_code, desk_name, head_trader_id, is_active, created_at, created_by, commodity_type) VALUES (2, 2, 'PWRGAS', 'Power & Gas Desk', NULL, 1, SYSUTCDATETIME(), 'SYSTEM', 2);
IF NOT EXISTS (SELECT 1 FROM dbo.desk WHERE desk_id = 3)
INSERT INTO dbo.desk (desk_id, legal_entity_id, desk_code, desk_name, head_trader_id, is_active, created_at, created_by, commodity_type) VALUES (3, 3, 'METALS', 'Metals Desk', NULL, 1, SYSUTCDATETIME(), 'SYSTEM', 6);
SET IDENTITY_INSERT dbo.desk OFF;
GO

-- ============================================================
-- 4. trader
-- ============================================================
SET IDENTITY_INSERT dbo.trader ON;
IF NOT EXISTS (SELECT 1 FROM dbo.trader WHERE trader_id = 1)
INSERT INTO dbo.trader (trader_id, user_id, legal_entity_id, desk_id, trader_code, commodity_types, daily_trade_limit, single_trade_limit, position_limit, is_active, go_live_date, created_at, created_by, updated_at, updated_by, limit_currency_id) VALUES (1, 1, 1, 1, 'JSMITH', 'OIL', 50000000.00, 10000000.00, 500000.0000, 1, '2020-01-15', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.trader WHERE trader_id = 2)
INSERT INTO dbo.trader (trader_id, user_id, legal_entity_id, desk_id, trader_code, commodity_types, daily_trade_limit, single_trade_limit, position_limit, is_active, go_live_date, created_at, created_by, updated_at, updated_by, limit_currency_id) VALUES (2, 3, 2, 2, 'RPATEL', 'GAS,POWER', 30000000.00, 8000000.00, 300000.0000, 1, '2020-07-01', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.trader WHERE trader_id = 3)
INSERT INTO dbo.trader (trader_id, user_id, legal_entity_id, desk_id, trader_code, commodity_types, daily_trade_limit, single_trade_limit, position_limit, is_active, go_live_date, created_at, created_by, updated_at, updated_by, limit_currency_id) VALUES (3, 2, 3, 3, 'ACHEN', 'METALS', 20000000.00, 5000000.00, 200000.0000, 1, '2021-04-01', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 1);
SET IDENTITY_INSERT dbo.trader OFF;
GO

-- ============================================================
-- 5. Backfill desk.head_trader_id now trader rows exist
-- ============================================================
UPDATE dbo.desk SET head_trader_id = 1 WHERE desk_id = 1;
UPDATE dbo.desk SET head_trader_id = 2 WHERE desk_id = 2;
UPDATE dbo.desk SET head_trader_id = 3 WHERE desk_id = 3;
GO

-- ============================================================
-- 6. book
-- ============================================================
SET IDENTITY_INSERT dbo.book ON;
IF NOT EXISTS (SELECT 1 FROM dbo.book WHERE book_id = 1)
INSERT INTO dbo.book (book_id, legal_entity_id, desk_id, responsible_trader_id, book_code, book_name, position_limit, pnl_limit, var_limit, is_active, go_live_date, description, created_at, created_by, updated_at, updated_by, book_type_id, book_type, commodity_type, base_currency_id) VALUES (1, 1, 1, 1, 'CRUDE-TRD', 'Crude Oil Trading Book', 500000.0000, 2000000.00, 1000000.00, 1, '2020-01-15', 'Flat/directional crude oil trading.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 1, 1, 1, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.book WHERE book_id = 2)
INSERT INTO dbo.book (book_id, legal_entity_id, desk_id, responsible_trader_id, book_code, book_name, position_limit, pnl_limit, var_limit, is_active, go_live_date, description, created_at, created_by, updated_at, updated_by, book_type_id, book_type, commodity_type, base_currency_id) VALUES (2, 1, 1, 1, 'CRUDE-HDG', 'Crude Oil Hedging Book', 1000000.0000, 500000.00, 500000.00, 1, '2020-01-15', 'Physical exposure hedging.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 2, 2, 1, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.book WHERE book_id = 3)
INSERT INTO dbo.book (book_id, legal_entity_id, desk_id, responsible_trader_id, book_code, book_name, position_limit, pnl_limit, var_limit, is_active, go_live_date, description, created_at, created_by, updated_at, updated_by, book_type_id, book_type, commodity_type, base_currency_id) VALUES (3, 2, 2, 2, 'GAS-TRD', 'Gas & Power Trading Book', 300000.0000, 1500000.00, 750000.00, 1, '2020-07-01', 'North American gas and power desk book.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 1, 1, 2, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.book WHERE book_id = 4)
INSERT INTO dbo.book (book_id, legal_entity_id, desk_id, responsible_trader_id, book_code, book_name, position_limit, pnl_limit, var_limit, is_active, go_live_date, description, created_at, created_by, updated_at, updated_by, book_type_id, book_type, commodity_type, base_currency_id) VALUES (4, 3, 3, 3, 'METALS-TRD', 'Metals Trading Book', 200000.0000, 1000000.00, 500000.00, 1, '2021-04-01', 'LME base metals trading.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 1, 1, 6, 1);
SET IDENTITY_INSERT dbo.book OFF;
GO

-- ============================================================
-- 7. counterparty
-- ============================================================
SET IDENTITY_INSERT dbo.counterparty ON;
IF NOT EXISTS (SELECT 1 FROM dbo.counterparty WHERE counterparty_id = 1)
INSERT INTO dbo.counterparty (counterparty_id, cp_code, legal_name, short_name, lei_code, credit_rating_id, credit_limit, credit_review_date, settlement_days, default_currency_id, is_intercompany, is_active, kyc_approved_date, kyc_expiry_date, onboarded_date, notes, created_at, created_by, updated_at, updated_by, cp_type, kyc_status, parent_ind, credit_limit_currency_id, jurisdiction_id) VALUES (1, 'SHELL', 'Shell Trading International Ltd', 'Shell Trading', '213800XYZ0001', 6, 50000000.00, '2026-12-31', 2, 1, 0, 1, '2019-03-01', '2027-03-01', '2019-02-15', 'Major integrated oil producer/refiner counterparty.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 1, 2, 0, 1, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.counterparty WHERE counterparty_id = 2)
INSERT INTO dbo.counterparty (counterparty_id, cp_code, legal_name, short_name, lei_code, credit_rating_id, credit_limit, credit_review_date, settlement_days, default_currency_id, is_intercompany, is_active, kyc_approved_date, kyc_expiry_date, onboarded_date, notes, created_at, created_by, updated_at, updated_by, cp_type, kyc_status, parent_ind, credit_limit_currency_id, jurisdiction_id) VALUES (2, 'VITOL', 'Vitol SA', 'Vitol', '549300XYZ0002', 8, 40000000.00, '2026-12-31', 2, 1, 0, 1, '2019-05-01', '2027-05-01', '2019-04-10', 'Independent energy trading house, Rotterdam office.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 3, 2, 0, 1, 3);
IF NOT EXISTS (SELECT 1 FROM dbo.counterparty WHERE counterparty_id = 3)
INSERT INTO dbo.counterparty (counterparty_id, cp_code, legal_name, short_name, lei_code, credit_rating_id, credit_limit, credit_review_date, settlement_days, default_currency_id, is_intercompany, is_active, kyc_approved_date, kyc_expiry_date, onboarded_date, notes, created_at, created_by, updated_at, updated_by, cp_type, kyc_status, parent_ind, credit_limit_currency_id, jurisdiction_id) VALUES (3, 'GLENCORE', 'Glencore International AG', 'Glencore', '529900XYZ0003', 9, 35000000.00, '2026-12-31', 2, 1, 0, 1, '2019-06-01', '2027-06-01', '2019-05-20', 'Diversified commodity trading and mining group.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 3, 2, 0, 1, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.counterparty WHERE counterparty_id = 4)
INSERT INTO dbo.counterparty (counterparty_id, cp_code, legal_name, short_name, lei_code, credit_rating_id, credit_limit, credit_review_date, settlement_days, default_currency_id, is_intercompany, is_active, kyc_approved_date, kyc_expiry_date, onboarded_date, notes, created_at, created_by, updated_at, updated_by, cp_type, kyc_status, parent_ind, credit_limit_currency_id, jurisdiction_id) VALUES (4, 'JPM', 'JPMorgan Chase Bank NA', 'JPMorgan', '7H6GLXDRUGQFU57RNE97', 1, 100000000.00, '2026-12-31', 1, 1, 0, 1, '2018-01-01', '2027-01-01', '2017-12-01', 'Clearing/settlement bank and derivatives counterparty.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 4, 2, 0, 1, 2);
IF NOT EXISTS (SELECT 1 FROM dbo.counterparty WHERE counterparty_id = 5)
INSERT INTO dbo.counterparty (counterparty_id, cp_code, legal_name, short_name, lei_code, credit_rating_id, credit_limit, credit_review_date, settlement_days, default_currency_id, is_intercompany, is_active, kyc_approved_date, kyc_expiry_date, onboarded_date, notes, created_at, created_by, updated_at, updated_by, cp_type, kyc_status, parent_ind, credit_limit_currency_id, jurisdiction_id) VALUES (5, 'RWEST', 'RWE Supply & Trading GmbH', 'RWE S&T', '391200XYZ0005', 10, 25000000.00, '2026-12-31', 2, 2, 0, 1, '2020-02-01', '2027-02-01', '2020-01-15', 'European gas and power utility trading arm.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 8, 2, 0, 2, 4);
IF NOT EXISTS (SELECT 1 FROM dbo.counterparty WHERE counterparty_id = 6)
INSERT INTO dbo.counterparty (counterparty_id, cp_code, legal_name, short_name, lei_code, credit_rating_id, credit_limit, credit_review_date, settlement_days, default_currency_id, is_intercompany, is_active, kyc_approved_date, kyc_expiry_date, onboarded_date, notes, created_at, created_by, updated_at, updated_by, cp_type, kyc_status, parent_ind, credit_limit_currency_id, jurisdiction_id) VALUES (6, 'MAREX', 'Marex Financial Ltd', 'Marex', '213800XYZ0006', 7, 20000000.00, '2026-12-31', 1, 1, 0, 1, '2021-01-01', '2027-01-01', '2020-11-15', 'Futures commission merchant, exchange clearing broker.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 10, 2, 0, 1, 1);
SET IDENTITY_INSERT dbo.counterparty OFF;
GO

-- ============================================================
-- 8. contact
-- ============================================================
SET IDENTITY_INSERT dbo.contact ON;
IF NOT EXISTS (SELECT 1 FROM dbo.contact WHERE contact_id = 1)
INSERT INTO dbo.contact (contact_id, entity_type, entity_id, first_name, last_name, job_title, email, phone_direct, phone_mobile, is_primary, is_active, created_at, created_by, updated_at, updated_by, contact_role) VALUES (1, 'COUNTERPARTY', 1, 'John', 'Harper', 'Senior Crude Trader', 'john.harper@shelltrading.example', '+44 20 7946 0011', '+44 7700 900001', 1, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.contact WHERE contact_id = 2)
INSERT INTO dbo.contact (contact_id, entity_type, entity_id, first_name, last_name, job_title, email, phone_direct, phone_mobile, is_primary, is_active, created_at, created_by, updated_at, updated_by, contact_role) VALUES (2, 'COUNTERPARTY', 1, 'Sarah', 'Lee', 'Credit Manager', 'sarah.lee@shelltrading.example', '+44 20 7946 0012', '+44 7700 900002', 0, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 9);
IF NOT EXISTS (SELECT 1 FROM dbo.contact WHERE contact_id = 3)
INSERT INTO dbo.contact (contact_id, entity_type, entity_id, first_name, last_name, job_title, email, phone_direct, phone_mobile, is_primary, is_active, created_at, created_by, updated_at, updated_by, contact_role) VALUES (3, 'COUNTERPARTY', 2, 'Marco', 'Rossi', 'Crude Oil Trader', 'marco.rossi@vitol.example', '+31 10 448 0011', '+31 6 1234 5678', 1, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.contact WHERE contact_id = 4)
INSERT INTO dbo.contact (contact_id, entity_type, entity_id, first_name, last_name, job_title, email, phone_direct, phone_mobile, is_primary, is_active, created_at, created_by, updated_at, updated_by, contact_role) VALUES (4, 'LEGAL_ENTITY', 1, 'Emma', 'Clarke', 'Middle Office Manager', 'emma.clarke@meridiantrading.example', '+44 20 7123 4501', '+44 7700 900010', 1, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 2);
IF NOT EXISTS (SELECT 1 FROM dbo.contact WHERE contact_id = 5)
INSERT INTO dbo.contact (contact_id, entity_type, entity_id, first_name, last_name, job_title, email, phone_direct, phone_mobile, is_primary, is_active, created_at, created_by, updated_at, updated_by, contact_role) VALUES (5, 'COUNTERPARTY', 4, 'David', 'Kim', 'Settlements Operations', 'david.kim@jpmorgan.example', '+1 212 270 0011', '+1 646 555 0110', 1, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 7);
SET IDENTITY_INSERT dbo.contact OFF;
GO

-- ============================================================
-- 9. bank_account
-- ============================================================
SET IDENTITY_INSERT dbo.bank_account ON;
IF NOT EXISTS (SELECT 1 FROM dbo.bank_account WHERE bank_account_id = 1)
INSERT INTO dbo.bank_account (bank_account_id, entity_type, entity_id, currency_id, is_primary, bank_name, bank_code, swift_bic, iban, account_number, account_name, is_active, created_at, created_by, updated_at, updated_by, account_type) VALUES (1, 'LEGAL_ENTITY', 1, 3, 1, 'Barclays Bank UK PLC', '204513', 'BARCGB22', 'GB29NWBK60161331926819', '31926819', 'Meridian Trading UK Ltd Settlement', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.bank_account WHERE bank_account_id = 2)
INSERT INTO dbo.bank_account (bank_account_id, entity_type, entity_id, currency_id, is_primary, bank_name, bank_code, swift_bic, iban, account_number, account_name, is_active, created_at, created_by, updated_at, updated_by, account_type) VALUES (2, 'LEGAL_ENTITY', 2, 1, 1, 'JPMorgan Chase Bank NA', '021000021', 'CHASUS33', NULL, '000123456789', 'Meridian Trading US LLC Settlement', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.bank_account WHERE bank_account_id = 3)
INSERT INTO dbo.bank_account (bank_account_id, entity_type, entity_id, currency_id, is_primary, bank_name, bank_code, swift_bic, iban, account_number, account_name, is_active, created_at, created_by, updated_at, updated_by, account_type) VALUES (3, 'COUNTERPARTY', 1, 1, 1, 'HSBC Bank plc', '400515', 'HBUKGB4B', 'GB94HBUK40051512345678', '12345678', 'Shell Trading International Ltd', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.bank_account WHERE bank_account_id = 4)
INSERT INTO dbo.bank_account (bank_account_id, entity_type, entity_id, currency_id, is_primary, bank_name, bank_code, swift_bic, iban, account_number, account_name, is_active, created_at, created_by, updated_at, updated_by, account_type) VALUES (4, 'LEGAL_ENTITY', 1, 3, 0, 'Barclays Bank UK PLC', '204513', 'BARCGB22', 'GB56BARC20449912345678', '12345678', 'Meridian Trading UK Ltd Margin', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 4);
SET IDENTITY_INSERT dbo.bank_account OFF;
GO

-- ============================================================
-- 10. tax_registration
-- ============================================================
SET IDENTITY_INSERT dbo.tax_registration ON;
IF NOT EXISTS (SELECT 1 FROM dbo.tax_registration WHERE tax_reg_id = 1)
INSERT INTO dbo.tax_registration (tax_reg_id, entity_type, entity_id, tax_id, issuing_authority, registration_date, is_primary, is_active, created_at, created_by, updated_at, updated_by, tax_type, jurisdiction_id) VALUES (1, 'LEGAL_ENTITY', 1, 'GB123456789', 'HMRC', '2020-01-01', 1, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 1, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.tax_registration WHERE tax_reg_id = 2)
INSERT INTO dbo.tax_registration (tax_reg_id, entity_type, entity_id, tax_id, issuing_authority, registration_date, is_primary, is_active, created_at, created_by, updated_at, updated_by, tax_type, jurisdiction_id) VALUES (2, 'LEGAL_ENTITY', 2, '12-3456789', 'IRS', '2020-06-01', 1, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 3, 2);
IF NOT EXISTS (SELECT 1 FROM dbo.tax_registration WHERE tax_reg_id = 3)
INSERT INTO dbo.tax_registration (tax_reg_id, entity_type, entity_id, tax_id, issuing_authority, registration_date, is_primary, is_active, created_at, created_by, updated_at, updated_by, tax_type, jurisdiction_id) VALUES (3, 'COUNTERPARTY', 1, 'GB987654321', 'HMRC', '2019-03-01', 1, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 1, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.tax_registration WHERE tax_reg_id = 4)
INSERT INTO dbo.tax_registration (tax_reg_id, entity_type, entity_id, tax_id, issuing_authority, registration_date, is_primary, is_active, created_at, created_by, updated_at, updated_by, tax_type, jurisdiction_id) VALUES (4, 'COUNTERPARTY', 4, '98-7654321', 'IRS', '2018-01-01', 1, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 3, 2);
SET IDENTITY_INSERT dbo.tax_registration OFF;
GO

-- ============================================================
-- 11. gtc
-- ============================================================
SET IDENTITY_INSERT dbo.gtc ON;
IF NOT EXISTS (SELECT 1 FROM dbo.gtc WHERE gtc_id = 1)
INSERT INTO dbo.gtc (gtc_id, gtc_code, gtc_name, commodity_type, governing_law, dispute_resolution, description, is_active, created_at, created_by, jurisdiction_id) VALUES (1, 'EFET-GAS-2007', 'EFET General Agreement (Gas) 2.1(a) 2007', 'GAS', 'English Law', 'LCIA Arbitration, London', 'Standard EFET gas master agreement.', 1, SYSUTCDATETIME(), 'SYSTEM', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.gtc WHERE gtc_id = 2)
INSERT INTO dbo.gtc (gtc_id, gtc_code, gtc_name, commodity_type, governing_law, dispute_resolution, description, is_active, created_at, created_by, jurisdiction_id) VALUES (2, 'ISDA-2002', 'ISDA 2002 Master Agreement', NULL, 'English Law', 'LCIA Arbitration, London', 'Standard ISDA master agreement for OTC derivatives.', 1, SYSUTCDATETIME(), 'SYSTEM', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.gtc WHERE gtc_id = 3)
INSERT INTO dbo.gtc (gtc_id, gtc_code, gtc_name, commodity_type, governing_law, dispute_resolution, description, is_active, created_at, created_by, jurisdiction_id) VALUES (3, 'GAFTA-100', 'GAFTA 100 FOB Terms for Grain in Bulk', 'AGRICULTURAL', 'English Law', 'GAFTA Arbitration, London', 'Standard grain trade contract terms.', 1, SYSUTCDATETIME(), 'SYSTEM', 1);
SET IDENTITY_INSERT dbo.gtc OFF;
GO

-- ============================================================
-- 12. gtc_version
-- ============================================================
SET IDENTITY_INSERT dbo.gtc_version ON;
IF NOT EXISTS (SELECT 1 FROM dbo.gtc_version WHERE gtc_version_id = 1)
INSERT INTO dbo.gtc_version (gtc_version_id, gtc_id, version_number, effective_date, summary_of_changes, is_current, created_at, created_by) VALUES (1, 1, '2.1(a)', '2020-01-01', 'Current published version.', 1, SYSUTCDATETIME(), 'SYSTEM');
IF NOT EXISTS (SELECT 1 FROM dbo.gtc_version WHERE gtc_version_id = 2)
INSERT INTO dbo.gtc_version (gtc_version_id, gtc_id, version_number, effective_date, summary_of_changes, is_current, created_at, created_by) VALUES (2, 2, '2002', '2020-01-01', 'Current published version.', 1, SYSUTCDATETIME(), 'SYSTEM');
IF NOT EXISTS (SELECT 1 FROM dbo.gtc_version WHERE gtc_version_id = 3)
INSERT INTO dbo.gtc_version (gtc_version_id, gtc_id, version_number, effective_date, summary_of_changes, is_current, created_at, created_by) VALUES (3, 3, '100', '2020-01-01', 'Current published version.', 1, SYSUTCDATETIME(), 'SYSTEM');
SET IDENTITY_INSERT dbo.gtc_version OFF;
GO

-- ============================================================
-- 13. netting_agreement
-- ============================================================
SET IDENTITY_INSERT dbo.netting_agreement ON;
IF NOT EXISTS (SELECT 1 FROM dbo.netting_agreement WHERE netting_id = 1)
INSERT INTO dbo.netting_agreement (netting_id, legal_entity_id, counterparty_id, agreement_ref, effective_date, is_active, notes, created_at, created_by, agreement_type) VALUES (1, 1, 2, 'NET-2024-001', '2024-01-01', 1, 'ISDA netting with Vitol.', SYSUTCDATETIME(), 'SYSTEM', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.netting_agreement WHERE netting_id = 2)
INSERT INTO dbo.netting_agreement (netting_id, legal_entity_id, counterparty_id, agreement_ref, effective_date, is_active, notes, created_at, created_by, agreement_type) VALUES (2, 1, 3, 'NET-2024-002', '2024-02-01', 1, 'EFET netting with Glencore, gas legs only.', SYSUTCDATETIME(), 'SYSTEM', 3);
IF NOT EXISTS (SELECT 1 FROM dbo.netting_agreement WHERE netting_id = 3)
INSERT INTO dbo.netting_agreement (netting_id, legal_entity_id, counterparty_id, agreement_ref, effective_date, is_active, notes, created_at, created_by, agreement_type) VALUES (3, 2, 4, 'NET-2024-003', '2024-03-01', 1, 'ISDA netting with JPMorgan.', SYSUTCDATETIME(), 'SYSTEM', 1);
SET IDENTITY_INSERT dbo.netting_agreement OFF;
GO

-- ============================================================
-- 14. cp_commercial_terms
-- ============================================================
SET IDENTITY_INSERT dbo.cp_commercial_terms ON;
IF NOT EXISTS (SELECT 1 FROM dbo.cp_commercial_terms WHERE cp_terms_id = 1)
INSERT INTO dbo.cp_commercial_terms (cp_terms_id, counterparty_id, legal_entity_id, payment_term_id, credit_term_id, default_currency_id, default_incoterm_id, commodity_type, effective_date, is_active, notes, created_at, created_by, updated_at, updated_by) VALUES (1, 1, 1, 1, 11, 1, 9, 'OIL', '2019-03-01', 1, 'Standard crude terms.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM');
IF NOT EXISTS (SELECT 1 FROM dbo.cp_commercial_terms WHERE cp_terms_id = 2)
INSERT INTO dbo.cp_commercial_terms (cp_terms_id, counterparty_id, legal_entity_id, payment_term_id, credit_term_id, default_currency_id, default_incoterm_id, commodity_type, effective_date, is_active, notes, created_at, created_by, updated_at, updated_by) VALUES (2, 2, 1, 2, 12, 1, 11, 'OIL', '2019-05-01', 1, 'CIF cargo terms.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM');
IF NOT EXISTS (SELECT 1 FROM dbo.cp_commercial_terms WHERE cp_terms_id = 3)
INSERT INTO dbo.cp_commercial_terms (cp_terms_id, counterparty_id, legal_entity_id, payment_term_id, credit_term_id, default_currency_id, default_incoterm_id, commodity_type, effective_date, is_active, notes, created_at, created_by, updated_at, updated_by) VALUES (3, 4, 2, 1, 11, 1, NULL, NULL, '2018-01-01', 1, 'Financial/derivatives settlement only.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM');
SET IDENTITY_INSERT dbo.cp_commercial_terms OFF;
GO

-- ============================================================
-- 15. cp_gtc_agreement
-- ============================================================
SET IDENTITY_INSERT dbo.cp_gtc_agreement ON;
IF NOT EXISTS (SELECT 1 FROM dbo.cp_gtc_agreement WHERE cp_gtc_id = 1)
INSERT INTO dbo.cp_gtc_agreement (cp_gtc_id, counterparty_id, legal_entity_id, gtc_version_id, signed_date, effective_date, is_active, notes, created_at, created_by) VALUES (1, 2, 1, 1, '2023-06-01', '2023-06-01', 1, 'EFET gas GTC signed with Vitol.', SYSUTCDATETIME(), 'SYSTEM');
IF NOT EXISTS (SELECT 1 FROM dbo.cp_gtc_agreement WHERE cp_gtc_id = 2)
INSERT INTO dbo.cp_gtc_agreement (cp_gtc_id, counterparty_id, legal_entity_id, gtc_version_id, signed_date, effective_date, is_active, notes, created_at, created_by) VALUES (2, 3, 1, 1, '2023-07-01', '2023-07-01', 1, 'EFET gas GTC signed with Glencore.', SYSUTCDATETIME(), 'SYSTEM');
IF NOT EXISTS (SELECT 1 FROM dbo.cp_gtc_agreement WHERE cp_gtc_id = 3)
INSERT INTO dbo.cp_gtc_agreement (cp_gtc_id, counterparty_id, legal_entity_id, gtc_version_id, signed_date, effective_date, is_active, notes, created_at, created_by) VALUES (3, 4, 2, 2, '2022-01-01', '2022-01-01', 1, 'ISDA signed with JPMorgan.', SYSUTCDATETIME(), 'SYSTEM');
SET IDENTITY_INSERT dbo.cp_gtc_agreement OFF;
GO

-- ============================================================
-- 16. location
-- ============================================================
SET IDENTITY_INSERT dbo.location ON;
IF NOT EXISTS (SELECT 1 FROM dbo.location WHERE location_id = 1)
INSERT INTO dbo.location (location_id, location_type_id, location_code, location_name, commodity_type, region, timezone, operator, is_active, notes, created_at, created_by, country_id) VALUES (1, 1, 'SULLOM-VOE', 'Sullom Voe Terminal', 'OIL', 'Shetland Islands', 'Europe/London', 'EnQuest', 1, 'North Sea Brent/Forties export terminal.', SYSUTCDATETIME(), 'SYSTEM', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.location WHERE location_id = 2)
INSERT INTO dbo.location (location_id, location_type_id, location_code, location_name, commodity_type, region, timezone, operator, is_active, notes, created_at, created_by, country_id) VALUES (2, 1, 'ROTTERDAM', 'Port of Rotterdam / ARA', 'OIL', 'ARA', 'Europe/Amsterdam', 'Port of Rotterdam Authority', 1, 'Major ARA refined products/crude hub.', SYSUTCDATETIME(), 'SYSTEM', 3);
IF NOT EXISTS (SELECT 1 FROM dbo.location WHERE location_id = 3)
INSERT INTO dbo.location (location_id, location_type_id, location_code, location_name, commodity_type, region, timezone, operator, is_active, notes, created_at, created_by, country_id) VALUES (3, 2, 'CUSHING-OK', 'Cushing Oklahoma', 'OIL', 'Midwest USA', 'America/Chicago', NULL, 1, 'WTI pricing and storage hub, NYMEX delivery point.', SYSUTCDATETIME(), 'SYSTEM', 2);
IF NOT EXISTS (SELECT 1 FROM dbo.location WHERE location_id = 4)
INSERT INTO dbo.location (location_id, location_type_id, location_code, location_name, commodity_type, region, timezone, operator, is_active, notes, created_at, created_by, country_id) VALUES (4, 3, 'HENRY-HUB', 'Henry Hub', 'GAS', 'Louisiana', 'America/Chicago', 'Sabine Pipe Line LLC', 1, 'NYMEX natural gas futures delivery point.', SYSUTCDATETIME(), 'SYSTEM', 2);
IF NOT EXISTS (SELECT 1 FROM dbo.location WHERE location_id = 5)
INSERT INTO dbo.location (location_id, location_type_id, location_code, location_name, commodity_type, region, timezone, operator, is_active, notes, created_at, created_by, country_id) VALUES (5, 1, 'RAS-TANURA', 'Ras Tanura', 'OIL', 'Eastern Province', 'Asia/Riyadh', 'Saudi Aramco', 1, 'Largest crude oil export terminal in the world.', SYSUTCDATETIME(), 'SYSTEM', 6);
IF NOT EXISTS (SELECT 1 FROM dbo.location WHERE location_id = 6)
INSERT INTO dbo.location (location_id, location_type_id, location_code, location_name, commodity_type, region, timezone, operator, is_active, notes, created_at, created_by, country_id) VALUES (6, 3, 'TTF-NL', 'Title Transfer Facility', 'GAS', 'Netherlands', 'Europe/Amsterdam', 'Gasunie Transport Services', 1, 'Virtual European gas trading hub.', SYSUTCDATETIME(), 'SYSTEM', 3);
SET IDENTITY_INSERT dbo.location OFF;
GO

-- ============================================================
-- 17. transport_operator
-- ============================================================
SET IDENTITY_INSERT dbo.transport_operator ON;
IF NOT EXISTS (SELECT 1 FROM dbo.transport_operator WHERE operator_id = 1)
INSERT INTO dbo.transport_operator (operator_id, operator_code, operator_name, mot_type_id, is_active, notes, created_at, created_by, updated_at, updated_by, operator_type, country_id) VALUES (1, 'MAERSK-TNK', 'Maersk Tankers A/S', 1, 1, 'Tanker owner/operator.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 131, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.transport_operator WHERE operator_id = 2)
INSERT INTO dbo.transport_operator (operator_id, operator_code, operator_name, mot_type_id, is_active, notes, created_at, created_by, updated_at, updated_by, operator_type, country_id) VALUES (2, 'TEEKAY', 'Teekay Shipping Ltd', 1, 1, 'Tanker technical/crew manager.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 132, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.transport_operator WHERE operator_id = 3)
INSERT INTO dbo.transport_operator (operator_id, operator_code, operator_name, mot_type_id, is_active, notes, created_at, created_by, updated_at, updated_by, operator_type, country_id) VALUES (3, 'XPO-LOG', 'XPO Logistics UK', 4, 1, 'Road haulage operator.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 133, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.transport_operator WHERE operator_id = 4)
INSERT INTO dbo.transport_operator (operator_id, operator_code, operator_name, mot_type_id, is_active, notes, created_at, created_by, updated_at, updated_by, operator_type, country_id) VALUES (4, 'COLONIAL-PL', 'Colonial Pipeline Company', 3, 1, 'US refined products pipeline TSO.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 135, 2);
SET IDENTITY_INSERT dbo.transport_operator OFF;
GO

-- ============================================================
-- 18. vessel
-- ============================================================
SET IDENTITY_INSERT dbo.vessel ON;
IF NOT EXISTS (SELECT 1 FROM dbo.vessel WHERE vessel_id = 1)
INSERT INTO dbo.vessel (vessel_id, imo_number, vessel_name, vessel_type, call_sign, mmsi, owner_operator_id, manager_operator_id, dwt, cargo_capacity_cbm, cargo_capacity_mt, build_year, shipyard, classification_society, vetting_status, vetting_expiry, is_active, notes, created_at, created_by, updated_at, updated_by, flag_country_id, build_country_id) VALUES (1, '9456123', 'NORDIC LUNA', 'LR2_TANKER', 'V7AB1', '257123456', 1, 2, 115000.00, 130000.00, 110000.00, 2018, 'Hyundai Heavy Industries', 'DNV GL', 'APPROVED', '2026-11-01', 1, 'Long-range 2 product/crude tanker.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 8, 9);
IF NOT EXISTS (SELECT 1 FROM dbo.vessel WHERE vessel_id = 2)
INSERT INTO dbo.vessel (vessel_id, imo_number, vessel_name, vessel_type, call_sign, mmsi, owner_operator_id, manager_operator_id, dwt, cargo_capacity_cbm, cargo_capacity_mt, build_year, shipyard, classification_society, vetting_status, vetting_expiry, is_active, notes, created_at, created_by, updated_at, updated_by, flag_country_id, build_country_id) VALUES (2, '9761871', 'FRONT ALTAIR', 'VLCC', '3FOX9', '538001234', 1, 2, 300000.00, 330000.00, 280000.00, 2016, 'Daewoo Shipbuilding', 'Lloyds Register', 'APPROVED', '2027-02-01', 1, 'VLCC crude carrier, Ras Tanura to Asia trade.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 8, 9);
IF NOT EXISTS (SELECT 1 FROM dbo.vessel WHERE vessel_id = 3)
INSERT INTO dbo.vessel (vessel_id, imo_number, vessel_name, vessel_type, call_sign, mmsi, owner_operator_id, manager_operator_id, dwt, cargo_capacity_cbm, cargo_capacity_mt, build_year, shipyard, classification_society, vetting_status, vetting_expiry, is_active, notes, created_at, created_by, updated_at, updated_by, flag_country_id, build_country_id) VALUES (3, '9550234', 'GASELYS', 'LNG_CARRIER', 'FNZZ', '538005678', 1, 2, NULL, 154000.00, NULL, 2007, 'Chantiers de l Atlantique', 'Bureau Veritas', 'CONDITIONAL', '2026-09-01', 1, 'Membrane-type LNG carrier.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 8, 9);
SET IDENTITY_INSERT dbo.vessel OFF;
GO

-- ============================================================
-- 19. vessel_certificate
-- ============================================================
SET IDENTITY_INSERT dbo.vessel_certificate ON;
IF NOT EXISTS (SELECT 1 FROM dbo.vessel_certificate WHERE cert_id = 1)
INSERT INTO dbo.vessel_certificate (cert_id, vessel_id, cert_type, cert_number, issuing_body, issue_date, expiry_date, is_current, notes, created_at, created_by) VALUES (1, 1, 'CLASS_CERT', 'DNV-2023-11234', 'DNV GL', '2023-01-15', '2028-01-15', 1, 'Hull and machinery class certificate.', SYSUTCDATETIME(), 'SYSTEM');
IF NOT EXISTS (SELECT 1 FROM dbo.vessel_certificate WHERE cert_id = 2)
INSERT INTO dbo.vessel_certificate (cert_id, vessel_id, cert_type, cert_number, issuing_body, issue_date, expiry_date, is_current, notes, created_at, created_by) VALUES (2, 1, 'ISM', 'ISM-2023-5521', 'DNV GL', '2023-02-01', '2026-02-01', 1, 'ISM Code Safety Management Certificate.', SYSUTCDATETIME(), 'SYSTEM');
IF NOT EXISTS (SELECT 1 FROM dbo.vessel_certificate WHERE cert_id = 3)
INSERT INTO dbo.vessel_certificate (cert_id, vessel_id, cert_type, cert_number, issuing_body, issue_date, expiry_date, is_current, notes, created_at, created_by) VALUES (3, 2, 'SIRE', 'SIRE-2024-8871', 'OCIMF', '2024-03-01', '2025-03-01', 1, 'Ship Inspection Report Programme inspection.', SYSUTCDATETIME(), 'SYSTEM');
IF NOT EXISTS (SELECT 1 FROM dbo.vessel_certificate WHERE cert_id = 4)
INSERT INTO dbo.vessel_certificate (cert_id, vessel_id, cert_type, cert_number, issuing_body, issue_date, expiry_date, is_current, notes, created_at, created_by) VALUES (4, 3, 'MARPOL', 'MARPOL-2023-3312', 'Bureau Veritas', '2023-06-01', '2027-06-01', 1, 'IOPP certificate.', SYSUTCDATETIME(), 'SYSTEM');
SET IDENTITY_INSERT dbo.vessel_certificate OFF;
GO

-- ============================================================
-- 20. pipeline
-- ============================================================
SET IDENTITY_INSERT dbo.pipeline ON;
IF NOT EXISTS (SELECT 1 FROM dbo.pipeline WHERE pipeline_id = 1)
INSERT INTO dbo.pipeline (pipeline_id, pipeline_code, pipeline_name, pipeline_type, commodity_type, operator_id, flow_direction, country_codes, is_cross_border, is_fungible, batch_scheduling, is_active, commissioned_date, notes, created_at, created_by, updated_at, updated_by) VALUES (1, 'COLONIAL', 'Colonial Pipeline', 'PRODUCTS', 'OIL', 4, 'UNIDIRECTIONAL', 'US', 0, 1, 1, 1, '1964-01-01', 'Major US Gulf Coast to New York Harbor refined products pipeline.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM');
IF NOT EXISTS (SELECT 1 FROM dbo.pipeline WHERE pipeline_id = 2)
INSERT INTO dbo.pipeline (pipeline_id, pipeline_code, pipeline_name, pipeline_type, commodity_type, operator_id, flow_direction, country_codes, is_cross_border, is_fungible, batch_scheduling, is_active, commissioned_date, notes, created_at, created_by, updated_at, updated_by) VALUES (2, 'TTF-TRANS', 'TTF Transmission Network', 'GAS_TRANSMISSION', 'GAS', 4, 'BIDIRECTIONAL', 'NL', 1, 1, 0, 1, '1970-01-01', 'Dutch national gas transmission grid feeding TTF.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM');
SET IDENTITY_INSERT dbo.pipeline OFF;
GO

-- ============================================================
-- 21. storage_facility
-- ============================================================
SET IDENTITY_INSERT dbo.storage_facility ON;
IF NOT EXISTS (SELECT 1 FROM dbo.storage_facility WHERE facility_id = 1)
INSERT INTO dbo.storage_facility (facility_id, location_id, facility_code, facility_name, commodity_type, capacity, capacity_uom_id, operator, is_active, notes, facility_type) VALUES (1, 2, 'ROT-TANK-01', 'Rotterdam Tank Terminal', 'OIL', 850000.0000, 3, 'Vopak', 1, 'Independent tank storage, crude and products.', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.storage_facility WHERE facility_id = 2)
INSERT INTO dbo.storage_facility (facility_id, location_id, facility_code, facility_name, commodity_type, capacity, capacity_uom_id, operator, is_active, notes, facility_type) VALUES (2, 1, 'SVT-STOR-01', 'Sullom Voe Storage', 'OIL', 600000.0000, 3, 'EnQuest', 1, 'Terminal storage for Brent/Forties blend.', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.storage_facility WHERE facility_id = 3)
INSERT INTO dbo.storage_facility (facility_id, location_id, facility_code, facility_name, commodity_type, capacity, capacity_uom_id, operator, is_active, notes, facility_type) VALUES (3, 3, 'CUSH-HUB-01', 'Cushing Storage Hub', 'OIL', 400000.0000, 3, 'Magellan Midstream', 1, 'WTI delivery point tank farm.', 1);
SET IDENTITY_INSERT dbo.storage_facility OFF;
GO

-- ============================================================
-- 22. tank
-- ============================================================
SET IDENTITY_INSERT dbo.tank ON;
IF NOT EXISTS (SELECT 1 FROM dbo.tank WHERE tank_id = 1)
INSERT INTO dbo.tank (tank_id, facility_id, tank_number, tank_name, tank_type, commodity_type, nominal_capacity_m3, working_capacity_m3, heel_volume_m3, is_heated, has_metering, tank_status, is_active, notes, created_at, created_by, updated_at, updated_by) VALUES (1, 1, 'T-101', 'Rotterdam Tank 101', 'FIXED_ROOF', 'OIL', 50000.000, 48000.000, 500.000, 0, 1, 'IN_SERVICE', 1, 'Crude oil storage tank.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM');
IF NOT EXISTS (SELECT 1 FROM dbo.tank WHERE tank_id = 2)
INSERT INTO dbo.tank (tank_id, facility_id, tank_number, tank_name, tank_type, commodity_type, nominal_capacity_m3, working_capacity_m3, heel_volume_m3, is_heated, has_metering, tank_status, is_active, notes, created_at, created_by, updated_at, updated_by) VALUES (2, 1, 'T-102', 'Rotterdam Tank 102', 'FLOATING_ROOF', 'OIL', 60000.000, 58000.000, 600.000, 0, 1, 'IN_SERVICE', 1, 'Gasoline blending tank.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM');
IF NOT EXISTS (SELECT 1 FROM dbo.tank WHERE tank_id = 3)
INSERT INTO dbo.tank (tank_id, facility_id, tank_number, tank_name, tank_type, commodity_type, nominal_capacity_m3, working_capacity_m3, heel_volume_m3, is_heated, has_metering, tank_status, is_active, notes, created_at, created_by, updated_at, updated_by) VALUES (3, 2, 'T-201', 'Sullom Voe Tank 201', 'FIXED_ROOF', 'OIL', 45000.000, 43000.000, 450.000, 0, 1, 'IN_SERVICE', 1, 'Forties blend storage.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM');
IF NOT EXISTS (SELECT 1 FROM dbo.tank WHERE tank_id = 4)
INSERT INTO dbo.tank (tank_id, facility_id, tank_number, tank_name, tank_type, commodity_type, nominal_capacity_m3, working_capacity_m3, heel_volume_m3, is_heated, has_metering, tank_status, is_active, notes, created_at, created_by, updated_at, updated_by) VALUES (4, 3, 'T-301', 'Cushing Tank 301', 'FLOATING_ROOF', 'OIL', 80000.000, 77000.000, 800.000, 0, 1, 'IN_SERVICE', 1, 'WTI storage, NYMEX delivery.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM');
SET IDENTITY_INSERT dbo.tank OFF;
GO

-- ============================================================
-- 23. truck
-- ============================================================
SET IDENTITY_INSERT dbo.truck ON;
IF NOT EXISTS (SELECT 1 FROM dbo.truck WHERE truck_id = 1)
INSERT INTO dbo.truck (truck_id, registration_no, fleet_no, operator_id, truck_type, capacity_litres, capacity_mt, adr_certified, last_inspection_date, next_inspection_date, is_active, notes, created_at, created_by, country_id) VALUES (1, 'LX18 ABC', 'XPO-0451', 3, 'ROAD_TANKER', 36000.00, 32.500, 1, '2025-06-01', '2026-06-01', 1, 'Fuel distribution road tanker.', SYSUTCDATETIME(), 'SYSTEM', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.truck WHERE truck_id = 2)
INSERT INTO dbo.truck (truck_id, registration_no, fleet_no, operator_id, truck_type, capacity_litres, capacity_mt, adr_certified, last_inspection_date, next_inspection_date, is_active, notes, created_at, created_by, country_id) VALUES (2, 'LX19 DEF', 'XPO-0452', 3, 'ROAD_TANKER', 36000.00, 32.500, 1, '2025-07-01', '2026-07-01', 1, 'Fuel distribution road tanker.', SYSUTCDATETIME(), 'SYSTEM', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.truck WHERE truck_id = 3)
INSERT INTO dbo.truck (truck_id, registration_no, fleet_no, operator_id, truck_type, capacity_litres, capacity_mt, adr_certified, last_inspection_date, next_inspection_date, is_active, notes, created_at, created_by, country_id) VALUES (3, 'LX20 GHI', 'XPO-0453', 3, 'DRY_BULK', NULL, 28.000, 0, '2025-05-01', '2026-05-01', 1, 'Dry bulk agri product hauler.', SYSUTCDATETIME(), 'SYSTEM', 1);
SET IDENTITY_INSERT dbo.truck OFF;
GO

-- ============================================================
-- 24. market
-- ============================================================
SET IDENTITY_INSERT dbo.market ON;
IF NOT EXISTS (SELECT 1 FROM dbo.market WHERE market_id = 1)
INSERT INTO dbo.market (market_id, exchange_id, commodity_id, market_code, market_name, market_type, settlement_type, currency_id, timezone, clearing_house, is_active, go_live_date, notes, created_at, created_by, updated_at, updated_by, country_id) VALUES (1, 1, 1, 'ICE-BRENT', 'ICE Brent Crude Futures', 'EXCHANGE', 'FINANCIAL', 1, 'Europe/London', 'ICE Clear Europe', 1, '2000-01-01', 'Dated Brent futures contract.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.market WHERE market_id = 2)
INSERT INTO dbo.market (market_id, exchange_id, commodity_id, market_code, market_name, market_type, settlement_type, currency_id, timezone, clearing_house, is_active, go_live_date, notes, created_at, created_by, updated_at, updated_by, country_id) VALUES (2, 2, 1, 'NYMEX-WTI', 'NYMEX WTI Crude Futures', 'EXCHANGE', 'PHYSICAL', 1, 'America/New_York', 'CME Clearing', 1, '1983-03-30', 'Light sweet crude, Cushing delivery.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 2);
IF NOT EXISTS (SELECT 1 FROM dbo.market WHERE market_id = 3)
INSERT INTO dbo.market (market_id, exchange_id, commodity_id, market_code, market_name, market_type, settlement_type, currency_id, timezone, clearing_house, is_active, go_live_date, notes, created_at, created_by, updated_at, updated_by, country_id) VALUES (3, 4, 5, 'LME-COPPER', 'LME Copper', 'EXCHANGE', 'BOTH', 1, 'Europe/London', 'LME Clear', 1, '1877-01-01', 'LME Grade A copper cathode.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.market WHERE market_id = 4)
INSERT INTO dbo.market (market_id, exchange_id, commodity_id, market_code, market_name, market_type, settlement_type, currency_id, timezone, clearing_house, is_active, go_live_date, notes, created_at, created_by, updated_at, updated_by, country_id) VALUES (4, NULL, 3, 'TTF-SPOT', 'TTF Day-Ahead', 'OTC_CLEARED', 'PHYSICAL', 2, 'Europe/Amsterdam', 'ICE Endex', 1, '2003-01-01', 'Dutch gas hub day-ahead market.', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 3);
SET IDENTITY_INSERT dbo.market OFF;
GO

-- ============================================================
-- 25. price_index
-- ============================================================
SET IDENTITY_INSERT dbo.price_index ON;
IF NOT EXISTS (SELECT 1 FROM dbo.price_index WHERE price_index_id = 1)
INSERT INTO dbo.price_index (price_index_id, commodity_id, index_code, index_name, currency_id, uom_id, publication_source, fixing_timezone, description, is_active) VALUES (1, 1, 'DTD-BRENT', 'Dated Brent', 1, 1, 'Platts', 'Europe/London', 'Physical North Sea Brent/Forties/Oseberg/Ekofisk assessment.', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.price_index WHERE price_index_id = 2)
INSERT INTO dbo.price_index (price_index_id, commodity_id, index_code, index_name, currency_id, uom_id, publication_source, fixing_timezone, description, is_active) VALUES (2, 1, 'WTI-CUSH', 'WTI Cushing', 1, 1, 'CME/NYMEX', 'America/New_York', 'WTI settlement price at Cushing, Oklahoma.', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.price_index WHERE price_index_id = 3)
INSERT INTO dbo.price_index (price_index_id, commodity_id, index_code, index_name, currency_id, uom_id, publication_source, fixing_timezone, description, is_active) VALUES (3, 5, 'LME-CU-OFF', 'LME Copper Official Settlement', 1, 3, 'LME', 'Europe/London', 'LME Official cash settlement price, Grade A copper.', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.price_index WHERE price_index_id = 4)
INSERT INTO dbo.price_index (price_index_id, commodity_id, index_code, index_name, currency_id, uom_id, publication_source, fixing_timezone, description, is_active) VALUES (4, 3, 'TTF-DA', 'TTF Day-Ahead', 2, 7, 'ICE Endex', 'Europe/Amsterdam', 'Dutch TTF day-ahead reference price.', 1);
SET IDENTITY_INSERT dbo.price_index OFF;
GO
