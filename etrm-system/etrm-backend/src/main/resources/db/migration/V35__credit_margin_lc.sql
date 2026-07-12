-- ============================================================
-- V35 — Credit & Risk master data tables
--       dbo.margin_agreement   — CSA / pledge parameters per counterparty
--       dbo.credit_limit       — pre-settlement, settlement, MTM limits
--       dbo.letter_of_credit   — standby / documentary / revolving LCs
-- ============================================================

-- ── dbo.margin_agreement ─────────────────────────────────────────────────────
CREATE TABLE dbo.margin_agreement (
    margin_agreement_id         INT             NOT NULL IDENTITY(1,1) PRIMARY KEY,
    agreement_code              NVARCHAR(50)    NOT NULL,
    agreement_type              NVARCHAR(20)    NOT NULL
        CONSTRAINT chk_margin_agr_type CHECK (agreement_type IN (
            'CSA_BILATERAL', 'CSA_ONE_WAY_IN', 'CSA_ONE_WAY_OUT', 'PLEDGE', 'CTA'
        )),
    counterparty_id             INT             NOT NULL
        CONSTRAINT fk_margin_agr_cp REFERENCES dbo.counterparty (counterparty_id),
    -- Our threshold: if MTM > threshold, CP must post collateral
    threshold_amount            DECIMAL(18,2)   NOT NULL DEFAULT 0,
    threshold_currency          CHAR(3)        NOT NULL DEFAULT 'USD',
    -- CP threshold: if MTM < -threshold, we must post collateral
    cp_threshold_amount         DECIMAL(18,2)   NOT NULL DEFAULT 0,
    cp_threshold_currency       CHAR(3)        NOT NULL DEFAULT 'USD',
    -- Minimum Transfer Amount
    mta_amount                  DECIMAL(18,2)   NOT NULL DEFAULT 0,
    mta_currency                CHAR(3)        NOT NULL DEFAULT 'USD',
    -- Independent Amount / Initial Margin
    independent_amount          DECIMAL(18,2)   NULL,
    independent_amount_currency CHAR(3)        NULL,
    rounding_amount             DECIMAL(18,2)   NULL,
    valuation_frequency         NVARCHAR(10)    NOT NULL DEFAULT 'DAILY'
        CONSTRAINT chk_margin_val_freq CHECK (valuation_frequency IN ('DAILY', 'WEEKLY', 'MONTHLY')),
    eligible_collateral         NVARCHAR(500)   NULL,
    eligible_currencies         NVARCHAR(100)   NULL,
    gov_law                     NVARCHAR(15)    NOT NULL DEFAULT 'ENGLISH'
        CONSTRAINT chk_margin_gov_law CHECK (gov_law IN ('ENGLISH', 'NEW_YORK', 'OTHER')),
    effective_date              DATE            NOT NULL,
    expiry_date                 DATE            NULL,
    is_active                   BIT             NOT NULL DEFAULT 1,
    notes                       NVARCHAR(1000)  NULL,
    created_at                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT uq_margin_agreement_code UNIQUE (agreement_code)
);
GO

CREATE NONCLUSTERED INDEX IX_margin_agreement_cp
    ON dbo.margin_agreement (counterparty_id, is_active);
GO

