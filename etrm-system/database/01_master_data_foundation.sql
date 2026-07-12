-- =============================================================================
-- ETRM SYSTEM — COMPLETE MASTER DATA SCHEMA
-- SQL Server 2022 | Version 2.0 | May 2026
-- Multi-Commodity: Oil, Power, Gas, Agricultural, Metals
-- Multi-Entity / Multi-Book | Polymorphic shared tables
-- =============================================================================
-- EXECUTION ORDER:
--  GROUP 1 — Pure reference (no FK dependencies)
--    01. lookup_value
--    02. currency
--    03. commodity
--    04. unit_of_measure
--    05. location_type
--    06. credit_rating
--    07. incoterm
--    08. pricing_type
--    09. price_index
--    10. holiday_calendar
--  GROUP 2 — Polymorphic shared tables (no entity FKs yet)
--    11. address
--    12. tax_registration
--    13. bank_account
--    14. contact
--  GROUP 3 — Organisation
--    15. legal_entity
--    16. app_user
--    17. user_role
--    18. desk
--    19. trader
--    20. book
--  GROUP 4 — Counterparty & party
--    21. counterparty
--    22. netting_agreement
--    23. cp_legal_entity_link
--  GROUP 5 — Commodity & product
--    24. product
--    25. uom_conversion
--    26. product_price_index
--  GROUP 6 — Commercial terms
--    27. payment_term
--    28. credit_term
--    29. gtc
--    30. gtc_version
--    31. cp_commercial_terms
--    32. cp_gtc_agreement
--  GROUP 7 — Location & geography
--    33. location
--    34. pipeline
--    35. storage_facility
--    36. cp_location
--  GROUP 8 — Currency & calendar
--    37. fx_rate
--    38. holiday
--    39. settlement_calendar
--  GROUP 9 — System & audit
--    40. audit_log
--    41. document_store
--    42. system_config
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- HELPER: drop tables if re-running (reverse FK order)
-- =============================================================================
IF OBJECT_ID('dbo.audit_log',              'U') IS NOT NULL DROP TABLE dbo.audit_log;
IF OBJECT_ID('dbo.document_store',         'U') IS NOT NULL DROP TABLE dbo.document_store;
IF OBJECT_ID('dbo.system_config',          'U') IS NOT NULL DROP TABLE dbo.system_config;
IF OBJECT_ID('dbo.settlement_calendar',    'U') IS NOT NULL DROP TABLE dbo.settlement_calendar;
IF OBJECT_ID('dbo.holiday',                'U') IS NOT NULL DROP TABLE dbo.holiday;
IF OBJECT_ID('dbo.fx_rate',                'U') IS NOT NULL DROP TABLE dbo.fx_rate;
IF OBJECT_ID('dbo.cp_location',            'U') IS NOT NULL DROP TABLE dbo.cp_location;
IF OBJECT_ID('dbo.storage_facility',       'U') IS NOT NULL DROP TABLE dbo.storage_facility;
IF OBJECT_ID('dbo.pipeline',               'U') IS NOT NULL DROP TABLE dbo.pipeline;
IF OBJECT_ID('dbo.location',               'U') IS NOT NULL DROP TABLE dbo.location;
IF OBJECT_ID('dbo.cp_gtc_agreement',       'U') IS NOT NULL DROP TABLE dbo.cp_gtc_agreement;
IF OBJECT_ID('dbo.cp_commercial_terms',    'U') IS NOT NULL DROP TABLE dbo.cp_commercial_terms;
IF OBJECT_ID('dbo.gtc_version',            'U') IS NOT NULL DROP TABLE dbo.gtc_version;
IF OBJECT_ID('dbo.gtc',                    'U') IS NOT NULL DROP TABLE dbo.gtc;
IF OBJECT_ID('dbo.credit_term',            'U') IS NOT NULL DROP TABLE dbo.credit_term;
IF OBJECT_ID('dbo.payment_term',           'U') IS NOT NULL DROP TABLE dbo.payment_term;
IF OBJECT_ID('dbo.product_price_index',    'U') IS NOT NULL DROP TABLE dbo.product_price_index;
IF OBJECT_ID('dbo.uom_conversion',         'U') IS NOT NULL DROP TABLE dbo.uom_conversion;
IF OBJECT_ID('dbo.product',                'U') IS NOT NULL DROP TABLE dbo.product;
IF OBJECT_ID('dbo.cp_legal_entity_link',   'U') IS NOT NULL DROP TABLE dbo.cp_legal_entity_link;
IF OBJECT_ID('dbo.netting_agreement',      'U') IS NOT NULL DROP TABLE dbo.netting_agreement;
IF OBJECT_ID('dbo.counterparty',           'U') IS NOT NULL DROP TABLE dbo.counterparty;
IF OBJECT_ID('dbo.book',                   'U') IS NOT NULL DROP TABLE dbo.book;
IF OBJECT_ID('dbo.trader',                 'U') IS NOT NULL DROP TABLE dbo.trader;
IF OBJECT_ID('dbo.desk',                   'U') IS NOT NULL DROP TABLE dbo.desk;
IF OBJECT_ID('dbo.user_role',              'U') IS NOT NULL DROP TABLE dbo.user_role;
IF OBJECT_ID('dbo.app_user',               'U') IS NOT NULL DROP TABLE dbo.app_user;
IF OBJECT_ID('dbo.legal_entity',           'U') IS NOT NULL DROP TABLE dbo.legal_entity;
IF OBJECT_ID('dbo.contact',                'U') IS NOT NULL DROP TABLE dbo.contact;
IF OBJECT_ID('dbo.bank_account',           'U') IS NOT NULL DROP TABLE dbo.bank_account;
IF OBJECT_ID('dbo.tax_registration',       'U') IS NOT NULL DROP TABLE dbo.tax_registration;
IF OBJECT_ID('dbo.address',                'U') IS NOT NULL DROP TABLE dbo.address;
IF OBJECT_ID('dbo.product_price_index',    'U') IS NOT NULL DROP TABLE dbo.product_price_index;
IF OBJECT_ID('dbo.price_index',            'U') IS NOT NULL DROP TABLE dbo.price_index;
IF OBJECT_ID('dbo.pricing_type',           'U') IS NOT NULL DROP TABLE dbo.pricing_type;
IF OBJECT_ID('dbo.incoterm',               'U') IS NOT NULL DROP TABLE dbo.incoterm;
IF OBJECT_ID('dbo.credit_rating',          'U') IS NOT NULL DROP TABLE dbo.credit_rating;
IF OBJECT_ID('dbo.location_type',          'U') IS NOT NULL DROP TABLE dbo.location_type;
IF OBJECT_ID('dbo.unit_of_measure',        'U') IS NOT NULL DROP TABLE dbo.unit_of_measure;
IF OBJECT_ID('dbo.commodity',              'U') IS NOT NULL DROP TABLE dbo.commodity;
IF OBJECT_ID('dbo.currency',               'U') IS NOT NULL DROP TABLE dbo.currency;
IF OBJECT_ID('dbo.holiday_calendar',       'U') IS NOT NULL DROP TABLE dbo.holiday_calendar;
IF OBJECT_ID('dbo.lookup_value',           'U') IS NOT NULL DROP TABLE dbo.lookup_value;
GO

-- =============================================================================
-- GROUP 1 — PURE REFERENCE TABLES
-- =============================================================================

-- 01. LOOKUP_VALUE
-- Generic key-value store for all system picklists.
-- Avoids proliferation of tiny reference tables.
-- category examples: 'ENTITY_TYPE','BOOK_TYPE','CONTACT_ROLE','ADDRESS_TYPE'
-- =============================================================================
CREATE TABLE dbo.lookup_value (
    lookup_id       INT             NOT NULL IDENTITY(1,1),
    category        VARCHAR(50)     NOT NULL,
    code            VARCHAR(50)     NOT NULL,
    display_name    VARCHAR(200)    NOT NULL,
    sort_order      SMALLINT        NOT NULL DEFAULT 0,
    is_active       BIT             NOT NULL DEFAULT 1,
    notes           VARCHAR(500)    NULL,

    CONSTRAINT pk_lookup_value      PRIMARY KEY (lookup_id),
    CONSTRAINT uq_lookup_cat_code   UNIQUE      (category, code)
);
GO
CREATE INDEX ix_lookup_category ON dbo.lookup_value (category, is_active, sort_order);
GO

-- 02. CURRENCY
-- ISO 4217 currency reference data.
-- =============================================================================
CREATE TABLE dbo.currency (
    currency_id     INT             NOT NULL IDENTITY(1,1),
    currency_code   CHAR(3)         NOT NULL,
    currency_name   VARCHAR(100)    NOT NULL,
    symbol          VARCHAR(5)      NULL,
    decimal_places  TINYINT         NOT NULL DEFAULT 2,
    is_active       BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_currency          PRIMARY KEY (currency_id),
    CONSTRAINT uq_currency_code     UNIQUE      (currency_code)
);
GO

-- 03. COMMODITY
-- Top-level commodity classification.
-- =============================================================================
CREATE TABLE dbo.commodity (
    commodity_id    INT             NOT NULL IDENTITY(1,1),
    commodity_code  VARCHAR(20)     NOT NULL,
    commodity_name  VARCHAR(100)    NOT NULL,
    commodity_type  VARCHAR(20)     NOT NULL
        CONSTRAINT chk_commodity_type CHECK (commodity_type IN (
            'OIL','POWER','GAS','AGRICULTURAL','METALS','OTHER'
        )),
    description     VARCHAR(500)    NULL,
    is_active       BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_commodity         PRIMARY KEY (commodity_id),
    CONSTRAINT uq_commodity_code    UNIQUE      (commodity_code)
);
GO

-- 04. UNIT_OF_MEASURE
-- All units across all commodities.
-- base_uom_code = the canonical unit for this category/commodity.
-- =============================================================================
CREATE TABLE dbo.unit_of_measure (
    uom_id              INT             NOT NULL IDENTITY(1,1),
    uom_code            VARCHAR(20)     NOT NULL,
    uom_name            VARCHAR(100)    NOT NULL,
    uom_category        VARCHAR(20)     NOT NULL
        CONSTRAINT chk_uom_category CHECK (uom_category IN (
            'VOLUME','WEIGHT','ENERGY','POWER','TEMPERATURE','COUNT','OTHER'
        )),
    commodity_type      VARCHAR(20)     NULL,   -- NULL = cross-commodity
    base_uom_code       VARCHAR(20)     NULL,
    conversion_factor   DECIMAL(20,10)  NULL,   -- multiplier to base unit
    is_active           BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_uom               PRIMARY KEY (uom_id),
    CONSTRAINT uq_uom_code          UNIQUE      (uom_code)
);
GO

