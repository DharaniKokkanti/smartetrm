-- =============================================================================
-- SmartETRM — Reference/Seed Data: Carbon & Environmental
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
-- can find/read/diff "what's the seed data for Carbon & Environmental" without wading through
-- the combined file.
--
-- Tables in this file (8): carbon_registry_type, carbon_registry, emission_obligation_status, emission_obligation, emission_scheme_type, emission_scheme, environmental_product_type, environmental_product
-- =============================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

SET IDENTITY_INSERT [dbo].[carbon_registry_type] ON 

INSERT [dbo].[carbon_registry_type] ([carbon_registry_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (1, N'COMPLIANCE', N'Compliance', N'Registry mandated by a regulator to issue, transfer and cancel compliance allowances — EU Union Registry, UK Registry, CITSS.', 1, 1, CAST(N'2026-07-12T11:19:49.9960750' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.9960750' AS DateTime2), N'SYSTEM')
INSERT [dbo].[carbon_registry_type] ([carbon_registry_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (2, N'VOLUNTARY', N'Voluntary', N'Privately operated registry for voluntary carbon market credits — Verra Registry, Gold Standard Impact Registry, ACR, APX.', 2, 1, CAST(N'2026-07-12T11:19:49.9960750' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.9960750' AS DateTime2), N'SYSTEM')
SET IDENTITY_INSERT [dbo].[carbon_registry_type] OFF


SET IDENTITY_INSERT [dbo].[emission_obligation_status] ON 

INSERT [dbo].[emission_obligation_status] ([emission_obligation_status_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (1, N'OPEN', N'Open', N'Obligation is active and not yet settled.', 1, 1, CAST(N'2026-07-12T11:19:50.0105135' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:50.0105135' AS DateTime2), N'SYSTEM')
INSERT [dbo].[emission_obligation_status] ([emission_obligation_status_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (2, N'SURRENDERED', N'Surrendered', N'All required allowances have been surrendered to the registry by the compliance deadline.', 2, 1, CAST(N'2026-07-12T11:19:50.0105135' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:50.0105135' AS DateTime2), N'SYSTEM')
INSERT [dbo].[emission_obligation_status] ([emission_obligation_status_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (3, N'PARTIALLY_SURRENDERED', N'Partially Surrendered', N'Some allowances surrendered but a shortfall remains. Further action required before the deadline.', 3, 1, CAST(N'2026-07-12T11:19:50.0105135' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:50.0105135' AS DateTime2), N'SYSTEM')
INSERT [dbo].[emission_obligation_status] ([emission_obligation_status_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (4, N'OVERDUE', N'Overdue', N'Surrender deadline has passed without full compliance. Financial penalties and reputational risk apply.', 4, 1, CAST(N'2026-07-12T11:19:50.0105135' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:50.0105135' AS DateTime2), N'SYSTEM')
SET IDENTITY_INSERT [dbo].[emission_obligation_status] OFF


SET IDENTITY_INSERT [dbo].[emission_scheme_type] ON 

INSERT [dbo].[emission_scheme_type] ([emission_scheme_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (1, N'COMPLIANCE', N'Compliance', N'Mandatory cap-and-trade scheme imposed by law. Participants must surrender allowances equal to verified emissions.', 1, 1, CAST(N'2026-07-12T11:19:49.9855279' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.9855279' AS DateTime2), N'SYSTEM')
INSERT [dbo].[emission_scheme_type] ([emission_scheme_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (2, N'VOLUNTARY', N'Voluntary', N'Market-driven scheme where companies voluntarily offset emissions, verified under standards such as Verra VCS or Gold Standard.', 2, 1, CAST(N'2026-07-12T11:19:49.9855279' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:49.9855279' AS DateTime2), N'SYSTEM')
SET IDENTITY_INSERT [dbo].[emission_scheme_type] OFF


SET IDENTITY_INSERT [dbo].[environmental_product_type] ON 

INSERT [dbo].[environmental_product_type] ([environmental_product_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (1, N'ALLOWANCE', N'Allowance', N'Cap-and-trade permit conferring the right to emit one unit (typically one tonne CO2e). EUA, UKA, CCA, EUAA are allowances.', 1, 1, CAST(N'2026-07-12T11:19:50.0010650' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:50.0010650' AS DateTime2), N'SYSTEM')
INSERT [dbo].[environmental_product_type] ([environmental_product_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (2, N'CERTIFICATE', N'Certificate', N'Tradeable instrument proving one unit of energy was generated from a renewable source. REC (US) and GO (EU/UK) are certificates.', 2, 1, CAST(N'2026-07-12T11:19:50.0010650' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:50.0010650' AS DateTime2), N'SYSTEM')
INSERT [dbo].[environmental_product_type] ([environmental_product_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (3, N'OFFSET', N'Offset', N'Verified emission reduction from a project outside a cap-and-trade scheme. VCU (Verra), CER (UNFCCC), Gold Standard credits.', 3, 1, CAST(N'2026-07-12T11:19:50.0010650' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:50.0010650' AS DateTime2), N'SYSTEM')
SET IDENTITY_INSERT [dbo].[environmental_product_type] OFF


