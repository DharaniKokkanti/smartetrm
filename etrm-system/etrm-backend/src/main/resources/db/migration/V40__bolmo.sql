-- ============================================================
-- V40 — BOLMO (Book Out / Let Me Out)
-- Bilateral physical delivery netting via cash settlement.
-- Two counterparties with offsetting obligations agree to cancel
-- physical movement and settle the price differential in cash.
-- ============================================================

-- ── bolmo_agreement — agreement header ──────────────────────
CREATE TABLE dbo.bolmo_agreement (
    bolmo_id              INT IDENTITY(1,1) NOT NULL,
    bolmo_reference       VARCHAR(25)       NOT NULL,   -- BKO-YYYY-NNNNN
    counterparty_id       INT               NOT NULL,
    legal_entity_id       INT               NOT NULL,
    agreement_date        DATE              NOT NULL,
    settlement_date       DATE              NULL,        -- cash settlement due date
    commodity_type        VARCHAR(20)       NOT NULL,
    delivery_location_code VARCHAR(50)      NULL,
    delivery_period_code  VARCHAR(30)       NULL,        -- M2026-07, Q3-2026, SPOT
    net_quantity          DECIMAL(18,6)     NOT NULL,
    uom_code              VARCHAR(20)       NOT NULL,
    netting_price         DECIMAL(18,6)     NULL,        -- agreed cash settlement reference price
    currency_code         CHAR(3)           NOT NULL DEFAULT 'USD',
    status                VARCHAR(20)       NOT NULL DEFAULT 'PENDING',
    notes                 NVARCHAR(1000)    NULL,
    created_at            DATETIME2         NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at            DATETIME2         NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_bolmo_agreement   PRIMARY KEY (bolmo_id),
    CONSTRAINT uq_bolmo_reference   UNIQUE (bolmo_reference),
    CONSTRAINT fk_bolmo_counterparty FOREIGN KEY (counterparty_id) REFERENCES dbo.counterparty (counterparty_id),
    CONSTRAINT fk_bolmo_legal_entity FOREIGN KEY (legal_entity_id) REFERENCES dbo.legal_entity (legal_entity_id),
    CONSTRAINT ck_bolmo_status      CHECK (status IN ('PENDING','AGREED','COMPLETED','DISPUTED','CANCELLED')),
    CONSTRAINT ck_bolmo_net_qty     CHECK (net_quantity > 0)
);

CREATE UNIQUE INDEX ix_bolmo_ref ON dbo.bolmo_agreement (bolmo_reference);
CREATE        INDEX ix_bolmo_cp   ON dbo.bolmo_agreement (counterparty_id, status);

-- ── bolmo_leg — individual trade legs being booked out ──────
CREATE TABLE dbo.bolmo_leg (
    leg_id        INT IDENTITY(1,1) NOT NULL,
    bolmo_id      INT               NOT NULL,
    order_id      INT               NULL,               -- FK to trade_order (optional link)
    direction     VARCHAR(4)        NOT NULL,            -- BUY | SELL
    quantity      DECIMAL(18,6)     NOT NULL,
    uom_code      VARCHAR(20)       NOT NULL,
    price         DECIMAL(18,6)     NULL,               -- original leg price (for cash settlement calc)
    notes         NVARCHAR(500)     NULL,
    created_at    DATETIME2         NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_bolmo_leg         PRIMARY KEY (leg_id),
    CONSTRAINT fk_bolmo_leg_hdr     FOREIGN KEY (bolmo_id) REFERENCES dbo.bolmo_agreement (bolmo_id) ON DELETE CASCADE,
    CONSTRAINT fk_bolmo_leg_order   FOREIGN KEY (order_id)  REFERENCES dbo.trade_order (order_id),
    CONSTRAINT ck_bolmo_direction   CHECK (direction IN ('BUY','SELL')),
    CONSTRAINT ck_bolmo_leg_qty     CHECK (quantity > 0)
);

CREATE INDEX ix_bolmo_leg_bolmo ON dbo.bolmo_leg (bolmo_id);
CREATE INDEX ix_bolmo_leg_order ON dbo.bolmo_leg (order_id) WHERE order_id IS NOT NULL;

-- ── Seed data ───────────────────────────────────────────────
-- Guarded: assumes counterparty_id 1/3/7 and legal_entity_id 1 already exist
-- (mirroring frontend MSW mock ids) — nothing in this migration chain seeds
-- dbo.counterparty/dbo.legal_entity, so on a genuinely fresh database this
-- is a no-op rather than an FK-violation failure (same gap as V33's trade
-- seed data).
IF EXISTS (SELECT 1 FROM dbo.counterparty WHERE counterparty_id IN (1, 3, 7))
   AND EXISTS (SELECT 1 FROM dbo.legal_entity WHERE legal_entity_id = 1)
BEGIN
INSERT INTO dbo.bolmo_agreement
    (bolmo_reference, counterparty_id, legal_entity_id, agreement_date, settlement_date,
     commodity_type, delivery_location_code, delivery_period_code, net_quantity, uom_code,
     netting_price, currency_code, status, notes)
VALUES
    ('BKO-2026-00001', 7, 1, '2026-06-28', '2026-07-10', 'OIL', 'SULLOM-VOE', 'M2026-07',
     250000, 'BBL', 82.00, 'USD', 'AGREED',
     'Forties blend offsetting obligations — physical delivery avoided via book-out.'),
    ('BKO-2026-00002', 3, 1, '2026-06-29', NULL, 'GAS', 'TTF-NL', 'M2026-08',
     50000, 'MWH', 34.00, 'EUR', 'PENDING',
     'TTF Aug-26 balancing position — counterparty confirmation pending.'),
    ('BKO-2026-00003', 1, 1, '2026-06-15', '2026-06-25', 'OIL', 'ROTTERDAM', 'M2026-07',
     100000, 'BBL', 80.50, 'USD', 'COMPLETED',
     'ARA ULSD book-out — completed and cash-settled. Net receivable USD 50,000.');

-- Leg seeds (bolmo_id = SCOPE_IDENTITY of each row above — use known IDs post-seed)
INSERT INTO dbo.bolmo_leg (bolmo_id, order_id, direction, quantity, uom_code, price, notes) VALUES
    (1, NULL, 'BUY',  250000, 'BBL', 81.50, 'Vitol Forties parcel BUY — TRD-2026-00003'),
    (1, NULL, 'SELL', 250000, 'BBL', 82.50, 'Vitol Forties parcel SELL — TRD-2026-00004'),
    (2, NULL, 'BUY',   50000, 'MWH', 33.80, 'Equinor TTF Aug BUY'),
    (2, NULL, 'SELL',  50000, 'MWH', 34.20, 'Equinor TTF Aug SELL'),
    (3, NULL, 'BUY',  100000, 'BBL', 80.00, 'Shell ULSD Rotterdam BUY'),
    (3, NULL, 'SELL', 100000, 'BBL', 81.00, 'Shell ULSD Rotterdam SELL');
END
