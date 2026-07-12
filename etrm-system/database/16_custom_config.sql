-- =============================================================================
-- ETRM SYSTEM — CUSTOM CONFIG (generic configurable type catalog)
-- SQL Server 2022 | Version 1.0 | June 2026
-- =============================================================================
-- ADDS 1 TABLE:
--   01. custom_config
-- =============================================================================
-- PURPOSE:
--   Stores configurable picklist values for UI-driven master data types such
--   as counterparty types, KYC statuses, and other reference values. Records
--   can be added and deactivated, but not deleted through the UI.
-- =============================================================================

USE ETRM_DB;
GO

IF OBJECT_ID('dbo.custom_config', 'U') IS NOT NULL DROP TABLE dbo.custom_config;
GO

CREATE TABLE dbo.custom_config (
    custom_config_id   INT             NOT NULL IDENTITY(1,1),
    config_group       VARCHAR(50)     NOT NULL,
    code               VARCHAR(50)     NOT NULL,
    label              VARCHAR(200)    NOT NULL,
    sort_order         SMALLINT        NOT NULL DEFAULT 0,
    is_active          BIT             NOT NULL DEFAULT 1,
    notes              VARCHAR(500)    NULL,
    created_at         DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by         VARCHAR(100)    NOT NULL,
    updated_at         DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by         VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_custom_config      PRIMARY KEY (custom_config_id),
    CONSTRAINT uq_custom_config_group_code UNIQUE (config_group, code)
);
GO
CREATE INDEX ix_custom_config_group ON dbo.custom_config (config_group, is_active, sort_order);
GO

INSERT INTO dbo.custom_config
    (config_group, code, label, sort_order, created_by, updated_by)
VALUES
    ('COUNTERPARTY_TYPE', 'PRODUCER', 'Producer', 1, 'SYSTEM', 'SYSTEM'),
    ('COUNTERPARTY_TYPE', 'CONSUMER', 'Consumer', 2, 'SYSTEM', 'SYSTEM'),
    ('COUNTERPARTY_TYPE', 'TRADER', 'Trader', 3, 'SYSTEM', 'SYSTEM'),
    ('COUNTERPARTY_TYPE', 'BANK', 'Bank', 4, 'SYSTEM', 'SYSTEM'),
    ('COUNTERPARTY_TYPE', 'BROKER', 'Broker', 5, 'SYSTEM', 'SYSTEM'),
    ('COUNTERPARTY_TYPE', 'EXCHANGE', 'Exchange', 6, 'SYSTEM', 'SYSTEM'),
    ('COUNTERPARTY_TYPE', 'INTERCOMPANY', 'Intercompany', 7, 'SYSTEM', 'SYSTEM'),
    ('COUNTERPARTY_TYPE', 'UTILITY', 'Utility', 8, 'SYSTEM', 'SYSTEM'),
    ('COUNTERPARTY_TYPE', 'OTHER', 'Other', 9, 'SYSTEM', 'SYSTEM'),
    ('KYC_STATUS', 'PENDING', 'Pending', 1, 'SYSTEM', 'SYSTEM'),
    ('KYC_STATUS', 'APPROVED', 'Approved', 2, 'SYSTEM', 'SYSTEM'),
    ('KYC_STATUS', 'REVIEW', 'Review', 3, 'SYSTEM', 'SYSTEM'),
    ('KYC_STATUS', 'SUSPENDED', 'Suspended', 4, 'SYSTEM', 'SYSTEM'),
    ('KYC_STATUS', 'REJECTED', 'Rejected', 5, 'SYSTEM', 'SYSTEM'),
    ('CONTACT_ROLE', 'TRADER', 'Trader', 1, 'SYSTEM', 'SYSTEM'),
    ('CONTACT_ROLE', 'BACK_OFFICE', 'Back Office', 2, 'SYSTEM', 'SYSTEM'),
    ('CONTACT_ROLE', 'LEGAL', 'Legal', 3, 'SYSTEM', 'SYSTEM'),
    ('CONTACT_ROLE', 'COMPLIANCE', 'Compliance', 4, 'SYSTEM', 'SYSTEM'),
    ('CONTACT_ROLE', 'ACCOUNTS', 'Accounts', 5, 'SYSTEM', 'SYSTEM'),
    ('CONTACT_ROLE', 'PRIMARY', 'Primary', 6, 'SYSTEM', 'SYSTEM'),
    ('CONTACT_ROLE', 'OPERATIONS', 'Operations', 7, 'SYSTEM', 'SYSTEM'),
    ('CONTACT_ROLE', 'TECHNICAL', 'Technical', 8, 'SYSTEM', 'SYSTEM'),
    ('CONTACT_ROLE', 'CREDIT', 'Credit', 9, 'SYSTEM', 'SYSTEM'),
    ('CONTACT_ROLE', 'KYC', 'KYC', 10, 'SYSTEM', 'SYSTEM'),
    ('CONTACT_ROLE', 'OTHER', 'Other', 11, 'SYSTEM', 'SYSTEM'),
    ('ADDRESS_TYPE', 'REGISTERED', 'Registered', 1, 'SYSTEM', 'SYSTEM'),
    ('ADDRESS_TYPE', 'TRADING', 'Trading', 2, 'SYSTEM', 'SYSTEM'),
    ('ADDRESS_TYPE', 'BILLING', 'Billing', 3, 'SYSTEM', 'SYSTEM'),
    ('ADDRESS_TYPE', 'SHIPPING', 'Shipping', 4, 'SYSTEM', 'SYSTEM'),
    ('ADDRESS_TYPE', 'DELIVERY', 'Delivery', 5, 'SYSTEM', 'SYSTEM'),
    ('ADDRESS_TYPE', 'OTHER', 'Other', 6, 'SYSTEM', 'SYSTEM'),
    ('BANK_ACCOUNT_TYPE', 'SETTLEMENT', 'Settlement', 1, 'SYSTEM', 'SYSTEM'),
    ('BANK_ACCOUNT_TYPE', 'COLLATERAL', 'Collateral', 2, 'SYSTEM', 'SYSTEM'),
    ('BANK_ACCOUNT_TYPE', 'FEE', 'Fee', 3, 'SYSTEM', 'SYSTEM'),
    ('BANK_ACCOUNT_TYPE', 'MARGIN', 'Margin', 4, 'SYSTEM', 'SYSTEM'),
    ('BANK_ACCOUNT_TYPE', 'GENERAL', 'General', 5, 'SYSTEM', 'SYSTEM'),
    ('BANK_ACCOUNT_TYPE', 'ESCROW', 'Escrow', 6, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'CUSTOM CONFIG v1.0 APPLIED';
PRINT '  01. custom_config — seeded with configurable party and contact types.';
PRINT '============================================================';
GO
