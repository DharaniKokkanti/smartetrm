-- =============================================================================
-- V83 — Environmental & Carbon: 4 unconstrained columns converted to
-- dedicated FK lookup tables
-- =============================================================================
-- Continuing the static-data-reference review. emission_scheme.scheme_type,
-- carbon_registry.registry_type, environmental_product.product_type, and
-- emission_obligation.status (all real, already-built tables from V36) are
-- plain NVARCHAR with no CHECK constraint at all — not even the minimal
-- validation most other columns of this shape have. The frontend mock
-- already modelled each as its own would-be Static Data table with no SQL
-- behind it. Built as dedicated tables (V17 shape), same reasoning as V82 —
-- each single-parent, per explicit instruction to keep these separate.
-- =============================================================================

USE ETRM_DB;
GO

-- ── 1. emission_scheme_type ───────────────────────────────────────────────────
CREATE TABLE dbo.emission_scheme_type (
    emission_scheme_type_id INT          NOT NULL IDENTITY(1,1),
    type_code                VARCHAR(50)  NOT NULL,
    type_name                 VARCHAR(100) NOT NULL,
    description                VARCHAR(500) NULL,
    sort_order                 SMALLINT     NOT NULL DEFAULT 0,
    is_active                  BIT          NOT NULL DEFAULT 1,
    created_at                  DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                  VARCHAR(100) NOT NULL,
    updated_at                   DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                   VARCHAR(100) NOT NULL,
    CONSTRAINT pk_emission_scheme_type      PRIMARY KEY (emission_scheme_type_id),
    CONSTRAINT uq_emission_scheme_type_code UNIQUE      (type_code)
);
GO
CREATE INDEX ix_emission_scheme_type_active ON dbo.emission_scheme_type (is_active, sort_order);
GO
INSERT INTO dbo.emission_scheme_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('COMPLIANCE', 'Compliance', 'Mandatory cap-and-trade scheme imposed by law. Participants must surrender allowances equal to verified emissions.', 1, 'SYSTEM', 'SYSTEM'),
    ('VOLUNTARY',  'Voluntary',  'Market-driven scheme where companies voluntarily offset emissions, verified under standards such as Verra VCS or Gold Standard.', 2, 'SYSTEM', 'SYSTEM');
GO

-- ── 2. carbon_registry_type ───────────────────────────────────────────────────
CREATE TABLE dbo.carbon_registry_type (
    carbon_registry_type_id INT          NOT NULL IDENTITY(1,1),
    type_code                 VARCHAR(50)  NOT NULL,
    type_name                  VARCHAR(100) NOT NULL,
    description                 VARCHAR(500) NULL,
    sort_order                  SMALLINT     NOT NULL DEFAULT 0,
    is_active                   BIT          NOT NULL DEFAULT 1,
    created_at                   DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                   VARCHAR(100) NOT NULL,
    updated_at                    DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                    VARCHAR(100) NOT NULL,
    CONSTRAINT pk_carbon_registry_type      PRIMARY KEY (carbon_registry_type_id),
    CONSTRAINT uq_carbon_registry_type_code UNIQUE      (type_code)
);
GO
CREATE INDEX ix_carbon_registry_type_active ON dbo.carbon_registry_type (is_active, sort_order);
GO
INSERT INTO dbo.carbon_registry_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('COMPLIANCE', 'Compliance', 'Registry mandated by a regulator to issue, transfer and cancel compliance allowances — EU Union Registry, UK Registry, CITSS.', 1, 'SYSTEM', 'SYSTEM'),
    ('VOLUNTARY',  'Voluntary',  'Privately operated registry for voluntary carbon market credits — Verra Registry, Gold Standard Impact Registry, ACR, APX.', 2, 'SYSTEM', 'SYSTEM');
GO