-- 05. LOCATION_TYPE
-- Standalone reference for location classifications.
-- =============================================================================
CREATE TABLE dbo.location_type (
    location_type_id    INT             NOT NULL IDENTITY(1,1),
    type_code           VARCHAR(30)     NOT NULL,
    type_name           VARCHAR(100)    NOT NULL,
    commodity_type      VARCHAR(20)     NULL,   -- NULL = multi-commodity
    description         VARCHAR(300)    NULL,
    is_active           BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_location_type     PRIMARY KEY (location_type_id),
    CONSTRAINT uq_location_type_code UNIQUE     (type_code)
);
GO

-- 06. CREDIT_RATING
-- Rating agency reference table.
-- =============================================================================
CREATE TABLE dbo.credit_rating (
    credit_rating_id    INT             NOT NULL IDENTITY(1,1),
    agency              VARCHAR(20)     NOT NULL,
    rating              VARCHAR(10)     NOT NULL,
    numeric_score       TINYINT         NOT NULL,   -- 1 (best) to 25 (worst)
    risk_category       VARCHAR(20)     NOT NULL
        CONSTRAINT chk_credit_risk_cat CHECK (risk_category IN (
            'INVESTMENT_GRADE','SPECULATIVE','DEFAULT','UNRATED'
        )),
    description         VARCHAR(200)    NULL,
    is_active           BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_credit_rating     PRIMARY KEY (credit_rating_id),
    CONSTRAINT uq_credit_agency_rtg UNIQUE      (agency, rating)
);
GO

-- 07. INCOTERM
-- International commercial terms (ICC Incoterms 2020).
-- =============================================================================
CREATE TABLE dbo.incoterm (
    incoterm_id     INT             NOT NULL IDENTITY(1,1),
    code            VARCHAR(10)     NOT NULL,   -- 'FOB','CIF','DDP' etc.
    name            VARCHAR(100)    NOT NULL,
    transport_mode  VARCHAR(20)     NOT NULL
        CONSTRAINT chk_incoterm_mode CHECK (transport_mode IN (
            'ANY','SEA_INLAND_WATERWAY'
        )),
    risk_transfer   VARCHAR(200)    NULL,       -- plain-language description
    version_year    SMALLINT        NOT NULL DEFAULT 2020,
    is_active       BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_incoterm          PRIMARY KEY (incoterm_id),
    CONSTRAINT uq_incoterm_code     UNIQUE      (code, version_year)
);
GO

-- 08. PRICING_TYPE
-- Defines the structure of how a trade is priced.
-- =============================================================================
CREATE TABLE dbo.pricing_type (
    pricing_type_id     INT             NOT NULL IDENTITY(1,1),
    type_code           VARCHAR(30)     NOT NULL,
    type_name           VARCHAR(100)    NOT NULL,
    description         VARCHAR(500)    NULL,
    requires_index      BIT             NOT NULL DEFAULT 0,   -- INDEX, DIFFERENTIAL, FORMULA
    requires_formula    BIT             NOT NULL DEFAULT 0,   -- FORMULA only
    is_active           BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_pricing_type      PRIMARY KEY (pricing_type_id),
    CONSTRAINT uq_pricing_type_code UNIQUE      (type_code)
);
GO

-- 09. PRICE_INDEX
-- Market price benchmarks per commodity.
-- e.g. Dated Brent, WTI, TTF, NBP, JKM, LME Copper.
-- =============================================================================
CREATE TABLE dbo.price_index (
    price_index_id      INT             NOT NULL IDENTITY(1,1),
    commodity_id        INT             NOT NULL,
    index_code          VARCHAR(30)     NOT NULL,   -- 'DATED_BRENT','WTI','TTF'
    index_name          VARCHAR(200)    NOT NULL,
    currency_id         INT             NOT NULL,
    uom_id              INT             NOT NULL,   -- price per this unit
    publication_source  VARCHAR(100)    NULL,       -- 'PLATTS','ARGUS','ICE','LME'
    publication_page    VARCHAR(100)    NULL,       -- e.g. 'AAWLD00' (Platts code)
    fixing_time         TIME            NULL,       -- daily fixing time UTC
    fixing_timezone     VARCHAR(50)     NULL,
    description         VARCHAR(500)    NULL,
    is_active           BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_price_index       PRIMARY KEY (price_index_id),
    CONSTRAINT uq_price_index_code  UNIQUE      (index_code),
    CONSTRAINT fk_pi_commodity      FOREIGN KEY (commodity_id) REFERENCES dbo.commodity(commodity_id),
    CONSTRAINT fk_pi_currency       FOREIGN KEY (currency_id)  REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_pi_uom            FOREIGN KEY (uom_id)       REFERENCES dbo.unit_of_measure(uom_id)
);
GO

-- 10. HOLIDAY_CALENDAR
-- =============================================================================
CREATE TABLE dbo.holiday_calendar (
    calendar_id         INT             NOT NULL IDENTITY(1,1),
    calendar_code       VARCHAR(20)     NOT NULL,
    calendar_name       VARCHAR(200)    NOT NULL,
    country_code        CHAR(2)         NULL,
    commodity_type      VARCHAR(20)     NULL,   -- NULL = all commodities
    description         VARCHAR(500)    NULL,
    is_active           BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_holiday_calendar  PRIMARY KEY (calendar_id),
    CONSTRAINT uq_holiday_cal_code  UNIQUE      (calendar_code)
);
GO


-- =============================================================================
-- GROUP 2 — POLYMORPHIC SHARED TABLES
-- entity_type controls which table entity_id references.
-- Enforced via CHECK constraint + application layer.
-- Valid entity_type values per table documented below.
-- =============================================================================

-- 11. ADDRESS
-- Shared address table for: LEGAL_ENTITY, COUNTERPARTY, LOCATION,
--                           STORAGE_FACILITY, CONTACT
-- address_type: REGISTERED, TRADING, BILLING, SHIPPING, DELIVERY, OTHER
-- =============================================================================
CREATE TABLE dbo.address (
    address_id          INT             NOT NULL IDENTITY(1,1),
    entity_type         VARCHAR(30)     NOT NULL
        CONSTRAINT chk_addr_entity_type CHECK (entity_type IN (
            'LEGAL_ENTITY','COUNTERPARTY','LOCATION',
            'STORAGE_FACILITY','CONTACT'
        )),
    entity_id           INT             NOT NULL,
    address_type        VARCHAR(20)     NOT NULL DEFAULT 'REGISTERED'
        CONSTRAINT chk_addr_type CHECK (address_type IN (
            'REGISTERED','TRADING','BILLING','SHIPPING','DELIVERY','OTHER'
        )),
    is_primary          BIT             NOT NULL DEFAULT 0,
    address_line1       VARCHAR(200)    NOT NULL,
    address_line2       VARCHAR(200)    NULL,
    address_line3       VARCHAR(200)    NULL,
    city                VARCHAR(100)    NOT NULL,
    state_province      VARCHAR(100)    NULL,
    postal_code         VARCHAR(20)     NULL,
    country_code        CHAR(2)         NOT NULL,   -- ISO 3166-1 alpha-2
    po_box              VARCHAR(50)     NULL,
    latitude            DECIMAL(9,6)    NULL,
    longitude           DECIMAL(9,6)   NULL,
    valid_from          DATE            NULL,
    valid_to            DATE            NULL,
    notes               VARCHAR(500)    NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_address           PRIMARY KEY (address_id)
);
GO
CREATE INDEX ix_address_entity ON dbo.address (entity_type, entity_id, address_type, is_active);
GO

-- 12. TAX_REGISTRATION
-- Shared tax/VAT registration for: LEGAL_ENTITY, COUNTERPARTY
-- tax_type: VAT, GST, EIN, UTR, TIN, ABN, SIREN, OTHER
-- =============================================================================
CREATE TABLE dbo.tax_registration (
    tax_reg_id          INT             NOT NULL IDENTITY(1,1),
    entity_type         VARCHAR(30)     NOT NULL
        CONSTRAINT chk_tax_entity_type CHECK (entity_type IN (
            'LEGAL_ENTITY','COUNTERPARTY'
        )),
    entity_id           INT             NOT NULL,
    tax_type            VARCHAR(20)     NOT NULL
        CONSTRAINT chk_tax_type CHECK (tax_type IN (
            'VAT','GST','EIN','UTR','TIN','ABN','SIREN','KVKK','OTHER'
        )),
    tax_id              VARCHAR(50)     NOT NULL,   -- the actual registration number
    jurisdiction        CHAR(2)         NOT NULL,   -- ISO country code
    issuing_authority   VARCHAR(100)    NULL,       -- e.g. 'HMRC','IRS','ATO'
    registration_date   DATE            NULL,
    valid_from          DATE            NULL,
    valid_to            DATE            NULL,       -- NULL = no expiry
    is_primary          BIT             NOT NULL DEFAULT 0,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_tax_registration  PRIMARY KEY (tax_reg_id),
    CONSTRAINT uq_tax_reg           UNIQUE      (entity_type, entity_id, tax_type, jurisdiction)
);
GO
CREATE INDEX ix_tax_reg_entity ON dbo.tax_registration (entity_type, entity_id, is_active);
GO

