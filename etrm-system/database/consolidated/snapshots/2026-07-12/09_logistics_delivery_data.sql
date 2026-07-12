-- =============================================================================
-- SmartETRM — Reference/Seed Data: Logistics & Delivery
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
-- can find/read/diff "what's the seed data for Logistics & Delivery" without wading through
-- the combined file.
--
-- Tables in this file (17): inspection_type, location_type, mot_type, storage_facility_type, transport_operator, container, railcar, truck, location, pipeline, pipeline_cycle, storage_facility, pipeline_segment, pipeline_tariff, tank, vessel, vessel_certificate
-- =============================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

SET IDENTITY_INSERT [dbo].[inspection_type] ON 

INSERT [dbo].[inspection_type] ([inspection_type_id], [type_code], [type_name], [applicable_to], [issuing_body], [validity_months], [is_mandatory], [description], [is_active]) VALUES (1, N'SIRE', N'Ship Inspection Report (SIRE)', N'VESSEL', N'OCIMF', 12, 1, NULL, 1)
INSERT [dbo].[inspection_type] ([inspection_type_id], [type_code], [type_name], [applicable_to], [issuing_body], [validity_months], [is_mandatory], [description], [is_active]) VALUES (2, N'CDI', N'Chemical Distribution Institute', N'VESSEL', N'CDI', 12, 0, NULL, 1)
INSERT [dbo].[inspection_type] ([inspection_type_id], [type_code], [type_name], [applicable_to], [issuing_body], [validity_months], [is_mandatory], [description], [is_active]) VALUES (3, N'RIGHTSHIP', N'RightShip Vetting', N'VESSEL', N'RightShip', 12, 0, NULL, 1)
INSERT [dbo].[inspection_type] ([inspection_type_id], [type_code], [type_name], [applicable_to], [issuing_body], [validity_months], [is_mandatory], [description], [is_active]) VALUES (4, N'USCG_COC', N'US Coast Guard Certificate of Compliance', N'VESSEL', N'USCG', 12, 0, NULL, 1)
INSERT [dbo].[inspection_type] ([inspection_type_id], [type_code], [type_name], [applicable_to], [issuing_body], [validity_months], [is_mandatory], [description], [is_active]) VALUES (5, N'CLASS_ANNUAL', N'Annual Class Survey', N'VESSEL', N'Class Society', 12, 1, NULL, 1)
INSERT [dbo].[inspection_type] ([inspection_type_id], [type_code], [type_name], [applicable_to], [issuing_body], [validity_months], [is_mandatory], [description], [is_active]) VALUES (6, N'CLASS_SPEC', N'Special Survey (5-yearly)', N'VESSEL', N'Class Society', 60, 1, NULL, 1)
INSERT [dbo].[inspection_type] ([inspection_type_id], [type_code], [type_name], [applicable_to], [issuing_body], [validity_months], [is_mandatory], [description], [is_active]) VALUES (7, N'API_653', N'API 653 Tank Inspection', N'TANK', N'API', 60, 1, NULL, 1)
INSERT [dbo].[inspection_type] ([inspection_type_id], [type_code], [type_name], [applicable_to], [issuing_body], [validity_months], [is_mandatory], [description], [is_active]) VALUES (8, N'API_570', N'API 570 Piping Inspection', N'PIPELINE', N'API', 60, 0, NULL, 1)
INSERT [dbo].[inspection_type] ([inspection_type_id], [type_code], [type_name], [applicable_to], [issuing_body], [validity_months], [is_mandatory], [description], [is_active]) VALUES (9, N'DOT_SP', N'DOT Special Permit Inspection', N'RAILCAR,TRUCK', N'DOT', 12, 1, NULL, 1)
INSERT [dbo].[inspection_type] ([inspection_type_id], [type_code], [type_name], [applicable_to], [issuing_body], [validity_months], [is_mandatory], [description], [is_active]) VALUES (10, N'ADR', N'ADR Hazmat Road Transport Cert', N'TRUCK', N'National Authority', 12, 1, NULL, 1)
INSERT [dbo].[inspection_type] ([inspection_type_id], [type_code], [type_name], [applicable_to], [issuing_body], [validity_months], [is_mandatory], [description], [is_active]) VALUES (11, N'CSC', N'Container Safety Convention Plate', N'CONTAINER', N'Flag State', 30, 1, NULL, 1)
INSERT [dbo].[inspection_type] ([inspection_type_id], [type_code], [type_name], [applicable_to], [issuing_body], [validity_months], [is_mandatory], [description], [is_active]) VALUES (12, N'ISO_TANK_INS', N'ISO Tank Annual Inspection', N'CONTAINER', N'Third Party', 12, 1, NULL, 1)
SET IDENTITY_INSERT [dbo].[inspection_type] OFF

