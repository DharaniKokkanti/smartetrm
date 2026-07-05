-- =============================================================================
-- V57 — Market/period master data: lookup FKs, power hourly granularity,
--        multi-component index sequencing, crop-year offset
-- =============================================================================
-- User supplied a reference spec proposing commodity_type be converted from
-- VARCHAR+CHECK to an INT FK on dbo.lookup_value(lookup_id) across 7 tables:
-- dbo.market, dbo.market_product, dbo.price_source, dbo.price_index_source,
-- dbo.market_product_source, dbo.period, dbo.period_mapping.
--
-- Reviewed the actual schema first: only dbo.period and dbo.period_mapping
-- have a commodity_type column at all. The other 5 don't — and shouldn't:
--   - dbo.market already has commodity_id -> dbo.commodity (proper FK).
--   - dbo.market_product resolves its commodity via product.commodity_id
--     (and market.commodity_id).
--   - dbo.price_index_source resolves it via price_index.commodity_id.
--   - dbo.market_product_source resolves it via market_product -> product.
--   - dbo.price_source is deliberately commodity-agnostic — a single vendor
--     feed (Bloomberg, Platts) serves every commodity, so it correctly has
--     no commodity link of its own.
-- Adding a redundant commodity_type column to any of those 5 would be a
-- denormalization that could drift out of sync with the real commodity_id
-- chain. Confirmed this reading with the user before proceeding — only
-- period and period_mapping are converted below, reusing the
-- category='commodity_type' lookup_value rows seeded in V55.
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- 0. Seed the two new lookup_value categories this migration needs
--    (category='commodity_type' already seeded in V55 — reused, not reseeded)
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.lookup_value WHERE category = 'load_type')
INSERT INTO dbo.lookup_value (category, code, display_name, sort_order, is_active)
VALUES
    ('load_type', 'BASE',          'Base (all hours)',      1, 1),
    ('load_type', 'PEAK',          'Peak',                  2, 1),
    ('load_type', 'OFF_PEAK',      'Off-Peak',               3, 1),
    ('load_type', 'EXTENDED_PEAK', 'Extended Peak',          4, 1),
    ('load_type', 'OVERNIGHT',     'Overnight',              5, 1);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.lookup_value WHERE category = 'gas_day_type')
INSERT INTO dbo.lookup_value (category, code, display_name, sort_order, is_active)
VALUES
    ('gas_day_type', 'GAS_DAY',    'Standard Gas Day (06:00-06:00)', 1, 1),
    ('gas_day_type', 'WITHIN_DAY', 'Within-Day',                     2, 1),
    ('gas_day_type', 'DAY_AHEAD',  'Day-Ahead',                      3, 1),
    ('gas_day_type', 'WEEKEND',    'Weekend',                        4, 1);
GO

-- =============================================================================
-- 1. dbo.period — commodity_type / load_type / gas_day_type -> lookup FK,
--    plus new hourly-granularity and crop-year columns
-- =============================================================================
ALTER TABLE dbo.period ADD
    commodity_type_new  INT  NULL,
    load_type_lookup_id INT  NULL,
    gas_day_type_lookup_id INT NULL;
GO

UPDATE p SET p.commodity_type_new = lv.lookup_id
FROM dbo.period p JOIN dbo.lookup_value lv ON lv.category = 'commodity_type' AND lv.code = p.commodity_type;
GO
UPDATE p SET p.load_type_lookup_id = lv.lookup_id
FROM dbo.period p JOIN dbo.lookup_value lv ON lv.category = 'load_type' AND lv.code = p.load_type;
GO
UPDATE p SET p.gas_day_type_lookup_id = lv.lookup_id
FROM dbo.period p JOIN dbo.lookup_value lv ON lv.category = 'gas_day_type' AND lv.code = p.gas_day_type;
GO

-- Drop everything that references the old commodity_type column (5 indexes
-- + the CHECK + the composite UNIQUE), plus the load_type/gas_day_type CHECKs.
DROP INDEX IF EXISTS ix_period_comm_type ON dbo.period;
DROP INDEX IF EXISTS ix_period_dates     ON dbo.period;
DROP INDEX IF EXISTS ix_period_rolling   ON dbo.period;
DROP INDEX IF EXISTS ix_period_trading   ON dbo.period;
DROP INDEX IF EXISTS ix_period_risk      ON dbo.period;
GO
ALTER TABLE dbo.period DROP CONSTRAINT IF EXISTS uq_period_code_comm;
ALTER TABLE dbo.period DROP CONSTRAINT IF EXISTS chk_period_comm;
ALTER TABLE dbo.period DROP CONSTRAINT IF EXISTS chk_period_load;
ALTER TABLE dbo.period DROP CONSTRAINT IF EXISTS chk_period_gas;
ALTER TABLE dbo.period DROP COLUMN commodity_type, load_type, gas_day_type;
GO

EXEC sp_rename 'dbo.period.commodity_type_new', 'commodity_type', 'COLUMN';
GO