-- 13. BANK_ACCOUNT
-- Shared bank accounts for: LEGAL_ENTITY (our accounts), COUNTERPARTY (their accounts)
-- account_type: SETTLEMENT, COLLATERAL, FEE, MARGIN, GENERAL
-- =============================================================================
CREATE TABLE dbo.bank_account (
    bank_account_id     INT             NOT NULL IDENTITY(1,1),
    entity_type         VARCHAR(30)     NOT NULL
        CONSTRAINT chk_bank_entity_type CHECK (entity_type IN (
            'LEGAL_ENTITY','COUNTERPARTY'
        )),
    entity_id           INT             NOT NULL,
    account_type        VARCHAR(20)     NOT NULL DEFAULT 'SETTLEMENT'
        CONSTRAINT chk_bank_acct_type CHECK (account_type IN (
            'SETTLEMENT','COLLATERAL','FEE','MARGIN','GENERAL','ESCROW'
        )),
    currency_id         INT             NOT NULL,
    is_primary          BIT             NOT NULL DEFAULT 0,
    bank_name           VARCHAR(200)    NOT NULL,
    bank_code           VARCHAR(20)     NULL,       -- local sort code / routing number
    swift_bic           VARCHAR(11)     NULL,       -- SWIFT/BIC code
    iban                VARCHAR(34)     NULL,       -- IBAN where applicable
    account_number      VARCHAR(50)     NULL,       -- local account number
    account_name        VARCHAR(200)    NOT NULL,   -- name on account
    bank_address_id     INT             NULL,       -- FK to address (bank's address)
    correspondent_swift VARCHAR(11)     NULL,       -- correspondent bank BIC
    correspondent_name  VARCHAR(200)    NULL,
    valid_from          DATE            NULL,
    valid_to            DATE            NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_bank_account      PRIMARY KEY (bank_account_id),
    CONSTRAINT fk_bank_currency     FOREIGN KEY (currency_id) REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_bank_address      FOREIGN KEY (bank_address_id) REFERENCES dbo.address(address_id)
);
GO
CREATE INDEX ix_bank_acct_entity ON dbo.bank_account (entity_type, entity_id, account_type, is_active);
GO

-- 14. CONTACT
-- Shared contact table for: LEGAL_ENTITY, COUNTERPARTY
-- contact_role: TRADER, BACK_OFFICE, LEGAL, COMPLIANCE,
--               ACCOUNTS, PRIMARY, OPERATIONS, TECHNICAL, OTHER
-- =============================================================================
CREATE TABLE dbo.contact (
    contact_id          INT             NOT NULL IDENTITY(1,1),
    entity_type         VARCHAR(30)     NOT NULL
        CONSTRAINT chk_contact_entity_type CHECK (entity_type IN (
            'LEGAL_ENTITY','COUNTERPARTY'
        )),
    entity_id           INT             NOT NULL,
    contact_role        VARCHAR(30)     NOT NULL
        CONSTRAINT chk_contact_role CHECK (contact_role IN (
            'TRADER','BACK_OFFICE','LEGAL','COMPLIANCE',
            'ACCOUNTS','PRIMARY','OPERATIONS','TECHNICAL',
            'CREDIT','KYC','OTHER'
        )),
    salutation          VARCHAR(10)     NULL,
    first_name          VARCHAR(100)    NOT NULL,
    last_name           VARCHAR(100)    NOT NULL,
    job_title           VARCHAR(200)    NULL,
    email               VARCHAR(255)    NULL,
    phone_direct        VARCHAR(50)     NULL,
    phone_mobile        VARCHAR(50)     NULL,
    phone_main          VARCHAR(50)     NULL,
    is_primary          BIT             NOT NULL DEFAULT 0,
    is_active           BIT             NOT NULL DEFAULT 1,
    valid_from          DATE            NULL,
    valid_to            DATE            NULL,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_contact           PRIMARY KEY (contact_id)
);
GO
CREATE INDEX ix_contact_entity ON dbo.contact (entity_type, entity_id, contact_role, is_active);
GO


-- =============================================================================
-- GROUP 3 — ORGANISATION
-- =============================================================================

-- 15. LEGAL_ENTITY
-- Internal trading companies / subsidiaries / branches.
-- Self-referencing FK for group hierarchy.
-- Temporal table for full audit history (regulatory requirement).
-- =============================================================================
CREATE TABLE dbo.legal_entity (
    legal_entity_id         INT             NOT NULL IDENTITY(1,1),
    entity_code             VARCHAR(20)     NOT NULL,
    entity_name             VARCHAR(200)    NOT NULL,
    short_name              VARCHAR(100)    NOT NULL,
    lei_code                VARCHAR(20)     NULL,
    entity_type             VARCHAR(30)     NOT NULL
        CONSTRAINT chk_le_type CHECK (entity_type IN (
            'TRADING_COMPANY','SUBSIDIARY','BRANCH','HOLDING','BROKER'
        )),
    parent_entity_id        INT             NULL,   -- self-ref: group hierarchy
    jurisdiction            CHAR(2)         NOT NULL,
    incorporation_country   CHAR(2)         NULL,
    incorporation_number    VARCHAR(50)     NULL,
    base_currency           CHAR(3)         NOT NULL DEFAULT 'USD',
    default_timezone        VARCHAR(50)     NULL,
    regulator               VARCHAR(100)    NULL,
    regulatory_licence      VARCHAR(100)    NULL,
    is_internal             BIT             NOT NULL DEFAULT 1,
    is_active               BIT             NOT NULL DEFAULT 1,
    go_live_date            DATE            NULL,
    deactivated_date        DATE            NULL,
    notes                   VARCHAR(1000)   NULL,
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,
    updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_legal_entity          PRIMARY KEY (legal_entity_id),
    CONSTRAINT uq_legal_entity_code     UNIQUE      (entity_code),
    CONSTRAINT uq_legal_entity_lei      UNIQUE      (lei_code),
    CONSTRAINT fk_le_parent             FOREIGN KEY (parent_entity_id)
                                        REFERENCES  dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_le_currency           FOREIGN KEY (base_currency)
                                        REFERENCES  dbo.currency(currency_code)
) WITH (DATA_COMPRESSION = ROW);
GO

ALTER TABLE dbo.legal_entity
    ADD valid_from DATETIME2 GENERATED ALWAYS AS ROW START HIDDEN
            CONSTRAINT df_le_vf DEFAULT SYSUTCDATETIME(),
        valid_to   DATETIME2 GENERATED ALWAYS AS ROW END   HIDDEN
            CONSTRAINT df_le_vt DEFAULT CONVERT(DATETIME2,'9999-12-31 23:59:59.9999999'),
        PERIOD FOR SYSTEM_TIME (valid_from, valid_to);
GO
ALTER TABLE dbo.legal_entity
    SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.legal_entity_history));
GO

-- 16. APP_USER
-- All system users regardless of role.
-- =============================================================================
CREATE TABLE dbo.app_user (
    user_id                 INT             NOT NULL IDENTITY(1,1),
    legal_entity_id         INT             NOT NULL,
    username                VARCHAR(100)    NOT NULL,
    email                   VARCHAR(255)    NOT NULL,
    password_hash           VARCHAR(255)    NOT NULL,   -- bcrypt
    full_name               VARCHAR(200)    NOT NULL,
    display_name            VARCHAR(100)    NULL,
    department              VARCHAR(100)    NULL,
    default_timezone        VARCHAR(50)     NULL,
    mfa_enabled             BIT             NOT NULL DEFAULT 0,
    mfa_secret              VARCHAR(200)    NULL,       -- encrypted TOTP secret
    last_login              DATETIME2       NULL,
    password_changed_at     DATETIME2       NULL,
    failed_login_count      TINYINT         NOT NULL DEFAULT 0,
    locked_until            DATETIME2       NULL,
    is_active               BIT             NOT NULL DEFAULT 1,
    deactivated_date        DATE            NULL,
    notes                   VARCHAR(500)    NULL,
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,
    updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_app_user          PRIMARY KEY (user_id),
    CONSTRAINT uq_user_username     UNIQUE      (username),
    CONSTRAINT uq_user_email        UNIQUE      (email),
    CONSTRAINT fk_user_entity       FOREIGN KEY (legal_entity_id)
                                    REFERENCES  dbo.legal_entity(legal_entity_id)
) WITH (DATA_COMPRESSION = ROW);
GO

ALTER TABLE dbo.app_user
    ADD valid_from DATETIME2 GENERATED ALWAYS AS ROW START HIDDEN
            CONSTRAINT df_au_vf DEFAULT SYSUTCDATETIME(),
        valid_to   DATETIME2 GENERATED ALWAYS AS ROW END   HIDDEN
            CONSTRAINT df_au_vt DEFAULT CONVERT(DATETIME2,'9999-12-31 23:59:59.9999999'),
        PERIOD FOR SYSTEM_TIME (valid_from, valid_to);
GO
ALTER TABLE dbo.app_user
    SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.app_user_history));
GO

-- 17. USER_ROLE
-- Explicit role assignment table (normalised from comma-separated string).
-- Supports time-bounded role assignments (e.g. temp elevated access).
-- =============================================================================
CREATE TABLE dbo.user_role (
    user_role_id        INT             NOT NULL IDENTITY(1,1),
    user_id             INT             NOT NULL,
    role_code           VARCHAR(50)     NOT NULL
        CONSTRAINT chk_role_code CHECK (role_code IN (
            'TRADER','SENIOR_TRADER','RISK_MANAGER','BACK_OFFICE',
            'COMPLIANCE','ADMIN','READ_ONLY','SYSTEM','APPROVER'
        )),
    legal_entity_id     INT             NULL,   -- NULL = role applies to all entities
    granted_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    granted_by          VARCHAR(100)    NOT NULL,
    valid_from          DATE            NULL,
    valid_to            DATE            NULL,
    is_active           BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_user_role         PRIMARY KEY (user_role_id),
    CONSTRAINT uq_user_role         UNIQUE      (user_id, role_code, legal_entity_id),
    CONSTRAINT fk_ur_user           FOREIGN KEY (user_id)           REFERENCES dbo.app_user(user_id),
    CONSTRAINT fk_ur_entity         FOREIGN KEY (legal_entity_id)   REFERENCES dbo.legal_entity(legal_entity_id)
);
GO
CREATE INDEX ix_user_role_user ON dbo.user_role (user_id, is_active) INCLUDE (role_code);
GO

