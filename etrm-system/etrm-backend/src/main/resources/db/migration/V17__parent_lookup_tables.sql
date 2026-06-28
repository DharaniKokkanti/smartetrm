-- =============================================================================
-- ETRM SYSTEM — PARENT LOOKUP TABLES FOR ALL DROPDOWN VALUES
-- SQL Server 2022 | Version 1.0 | June 2026
-- =============================================================================
-- Run AFTER: V16__custom_config.sql
-- =============================================================================
-- ADDS 13 PARENT REFERENCE TABLES (replacing hardcoded CHECK constraints):
--   01. deal_type              — trade.trade_type
--   02. payment_method         — payment_term.payment_method
--   03. counterparty_type      — counterparty.cp_type  (was also in custom_config)
--   04. kyc_status             — counterparty.kyc_status (was also in custom_config)
--   05. contact_role           — contact.contact_role   (was also in custom_config)
--   06. address_type           — address.address_type   (was also in custom_config)
--   07. bank_account_type      — bank_account.account_type (was also in custom_config)
--   08. book_type              — book.book_type
--   09. legal_entity_type      — legal_entity.entity_type
--   10. settlement_type        — product.settlement_type + trade.settlement_type
--   11. storage_facility_type  — storage_facility.facility_type
--   12. netting_agreement_type — netting_agreement.agreement_type
--   13. tax_type               — tax_registration.tax_type
--
-- ALSO ADDS FK columns to all child tables pointing back to the parent tables,
-- then backfills those FK columns from the existing text columns so no data is lost.
-- The original text columns are retained for backward-compat; drop them in a future
-- migration once all application code has been migrated to use the FK columns.
--
-- Temporal tables (legal_entity, book, counterparty, trade) require system
-- versioning to be toggled off/on around each ALTER TABLE statement.
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- RE-RUN CLEANUP
-- Parent tables can't be dropped while child FK constraints still reference them.
-- Order: drop FK constraints → drop FK columns → drop parent tables.
-- Temporal tables (book, legal_entity, counterparty, trade) require system
-- versioning to be toggled off before altering, and the FK column must be
-- removed from both the current table AND its _history table.
-- =============================================================================

-- ── Step 1: Non-temporal child tables — drop FK constraints ───────────────────
IF OBJECT_ID('dbo.fk_contact_role_id',           'F') IS NOT NULL ALTER TABLE dbo.contact            DROP CONSTRAINT fk_contact_role_id;
IF OBJECT_ID('dbo.fk_address_type_id',            'F') IS NOT NULL ALTER TABLE dbo.address             DROP CONSTRAINT fk_address_type_id;
IF OBJECT_ID('dbo.fk_bank_account_type_id',       'F') IS NOT NULL ALTER TABLE dbo.bank_account        DROP CONSTRAINT fk_bank_account_type_id;
IF OBJECT_ID('dbo.fk_payment_term_method_id',     'F') IS NOT NULL ALTER TABLE dbo.payment_term        DROP CONSTRAINT fk_payment_term_method_id;
IF OBJECT_ID('dbo.fk_product_settlement_type_id', 'F') IS NOT NULL ALTER TABLE dbo.product             DROP CONSTRAINT fk_product_settlement_type_id;
IF OBJECT_ID('dbo.fk_storage_facility_type_id',   'F') IS NOT NULL ALTER TABLE dbo.storage_facility    DROP CONSTRAINT fk_storage_facility_type_id;
IF OBJECT_ID('dbo.fk_netting_agreement_type_id',  'F') IS NOT NULL ALTER TABLE dbo.netting_agreement   DROP CONSTRAINT fk_netting_agreement_type_id;
IF OBJECT_ID('dbo.fk_tax_registration_type_id',   'F') IS NOT NULL ALTER TABLE dbo.tax_registration    DROP CONSTRAINT fk_tax_registration_type_id;
GO

-- ── Step 2: Non-temporal child tables — drop FK columns ───────────────────────
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.contact')          AND name = 'contact_role_id')          ALTER TABLE dbo.contact          DROP COLUMN contact_role_id;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.address')           AND name = 'address_type_id')           ALTER TABLE dbo.address           DROP COLUMN address_type_id;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.bank_account')      AND name = 'bank_account_type_id')      ALTER TABLE dbo.bank_account      DROP COLUMN bank_account_type_id;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.payment_term')      AND name = 'payment_method_id')         ALTER TABLE dbo.payment_term      DROP COLUMN payment_method_id;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.product')           AND name = 'settlement_type_id')        ALTER TABLE dbo.product           DROP COLUMN settlement_type_id;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.storage_facility')  AND name = 'storage_facility_type_id')  ALTER TABLE dbo.storage_facility  DROP COLUMN storage_facility_type_id;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.netting_agreement') AND name = 'netting_agreement_type_id') ALTER TABLE dbo.netting_agreement DROP COLUMN netting_agreement_type_id;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.tax_registration')  AND name = 'tax_type_id')               ALTER TABLE dbo.tax_registration  DROP COLUMN tax_type_id;
GO

-- ── Step 3: Temporal child tables — versioning off, drop constraints + columns from both tables ──

-- dbo.book
IF OBJECT_ID('dbo.fk_book_type_id', 'F') IS NOT NULL BEGIN
    ALTER TABLE dbo.book SET (SYSTEM_VERSIONING = OFF);
    ALTER TABLE dbo.book         DROP CONSTRAINT fk_book_type_id;
    ALTER TABLE dbo.book         DROP COLUMN book_type_id;
    ALTER TABLE dbo.book_history DROP COLUMN book_type_id;
    ALTER TABLE dbo.book SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.book_history));
END
GO

-- dbo.legal_entity
IF OBJECT_ID('dbo.fk_legal_entity_type_id', 'F') IS NOT NULL BEGIN
    ALTER TABLE dbo.legal_entity SET (SYSTEM_VERSIONING = OFF);
    ALTER TABLE dbo.legal_entity         DROP CONSTRAINT fk_legal_entity_type_id;
    ALTER TABLE dbo.legal_entity         DROP COLUMN legal_entity_type_id;
    ALTER TABLE dbo.legal_entity_history DROP COLUMN legal_entity_type_id;
    ALTER TABLE dbo.legal_entity SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.legal_entity_history));
