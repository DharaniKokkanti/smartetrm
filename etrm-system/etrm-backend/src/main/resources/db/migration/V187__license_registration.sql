-- V187: License registration (dbo.license_type, dbo.license_registration)
--
-- Requested 2026-08-06: legal_entity/counterparty regulatory & trading
-- licenses (broker licenses, market participant registrations, import/
-- export licenses, environmental/site permits) had no structured home --
-- only a single free-text legal_entity.regulatory_licence VARCHAR(100)
-- column, which can't hold more than one license or track expiry/renewal.
--
-- Research (general industry knowledge, no vendor names): energy trading
-- licensing is not just country-level. In the US, broker/market-participant
-- licenses are typically issued per state (state PUCs) alongside federal
-- oversight (FERC for physical wholesale, CFTC for derivatives); in the EU/
-- UK, national regulators (national energy regulators, FCA) issue licenses
-- that can carry sub-national or site-specific conditions (e.g. environmental
-- permits tied to a specific terminal). So a license needs BOTH a country
-- (jurisdiction) and an optional finer-grained location (state/province, or
-- a specific site) -- not just a country code. dbo.state/dbo.site tables
-- don't exist yet, so region_state is free text for now (mirrors how
-- tax_registration.jurisdiction started as free text before V95 promoted it
-- to a real FK -- can do the same here later if a state master table gets
-- built).
--
-- Mirrors the tax_type / tax_registration split exactly (dbo.tax_type,
-- dbo.tax_registration -- see 17_parent_lookup_tables.sql /
-- 01_master_data_foundation.sql), including the polymorphic entity_type/
-- entity_id link and full governance columns (row_version + 4 audit cols)
-- from creation, since that gap was found and had to be backfilled for tax_*
-- in V133/V136.

-- =============================================================================
-- 1. license_type -- lookup (mirrors dbo.tax_type)
-- =============================================================================
IF OBJECT_ID('dbo.license_type', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.license_type (
        license_type_id INT             NOT NULL IDENTITY(1,1),
        type_code       VARCHAR(50)     NOT NULL,
        type_name       VARCHAR(100)    NOT NULL,
        description     VARCHAR(500)    NULL,
        sort_order      TINYINT         NOT NULL DEFAULT 0,
        is_active       BIT             NOT NULL DEFAULT 1,
        row_version     INT             NOT NULL DEFAULT 0,
        created_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by      VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',
        updated_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_by      VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',

        CONSTRAINT pk_license_type      PRIMARY KEY (license_type_id),
        CONSTRAINT uq_license_type_code UNIQUE      (type_code)
    );
END
GO

INSERT INTO dbo.license_type (type_code, type_name, description, sort_order, created_by, updated_by)
SELECT v.type_code, v.type_name, v.description, v.sort_order, 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('BROKER',            'Broker License',              'State/national license to broker energy or commodity trades', 1),
    ('MARKET_PARTICIPANT','Market Participant Registration','Registration to trade on an exchange/market (e.g. ISO/RTO, ICE, CME)', 2),
    ('WHOLESALE_TRADING', 'Wholesale Trading License',   'Physical wholesale commodity trading authorization', 3),
    ('IMPORT',             'Import License',             'Authorization to import a regulated commodity', 4),
    ('EXPORT',             'Export License',              'Authorization to export a regulated commodity', 5),
    ('ENVIRONMENTAL_PERMIT','Environmental Permit',       'Site/facility-level environmental or emissions permit', 6),
    ('OTHER',              'Other',                        'License type not covered by the above', 99)
) AS v(type_code, type_name, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM dbo.license_type lt WHERE lt.type_code = v.type_code);
GO

-- =============================================================================
-- 2. license_registration -- per-entity license (mirrors dbo.tax_registration)
-- =============================================================================
IF OBJECT_ID('dbo.license_registration', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.license_registration (
        license_reg_id      INT             NOT NULL IDENTITY(1,1),
        entity_type          VARCHAR(30)     NOT NULL
            CONSTRAINT chk_license_entity_type CHECK (entity_type IN (
                'LEGAL_ENTITY','COUNTERPARTY'
            )),
        entity_id             INT             NOT NULL,
        license_type_id       INT             NOT NULL,
        license_number        VARCHAR(50)     NOT NULL,
        country_id            INT             NOT NULL,   -- jurisdiction (FK -> dbo.country)
        region_state          VARCHAR(100)    NULL,        -- sub-national jurisdiction (e.g. 'Texas'); free text, no state master table yet
        issuing_authority     VARCHAR(100)    NULL,        -- e.g. 'FERC','CFTC','Ofgem','Texas PUC'
        issue_date            DATE            NULL,
        valid_from             DATE            NULL,
        valid_to               DATE            NULL,        -- NULL = no expiry
        status                 VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE'
            CONSTRAINT chk_license_status CHECK (status IN (
                'ACTIVE','SUSPENDED','REVOKED','EXPIRED','PENDING_RENEWAL'
            )),
        is_primary             BIT             NOT NULL DEFAULT 0,
        is_active               BIT             NOT NULL DEFAULT 1,
        notes                   VARCHAR(500)    NULL,
        row_version             INT             NOT NULL DEFAULT 0,
        created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by               VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',
        updated_at               DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_by               VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',

        CONSTRAINT pk_license_registration PRIMARY KEY (license_reg_id),
        CONSTRAINT uq_license_registration UNIQUE (entity_type, entity_id, license_number),
        CONSTRAINT fk_license_reg_type    FOREIGN KEY (license_type_id) REFERENCES dbo.license_type(license_type_id),
        CONSTRAINT fk_license_reg_country FOREIGN KEY (country_id)      REFERENCES dbo.country(country_id)
    );

    CREATE INDEX ix_license_reg_entity ON dbo.license_registration (entity_type, entity_id, is_active);
END
GO

-- =============================================================================
-- 3. master_data_table_registry catalog entries
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'license_type')
BEGIN
    INSERT INTO dbo.master_data_table_registry
        (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
    VALUES
        ('license_type', 'License Types', 'Credit & Collateral', 1, 1, 0, 0, 9, 'SYSTEM', 'SYSTEM');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'license_registration')
BEGIN
    INSERT INTO dbo.master_data_table_registry
        (table_name, display_name, module_group, data_category, allow_create, allow_edit, allow_delete, allow_excel_upload, is_enabled, display_order, description, created_by, updated_by)
    VALUES
        ('license_registration', 'License Registration', 'Finance & Settlement', 'MASTER_DATA', 0, 0, 0, 0, 0, 905,
         'Catalog-only row, mirrors tax_registration. Needs a dedicated Tier 1 controller, not Tier2-generic CRUD -- is_enabled=0 until that UI is built.',
         'SYSTEM', 'SYSTEM');
END
GO
