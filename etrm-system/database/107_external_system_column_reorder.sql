-- =============================================================================
-- V107 -- Reorder dbo.external_system's columns so connection_type_id sits
-- among the first few, not last.
--
-- Real bug this fixes: the generic Tier2 grid (ReferenceDataTable.tsx) only
-- shows a table's first 6 columns in ordinal position, to keep wide
-- reference tables readable. V105 added connection_type_id via a plain
-- ALTER TABLE ADD, which — like every ALTER TABLE ADD in SQL Server — always
-- appends the new column at the very end of the table's physical column
-- order. That put connection_type_id 13th out of 13 columns, past the
-- 6-column visible-grid cutoff, so it silently never appeared in the
-- External Systems screen even though the API/form both had it correctly
-- (confirmed via a live Playwright pass: grid showed only System
-- Code/Name/Vendor Name/Base Url/Owner Team/Is Active — Connection Type and
-- Notes were both cut off).
--
-- SQL Server has no ALTER TABLE ... column reorder — the only way to change
-- physical column order is to rebuild the table. Confirmed before doing this
-- that external_system has exactly one incoming FK (external_system_mapping
-- .fk_esm_system, referencing the untouched external_system_id PK) and one
-- outgoing FK (fk_es_conn_type, to connection_type) — both dropped and
-- recreated around the rebuild, IDENTITY values preserved via
-- IDENTITY_INSERT so external_system_mapping's existing rows keep resolving
-- correctly.
-- =============================================================================
USE ETRM_DB;
GO

ALTER TABLE dbo.external_system_mapping DROP CONSTRAINT IF EXISTS fk_esm_system;
GO
ALTER TABLE dbo.external_system DROP CONSTRAINT IF EXISTS fk_es_conn_type;
GO
ALTER TABLE dbo.external_system DROP CONSTRAINT IF EXISTS pk_external_system;
ALTER TABLE dbo.external_system DROP CONSTRAINT IF EXISTS uq_es_code;
GO
EXEC sp_rename 'dbo.external_system', 'external_system_v104';
GO

CREATE TABLE dbo.external_system (
    external_system_id  INT             NOT NULL IDENTITY(1,1),
    system_code         VARCHAR(30)     NOT NULL,
    system_name         VARCHAR(150)    NOT NULL,
    connection_type_id  INT             NULL,
    vendor_name         VARCHAR(150)    NULL,
    base_url            VARCHAR(500)    NULL,
    owner_team          VARCHAR(100)    NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,
    CONSTRAINT pk_external_system PRIMARY KEY (external_system_id),
    CONSTRAINT uq_es_code         UNIQUE      (system_code)
);
GO

SET IDENTITY_INSERT dbo.external_system ON;
INSERT INTO dbo.external_system
    (external_system_id, system_code, system_name, connection_type_id, vendor_name, base_url, owner_team, is_active, notes, created_at, created_by, updated_at, updated_by)
SELECT
    external_system_id, system_code, system_name, connection_type_id, vendor_name, base_url, owner_team, is_active, notes, created_at, created_by, updated_at, updated_by
FROM dbo.external_system_v104;
SET IDENTITY_INSERT dbo.external_system OFF;
GO

DROP TABLE dbo.external_system_v104;
GO

ALTER TABLE dbo.external_system
    ADD CONSTRAINT fk_es_conn_type FOREIGN KEY (connection_type_id) REFERENCES dbo.connection_type(connection_type_id);
GO
ALTER TABLE dbo.external_system_mapping
    ADD CONSTRAINT fk_esm_system FOREIGN KEY (external_system_id) REFERENCES dbo.external_system(external_system_id);
GO

PRINT '============================================================';
PRINT 'V107 -- EXTERNAL_SYSTEM COLUMN ORDER FIXED';
PRINT '  connection_type_id moved from last position to right after';
PRINT '  system_name, so it appears in the Tier2 grid''s first-6-';
PRINT '  columns view again. All 8 rows + both FKs preserved.';
PRINT '============================================================';
GO
