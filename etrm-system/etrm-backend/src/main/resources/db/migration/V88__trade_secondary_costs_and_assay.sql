-- =============================================================================
-- V88 — Trade secondary costs (trade & leg level) and physical-leg assay results
-- =============================================================================
-- Trade Blotter UI redesign asked for two new capture surfaces:
--   1. Secondary Costs — ancillary costs beyond the deal price itself (freight,
--      insurance, storage, port dues, etc.), optionally at trade level (whole
--      deal, e.g. legal/documentation) or leg level (cargo-specific, e.g.
--      freight/insurance/port dues for one delivery). Modeled as two separate
--      tables (not one polymorphic table) per explicit user choice.
--   2. Assay / Quality Results — actual measured values for a physical leg's
--      cargo, captured against the product's existing quality specification
--      (dbo.product_spec_template / spec_parameter / product_spec_value, V4).
--      Each result FKs straight to product_spec_value (already carries
--      template + parameter + min/max/typical/bound_direction/test_method),
--      so no separate template_id/parameter_id columns are needed here.
--
-- Shape mirrors dbo.trade_order_price_adjustment (V46) — the closest existing
-- precedent for a small per-order enum-typed line-item table: CHECK-constrained
-- VARCHAR type column (not lookup_value/lookup_category — this is a small
-- fixed enum local to one feature, same reasoning as adjustment_type/
-- demurrage_basis), amount/currency/notes/sort_order/audit columns, real FK
-- with ON DELETE CASCADE to the parent. currency_code gets a real FK straight
-- to dbo.currency(currency_code) from the start (V87's sweep pattern), so this
-- migration doesn't create a new gap for a future sweep to find.
-- =============================================================================

USE ETRM_DB;
GO

-- ── 1. dbo.trade_cost — trade-level secondary costs ─────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'trade_cost')
BEGIN
  CREATE TABLE dbo.trade_cost (
    cost_id       INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    trade_id      INT           NOT NULL,
    cost_type     VARCHAR(30)   NOT NULL
      CONSTRAINT ck_tc_type CHECK (cost_type IN (
        'FREIGHT','INSURANCE','STORAGE','PORT_DUES','CUSTOMS_DUTY',
        'INSPECTION_SURVEY','BANK_CHARGES','LEGAL_DOCUMENTATION',
        'AGENCY_FEES','OTHER'
      )),
    description   VARCHAR(200)  NULL,
    amount        DECIMAL(18,4) NOT NULL,
    currency_code CHAR(3)       NOT NULL,
    is_estimated  BIT           NOT NULL DEFAULT 1,   -- 1 = estimate, 0 = actual/invoiced
    sort_order    TINYINT       NOT NULL DEFAULT 0,
    notes         NVARCHAR(500) NULL,
    created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_tc_trade    FOREIGN KEY (trade_id)      REFERENCES dbo.trade(trade_id) ON DELETE CASCADE,
    CONSTRAINT fk_tc_currency FOREIGN KEY (currency_code) REFERENCES dbo.currency(currency_code)
  );
  CREATE INDEX ix_tc_trade ON dbo.trade_cost (trade_id);
END;
GO