END
GO

-- dbo.counterparty (two FK columns — batch both inside one versioning toggle)
IF OBJECT_ID('dbo.fk_counterparty_type_id', 'F') IS NOT NULL
   OR OBJECT_ID('dbo.fk_counterparty_kyc_status_id', 'F') IS NOT NULL BEGIN
    ALTER TABLE dbo.counterparty SET (SYSTEM_VERSIONING = OFF);
    IF OBJECT_ID('dbo.fk_counterparty_type_id', 'F') IS NOT NULL BEGIN
        ALTER TABLE dbo.counterparty         DROP CONSTRAINT fk_counterparty_type_id;
        ALTER TABLE dbo.counterparty         DROP COLUMN counterparty_type_id;
        ALTER TABLE dbo.counterparty_history DROP COLUMN counterparty_type_id;
    END
    IF OBJECT_ID('dbo.fk_counterparty_kyc_status_id', 'F') IS NOT NULL BEGIN
        ALTER TABLE dbo.counterparty         DROP CONSTRAINT fk_counterparty_kyc_status_id;
        ALTER TABLE dbo.counterparty         DROP COLUMN kyc_status_id;
        ALTER TABLE dbo.counterparty_history DROP COLUMN kyc_status_id;
    END
    ALTER TABLE dbo.counterparty SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.counterparty_history));
END
GO

-- dbo.trade (two FK columns — batch both inside one versioning toggle)
IF OBJECT_ID('dbo.fk_trade_deal_type_id', 'F') IS NOT NULL
   OR OBJECT_ID('dbo.fk_trade_settlement_type_id', 'F') IS NOT NULL BEGIN
    ALTER TABLE dbo.trade SET (SYSTEM_VERSIONING = OFF);
    IF OBJECT_ID('dbo.fk_trade_deal_type_id', 'F') IS NOT NULL BEGIN
        ALTER TABLE dbo.trade         DROP CONSTRAINT fk_trade_deal_type_id;
        ALTER TABLE dbo.trade         DROP COLUMN deal_type_id;
        ALTER TABLE dbo.trade_history DROP COLUMN deal_type_id;
    END
    IF OBJECT_ID('dbo.fk_trade_settlement_type_id', 'F') IS NOT NULL BEGIN
        ALTER TABLE dbo.trade         DROP CONSTRAINT fk_trade_settlement_type_id;
        ALTER TABLE dbo.trade         DROP COLUMN trade_settlement_type_id;
        ALTER TABLE dbo.trade_history DROP COLUMN trade_settlement_type_id;
    END
    ALTER TABLE dbo.trade SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.trade_history));
END
GO

-- ── Step 4: Safely drop parent tables (no FK references remain) ───────────────
IF OBJECT_ID('dbo.tax_type',               'U') IS NOT NULL DROP TABLE dbo.tax_type;
IF OBJECT_ID('dbo.netting_agreement_type', 'U') IS NOT NULL DROP TABLE dbo.netting_agreement_type;
IF OBJECT_ID('dbo.storage_facility_type',  'U') IS NOT NULL DROP TABLE dbo.storage_facility_type;
IF OBJECT_ID('dbo.settlement_type',        'U') IS NOT NULL DROP TABLE dbo.settlement_type;
IF OBJECT_ID('dbo.legal_entity_type',      'U') IS NOT NULL DROP TABLE dbo.legal_entity_type;
IF OBJECT_ID('dbo.book_type',              'U') IS NOT NULL DROP TABLE dbo.book_type;
IF OBJECT_ID('dbo.bank_account_type',      'U') IS NOT NULL DROP TABLE dbo.bank_account_type;
IF OBJECT_ID('dbo.address_type',           'U') IS NOT NULL DROP TABLE dbo.address_type;
IF OBJECT_ID('dbo.contact_role',           'U') IS NOT NULL DROP TABLE dbo.contact_role;
IF OBJECT_ID('dbo.kyc_status',             'U') IS NOT NULL DROP TABLE dbo.kyc_status;
IF OBJECT_ID('dbo.counterparty_type',      'U') IS NOT NULL DROP TABLE dbo.counterparty_type;
IF OBJECT_ID('dbo.payment_method',         'U') IS NOT NULL DROP TABLE dbo.payment_method;
IF OBJECT_ID('dbo.deal_type',              'U') IS NOT NULL DROP TABLE dbo.deal_type;
-- custom_config is fully superseded by the 13 parent tables above
IF OBJECT_ID('dbo.custom_config',          'U') IS NOT NULL DROP TABLE dbo.custom_config;
GO


-- =============================================================================
-- HELPER: standard column block used by every parent lookup table
-- type_code  = machine key, matches the existing CHECK constraint values
-- type_name  = human label shown in the UI
-- =============================================================================

-- =============================================================================
-- 01. DEAL_TYPE
-- Governs which commodity-agnostic trade legs are physical vs. financial.
-- Child table: dbo.trade (column: trade_type)
-- =============================================================================
CREATE TABLE dbo.deal_type (
    deal_type_id    INT             NOT NULL IDENTITY(1,1),
    type_code       VARCHAR(50)     NOT NULL,
    type_name       VARCHAR(100)    NOT NULL,
    description     VARCHAR(500)    NULL,
    sort_order      SMALLINT        NOT NULL DEFAULT 0,
    is_active       BIT             NOT NULL DEFAULT 1,
    created_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by      VARCHAR(100)    NOT NULL,
    updated_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by      VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_deal_type         PRIMARY KEY (deal_type_id),
    CONSTRAINT uq_deal_type_code    UNIQUE      (type_code)
);
GO
CREATE INDEX ix_deal_type_active ON dbo.deal_type (is_active, sort_order);
GO

INSERT INTO dbo.deal_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('PHYSICAL',   'Physical',   'Physical commodity delivery trade',            1, 'SYSTEM', 'SYSTEM'),
    ('FINANCIAL',  'Financial',  'Financial / paper trade with no physical leg', 2, 'SYSTEM', 'SYSTEM'),
    ('OPTION',     'Option',     'Options contract — call or put',               3, 'SYSTEM', 'SYSTEM'),
    ('FREIGHT',    'Freight',    'Vessel charter or freight contract',           4, 'SYSTEM', 'SYSTEM');