ALTER TABLE dbo.period ADD
    CONSTRAINT fk_period_commodity_type FOREIGN KEY (commodity_type)     REFERENCES dbo.lookup_value(lookup_id),
    CONSTRAINT fk_period_load_type      FOREIGN KEY (load_type_lookup_id) REFERENCES dbo.lookup_value(lookup_id),
    CONSTRAINT fk_period_gas_day_type   FOREIGN KEY (gas_day_type_lookup_id) REFERENCES dbo.lookup_value(lookup_id),
    CONSTRAINT uq_period_code_comm      UNIQUE (period_code, commodity_type);
GO

CREATE INDEX ix_period_comm_type ON dbo.period (commodity_type, period_type, is_active);
CREATE INDEX ix_period_dates     ON dbo.period (period_start, period_end, commodity_type)
    WHERE period_start IS NOT NULL;
CREATE INDEX ix_period_rolling   ON dbo.period (is_rolling, commodity_type, is_active)
    WHERE is_rolling = 1;
CREATE INDEX ix_period_trading   ON dbo.period (is_trading_period, commodity_type, is_active)
    WHERE is_trading_period = 1;
CREATE INDEX ix_period_risk      ON dbo.period (is_risk_period, commodity_type, is_active)
    WHERE is_risk_period = 1;
GO

-- Power hourly/sub-hourly granularity — load_type alone only gives a coarse
-- BASE/PEAK/OFF_PEAK bucket; physical power risk needs exact hour blocks
-- (EEX blocks, PJM hourly nodes, EV charging profiles). NULL end_time_utc
-- means the period is a standard full gas/calendar day, not an hourly slice.
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.period') AND name = 'start_time_utc')
  ALTER TABLE dbo.period ADD
    start_time_utc TIME NULL,
    end_time_utc   TIME NULL;
GO

-- Agri crop-year alignment — CAL-2027 (calendar year) doesn't match the
-- physical marketing year of a grain/soft commodity (e.g. US corn/soybean
-- crop year starts September). Analogous in spirit to roll_offset/roll_unit
-- already used for rolling-period month conventions.
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.period') AND name = 'crop_year_offset_months')
  ALTER TABLE dbo.period ADD crop_year_offset_months TINYINT NULL;
GO

-- =============================================================================
-- 2. dbo.period_mapping.commodity_type -> lookup FK
-- =============================================================================
ALTER TABLE dbo.period_mapping ADD commodity_type_new INT NULL;
GO
UPDATE m SET m.commodity_type_new = lv.lookup_id
FROM dbo.period_mapping m JOIN dbo.lookup_value lv ON lv.category = 'commodity_type' AND lv.code = m.commodity_type;
GO

DROP INDEX IF EXISTS ix_pm_parent ON dbo.period_mapping;
GO
ALTER TABLE dbo.period_mapping DROP CONSTRAINT IF EXISTS uq_period_mapping;
ALTER TABLE dbo.period_mapping DROP COLUMN commodity_type;
GO
EXEC sp_rename 'dbo.period_mapping.commodity_type_new', 'commodity_type', 'COLUMN';
GO
ALTER TABLE dbo.period_mapping ADD
    CONSTRAINT fk_pm_commodity_type FOREIGN KEY (commodity_type) REFERENCES dbo.lookup_value(lookup_id),
    CONSTRAINT uq_period_mapping    UNIQUE (parent_period_id, child_period_id, commodity_type, effective_from);
GO
CREATE INDEX ix_pm_parent ON dbo.period_mapping (parent_period_id, is_active, commodity_type);
GO

-- =============================================================================
-- 3. dbo.price_index_source.calculation_sequence — multi-component / formula
--    indices (e.g. 50% Platts Brent + 50% Argus Brent, or a base index plus
--    a differential that must be evaluated after it). price_multiplier and
--    price_offset already support per-source weighting (a 0.5 multiplier IS
--    a 50% weight) — nothing to change there. What's missing is a
--    deterministic evaluation order across the multiple source rows that can
--    already exist per price_index_id.
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.price_index_source') AND name = 'calculation_sequence')
  ALTER TABLE dbo.price_index_source ADD calculation_sequence TINYINT NOT NULL DEFAULT 1;
GO

PRINT '============================================================';
PRINT 'V57 — PERIOD / PRICE INDEX SOURCE ENHANCEMENTS APPLIED';
PRINT '  period          — commodity_type/load_type/gas_day_type moved to';
PRINT '                    lookup_value FKs; start_time_utc/end_time_utc';
PRINT '                    and crop_year_offset_months added.';
PRINT '  period_mapping  — commodity_type moved to lookup_value FK.';
PRINT '  price_index_source — calculation_sequence added for multi-component';
PRINT '                    / formula indices.';
PRINT '  market, market_product, price_source, price_index_source,';
PRINT '  market_product_source — NOT changed: none of these (other than';
PRINT '  price_index_source above) have a commodity_type column; they';
PRINT '  already resolve commodity via their existing commodity_id chain';
PRINT '  (market.commodity_id / product.commodity_id / price_index.commodity_id)';
PRINT '  or are deliberately commodity-agnostic (price_source).';
PRINT '============================================================';
GO
