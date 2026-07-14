-- =============================================================================
-- V104 -- External System Type: promote external_system.system_type from a
-- hardcoded CHECK-constrained string ('MARKET_DATA','ERP','CTRM',...) into a
-- real Static Data table + FK, so new integration types can be added by an
-- admin instead of requiring a migration every time one shows up.
--
-- Same "convert a hardcoded code column to a surrogate-key FK" pattern as
-- V94/V95 -- add the new *_id column nullable, backfill by joining the old
-- code column to the new lookup table, drop the old CHECK constraint + old
-- column, restore NOT NULL, then add the real FK.
-- =============================================================================
USE ETRM_DB;
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- 01. EXTERNAL_SYSTEM_TYPE -- new Static Data lookup table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE dbo.external_system_type (
    external_system_type_id INT          NOT NULL IDENTITY(1,1),
    type_code                VARCHAR(50)  NOT NULL,
    type_name                VARCHAR(100) NOT NULL,
    description               VARCHAR(500) NULL,
    sort_order                SMALLINT     NOT NULL DEFAULT 0,
    is_active                 BIT          NOT NULL DEFAULT 1,
    created_at                DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                VARCHAR(100) NOT NULL,
    updated_at                DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                VARCHAR(100) NOT NULL,
    CONSTRAINT pk_external_system_type      PRIMARY KEY (external_system_type_id),
    CONSTRAINT uq_external_system_type_code UNIQUE      (type_code)
);
GO
CREATE INDEX ix_external_system_type_active ON dbo.external_system_type (is_active, sort_order);
GO

INSERT INTO dbo.external_system_type (type_code, type_name, sort_order, created_by, updated_by)
VALUES
    ('MARKET_DATA',  'Market Data',    1, 'SYSTEM', 'SYSTEM'),
    ('ERP',          'ERP',            2, 'SYSTEM', 'SYSTEM'),
    ('CTRM',         'CTRM',           3, 'SYSTEM', 'SYSTEM'),
    ('SHIPPING',     'Shipping',       4, 'SYSTEM', 'SYSTEM'),
    ('BANK',         'Bank',           5, 'SYSTEM', 'SYSTEM'),
    ('REGULATORY',   'Regulatory',     6, 'SYSTEM', 'SYSTEM'),
    ('RISK',         'Risk',           7, 'SYSTEM', 'SYSTEM'),
    ('AIS_TRACKING', 'AIS Tracking',   8, 'SYSTEM', 'SYSTEM'),
    ('OTHER',        'Other',          9, 'SYSTEM', 'SYSTEM');
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- 02. EXTERNAL_SYSTEM.system_type -> external_system_type_id
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE dbo.external_system ADD external_system_type_id INT NULL;
GO
UPDATE es SET es.external_system_type_id = t.external_system_type_id
FROM dbo.external_system es
JOIN dbo.external_system_type t ON t.type_code = es.system_type;
GO
ALTER TABLE dbo.external_system DROP CONSTRAINT IF EXISTS chk_es_type;
ALTER TABLE dbo.external_system DROP COLUMN IF EXISTS system_type;
GO
ALTER TABLE dbo.external_system ALTER COLUMN external_system_type_id INT NOT NULL;
GO
ALTER TABLE dbo.external_system
    ADD CONSTRAINT fk_es_type FOREIGN KEY (external_system_type_id) REFERENCES dbo.external_system_type(external_system_type_id);
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- 03. Register external_system_type as a Static Data table (Tier 2) --
-- generic CRUD, no new backend/frontend code required, per the Master Data
-- Entry Technical Design doc, Section 3. display_order 11 slots it right
-- before external_system (12) in the "Organization & Users" group.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO dbo.master_data_table_registry
    (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES
    ('external_system_type', 'External System Types', 'Organization & Users', 1, 1, 1, 0, 11, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'V104 -- EXTERNAL_SYSTEM_TYPE ADDED';
PRINT '  external_system.system_type (hardcoded CHECK constraint)';
PRINT '  replaced with external_system_type_id FK into the new';
PRINT '  external_system_type Static Data table.';
PRINT '============================================================';
GO