-- ── dbo.credit_limit ─────────────────────────────────────────────────────────
CREATE TABLE dbo.credit_limit (
    credit_limit_id             INT             NOT NULL IDENTITY(1,1) PRIMARY KEY,
    counterparty_id             INT             NOT NULL
        CONSTRAINT fk_credit_limit_cp REFERENCES dbo.counterparty (counterparty_id),
    limit_type                  NVARCHAR(20)    NOT NULL
        CONSTRAINT chk_credit_limit_type CHECK (limit_type IN (
            'SETTLEMENT', 'PRE_SETTLEMENT', 'DELIVERY', 'MARK_TO_MARKET'
        )),
    limit_amount                DECIMAL(18,2)   NOT NULL,
    limit_currency              CHAR(3)        NOT NULL DEFAULT 'USD',
    used_amount                 DECIMAL(18,2)   NOT NULL DEFAULT 0,
    -- available_amount is computed: limit_amount - used_amount (not stored)
    -- utilisation_pct is computed: used_amount / limit_amount * 100 (not stored)
    effective_date              DATE            NOT NULL,
    expiry_date                 DATE            NULL,
    approved_by                 NVARCHAR(100)   NULL,
    approval_date               DATE            NULL,
    status                      NVARCHAR(15)    NOT NULL DEFAULT 'ACTIVE'
        CONSTRAINT chk_credit_limit_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED')),
    netting_agreement_ref       NVARCHAR(100)   NULL,
    is_active                   BIT             NOT NULL DEFAULT 1,
    notes                       NVARCHAR(1000)  NULL,
    created_at                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE NONCLUSTERED INDEX IX_credit_limit_cp_type
    ON dbo.credit_limit (counterparty_id, limit_type, status)
    INCLUDE (limit_amount, used_amount, limit_currency);
GO

-- ── dbo.letter_of_credit ─────────────────────────────────────────────────────
-- V5 created an older letter_of_credit schema; drop dependent FKs then replace it.
IF OBJECT_ID('dbo.lc_amendment', 'U') IS NOT NULL
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_lca_lc' AND parent_object_id = OBJECT_ID('dbo.lc_amendment'))
        ALTER TABLE dbo.lc_amendment DROP CONSTRAINT fk_lca_lc;
IF OBJECT_ID('dbo.collateral', 'U') IS NOT NULL
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_coll_lc' AND parent_object_id = OBJECT_ID('dbo.collateral'))
        ALTER TABLE dbo.collateral DROP CONSTRAINT fk_coll_lc;
IF OBJECT_ID('dbo.letter_of_credit', 'U') IS NOT NULL DROP TABLE dbo.letter_of_credit;
GO

CREATE TABLE dbo.letter_of_credit (
    lc_id                       INT             NOT NULL IDENTITY(1,1) PRIMARY KEY,
    lc_reference                NVARCHAR(80)    NOT NULL,
    lc_type                     NVARCHAR(15)    NOT NULL
        CONSTRAINT chk_lc_type CHECK (lc_type IN ('STANDBY', 'DOCUMENTARY', 'REVOLVING', 'TRANSFERABLE')),
    status                      NVARCHAR(20)    NOT NULL DEFAULT 'ACTIVE'
        CONSTRAINT chk_lc_status CHECK (status IN (
            'ACTIVE', 'EXPIRED', 'CANCELLED', 'PARTIALLY_DRAWN', 'FULLY_DRAWN'
        )),
    counterparty_id             INT             NOT NULL     -- applicant (CP)
        CONSTRAINT fk_lc_cp REFERENCES dbo.counterparty (counterparty_id),
    beneficiary_entity_id       INT             NOT NULL     -- our legal entity
        CONSTRAINT fk_lc_le REFERENCES dbo.legal_entity (legal_entity_id),
    issuing_bank_name           NVARCHAR(150)   NOT NULL,
    issuing_bank_bic            NCHAR(11)       NULL,
    confirming_bank_name        NVARCHAR(150)   NULL,
    lc_amount                   DECIMAL(18,2)   NOT NULL,
    lc_currency                 CHAR(3)        NOT NULL DEFAULT 'USD',
    issued_amount               DECIMAL(18,2)   NOT NULL,
    drawdown_amount             DECIMAL(18,2)   NOT NULL DEFAULT 0,
    -- available_amount = lc_amount - drawdown_amount (computed, not stored)
    issue_date                  DATE            NOT NULL,
    expiry_date                 DATE            NOT NULL,
    presentation_deadline_days  SMALLINT        NULL,  -- days before expiry
    is_evergreen                BIT             NOT NULL DEFAULT 0,
    auto_renewal_days           SMALLINT        NULL,  -- notice window for evergreen
    place_of_expiry             NVARCHAR(80)    NULL,
    applicable_law              NVARCHAR(50)    NULL,  -- UCP 600, ISP98, etc.
    notes                       NVARCHAR(1000)  NULL,
    created_at                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT uq_lc_reference UNIQUE (lc_reference)
);
GO

CREATE NONCLUSTERED INDEX IX_lc_cp_status
    ON dbo.letter_of_credit (counterparty_id, status)
    INCLUDE (lc_amount, drawdown_amount, expiry_date);

CREATE NONCLUSTERED INDEX IX_lc_expiry
    ON dbo.letter_of_credit (expiry_date, status)
    WHERE status IN ('ACTIVE', 'PARTIALLY_DRAWN');  -- for expiry alert queries
GO
