-- =============================================================================
-- SmartETRM — Reference/Seed Data: RIN & Renewable Fuels
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
-- can find/read/diff "what's the seed data for RIN & Renewable Fuels" without wading through
-- the combined file.
--
-- Tables in this file (3): rin_account, rin_fuel_category, rin_obligation
-- =============================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


SET IDENTITY_INSERT [dbo].[rin_fuel_category] ON 

INSERT [dbo].[rin_fuel_category] ([category_id], [d_code], [fuel_name], [fuel_type], [equivalence_value], [energy_sources], [description], [is_active], [created_at], [updated_at]) VALUES (1, N'D3', N'Cellulosic Biofuel', N'CELLULOSIC', CAST(3.00 AS Decimal(5, 2)), N'Corn Stover, Switchgrass, Woody Biomass, Municipal Solid Waste', NULL, 1, CAST(N'2026-07-12T11:19:47.0155045' AS DateTime2), CAST(N'2026-07-12T11:19:47.0155045' AS DateTime2))
INSERT [dbo].[rin_fuel_category] ([category_id], [d_code], [fuel_name], [fuel_type], [equivalence_value], [energy_sources], [description], [is_active], [created_at], [updated_at]) VALUES (2, N'D4', N'Biomass-Based Diesel', N'BIOMASS_DIESEL', CAST(1.50 AS Decimal(5, 2)), N'Soybean Oil, Animal Fats, Used Cooking Oil, Distillers Corn Oil', NULL, 1, CAST(N'2026-07-12T11:19:47.0155045' AS DateTime2), CAST(N'2026-07-12T11:19:47.0155045' AS DateTime2))
INSERT [dbo].[rin_fuel_category] ([category_id], [d_code], [fuel_name], [fuel_type], [equivalence_value], [energy_sources], [description], [is_active], [created_at], [updated_at]) VALUES (3, N'D5', N'Advanced Biofuel', N'ADVANCED', CAST(1.50 AS Decimal(5, 2)), N'Sugarcane Ethanol, Naphtha from Biomass, Biobutanol', NULL, 1, CAST(N'2026-07-12T11:19:47.0155045' AS DateTime2), CAST(N'2026-07-12T11:19:47.0155045' AS DateTime2))
INSERT [dbo].[rin_fuel_category] ([category_id], [d_code], [fuel_name], [fuel_type], [equivalence_value], [energy_sources], [description], [is_active], [created_at], [updated_at]) VALUES (4, N'D6', N'Conventional Biofuel', N'CONVENTIONAL', CAST(1.00 AS Decimal(5, 2)), N'Corn Ethanol, Grain Sorghum Ethanol', NULL, 1, CAST(N'2026-07-12T11:19:47.0155045' AS DateTime2), CAST(N'2026-07-12T11:19:47.0155045' AS DateTime2))
INSERT [dbo].[rin_fuel_category] ([category_id], [d_code], [fuel_name], [fuel_type], [equivalence_value], [energy_sources], [description], [is_active], [created_at], [updated_at]) VALUES (5, N'D7', N'Cellulosic Diesel', N'CELLULOSIC_DIESEL', CAST(1.70 AS Decimal(5, 2)), N'Cellulosic feedstocks via thermochemical or biochemical conversion', NULL, 1, CAST(N'2026-07-12T11:19:47.0155045' AS DateTime2), CAST(N'2026-07-12T11:19:47.0155045' AS DateTime2))
SET IDENTITY_INSERT [dbo].[rin_fuel_category] OFF


