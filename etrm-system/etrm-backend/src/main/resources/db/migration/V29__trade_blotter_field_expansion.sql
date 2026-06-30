-- =============================================================================
-- V29 — Trade Blotter Field Expansion
--
-- Adds the following field groups to the trade table and commodity detail tables:
--
--   TRADE (all trades):
--     contract_type              — SPOT | DAILY | WEEKLY | MONTHLY | QUARTERLY | ANNUAL | TERM
--     risk_start_date            — First day of commodity price risk exposure (MANDATORY for position)
--     risk_end_date              — Last day of commodity price risk exposure  (MANDATORY for position)
--     broker_id                  — FK to broker table (nullable — direct trades have no broker)
--     broker_fee_type            — FIXED | PERCENTAGE
--     broker_fee                 — Fee amount (per lot) or rate (percent)
--     broker_fee_currency_code   — Currency of the broker fee
--     credit_term_code           — NET_30 | NET_45 | NET_60 | PREPAY | CASH_ON_DELIVERY | etc.
--     credit_approval_status     — PENDING | APPROVED | REJECTED | EXEMPT
--     credit_limit_used          — Credit exposure consumed by this trade (informational)
--     gtc_reference              — Legal GTC reference (EFET-GAS-2002, ISDA-2002, GTMA, etc.)
--
--   TRADE_OIL_DETAIL:
--     mot_type                   — Method of Transport: TANKER | PIPELINE | BARGE | TRUCK
--     title_transfer_location_code — Where ownership passes (may differ from load/discharge port)
--
--   TRADE_LNG_DETAIL:
--     mot_type                   — Always SHIP for LNG (kept for uniformity)
--     title_transfer_location_code — Load terminal (FOB) or discharge terminal (DES/DAP)
--
--   TRADE_METALS_DETAIL:
--     mot_type                   — SHIP | TRUCK | RAIL | BARGE
--     title_transfer_location_code — LME warehouse or contractual delivery point
--
--   TRADE_AGRI_DETAIL:
--     mot_type                   — SHIP | BARGE | TRUCK | RAIL
--
--   NEW TABLE: broker
--     Master list of voice brokers and electronic platforms.
-- =============================================================================

-- ── Broker master table ──────────────────────────────────────────────────────
CREATE TABLE dbo.broker (
    broker_id       INT             NOT NULL IDENTITY(1,1),
    broker_code     VARCHAR(30)     NOT NULL,
    broker_name     VARCHAR(120)    NOT NULL,
    is_active       BIT             NOT NULL DEFAULT 1,
    created_at      DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT pk_broker            PRIMARY KEY (broker_id),
    CONSTRAINT uq_broker_code       UNIQUE      (broker_code)
);
GO

INSERT INTO dbo.broker (broker_code, broker_name) VALUES
    ('ICAP',      'ICAP Energy'),
    ('GFI',       'GFI Group Commodities'),
    ('BGC',       'BGC Partners Energy'),
    ('TRADITION', 'Tradition Financial Services'),
    ('TP-ICAP',   'TP ICAP Global Broking'),
    ('TULLETT',   'Tullett Prebon');
GO

-- ── Trade table additions ────────────────────────────────────────────────────
ALTER TABLE dbo.trade
    ADD contract_type              VARCHAR(15)     NULL,
        risk_start_date            DATE            NULL,
        risk_end_date              DATE            NULL,
        broker_id                  INT             NULL,
        broker_fee_type            VARCHAR(15)     NULL,
        broker_fee                 DECIMAL(14,6)   NULL,
        broker_fee_currency_code   VARCHAR(5)      NULL,
        credit_term_code           VARCHAR(20)     NULL,
        credit_approval_status     VARCHAR(15)     NULL,
        credit_limit_used          DECIMAL(18,4)   NULL,
        gtc_reference              VARCHAR(100)    NULL

        CONSTRAINT chk_trade_contract_type CHECK (
            contract_type IS NULL OR
            contract_type IN ('SPOT','DAILY','WEEKLY','MONTHLY','QUARTERLY','ANNUAL','TERM')
        ),
        CONSTRAINT chk_trade_broker_fee_type CHECK (
            broker_fee_type IS NULL OR broker_fee_type IN ('FIXED','PERCENTAGE')
        ),
        CONSTRAINT chk_trade_credit_approval CHECK (
            credit_approval_status IS NULL OR
            credit_approval_status IN ('PENDING','APPROVED','REJECTED','EXEMPT')
        );
GO

ALTER TABLE dbo.trade
    ADD CONSTRAINT fk_trade_broker FOREIGN KEY (broker_id) REFERENCES dbo.broker(broker_id);
GO

-- ── Oil detail additions ─────────────────────────────────────────────────────
ALTER TABLE dbo.trade_oil_detail
    ADD mot_type                      VARCHAR(15)  NULL,
        title_transfer_location_code  VARCHAR(30)  NULL

        CONSTRAINT chk_oil_mot CHECK (
            mot_type IS NULL OR mot_type IN ('TANKER','PIPELINE','BARGE','TRUCK')
        );
GO

-- ── LNG detail additions ─────────────────────────────────────────────────────
ALTER TABLE dbo.trade_lng_detail
    ADD mot_type                      VARCHAR(15)  NULL,
        title_transfer_location_code  VARCHAR(30)  NULL

        CONSTRAINT chk_lng_mot CHECK (
            mot_type IS NULL OR mot_type IN ('SHIP')
        );
GO

-- ── Metals detail additions ──────────────────────────────────────────────────
ALTER TABLE dbo.trade_metals_detail
    ADD mot_type                      VARCHAR(15)  NULL,
        title_transfer_location_code  VARCHAR(30)  NULL

        CONSTRAINT chk_metals_mot CHECK (
            mot_type IS NULL OR mot_type IN ('SHIP','TRUCK','RAIL','BARGE')
        );
GO

-- ── Agri detail additions ────────────────────────────────────────────────────
ALTER TABLE dbo.trade_agri_detail
    ADD mot_type  VARCHAR(15)  NULL

        CONSTRAINT chk_agri_mot CHECK (
            mot_type IS NULL OR mot_type IN ('SHIP','BARGE','TRUCK','RAIL')
        );
GO

PRINT 'V29 APPLIED: Trade blotter field expansion complete.';
PRINT '  trade: contract_type, risk_start_date, risk_end_date, broker_*, credit_*, gtc_reference';
PRINT '  trade_oil_detail: mot_type, title_transfer_location_code';
PRINT '  trade_lng_detail: mot_type, title_transfer_location_code';
PRINT '  trade_metals_detail: mot_type, title_transfer_location_code';
PRINT '  trade_agri_detail: mot_type';
PRINT '  NEW TABLE: broker (6 seed rows)';
PRINT '';
PRINT 'NOTE: risk_start_date and risk_end_date are nullable at the DB level but the';
PRINT '  application enforces them as REQUIRED for CONFIRMED trades. Existing DRAFT';
PRINT '  records will have NULL until users populate them.';