-- 18. DESK
-- Trading desk — grouping of traders within a legal entity.
-- =============================================================================
CREATE TABLE dbo.desk (
    desk_id             INT             NOT NULL IDENTITY(1,1),
    legal_entity_id     INT             NOT NULL,
    desk_code           VARCHAR(20)     NOT NULL,
    desk_name           VARCHAR(200)    NOT NULL,
    commodity_type      VARCHAR(20)     NULL,   -- NULL = multi-commodity desk
    head_trader_id      INT             NULL,   -- FK to trader, set after trader created
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_desk              PRIMARY KEY (desk_id),
    CONSTRAINT uq_desk_code         UNIQUE      (desk_code),
    CONSTRAINT fk_desk_entity       FOREIGN KEY (legal_entity_id) REFERENCES dbo.legal_entity(legal_entity_id)
);
GO

-- 19. TRADER
-- Trading users — 1:1 with app_user. Carries limits and desk assignment.
-- =============================================================================
CREATE TABLE dbo.trader (
    trader_id               INT             NOT NULL IDENTITY(1,1),
    user_id                 INT             NOT NULL,
    legal_entity_id         INT             NOT NULL,
    desk_id                 INT             NULL,
    trader_code             VARCHAR(20)     NOT NULL,
    commodity_types         VARCHAR(200)    NULL,   -- e.g. 'OIL,GAS'
    daily_trade_limit       DECIMAL(18,2)   NULL,
    single_trade_limit      DECIMAL(18,2)   NULL,
    position_limit          DECIMAL(18,4)   NULL,
    limit_currency          CHAR(3)         NOT NULL DEFAULT 'USD',
    approver_trader_id      INT             NULL,   -- who approves this trader's large deals
    is_active               BIT             NOT NULL DEFAULT 1,
    go_live_date            DATE            NULL,
    deactivated_date        DATE            NULL,
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,
    updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_trader            PRIMARY KEY (trader_id),
    CONSTRAINT uq_trader_user       UNIQUE      (user_id),
    CONSTRAINT uq_trader_code       UNIQUE      (trader_code),
    CONSTRAINT fk_trader_user       FOREIGN KEY (user_id)           REFERENCES dbo.app_user(user_id),
    CONSTRAINT fk_trader_entity     FOREIGN KEY (legal_entity_id)   REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_trader_desk       FOREIGN KEY (desk_id)           REFERENCES dbo.desk(desk_id),
    CONSTRAINT fk_trader_approver   FOREIGN KEY (approver_trader_id) REFERENCES dbo.trader(trader_id)
);
GO

-- Now that trader exists, wire head_trader_id on desk
ALTER TABLE dbo.desk
    ADD CONSTRAINT fk_desk_head_trader FOREIGN KEY (head_trader_id) REFERENCES dbo.trader(trader_id);
GO

-- 20. BOOK
-- Trading book — P&L segregation unit within a legal entity.
-- Every trade belongs to a book.
-- =============================================================================
CREATE TABLE dbo.book (
    book_id                 INT             NOT NULL IDENTITY(1,1),
    legal_entity_id         INT             NOT NULL,
    desk_id                 INT             NULL,
    responsible_trader_id   INT             NOT NULL,
    book_code               VARCHAR(30)     NOT NULL,
    book_name               VARCHAR(200)    NOT NULL,
    commodity_type          VARCHAR(20)     NOT NULL
        CONSTRAINT chk_book_commodity CHECK (commodity_type IN (
            'OIL','POWER','GAS','AGRICULTURAL','METALS','MULTI','OTHER'
        )),
    book_type               VARCHAR(20)     NOT NULL DEFAULT 'TRADING'
        CONSTRAINT chk_book_type CHECK (book_type IN (
            'TRADING','HEDGING','ARBITRAGE','PROP','CLIENT','RISK_MGMT'
        )),
    base_currency           CHAR(3)         NOT NULL DEFAULT 'USD',
    position_limit          DECIMAL(18,4)   NULL,
    pnl_limit               DECIMAL(18,2)   NULL,
    var_limit               DECIMAL(18,2)   NULL,
    is_active               BIT             NOT NULL DEFAULT 1,
    go_live_date            DATE            NULL,
    description             VARCHAR(500)    NULL,
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,
    updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_book              PRIMARY KEY (book_id),
    CONSTRAINT uq_book_code         UNIQUE      (book_code),
    CONSTRAINT fk_book_entity       FOREIGN KEY (legal_entity_id)       REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_book_desk         FOREIGN KEY (desk_id)               REFERENCES dbo.desk(desk_id),
    CONSTRAINT fk_book_trader       FOREIGN KEY (responsible_trader_id) REFERENCES dbo.trader(trader_id)
) WITH (DATA_COMPRESSION = ROW);
GO

ALTER TABLE dbo.book
    ADD valid_from DATETIME2 GENERATED ALWAYS AS ROW START HIDDEN
            CONSTRAINT df_bk_vf DEFAULT SYSUTCDATETIME(),
        valid_to   DATETIME2 GENERATED ALWAYS AS ROW END   HIDDEN
            CONSTRAINT df_bk_vt DEFAULT CONVERT(DATETIME2,'9999-12-31 23:59:59.9999999'),
        PERIOD FOR SYSTEM_TIME (valid_from, valid_to);
GO
ALTER TABLE dbo.book
    SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.book_history));
GO

CREATE INDEX ix_book_entity  ON dbo.book (legal_entity_id, commodity_type, is_active);
CREATE INDEX ix_book_trader  ON dbo.book (responsible_trader_id) INCLUDE (book_code, is_active);
GO


-- =============================================================================
-- GROUP 4 — COUNTERPARTY & PARTY
-- =============================================================================

-- 21. COUNTERPARTY
-- External trading counterparties.
-- Addresses, bank accounts, contacts, tax regs via polymorphic tables.
-- Temporal table: credit limit changes are auditable events.
-- =============================================================================
CREATE TABLE dbo.counterparty (
    counterparty_id         INT             NOT NULL IDENTITY(1,1),
    cp_code                 VARCHAR(20)     NOT NULL,
    legal_name              VARCHAR(300)    NOT NULL,
    short_name              VARCHAR(100)    NOT NULL,
    lei_code                VARCHAR(20)     NULL,
    jurisdiction            CHAR(2)         NOT NULL,
    cp_type                 VARCHAR(30)     NOT NULL
        CONSTRAINT chk_cp_type CHECK (cp_type IN (
            'PRODUCER','CONSUMER','TRADER','BANK','BROKER',
            'EXCHANGE','INTERCOMPANY','UTILITY','OTHER'
        )),
    credit_rating_id        INT             NULL,
    credit_limit            DECIMAL(18,2)   NULL,
    credit_limit_currency   CHAR(3)         NOT NULL DEFAULT 'USD',
    credit_review_date      DATE            NULL,
    settlement_days         TINYINT         NOT NULL DEFAULT 2,
    default_currency_id     INT             NULL,
    is_intercompany         BIT             NOT NULL DEFAULT 0,
    internal_entity_id      INT             NULL,   -- FK to legal_entity if intercompany
    is_active               BIT             NOT NULL DEFAULT 1,
    kyc_status              VARCHAR(20)     NOT NULL DEFAULT 'PENDING'
        CONSTRAINT chk_kyc_status CHECK (kyc_status IN (
            'PENDING','APPROVED','REVIEW','SUSPENDED','REJECTED'
        )),
    kyc_approved_date       DATE            NULL,
    kyc_expiry_date         DATE            NULL,
    onboarded_date          DATE            NULL,
    deactivated_date        DATE            NULL,
    notes                   VARCHAR(1000)   NULL,
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,
    updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_counterparty          PRIMARY KEY (counterparty_id),
    CONSTRAINT uq_cp_code               UNIQUE      (cp_code),
    CONSTRAINT uq_cp_lei                UNIQUE      (lei_code),
    CONSTRAINT fk_cp_credit_rating      FOREIGN KEY (credit_rating_id)  REFERENCES dbo.credit_rating(credit_rating_id),
    CONSTRAINT fk_cp_entity             FOREIGN KEY (internal_entity_id) REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_cp_currency           FOREIGN KEY (default_currency_id) REFERENCES dbo.currency(currency_id)
) WITH (DATA_COMPRESSION = ROW);
GO

ALTER TABLE dbo.counterparty
    ADD valid_from DATETIME2 GENERATED ALWAYS AS ROW START HIDDEN
            CONSTRAINT df_cp_vf DEFAULT SYSUTCDATETIME(),
        valid_to   DATETIME2 GENERATED ALWAYS AS ROW END   HIDDEN
            CONSTRAINT df_cp_vt DEFAULT CONVERT(DATETIME2,'9999-12-31 23:59:59.9999999'),
        PERIOD FOR SYSTEM_TIME (valid_from, valid_to);
GO
ALTER TABLE dbo.counterparty
    SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.counterparty_history));
GO

CREATE INDEX ix_cp_type         ON dbo.counterparty (cp_type, is_active)   INCLUDE (cp_code, legal_name);
CREATE INDEX ix_cp_jurisdiction ON dbo.counterparty (jurisdiction)          INCLUDE (cp_code, legal_name);
CREATE INDEX ix_cp_kyc          ON dbo.counterparty (kyc_status, is_active) INCLUDE (cp_code, kyc_expiry_date);
GO

-- 22. NETTING_AGREEMENT
-- ISDA/EFET master netting agreements between legal entity and counterparty.
-- =============================================================================
CREATE TABLE dbo.netting_agreement (
    netting_id          INT             NOT NULL IDENTITY(1,1),
    legal_entity_id     INT             NOT NULL,
    counterparty_id     INT             NOT NULL,
    agreement_type      VARCHAR(20)     NOT NULL
        CONSTRAINT chk_netting_type CHECK (agreement_type IN (
            'ISDA_2002','ISDA_1992','EFET','GTMA','NAESB','OTHER'
        )),
    agreement_ref       VARCHAR(100)    NULL,   -- internal reference number
    effective_date      DATE            NOT NULL,
    termination_date    DATE            NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_netting           PRIMARY KEY (netting_id),
    CONSTRAINT uq_netting           UNIQUE      (legal_entity_id, counterparty_id, agreement_type),
    CONSTRAINT fk_netting_entity    FOREIGN KEY (legal_entity_id)  REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_netting_cp        FOREIGN KEY (counterparty_id)  REFERENCES dbo.counterparty(counterparty_id)
);
GO

