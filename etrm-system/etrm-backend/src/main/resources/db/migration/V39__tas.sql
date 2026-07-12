-- ─── V39: TAS (Trade at Settlement) ──────────────────────────────────────────
-- Adds infrastructure for TAS pricing:
--   1. Extend pricing_rule with TAS-specific columns
--   2. Seed 4 TAS pricing rules (CL, NG, HO, BZ)
--   3. Create settlement_price table (daily exchange close prices)
--   4. Create trade_order_tas table (per-leg TAS position detail)
--   5. Add TAS + OPTION_STRIKE + PLATTS_WINDOW to pricing_type lookup
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Extend pricing_rule with TAS columns
ALTER TABLE dbo.pricing_rule
  ADD tas_exchange          NVARCHAR(20)   NULL,   -- CME_NYMEX | ICE_EUROPE | ICE_US
      tas_contract_series   NVARCHAR(10)   NULL,   -- CL | NG | HO | RB | BZ
      tas_tick_size         DECIMAL(12,6)  NULL;   -- USD per tick per unit (CL=0.01, NG=0.001)
GO

-- 2a. Add TAS, OPTION_STRIKE, PLATTS_WINDOW to pricing_type lookup — moved
-- ahead of step 2 below since it resolves pricing_type_id = 'TAS' via
-- subquery; also fixed sort_order, which isn't a real column on this table
-- (V1: type_code/type_name/description/requires_index/requires_formula/is_active).
INSERT INTO dbo.pricing_type (type_code, type_name, description, requires_index, requires_formula, is_active)
VALUES
  ('TAS',           'Trade at Settlement (TAS)', 'Price = exchange daily settlement ± differential in ticks. Unknown at execution; locked when exchange publishes settlement.', 0, 0, 1),
  ('OPTION_STRIKE', 'Option Strike',              'Price determined by the strike price of an option contract at exercise.',                                                     0, 0, 1),
  ('PLATTS_WINDOW', 'Platts MOC Window',          'Price assessed during the Platts Market on Close (MOC) submission window.',                                                   1, 0, 1);
GO

-- 2b. Seed the two benchmark products TAS rules below need that were never
-- seeded anywhere in this chain (same gap V24 hit for BRENT-CRUDE/WTI-CRUDE/
-- TTF-GAS/LME-COPPER — WTI-CRUDE and BRENT-CRUDE already exist from that fix).
INSERT INTO dbo.product
    (commodity_id, product_code, product_name, settlement_type,
     default_uom_id, default_currency_id, is_active, created_by)
SELECT
    (SELECT commodity_id FROM dbo.commodity WHERE commodity_code = 'GAS'),
    'HENRY-HUB-GAS', 'Henry Hub Natural Gas', 'FINANCIAL',
    (SELECT uom_id FROM dbo.unit_of_measure WHERE uom_code = 'MMBTU'),
    (SELECT currency_id FROM dbo.currency WHERE currency_code = 'USD'),
    1, 'SYSTEM';
GO
INSERT INTO dbo.product
    (commodity_id, product_code, product_name, settlement_type,
     default_uom_id, default_currency_id, is_active, created_by)
SELECT
    (SELECT commodity_id FROM dbo.commodity WHERE commodity_code = 'OIL'),
    'HEATING-OIL', 'NYMEX Heating Oil / Ultra-Low Sulphur Diesel', 'FINANCIAL',
    (SELECT uom_id FROM dbo.unit_of_measure WHERE uom_code = 'GAL'),
    (SELECT currency_id FROM dbo.currency WHERE currency_code = 'USD'),
    1, 'SYSTEM';
GO

-- 2. Seed TAS pricing rules
-- Rewritten against dbo.pricing_rule's real schema (V6): every FK is a
-- surrogate *_id column resolved via subquery, not the flat code columns
-- (rule_code/pricing_type/price_index_code/...) this originally assumed —
-- none of those columns exist on this table. price_index_id is left NULL
-- (genuinely nullable — no CHECK enforces it non-null for TAS) since no
-- price_index seed data exists anywhere in this migration chain to resolve
-- WTI-NYMEX/HH-HENRY-HUB/HO-NYMEX/DTBRT against.
INSERT INTO dbo.pricing_rule
  (product_id, pricing_type_id, rule_code, rule_name,
   tas_exchange, tas_contract_series, tas_tick_size, is_active, created_by, updated_by)
SELECT
  (SELECT product_id FROM dbo.product WHERE product_code = 'WTI-CRUDE'),
  (SELECT pricing_type_id FROM dbo.pricing_type WHERE type_code = 'TAS'),
  'TAS-NYMEX-CL', 'WTI Crude CL Trade at Settlement', 'CME_NYMEX', 'CL', 0.010000, 1, 'SYSTEM', 'SYSTEM'
UNION ALL SELECT
  (SELECT product_id FROM dbo.product WHERE product_code = 'HENRY-HUB-GAS'),
  (SELECT pricing_type_id FROM dbo.pricing_type WHERE type_code = 'TAS'),
  'TAS-NYMEX-NG', 'Henry Hub NG Trade at Settlement', 'CME_NYMEX', 'NG', 0.001000, 1, 'SYSTEM', 'SYSTEM'
UNION ALL SELECT
  (SELECT product_id FROM dbo.product WHERE product_code = 'HEATING-OIL'),
  (SELECT pricing_type_id FROM dbo.pricing_type WHERE type_code = 'TAS'),
  'TAS-NYMEX-HO', 'Heating Oil HO Trade at Settlement', 'CME_NYMEX', 'HO', 0.000100, 1, 'SYSTEM', 'SYSTEM'
