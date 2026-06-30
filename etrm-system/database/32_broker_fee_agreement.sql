-- =============================================================================
-- V32 — Broker Fee Agreement Table
--
-- Stores standing rate cards between the firm and each IDB broker.
-- When a trade is captured with a brokerId, the system looks up the applicable
-- agreement row to auto-populate brokerFeeType, brokerFee, and brokerFeeCurrencyCode.
--
-- FEE TYPES:
--   PER_LOT        — Fixed $ per unit of measure (e.g. $0.02/BBL, $0.01/MWH, $1.00/MT)
--                    Most common for physical OTC cargo and OTC swaps.
--   PCT_NOTIONAL   — Percentage of trade notional value (e.g. 0.05%)
--                    Common for financial/swap trades where volume varies widely.
--   FLAT_PER_TRADE — Fixed $ amount per individual trade (e.g. $2,500 per freight voyage)
--                    Common for freight, LNG, and bespoke structured deals.
--   FLAT_MONTHLY   — Fixed monthly retainer regardless of volume traded.
--                    Often a minimum guarantee alongside a per-lot rate.
--
-- PAY PERIODS (how often fees are invoiced):
--   PER_TRADE   — Invoice issued per individual trade (freight, bespoke)
--   MONTHLY     — Aggregate all fees for the calendar month, invoice at month end
--   QUARTERLY   — Aggregate fees per quarter (Q1/Q2/Q3/Q4)
--   SEMI_ANNUAL — Twice per year (H1/H2)
--   ANNUAL      — Annual invoice (retainer or fixed fee arrangements)
--
-- LOOKUP LOGIC:
--   When broker_id matches AND commodity_type matches (or IS NULL = applies to all)
--   AND product_id matches (or IS NULL = applies to all products)
--   AND trade_date BETWEEN effective_from AND COALESCE(effective_to, '9999-12-31')
--   → use this agreement's fee_type and fee_rate.
--   Multiple rows can match — rank by specificity: product_id > commodity_type > NULL.
-- =============================================================================

CREATE TABLE dbo.broker_fee_agreement (
    agreement_id        INT             NOT NULL IDENTITY(1,1),
    broker_id           INT             NOT NULL,
    agreement_code      VARCHAR(30)     NOT NULL,
    description         NVARCHAR(300)   NULL,

    -- Scope: which trades this rate applies to
    commodity_type      VARCHAR(20)     NULL,   -- NULL = applies to all commodities
    product_id          INT             NULL,   -- NULL = applies to all products in commodity
    trade_type          VARCHAR(15)     NULL,   -- NULL = PHYSICAL and FINANCIAL both

    -- Fee structure
    fee_type            VARCHAR(20)     NOT NULL,
    fee_rate            DECIMAL(18,6)   NOT NULL,
    fee_currency_code   CHAR(3)         NOT NULL DEFAULT 'USD',
    uom_code            VARCHAR(10)     NULL,   -- required when fee_type = PER_LOT

    -- Invoicing
    pay_period          VARCHAR(15)     NOT NULL DEFAULT 'MONTHLY',
    payment_due_days    INT             NOT NULL DEFAULT 30,  -- days after period close
    minimum_fee         DECIMAL(14,2)   NULL,   -- period minimum (overrides if rate × volume < min)
    maximum_fee         DECIMAL(14,2)   NULL,   -- period cap

    -- Validity
    effective_from      DATE            NOT NULL,
    effective_to        DATE            NULL,   -- NULL = open-ended
    is_active           BIT             NOT NULL DEFAULT 1,
    created_at          DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT pk_broker_fee_agreement      PRIMARY KEY (agreement_id),
    CONSTRAINT uq_bfa_code                  UNIQUE (agreement_code),
    CONSTRAINT fk_bfa_broker                FOREIGN KEY (broker_id) REFERENCES dbo.broker(broker_id),
    CONSTRAINT fk_bfa_product               FOREIGN KEY (product_id) REFERENCES dbo.product(product_id),
    CONSTRAINT chk_bfa_fee_type             CHECK (fee_type IN ('PER_LOT','PCT_NOTIONAL','FLAT_PER_TRADE','FLAT_MONTHLY')),
    CONSTRAINT chk_bfa_pay_period           CHECK (pay_period IN ('PER_TRADE','MONTHLY','QUARTERLY','SEMI_ANNUAL','ANNUAL')),
    CONSTRAINT chk_bfa_trade_type           CHECK (trade_type IS NULL OR trade_type IN ('PHYSICAL','FINANCIAL')),
    CONSTRAINT chk_bfa_dates                CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT chk_bfa_rate                 CHECK (fee_rate >= 0),
    CONSTRAINT chk_bfa_min_max              CHECK (maximum_fee IS NULL OR minimum_fee IS NULL OR maximum_fee >= minimum_fee)
);
GO

