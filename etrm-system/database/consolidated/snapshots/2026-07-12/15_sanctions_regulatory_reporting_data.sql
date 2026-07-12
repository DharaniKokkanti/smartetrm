-- =============================================================================
-- SmartETRM — Reference/Seed Data: Sanctions & Regulatory Reporting
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
-- can find/read/diff "what's the seed data for Sanctions & Regulatory Reporting" without wading through
-- the combined file.
--
-- Tables in this file (4): country, regulatory_report_type, regulatory_obligation, trade_repository
-- =============================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

SET IDENTITY_INSERT [dbo].[country] ON 

INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (1, N'GB', N'United Kingdom', N'EUROPE', N'+44', N'COMPLIANT', N'CLEAR', 1)
INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (2, N'US', N'United States', N'AMERICAS', N'+1', N'COMPLIANT', N'CLEAR', 1)
INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (3, N'NL', N'Netherlands', N'EUROPE', N'+31', N'COMPLIANT', N'CLEAR', 1)
INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (4, N'DE', N'Germany', N'EUROPE', N'+49', N'COMPLIANT', N'CLEAR', 1)
INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (5, N'NO', N'Norway', N'EUROPE', N'+47', N'COMPLIANT', N'CLEAR', 1)
INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (6, N'SA', N'Saudi Arabia', N'MIDDLE_EAST', N'+966', N'COMPLIANT', N'CLEAR', 1)
INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (7, N'AE', N'United Arab Emirates', N'MIDDLE_EAST', N'+971', N'COMPLIANT', N'CLEAR', 1)
INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (8, N'SG', N'Singapore', N'ASIA_PACIFIC', N'+65', N'COMPLIANT', N'CLEAR', 1)
INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (9, N'JP', N'Japan', N'ASIA_PACIFIC', N'+81', N'COMPLIANT', N'CLEAR', 1)
INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (10, N'CN', N'China', N'ASIA_PACIFIC', N'+86', N'COMPLIANT', N'CLEAR', 1)
INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (11, N'AU', N'Australia', N'ASIA_PACIFIC', N'+61', N'COMPLIANT', N'CLEAR', 1)
INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (12, N'IN', N'India', N'ASIA_PACIFIC', N'+91', N'COMPLIANT', N'CLEAR', 1)
INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (13, N'RU', N'Russia', N'CIS', N'+7', N'GREY_LIST', N'EU_SANCTIONS', 1)
INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (14, N'IR', N'Iran', N'MIDDLE_EAST', N'+98', N'BLACK_LIST', N'OFAC', 1)
INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (15, N'VE', N'Venezuela', N'AMERICAS', N'+58', N'GREY_LIST', N'OFAC', 1)
INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (16, N'FR', N'France', N'EUROPE', N'+33', N'COMPLIANT', N'CLEAR', 1)
INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (17, N'CA', N'Canada', N'AMERICAS', N'+1', N'COMPLIANT', N'CLEAR', 1)
INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (18, N'QA', N'Qatar', N'MIDDLE_EAST', N'+974', N'COMPLIANT', N'CLEAR', 1)
INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (19, N'CL', N'Chile', N'AMERICAS', N'+56', N'COMPLIANT', N'CLEAR', 1)
INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (20, N'PL', N'Poland', N'EUROPE', N'+48', N'COMPLIANT', N'CLEAR', 1)
INSERT [dbo].[country] ([country_id], [country_code], [country_name], [region], [phone_code], [fatf_status], [sanction_status], [is_active]) VALUES (21, N'NG', N'Nigeria', N'AFRICA', N'+234', N'COMPLIANT', N'CLEAR', 1)
SET IDENTITY_INSERT [dbo].[country] OFF

SET IDENTITY_INSERT [dbo].[regulatory_report_type] ON 

INSERT [dbo].[regulatory_report_type] ([report_type_id], [report_code], [report_name], [regulation], [submission_target], [reporting_deadline], [report_format], [is_mandatory], [description], [is_active], [jurisdiction_id]) VALUES (1, N'EMIR_TRADE', N'EMIR Trade Report', N'EMIR', N'Trade Repository', N'T+1 business day', N'XML', 1, NULL, 1, NULL)
INSERT [dbo].[regulatory_report_type] ([report_type_id], [report_code], [report_name], [regulation], [submission_target], [reporting_deadline], [report_format], [is_mandatory], [description], [is_active], [jurisdiction_id]) VALUES (2, N'EMIR_POSITION', N'EMIR Position Report', N'EMIR', N'Trade Repository', N'T+1 business day', N'XML', 1, NULL, 1, NULL)
INSERT [dbo].[regulatory_report_type] ([report_type_id], [report_code], [report_name], [regulation], [submission_target], [reporting_deadline], [report_format], [is_mandatory], [description], [is_active], [jurisdiction_id]) VALUES (3, N'REMIT_TABLE1', N'REMIT Table 1 — Standard Contract', N'REMIT', N'ACER ARIS', N'T+1 business day', N'XML', 1, NULL, 1, NULL)
INSERT [dbo].[regulatory_report_type] ([report_type_id], [report_code], [report_name], [regulation], [submission_target], [reporting_deadline], [report_format], [is_mandatory], [description], [is_active], [jurisdiction_id]) VALUES (4, N'REMIT_TABLE2', N'REMIT Table 2 — Non-Standard', N'REMIT', N'ACER ARIS', N'T+1 business day', N'XML', 1, NULL, 1, NULL)
INSERT [dbo].[regulatory_report_type] ([report_type_id], [report_code], [report_name], [regulation], [submission_target], [reporting_deadline], [report_format], [is_mandatory], [description], [is_active], [jurisdiction_id]) VALUES (5, N'UK_EMIR_TRADE', N'UK EMIR Trade Report', N'UK_EMIR', N'UK Trade Repository', N'T+1 business day', N'XML', 1, NULL, 1, 1)
INSERT [dbo].[regulatory_report_type] ([report_type_id], [report_code], [report_name], [regulation], [submission_target], [reporting_deadline], [report_format], [is_mandatory], [description], [is_active], [jurisdiction_id]) VALUES (6, N'CFTC_SWAP', N'CFTC Swap Data Report', N'CFTC', N'DTCC SDR', N'T+1 business day', N'XML', 1, NULL, 1, 2)
INSERT [dbo].[regulatory_report_type] ([report_type_id], [report_code], [report_name], [regulation], [submission_target], [reporting_deadline], [report_format], [is_mandatory], [description], [is_active], [jurisdiction_id]) VALUES (7, N'MIFID2_TRANS', N'MiFID II Transaction Report', N'MIFID2', N'National Competent Auth', N'T+1 business day', N'XML', 1, NULL, 1, NULL)
INSERT [dbo].[regulatory_report_type] ([report_type_id], [report_code], [report_name], [regulation], [submission_target], [reporting_deadline], [report_format], [is_mandatory], [description], [is_active], [jurisdiction_id]) VALUES (8, N'INTERNAL_DAILY', N'Internal Daily Trading Report', N'INTERNAL', N'Management', N'EOD', N'CSV', 0, NULL, 1, NULL)
INSERT [dbo].[regulatory_report_type] ([report_type_id], [report_code], [report_name], [regulation], [submission_target], [reporting_deadline], [report_format], [is_mandatory], [description], [is_active], [jurisdiction_id]) VALUES (9, N'INTERNAL_RISK', N'Internal Daily Risk Report', N'INTERNAL', N'Risk Committee', N'EOD', N'PDF', 0, NULL, 1, NULL)
SET IDENTITY_INSERT [dbo].[regulatory_report_type] OFF



