-- V192: dbo.source_system -- governed registry of data-provenance origins
--
-- Resumes the source/provenance-tracking work started in V191
-- (dbo.trade.source_channel_code). Dharani confirmed 2026-08-07 this needs
-- to cover every table built so far (~302 Tier2-registered tables + the
-- dedicated Tier1 tables), and redirected the design twice:
--   1. A flat MANUAL vs EXTERNAL_API split is conceptually wrong -- this is
--      an API-driven app by design, every write is technically an API call.
--      The real distinguishing axis is the PATTERN of the call: a single
--      interactive UI screen vs. a bulk load vs. an external system's own
--      API vs. exchange-feed ingestion vs. a system/migration process.
--   2. He wants each originating screen/API tracked as its own distinct
--      source, not lumped into a handful of generic buckets -- a hardcoded
--      CHECK enum (V191's shape) doesn't scale to that granularity or to
--      302 tables.
-- Confirmed 2026-08-07 (next session): governed FK registry table, matching
-- this platform's standing convention of governed lookups over free text
-- (tax codes, incoterms, license types, customs_movement_status all work
-- this way) -- "add a row" scales to a new screen/integration, not "alter a
-- CHECK constraint" on every one of 302 tables.
--
-- Deliberately NOT reusing dbo.external_system (V08/V107) -- that table is a
-- crosswalk catalog of external counterparty/vendor systems (Bloomberg, SAP
-- ERP, DTCC GTR) for the polymorphic external_system_mapping ID-translation
-- layer, a different concern from "which internal channel/screen produced
-- this row." Keeping them separate avoids entangling data provenance with
-- ID-mapping crosswalk semantics prematurely -- same one-purpose-per-table
-- pattern already used elsewhere (e.g. tax_code vs. customs_movement_status
-- kept separate despite being adjacent concepts).
--
-- Seeded with the 7 sources needed to migrate V191's CHECK-enum values
-- (see V193) plus a STATIC_DATA_ADMIN bucket covering the ~302 Tier2 tables
-- as an interim default until per-table/per-screen rows are broken out --
-- adding that finer granularity later is exactly "add a row", no schema
-- change, which is the point of this design.

USE ETRM_DB;
GO

IF OBJECT_ID('dbo.source_system', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.source_system (
        source_system_id   INT             NOT NULL IDENTITY(1,1),
        source_code         VARCHAR(50)     NOT NULL,
        source_name          VARCHAR(150)    NOT NULL,
        -- UI_SCREEN = interactive single-record entry via a specific app screen;
        -- BULK_LOAD = Excel/file upload processed in one batch;
        -- EXTERNAL_API = a different system calling this platform's API directly;
        -- EXCHANGE_FEED = automated ingestion from an exchange/market feed;
        -- SYSTEM = Flyway migration seed, backfill, or other internal process.
        category               VARCHAR(20)     NOT NULL
            CONSTRAINT chk_source_system_category CHECK (category IN (
                'UI_SCREEN', 'BULK_LOAD', 'EXTERNAL_API', 'EXCHANGE_FEED', 'SYSTEM'
            )),
        description             VARCHAR(500)    NULL,
        sort_order               SMALLINT        NOT NULL DEFAULT 0,
        is_active                 BIT             NOT NULL DEFAULT 1,
        row_version                INT             NOT NULL DEFAULT 0,
        created_at                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by                   VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',
        updated_at                    DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_by                     VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',

        CONSTRAINT pk_source_system  PRIMARY KEY (source_system_id),
        CONSTRAINT uq_source_system  UNIQUE      (source_code)
    );

    CREATE INDEX ix_source_system_active ON dbo.source_system (is_active, category, sort_order);
END
GO

INSERT INTO dbo.source_system (source_code, source_name, category, description, sort_order, created_by, updated_by)
SELECT v.source_code, v.source_name, v.category, v.description, v.sort_order, 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('TRADE_CAPTURE_SCREEN', 'Trade Capture Screen',      'UI_SCREEN',     'Manual single-trade entry via the Trade Capture workspace (/trade/capture).', 1),
    ('STATIC_DATA_ADMIN',    'Static Data Admin Screen',  'UI_SCREEN',     'Generic Tier2 Static Data CRUD screen shared by the ~302 reference-data tables under /static-data/*. Interim bucket until each table/screen gets its own dedicated source row.', 2),
    ('BULK_EXCEL_UPLOAD',    'Bulk Excel Upload',         'BULK_LOAD',     'Rows loaded via the Excel bulk-upload endpoint on a Static Data or Trade Capture screen, not typed by hand.', 3),
    ('EXTERNAL_API_GENERIC', 'External API (Generic)',    'EXTERNAL_API',  'Row created by an external system calling this platform''s API directly; source system not yet broken out into its own row.', 4),
    ('EXCHANGE_FEED_ICE',    'ICE Exchange Feed',         'EXCHANGE_FEED', 'Automated feed ingestion from ICE.', 5),
    ('EXCHANGE_FEED_NYMEX',  'NYMEX Exchange Feed',       'EXCHANGE_FEED', 'Automated feed ingestion from NYMEX/CME.', 6),
    ('SYSTEM_MIGRATION',     'System / Migration',        'SYSTEM',        'Row created by a Flyway migration seed, backfill, or other system-internal process, not a user or external system.', 7)
) AS v(source_code, source_name, category, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM dbo.source_system s WHERE s.source_code = v.source_code);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'source_system')
BEGIN
    INSERT INTO dbo.master_data_table_registry
        (table_name, display_name, module_group, sub_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, notes, created_by, updated_by)
    VALUES
        ('source_system', 'Source Systems', 'Organization & Users', 'Governance', 1, 1, 0, 0, 15,
         'Governed catalog of data-provenance origins (screens/APIs/feeds) -- every table''s provenance FK references this. See V192/V193.',
         'SYSTEM', 'SYSTEM');
END
GO