-- ── 3. environmental_product_type ─────────────────────────────────────────────
CREATE TABLE dbo.environmental_product_type (
    environmental_product_type_id INT          NOT NULL IDENTITY(1,1),
    type_code                       VARCHAR(50)  NOT NULL,
    type_name                        VARCHAR(100) NOT NULL,
    description                       VARCHAR(500) NULL,
    sort_order                        SMALLINT     NOT NULL DEFAULT 0,
    is_active                         BIT          NOT NULL DEFAULT 1,
    created_at                         DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                         VARCHAR(100) NOT NULL,
    updated_at                          DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                          VARCHAR(100) NOT NULL,
    CONSTRAINT pk_environmental_product_type      PRIMARY KEY (environmental_product_type_id),
    CONSTRAINT uq_environmental_product_type_code UNIQUE      (type_code)
);
GO
CREATE INDEX ix_environmental_product_type_active ON dbo.environmental_product_type (is_active, sort_order);
GO
INSERT INTO dbo.environmental_product_type (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('ALLOWANCE',   'Allowance',   'Cap-and-trade permit conferring the right to emit one unit (typically one tonne CO2e). EUA, UKA, CCA, EUAA are allowances.', 1, 'SYSTEM', 'SYSTEM'),
    ('CERTIFICATE', 'Certificate', 'Tradeable instrument proving one unit of energy was generated from a renewable source. REC (US) and GO (EU/UK) are certificates.', 2, 'SYSTEM', 'SYSTEM'),
    ('OFFSET',       'Offset',      'Verified emission reduction from a project outside a cap-and-trade scheme. VCU (Verra), CER (UNFCCC), Gold Standard credits.', 3, 'SYSTEM', 'SYSTEM');
GO

-- ── 4. emission_obligation_status ─────────────────────────────────────────────
CREATE TABLE dbo.emission_obligation_status (
    emission_obligation_status_id INT          NOT NULL IDENTITY(1,1),
    type_code                       VARCHAR(50)  NOT NULL,
    type_name                        VARCHAR(100) NOT NULL,
    description                       VARCHAR(500) NULL,
    sort_order                        SMALLINT     NOT NULL DEFAULT 0,
    is_active                         BIT          NOT NULL DEFAULT 1,
    created_at                         DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                         VARCHAR(100) NOT NULL,
    updated_at                          DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                          VARCHAR(100) NOT NULL,
    CONSTRAINT pk_emission_obligation_status      PRIMARY KEY (emission_obligation_status_id),
    CONSTRAINT uq_emission_obligation_status_code UNIQUE      (type_code)
);
GO
CREATE INDEX ix_emission_obligation_status_active ON dbo.emission_obligation_status (is_active, sort_order);
GO
INSERT INTO dbo.emission_obligation_status (type_code, type_name, description, sort_order, created_by, updated_by) VALUES
    ('OPEN',                  'Open',                  'Obligation is active and not yet settled.', 1, 'SYSTEM', 'SYSTEM'),
    ('SURRENDERED',           'Surrendered',           'All required allowances have been surrendered to the registry by the compliance deadline.', 2, 'SYSTEM', 'SYSTEM'),
    ('PARTIALLY_SURRENDERED', 'Partially Surrendered', 'Some allowances surrendered but a shortfall remains. Further action required before the deadline.', 3, 'SYSTEM', 'SYSTEM'),
    ('OVERDUE',               'Overdue',               'Surrender deadline has passed without full compliance. Financial penalties and reputational risk apply.', 4, 'SYSTEM', 'SYSTEM');
GO

-- =============================================================================
-- Convert the real consuming columns — no CHECK constraint existed on any of
-- these four, so there's nothing to DROP CONSTRAINT before dropping the column.
-- =============================================================================

-- ── dbo.emission_scheme.scheme_type ───────────────────────────────────────────
ALTER TABLE dbo.emission_scheme ADD scheme_type_new INT NULL;
GO
UPDATE e SET e.scheme_type_new = t.emission_scheme_type_id
FROM dbo.emission_scheme e JOIN dbo.emission_scheme_type t ON t.type_code = e.scheme_type;
GO
ALTER TABLE dbo.emission_scheme DROP COLUMN scheme_type;
GO
EXEC sp_rename 'dbo.emission_scheme.scheme_type_new', 'scheme_type', 'COLUMN';
GO
ALTER TABLE dbo.emission_scheme ALTER COLUMN scheme_type INT NOT NULL;
ALTER TABLE dbo.emission_scheme ADD CONSTRAINT fk_es_scheme_type FOREIGN KEY (scheme_type) REFERENCES dbo.emission_scheme_type(emission_scheme_type_id);
GO

-- ── dbo.carbon_registry.registry_type ─────────────────────────────────────────
ALTER TABLE dbo.carbon_registry ADD registry_type_new INT NULL;
GO
UPDATE r SET r.registry_type_new = t.carbon_registry_type_id
FROM dbo.carbon_registry r JOIN dbo.carbon_registry_type t ON t.type_code = r.registry_type;
GO
ALTER TABLE dbo.carbon_registry DROP COLUMN registry_type;
GO
EXEC sp_rename 'dbo.carbon_registry.registry_type_new', 'registry_type', 'COLUMN';
GO
ALTER TABLE dbo.carbon_registry ALTER COLUMN registry_type INT NOT NULL;
ALTER TABLE dbo.carbon_registry ADD CONSTRAINT fk_cr_registry_type FOREIGN KEY (registry_type) REFERENCES dbo.carbon_registry_type(carbon_registry_type_id);
GO

-- ── dbo.environmental_product.product_type ────────────────────────────────────
ALTER TABLE dbo.environmental_product ADD product_type_new INT NULL;
GO
UPDATE p SET p.product_type_new = t.environmental_product_type_id
FROM dbo.environmental_product p JOIN dbo.environmental_product_type t ON t.type_code = p.product_type;
GO
ALTER TABLE dbo.environmental_product DROP COLUMN product_type;
GO
EXEC sp_rename 'dbo.environmental_product.product_type_new', 'product_type', 'COLUMN';
GO
ALTER TABLE dbo.environmental_product ALTER COLUMN product_type INT NOT NULL;
ALTER TABLE dbo.environmental_product ADD CONSTRAINT fk_ep_product_type FOREIGN KEY (product_type) REFERENCES dbo.environmental_product_type(environmental_product_type_id);
GO

-- ── dbo.emission_obligation.status ────────────────────────────────────────────
ALTER TABLE dbo.emission_obligation ADD status_new INT NULL;
GO
UPDATE o SET o.status_new = t.emission_obligation_status_id
FROM dbo.emission_obligation o JOIN dbo.emission_obligation_status t ON t.type_code = o.status;
GO
ALTER TABLE dbo.emission_obligation DROP COLUMN status;
GO
EXEC sp_rename 'dbo.emission_obligation.status_new', 'status', 'COLUMN';
GO
ALTER TABLE dbo.emission_obligation ALTER COLUMN status INT NOT NULL;
ALTER TABLE dbo.emission_obligation ADD CONSTRAINT fk_eo_status FOREIGN KEY (status) REFERENCES dbo.emission_obligation_status(emission_obligation_status_id);
GO

-- ── Register in the Static Data GUI ───────────────────────────────────────────
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES
    ('emission_scheme_type',       'Emission Scheme Types',       'Carbon & Environmental', 1, 1, 0, 0, 1, 'SYSTEM', 'SYSTEM'),
    ('carbon_registry_type',       'Carbon Registry Types',       'Carbon & Environmental', 1, 1, 0, 0, 2, 'SYSTEM', 'SYSTEM'),
    ('environmental_product_type', 'Environmental Product Types', 'Carbon & Environmental', 1, 1, 0, 0, 3, 'SYSTEM', 'SYSTEM'),
    ('emission_obligation_status', 'Emission Obligation Statuses','Carbon & Environmental', 1, 1, 0, 0, 4, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'V83 — 4 CARBON & ENVIRONMENTAL LOOKUP TABLES BUILT';
PRINT '  emission_scheme_type, carbon_registry_type,';
PRINT '  environmental_product_type, emission_obligation_status.';
PRINT '  4 consuming columns (previously unconstrained VARCHAR)';
PRINT '  converted to FK against them.';
PRINT '============================================================';
GO
