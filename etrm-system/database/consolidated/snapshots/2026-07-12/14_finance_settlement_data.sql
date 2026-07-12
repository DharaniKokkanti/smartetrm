-- =============================================================================
-- SmartETRM — Reference/Seed Data: Finance & Settlement
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
-- can find/read/diff "what's the seed data for Finance & Settlement" without wading through
-- the combined file.
--
-- Tables in this file (6): currency, bank_account, uom_type, unit_of_measure, uom_conversion, gl_account
-- =============================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

SET IDENTITY_INSERT [dbo].[currency] ON 

INSERT [dbo].[currency] ([currency_id], [currency_code], [currency_name], [symbol], [decimal_places], [is_active]) VALUES (1, N'USD', N'US Dollar', N'$', 2, 1)
INSERT [dbo].[currency] ([currency_id], [currency_code], [currency_name], [symbol], [decimal_places], [is_active]) VALUES (2, N'EUR', N'Euro', N'€', 2, 1)
INSERT [dbo].[currency] ([currency_id], [currency_code], [currency_name], [symbol], [decimal_places], [is_active]) VALUES (3, N'GBP', N'British Pound', N'£', 2, 1)
INSERT [dbo].[currency] ([currency_id], [currency_code], [currency_name], [symbol], [decimal_places], [is_active]) VALUES (4, N'JPY', N'Japanese Yen', N'¥', 0, 1)
INSERT [dbo].[currency] ([currency_id], [currency_code], [currency_name], [symbol], [decimal_places], [is_active]) VALUES (5, N'CHF', N'Swiss Franc', N'Fr', 2, 1)
INSERT [dbo].[currency] ([currency_id], [currency_code], [currency_name], [symbol], [decimal_places], [is_active]) VALUES (6, N'SGD', N'Singapore Dollar', N'S$', 2, 1)
INSERT [dbo].[currency] ([currency_id], [currency_code], [currency_name], [symbol], [decimal_places], [is_active]) VALUES (7, N'AED', N'UAE Dirham', N'?.?', 2, 1)
INSERT [dbo].[currency] ([currency_id], [currency_code], [currency_name], [symbol], [decimal_places], [is_active]) VALUES (8, N'NOK', N'Norwegian Krone', N'kr', 2, 1)
INSERT [dbo].[currency] ([currency_id], [currency_code], [currency_name], [symbol], [decimal_places], [is_active]) VALUES (9, N'CAD', N'Canadian Dollar', N'C$', 2, 1)
INSERT [dbo].[currency] ([currency_id], [currency_code], [currency_name], [symbol], [decimal_places], [is_active]) VALUES (10, N'AUD', N'Australian Dollar', N'A$', 2, 1)
INSERT [dbo].[currency] ([currency_id], [currency_code], [currency_name], [symbol], [decimal_places], [is_active]) VALUES (11, N'CNY', N'Chinese Yuan', N'¥', 2, 1)
INSERT [dbo].[currency] ([currency_id], [currency_code], [currency_name], [symbol], [decimal_places], [is_active]) VALUES (12, N'KWD', N'Kuwaiti Dinar', N'KD', 3, 1)
SET IDENTITY_INSERT [dbo].[currency] OFF


SET IDENTITY_INSERT [dbo].[uom_type] ON 

