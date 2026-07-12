-- =============================================================================
-- ETRM SYSTEM — MASTER DATA TABLE REGISTRY (Tier 2 control table)
-- SQL Server 2022 | Version 1.0 | June 2026
-- =============================================================================
-- Run AFTER:
--   etrm_master_data_v2.0.sql, and ideally after every other master data
--   script, since it's seeded with rows referencing tables built throughout
--   the project (freight, power, etc.)
-- =============================================================================
-- ADDS 1 TABLE:
--   01. master_data_table_registry
-- =============================================================================
-- DESIGN NOTE — per the Master Data Entry Technical Design doc, Section 3:
-- this is the ONLY thing that needs a new row when a Tier 2 reference table
-- is added to the generic screen; no new frontend or backend code. The
-- Spring Boot MetadataService derives actual column shape (types, CHECK
-- enum values, FK targets) from SQL Server's system catalogs at request
-- time — this table only controls WHICH tables are exposed and HOW
-- (create/edit/delete/upload permissions, sidebar grouping/order), not the
-- column-level shape itself.
-- =============================================================================

USE ETRM_DB;
GO

IF OBJECT_ID('dbo.master_data_table_registry', 'U') IS NOT NULL DROP TABLE dbo.master_data_table_registry;
GO

CREATE TABLE dbo.master_data_table_registry (
    registry_id          INT             NOT NULL IDENTITY(1,1),
    table_name              VARCHAR(50)     NOT NULL,   -- physical table name, e.g. 'charter_party_type'
    display_name               VARCHAR(100)    NOT NULL,   -- human label shown in the UI
    module_group                  VARCHAR(50)     NOT NULL,   -- sidebar grouping, e.g. 'Freight', 'Power', 'Reference'
    allow_create                     BIT             NOT NULL DEFAULT 1,
    allow_edit                          BIT             NOT NULL DEFAULT 1,
    allow_delete                           BIT             NOT NULL DEFAULT 0,   -- default OFF — most reference tables should deactivate, not delete
    allow_excel_upload                        BIT             NOT NULL DEFAULT 0,
    is_enabled                                   BIT             NOT NULL DEFAULT 1,   -- hide from the screen without dropping the registry row
    display_order                                   SMALLINT        NOT NULL DEFAULT 0,
    notes                                              VARCHAR(500)    NULL,
    created_at                                            DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                            VARCHAR(100)    NOT NULL,
    updated_at                                            DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                            VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_master_data_table_registry   PRIMARY KEY (registry_id),
    CONSTRAINT uq_mdtr_table_name                 UNIQUE      (table_name)
);
GO
CREATE INDEX ix_mdtr_module ON dbo.master_data_table_registry (module_group, display_order, is_enabled);
GO


-- =============================================================================
-- SEED — the representative set the frontend's mock layer mirrors exactly.
-- Scaling to the remaining ~110 Tier 2 tables is additional INSERT rows
-- here, not new application code.
-- =============================================================================
INSERT INTO dbo.master_data_table_registry
    (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES
    ('currency',            'Currencies',             'Reference', 1, 1, 0, 1, 1, 'SYSTEM', 'SYSTEM'),
    ('commodity',           'Commodities',            'Reference', 1, 1, 0, 0, 2, 'SYSTEM', 'SYSTEM'),
    ('credit_rating',       'Credit Ratings',         'Reference', 1, 1, 1, 0, 3, 'SYSTEM', 'SYSTEM'),
    ('incoterm',            'Incoterms',              'Reference', 1, 1, 0, 0, 4, 'SYSTEM', 'SYSTEM'),
    ('custom_config',       'Custom Config',          'Reference', 1, 1, 0, 0, 5, 'SYSTEM', 'SYSTEM'),
    ('charter_party_type',  'Charter Party Types',    'Freight',   1, 1, 1, 0, 1, 'SYSTEM', 'SYSTEM'),
    ('load_shape_template', 'Load Shape Templates',   'Power',     1, 1, 1, 0, 1, 'SYSTEM', 'SYSTEM'),
    ('balancing_authority', 'Balancing Authorities',  'Power',     1, 1, 0, 0, 2, 'SYSTEM', 'SYSTEM'),
    ('transmission_zone',   'Transmission Zones',     'Power',     1, 1, 1, 0, 3, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'MASTER DATA TABLE REGISTRY v1.0 APPLIED';
PRINT '  01. master_data_table_registry — 8 rows seeded, matching the';
PRINT '      frontend mock layer exactly (currency, commodity,';
PRINT '      credit_rating, incoterm, charter_party_type,';
PRINT '      load_shape_template, balancing_authority, transmission_zone).';
PRINT '      Add the remaining ~110 Tier 2 tables as additional rows —';
PRINT '      no code change required, per the Master Data Entry';
PRINT '      Technical Design doc.';
PRINT '============================================================';
GO