SET IDENTITY_INSERT [dbo].[location_type] ON 

INSERT [dbo].[location_type] ([location_type_id], [type_code], [type_name], [description], [is_active], [commodity_type]) VALUES (1, N'PORT', N'Seaport / Loading Terminal', N'Tanker loading and discharge ports', 1, 1)
INSERT [dbo].[location_type] ([location_type_id], [type_code], [type_name], [description], [is_active], [commodity_type]) VALUES (2, N'PIPELINE_HUB', N'Pipeline Hub / Interconnect', N'Oil pipeline interconnection point', 1, 1)
INSERT [dbo].[location_type] ([location_type_id], [type_code], [type_name], [description], [is_active], [commodity_type]) VALUES (3, N'GAS_HUB', N'Gas Trading Hub', N'Virtual or physical gas trading hub', 1, 2)
INSERT [dbo].[location_type] ([location_type_id], [type_code], [type_name], [description], [is_active], [commodity_type]) VALUES (4, N'GAS_PIPELINE', N'Gas Pipeline Entry/Exit', N'Pipeline entry or exit point', 1, 2)
INSERT [dbo].[location_type] ([location_type_id], [type_code], [type_name], [description], [is_active], [commodity_type]) VALUES (5, N'GRID_NODE', N'Power Grid Node', N'Transmission grid delivery node', 1, 3)
INSERT [dbo].[location_type] ([location_type_id], [type_code], [type_name], [description], [is_active], [commodity_type]) VALUES (6, N'POWER_PLANT', N'Power Generation Plant', N'Generation asset location', 1, 3)
INSERT [dbo].[location_type] ([location_type_id], [type_code], [type_name], [description], [is_active], [commodity_type]) VALUES (7, N'WAREHOUSE', N'Commodity Warehouse', N'Physical commodity storage and delivery', 1, NULL)
INSERT [dbo].[location_type] ([location_type_id], [type_code], [type_name], [description], [is_active], [commodity_type]) VALUES (8, N'EXCHANGE', N'Exchange Delivery Point', N'Approved exchange delivery location', 1, NULL)
INSERT [dbo].[location_type] ([location_type_id], [type_code], [type_name], [description], [is_active], [commodity_type]) VALUES (9, N'REFINERY', N'Refinery', N'Oil refinery and processing facility', 1, 1)
INSERT [dbo].[location_type] ([location_type_id], [type_code], [type_name], [description], [is_active], [commodity_type]) VALUES (10, N'LNG_TERMINAL', N'LNG Terminal', N'LNG liquefaction or regasification terminal', 1, 2)
INSERT [dbo].[location_type] ([location_type_id], [type_code], [type_name], [description], [is_active], [commodity_type]) VALUES (11, N'OTHER', N'Other', N'Other location type', 1, NULL)
SET IDENTITY_INSERT [dbo].[location_type] OFF

SET IDENTITY_INSERT [dbo].[mot_type] ON 

