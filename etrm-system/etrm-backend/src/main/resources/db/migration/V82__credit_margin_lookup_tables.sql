-- =============================================================================
-- V82 — Credit & Margin: 7 CHECK-constrained columns converted to dedicated
-- FK lookup tables
-- =============================================================================
-- Continuing the static-data-reference review (V80 GUI reconciliation, V81
-- lookup_value wiring): margin_agreement.agreement_type/valuation_frequency/
-- gov_law, credit_limit.limit_type/status, and letter_of_credit.lc_type/status
-- (all real, already-built tables from V35) are plain CHECK+VARCHAR — the
-- frontend mock already modelled each as its own would-be Static Data table
-- with no SQL behind it at all. Unlike V81's columns, none of these had
-- lookup_value rows seeded anywhere, and each is genuinely single-parent (no
-- other table needs to FK against the same value set), so — matching the
-- V77 operator_type precedent for exactly this shape of column — built as
-- dedicated tables (V17's address_type/book_type shape: id/type_code/
-- type_name/description/sort_order/is_active) rather than lookup_value
-- categories, per explicit instruction to keep these as separate tables.
-- =============================================================================

USE ETRM_DB;
GO

-- ── 1. margin_agreement_type ──────────────────────────────────────────────────
CREATE TABLE dbo.margin_agreement_type (
    margin_agreement_type_id INT          NOT NULL IDENTITY(1,1),
    type_code                VARCHAR(50)  NOT NULL,
    type_name                VARCHAR(100) NOT NULL,
    description               VARCHAR(500) NULL,
    sort_order                SMALLINT     NOT NULL DEFAULT 0,
    is_active                 BIT          NOT NULL DEFAULT 1,
    created_at                DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                VARCHAR(100) NOT NULL,
    updated_at                DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                VARCHAR(100) NOT NULL,
    CONSTRAINT pk_margin_agreement_type      PRIMARY KEY (margin_agreement_type_id),
    CONSTRAINT uq_margin_agreement_type_code UNIQUE      (type_code)
);
GO
CREATE INDEX ix_margin_agreement_type_active ON dbo.margin_agreement_type (is_active, sort_order);
GO
INSERT INTO dbo.margin_agreement_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('CSA_BILATERAL',   'CSA Bilateral',                     'Both parties can be required to post collateral depending on MTM direction. Standard under ISDA 2002 Credit Support Annex (English law).', 1, 'SYSTEM', 'SYSTEM'),
    ('CSA_ONE_WAY_IN',  'CSA One-Way (We Receive)',          'Only the counterparty posts collateral to us — we are never required to post.', 2, 'SYSTEM', 'SYSTEM'),
    ('CSA_ONE_WAY_OUT', 'CSA One-Way (We Post)',             'Only we post collateral to the counterparty — typically required by highly rated bank counterparties or CCPs.', 3, 'SYSTEM', 'SYSTEM'),
    ('PLEDGE',          'Pledge Agreement',                  'Title-transfer collateral arrangement (New York law). Collateral ownership transfers to the receiving party.', 4, 'SYSTEM', 'SYSTEM'),
    ('CTA',             'CTA (Collateral Transfer Agreement)','Typically paired with an ISDA Master to govern initial margin posting under UMR (Uncleared Margin Rules).', 5, 'SYSTEM', 'SYSTEM');
GO

-- ── 2. valuation_frequency_type ───────────────────────────────────────────────
CREATE TABLE dbo.valuation_frequency_type (
    valuation_frequency_type_id INT          NOT NULL IDENTITY(1,1),
    type_code                   VARCHAR(50)  NOT NULL,
    type_name                   VARCHAR(100) NOT NULL,
    description                  VARCHAR(500) NULL,
    sort_order                   SMALLINT     NOT NULL DEFAULT 0,
    is_active                    BIT          NOT NULL DEFAULT 1,
    created_at                   DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                   VARCHAR(100) NOT NULL,
    updated_at                   DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                   VARCHAR(100) NOT NULL,
    CONSTRAINT pk_valuation_frequency_type      PRIMARY KEY (valuation_frequency_type_id),
    CONSTRAINT uq_valuation_frequency_type_code UNIQUE      (type_code)
);
GO
CREATE INDEX ix_valuation_frequency_type_active ON dbo.valuation_frequency_type (is_active, sort_order);
GO
INSERT INTO dbo.valuation_frequency_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('DAILY',   'Daily',   'MTM valuation performed every business day. Standard under ISDA 2002 and EMIR.', 1, 'SYSTEM', 'SYSTEM'),
    ('WEEKLY',  'Weekly',  'MTM valuation performed once per week. Used in some bilateral agreements for less liquid portfolios.', 2, 'SYSTEM', 'SYSTEM'),
    ('MONTHLY', 'Monthly', 'MTM valuation performed monthly — lower-volume or long-dated contracts where daily margining is impractical.', 3, 'SYSTEM', 'SYSTEM');