GO


-- =============================================================================
-- 02. PAYMENT_METHOD
-- Settlement mechanisms for invoices and trade obligations.
-- Child table: dbo.payment_term (column: payment_method)
-- =============================================================================
CREATE TABLE dbo.payment_method (
    payment_method_id   INT             NOT NULL IDENTITY(1,1),
    type_code           VARCHAR(50)     NOT NULL,
    type_name           VARCHAR(100)    NOT NULL,
    description         VARCHAR(500)    NULL,
    sort_order          SMALLINT        NOT NULL DEFAULT 0,
    is_active           BIT             NOT NULL DEFAULT 1,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_payment_method        PRIMARY KEY (payment_method_id),
    CONSTRAINT uq_payment_method_code   UNIQUE      (type_code)
);
GO
CREATE INDEX ix_payment_method_active ON dbo.payment_method (is_active, sort_order);
GO

INSERT INTO dbo.payment_method (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('WIRE',               'Wire Transfer',      'Bank-to-bank SWIFT wire transfer',                         1, 'SYSTEM', 'SYSTEM'),
    ('LETTER_OF_CREDIT',   'Letter of Credit',   'Documentary LC — irrevocable or revolving',               2, 'SYSTEM', 'SYSTEM'),
    ('BANK_GUARANTEE',     'Bank Guarantee',     'Performance or payment bank guarantee',                    3, 'SYSTEM', 'SYSTEM'),
    ('PREPAYMENT',         'Prepayment',         'Full or partial payment before delivery',                  4, 'SYSTEM', 'SYSTEM'),
    ('NETTING',            'Netting',            'Net settlement against offsetting obligations',            5, 'SYSTEM', 'SYSTEM'),
    ('CHEQUE',             'Cheque',             'Physical or electronic cheque payment',                    6, 'SYSTEM', 'SYSTEM'),
    ('OTHER',              'Other',              'Other payment mechanism — see notes',                      7, 'SYSTEM', 'SYSTEM');
GO


-- =============================================================================
-- 03. COUNTERPARTY_TYPE
-- Classifies trading counterparties by business function.
-- Child table: dbo.counterparty (column: cp_type)
-- Previously also maintained in dbo.custom_config (group = COUNTERPARTY_TYPE).
-- =============================================================================
CREATE TABLE dbo.counterparty_type (
    counterparty_type_id    INT             NOT NULL IDENTITY(1,1),
    type_code               VARCHAR(50)     NOT NULL,
    type_name               VARCHAR(100)    NOT NULL,
    description             VARCHAR(500)    NULL,
    sort_order              SMALLINT        NOT NULL DEFAULT 0,
    is_active               BIT             NOT NULL DEFAULT 1,
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,
    updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_counterparty_type         PRIMARY KEY (counterparty_type_id),
    CONSTRAINT uq_counterparty_type_code    UNIQUE      (type_code)
);
GO
CREATE INDEX ix_counterparty_type_active ON dbo.counterparty_type (is_active, sort_order);
GO

INSERT INTO dbo.counterparty_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('PRODUCER',     'Producer',     'Commodity producer — upstream, extraction or generation',       1, 'SYSTEM', 'SYSTEM'),
    ('CONSUMER',     'Consumer',     'End consumer — industrial, utility, or retail buyer',           2, 'SYSTEM', 'SYSTEM'),
    ('TRADER',       'Trader',       'Physical or financial trading company',                         3, 'SYSTEM', 'SYSTEM'),
    ('BANK',         'Bank',         'Financial institution — credit, clearing, structured finance',  4, 'SYSTEM', 'SYSTEM'),
    ('BROKER',       'Broker',       'Intermediary executing on behalf of principals',                5, 'SYSTEM', 'SYSTEM'),
    ('EXCHANGE',     'Exchange',     'Regulated trading venue (ICE, NYMEX, LME, EEX)',               6, 'SYSTEM', 'SYSTEM'),
    ('INTERCOMPANY', 'Intercompany', 'Intra-group entity — same legal group as a legal_entity',      7, 'SYSTEM', 'SYSTEM'),
    ('UTILITY',      'Utility',      'Energy utility — power generator or gas distributor',           8, 'SYSTEM', 'SYSTEM'),
    ('OTHER',        'Other',        'Does not fit any standard counterparty classification',         9, 'SYSTEM', 'SYSTEM');
GO


-- =============================================================================
-- 04. KYC_STATUS
-- Know-Your-Customer onboarding state for a counterparty.
-- Child table: dbo.counterparty (column: kyc_status)
-- Previously also maintained in dbo.custom_config (group = KYC_STATUS).
-- =============================================================================
CREATE TABLE dbo.kyc_status (
    kyc_status_id   INT             NOT NULL IDENTITY(1,1),
    type_code       VARCHAR(50)     NOT NULL,
    type_name       VARCHAR(100)    NOT NULL,
    description     VARCHAR(500)    NULL,
    sort_order      SMALLINT        NOT NULL DEFAULT 0,
    is_active       BIT             NOT NULL DEFAULT 1,
    created_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by      VARCHAR(100)    NOT NULL,
    updated_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by      VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_kyc_status        PRIMARY KEY (kyc_status_id),
    CONSTRAINT uq_kyc_status_code   UNIQUE      (type_code)
);
GO
CREATE INDEX ix_kyc_status_active ON dbo.kyc_status (is_active, sort_order);
GO

INSERT INTO dbo.kyc_status (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('PENDING',   'Pending',   'KYC documentation submitted, awaiting review',              1, 'SYSTEM', 'SYSTEM'),
    ('APPROVED',  'Approved',  'KYC complete and approved — counterparty tradeable',        2, 'SYSTEM', 'SYSTEM'),
    ('REVIEW',    'Review',    'KYC under periodic review — trading may be restricted',     3, 'SYSTEM', 'SYSTEM'),
    ('SUSPENDED', 'Suspended', 'KYC suspended — trading halted pending investigation',      4, 'SYSTEM', 'SYSTEM'),
    ('REJECTED',  'Rejected',  'KYC failed — counterparty cannot be onboarded',             5, 'SYSTEM', 'SYSTEM');
GO


-- =============================================================================
-- 05. CONTACT_ROLE
-- Functional role of a named contact at a legal entity or counterparty.
-- Child table: dbo.contact (column: contact_role)
-- Previously also maintained in dbo.custom_config (group = CONTACT_ROLE).
-- =============================================================================
CREATE TABLE dbo.contact_role (
    contact_role_id     INT             NOT NULL IDENTITY(1,1),
    type_code           VARCHAR(50)     NOT NULL,
    type_name           VARCHAR(100)    NOT NULL,
    description         VARCHAR(500)    NULL,
    sort_order          SMALLINT        NOT NULL DEFAULT 0,
    is_active           BIT             NOT NULL DEFAULT 1,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_contact_role      PRIMARY KEY (contact_role_id),
    CONSTRAINT uq_contact_role_code UNIQUE      (type_code)
);
GO
CREATE INDEX ix_contact_role_active ON dbo.contact_role (is_active, sort_order);
GO

INSERT INTO dbo.contact_role (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('TRADER',      'Trader',       'Front-office trader executing deals',                      1, 'SYSTEM', 'SYSTEM'),
    ('BACK_OFFICE', 'Back Office',  'Confirmations, settlements, and operations',               2, 'SYSTEM', 'SYSTEM'),
    ('LEGAL',       'Legal',        'Contract drafting, review, and disputes',                  3, 'SYSTEM', 'SYSTEM'),
    ('COMPLIANCE',  'Compliance',   'Regulatory, sanctions, and KYC oversight',                 4, 'SYSTEM', 'SYSTEM'),
    ('ACCOUNTS',    'Accounts',     'Invoice processing, accounts payable/receivable',          5, 'SYSTEM', 'SYSTEM'),
    ('PRIMARY',     'Primary',      'General primary point of contact',                         6, 'SYSTEM', 'SYSTEM'),
    ('OPERATIONS',  'Operations',   'Physical delivery, logistics, and scheduling',             7, 'SYSTEM', 'SYSTEM'),
    ('TECHNICAL',   'Technical',    'Systems integration and IT connectivity',                  8, 'SYSTEM', 'SYSTEM'),
    ('CREDIT',      'Credit',       'Credit analysis and exposure monitoring',                  9, 'SYSTEM', 'SYSTEM'),
    ('KYC',         'KYC',          'Know-Your-Customer document collection and review',       10, 'SYSTEM', 'SYSTEM'),
    ('OTHER',       'Other',        'Does not fit a defined contact function',                 11, 'SYSTEM', 'SYSTEM');
GO


-- =============================================================================
-- 06. ADDRESS_TYPE
-- Classification of a postal or delivery address record.
-- Child table: dbo.address (column: address_type)
-- Previously also maintained in dbo.custom_config (group = ADDRESS_TYPE).
-- =============================================================================
CREATE TABLE dbo.address_type (
    address_type_id     INT             NOT NULL IDENTITY(1,1),
    type_code           VARCHAR(50)     NOT NULL,
    type_name           VARCHAR(100)    NOT NULL,
    description         VARCHAR(500)    NULL,
    sort_order          SMALLINT        NOT NULL DEFAULT 0,
    is_active           BIT             NOT NULL DEFAULT 1,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_address_type      PRIMARY KEY (address_type_id),
    CONSTRAINT uq_address_type_code UNIQUE      (type_code)
);
GO
CREATE INDEX ix_address_type_active ON dbo.address_type (is_active, sort_order);
GO

INSERT INTO dbo.address_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('REGISTERED', 'Registered',  'Official registered office address',                      1, 'SYSTEM', 'SYSTEM'),
    ('TRADING',    'Trading',     'Principal place of business for trading operations',      2, 'SYSTEM', 'SYSTEM'),
    ('BILLING',    'Billing',     'Invoice and payment correspondence address',               3, 'SYSTEM', 'SYSTEM'),
    ('SHIPPING',   'Shipping',    'Shipping or despatch point address',                      4, 'SYSTEM', 'SYSTEM'),
    ('DELIVERY',   'Delivery',    'Physical delivery or receiving address',                  5, 'SYSTEM', 'SYSTEM'),
    ('OTHER',      'Other',       'Address purpose does not fit standard classifications',   6, 'SYSTEM', 'SYSTEM');
GO


-- =============================================================================
-- 07. BANK_ACCOUNT_TYPE
-- Functional purpose of a bank account held by a legal entity or counterparty.
-- Child table: dbo.bank_account (column: account_type)
-- Previously also maintained in dbo.custom_config (group = BANK_ACCOUNT_TYPE).
-- =============================================================================
CREATE TABLE dbo.bank_account_type (
    bank_account_type_id    INT             NOT NULL IDENTITY(1,1),
    type_code               VARCHAR(50)     NOT NULL,
    type_name               VARCHAR(100)    NOT NULL,
    description             VARCHAR(500)    NULL,
    sort_order              SMALLINT        NOT NULL DEFAULT 0,
    is_active               BIT             NOT NULL DEFAULT 1,
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,
    updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_bank_account_type         PRIMARY KEY (bank_account_type_id),
    CONSTRAINT uq_bank_account_type_code    UNIQUE      (type_code)
);
GO
CREATE INDEX ix_bank_account_type_active ON dbo.bank_account_type (is_active, sort_order);
GO

INSERT INTO dbo.bank_account_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('SETTLEMENT', 'Settlement', 'Primary account for trade settlement payments',            1, 'SYSTEM', 'SYSTEM'),
    ('COLLATERAL', 'Collateral', 'Designated account for posting or receiving collateral',   2, 'SYSTEM', 'SYSTEM'),
    ('FEE',        'Fee',        'Account for brokerage and service fee payments',           3, 'SYSTEM', 'SYSTEM'),
    ('MARGIN',     'Margin',     'Exchange or CCP margin account',                           4, 'SYSTEM', 'SYSTEM'),
    ('GENERAL',    'General',    'General-purpose operating account',                        5, 'SYSTEM', 'SYSTEM'),
    ('ESCROW',     'Escrow',     'Third-party held escrow account',                          6, 'SYSTEM', 'SYSTEM');
GO


-- =============================================================================
-- 08. BOOK_TYPE
-- Defines the trading mandate and regulatory treatment of a P&L book.
-- Child table: dbo.book (column: book_type)
-- =============================================================================
CREATE TABLE dbo.book_type (
    book_type_id    INT             NOT NULL IDENTITY(1,1),
    type_code       VARCHAR(50)     NOT NULL,
    type_name       VARCHAR(100)    NOT NULL,
    description     VARCHAR(500)    NULL,
    sort_order      SMALLINT        NOT NULL DEFAULT 0,
    is_active       BIT             NOT NULL DEFAULT 1,
    created_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by      VARCHAR(100)    NOT NULL,
    updated_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by      VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_book_type         PRIMARY KEY (book_type_id),
    CONSTRAINT uq_book_type_code    UNIQUE      (type_code)
);
GO
CREATE INDEX ix_book_type_active ON dbo.book_type (is_active, sort_order);
GO

INSERT INTO dbo.book_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('TRADING',    'Trading',    'Proprietary trading book for physical and financial positions',  1, 'SYSTEM', 'SYSTEM'),
    ('HEDGING',    'Hedging',    'Risk-reduction book offsetting physical exposure',               2, 'SYSTEM', 'SYSTEM'),
    ('ARBITRAGE',  'Arbitrage',  'Book capturing price differentials across markets or locations', 3, 'SYSTEM', 'SYSTEM'),
    ('PROP',       'Prop',       'Proprietary book with a directional market view mandate',        4, 'SYSTEM', 'SYSTEM'),
    ('CLIENT',     'Client',     'Third-party client facilitation book',                           5, 'SYSTEM', 'SYSTEM'),
    ('RISK_MGMT',  'Risk Mgmt',  'Risk management and internal hedging book',                     6, 'SYSTEM', 'SYSTEM');
GO


-- =============================================================================
-- 09. LEGAL_ENTITY_TYPE
-- Corporate structure classification of an internal legal entity.
-- Child table: dbo.legal_entity (column: entity_type)
-- =============================================================================
CREATE TABLE dbo.legal_entity_type (
    legal_entity_type_id    INT             NOT NULL IDENTITY(1,1),
    type_code               VARCHAR(50)     NOT NULL,
    type_name               VARCHAR(100)    NOT NULL,
    description             VARCHAR(500)    NULL,
    sort_order              SMALLINT        NOT NULL DEFAULT 0,
    is_active               BIT             NOT NULL DEFAULT 1,
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,
    updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_legal_entity_type         PRIMARY KEY (legal_entity_type_id),
    CONSTRAINT uq_legal_entity_type_code    UNIQUE      (type_code)
);
GO
CREATE INDEX ix_legal_entity_type_active ON dbo.legal_entity_type (is_active, sort_order);
GO

INSERT INTO dbo.legal_entity_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('TRADING_COMPANY', 'Trading Company', 'Standalone commodity trading company',              1, 'SYSTEM', 'SYSTEM'),
    ('SUBSIDIARY',      'Subsidiary',      'Wholly or majority-owned subsidiary',               2, 'SYSTEM', 'SYSTEM'),
    ('BRANCH',          'Branch',          'Registered branch office of a parent entity',       3, 'SYSTEM', 'SYSTEM'),
    ('HOLDING',         'Holding',         'Non-trading holding company owning subsidiaries',   4, 'SYSTEM', 'SYSTEM'),
    ('BROKER',          'Broker',          'Intermediary entity with brokerage authorisation',  5, 'SYSTEM', 'SYSTEM');
GO


-- =============================================================================
-- 10. SETTLEMENT_TYPE
-- How a trade or product obligation is settled — delivery vs. cash.
-- Child tables:
--   dbo.product  (column: settlement_type)  values: PHYSICAL, FINANCIAL, OPTIONS, SWAP
--   dbo.trade    (column: settlement_type)  values: PHYSICAL, FINANCIAL, NETTED
-- Unified here; the child-table CHECK constraints restrict the applicable subset.
-- =============================================================================
CREATE TABLE dbo.settlement_type (
    settlement_type_id  INT             NOT NULL IDENTITY(1,1),
    type_code           VARCHAR(50)     NOT NULL,
    type_name           VARCHAR(100)    NOT NULL,
    description         VARCHAR(500)    NULL,
    sort_order          SMALLINT        NOT NULL DEFAULT 0,
    is_active           BIT             NOT NULL DEFAULT 1,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_settlement_type       PRIMARY KEY (settlement_type_id),
    CONSTRAINT uq_settlement_type_code  UNIQUE      (type_code)
);
GO
CREATE INDEX ix_settlement_type_active ON dbo.settlement_type (is_active, sort_order);
GO

INSERT INTO dbo.settlement_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('PHYSICAL',  'Physical',  'Commodity physically delivered to buyer',                      1, 'SYSTEM', 'SYSTEM'),
    ('FINANCIAL', 'Financial', 'Cash settlement against index — no physical delivery',         2, 'SYSTEM', 'SYSTEM'),
    ('OPTIONS',   'Options',   'Options contract — right but not obligation to deliver',       3, 'SYSTEM', 'SYSTEM'),
    ('SWAP',      'Swap',      'Fixed-for-floating price swap settled in cash',                4, 'SYSTEM', 'SYSTEM'),
    ('NETTED',    'Netted',    'Offset against an opposing position before settlement',        5, 'SYSTEM', 'SYSTEM');
GO


-- =============================================================================
-- 11. STORAGE_FACILITY_TYPE
-- Classification of a physical storage facility.
-- Child table: dbo.storage_facility (column: facility_type)
-- =============================================================================
CREATE TABLE dbo.storage_facility_type (
    storage_facility_type_id    INT             NOT NULL IDENTITY(1,1),
    type_code                   VARCHAR(50)     NOT NULL,
    type_name                   VARCHAR(100)    NOT NULL,
    description                 VARCHAR(500)    NULL,
    sort_order                  SMALLINT        NOT NULL DEFAULT 0,
    is_active                   BIT             NOT NULL DEFAULT 1,
    created_at                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                  VARCHAR(100)    NOT NULL,
    updated_at                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                  VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_storage_facility_type         PRIMARY KEY (storage_facility_type_id),
    CONSTRAINT uq_storage_facility_type_code    UNIQUE      (type_code)
);
GO
CREATE INDEX ix_storage_facility_type_active ON dbo.storage_facility_type (is_active, sort_order);
GO

INSERT INTO dbo.storage_facility_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('TANK',         'Tank',          'Above-ground or floating roof crude / product tank',    1, 'SYSTEM', 'SYSTEM'),
    ('WAREHOUSE',    'Warehouse',     'Dry bulk or packaged goods warehouse',                  2, 'SYSTEM', 'SYSTEM'),
    ('LNG_TERMINAL', 'LNG Terminal',  'Liquefied natural gas storage and regasification',      3, 'SYSTEM', 'SYSTEM'),
    ('GRAIN_SILO',   'Grain Silo',    'Agricultural grain storage silo or elevator',           4, 'SYSTEM', 'SYSTEM'),
    ('REFINERY',     'Refinery',      'Crude oil refinery with intermediate storage',          5, 'SYSTEM', 'SYSTEM'),
    ('CAVERN',       'Cavern',        'Underground salt cavern for gas or crude storage',      6, 'SYSTEM', 'SYSTEM'),
    ('VAULT',        'Vault',         'Secure vault for metals (LME-approved, precious)',      7, 'SYSTEM', 'SYSTEM'),
    ('OTHER',        'Other',         'Facility type not covered by standard classifications', 8, 'SYSTEM', 'SYSTEM');
GO


-- =============================================================================
-- 12. NETTING_AGREEMENT_TYPE
-- Master netting framework governing set-off between entity and counterparty.
-- Child table: dbo.netting_agreement (column: agreement_type)
-- =============================================================================
CREATE TABLE dbo.netting_agreement_type (
    netting_agreement_type_id   INT             NOT NULL IDENTITY(1,1),
    type_code                   VARCHAR(50)     NOT NULL,
    type_name                   VARCHAR(100)    NOT NULL,
    description                 VARCHAR(500)    NULL,
    sort_order                  SMALLINT        NOT NULL DEFAULT 0,
    is_active                   BIT             NOT NULL DEFAULT 1,
    created_at                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                  VARCHAR(100)    NOT NULL,
    updated_at                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                  VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_netting_agreement_type        PRIMARY KEY (netting_agreement_type_id),
    CONSTRAINT uq_netting_agreement_type_code   UNIQUE      (type_code)
);
GO
CREATE INDEX ix_netting_agreement_type_active ON dbo.netting_agreement_type (is_active, sort_order);
GO

INSERT INTO dbo.netting_agreement_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('ISDA_2002', 'ISDA 2002 MA',  'International Swaps & Derivatives Assoc. 2002 Master Agreement', 1, 'SYSTEM', 'SYSTEM'),
    ('ISDA_1992', 'ISDA 1992 MA',  'ISDA 1992 Master Agreement (predecessor to 2002 MA)',             2, 'SYSTEM', 'SYSTEM'),
    ('EFET',      'EFET GTMA',     'European Federation of Energy Traders General Agreement',          3, 'SYSTEM', 'SYSTEM'),
    ('GTMA',      'GTMA',          'Gas & Electricity Markets Trading Master Agreement',               4, 'SYSTEM', 'SYSTEM'),
    ('NAESB',     'NAESB',         'North American Energy Standards Board Base Contract',              5, 'SYSTEM', 'SYSTEM'),
    ('OTHER',     'Other',         'Bespoke or non-standard netting framework',                        6, 'SYSTEM', 'SYSTEM');
GO


-- =============================================================================
-- 13. TAX_TYPE
-- Tax registration category — VAT, EIN, UTR etc. per jurisdiction.
-- Child table: dbo.tax_registration (column: tax_type)
-- =============================================================================
CREATE TABLE dbo.tax_type (
    tax_type_id     INT             NOT NULL IDENTITY(1,1),
    type_code       VARCHAR(50)     NOT NULL,
    type_name       VARCHAR(100)    NOT NULL,
    description     VARCHAR(500)    NULL,
    sort_order      SMALLINT        NOT NULL DEFAULT 0,
    is_active       BIT             NOT NULL DEFAULT 1,
    created_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by      VARCHAR(100)    NOT NULL,
    updated_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by      VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_tax_type          PRIMARY KEY (tax_type_id),
    CONSTRAINT uq_tax_type_code     UNIQUE      (type_code)
);
GO
CREATE INDEX ix_tax_type_active ON dbo.tax_type (is_active, sort_order);
GO

INSERT INTO dbo.tax_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('VAT',   'VAT',   'Value Added Tax (EU, UK, and most jurisdictions)',            1, 'SYSTEM', 'SYSTEM'),
    ('GST',   'GST',   'Goods & Services Tax (Australia, Canada, India, etc.)',       2, 'SYSTEM', 'SYSTEM'),
    ('EIN',   'EIN',   'Employer Identification Number (USA federal tax ID)',          3, 'SYSTEM', 'SYSTEM'),
    ('UTR',   'UTR',   'Unique Taxpayer Reference (UK HMRC)',                         4, 'SYSTEM', 'SYSTEM'),
    ('TIN',   'TIN',   'Taxpayer Identification Number (generic)',                    5, 'SYSTEM', 'SYSTEM'),
    ('ABN',   'ABN',   'Australian Business Number',                                  6, 'SYSTEM', 'SYSTEM'),
    ('SIREN', 'SIREN', 'French company identifier (Système SIRENE)',                  7, 'SYSTEM', 'SYSTEM'),
    ('KVKK',  'KVKK',  'Turkish trade register number (Ticaret Sicil Numarası)',      8, 'SYSTEM', 'SYSTEM'),
    ('OTHER', 'Other', 'Tax registration type not covered by standard codes',         9, 'SYSTEM', 'SYSTEM');
GO


-- =============================================================================
-- ADD FK COLUMNS TO CHILD TABLES
-- Each column is nullable and mirrors the existing text column.
-- Backfill runs immediately after the column is added so the FK is populated
-- from existing data before any constraint is enforced.
-- Original text columns are kept; they can be dropped in a later migration
-- once application code moves over to the FK columns.
-- =============================================================================


-- ── Non-temporal tables ───────────────────────────────────────────────────────

-- dbo.contact → contact_role
ALTER TABLE dbo.contact
    ADD contact_role_id INT NULL
        CONSTRAINT fk_contact_role_id REFERENCES dbo.contact_role(contact_role_id);
GO
UPDATE c
SET    c.contact_role_id = cr.contact_role_id
FROM   dbo.contact c
JOIN   dbo.contact_role cr ON cr.type_code = c.contact_role
WHERE  c.contact_role IS NOT NULL;
GO

-- dbo.address → address_type
ALTER TABLE dbo.address
    ADD address_type_id INT NULL
        CONSTRAINT fk_address_type_id REFERENCES dbo.address_type(address_type_id);
GO
UPDATE a
SET    a.address_type_id = at2.address_type_id
FROM   dbo.address a
JOIN   dbo.address_type at2 ON at2.type_code = a.address_type
WHERE  a.address_type IS NOT NULL;
GO

-- dbo.bank_account → bank_account_type
ALTER TABLE dbo.bank_account
    ADD bank_account_type_id INT NULL
        CONSTRAINT fk_bank_account_type_id REFERENCES dbo.bank_account_type(bank_account_type_id);
GO
UPDATE b
SET    b.bank_account_type_id = bat.bank_account_type_id
FROM   dbo.bank_account b
JOIN   dbo.bank_account_type bat ON bat.type_code = b.account_type
WHERE  b.account_type IS NOT NULL;
GO

-- dbo.payment_term → payment_method
ALTER TABLE dbo.payment_term
    ADD payment_method_id INT NULL
        CONSTRAINT fk_payment_term_method_id REFERENCES dbo.payment_method(payment_method_id);
GO
UPDATE pt
SET    pt.payment_method_id = pm.payment_method_id
FROM   dbo.payment_term pt
JOIN   dbo.payment_method pm ON pm.type_code = pt.payment_method
WHERE  pt.payment_method IS NOT NULL;
GO

-- dbo.product → settlement_type
ALTER TABLE dbo.product
    ADD settlement_type_id INT NULL
        CONSTRAINT fk_product_settlement_type_id REFERENCES dbo.settlement_type(settlement_type_id);
GO
UPDATE p
SET    p.settlement_type_id = st.settlement_type_id
FROM   dbo.product p
JOIN   dbo.settlement_type st ON st.type_code = p.settlement_type
WHERE  p.settlement_type IS NOT NULL;
GO

-- dbo.storage_facility → storage_facility_type
ALTER TABLE dbo.storage_facility
    ADD storage_facility_type_id INT NULL
        CONSTRAINT fk_storage_facility_type_id REFERENCES dbo.storage_facility_type(storage_facility_type_id);
GO
UPDATE sf
SET    sf.storage_facility_type_id = sft.storage_facility_type_id
FROM   dbo.storage_facility sf
JOIN   dbo.storage_facility_type sft ON sft.type_code = sf.facility_type
WHERE  sf.facility_type IS NOT NULL;
GO

-- dbo.netting_agreement → netting_agreement_type
ALTER TABLE dbo.netting_agreement
    ADD netting_agreement_type_id INT NULL
        CONSTRAINT fk_netting_agreement_type_id REFERENCES dbo.netting_agreement_type(netting_agreement_type_id);
GO
UPDATE na
SET    na.netting_agreement_type_id = nat.netting_agreement_type_id
FROM   dbo.netting_agreement na
JOIN   dbo.netting_agreement_type nat ON nat.type_code = na.agreement_type
WHERE  na.agreement_type IS NOT NULL;
GO

-- dbo.tax_registration → tax_type
ALTER TABLE dbo.tax_registration
    ADD tax_type_id INT NULL
        CONSTRAINT fk_tax_registration_type_id REFERENCES dbo.tax_type(tax_type_id);
GO
UPDATE tr
SET    tr.tax_type_id = tt.tax_type_id
FROM   dbo.tax_registration tr
JOIN   dbo.tax_type tt ON tt.type_code = tr.tax_type
WHERE  tr.tax_type IS NOT NULL;
GO


-- ── Temporal tables — toggle system versioning off/on for each ALTER ──────────

-- dbo.book → book_type
ALTER TABLE dbo.book SET (SYSTEM_VERSIONING = OFF);
GO
ALTER TABLE dbo.book
    ADD book_type_id INT NULL
        CONSTRAINT fk_book_type_id REFERENCES dbo.book_type(book_type_id);
GO
UPDATE b
SET    b.book_type_id = bt.book_type_id
FROM   dbo.book b
JOIN   dbo.book_type bt ON bt.type_code = b.book_type
WHERE  b.book_type IS NOT NULL;
GO
ALTER TABLE dbo.book SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.book_history));
GO

-- dbo.legal_entity → legal_entity_type
ALTER TABLE dbo.legal_entity SET (SYSTEM_VERSIONING = OFF);
GO
ALTER TABLE dbo.legal_entity
    ADD legal_entity_type_id INT NULL
        CONSTRAINT fk_legal_entity_type_id REFERENCES dbo.legal_entity_type(legal_entity_type_id);
GO
UPDATE le
SET    le.legal_entity_type_id = let2.legal_entity_type_id
FROM   dbo.legal_entity le
JOIN   dbo.legal_entity_type let2 ON let2.type_code = le.entity_type
WHERE  le.entity_type IS NOT NULL;
GO
ALTER TABLE dbo.legal_entity SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.legal_entity_history));
GO

