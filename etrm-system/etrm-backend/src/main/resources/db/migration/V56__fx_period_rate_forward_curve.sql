-- =============================================================================
-- V56 — FX forward curve support: dbo.fx_period + refactored dbo.fx_rate
-- =============================================================================
-- User asked for comprehensive FX rate support: a dedicated FX period/tenor
-- master table (dbo.fx_period) linked to dbo.fx_rate, replacing any
-- dependency on the generic lookup_value table for day-specific/monthly
-- tenors — needed to scale cleanly to 1000+ individual forward delivery days
-- without bloating a generic lookup table meant for small UI-menu-sized lists.
--
-- The existing dbo.fx_rate (V1) was a flat spot/EOD rate table — no tenor,
-- no maturity date, no forward-curve concept at all. It currently has no
-- seed data and no frontend page reads/writes it yet (Master Data Hub lists
-- it as a `live: false` placeholder), so this is a clean additive refactor,
-- not a breaking change against anything actually in use.
--
-- Applied via ALTER (not DROP+CREATE) even though the table is empty today —
-- migrations should be safe to run against an environment that already has
-- real rows, not just this session's empty dev seed.
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- 1. dbo.fx_period — dedicated tenor/period master (NOT a lookup_value
--    category: this needs its own table so it can scale to 1000+ daily-
--    forward rows without turning lookup_value into a million-row table
--    that every small UI dropdown also has to query around).
-- =============================================================================
IF OBJECT_ID('dbo.fx_period', 'U') IS NOT NULL DROP TABLE dbo.fx_period;
GO

CREATE TABLE dbo.fx_period (
    fx_period_id    INT             NOT NULL IDENTITY(1,1),
    period_code     VARCHAR(20)     NOT NULL,   -- 'SPOT', '1M', '3M', 'DAY_1', 'DAY_2', 'DAY_1032'
    period_name     VARCHAR(100)    NOT NULL,   -- 'Spot Rate', '1 Month Forward', 'Day 1 Forward'
    period_type     VARCHAR(20)     NOT NULL
        CONSTRAINT ck_fx_period_type CHECK (period_type IN ('SPOT', 'STANDARD_TENOR', 'DAILY_FORWARD')),
    days_offset     INT             NOT NULL DEFAULT 0,   -- days from spot/rate date (e.g. 1, 2, 45, 1032)
    is_active       BIT             NOT NULL DEFAULT 1,
    created_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by      VARCHAR(100)    NOT NULL,
    updated_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by      VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_fx_period       PRIMARY KEY (fx_period_id),
    CONSTRAINT uq_fx_period_code  UNIQUE      (period_code)
);
GO
CREATE INDEX ix_fx_period_offset ON dbo.fx_period (period_type, days_offset, is_active);
GO

INSERT INTO dbo.fx_period (period_code, period_name, period_type, days_offset, created_by, updated_by)
VALUES
    ('SPOT', 'Spot Rate',          'SPOT',           0,    'SYSTEM', 'SYSTEM'),
    ('1M',   '1 Month Forward',    'STANDARD_TENOR', 30,   'SYSTEM', 'SYSTEM'),
    ('2M',   '2 Month Forward',    'STANDARD_TENOR', 60,   'SYSTEM', 'SYSTEM'),
    ('3M',   '3 Month Forward',    'STANDARD_TENOR', 90,   'SYSTEM', 'SYSTEM'),
    ('6M',   '6 Month Forward',    'STANDARD_TENOR', 180,  'SYSTEM', 'SYSTEM'),
    ('9M',   '9 Month Forward',    'STANDARD_TENOR', 270,  'SYSTEM', 'SYSTEM'),
    ('1Y',   '1 Year Forward',     'STANDARD_TENOR', 365,  'SYSTEM', 'SYSTEM'),
    ('2Y',   '2 Year Forward',     'STANDARD_TENOR', 730,  'SYSTEM', 'SYSTEM'),
    -- Example daily forwards — illustrate the DAILY_FORWARD pattern used to
    -- scale to 1000+ individual delivery days; additional DAY_N rows are
    -- inserted on demand (e.g. by a curve-build job) rather than pre-seeded.
    ('DAY_1', 'Day 1 Forward',     'DAILY_FORWARD',  1,    'SYSTEM', 'SYSTEM'),
    ('DAY_2', 'Day 2 Forward',     'DAILY_FORWARD',  2,    'SYSTEM', 'SYSTEM'),
    ('DAY_3', 'Day 3 Forward',     'DAILY_FORWARD',  3,    'SYSTEM', 'SYSTEM');
