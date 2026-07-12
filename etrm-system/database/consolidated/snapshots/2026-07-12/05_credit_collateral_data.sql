-- =============================================================================
-- SmartETRM — Reference/Seed Data: Credit & Collateral
-- =============================================================================
-- GENERATED FILE — do not hand-edit. Extracted from a live, fully-migrated
-- ETRM_DB (post-V96) via mssql-scripter, one table at a time.
--
-- REFERENCE ONLY — not guaranteed independently runnable in isolation.
-- SmartETRM's Master Data Hub groups are NOT a dependency hierarchy — most
-- groups have FKs pointing at each other in both directions (e.g. Products &
-- Markets needs Finance & Settlement's currency rows; Finance & Settlement's
-- bank_account needs Counterparties & Agreements' counterparty rows). There is
-- no group-by-group load order that satisfies every FK. For an actually-
-- runnable full load, use 01_master_data_seed.sql instead, which loads all
-- 154 tables' data in a verified-safe per-table order. This file exists so you
-- can find/read/diff "what's the seed data for Credit & Collateral" without wading through
-- the combined file.
--
-- Tables in this file (19): collateral_type, credit_limit_status_type, credit_limit_type, governing_law_type, lc_status_type, lc_type, bank_guarantee, collateral, credit_limit, insurance_provider, insurance_policy, letter_of_credit, margin_agreement_type, parent_company_guarantee, tax_type, tax_registration, margin_account, valuation_frequency_type, margin_agreement
-- =============================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

SET IDENTITY_INSERT [dbo].[collateral_type] ON 

INSERT [dbo].[collateral_type] ([collateral_type_id], [type_code], [type_name], [asset_class], [standard_haircut_pct], [is_active], [description]) VALUES (1, N'CASH_USD', N'Cash USD', N'CASH', CAST(0.00 AS Decimal(5, 2)), 1, N'USD cash collateral')
INSERT [dbo].[collateral_type] ([collateral_type_id], [type_code], [type_name], [asset_class], [standard_haircut_pct], [is_active], [description]) VALUES (2, N'CASH_EUR', N'Cash EUR', N'CASH', CAST(0.00 AS Decimal(5, 2)), 1, N'EUR cash collateral')
INSERT [dbo].[collateral_type] ([collateral_type_id], [type_code], [type_name], [asset_class], [standard_haircut_pct], [is_active], [description]) VALUES (3, N'CASH_GBP', N'Cash GBP', N'CASH', CAST(0.00 AS Decimal(5, 2)), 1, N'GBP cash collateral')
INSERT [dbo].[collateral_type] ([collateral_type_id], [type_code], [type_name], [asset_class], [standard_haircut_pct], [is_active], [description]) VALUES (4, N'GOV_US', N'US Treasury Bonds', N'GOVERNMENT_BOND', CAST(2.00 AS Decimal(5, 2)), 1, N'US Government securities')
INSERT [dbo].[collateral_type] ([collateral_type_id], [type_code], [type_name], [asset_class], [standard_haircut_pct], [is_active], [description]) VALUES (5, N'GOV_UK', N'UK Gilts', N'GOVERNMENT_BOND', CAST(2.00 AS Decimal(5, 2)), 1, N'UK Government securities')
INSERT [dbo].[collateral_type] ([collateral_type_id], [type_code], [type_name], [asset_class], [standard_haircut_pct], [is_active], [description]) VALUES (6, N'GOV_DE', N'German Bunds', N'GOVERNMENT_BOND', CAST(2.00 AS Decimal(5, 2)), 1, N'German Government securities')
INSERT [dbo].[collateral_type] ([collateral_type_id], [type_code], [type_name], [asset_class], [standard_haircut_pct], [is_active], [description]) VALUES (7, N'CORP_IG', N'Investment Grade Corp Bonds', N'CORPORATE_BOND', CAST(10.00 AS Decimal(5, 2)), 1, N'BBB- or above rated corporate bonds')
INSERT [dbo].[collateral_type] ([collateral_type_id], [type_code], [type_name], [asset_class], [standard_haircut_pct], [is_active], [description]) VALUES (8, N'LC', N'Letter of Credit', N'LETTER_OF_CREDIT', CAST(0.00 AS Decimal(5, 2)), 1, N'Bank-issued letter of credit')
INSERT [dbo].[collateral_type] ([collateral_type_id], [type_code], [type_name], [asset_class], [standard_haircut_pct], [is_active], [description]) VALUES (9, N'BG', N'Bank Guarantee', N'BANK_GUARANTEE', CAST(0.00 AS Decimal(5, 2)), 1, N'Bank-issued guarantee')
SET IDENTITY_INSERT [dbo].[collateral_type] OFF

SET IDENTITY_INSERT [dbo].[credit_limit_status_type] ON 

INSERT [dbo].[credit_limit_status_type] ([credit_limit_status_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (1, N'ACTIVE', N'Active', N'Limit is in effect and enforced. New trades are validated against this limit during booking.', 1, 1, CAST(N'2026-07-12T11:19:49.7452611' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7452611' AS DateTime2), N'SYSTEM')
INSERT [dbo].[credit_limit_status_type] ([credit_limit_status_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (2, N'EXPIRED', N'Expired', N'Limit has passed its expiry date. New trades cannot consume this limit.', 2, 1, CAST(N'2026-07-12T11:19:49.7452611' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7452611' AS DateTime2), N'SYSTEM')
INSERT [dbo].[credit_limit_status_type] ([credit_limit_status_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (3, N'SUSPENDED', N'Suspended', N'Limit temporarily blocked by credit team (e.g. during CP review or KYC renewal).', 3, 1, CAST(N'2026-07-12T11:19:49.7452611' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7452611' AS DateTime2), N'SYSTEM')
INSERT [dbo].[credit_limit_status_type] ([credit_limit_status_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (4, N'CANCELLED', N'Cancelled', N'Limit permanently withdrawn — counterparty credit facility removed.', 4, 1, CAST(N'2026-07-12T11:19:49.7452611' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7452611' AS DateTime2), N'SYSTEM')
SET IDENTITY_INSERT [dbo].[credit_limit_status_type] OFF

SET IDENTITY_INSERT [dbo].[credit_limit_type] ON 

INSERT [dbo].[credit_limit_type] ([credit_limit_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (1, N'PRE_SETTLEMENT', N'Pre-Settlement', N'Forward exposure risk — replacement cost if the counterparty defaults before maturity. Sum of positive MTM of all open trades.', 1, 1, CAST(N'2026-07-12T11:19:49.7352173' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7352173' AS DateTime2), N'SYSTEM')
INSERT [dbo].[credit_limit_type] ([credit_limit_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (2, N'SETTLEMENT', N'Settlement', N'Payment-due-today risk — cash owed by or to the counterparty on transactions settling within T+2.', 2, 1, CAST(N'2026-07-12T11:19:49.7352173' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7352173' AS DateTime2), N'SYSTEM')
INSERT [dbo].[credit_limit_type] ([credit_limit_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (3, N'DELIVERY', N'Delivery', N'Physical commodity delivery risk — value of commodity expected to deliver to (or receive from) the counterparty in the current period.', 3, 1, CAST(N'2026-07-12T11:19:49.7352173' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7352173' AS DateTime2), N'SYSTEM')
INSERT [dbo].[credit_limit_type] ([credit_limit_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (4, N'MARK_TO_MARKET', N'Mark-to-Market', N'Current unrealised gain/loss exposure on all open positions valued at today''s market price.', 4, 1, CAST(N'2026-07-12T11:19:49.7352173' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7352173' AS DateTime2), N'SYSTEM')
SET IDENTITY_INSERT [dbo].[credit_limit_type] OFF

SET IDENTITY_INSERT [dbo].[governing_law_type] ON 

INSERT [dbo].[governing_law_type] ([governing_law_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (1, N'ENGLISH', N'English Law', N'ISDA 1995/2016 CSA (Transfer — English law). Collateral transferred by way of title, not security interest. Most common in Europe and Asia.', 1, 1, CAST(N'2026-07-12T11:19:49.7234837' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7234837' AS DateTime2), N'SYSTEM')
INSERT [dbo].[governing_law_type] ([governing_law_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (2, N'NEW_YORK', N'New York Law', N'ISDA 1994 CSA (Security Interest — New York law). Collateral pledged as security interest; rehypothecation typically permitted. Standard in US markets.', 2, 1, CAST(N'2026-07-12T11:19:49.7234837' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7234837' AS DateTime2), N'SYSTEM')
INSERT [dbo].[governing_law_type] ([governing_law_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (3, N'OTHER', N'Other', N'Alternative jurisdiction — e.g. Japanese law CSA, French law, or bespoke bilateral arrangement.', 3, 1, CAST(N'2026-07-12T11:19:49.7234837' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7234837' AS DateTime2), N'SYSTEM')
SET IDENTITY_INSERT [dbo].[governing_law_type] OFF

SET IDENTITY_INSERT [dbo].[lc_status_type] ON 

INSERT [dbo].[lc_status_type] ([lc_status_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (1, N'ACTIVE', N'Active', N'LC is current and available to draw against.', 1, 1, CAST(N'2026-07-12T11:19:49.7609872' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7609872' AS DateTime2), N'SYSTEM')
INSERT [dbo].[lc_status_type] ([lc_status_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (2, N'EXPIRED', N'Expired', N'LC has passed its expiry date without being drawn or renewed. Bank released from obligation.', 2, 1, CAST(N'2026-07-12T11:19:49.7609872' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7609872' AS DateTime2), N'SYSTEM')
INSERT [dbo].[lc_status_type] ([lc_status_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (3, N'CANCELLED', N'Cancelled', N'LC cancelled by mutual agreement before expiry.', 3, 1, CAST(N'2026-07-12T11:19:49.7609872' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7609872' AS DateTime2), N'SYSTEM')
INSERT [dbo].[lc_status_type] ([lc_status_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (4, N'PARTIALLY_DRAWN', N'Partially Drawn', N'One or more drawdown events occurred but the full LC face value has not been consumed.', 4, 1, CAST(N'2026-07-12T11:19:49.7609872' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7609872' AS DateTime2), N'SYSTEM')
INSERT [dbo].[lc_status_type] ([lc_status_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (5, N'FULLY_DRAWN', N'Fully Drawn', N'All available LC face value has been drawn — no further drawings possible.', 5, 1, CAST(N'2026-07-12T11:19:49.7609872' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7609872' AS DateTime2), N'SYSTEM')
SET IDENTITY_INSERT [dbo].[lc_status_type] OFF

SET IDENTITY_INSERT [dbo].[lc_type] ON 

INSERT [dbo].[lc_type] ([lc_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (1, N'STANDBY', N'Standby LC', N'Independent payment guarantee — drawn only on default or non-performance. Governed by ISP98.', 1, 1, CAST(N'2026-07-12T11:19:49.7505581' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7505581' AS DateTime2), N'SYSTEM')
INSERT [dbo].[lc_type] ([lc_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (2, N'DOCUMENTARY', N'Documentary LC', N'Payment triggered by presentation of specified shipping documents. Governed by ICC UCP 600. Standard for physical cargo trades.', 2, 1, CAST(N'2026-07-12T11:19:49.7505581' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7505581' AS DateTime2), N'SYSTEM')
INSERT [dbo].[lc_type] ([lc_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (3, N'REVOLVING', N'Revolving LC', N'Automatically reinstates (up to face value) after each drawing or at specified intervals.', 3, 1, CAST(N'2026-07-12T11:19:49.7505581' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7505581' AS DateTime2), N'SYSTEM')
INSERT [dbo].[lc_type] ([lc_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (4, N'TRANSFERABLE', N'Transferable LC', N'Beneficiary can transfer the LC (whole or part) to a second beneficiary. Requires explicit endorsement from issuing bank.', 4, 1, CAST(N'2026-07-12T11:19:49.7505581' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7505581' AS DateTime2), N'SYSTEM')
SET IDENTITY_INSERT [dbo].[lc_type] OFF







SET IDENTITY_INSERT [dbo].[margin_agreement_type] ON 

INSERT [dbo].[margin_agreement_type] ([margin_agreement_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (1, N'CSA_BILATERAL', N'CSA Bilateral', N'Both parties can be required to post collateral depending on MTM direction. Standard under ISDA 2002 Credit Support Annex (English law).', 1, 1, CAST(N'2026-07-12T11:19:49.7127372' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7127372' AS DateTime2), N'SYSTEM')
INSERT [dbo].[margin_agreement_type] ([margin_agreement_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (2, N'CSA_ONE_WAY_IN', N'CSA One-Way (We Receive)', N'Only the counterparty posts collateral to us — we are never required to post.', 2, 1, CAST(N'2026-07-12T11:19:49.7127372' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7127372' AS DateTime2), N'SYSTEM')
INSERT [dbo].[margin_agreement_type] ([margin_agreement_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (3, N'CSA_ONE_WAY_OUT', N'CSA One-Way (We Post)', N'Only we post collateral to the counterparty — typically required by highly rated bank counterparties or CCPs.', 3, 1, CAST(N'2026-07-12T11:19:49.7127372' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7127372' AS DateTime2), N'SYSTEM')
INSERT [dbo].[margin_agreement_type] ([margin_agreement_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (4, N'PLEDGE', N'Pledge Agreement', N'Title-transfer collateral arrangement (New York law). Collateral ownership transfers to the receiving party.', 4, 1, CAST(N'2026-07-12T11:19:49.7127372' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7127372' AS DateTime2), N'SYSTEM')
INSERT [dbo].[margin_agreement_type] ([margin_agreement_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (5, N'CTA', N'CTA (Collateral Transfer Agreement)', N'Typically paired with an ISDA Master to govern initial margin posting under UMR (Uncleared Margin Rules).', 5, 1, CAST(N'2026-07-12T11:19:49.7127372' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7127372' AS DateTime2), N'SYSTEM')
SET IDENTITY_INSERT [dbo].[margin_agreement_type] OFF


SET IDENTITY_INSERT [dbo].[tax_type] ON 

INSERT [dbo].[tax_type] ([tax_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (1, N'VAT', N'VAT', N'Value Added Tax (EU, UK, and most jurisdictions)', 1, 1, CAST(N'2026-07-12T11:19:45.2585353' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:45.2585353' AS DateTime2), N'SYSTEM')
INSERT [dbo].[tax_type] ([tax_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (2, N'GST', N'GST', N'Goods & Services Tax (Australia, Canada, India, etc.)', 2, 1, CAST(N'2026-07-12T11:19:45.2585353' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:45.2585353' AS DateTime2), N'SYSTEM')
INSERT [dbo].[tax_type] ([tax_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (3, N'EIN', N'EIN', N'Employer Identification Number (USA federal tax ID)', 3, 1, CAST(N'2026-07-12T11:19:45.2585353' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:45.2585353' AS DateTime2), N'SYSTEM')
INSERT [dbo].[tax_type] ([tax_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (4, N'UTR', N'UTR', N'Unique Taxpayer Reference (UK HMRC)', 4, 1, CAST(N'2026-07-12T11:19:45.2585353' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:45.2585353' AS DateTime2), N'SYSTEM')
INSERT [dbo].[tax_type] ([tax_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (5, N'TIN', N'TIN', N'Taxpayer Identification Number (generic)', 5, 1, CAST(N'2026-07-12T11:19:45.2585353' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:45.2585353' AS DateTime2), N'SYSTEM')
INSERT [dbo].[tax_type] ([tax_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (6, N'ABN', N'ABN', N'Australian Business Number', 6, 1, CAST(N'2026-07-12T11:19:45.2585353' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:45.2585353' AS DateTime2), N'SYSTEM')
INSERT [dbo].[tax_type] ([tax_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (7, N'SIREN', N'SIREN', N'French company identifier (Système SIRENE)', 7, 1, CAST(N'2026-07-12T11:19:45.2585353' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:45.2585353' AS DateTime2), N'SYSTEM')
INSERT [dbo].[tax_type] ([tax_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (8, N'KVKK', N'KVKK', N'Turkish trade register number (Ticaret Sicil Numarasi)', 8, 1, CAST(N'2026-07-12T11:19:45.2585353' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:45.2585353' AS DateTime2), N'SYSTEM')
INSERT [dbo].[tax_type] ([tax_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (9, N'OTHER', N'Other', N'Tax registration type not covered by standard codes', 9, 1, CAST(N'2026-07-12T11:19:45.2585353' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:45.2585353' AS DateTime2), N'SYSTEM')
SET IDENTITY_INSERT [dbo].[tax_type] OFF



SET IDENTITY_INSERT [dbo].[valuation_frequency_type] ON 

INSERT [dbo].[valuation_frequency_type] ([valuation_frequency_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (1, N'DAILY', N'Daily', N'MTM valuation performed every business day. Standard under ISDA 2002 and EMIR.', 1, 1, CAST(N'2026-07-12T11:19:49.7181461' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7181461' AS DateTime2), N'SYSTEM')
INSERT [dbo].[valuation_frequency_type] ([valuation_frequency_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (2, N'WEEKLY', N'Weekly', N'MTM valuation performed once per week. Used in some bilateral agreements for less liquid portfolios.', 2, 1, CAST(N'2026-07-12T11:19:49.7181461' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7181461' AS DateTime2), N'SYSTEM')
INSERT [dbo].[valuation_frequency_type] ([valuation_frequency_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (3, N'MONTHLY', N'Monthly', N'MTM valuation performed monthly — lower-volume or long-dated contracts where daily margining is impractical.', 3, 1, CAST(N'2026-07-12T11:19:49.7181461' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.7181461' AS DateTime2), N'SYSTEM')
SET IDENTITY_INSERT [dbo].[valuation_frequency_type] OFF