INSERT [dbo].[uom_type] ([uom_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (1, N'VOLUME', N'Volume', N'Liquid or gas volume units — barrels, cubic metres, gallons, litres. Used for crude, refined products, and LNG.', 1, 1, CAST(N'2026-07-12T11:19:50.1055122' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:50.1055122' AS DateTime2), N'SYSTEM')
INSERT [dbo].[uom_type] ([uom_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (2, N'WEIGHT', N'Weight', N'Mass units — metric tonnes, short tons, pounds, kilograms. Used for metals, agri commodities, weight-settled cargoes.', 2, 1, CAST(N'2026-07-12T11:19:50.1055122' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:50.1055122' AS DateTime2), N'SYSTEM')
INSERT [dbo].[uom_type] ([uom_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (3, N'ENERGY', N'Energy', N'Heat content units — MMBtu, therms, gigajoules. Used for natural gas and LNG priced on a calorific basis.', 3, 1, CAST(N'2026-07-12T11:19:50.1055122' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:50.1055122' AS DateTime2), N'SYSTEM')
INSERT [dbo].[uom_type] ([uom_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (4, N'POWER', N'Power', N'Electrical power and energy units — MW, MWh, kWh. Used for power trade quantities and load profiles.', 4, 1, CAST(N'2026-07-12T11:19:50.1055122' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:50.1055122' AS DateTime2), N'SYSTEM')
INSERT [dbo].[uom_type] ([uom_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (5, N'TEMPERATURE', N'Temperature', N'Temperature units — used for weather-linked and degree-day products.', 5, 1, CAST(N'2026-07-12T11:19:50.1055122' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:50.1055122' AS DateTime2), N'SYSTEM')
INSERT [dbo].[uom_type] ([uom_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (6, N'COUNT', N'Count', N'Discrete count units — lots, cargoes, contracts. Used where a commodity trades in standard-sized units.', 6, 1, CAST(N'2026-07-12T11:19:50.1055122' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:50.1055122' AS DateTime2), N'SYSTEM')
INSERT [dbo].[uom_type] ([uom_type_id], [type_code], [type_name], [description], [sort_order], [is_active], [created_at], [created_by], [updated_at], [updated_by]) VALUES (7, N'OTHER', N'Other', N'Unit category not covered by the standard classifications above.', 7, 1, CAST(N'2026-07-12T11:19:50.1055122' AS DateTime2), N'SYSTEM', CAST(N'2026-07-12T11:19:50.1055122' AS DateTime2), N'SYSTEM')
SET IDENTITY_INSERT [dbo].[uom_type] OFF

SET IDENTITY_INSERT [dbo].[unit_of_measure] ON 

INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (1, N'BBL', N'Barrel', N'BBL', CAST(1.0000000000 AS Decimal(20, 10)), 1, 1, 1)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (2, N'KBD', N'Thousand Barrels/Day', N'BBL', CAST(1000.0000000000 AS Decimal(20, 10)), 1, 1, 1)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (3, N'MT', N'Metric Tonne', N'BBL', CAST(7.3000000000 AS Decimal(20, 10)), 1, 2, 1)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (4, N'MWH', N'Megawatt Hour', N'MWH', CAST(1.0000000000 AS Decimal(20, 10)), 1, 3, 3)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (5, N'GWH', N'Gigawatt Hour', N'MWH', CAST(1000.0000000000 AS Decimal(20, 10)), 1, 3, 3)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (6, N'MW', N'Megawatt', N'MW', CAST(1.0000000000 AS Decimal(20, 10)), 1, 4, 3)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (7, N'MMBTU', N'Million BTU', N'MMBTU', CAST(1.0000000000 AS Decimal(20, 10)), 1, 3, 2)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (8, N'THERM', N'Therm', N'MMBTU', CAST(0.1000000000 AS Decimal(20, 10)), 1, 3, 2)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (9, N'MCM', N'Thousand Cubic Metres', N'MMBTU', CAST(35.3150000000 AS Decimal(20, 10)), 1, 1, 2)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (10, N'BUSHEL', N'Bushel', N'BUSHEL', CAST(1.0000000000 AS Decimal(20, 10)), 1, 1, 5)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (11, N'MT_AGR', N'Metric Tonne (Agri)', N'MT', CAST(1.0000000000 AS Decimal(20, 10)), 1, 2, 5)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (12, N'MT_MET', N'Metric Tonne (Metal)', N'MT', CAST(1.0000000000 AS Decimal(20, 10)), 1, 2, 6)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (13, N'KG', N'Kilogram', N'MT', CAST(0.0010000000 AS Decimal(20, 10)), 1, 2, 6)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (14, N'TROY_OZ', N'Troy Ounce', N'KG', CAST(0.0311035000 AS Decimal(20, 10)), 1, 2, 6)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (15, N'GJ', N'Gigajoule', N'MWH', CAST(0.2777780000 AS Decimal(20, 10)), 1, 3, NULL)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (16, N'SCM', N'Standard Cubic Metre', N'SCM', CAST(1.0000000000 AS Decimal(20, 10)), 1, 1, NULL)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (17, N'MMSCM', N'Million Standard Cu Metres', N'SCM', CAST(1000000.0000000000 AS Decimal(20, 10)), 1, 1, NULL)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (18, N'LB', N'Pound', N'MT', CAST(0.0004540000 AS Decimal(20, 10)), 1, 2, NULL)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (19, N'GAL', N'US Gallon', N'BBL', CAST(0.0238100000 AS Decimal(20, 10)), 1, 1, 1)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (20, N'CBM', N'Cubic Metre', N'BBL', CAST(6.2898140000 AS Decimal(20, 10)), 1, 1, 1)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (21, N'PDAY', N'Per Day', N'PDAY', CAST(1.0000000000 AS Decimal(20, 10)), 1, 7, NULL)
INSERT [dbo].[unit_of_measure] ([uom_id], [uom_code], [uom_name], [base_uom_code], [conversion_factor], [is_active], [uom_category], [commodity_type]) VALUES (22, N'WS_PT', N'Worldscale Points', N'WS_PT', CAST(1.0000000000 AS Decimal(20, 10)), 1, 7, NULL)
SET IDENTITY_INSERT [dbo].[unit_of_measure] OFF

SET IDENTITY_INSERT [dbo].[uom_conversion] ON 

INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (1, 3, 13, CAST(1000.0000000000 AS Decimal(20, 10)), NULL, NULL, NULL, N'1 MT = 1,000 kg — universal weight conversion')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (2, 13, 3, CAST(0.0010000000 AS Decimal(20, 10)), NULL, NULL, NULL, N'1 kg = 0.001 MT — universal weight conversion')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (3, 3, 18, CAST(2204.6226218000 AS Decimal(20, 10)), NULL, NULL, NULL, N'1 MT = 2,204.62 lb — universal weight conversion')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (4, 18, 3, CAST(0.0004535924 AS Decimal(20, 10)), NULL, NULL, NULL, N'1 lb = 0.0004536 MT')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (5, 14, 13, CAST(0.0311034768 AS Decimal(20, 10)), NULL, NULL, NULL, N'1 Troy Oz = 31.1035 g = 0.0311035 kg — London good delivery standard')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (6, 13, 14, CAST(32.1507465700 AS Decimal(20, 10)), NULL, NULL, NULL, N'1 kg = 32.1507 Troy Oz')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (7, 3, 14, CAST(32150.7465700000 AS Decimal(20, 10)), NULL, NULL, NULL, N'1 MT = 32,150.75 Troy Oz')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (8, 14, 3, CAST(0.0000311035 AS Decimal(20, 10)), NULL, NULL, NULL, N'1 Troy Oz = 0.0000311035 MT')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (9, 1, 19, CAST(42.0000000000 AS Decimal(20, 10)), N'OIL', NULL, NULL, N'1 BBL = 42 US gallons — exact, API standard')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (10, 19, 1, CAST(0.0238095238 AS Decimal(20, 10)), N'OIL', NULL, NULL, N'1 US gallon = 1/42 BBL')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (11, 1, 20, CAST(0.1589872950 AS Decimal(20, 10)), N'OIL', NULL, NULL, N'1 BBL = 0.158987 m³ (US barrel = 42 gal × 3.785412 L) — exact')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (12, 20, 1, CAST(6.2898107704 AS Decimal(20, 10)), N'OIL', NULL, NULL, N'1 m³ = 6.28981 BBL')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (13, 4, 7, CAST(3.4121414800 AS Decimal(20, 10)), N'GAS', NULL, NULL, N'1 MWh = 3.412142 MMBTU — exact thermodynamic (1 BTU = 0.293071 Wh)')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (14, 7, 4, CAST(0.2930710800 AS Decimal(20, 10)), N'GAS', NULL, NULL, N'1 MMBTU = 0.293071 MWh')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (15, 4, 8, CAST(34.1214148000 AS Decimal(20, 10)), N'GAS', NULL, NULL, N'1 MWh = 34.1214 Therms')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (16, 8, 4, CAST(0.0293071080 AS Decimal(20, 10)), N'GAS', NULL, NULL, N'1 Therm = 0.0293071 MWh (= 100,000 BTU)')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (17, 4, 15, CAST(3.6000000000 AS Decimal(20, 10)), N'GAS', NULL, NULL, N'1 MWh = 3.6 GJ — exact (1 W = 1 J/s)')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (18, 15, 4, CAST(0.2777777778 AS Decimal(20, 10)), N'GAS', NULL, NULL, N'1 GJ = 0.27778 MWh')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (19, 7, 15, CAST(1.0550558526 AS Decimal(20, 10)), N'GAS', NULL, NULL, N'1 MMBTU = 1.055056 GJ — exact (1 BTU = 1055.06 J)')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (20, 15, 7, CAST(0.9478171203 AS Decimal(20, 10)), N'GAS', NULL, NULL, N'1 GJ = 0.947817 MMBTU')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (21, 5, 4, CAST(1000.0000000000 AS Decimal(20, 10)), N'POWER', NULL, NULL, N'1 GWh = 1,000 MWh')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (22, 4, 5, CAST(0.0010000000 AS Decimal(20, 10)), N'POWER', NULL, NULL, N'1 MWh = 0.001 GWh')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (23, 4, 15, CAST(3.6000000000 AS Decimal(20, 10)), N'POWER', NULL, NULL, N'1 MWh = 3.6 GJ — exact')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (24, 10, 3, CAST(0.0272155000 AS Decimal(20, 10)), N'AGRICULTURAL', NULL, NULL, N'1 bushel (60 lb) = 27.2155 kg = 0.0272155 MT. Applies to wheat, corn, soybeans (all 60 lb/bu per CBOT). Sorghum: 56 lb/bu ? 0.02540 MT/bu.')
INSERT [dbo].[uom_conversion] ([conversion_id], [from_uom_id], [to_uom_id], [factor], [commodity_type], [valid_from], [valid_to], [notes]) VALUES (25, 3, 10, CAST(36.7437000000 AS Decimal(20, 10)), N'AGRICULTURAL', NULL, NULL, N'1 MT = 36.7437 bushels (60 lb/bu wheat/corn/soy standard)')
SET IDENTITY_INSERT [dbo].[uom_conversion] OFF