-- dbo.counterparty → counterparty_type + kyc_status
ALTER TABLE dbo.counterparty SET (SYSTEM_VERSIONING = OFF);
GO
ALTER TABLE dbo.counterparty
    ADD counterparty_type_id INT NULL
        CONSTRAINT fk_counterparty_type_id REFERENCES dbo.counterparty_type(counterparty_type_id);
GO
ALTER TABLE dbo.counterparty
    ADD kyc_status_id INT NULL
        CONSTRAINT fk_counterparty_kyc_status_id REFERENCES dbo.kyc_status(kyc_status_id);
GO
UPDATE cp
SET    cp.counterparty_type_id = ct.counterparty_type_id
FROM   dbo.counterparty cp
JOIN   dbo.counterparty_type ct ON ct.type_code = cp.cp_type
WHERE  cp.cp_type IS NOT NULL;
GO
UPDATE cp
SET    cp.kyc_status_id = ks.kyc_status_id
FROM   dbo.counterparty cp
JOIN   dbo.kyc_status ks ON ks.type_code = cp.kyc_status
WHERE  cp.kyc_status IS NOT NULL;
GO
ALTER TABLE dbo.counterparty SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.counterparty_history));
GO

-- dbo.trade → deal_type + settlement_type
ALTER TABLE dbo.trade SET (SYSTEM_VERSIONING = OFF);
GO
ALTER TABLE dbo.trade
    ADD deal_type_id INT NULL
        CONSTRAINT fk_trade_deal_type_id REFERENCES dbo.deal_type(deal_type_id);