-- 23. CP_LEGAL_ENTITY_LINK
-- Which counterparties each legal entity is authorised to trade with.
-- Includes per-pair credit limit override and approved commodity types.
-- =============================================================================
CREATE TABLE dbo.cp_legal_entity_link (
    link_id                 INT             NOT NULL IDENTITY(1,1),
    legal_entity_id         INT             NOT NULL,
    counterparty_id         INT             NOT NULL,
    approved_commodities    VARCHAR(200)    NULL,   -- 'OIL,GAS' or NULL = all
    credit_limit_override   DECIMAL(18,2)   NULL,   -- overrides cp-level limit for this entity
    limit_currency          CHAR(3)         NOT NULL DEFAULT 'USD',
    requires_approval_above DECIMAL(18,2)   NULL,   -- deal approval threshold
    is_active               BIT             NOT NULL DEFAULT 1,
    approved_date           DATE            NULL,
    approved_by             VARCHAR(100)    NULL,
    notes                   VARCHAR(500)    NULL,

    CONSTRAINT pk_cp_le_link        PRIMARY KEY (link_id),
    CONSTRAINT uq_cp_le_link        UNIQUE      (legal_entity_id, counterparty_id),
    CONSTRAINT fk_cplink_entity     FOREIGN KEY (legal_entity_id) REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_cplink_cp         FOREIGN KEY (counterparty_id) REFERENCES dbo.counterparty(counterparty_id)
);
GO


-- =============================================================================
-- GROUP 5 — COMMODITY & PRODUCT
-- =============================================================================

-- 24. PRODUCT
-- Tradeable products. Commodity-specific attributes via trade extension tables.
-- =============================================================================
CREATE TABLE dbo.product (
    product_id              INT             NOT NULL IDENTITY(1,1),
    commodity_id            INT             NOT NULL,
    product_code            VARCHAR(30)     NOT NULL,
    product_name            VARCHAR(200)    NOT NULL,
    settlement_type         VARCHAR(20)     NOT NULL
        CONSTRAINT chk_prod_settlement CHECK (settlement_type IN (
            'PHYSICAL','FINANCIAL','OPTIONS','SWAP'
        )),
    default_pricing_type_id INT             NULL,
    default_uom_id          INT             NULL,
    default_currency_id     INT             NULL,
    default_incoterm_id     INT             NULL,
    lot_size                DECIMAL(18,4)   NULL,
    min_quantity            DECIMAL(18,4)   NULL,
    max_quantity            DECIMAL(18,4)   NULL,
    description             VARCHAR(500)    NULL,
    is_active               BIT             NOT NULL DEFAULT 1,
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_product           PRIMARY KEY (product_id),
    CONSTRAINT uq_product_code      UNIQUE      (product_code),
    CONSTRAINT fk_prod_commodity    FOREIGN KEY (commodity_id)          REFERENCES dbo.commodity(commodity_id),
    CONSTRAINT fk_prod_pricing_type FOREIGN KEY (default_pricing_type_id) REFERENCES dbo.pricing_type(pricing_type_id),
    CONSTRAINT fk_prod_uom          FOREIGN KEY (default_uom_id)        REFERENCES dbo.unit_of_measure(uom_id),
    CONSTRAINT fk_prod_currency     FOREIGN KEY (default_currency_id)   REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_prod_incoterm     FOREIGN KEY (default_incoterm_id)   REFERENCES dbo.incoterm(incoterm_id)
);
GO
CREATE INDEX ix_product_commodity ON dbo.product (commodity_id, is_active) INCLUDE (product_code, product_name);
GO

-- 25. UOM_CONVERSION
-- Explicit conversion factors between any two units.
-- Separate from uom table to support cross-commodity conversions.
-- =============================================================================
CREATE TABLE dbo.uom_conversion (
    conversion_id       INT             NOT NULL IDENTITY(1,1),
    from_uom_id         INT             NOT NULL,
    to_uom_id           INT             NOT NULL,
    factor              DECIMAL(20,10)  NOT NULL,   -- from_uom * factor = to_uom
    commodity_type      VARCHAR(20)     NULL,       -- NULL = universal conversion
    valid_from          DATE            NULL,
    valid_to            DATE            NULL,
    notes               VARCHAR(200)    NULL,

    CONSTRAINT pk_uom_conversion    PRIMARY KEY (conversion_id),
    CONSTRAINT uq_uom_conversion    UNIQUE      (from_uom_id, to_uom_id, commodity_type),
    CONSTRAINT fk_uomc_from         FOREIGN KEY (from_uom_id) REFERENCES dbo.unit_of_measure(uom_id),
    CONSTRAINT fk_uomc_to           FOREIGN KEY (to_uom_id)   REFERENCES dbo.unit_of_measure(uom_id)
);
GO

-- 26. PRODUCT_PRICE_INDEX
-- Maps which price indices are valid for each product.
-- A product may have multiple valid indices (primary + alternative).
-- =============================================================================
CREATE TABLE dbo.product_price_index (
    product_index_id    INT             NOT NULL IDENTITY(1,1),
    product_id          INT             NOT NULL,
    price_index_id      INT             NOT NULL,
    is_primary          BIT             NOT NULL DEFAULT 0,
    is_active           BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_prod_index        PRIMARY KEY (product_index_id),
    CONSTRAINT uq_prod_index        UNIQUE      (product_id, price_index_id),
    CONSTRAINT fk_pi_product        FOREIGN KEY (product_id)     REFERENCES dbo.product(product_id),
    CONSTRAINT fk_pi_index          FOREIGN KEY (price_index_id) REFERENCES dbo.price_index(price_index_id)
);
GO


-- =============================================================================
-- GROUP 6 — COMMERCIAL TERMS
-- =============================================================================

-- 27. PAYMENT_TERM
-- When payment is due. Referenced by counterparty defaults and deals.
-- =============================================================================
CREATE TABLE dbo.payment_term (
    payment_term_id     INT             NOT NULL IDENTITY(1,1),
    term_code           VARCHAR(30)     NOT NULL,   -- 'NET_30','NET_45','PREPAY'
    term_name           VARCHAR(200)    NOT NULL,
    payment_days        SMALLINT        NOT NULL DEFAULT 0,
    days_basis          VARCHAR(20)     NOT NULL DEFAULT 'CALENDAR'
        CONSTRAINT chk_pt_days_basis CHECK (days_basis IN (
            'CALENDAR','BUSINESS'
        )),
    payment_method      VARCHAR(30)     NOT NULL DEFAULT 'WIRE'
        CONSTRAINT chk_pt_method CHECK (payment_method IN (
            'WIRE','LETTER_OF_CREDIT','BANK_GUARANTEE',
            'PREPAYMENT','NETTING','CHEQUE','OTHER'
        )),
    calendar_id         INT             NULL,   -- business day calendar for calculation
    description         VARCHAR(500)    NULL,
    is_active           BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_payment_term      PRIMARY KEY (payment_term_id),
    CONSTRAINT uq_payment_term_code UNIQUE      (term_code),
    CONSTRAINT fk_pt_calendar       FOREIGN KEY (calendar_id) REFERENCES dbo.holiday_calendar(calendar_id)
);
GO

-- 28. CREDIT_TERM
-- Distinct from payment terms — covers credit period, collateral,
-- margin calls, netting eligibility.
-- =============================================================================
CREATE TABLE dbo.credit_term (
    credit_term_id      INT             NOT NULL IDENTITY(1,1),
    term_code           VARCHAR(30)     NOT NULL,
    term_name           VARCHAR(200)    NOT NULL,
    credit_period_days  SMALLINT        NOT NULL DEFAULT 0,
    collateral_type     VARCHAR(30)     NULL
        CONSTRAINT chk_ct_collateral CHECK (collateral_type IN (
            'NONE','CASH','LETTER_OF_CREDIT','PARENT_GUARANTEE',
            'BANK_GUARANTEE','PLEDGE','OTHER'
        )),
    margin_call_threshold DECIMAL(18,2) NULL,   -- USD threshold to trigger margin call
    margin_call_currency  CHAR(3)       NOT NULL DEFAULT 'USD',
    netting_eligible    BIT             NOT NULL DEFAULT 0,
    requires_isda       BIT             NOT NULL DEFAULT 0,
    description         VARCHAR(500)    NULL,
    is_active           BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_credit_term       PRIMARY KEY (credit_term_id),
    CONSTRAINT uq_credit_term_code  UNIQUE      (term_code)
);
GO

-- 29. GTC
-- Master General Terms & Conditions document per commodity / jurisdiction.
-- =============================================================================
CREATE TABLE dbo.gtc (
    gtc_id              INT             NOT NULL IDENTITY(1,1),
    gtc_code            VARCHAR(30)     NOT NULL,
    gtc_name            VARCHAR(200)    NOT NULL,
    commodity_type      VARCHAR(20)     NULL,   -- NULL = all commodities
    jurisdiction        CHAR(2)         NULL,   -- NULL = all jurisdictions
    governing_law       VARCHAR(100)    NULL,   -- e.g. 'English Law','New York Law'
    dispute_resolution  VARCHAR(100)    NULL,   -- e.g. 'ICC Arbitration','LCIA'
    description         VARCHAR(500)    NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_gtc               PRIMARY KEY (gtc_id),
    CONSTRAINT uq_gtc_code          UNIQUE      (gtc_code)
);
GO

-- 30. GTC_VERSION
-- Versioned GTC documents. Each amendment creates a new version.
-- Actual document stored in document_store; linked via document_store_id.
-- =============================================================================
CREATE TABLE dbo.gtc_version (
    gtc_version_id      INT             NOT NULL IDENTITY(1,1),
    gtc_id              INT             NOT NULL,
    version_number      VARCHAR(20)     NOT NULL,   -- e.g. '1.0','2.1','2024-A'
    effective_date      DATE            NOT NULL,
    superseded_date     DATE            NULL,
    summary_of_changes  VARCHAR(1000)   NULL,
    document_store_id   INT             NULL,       -- FK added after document_store
    is_current          BIT             NOT NULL DEFAULT 0,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_gtc_version       PRIMARY KEY (gtc_version_id),
    CONSTRAINT uq_gtc_version       UNIQUE      (gtc_id, version_number),
    CONSTRAINT fk_gtcv_gtc          FOREIGN KEY (gtc_id) REFERENCES dbo.gtc(gtc_id)
);
GO