INSERT [dbo].[mot_type] ([mot_type_id], [mot_code], [mot_name], [transport_medium], [requires_physical_asset], [requires_routing], [typical_commodities], [description], [is_active]) VALUES (1, N'VESSEL', N'Ocean Vessel / Tanker', N'SEA', 1, 1, N'OIL,GAS,AGRICULTURAL,METALS', NULL, 1)
INSERT [dbo].[mot_type] ([mot_type_id], [mot_code], [mot_name], [transport_medium], [requires_physical_asset], [requires_routing], [typical_commodities], [description], [is_active]) VALUES (2, N'BARGE', N'River / Coastal Barge', N'SEA', 1, 1, N'OIL,GAS,AGRICULTURAL', NULL, 1)
INSERT [dbo].[mot_type] ([mot_type_id], [mot_code], [mot_name], [transport_medium], [requires_physical_asset], [requires_routing], [typical_commodities], [description], [is_active]) VALUES (3, N'PIPELINE', N'Pipeline', N'PIPELINE', 0, 1, N'OIL,GAS', NULL, 1)
INSERT [dbo].[mot_type] ([mot_type_id], [mot_code], [mot_name], [transport_medium], [requires_physical_asset], [requires_routing], [typical_commodities], [description], [is_active]) VALUES (4, N'TRUCK', N'Road Tanker / Truck', N'LAND', 1, 1, N'OIL,AGRICULTURAL,METALS', NULL, 1)
INSERT [dbo].[mot_type] ([mot_type_id], [mot_code], [mot_name], [transport_medium], [requires_physical_asset], [requires_routing], [typical_commodities], [description], [is_active]) VALUES (5, N'RAILCAR', N'Tank Car / Railcar', N'LAND', 1, 1, N'OIL,AGRICULTURAL,METALS', NULL, 1)
INSERT [dbo].[mot_type] ([mot_type_id], [mot_code], [mot_name], [transport_medium], [requires_physical_asset], [requires_routing], [typical_commodities], [description], [is_active]) VALUES (6, N'ISO_CONTAINER', N'ISO Tank Container', N'LAND', 1, 1, N'OIL,METALS', NULL, 1)
INSERT [dbo].[mot_type] ([mot_type_id], [mot_code], [mot_name], [transport_medium], [requires_physical_asset], [requires_routing], [typical_commodities], [description], [is_active]) VALUES (7, N'FLEXIBAG', N'Flexibag Container', N'LAND', 1, 1, N'AGRICULTURAL', NULL, 1)
INSERT [dbo].[mot_type] ([mot_type_id], [mot_code], [mot_name], [transport_medium], [requires_physical_asset], [requires_routing], [typical_commodities], [description], [is_active]) VALUES (8, N'WAREHOUSE_TRANSFER', N'Warehouse / Storage Transfer', N'VIRTUAL', 0, 0, N'METALS,AGRICULTURAL', NULL, 1)
INSERT [dbo].[mot_type] ([mot_type_id], [mot_code], [mot_name], [transport_medium], [requires_physical_asset], [requires_routing], [typical_commodities], [description], [is_active]) VALUES (9, N'BOOK_TRANSFER', N'Book Transfer / Title Only', N'VIRTUAL', 0, 0, N'OIL,GAS,METALS', NULL, 1)
SET IDENTITY_INSERT [dbo].[mot_type] OFF

SET IDENTITY_INSERT [dbo].[storage_facility_type] ON 