GO
ALTER TABLE dbo.trade
    ADD trade_settlement_type_id INT NULL
        CONSTRAINT fk_trade_settlement_type_id REFERENCES dbo.settlement_type(settlement_type_id);
GO
UPDATE t
SET    t.deal_type_id = dt.deal_type_id
FROM   dbo.trade t
JOIN   dbo.deal_type dt ON dt.type_code = t.trade_type
WHERE  t.trade_type IS NOT NULL;
GO
UPDATE t
SET    t.trade_settlement_type_id = st.settlement_type_id
FROM   dbo.trade t
JOIN   dbo.settlement_type st ON st.type_code = t.settlement_type
WHERE  t.settlement_type IS NOT NULL;
GO
ALTER TABLE dbo.trade SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.trade_history));
GO


-- =============================================================================
-- REGISTER ALL 13 NEW TABLES IN master_data_table_registry
-- =============================================================================
INSERT INTO dbo.master_data_table_registry
    (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES
    -- Trade / Deal
    ('deal_type',              'Deal Types',              'Trade',          1, 1, 0, 0,  1, 'SYSTEM', 'SYSTEM'),
    -- Payment
    ('payment_method',         'Payment Methods',         'Commercial',     1, 1, 0, 0,  1, 'SYSTEM', 'SYSTEM'),
    -- Counterparty grouping
    ('counterparty_type',      'Counterparty Types',      'Counterparty',   1, 1, 0, 0,  1, 'SYSTEM', 'SYSTEM'),
    ('kyc_status',             'KYC Statuses',            'Counterparty',   1, 1, 0, 0,  2, 'SYSTEM', 'SYSTEM'),
    -- Organisation
    ('contact_role',           'Contact Roles',           'Organisation',   1, 1, 0, 0,  1, 'SYSTEM', 'SYSTEM'),
    ('book_type',              'Book Types',              'Organisation',   1, 1, 0, 0,  2, 'SYSTEM', 'SYSTEM'),
    ('legal_entity_type',      'Legal Entity Types',      'Organisation',   1, 1, 0, 0,  3, 'SYSTEM', 'SYSTEM'),
    -- Shared / polymorphic
    ('address_type',           'Address Types',           'Reference',      1, 1, 0, 0,  6, 'SYSTEM', 'SYSTEM'),
    ('bank_account_type',      'Bank Account Types',      'Reference',      1, 1, 0, 0,  7, 'SYSTEM', 'SYSTEM'),
    ('tax_type',               'Tax Types',               'Reference',      1, 1, 0, 0,  8, 'SYSTEM', 'SYSTEM'),
    -- Product / settlement
    ('settlement_type',        'Settlement Types',        'Products',       1, 1, 0, 0,  1, 'SYSTEM', 'SYSTEM'),
    -- Logistics
    ('storage_facility_type',  'Storage Facility Types',  'Logistics',      1, 1, 0, 0,  1, 'SYSTEM', 'SYSTEM'),
    -- Legal
    ('netting_agreement_type', 'Netting Agreement Types', 'Commercial',     1, 1, 0, 0,  2, 'SYSTEM', 'SYSTEM');
GO


-- =============================================================================
-- REMOVE custom_config ENTIRELY
-- The five config groups it served (COUNTERPARTY_TYPE, KYC_STATUS, CONTACT_ROLE,
-- ADDRESS_TYPE, BANK_ACCOUNT_TYPE) now each have a dedicated parent table.
-- Drop the table and delete its registry row so no route can ever reach it.
-- =============================================================================
IF OBJECT_ID('dbo.custom_config', 'U') IS NOT NULL DROP TABLE dbo.custom_config;
GO
DELETE FROM dbo.master_data_table_registry WHERE table_name = 'custom_config';
GO


PRINT '===========================================================================';
PRINT 'V17 — PARENT LOOKUP TABLES v1.0 APPLIED';
PRINT '  13 parent reference tables created and seeded:';
PRINT '    deal_type (4), payment_method (7), counterparty_type (9),';
PRINT '    kyc_status (5), contact_role (11), address_type (6),';
PRINT '    bank_account_type (6), book_type (6), legal_entity_type (5),';
PRINT '    settlement_type (5), storage_facility_type (8),';
PRINT '    netting_agreement_type (6), tax_type (9)';
PRINT '  FK columns added and backfilled on:';
PRINT '    contact, address, bank_account, payment_term, product,';
PRINT '    storage_facility, netting_agreement, tax_registration';
PRINT '    book (*), legal_entity (*), counterparty (*), trade (*)';
PRINT '  (*) temporal table — system versioning toggled off/on';
PRINT '  13 rows added to master_data_table_registry';
PRINT '===========================================================================';
GO