GO

-- ── 3. governing_law_type ─────────────────────────────────────────────────────
CREATE TABLE dbo.governing_law_type (
    governing_law_type_id INT          NOT NULL IDENTITY(1,1),
    type_code              VARCHAR(50)  NOT NULL,
    type_name               VARCHAR(100) NOT NULL,
    description              VARCHAR(500) NULL,
    sort_order               SMALLINT     NOT NULL DEFAULT 0,
    is_active                BIT          NOT NULL DEFAULT 1,
    created_at                DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                VARCHAR(100) NOT NULL,
    updated_at                DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                VARCHAR(100) NOT NULL,
    CONSTRAINT pk_governing_law_type      PRIMARY KEY (governing_law_type_id),
    CONSTRAINT uq_governing_law_type_code UNIQUE      (type_code)
);
GO
CREATE INDEX ix_governing_law_type_active ON dbo.governing_law_type (is_active, sort_order);
GO
INSERT INTO dbo.governing_law_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('ENGLISH',  'English Law',  'ISDA 1995/2016 CSA (Transfer — English law). Collateral transferred by way of title, not security interest. Most common in Europe and Asia.', 1, 'SYSTEM', 'SYSTEM'),
    ('NEW_YORK', 'New York Law', 'ISDA 1994 CSA (Security Interest — New York law). Collateral pledged as security interest; rehypothecation typically permitted. Standard in US markets.', 2, 'SYSTEM', 'SYSTEM'),
    ('OTHER',    'Other',        'Alternative jurisdiction — e.g. Japanese law CSA, French law, or bespoke bilateral arrangement.', 3, 'SYSTEM', 'SYSTEM');
GO

-- ── 4. credit_limit_type ──────────────────────────────────────────────────────
CREATE TABLE dbo.credit_limit_type (
    credit_limit_type_id INT          NOT NULL IDENTITY(1,1),
    type_code             VARCHAR(50)  NOT NULL,
    type_name              VARCHAR(100) NOT NULL,
    description             VARCHAR(500) NULL,
    sort_order              SMALLINT     NOT NULL DEFAULT 0,
    is_active               BIT          NOT NULL DEFAULT 1,
    created_at               DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by               VARCHAR(100) NOT NULL,
    updated_at               DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by               VARCHAR(100) NOT NULL,
    CONSTRAINT pk_credit_limit_type      PRIMARY KEY (credit_limit_type_id),
    CONSTRAINT uq_credit_limit_type_code UNIQUE      (type_code)
);
GO
CREATE INDEX ix_credit_limit_type_active ON dbo.credit_limit_type (is_active, sort_order);
GO
INSERT INTO dbo.credit_limit_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('PRE_SETTLEMENT', 'Pre-Settlement',   'Forward exposure risk — replacement cost if the counterparty defaults before maturity. Sum of positive MTM of all open trades.', 1, 'SYSTEM', 'SYSTEM'),
    ('SETTLEMENT',      'Settlement',       'Payment-due-today risk — cash owed by or to the counterparty on transactions settling within T+2.', 2, 'SYSTEM', 'SYSTEM'),
    ('DELIVERY',         'Delivery',         'Physical commodity delivery risk — value of commodity expected to deliver to (or receive from) the counterparty in the current period.', 3, 'SYSTEM', 'SYSTEM'),
    ('MARK_TO_MARKET',   'Mark-to-Market',   'Current unrealised gain/loss exposure on all open positions valued at today''s market price.', 4, 'SYSTEM', 'SYSTEM');
GO

