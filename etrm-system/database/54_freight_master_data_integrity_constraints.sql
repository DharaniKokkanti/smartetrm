-- =============================================================================
-- V54 — Freight master data integrity constraints
-- =============================================================================
-- User supplied a reference spec ("ETRM_Freight_External_MD_Patch_v1_0.sql")
-- for charter_party_type / freight_rate_index / laytime_term_template /
-- demurrage_dispatch_rate and asked to review it against our actual schema
-- (V8 original + V53 enhancement) and implement whatever was missing.
--
-- charter_party_type matched exactly — no action needed.
--
-- Three real gaps found and fixed here:
--
--   1. freight_rate_index was missing a business-rule CHECK the spec calls
--      for: BALTIC and ASSESSED index types must carry a currency + UoM
--      (an index that can't be resolved to a $/unit rate isn't usable for
--      benchmarking). Our existing BALTIC/ASSESSED seed rows (BDTI, BCTI,
--      BDI, BPI, BSI, BHSI, SPARK30S) all had NULL currency_id/uom_id, so
--      backfilled them first: Worldscale-quoted tanker indices (BDTI/BCTI)
--      get a new WS_PT (Worldscale Points) UoM; the dry-bulk time-charter-
--      equivalent indices (BDI/BPI/BSI/BHSI) and the LNG assessment
--      (SPARK30S) get a new PDAY (Per Day) UoM — both USD-denominated.
--      Neither UoM existed in dbo.unit_of_measure before this migration.
--
--   2. laytime_term_template's NOR turn-time was a nullable, hours-based
--      field (notice_period_hours, added in V53) left NULL on templates
--      that don't bundle the full WIPON/WIBON/WIFPON/WCCON clause set. The
--      spec models this instead as a mandatory, minutes-granularity field
--      (notice_of_readiness_turn_time_mins, NOT NULL DEFAULT 360) — correct,
--      since a 6-hour NOR turn time is the near-universal market default
--      regardless of which laytime exclusion basis is in force. Replaced
--      the nullable hours column with the spec's NOT NULL minutes column
--      (converting existing 6-hour values to 360; templates that previously
--      had no value take the 360 default, matching real-world practice).
--
--   3. demurrage_dispatch_rate was missing two data-integrity CHECKs the
--      spec calls for: demurrage_rate_per_day must be >= 0, and
--      dispatch_rate_per_day must never exceed demurrage_rate_per_day
--      (dispatch is conventionally half of demurrage and can never
--      commercially exceed it). Neither existed before. Verified all 7
--      existing rows already satisfy both before adding the constraints.
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- 1. New UoMs for freight-index rate quotation, then backfill + CHECK
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.unit_of_measure WHERE uom_code = 'PDAY')
INSERT INTO dbo.unit_of_measure (uom_code, uom_name, uom_category, commodity_type, base_uom_code, conversion_factor)
VALUES ('PDAY', 'Per Day', 'OTHER', NULL, 'PDAY', 1.0);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.unit_of_measure WHERE uom_code = 'WS_PT')
INSERT INTO dbo.unit_of_measure (uom_code, uom_name, uom_category, commodity_type, base_uom_code, conversion_factor)
VALUES ('WS_PT', 'Worldscale Points', 'OTHER', NULL, 'WS_PT', 1.0);
GO

UPDATE fri
SET fri.currency_id = c.currency_id, fri.uom_id = u.uom_id
FROM dbo.freight_rate_index fri
CROSS JOIN (SELECT currency_id FROM dbo.currency WHERE currency_code = 'USD') c
CROSS JOIN (SELECT uom_id FROM dbo.unit_of_measure WHERE uom_code = 'WS_PT') u
WHERE fri.index_code IN ('BDTI', 'BCTI') AND fri.currency_id IS NULL;
GO

UPDATE fri
SET fri.currency_id = c.currency_id, fri.uom_id = u.uom_id
FROM dbo.freight_rate_index fri
CROSS JOIN (SELECT currency_id FROM dbo.currency WHERE currency_code = 'USD') c
CROSS JOIN (SELECT uom_id FROM dbo.unit_of_measure WHERE uom_code = 'PDAY') u
WHERE fri.index_code IN ('BDI', 'BPI', 'BSI', 'BHSI', 'SPARK30S') AND fri.currency_id IS NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_fri_pricing_rules')
  ALTER TABLE dbo.freight_rate_index ADD CONSTRAINT chk_fri_pricing_rules
    CHECK (index_type NOT IN ('BALTIC', 'ASSESSED') OR (currency_id IS NOT NULL AND uom_id IS NOT NULL));
GO

-- =============================================================================
-- 2. LAYTIME_TERM_TEMPLATE — replace nullable notice_period_hours with the
--    spec's mandatory notice_of_readiness_turn_time_mins
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.laytime_term_template') AND name = 'notice_of_readiness_turn_time_mins')
  ALTER TABLE dbo.laytime_term_template ADD notice_of_readiness_turn_time_mins INT NULL;
GO

UPDATE dbo.laytime_term_template
SET notice_of_readiness_turn_time_mins = CASE
    WHEN notice_period_hours IS NOT NULL THEN CAST(notice_period_hours * 60 AS INT)
    ELSE 360
END
WHERE notice_of_readiness_turn_time_mins IS NULL;
GO

ALTER TABLE dbo.laytime_term_template ALTER COLUMN notice_of_readiness_turn_time_mins INT NOT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'df_ltt_nor_turn_time')
  ALTER TABLE dbo.laytime_term_template ADD CONSTRAINT df_ltt_nor_turn_time DEFAULT 360 FOR notice_of_readiness_turn_time_mins;
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.laytime_term_template') AND name = 'notice_period_hours')
  ALTER TABLE dbo.laytime_term_template DROP COLUMN notice_period_hours;
GO

-- =============================================================================
-- 3. DEMURRAGE_DISPATCH_RATE — missing positivity + dispatch<=demurrage CHECKs
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_ddr_positive')
  ALTER TABLE dbo.demurrage_dispatch_rate ADD CONSTRAINT chk_ddr_positive
    CHECK (demurrage_rate_per_day >= 0);
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_ddr_dispatch_le_demurrage')
  ALTER TABLE dbo.demurrage_dispatch_rate ADD CONSTRAINT chk_ddr_dispatch_le_demurrage
    CHECK (dispatch_rate_per_day IS NULL OR dispatch_rate_per_day <= demurrage_rate_per_day);
GO

PRINT '============================================================';
PRINT 'V54 — FREIGHT MASTER DATA INTEGRITY CONSTRAINTS APPLIED';
PRINT '  freight_rate_index      — PDAY + WS_PT UoMs added; BALTIC/ASSESSED';
PRINT '                            rows backfilled with currency+UoM;';
PRINT '                            chk_fri_pricing_rules added.';
PRINT '  laytime_term_template   — notice_period_hours replaced with NOT NULL';
PRINT '                            notice_of_readiness_turn_time_mins (default 360).';
PRINT '  demurrage_dispatch_rate — chk_ddr_positive, chk_ddr_dispatch_le_demurrage added.';
PRINT '============================================================';
GO