GO

-- =============================================================================
-- 2. dbo.fx_rate — add fx_period_id / maturity_date / rate_value_type
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.fx_rate') AND name = 'fx_period_id')
  ALTER TABLE dbo.fx_rate ADD
    fx_period_id     INT             NULL,
    maturity_date    DATE            NULL,
    rate_value_type  VARCHAR(20)     NULL;
GO

-- Backfill any pre-existing rows as SPOT/OUTRIGHT (no-op today — dbo.fx_rate
-- has no seed data yet — but safe/correct if run against an environment that
-- already has real rows).
UPDATE r
SET r.fx_period_id = p.fx_period_id,
    r.maturity_date = r.rate_date,
    r.rate_value_type = 'OUTRIGHT'
FROM dbo.fx_rate r
CROSS JOIN (SELECT fx_period_id FROM dbo.fx_period WHERE period_code = 'SPOT') p
WHERE r.fx_period_id IS NULL;
GO

ALTER TABLE dbo.fx_rate ALTER COLUMN fx_period_id INT NOT NULL;
ALTER TABLE dbo.fx_rate ALTER COLUMN maturity_date DATE NOT NULL;
ALTER TABLE dbo.fx_rate ALTER COLUMN rate_value_type VARCHAR(20) NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'ck_fx_rate_val_type')
  ALTER TABLE dbo.fx_rate ADD CONSTRAINT ck_fx_rate_val_type CHECK (rate_value_type IN ('OUTRIGHT', 'POINTS'));
GO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_fx_rate_period')
  ALTER TABLE dbo.fx_rate ADD CONSTRAINT fk_fx_rate_period FOREIGN KEY (fx_period_id) REFERENCES dbo.fx_period(fx_period_id);
GO

-- Widen the existing uniqueness rule to include fx_period_id: multiple tenor
-- rows now legitimately exist per (currency pair, rate_date, rate_type).
ALTER TABLE dbo.fx_rate DROP CONSTRAINT IF EXISTS uq_fx_rate;
ALTER TABLE dbo.fx_rate ADD CONSTRAINT uq_fx_rate UNIQUE (from_currency_id, to_currency_id, rate_date, fx_period_id, rate_type);
GO
-- chk_fx_rate_type (EOD/INTRADAY/SETTLEMENT/FIXING/MID) and chk_fx_different
-- (from_currency_id <> to_currency_id) are unchanged and still apply.

-- High-performance composite index for valuation/risk engines pulling a full
-- multi-year curve for a currency pair in one range scan.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_fx_rate_valuation_lookup' AND object_id = OBJECT_ID('dbo.fx_rate'))
  CREATE NONCLUSTERED INDEX ix_fx_rate_valuation_lookup
    ON dbo.fx_rate (from_currency_id, to_currency_id, rate_date, fx_period_id)
    INCLUDE (maturity_date, rate, rate_value_type);
GO

-- =============================================================================
-- 3. Register fx_period in the master data registry (same group as fx_rate)
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'fx_period')
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES ('fx_period', 'FX Periods / Tenors', 'Pricing & Rates', 1, 1, 1, 1, 1, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'V56 — FX FORWARD CURVE SUPPORT APPLIED';
PRINT '  fx_period    — NEW dedicated tenor master table, 11 rows seeded';
PRINT '                 (SPOT, 1M-2Y standard tenors, DAY_1-3 example daily';
PRINT '                 forwards). Deliberately its own table, not a';
PRINT '                 lookup_value category, so it can scale to 1000+';
PRINT '                 daily-forward rows without bloating the generic';
PRINT '                 small-list lookup table.';
PRINT '  fx_rate      — added fx_period_id (FK), maturity_date, rate_value_type';
PRINT '                 (OUTRIGHT/POINTS); uq_fx_rate widened to include';
PRINT '                 fx_period_id; new ix_fx_rate_valuation_lookup composite';
PRINT '                 index added for curve-range queries.';
PRINT '============================================================';
GO