-- 31. CP_COMMERCIAL_TERMS
-- Default payment and credit terms per counterparty / legal entity pair.
-- Can be overridden at deal level.
-- =============================================================================
CREATE TABLE dbo.cp_commercial_terms (
    cp_terms_id             INT             NOT NULL IDENTITY(1,1),
    counterparty_id         INT             NOT NULL,
    legal_entity_id         INT             NOT NULL,
    payment_term_id         INT             NOT NULL,
    credit_term_id          INT             NOT NULL,
    default_currency_id     INT             NULL,
    default_incoterm_id     INT             NULL,
    commodity_type          VARCHAR(20)     NULL,   -- NULL = applies to all commodities
    effective_date          DATE            NOT NULL,
    expiry_date             DATE            NULL,
    is_active               BIT             NOT NULL DEFAULT 1,
    notes                   VARCHAR(500)    NULL,
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,
    updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_cp_comm_terms     PRIMARY KEY (cp_terms_id),
    CONSTRAINT uq_cp_comm_terms     UNIQUE      (counterparty_id, legal_entity_id, commodity_type, effective_date),
    CONSTRAINT fk_cpct_cp           FOREIGN KEY (counterparty_id)   REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT fk_cpct_entity       FOREIGN KEY (legal_entity_id)   REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_cpct_payment      FOREIGN KEY (payment_term_id)   REFERENCES dbo.payment_term(payment_term_id),
    CONSTRAINT fk_cpct_credit       FOREIGN KEY (credit_term_id)    REFERENCES dbo.credit_term(credit_term_id),
    CONSTRAINT fk_cpct_currency     FOREIGN KEY (default_currency_id) REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_cpct_incoterm     FOREIGN KEY (default_incoterm_id) REFERENCES dbo.incoterm(incoterm_id)
);
GO

-- 32. CP_GTC_AGREEMENT
-- Records which GTC version is agreed with each counterparty.
-- A counterparty may have different GTCs per legal entity or commodity.
-- =============================================================================
CREATE TABLE dbo.cp_gtc_agreement (
    cp_gtc_id           INT             NOT NULL IDENTITY(1,1),
    counterparty_id     INT             NOT NULL,
    legal_entity_id     INT             NOT NULL,
    gtc_version_id      INT             NOT NULL,
    signed_date         DATE            NULL,
    effective_date      DATE            NOT NULL,
    expiry_date         DATE            NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    document_store_id   INT             NULL,   -- signed copy, FK added later
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_cp_gtc            PRIMARY KEY (cp_gtc_id),
    CONSTRAINT uq_cp_gtc            UNIQUE      (counterparty_id, legal_entity_id, gtc_version_id),
    CONSTRAINT fk_cpgtc_cp          FOREIGN KEY (counterparty_id)  REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT fk_cpgtc_entity      FOREIGN KEY (legal_entity_id)  REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_cpgtc_version     FOREIGN KEY (gtc_version_id)   REFERENCES dbo.gtc_version(gtc_version_id)
);
GO


-- =============================================================================
-- GROUP 7 — LOCATION & GEOGRAPHY
-- =============================================================================

-- 33. LOCATION
-- Physical delivery points, hubs, grid nodes, ports.
-- Addresses via polymorphic address table.
-- =============================================================================
CREATE TABLE dbo.location (
    location_id         INT             NOT NULL IDENTITY(1,1),
    location_type_id    INT             NOT NULL,
    location_code       VARCHAR(30)     NOT NULL,
    location_name       VARCHAR(200)    NOT NULL,
    commodity_type      VARCHAR(20)     NULL,   -- NULL = multi-commodity
    country_code        CHAR(2)         NOT NULL,
    region              VARCHAR(100)    NULL,
    timezone            VARCHAR(50)     NULL,
    latitude            DECIMAL(9,6)    NULL,
    longitude           DECIMAL(9,6)   NULL,
    operator            VARCHAR(200)    NULL,   -- operating company name
    capacity            DECIMAL(18,4)   NULL,
    capacity_uom_id     INT             NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_location          PRIMARY KEY (location_id),
    CONSTRAINT uq_location_code     UNIQUE      (location_code),
    CONSTRAINT fk_loc_type          FOREIGN KEY (location_type_id)  REFERENCES dbo.location_type(location_type_id),
    CONSTRAINT fk_loc_uom           FOREIGN KEY (capacity_uom_id)   REFERENCES dbo.unit_of_measure(uom_id)
);
GO
CREATE INDEX ix_location_commodity ON dbo.location (commodity_type, country_code, is_active);
GO

-- 34. PIPELINE
-- Pipeline infrastructure for Oil and Gas.
-- =============================================================================
CREATE TABLE dbo.pipeline (
    pipeline_id         INT             NOT NULL IDENTITY(1,1),
    pipeline_code       VARCHAR(30)     NOT NULL,
    pipeline_name       VARCHAR(200)    NOT NULL,
    commodity_type      VARCHAR(20)     NOT NULL
        CONSTRAINT chk_pipeline_comm CHECK (commodity_type IN ('OIL','GAS')),
    from_location_id    INT             NOT NULL,
    to_location_id      INT             NOT NULL,
    operator            VARCHAR(200)    NULL,
    capacity            DECIMAL(18,4)   NULL,
    capacity_uom_id     INT             NULL,
    country_code        CHAR(2)         NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(500)    NULL,

    CONSTRAINT pk_pipeline          PRIMARY KEY (pipeline_id),
    CONSTRAINT uq_pipeline_code     UNIQUE      (pipeline_code),
    CONSTRAINT fk_pipe_from         FOREIGN KEY (from_location_id) REFERENCES dbo.location(location_id),
    CONSTRAINT fk_pipe_to           FOREIGN KEY (to_location_id)   REFERENCES dbo.location(location_id),
    CONSTRAINT fk_pipe_uom          FOREIGN KEY (capacity_uom_id)  REFERENCES dbo.unit_of_measure(uom_id)
);
GO

-- 35. STORAGE_FACILITY
-- Tanks, warehouses, LNG terminals, grain silos.
-- Addresses via polymorphic address table.
-- =============================================================================
CREATE TABLE dbo.storage_facility (
    facility_id         INT             NOT NULL IDENTITY(1,1),
    location_id         INT             NOT NULL,
    facility_code       VARCHAR(30)     NOT NULL,
    facility_name       VARCHAR(200)    NOT NULL,
    commodity_type      VARCHAR(20)     NOT NULL,
    facility_type       VARCHAR(30)     NOT NULL
        CONSTRAINT chk_fac_type CHECK (facility_type IN (
            'TANK','WAREHOUSE','LNG_TERMINAL','GRAIN_SILO',
            'REFINERY','CAVERN','VAULT','OTHER'
        )),
    capacity            DECIMAL(18,4)   NULL,
    capacity_uom_id     INT             NULL,
    operator            VARCHAR(200)    NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(500)    NULL,

    CONSTRAINT pk_storage_facility  PRIMARY KEY (facility_id),
    CONSTRAINT uq_facility_code     UNIQUE      (facility_code),
    CONSTRAINT fk_fac_location      FOREIGN KEY (location_id)      REFERENCES dbo.location(location_id),
    CONSTRAINT fk_fac_uom           FOREIGN KEY (capacity_uom_id)  REFERENCES dbo.unit_of_measure(uom_id)
);
GO

-- 36. CP_LOCATION
-- Which counterparties operate at which locations.
-- e.g. which terminal operators a counterparty has access to.
-- =============================================================================
CREATE TABLE dbo.cp_location (
    cp_location_id      INT             NOT NULL IDENTITY(1,1),
    counterparty_id     INT             NOT NULL,
    location_id         INT             NOT NULL,
    role                VARCHAR(30)     NOT NULL DEFAULT 'OPERATOR'
        CONSTRAINT chk_cploc_role CHECK (role IN (
            'OPERATOR','OWNER','AGENT','SHIPPER','RECEIVER','OTHER'
        )),
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(300)    NULL,

    CONSTRAINT pk_cp_location       PRIMARY KEY (cp_location_id),
    CONSTRAINT uq_cp_location       UNIQUE      (counterparty_id, location_id, role),
    CONSTRAINT fk_cploc_cp          FOREIGN KEY (counterparty_id) REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT fk_cploc_loc         FOREIGN KEY (location_id)     REFERENCES dbo.location(location_id)
);
GO


-- =============================================================================
-- GROUP 8 — CURRENCY & CALENDAR
-- =============================================================================

-- 37. FX_RATE
-- Daily FX rates. USD as base currency for all pairs.
-- =============================================================================
CREATE TABLE dbo.fx_rate (
    fx_rate_id          INT             NOT NULL IDENTITY(1,1),
    from_currency_id    INT             NOT NULL,
    to_currency_id      INT             NOT NULL,
    rate                DECIMAL(18,8)   NOT NULL,
    rate_date           DATE            NOT NULL,
    rate_type           VARCHAR(20)     NOT NULL DEFAULT 'EOD'
        CONSTRAINT chk_fx_rate_type CHECK (rate_type IN (
            'EOD','INTRADAY','SETTLEMENT','FIXING','MID'
        )),
    source              VARCHAR(50)     NULL,   -- 'BLOOMBERG','ECB','MANUAL'
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_fx_rate           PRIMARY KEY (fx_rate_id),
    CONSTRAINT uq_fx_rate           UNIQUE      (from_currency_id, to_currency_id, rate_date, rate_type),
    CONSTRAINT fk_fx_from           FOREIGN KEY (from_currency_id) REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_fx_to             FOREIGN KEY (to_currency_id)   REFERENCES dbo.currency(currency_id),
    CONSTRAINT chk_fx_different     CHECK       (from_currency_id <> to_currency_id)
);
GO
CREATE INDEX ix_fx_rate_date ON dbo.fx_rate (rate_date, from_currency_id, to_currency_id);
GO

