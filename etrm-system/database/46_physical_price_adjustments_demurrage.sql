-- V46: Physical leg enrichments — origin country, demurrage/laytime, price adjustments
-- All three apply to physical delivery legs only (trade_order with settlement_type = 'PHYSICAL').

-- ============================================================
-- 1. Add physical-leg fields to dbo.trade_order
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trade_order') AND name = 'origin_country_code')
  ALTER TABLE dbo.trade_order ADD origin_country_code CHAR(2) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trade_order') AND name = 'demurrage_rate')
  ALTER TABLE dbo.trade_order ADD
    demurrage_rate         DECIMAL(18,4)  NULL,
    demurrage_currency     CHAR(3)        NULL,
    demurrage_basis        VARCHAR(15)    NULL
      CONSTRAINT ck_to_demurrage_basis CHECK (demurrage_basis IN ('REVERSIBLE','NON_REVERSIBLE','AVERAGED')),
    allowed_laytime_hours  DECIMAL(10,2)  NULL,
    despatch_rate          DECIMAL(18,4)  NULL;
GO

-- ============================================================
-- 2. Price adjustment table (one row per adjustment per order)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'trade_order_price_adjustment')
BEGIN
  CREATE TABLE dbo.trade_order_price_adjustment (
    adjustment_id       INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    order_id            INT           NOT NULL,
    adjustment_type     VARCHAR(30)   NOT NULL
      CONSTRAINT ck_pa_type CHECK (adjustment_type IN (
        'API_GRAVITY','DENSITY','HEAT_CONTENT','SULFUR',
        'PROTEIN','MOISTURE','TEST_WEIGHT',
        'ASSAY','TREATMENT_CHARGE','REFINING_CHARGE',
        'QUALITY_PREMIUM','QUALITY_DISCOUNT',
        'TAX','MARKUP','FX_DIFFERENTIAL'
      )),
    adjustment_value    DECIMAL(18,6) NOT NULL,   -- positive = adds to price; negative = subtracts
    adjustment_currency CHAR(3)       NULL,
    adjustment_uom_code VARCHAR(10)   NULL,
    sort_order          TINYINT       NOT NULL DEFAULT 0,
    notes               NVARCHAR(500) NULL,
    created_at          DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at          DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_pa_order FOREIGN KEY (order_id)
      REFERENCES dbo.trade_order(order_id) ON DELETE CASCADE
  );
  CREATE INDEX ix_pa_order ON dbo.trade_order_price_adjustment (order_id);
END;
GO

-- ============================================================
-- 3. Lookup seeds
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM dbo.lookup_value WHERE category = 'price_adjustment_type')
BEGIN
  INSERT INTO dbo.lookup_value (category, code, display_name, sort_order, is_active)
  VALUES
    ('price_adjustment_type','API_GRAVITY',       'API Gravity Differential',       1, 1),
    ('price_adjustment_type','DENSITY',            'Density Correction',             2, 1),
    ('price_adjustment_type','HEAT_CONTENT',       'Heat Content / Calorific Value', 3, 1),
    ('price_adjustment_type','SULFUR',             'Sulfur Premium / Discount',      4, 1),
    ('price_adjustment_type','PROTEIN',            'Protein Content Adjustment',     5, 1),
    ('price_adjustment_type','MOISTURE',           'Moisture Deduction',             6, 1),
    ('price_adjustment_type','TEST_WEIGHT',        'Test Weight Adjustment',         7, 1),
    ('price_adjustment_type','ASSAY',              'Assay / Payable Metal',          8, 1),
    ('price_adjustment_type','TREATMENT_CHARGE',   'Treatment Charge (TC)',          9, 1),
    ('price_adjustment_type','REFINING_CHARGE',    'Refining Charge (RC)',          10, 1),
    ('price_adjustment_type','QUALITY_PREMIUM',    'Quality Premium',               11, 1),
    ('price_adjustment_type','QUALITY_DISCOUNT',   'Quality Discount',              12, 1),
    ('price_adjustment_type','TAX',                'Tax',                           13, 1),
    ('price_adjustment_type','MARKUP',             'Commercial Markup',             14, 1),
    ('price_adjustment_type','FX_DIFFERENTIAL',    'FX Differential',               15, 1);
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.lookup_value WHERE category = 'demurrage_basis')
BEGIN
  INSERT INTO dbo.lookup_value (category, code, display_name, sort_order, is_active)
  VALUES
    ('demurrage_basis','REVERSIBLE',     'Reversible (combined pool)',          1, 1),
    ('demurrage_basis','NON_REVERSIBLE', 'Non-Reversible (per-port allowance)', 2, 1),
    ('demurrage_basis','AVERAGED',       'Averaged',                            3, 1);
END;
GO

-- ============================================================
-- 4. Seed origin country on existing demo orders
-- ============================================================
-- Order 1 — Forties Blend (UK North Sea)
UPDATE dbo.trade_order SET origin_country_code = 'GB' WHERE order_id = 1 AND origin_country_code IS NULL;
-- Order 3/4 — TTF gas (Netherlands virtual hub, no single origin)
-- Order 5 — LME Copper Grade A (Chile is largest producer)
UPDATE dbo.trade_order SET origin_country_code = 'CL' WHERE order_id = 5 AND origin_country_code IS NULL;
-- Order 7 — Urals (Russia)
UPDATE dbo.trade_order SET origin_country_code = 'RU' WHERE order_id = 7 AND origin_country_code IS NULL;
-- Order 8 — EU milling wheat
UPDATE dbo.trade_order SET origin_country_code = 'FR' WHERE order_id = 8 AND origin_country_code IS NULL;
GO