INSERT [dbo].[storage_facility_type] ([storage_facility_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (1, N'TANK_FARM', N'Tank Farm', N'Fixed or floating-roof above-ground tanks (crude, refined products)', 1, 1, CAST(N'2026-07-12T11:19:45.2440819' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:45.2440819' AS DateTime2), N'SYSTEM')
INSERT [dbo].[storage_facility_type] ([storage_facility_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (2, N'WAREHOUSE', N'Warehouse', N'Dry bulk or packaged goods warehouse', 2, 1, CAST(N'2026-07-12T11:19:45.2440819' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:45.2440819' AS DateTime2), N'SYSTEM')
INSERT [dbo].[storage_facility_type] ([storage_facility_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (3, N'LNG_TANK', N'LNG Tank', N'Cryogenic LNG storage tank at an import/export terminal', 3, 1, CAST(N'2026-07-12T11:19:45.2440819' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:45.2440819' AS DateTime2), N'SYSTEM')
INSERT [dbo].[storage_facility_type] ([storage_facility_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (4, N'SILO', N'Silo', N'Grain or dry-bulk silo / elevator', 4, 1, CAST(N'2026-07-12T11:19:45.2440819' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:45.2440819' AS DateTime2), N'SYSTEM')
INSERT [dbo].[storage_facility_type] ([storage_facility_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (5, N'REFINERY', N'Refinery', N'Crude oil refinery with intermediate storage', 5, 1, CAST(N'2026-07-12T11:19:45.2440819' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:45.2440819' AS DateTime2), N'SYSTEM')
INSERT [dbo].[storage_facility_type] ([storage_facility_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (6, N'SALT_CAVERN', N'Salt Cavern', N'Underground salt cavern for crude, gas, or LPG storage', 6, 1, CAST(N'2026-07-12T11:19:45.2440819' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:45.2440819' AS DateTime2), N'SYSTEM')
INSERT [dbo].[storage_facility_type] ([storage_facility_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (7, N'VAULT', N'Vault', N'Secure vault for metals (LME-approved, precious)', 7, 1, CAST(N'2026-07-12T11:19:45.2440819' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:45.2440819' AS DateTime2), N'SYSTEM')
INSERT [dbo].[storage_facility_type] ([storage_facility_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (8, N'OTHER', N'Other', N'Facility type not covered by standard classifications', 8, 1, CAST(N'2026-07-12T11:19:45.2440819' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:45.2440819' AS DateTime2), N'SYSTEM')
INSERT [dbo].[storage_facility_type] ([storage_facility_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (9, N'FLOATING_STORAGE', N'Floating Storage', N'Vessel used as offshore storage unit (FSU)', 9, 1, CAST(N'2026-07-12T11:19:47.4895569' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:47.4895569' AS DateTime2), N'SYSTEM')
INSERT [dbo].[storage_facility_type] ([storage_facility_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (10, N'GAS_STORAGE', N'Gas Storage', N'Depleted reservoir or aquifer underground gas storage', 10, 1, CAST(N'2026-07-12T11:19:47.4895569' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:47.4895569' AS DateTime2), N'SYSTEM')
INSERT [dbo].[storage_facility_type] ([storage_facility_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (11, N'PIPELINE_LINEFILL', N'Pipeline Linefill', N'Product held in an active pipeline as operational stock', 11, 1, CAST(N'2026-07-12T11:19:47.4895569' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:47.4895569' AS DateTime2), N'SYSTEM')
INSERT [dbo].[storage_facility_type] ([storage_facility_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (12, N'REFRIGERATED_STORAGE', N'Refrigerated Storage', N'Pressure/refrigerated storage for LPG, ammonia, ethylene', 12, 1, CAST(N'2026-07-12T11:19:47.4895569' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:47.4895569' AS DateTime2), N'SYSTEM')
INSERT [dbo].[storage_facility_type] ([storage_facility_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (13, N'CHEMICAL_TANK', N'Chemical Tank', N'Specialised tank for petrochemicals, solvents, acids', 13, 1, CAST(N'2026-07-12T11:19:47.4895569' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:47.4895569' AS DateTime2), N'SYSTEM')
INSERT [dbo].[storage_facility_type] ([storage_facility_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (14, N'FSRU', N'FSRU', N'Floating Storage and Regasification Unit', 14, 1, CAST(N'2026-07-12T11:19:47.4895569' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:47.4895569' AS DateTime2), N'SYSTEM')
SET IDENTITY_INSERT [dbo].[storage_facility_type] OFF