-- 38. HOLIDAY
-- Individual holiday dates per calendar.
-- =============================================================================
CREATE TABLE dbo.holiday (
    holiday_id              INT             NOT NULL IDENTITY(1,1),
    calendar_id             INT             NOT NULL,
    holiday_date            DATE            NOT NULL,
    holiday_name            VARCHAR(200)    NOT NULL,
    is_settlement_holiday   BIT             NOT NULL DEFAULT 1,
    is_trading_holiday      BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_holiday           PRIMARY KEY (holiday_id),
    CONSTRAINT uq_holiday_date      UNIQUE      (calendar_id, holiday_date),
    CONSTRAINT fk_holiday_calendar  FOREIGN KEY (calendar_id) REFERENCES dbo.holiday_calendar(calendar_id)
);
GO
CREATE INDEX ix_holiday_date ON dbo.holiday (holiday_date, calendar_id);
GO

-- 39. SETTLEMENT_CALENDAR
-- Links products to their applicable settlement holiday calendars.
-- A product may use multiple calendars (e.g. UK + US bank holidays).
-- =============================================================================
CREATE TABLE dbo.settlement_calendar (
    sc_id               INT             NOT NULL IDENTITY(1,1),
    product_id          INT             NOT NULL,
    calendar_id         INT             NOT NULL,
    priority            TINYINT         NOT NULL DEFAULT 1,
    is_active           BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_settlement_cal    PRIMARY KEY (sc_id),
    CONSTRAINT uq_settlement_cal    UNIQUE      (product_id, calendar_id),
    CONSTRAINT fk_sc_product        FOREIGN KEY (product_id)  REFERENCES dbo.product(product_id),
    CONSTRAINT fk_sc_calendar       FOREIGN KEY (calendar_id) REFERENCES dbo.holiday_calendar(calendar_id)
);
GO


-- =============================================================================
-- GROUP 9 — SYSTEM & AUDIT
-- =============================================================================

-- 40. AUDIT_LOG
-- Immutable application-level audit log for all business events.
-- Complements SQL Server temporal tables (which capture DB-level changes).
-- Partitioned by audit_date for performance on large volumes.
-- =============================================================================
CREATE TABLE dbo.audit_log (
    audit_id            BIGINT          NOT NULL IDENTITY(1,1),
    audit_date          DATE            NOT NULL DEFAULT CAST(SYSUTCDATETIME() AS DATE),
    audit_timestamp     DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    entity_type         VARCHAR(50)     NOT NULL,   -- 'TRADE','COUNTERPARTY' etc.
    entity_id           VARCHAR(50)     NOT NULL,   -- string to support composite keys
    action              VARCHAR(30)     NOT NULL
        CONSTRAINT chk_audit_action CHECK (action IN (
            'CREATE','UPDATE','DELETE','APPROVE','REJECT',
            'SUBMIT','CANCEL','AMEND','LOGIN','LOGOUT',
            'EXPORT','VIEW_SENSITIVE','OTHER'
        )),
    user_id             INT             NULL,
    username            VARCHAR(100)    NOT NULL,
    ip_address          VARCHAR(45)     NULL,
    session_id          VARCHAR(100)    NULL,
    old_values          NVARCHAR(MAX)   NULL,   -- JSON
    new_values          NVARCHAR(MAX)   NULL,   -- JSON
    changed_fields      VARCHAR(1000)   NULL,   -- comma-separated field names
    request_id          VARCHAR(100)    NULL,   -- correlates to API traceId
    notes               VARCHAR(500)    NULL,

    CONSTRAINT pk_audit_log         PRIMARY KEY (audit_id, audit_date)
) WITH (DATA_COMPRESSION = PAGE);
GO
CREATE INDEX ix_audit_entity    ON dbo.audit_log (entity_type, entity_id, audit_timestamp);
CREATE INDEX ix_audit_user      ON dbo.audit_log (user_id, audit_timestamp);
CREATE INDEX ix_audit_date      ON dbo.audit_log (audit_date, entity_type);
GO

-- 41. DOCUMENT_STORE
-- Metadata for all documents (GTCs, KYC, deal confirmations, invoices).
-- Actual files stored in blob storage (Azure Blob / S3 / on-prem NAS).
-- =============================================================================
CREATE TABLE dbo.document_store (
    document_id         INT             NOT NULL IDENTITY(1,1),
    entity_type         VARCHAR(50)     NOT NULL,
    entity_id           INT             NOT NULL,
    document_type       VARCHAR(50)     NOT NULL
        CONSTRAINT chk_doc_type CHECK (document_type IN (
            'GTC','GTC_SIGNED','KYC','CREDIT_AGREEMENT',
            'DEAL_CONFIRMATION','INVOICE','STATEMENT',
            'REGULATORY_REPORT','OTHER'
        )),
    document_name       VARCHAR(300)    NOT NULL,
    file_extension      VARCHAR(10)     NULL,
    mime_type           VARCHAR(100)    NULL,
    storage_path        VARCHAR(500)    NOT NULL,   -- blob/S3/NAS path
    file_size_bytes     BIGINT          NULL,
    checksum_sha256     VARCHAR(64)     NULL,
    version             VARCHAR(20)     NULL,
    is_current          BIT             NOT NULL DEFAULT 1,
    is_confidential     BIT             NOT NULL DEFAULT 0,
    uploaded_at         DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    uploaded_by         VARCHAR(100)    NOT NULL,
    expires_at          DATETIME2       NULL,
    notes               VARCHAR(500)    NULL,

    CONSTRAINT pk_document_store    PRIMARY KEY (document_id)
);
GO
CREATE INDEX ix_doc_entity ON dbo.document_store (entity_type, entity_id, document_type, is_current);
GO

-- Now wire document_store FKs to gtc_version and cp_gtc_agreement
ALTER TABLE dbo.gtc_version
    ADD CONSTRAINT fk_gtcv_doc FOREIGN KEY (document_store_id) REFERENCES dbo.document_store(document_id);
ALTER TABLE dbo.cp_gtc_agreement
    ADD CONSTRAINT fk_cpgtc_doc FOREIGN KEY (document_store_id) REFERENCES dbo.document_store(document_id);
GO

-- 42. SYSTEM_CONFIG
-- Key-value configuration store for application settings.
-- Avoids hardcoded values in application code.
-- =============================================================================
CREATE TABLE dbo.system_config (
    config_id           INT             NOT NULL IDENTITY(1,1),
    config_key          VARCHAR(100)    NOT NULL,
    config_value        NVARCHAR(MAX)   NOT NULL,
    config_group        VARCHAR(50)     NOT NULL,   -- 'RISK','SETTLEMENT','UI','INTEGRATION'
    data_type           VARCHAR(20)     NOT NULL DEFAULT 'STRING'
        CONSTRAINT chk_cfg_type CHECK (data_type IN (
            'STRING','INTEGER','DECIMAL','BOOLEAN','JSON','DATE'
        )),
    is_encrypted        BIT             NOT NULL DEFAULT 0,
    description         VARCHAR(500)    NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_system_config     PRIMARY KEY (config_id),
    CONSTRAINT uq_config_key        UNIQUE      (config_key)
);
GO


-- =============================================================================
-- REFERENCE DATA SEEDS
-- =============================================================================

-- Currencies
INSERT INTO dbo.currency (currency_code, currency_name, symbol, decimal_places)
VALUES
    ('USD','US Dollar','$',2), ('EUR','Euro','€',2), ('GBP','British Pound','£',2),
    ('JPY','Japanese Yen','¥',0), ('CHF','Swiss Franc','Fr',2), ('SGD','Singapore Dollar','S$',2),
    ('AED','UAE Dirham','د.إ',2), ('NOK','Norwegian Krone','kr',2), ('CAD','Canadian Dollar','C$',2),
    ('AUD','Australian Dollar','A$',2), ('CNY','Chinese Yuan','¥',2), ('KWD','Kuwaiti Dinar','KD',3);
GO

-- Commodities
INSERT INTO dbo.commodity (commodity_code, commodity_name, commodity_type, description)
VALUES
    ('OIL',   'Oil & Petroleum',     'OIL',          'Crude oil, refined products, petroleum'),
    ('POWER', 'Power & Electricity', 'POWER',        'Electricity generation and transmission'),
    ('GAS',   'Natural Gas',         'GAS',          'Natural gas including LNG and pipeline'),
    ('AGRI',  'Agricultural',        'AGRICULTURAL', 'Grains, soft commodities, oilseeds'),
    ('METALS','Metals & Mining',     'METALS',       'Base metals, precious metals, mining');
GO

-- Units of measure
INSERT INTO dbo.unit_of_measure (uom_code, uom_name, uom_category, commodity_type, base_uom_code, conversion_factor)
VALUES
    ('BBL',    'Barrel',                 'VOLUME', 'OIL',          'BBL',    1.0),
    ('KBD',    'Thousand Barrels/Day',   'VOLUME', 'OIL',          'BBL',    1000.0),
    ('MT',     'Metric Tonne',           'WEIGHT', 'OIL',          'BBL',    7.3),
    ('MWH',    'Megawatt Hour',          'ENERGY', 'POWER',        'MWH',    1.0),
    ('GWH',    'Gigawatt Hour',          'ENERGY', 'POWER',        'MWH',    1000.0),
    ('MW',     'Megawatt',               'POWER',  'POWER',        'MW',     1.0),
    ('MMBTU',  'Million BTU',            'ENERGY', 'GAS',          'MMBTU',  1.0),
    ('THERM',  'Therm',                  'ENERGY', 'GAS',          'MMBTU',  0.1),
    ('MCM',    'Thousand Cubic Metres',  'VOLUME', 'GAS',          'MMBTU',  35.315),
    ('BUSHEL', 'Bushel',                 'VOLUME', 'AGRICULTURAL', 'BUSHEL', 1.0),
    ('MT_AGR', 'Metric Tonne (Agri)',    'WEIGHT', 'AGRICULTURAL', 'MT',     1.0),
    ('MT_MET', 'Metric Tonne (Metal)',   'WEIGHT', 'METALS',       'MT',     1.0),
    ('KG',     'Kilogram',               'WEIGHT', 'METALS',       'MT',     0.001),
    ('TROY_OZ','Troy Ounce',             'WEIGHT', 'METALS',       'KG',     0.0311035);
GO