-- ── 5. credit_limit_status_type ───────────────────────────────────────────────
CREATE TABLE dbo.credit_limit_status_type (
    credit_limit_status_type_id INT          NOT NULL IDENTITY(1,1),
    type_code                    VARCHAR(50)  NOT NULL,
    type_name                     VARCHAR(100) NOT NULL,
    description                    VARCHAR(500) NULL,
    sort_order                     SMALLINT     NOT NULL DEFAULT 0,
    is_active                      BIT          NOT NULL DEFAULT 1,
    created_at                      DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                      VARCHAR(100) NOT NULL,
    updated_at                      DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                      VARCHAR(100) NOT NULL,
    CONSTRAINT pk_credit_limit_status_type      PRIMARY KEY (credit_limit_status_type_id),
    CONSTRAINT uq_credit_limit_status_type_code UNIQUE      (type_code)
);
GO
CREATE INDEX ix_credit_limit_status_type_active ON dbo.credit_limit_status_type (is_active, sort_order);
GO
INSERT INTO dbo.credit_limit_status_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('ACTIVE',    'Active',    'Limit is in effect and enforced. New trades are validated against this limit during booking.', 1, 'SYSTEM', 'SYSTEM'),
    ('EXPIRED',   'Expired',   'Limit has passed its expiry date. New trades cannot consume this limit.', 2, 'SYSTEM', 'SYSTEM'),
    ('SUSPENDED', 'Suspended', 'Limit temporarily blocked by credit team (e.g. during CP review or KYC renewal).', 3, 'SYSTEM', 'SYSTEM'),
    ('CANCELLED', 'Cancelled', 'Limit permanently withdrawn — counterparty credit facility removed.', 4, 'SYSTEM', 'SYSTEM');
GO

-- ── 6. lc_type ─────────────────────────────────────────────────────────────────
CREATE TABLE dbo.lc_type (
    lc_type_id  INT          NOT NULL IDENTITY(1,1),
    type_code   VARCHAR(50)  NOT NULL,
    type_name   VARCHAR(100) NOT NULL,
    description VARCHAR(500) NULL,
    sort_order  SMALLINT     NOT NULL DEFAULT 0,
    is_active   BIT          NOT NULL DEFAULT 1,
    created_at  DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by  VARCHAR(100) NOT NULL,
    updated_at  DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by  VARCHAR(100) NOT NULL,
    CONSTRAINT pk_lc_type      PRIMARY KEY (lc_type_id),
    CONSTRAINT uq_lc_type_code UNIQUE      (type_code)
);
GO
CREATE INDEX ix_lc_type_active ON dbo.lc_type (is_active, sort_order);
GO
INSERT INTO dbo.lc_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('STANDBY',      'Standby LC',      'Independent payment guarantee — drawn only on default or non-performance. Governed by ISP98.', 1, 'SYSTEM', 'SYSTEM'),
    ('DOCUMENTARY',  'Documentary LC',  'Payment triggered by presentation of specified shipping documents. Governed by ICC UCP 600. Standard for physical cargo trades.', 2, 'SYSTEM', 'SYSTEM'),
    ('REVOLVING',    'Revolving LC',    'Automatically reinstates (up to face value) after each drawing or at specified intervals.', 3, 'SYSTEM', 'SYSTEM'),
    ('TRANSFERABLE', 'Transferable LC', 'Beneficiary can transfer the LC (whole or part) to a second beneficiary. Requires explicit endorsement from issuing bank.', 4, 'SYSTEM', 'SYSTEM');
GO

-- ── 7. lc_status_type ─────────────────────────────────────────────────────────
CREATE TABLE dbo.lc_status_type (
    lc_status_type_id INT          NOT NULL IDENTITY(1,1),
    type_code          VARCHAR(50)  NOT NULL,
    type_name           VARCHAR(100) NOT NULL,
    description          VARCHAR(500) NULL,
    sort_order           SMALLINT     NOT NULL DEFAULT 0,
    is_active            BIT          NOT NULL DEFAULT 1,
    created_at            DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by            VARCHAR(100) NOT NULL,
    updated_at             DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by             VARCHAR(100) NOT NULL,
    CONSTRAINT pk_lc_status_type      PRIMARY KEY (lc_status_type_id),
    CONSTRAINT uq_lc_status_type_code UNIQUE      (type_code)
);
GO
CREATE INDEX ix_lc_status_type_active ON dbo.lc_status_type (is_active, sort_order);
GO
INSERT INTO dbo.lc_status_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('ACTIVE',           'Active',           'LC is current and available to draw against.', 1, 'SYSTEM', 'SYSTEM'),
    ('EXPIRED',          'Expired',          'LC has passed its expiry date without being drawn or renewed. Bank released from obligation.', 2, 'SYSTEM', 'SYSTEM'),
    ('CANCELLED',        'Cancelled',        'LC cancelled by mutual agreement before expiry.', 3, 'SYSTEM', 'SYSTEM'),
    ('PARTIALLY_DRAWN',  'Partially Drawn',  'One or more drawdown events occurred but the full LC face value has not been consumed.', 4, 'SYSTEM', 'SYSTEM'),
    ('FULLY_DRAWN',      'Fully Drawn',      'All available LC face value has been drawn — no further drawings possible.', 5, 'SYSTEM', 'SYSTEM');
