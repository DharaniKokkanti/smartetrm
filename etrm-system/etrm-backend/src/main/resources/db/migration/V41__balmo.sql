-- ============================================================
-- V41 — BALMO (Balance of Month swap pricing)
-- Exchange-cleared partial-month average price swap.
-- Pricing window = [booking/trade date → last business day of
-- contract month]. Float price = arithmetic average of daily
-- front-month futures settlements for each business day in window.
-- Listed on CME NYMEX (J42 for WTI CL) and ICE (Brent BZ).
-- ============================================================

-- ── balmo_product — monthly contract listing ─────────────────
-- One row per month per product series. New row added each month
-- when the exchange lists the new BALMO contract.
CREATE TABLE dbo.balmo_product (
    balmo_product_id          INT IDENTITY(1,1) NOT NULL,
    product_code              VARCHAR(30)       NOT NULL,   -- BALMO-CL-2026-07
    product_name              NVARCHAR(120)     NOT NULL,
    exchange                  VARCHAR(20)       NOT NULL,   -- CME_NYMEX | ICE_EUROPE | ICE_US
    contract_series           VARCHAR(20)       NOT NULL,   -- CL | NG | HO | RB | BZ | GAS_OIL | HH
    contract_month            CHAR(7)           NOT NULL,   -- YYYY-MM
    pricing_start_date        DATE              NOT NULL,   -- first business day (or booking date for current month)
    pricing_end_date          DATE              NOT NULL,   -- last business day of contract month
    last_trading_date         DATE              NOT NULL,   -- last day BALMO can be transacted
    settlement_price_ticker   VARCHAR(10)       NOT NULL,   -- front-month futures ticker: CLN26, BZN26
    tick_size                 DECIMAL(12,6)     NOT NULL,
    tick_currency             CHAR(3)           NOT NULL DEFAULT 'USD',
    uom_code                  VARCHAR(20)       NOT NULL,
    price_source              VARCHAR(20)       NOT NULL,   -- CME | ICE | PLATTS | BLOOMBERG | MANUAL
    status                    VARCHAR(20)       NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | EXPIRED | SUSPENDED
    notes                     NVARCHAR(500)     NULL,
    created_at                DATETIME2         NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at                DATETIME2         NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_balmo_product      PRIMARY KEY (balmo_product_id),
    CONSTRAINT uq_balmo_product_code UNIQUE (product_code),
    CONSTRAINT ck_balmo_product_exch CHECK (exchange IN ('CME_NYMEX','ICE_EUROPE','ICE_US')),
    CONSTRAINT ck_balmo_status       CHECK (status IN ('ACTIVE','EXPIRED','SUSPENDED')),
    CONSTRAINT ck_balmo_pricing_win  CHECK (pricing_end_date >= pricing_start_date)
);

CREATE UNIQUE INDEX ix_balmo_prod_code    ON dbo.balmo_product (product_code);
CREATE        INDEX ix_balmo_prod_month   ON dbo.balmo_product (contract_month, exchange, contract_series);
CREATE        INDEX ix_balmo_prod_status  ON dbo.balmo_product (status) WHERE status = 'ACTIVE';

-- ── trade_order_balmo — per-order BALMO detail ───────────────
-- Attached to a trade_order when the pricing rule is BALMO type.
-- Tracks the running average and final settlement.
CREATE TABLE dbo.trade_order_balmo (
    order_id                  INT               NOT NULL,
    balmo_product_id          INT               NOT NULL,
    pricing_start_date        DATE              NOT NULL,   -- booking date = first pricing day
    pricing_end_date          DATE              NOT NULL,   -- last business day of contract month
    contract_month            CHAR(7)           NOT NULL,
    balmo_status              VARCHAR(20)       NOT NULL DEFAULT 'ACTIVE',
    running_avg_price         DECIMAL(18,6)     NULL,       -- updated daily via settlement prices
    elapsed_pricing_days      INT               NULL,       -- business days elapsed in window
    total_pricing_days        INT               NULL,       -- total business days in window
    final_settled_price       DECIMAL(18,6)     NULL,       -- final average on pricing end date
    updated_at                DATETIME2         NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_trade_order_balmo       PRIMARY KEY (order_id),
    CONSTRAINT fk_balmo_order             FOREIGN KEY (order_id)          REFERENCES dbo.trade_order (order_id) ON DELETE CASCADE,
    CONSTRAINT fk_balmo_order_product     FOREIGN KEY (balmo_product_id)  REFERENCES dbo.balmo_product (balmo_product_id),
    CONSTRAINT ck_balmo_order_status      CHECK (balmo_status IN ('ACTIVE','PRICING_COMPLETE','SETTLED')),
    CONSTRAINT ck_balmo_order_pricing_win CHECK (pricing_end_date >= pricing_start_date)
);