CREATE INDEX ix_bfa_broker_active ON dbo.broker_fee_agreement (broker_id, is_active, effective_from, effective_to);
CREATE INDEX ix_bfa_commodity     ON dbo.broker_fee_agreement (commodity_type, is_active);
GO

-- ── Seed data — realistic IDB rate cards ─────────────────────────────────────
INSERT INTO dbo.broker_fee_agreement
  (broker_id, agreement_code, description, commodity_type, product_id, trade_type,
   fee_type, fee_rate, fee_currency_code, uom_code, pay_period, payment_due_days,
   minimum_fee, maximum_fee, effective_from, effective_to)
VALUES
  -- ICAP: crude oil $0.02/BBL, invoiced monthly, min $2,000/month
  (1, 'ICAP-OIL-2026',      'ICAP Energy OTC crude oil rate. Covers North Sea and Mediterranean physical cargoes and OTC Brent/WTI swaps.',
   'OIL',   NULL, NULL, 'PER_LOT',       0.020000, 'USD', 'BBL',   'MONTHLY',  30, 2000.00,  NULL,     '2026-01-01', NULL),

  -- BGC: crude oil $0.03/BBL, monthly, $3,000 min
  (3, 'BGC-OIL-2026',       'BGC Partners crude oil and products rate. Covers Mediterranean and West African physical cargoes.',
   'OIL',   NULL, NULL, 'PER_LOT',       0.030000, 'USD', 'BBL',   'MONTHLY',  30, 3000.00,  NULL,     '2026-01-01', NULL),

  -- TP-ICAP: natural gas €0.01/MWH, monthly
  (5, 'TPICAP-GAS-2026',    'TP ICAP gas brokerage. Covers TTF, NBP, NCG, PEG. Voice and Parameta electronic.',
   'GAS',   NULL, NULL, 'PER_LOT',       0.010000, 'EUR', 'MWH',   'MONTHLY',  30, 1500.00,  NULL,     '2026-01-01', NULL),

  -- GFI: power €0.015/MWH, monthly
  (2, 'GFI-POWER-2026',     'GFI Group power brokerage. EEX Germany baseload/peak, French and Belgian power OTC.',
   'POWER',  NULL, NULL, 'PER_LOT',       0.015000, 'EUR', 'MWH',   'MONTHLY',  30, 1000.00,  NULL,     '2026-01-01', NULL),

  -- Tradition: freight $2,500 flat per voyage, invoiced per trade
  (4, 'TRADITION-FREIGHT-2026', 'Tradition freight brokerage. Flat fee per voyage for TD3C, TC2, and BS3 routes. BIMCO proforma.',
   'FREIGHT', NULL, NULL, 'FLAT_PER_TRADE', 2500.000000, 'USD', NULL, 'PER_TRADE', 5, NULL, NULL, '2026-01-01', NULL),

  -- Tullett: LME metals $1.00/MT, monthly, $2,000 min
  (6, 'TULLETT-METALS-2026', 'Tullett Prebon metals brokerage. LME copper, aluminium, zinc, nickel. Cash and 3-month contracts.',
   'METALS', NULL, NULL, 'PER_LOT',       1.000000, 'USD', 'MT',    'MONTHLY',  30, 2000.00,  NULL,     '2026-01-01', NULL),

  -- ICAP: OTC Brent financial swaps — 0.04% of notional (higher rate for financial)
  (1, 'ICAP-OIL-FIN-2026',  'ICAP Energy financial OTC rate. Applies to Brent and WTI OTC swap and CFD trades only.',
   'OIL',   NULL, 'FINANCIAL', 'PCT_NOTIONAL', 0.000400, 'USD', NULL, 'MONTHLY',  30, NULL, NULL, '2026-01-01', NULL),

  -- Spark: LNG electronic platform — $0.01/MMBTU
  (7, 'SPARK-LNG-2026',     'Spark Commodities electronic LNG brokerage. JKM spot, FOB Atlantic, DES regas. Pure electronic — no voice.',
   'LNG',    NULL, NULL, 'PER_LOT',       0.010000, 'USD', 'MMBTU', 'MONTHLY',  30, NULL,    5000.00,  '2026-01-01', NULL);
GO

PRINT 'V32 APPLIED: dbo.broker_fee_agreement created with 7 seed rate cards.';
PRINT '  fee_type: PER_LOT | PCT_NOTIONAL | FLAT_PER_TRADE | FLAT_MONTHLY';
PRINT '  pay_period: PER_TRADE | MONTHLY | QUARTERLY | SEMI_ANNUAL | ANNUAL';
PRINT '  Scope: commodity_type NULL = all commodities, product_id NULL = all products.';
PRINT '  Lookup priority: product_id match > commodity_type match > NULL (catch-all).';