GO

-- =============================================================================
-- Convert the real consuming columns from CHECK+VARCHAR to FK — same staging
-- pattern as V81/V77 (add new INT column, backfill via code match, drop old
-- CHECK column, rename new one into place, add FK).
-- =============================================================================

-- ── dbo.margin_agreement.agreement_type ───────────────────────────────────────
ALTER TABLE dbo.margin_agreement ADD agreement_type_new INT NULL;
GO
UPDATE m SET m.agreement_type_new = t.margin_agreement_type_id
FROM dbo.margin_agreement m JOIN dbo.margin_agreement_type t ON t.type_code = m.agreement_type;
GO
ALTER TABLE dbo.margin_agreement DROP CONSTRAINT IF EXISTS chk_margin_agr_type;
ALTER TABLE dbo.margin_agreement DROP COLUMN agreement_type;
GO
EXEC sp_rename 'dbo.margin_agreement.agreement_type_new', 'agreement_type', 'COLUMN';
GO
ALTER TABLE dbo.margin_agreement ALTER COLUMN agreement_type INT NOT NULL;
ALTER TABLE dbo.margin_agreement ADD CONSTRAINT fk_margin_agr_type FOREIGN KEY (agreement_type) REFERENCES dbo.margin_agreement_type(margin_agreement_type_id);
GO

-- ── dbo.margin_agreement.valuation_frequency ──────────────────────────────────
ALTER TABLE dbo.margin_agreement ADD valuation_frequency_new INT NULL;
GO
UPDATE m SET m.valuation_frequency_new = t.valuation_frequency_type_id
FROM dbo.margin_agreement m JOIN dbo.valuation_frequency_type t ON t.type_code = m.valuation_frequency;
GO
ALTER TABLE dbo.margin_agreement DROP CONSTRAINT IF EXISTS chk_margin_val_freq;
ALTER TABLE dbo.margin_agreement DROP COLUMN valuation_frequency;
GO
EXEC sp_rename 'dbo.margin_agreement.valuation_frequency_new', 'valuation_frequency', 'COLUMN';
GO
ALTER TABLE dbo.margin_agreement ALTER COLUMN valuation_frequency INT NOT NULL;
ALTER TABLE dbo.margin_agreement ADD CONSTRAINT fk_margin_val_freq FOREIGN KEY (valuation_frequency) REFERENCES dbo.valuation_frequency_type(valuation_frequency_type_id);
GO

-- ── dbo.margin_agreement.gov_law ──────────────────────────────────────────────
ALTER TABLE dbo.margin_agreement ADD gov_law_new INT NULL;
GO
UPDATE m SET m.gov_law_new = t.governing_law_type_id
FROM dbo.margin_agreement m JOIN dbo.governing_law_type t ON t.type_code = m.gov_law;
GO
ALTER TABLE dbo.margin_agreement DROP CONSTRAINT IF EXISTS chk_margin_gov_law;
ALTER TABLE dbo.margin_agreement DROP COLUMN gov_law;
GO
EXEC sp_rename 'dbo.margin_agreement.gov_law_new', 'gov_law', 'COLUMN';
GO
ALTER TABLE dbo.margin_agreement ALTER COLUMN gov_law INT NOT NULL;
ALTER TABLE dbo.margin_agreement ADD CONSTRAINT fk_margin_gov_law FOREIGN KEY (gov_law) REFERENCES dbo.governing_law_type(governing_law_type_id);
GO

-- ── dbo.credit_limit.limit_type ───────────────────────────────────────────────
ALTER TABLE dbo.credit_limit ADD limit_type_new INT NULL;
GO
UPDATE c SET c.limit_type_new = t.credit_limit_type_id
FROM dbo.credit_limit c JOIN dbo.credit_limit_type t ON t.type_code = c.limit_type;
GO
ALTER TABLE dbo.credit_limit DROP CONSTRAINT IF EXISTS chk_credit_limit_type;
ALTER TABLE dbo.credit_limit DROP COLUMN limit_type;
GO
EXEC sp_rename 'dbo.credit_limit.limit_type_new', 'limit_type', 'COLUMN';
GO
ALTER TABLE dbo.credit_limit ALTER COLUMN limit_type INT NOT NULL;
ALTER TABLE dbo.credit_limit ADD CONSTRAINT fk_credit_limit_type FOREIGN KEY (limit_type) REFERENCES dbo.credit_limit_type(credit_limit_type_id);
GO

