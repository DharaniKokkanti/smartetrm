-- =============================================================================
-- SmartETRM — Reference/Seed Data: Physical Operations
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
-- can find/read/diff "what's the seed data for Physical Operations" without wading through
-- the combined file.
--
-- Tables in this file (1): bolmo_agreement
-- =============================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