-- Pricing types
INSERT INTO dbo.pricing_type (type_code, type_name, description, requires_index, requires_formula)
VALUES
    ('FLAT',         'Flat Price',         'Fixed price agreed at trade date. No index reference.',         0, 0),
    ('INDEX',        'Index Price',        'Price equals a named index on a specified date.',               1, 0),
    ('DIFFERENTIAL', 'Differential',       'Index price plus or minus a fixed differential (basis).',      1, 0),
    ('FORMULA',      'Formula Price',      'Price determined by a formula referencing one or more indices.',1, 1),
    ('FLOATING',     'Floating Average',   'Average of index over a defined pricing period.',               1, 0),
    ('TBN',          'To Be Nominated',    'Price not yet fixed — to be nominated at a future date.',       0, 0);
GO

-- Credit ratings (S&P scale + internal)
INSERT INTO dbo.credit_rating (agency, rating, numeric_score, risk_category, description)
VALUES
    ('SP','AAA',1,'INVESTMENT_GRADE','Highest quality'),
    ('SP','AA+',2,'INVESTMENT_GRADE','Very high quality'),
    ('SP','AA', 3,'INVESTMENT_GRADE','Very high quality'),
    ('SP','AA-',4,'INVESTMENT_GRADE','Very high quality'),
    ('SP','A+', 5,'INVESTMENT_GRADE','High quality'),
    ('SP','A',  6,'INVESTMENT_GRADE','High quality'),
    ('SP','A-', 7,'INVESTMENT_GRADE','High quality'),
    ('SP','BBB+',8,'INVESTMENT_GRADE','Good quality'),
    ('SP','BBB', 9,'INVESTMENT_GRADE','Good quality'),
    ('SP','BBB-',10,'INVESTMENT_GRADE','Lowest investment grade'),
    ('SP','BB+',11,'SPECULATIVE','Speculative'),
    ('SP','BB', 12,'SPECULATIVE','Speculative'),
    ('SP','BB-',13,'SPECULATIVE','Speculative'),
    ('SP','B+', 14,'SPECULATIVE','Highly speculative'),
    ('SP','B',  15,'SPECULATIVE','Highly speculative'),
    ('SP','B-', 16,'SPECULATIVE','Highly speculative'),
    ('SP','CCC',17,'SPECULATIVE','Substantial risk'),
    ('SP','CC', 18,'SPECULATIVE','Near default'),
    ('SP','D',  20,'DEFAULT','Default'),
    ('INTERNAL','APPROVED',   1, 'INVESTMENT_GRADE','Internally approved'),
    ('INTERNAL','WATCH',      10,'SPECULATIVE',     'On internal credit watch'),
    ('INTERNAL','RESTRICTED', 20,'DEFAULT',         'Restricted — no new trades');
GO

-- Incoterms 2020
INSERT INTO dbo.incoterm (code, name, transport_mode, risk_transfer, version_year)
VALUES
    ('EXW','Ex Works',                    'ANY','Risk transfers at seller premises',                 2020),
    ('FCA','Free Carrier',                'ANY','Risk transfers when delivered to carrier',          2020),
    ('CPT','Carriage Paid To',            'ANY','Risk transfers when handed to first carrier',       2020),
    ('CIP','Carriage and Insurance Paid', 'ANY','Risk transfers when handed to first carrier',       2020),
    ('DAP','Delivered at Place',          'ANY','Risk transfers at named destination',               2020),
    ('DPU','Delivered at Place Unloaded', 'ANY','Risk transfers once unloaded at destination',       2020),
    ('DDP','Delivered Duty Paid',         'ANY','Risk transfers at destination after import clearance',2020),
    ('FAS','Free Alongside Ship',         'SEA_INLAND_WATERWAY','Risk at ship side named port',      2020),
    ('FOB','Free on Board',               'SEA_INLAND_WATERWAY','Risk on board vessel at loading port',2020),
    ('CFR','Cost and Freight',            'SEA_INLAND_WATERWAY','Risk on board vessel at loading port',2020),
    ('CIF','Cost Insurance and Freight',  'SEA_INLAND_WATERWAY','Risk on board vessel at loading port',2020);
GO

-- Location types
INSERT INTO dbo.location_type (type_code, type_name, commodity_type, description)
VALUES
    ('PORT',         'Seaport / Loading Terminal',  'OIL',   'Tanker loading and discharge ports'),
    ('PIPELINE_HUB', 'Pipeline Hub / Interconnect', 'OIL',   'Oil pipeline interconnection point'),
    ('GAS_HUB',      'Gas Trading Hub',             'GAS',   'Virtual or physical gas trading hub'),
    ('GAS_PIPELINE', 'Gas Pipeline Entry/Exit',     'GAS',   'Pipeline entry or exit point'),
    ('GRID_NODE',    'Power Grid Node',             'POWER', 'Transmission grid delivery node'),
    ('POWER_PLANT',  'Power Generation Plant',      'POWER', 'Generation asset location'),
    ('WAREHOUSE',    'Commodity Warehouse',         NULL,    'Physical commodity storage and delivery'),
    ('EXCHANGE',     'Exchange Delivery Point',     NULL,    'Approved exchange delivery location'),
    ('REFINERY',     'Refinery',                    'OIL',   'Oil refinery and processing facility'),
    ('LNG_TERMINAL', 'LNG Terminal',               'GAS',   'LNG liquefaction or regasification terminal'),
    ('OTHER',        'Other',                       NULL,    'Other location type');
GO

-- Holiday calendars (metadata only — holidays populated separately per year)
INSERT INTO dbo.holiday_calendar (calendar_code, calendar_name, country_code, commodity_type)
VALUES
    ('UK_BANK',    'UK Bank Holidays',          'GB', NULL),
    ('US_FEDERAL', 'US Federal Holidays',       'US', NULL),
    ('ICE_BRENT',  'ICE Brent Futures Calendar','GB', 'OIL'),
    ('NYMEX_WTI',  'NYMEX WTI Futures Calendar','US', 'OIL'),
    ('TTF_GAS',    'TTF Gas Calendar',          'NL', 'GAS'),
    ('NBP_GAS',    'NBP Gas Calendar',          'GB', 'GAS'),
    ('EPEX_POWER', 'EPEX Spot Power Calendar',  'DE', 'POWER'),
    ('LME_METALS', 'LME Metals Calendar',       'GB', 'METALS'),
    ('CBOT_GRAINS','CBOT Grains Calendar',      'US', 'AGRICULTURAL');
GO

-- Payment terms
INSERT INTO dbo.payment_term (term_code, term_name, payment_days, days_basis, payment_method)
VALUES
    ('NET_10',      'Net 10 days',              10, 'CALENDAR', 'WIRE'),
    ('NET_15',      'Net 15 days',              15, 'CALENDAR', 'WIRE'),
    ('NET_30',      'Net 30 days',              30, 'CALENDAR', 'WIRE'),
    ('NET_45',      'Net 45 days',              45, 'CALENDAR', 'WIRE'),
    ('NET_60',      'Net 60 days',              60, 'CALENDAR', 'WIRE'),
    ('NET_5_BIZ',   'Net 5 business days',       5, 'BUSINESS', 'WIRE'),
    ('NET_10_BIZ',  'Net 10 business days',     10, 'BUSINESS', 'WIRE'),
    ('PREPAY',      'Prepayment',                0, 'CALENDAR', 'WIRE'),
    ('LC_30',       'Letter of Credit 30 days', 30, 'CALENDAR', 'LETTER_OF_CREDIT'),
    ('LC_60',       'Letter of Credit 60 days', 60, 'CALENDAR', 'LETTER_OF_CREDIT'),
    ('NETTING',     'Net Settlement',            0, 'CALENDAR', 'NETTING');
GO

-- Credit terms
INSERT INTO dbo.credit_term (term_code, term_name, credit_period_days, collateral_type, netting_eligible)
VALUES
    ('OPEN_30',     'Open credit 30 days',   30, 'NONE',              0),
    ('OPEN_45',     'Open credit 45 days',   45, 'NONE',              0),
    ('OPEN_60',     'Open credit 60 days',   60, 'NONE',              0),
    ('SECURED_LC',  'Secured — Letter of Credit', 30, 'LETTER_OF_CREDIT', 0),
    ('SECURED_BG',  'Secured — Bank Guarantee',   30, 'BANK_GUARANTEE',   0),
    ('PREPAID',     'Prepaid — no credit',    0, 'CASH',              0),
    ('NETTING_ISDA','ISDA Netting',          45, 'NONE',              1),
    ('NETTING_EFET','EFET Netting',          30, 'NONE',              1);
GO

-- System config defaults
INSERT INTO dbo.system_config (config_key, config_value, config_group, data_type, description, updated_by)
VALUES
    ('base_currency',           'USD',   'RISK',        'STRING',  'System base currency for all P&L reporting',      'SYSTEM'),
    ('var_confidence_level',    '0.95',  'RISK',        'DECIMAL', 'VaR confidence level (0.95 = 95%)',               'SYSTEM'),
    ('var_horizon_days',        '1',     'RISK',        'INTEGER', 'VaR time horizon in days',                        'SYSTEM'),
    ('max_trade_limit_usd',     '100000000', 'RISK',    'DECIMAL', 'Hard system-level max single trade notional (USD)','SYSTEM'),
    ('eod_run_time_utc',        '18:00', 'SETTLEMENT',  'STRING',  'End of day batch run time UTC',                   'SYSTEM'),
    ('settlement_days_default', '2',     'SETTLEMENT',  'INTEGER', 'Default settlement period in business days',      'SYSTEM'),
    ('audit_retention_years',   '7',     'SYSTEM',      'INTEGER', 'Audit log retention period in years',             'SYSTEM'),
    ('session_timeout_minutes', '30',    'SYSTEM',      'INTEGER', 'UI session timeout in minutes',                   'SYSTEM'),
    ('mfa_required',            'true',  'SYSTEM',      'BOOLEAN', 'Enforce MFA for all users',                       'SYSTEM'),
    ('python_engine_url',       'http://python-engine:8001', 'INTEGRATION', 'STRING', 'Internal URL of Python quant engine', 'SYSTEM');
GO

-- =============================================================================
PRINT '============================================================';
PRINT 'ETRM Master Data Schema v2.0 — ALL 42 TABLES CREATED';
PRINT 'Groups: Reference | Polymorphic | Organisation | Counterparty';
PRINT '         Commodity | Commercial | Location | Calendar | System';
PRINT '============================================================';
GO