-- ── dbo.credit_limit.status ───────────────────────────────────────────────────
ALTER TABLE dbo.credit_limit ADD status_new INT NULL;
GO
UPDATE c SET c.status_new = t.credit_limit_status_type_id
FROM dbo.credit_limit c JOIN dbo.credit_limit_status_type t ON t.type_code = c.status;
GO
ALTER TABLE dbo.credit_limit DROP CONSTRAINT IF EXISTS chk_credit_limit_status;
ALTER TABLE dbo.credit_limit DROP COLUMN status;
GO
EXEC sp_rename 'dbo.credit_limit.status_new', 'status', 'COLUMN';
GO
ALTER TABLE dbo.credit_limit ALTER COLUMN status INT NOT NULL;
ALTER TABLE dbo.credit_limit ADD CONSTRAINT fk_credit_limit_status FOREIGN KEY (status) REFERENCES dbo.credit_limit_status_type(credit_limit_status_type_id);
GO

-- ── dbo.letter_of_credit.lc_type ──────────────────────────────────────────────
ALTER TABLE dbo.letter_of_credit ADD lc_type_new INT NULL;
GO
UPDATE l SET l.lc_type_new = t.lc_type_id
FROM dbo.letter_of_credit l JOIN dbo.lc_type t ON t.type_code = l.lc_type;
GO
ALTER TABLE dbo.letter_of_credit DROP CONSTRAINT IF EXISTS chk_lc_type;
ALTER TABLE dbo.letter_of_credit DROP COLUMN lc_type;
GO
EXEC sp_rename 'dbo.letter_of_credit.lc_type_new', 'lc_type', 'COLUMN';
GO
ALTER TABLE dbo.letter_of_credit ALTER COLUMN lc_type INT NOT NULL;
ALTER TABLE dbo.letter_of_credit ADD CONSTRAINT fk_lc_type FOREIGN KEY (lc_type) REFERENCES dbo.lc_type(lc_type_id);
GO

-- ── dbo.letter_of_credit.status ───────────────────────────────────────────────
ALTER TABLE dbo.letter_of_credit ADD status_new INT NULL;
GO
UPDATE l SET l.status_new = t.lc_status_type_id
FROM dbo.letter_of_credit l JOIN dbo.lc_status_type t ON t.type_code = l.status;
GO
ALTER TABLE dbo.letter_of_credit DROP CONSTRAINT IF EXISTS chk_lc_status;
ALTER TABLE dbo.letter_of_credit DROP COLUMN status;
GO
EXEC sp_rename 'dbo.letter_of_credit.status_new', 'status', 'COLUMN';
GO
ALTER TABLE dbo.letter_of_credit ALTER COLUMN status INT NOT NULL;
ALTER TABLE dbo.letter_of_credit ADD CONSTRAINT fk_lc_status FOREIGN KEY (status) REFERENCES dbo.lc_status_type(lc_status_type_id);
GO

-- ── Register in the Static Data GUI ───────────────────────────────────────────
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES
    ('margin_agreement_type',    'Margin Agreement Types',    'Credit & Collateral', 1, 1, 0, 0, 1, 'SYSTEM', 'SYSTEM'),
    ('valuation_frequency_type', 'Valuation Frequencies',     'Credit & Collateral', 1, 1, 0, 0, 2, 'SYSTEM', 'SYSTEM'),
    ('governing_law_type',       'CSA Governing Laws',        'Credit & Collateral', 1, 1, 0, 0, 3, 'SYSTEM', 'SYSTEM'),
    ('credit_limit_type',        'Credit Limit Types',        'Credit & Collateral', 1, 1, 0, 0, 4, 'SYSTEM', 'SYSTEM'),
    ('credit_limit_status_type', 'Credit Limit Statuses',     'Credit & Collateral', 1, 1, 0, 0, 5, 'SYSTEM', 'SYSTEM'),
    ('lc_type',                  'Letter of Credit Types',    'Credit & Collateral', 1, 1, 0, 0, 6, 'SYSTEM', 'SYSTEM'),
    ('lc_status_type',           'LC Statuses',                'Credit & Collateral', 1, 1, 0, 0, 7, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'V82 — 7 CREDIT & MARGIN LOOKUP TABLES BUILT';
PRINT '  margin_agreement_type, valuation_frequency_type, governing_law_type,';
PRINT '  credit_limit_type, credit_limit_status_type, lc_type, lc_status_type.';
PRINT '  margin_agreement/credit_limit/letter_of_credit CHECK columns';
PRINT '  converted to FK against them.';
PRINT '============================================================';
GO