-- ── 2. dbo.trade_order_cost — leg-level secondary costs ─────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'trade_order_cost')
BEGIN
  CREATE TABLE dbo.trade_order_cost (
    cost_id       INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    order_id      INT           NOT NULL,
    cost_type     VARCHAR(30)   NOT NULL
      CONSTRAINT ck_toc_type CHECK (cost_type IN (
        'FREIGHT','INSURANCE','STORAGE','PORT_DUES','CUSTOMS_DUTY',
        'INSPECTION_SURVEY','BANK_CHARGES','LEGAL_DOCUMENTATION',
        'AGENCY_FEES','OTHER'
      )),
    description   VARCHAR(200)  NULL,
    amount        DECIMAL(18,4) NOT NULL,
    currency_code CHAR(3)       NOT NULL,
    is_estimated  BIT           NOT NULL DEFAULT 1,
    sort_order    TINYINT       NOT NULL DEFAULT 0,
    notes         NVARCHAR(500) NULL,
    created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_toc_order    FOREIGN KEY (order_id)      REFERENCES dbo.trade_order(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_toc_currency FOREIGN KEY (currency_code) REFERENCES dbo.currency(currency_code)
  );
  CREATE INDEX ix_toc_order ON dbo.trade_order_cost (order_id);
END;
GO

-- ── 3. dbo.trade_order_assay_result — actual quality results per physical leg
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'trade_order_assay_result')
BEGIN
  CREATE TABLE dbo.trade_order_assay_result (
    assay_result_id INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    order_id        INT           NOT NULL,
    spec_value_id   INT           NOT NULL,   -- carries template + parameter + bounds
    actual_value    DECIMAL(18,6) NULL,
    actual_text     VARCHAR(200)  NULL,       -- for TEXT/ENUM/BOOLEAN parameters
    sample_point    VARCHAR(20)   NULL
      CONSTRAINT ck_assay_sample_point CHECK (sample_point IN ('LOAD','DISCHARGE','SHORE_TANK','OTHER')),
    recorded_date   DATE          NULL,
    notes           VARCHAR(500)  NULL,
    created_at      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_assay_order      FOREIGN KEY (order_id)      REFERENCES dbo.trade_order(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_assay_spec_value FOREIGN KEY (spec_value_id) REFERENCES dbo.product_spec_value(spec_value_id)
  );
  CREATE INDEX ix_assay_order ON dbo.trade_order_assay_result (order_id);
END;
GO

-- ── 4. Seed demo rows ─────────────────────────────────────────────────────────
-- Trade 1 (TRD-2026-00001, Shell Forties cargo) / Order 1 already exist (V33
-- seed) and Order 1's product (BRENT-CRUDE, productId=1) already has a spec
-- template (templateId=1, Dated Brent/BFOE Standard, V24 seed) whose
-- API_GRAVITY/SULPHUR_PCT values (spec_value_id 1/2) match the order's own
-- oilDetail.apiGravity=40.7 / sulphurPct=0.26 — reuse those, don't invent new.
-- Guarded on trade_id/order_id 1 actually existing: V33's own trade/trade_order
-- seed (which this demo data assumes) is itself guarded on trade_id 1-9
-- already existing (mirroring frontend MSW mocks) — a no-op on a genuinely
-- fresh database. Same guard here keeps this a no-op too, instead of an
-- FK-violation failure.
IF EXISTS (SELECT 1 FROM dbo.trade WHERE trade_id = 1)
AND NOT EXISTS (SELECT 1 FROM dbo.trade_cost WHERE trade_id = 1)
BEGIN
  INSERT INTO dbo.trade_cost (trade_id, cost_type, description, amount, currency_code, is_estimated, sort_order, notes)
  VALUES
    (1, 'LEGAL_DOCUMENTATION', 'GTC amendment review — EFET-OIL-2007 side letter', 1500.00, 'USD', 0, 1, 'Outside counsel review, invoiced'),
    (1, 'BANK_CHARGES',        'Letter of credit issuance fee',                     850.00,  'USD', 1, 2, 'Estimated — LC not yet drawn');
END;
GO

IF EXISTS (SELECT 1 FROM dbo.trade_order WHERE order_id = 1)
AND NOT EXISTS (SELECT 1 FROM dbo.trade_order_cost WHERE order_id = 1)
BEGIN
  INSERT INTO dbo.trade_order_cost (order_id, cost_type, description, amount, currency_code, is_estimated, sort_order, notes)
  VALUES
    (1, 'PORT_DUES',         'Sullom Voe loading dues — NORDIC LUNA',    28000.00, 'USD', 0, 1, 'Actual — Sullom Voe terminal invoice'),
    (1, 'INSPECTION_SURVEY', 'Independent cargo inspection (SGS)',        6200.00, 'USD', 1, 2, 'Estimated pending SGS invoice');
END;
GO

IF EXISTS (SELECT 1 FROM dbo.trade_order WHERE order_id = 1)
AND NOT EXISTS (SELECT 1 FROM dbo.trade_order_assay_result WHERE order_id = 1)
BEGIN
  INSERT INTO dbo.trade_order_assay_result (order_id, spec_value_id, actual_value, sample_point, recorded_date, notes)
  VALUES
    (1, 1, 40.7, 'DISCHARGE', '2026-07-12', 'Certificate of Quality — Rotterdam discharge, within Brent 28-46 range'),
    (1, 2, 0.26, 'DISCHARGE', '2026-07-12', 'Certificate of Quality — sweet crude, well within 0.60% max');
END;
GO
