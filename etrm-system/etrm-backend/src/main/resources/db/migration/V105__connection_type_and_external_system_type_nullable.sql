-- =============================================================================
-- V105 -- Two follow-ups to V104's external_system_type work:
--
--   1. external_system.external_system_type_id should NOT be required (V104
--      made it NOT NULL, mirroring the old system_type column it replaced --
--      but system_type is not actually a mandatory field on this table, per
--      explicit product direction). Relaxed to nullable; the FK constraint
--      itself is untouched (still enforced whenever a value IS supplied).
--
--   2. external_system.connection_type gets the same "hardcoded CHECK
--      constraint -> Static Data table + FK" treatment as system_type did in
--      V104 -- new dbo.connection_type lookup table, chk_es_conn dropped,
--      connection_type_id FK added (nullable, matching the old column's own
--      nullability -- connection_type was always optional).
-- =============================================================================
USE ETRM_DB;
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- 01. Relax external_system_type_id back to nullable (V104 over-constrained it)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE dbo.external_system ALTER COLUMN external_system_type_id INT NULL;
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- 02. CONNECTION_TYPE -- new Static Data lookup table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE dbo.connection_type (
    connection_type_id INT          NOT NULL IDENTITY(1,1),
    type_code           VARCHAR(50)  NOT NULL,
    type_name           VARCHAR(100) NOT NULL,
    description          VARCHAR(500) NULL,
    sort_order           SMALLINT     NOT NULL DEFAULT 0,
    is_active            BIT          NOT NULL DEFAULT 1,
    created_at           DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by           VARCHAR(100) NOT NULL,
    updated_at           DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by           VARCHAR(100) NOT NULL,
    CONSTRAINT pk_connection_type      PRIMARY KEY (connection_type_id),
    CONSTRAINT uq_connection_type_code UNIQUE      (type_code)
);
GO
CREATE INDEX ix_connection_type_active ON dbo.connection_type (is_active, sort_order);
GO

INSERT INTO dbo.connection_type (type_code, type_name, sort_order, created_by, updated_by)
VALUES
    ('API',            'API',            1, 'SYSTEM', 'SYSTEM'),
    ('SFTP',           'SFTP',           2, 'SYSTEM', 'SYSTEM'),
    ('FILE',           'File',           3, 'SYSTEM', 'SYSTEM'),
    ('MANUAL',         'Manual',         4, 'SYSTEM', 'SYSTEM'),
    ('MESSAGE_QUEUE',  'Message Queue',  5, 'SYSTEM', 'SYSTEM');
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- 03. EXTERNAL_SYSTEM.connection_type -> connection_type_id
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE dbo.external_system ADD connection_type_id INT NULL;
GO
UPDATE es SET es.connection_type_id = t.connection_type_id
FROM dbo.external_system es
JOIN dbo.connection_type t ON t.type_code = es.connection_type;
GO
ALTER TABLE dbo.external_system DROP CONSTRAINT IF EXISTS chk_es_conn;
ALTER TABLE dbo.external_system DROP COLUMN IF EXISTS connection_type;
GO
ALTER TABLE dbo.external_system
    ADD CONSTRAINT fk_es_conn_type FOREIGN KEY (connection_type_id) REFERENCES dbo.connection_type(connection_type_id);
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- 04. Register connection_type as a Static Data table (Tier 2)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO dbo.master_data_table_registry
    (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES
    ('connection_type', 'Connection Types', 'Organization & Users', 1, 1, 1, 0, 13, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'V105 -- CONNECTION_TYPE ADDED, EXTERNAL_SYSTEM_TYPE_ID RELAXED';
PRINT '  external_system.external_system_type_id is now nullable.';
PRINT '  external_system.connection_type (hardcoded CHECK constraint)';
PRINT '  replaced with connection_type_id FK into the new';
PRINT '  connection_type Static Data table.';
PRINT '============================================================';
GO