UNION ALL SELECT
  (SELECT product_id FROM dbo.product WHERE product_code = 'BRENT-CRUDE'),
  (SELECT pricing_type_id FROM dbo.pricing_type WHERE type_code = 'TAS'),
  'TAS-ICE-BZ', 'ICE Brent BZ Trade at Settlement', 'ICE_EUROPE', 'BZ', 0.010000, 1, 'SYSTEM', 'SYSTEM';
GO

-- 3. Settlement price table
-- Stores daily official close (settlement) prices published by CME/ICE.
-- is_confirmed = 1 means final published price; 0 = provisional / manually entered.
CREATE TABLE dbo.settlement_price (
  settlement_price_id  INT           IDENTITY(1,1) PRIMARY KEY,
  exchange             NVARCHAR(20)  NOT NULL,          -- CME_NYMEX | ICE_EUROPE | ICE_US
  contract_ticker      NVARCHAR(10)  NOT NULL,           -- CLZ26, NGF27, HOF27
  settle_date          DATE          NOT NULL,
  settle_price         DECIMAL(18,6) NOT NULL,
  tick_size            DECIMAL(12,6) NOT NULL,
  tick_currency        CHAR(3)       NOT NULL CONSTRAINT df_sp_tick_ccy DEFAULT 'USD',
  uom_code             VARCHAR(20)   NOT NULL,           -- BBL, MMBTU, GAL, MT
  is_confirmed         BIT           NOT NULL CONSTRAINT df_sp_confirmed DEFAULT 0,
  source               NVARCHAR(20)  NOT NULL CONSTRAINT df_sp_source DEFAULT 'MANUAL', -- CME | ICE | MANUAL
  notes                NVARCHAR(500) NULL,
  created_at           DATETIME2     NOT NULL CONSTRAINT df_sp_created DEFAULT SYSDATETIME(),
  updated_at           DATETIME2     NOT NULL CONSTRAINT df_sp_updated DEFAULT SYSDATETIME(),
  CONSTRAINT uq_settlement_price UNIQUE (exchange, contract_ticker, settle_date)
);

CREATE INDEX ix_sp_ticker_date ON dbo.settlement_price (contract_ticker, settle_date DESC);
CREATE INDEX ix_sp_exchange_date ON dbo.settlement_price (exchange, settle_date DESC);
GO

-- Seed recent settlement prices
INSERT INTO dbo.settlement_price (exchange, contract_ticker, settle_date, settle_price, tick_size, tick_currency, uom_code, is_confirmed, source)
VALUES
  ('CME_NYMEX', 'CLZ26', '2026-07-01', 72.45,  0.010000, 'USD', 'BBL',   1, 'CME'),
  ('CME_NYMEX', 'CLF27', '2026-07-01', 71.80,  0.010000, 'USD', 'BBL',   1, 'CME'),
  ('CME_NYMEX', 'NGF27', '2026-07-01', 3.456,  0.001000, 'USD', 'MMBTU', 1, 'CME'),
  ('CME_NYMEX', 'HOF27', '2026-07-01', 2.3421, 0.000100, 'USD', 'GAL',   1, 'CME'),
  ('ICE_EUROPE','BZF27', '2026-07-01', 76.23,  0.010000, 'USD', 'BBL',   1, 'ICE'),
  ('CME_NYMEX', 'CLZ26', '2026-06-30', 72.18,  0.010000, 'USD', 'BBL',   1, 'CME'),
  ('CME_NYMEX', 'NGF27', '2026-06-30', 3.456,  0.001000, 'USD', 'MMBTU', 1, 'CME');
GO

-- 4. TAS detail table — one row per trade_order that uses TAS pricing
-- Locked price = settlement_price.settle_price + (tas_differential × pricing_rule.tas_tick_size)
CREATE TABLE dbo.trade_order_tas (
  order_tas_id         INT         IDENTITY(1,1) PRIMARY KEY,
  order_id             INT         NOT NULL,
  tas_contract_ticker  NVARCHAR(10) NOT NULL,           -- CLZ26, NGF27 — specific month
  tas_differential     SMALLINT    NOT NULL CONSTRAINT df_tas_diff DEFAULT 0, -- signed ticks (+2, 0, -1)
  tas_status           NVARCHAR(25) NOT NULL CONSTRAINT df_tas_status DEFAULT 'AWAITING_SETTLEMENT',
  tas_locked_price     DECIMAL(18,6) NULL,              -- set when settlement confirmed
  tas_settlement_date  DATE        NULL,                -- date the price was locked
  created_at           DATETIME2   NOT NULL CONSTRAINT df_tas_created DEFAULT SYSDATETIME(),
  updated_at           DATETIME2   NOT NULL CONSTRAINT df_tas_updated DEFAULT SYSDATETIME(),
  CONSTRAINT fk_order_tas_order FOREIGN KEY (order_id) REFERENCES dbo.trade_order(order_id),
  CONSTRAINT uq_order_tas UNIQUE (order_id),
  CONSTRAINT chk_tas_status CHECK (tas_status IN ('AWAITING_SETTLEMENT', 'PRICE_LOCKED'))
);

CREATE INDEX ix_order_tas_status ON dbo.trade_order_tas (tas_status, tas_contract_ticker);
GO