CREATE INDEX ix_tob_product ON dbo.trade_order_balmo (balmo_product_id);
CREATE INDEX ix_tob_status  ON dbo.trade_order_balmo (balmo_status) WHERE balmo_status = 'ACTIVE';

-- ── pricing_type — insert BALMO ──────────────────────────────
INSERT INTO dbo.pricing_type (type_code, type_name, description, sort_order, is_active)
VALUES ('BALMO', 'Balance of Month (BALMO)',
    'Exchange-cleared partial-month average price swap. Pricing window = booking date → last business day of contract month. Floating price = arithmetic average of daily front-month futures settlements over that window.',
    9, 1);

-- ── Seed data — BALMO products (Jul/Aug 2026) ───────────────
INSERT INTO dbo.balmo_product
    (product_code, product_name, exchange, contract_series, contract_month,
     pricing_start_date, pricing_end_date, last_trading_date,
     settlement_price_ticker, tick_size, tick_currency, uom_code, price_source, status, notes)
VALUES
    ('BALMO-CL-2026-07', 'WTI Crude CL Balance of Month July 2026',
     'CME_NYMEX', 'CL', '2026-07', '2026-07-01', '2026-07-31', '2026-07-01',
     'CLN26', 0.01, 'USD', 'BBL', 'CME', 'ACTIVE',
     'CME NYMEX WTI BALMO Jul26 — front month CLN26 settlements averaged over pricing window'),
    ('BALMO-CL-2026-08', 'WTI Crude CL Balance of Month August 2026',
     'CME_NYMEX', 'CL', '2026-08', '2026-08-01', '2026-08-29', '2026-08-01',
     'CLQ26', 0.01, 'USD', 'BBL', 'CME', 'ACTIVE',
     'CME NYMEX WTI BALMO Aug26 — front month CLQ26 settlements'),
    ('BALMO-BZ-2026-07', 'ICE Brent BZ Balance of Month July 2026',
     'ICE_EUROPE', 'BZ', '2026-07', '2026-07-01', '2026-07-31', '2026-07-01',
     'BZN26', 0.01, 'USD', 'BBL', 'ICE', 'ACTIVE',
     'ICE Brent BALMO Jul26 — BZN26 daily settlements averaged'),
    ('BALMO-HO-2026-07', 'Heating Oil HO Balance of Month July 2026',
     'CME_NYMEX', 'HO', '2026-07', '2026-07-01', '2026-07-31', '2026-07-01',
     'HON26', 0.0001, 'USD', 'GAL', 'CME', 'ACTIVE',
     'CME NYMEX ULSD/Heating Oil BALMO Jul26 — HON26 settlements');

-- ── Seed data — trade_order_balmo entries ───────────────────
-- Link to orderId 14 (WTI BALMO Buy BP) and orderId 15 (Brent BALMO Sell Glencore)
INSERT INTO dbo.trade_order_balmo
    (order_id, balmo_product_id, pricing_start_date, pricing_end_date,
     contract_month, balmo_status, running_avg_price, elapsed_pricing_days,
     total_pricing_days, final_settled_price)
VALUES
    (14, 1, '2026-07-01', '2026-07-31', '2026-07', 'ACTIVE', 72.31, 1, 23, NULL),
    (15, 3, '2026-07-01', '2026-07-31', '2026-07', 'ACTIVE', 76.23, 1, 23, NULL);
