-- =============================================================================
-- V155 — meta_table_registry + meta_table_dependency
--
-- First concrete build-out of the event-architecture "meta-data table system"
-- described in etrm-system/docs/event-architecture-plan/architecture/01-meta-data-system.md,
-- scoped ONLY to master data (per explicit instruction, 2026-07-23) — the
-- outbox (sys_event_outbox) and streaming (sys_stream_registry) pillars are
-- deliberately NOT part of this migration; see tasks/backlog.md.
--
-- Scope decision: "master data tables" = every row in
-- dbo.master_data_table_registry with data_category IN ('MASTER_CONFIG',
-- 'MASTER_DATA') (V143's whole-schema classification). TRANSACTIONAL and
-- DERIVED tables are excluded on purpose — those are the other two pillars'
-- problem, not this one's, and pulling them in now would silently expand
-- scope beyond what was asked.
--
-- Design notes:
--   - table_category here maps 1:1 from master_data_table_registry.data_category:
--       MASTER_CONFIG -> REFERENCE (closed vocabulary, system/migration-owned)
--       MASTER_DATA    -> REFERENCE (business reference data, GUI-editable)
--     (TRANSACTIONAL/DERIVED excluded entirely, see above — no mapping needed.)
--   - mutability is derived per-row: MASTER_CONFIG rows are effectively
--     admin/migration-controlled (closed vocabulary) -> IMMUTABLE_AFTER_POST;
--     MASTER_DATA rows are user-editable via the master-data GUI -> MUTABLE,
--     UNLESS the table_name or module_group marks it as a temporal/history
--     shadow table (e.g. '%_history'), in which case -> APPEND_ONLY.
--   - source_type: every master-data write path already goes through one of
--     two routes (confirmed by V153's grep of all write paths against
--     row_version-bearing tables): Hibernate's @Version merge (dedicated
--     Tier 1 controllers) or ReferenceDataCrudService.update() (generic
--     Tier 2 grid). Both are Java-service-owned, so source_type is uniformly
--     'JAVA_SERVICE_ADMIN_UI' for this whole batch — there is no direct-SQL
--     or external-batch master-data write path today.
--   - data_domain is a first-pass classification derived from module_group
--     by keyword pattern, NOT an exhaustive hand-reviewed mapping per table.
--     module_group itself mixes two generations of grouping (broad domain
--     names like 'Freight & Shipping' alongside older bare names like
--     'address', 'book') — this migration normalizes both into one set of
--     canonical domains. Treat data_domain as reviewable/correctable later
--     via UPDATE, not gospel — flagged in tasks/backlog.md as a follow-up
--     refinement, not redone by hand here for ~140 tables in one pass.
--   - meta_table_dependency is populated from REAL foreign keys
--     (sys.foreign_keys), not guessed — only FK pairs where BOTH the
--     referencing and referenced table are in this same master-data scope
--     are registered. dependency_type is 'FK_REFERENCE' for all of these;
--     'DERIVED_CALC' and 'LOOKUP_JOIN' are defined for future non-FK cases
--     (e.g. app-layer lookups) but not populated by this migration.
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- 1. meta_table_registry
-- =============================================================================
CREATE TABLE dbo.meta_table_registry (
    meta_table_registry_id  INT             NOT NULL IDENTITY(1,1),
    table_schema             VARCHAR(20)     NOT NULL DEFAULT 'dbo',
    table_name               VARCHAR(50)     NOT NULL,
    table_category           VARCHAR(20)     NOT NULL
        CONSTRAINT ck_mtr_category CHECK (table_category IN ('REFERENCE', 'TRANSACTIONAL', 'DERIVED')),
    data_domain              VARCHAR(40)     NOT NULL,
    source_type              VARCHAR(30)     NOT NULL DEFAULT 'JAVA_SERVICE_ADMIN_UI'
        CONSTRAINT ck_mtr_source_type CHECK (source_type IN (
            'JAVA_SERVICE_ADMIN_UI', 'JAVA_SERVICE_TRADE_CAPTURE',
            'EXTERNAL_BATCH_LOAD', 'DIRECT_SQL', 'CDC_CAPTURED'
        )),
    mutability               VARCHAR(25)     NOT NULL
        CONSTRAINT ck_mtr_mutability CHECK (mutability IN ('MUTABLE', 'APPEND_ONLY', 'IMMUTABLE_AFTER_POST')),
    master_data_registry_id  INT             NULL,       -- back-link to dbo.master_data_table_registry.registry_id, where applicable
    is_enabled                BIT            NOT NULL DEFAULT 1,
    notes                    VARCHAR(500)    NULL,
    row_version              INT             NOT NULL DEFAULT 0,
    created_at               DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by               VARCHAR(100)    NOT NULL,
    updated_at               DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by               VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_meta_table_registry     PRIMARY KEY (meta_table_registry_id),
    CONSTRAINT uq_mtr_schema_table        UNIQUE (table_schema, table_name),
    CONSTRAINT fk_mtr_master_data_registry FOREIGN KEY (master_data_registry_id)
        REFERENCES dbo.master_data_table_registry (registry_id)
);
GO
CREATE INDEX ix_mtr_domain ON dbo.meta_table_registry (data_domain, table_category);
GO

-- =============================================================================
-- 2. meta_table_dependency
-- =============================================================================
CREATE TABLE dbo.meta_table_dependency (
    meta_table_dependency_id INT            NOT NULL IDENTITY(1,1),
    parent_table_id          INT            NOT NULL,   -- the upstream / depended-on table
    child_table_id           INT            NOT NULL,   -- the downstream / dependent table
    dependency_type          VARCHAR(20)    NOT NULL DEFAULT 'FK_REFERENCE'
        CONSTRAINT ck_mtd_dep_type CHECK (dependency_type IN ('FK_REFERENCE', 'DERIVED_CALC', 'LOOKUP_JOIN')),
    fk_constraint_name       VARCHAR(128)   NULL,       -- traceability back to sys.foreign_keys, when dependency_type = FK_REFERENCE
    cascade_action           VARCHAR(30)    NULL
        CONSTRAINT ck_mtd_cascade CHECK (cascade_action IS NULL OR cascade_action IN (
            'RECALCULATE_DEPENDENTS', 'INVALIDATE_CACHE', 'NONE'
        )),
    notes                    VARCHAR(500)   NULL,
    row_version              INT            NOT NULL DEFAULT 0,
    created_at               DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by               VARCHAR(100)   NOT NULL,
    updated_at               DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by               VARCHAR(100)   NOT NULL,

    CONSTRAINT pk_meta_table_dependency PRIMARY KEY (meta_table_dependency_id),
    CONSTRAINT uq_mtd_edge UNIQUE (parent_table_id, child_table_id, dependency_type, fk_constraint_name),
    CONSTRAINT fk_mtd_parent FOREIGN KEY (parent_table_id) REFERENCES dbo.meta_table_registry (meta_table_registry_id),
    CONSTRAINT fk_mtd_child  FOREIGN KEY (child_table_id)  REFERENCES dbo.meta_table_registry (meta_table_registry_id),
    CONSTRAINT ck_mtd_not_self CHECK (parent_table_id <> child_table_id)
);
GO
CREATE INDEX ix_mtd_child ON dbo.meta_table_dependency (child_table_id);
GO

-- =============================================================================
-- 3. row_version guard triggers — same reject-on-bypass pattern as V153,
--    applied explicitly here since V153 only swept tables that existed at
--    the time it ran and does not auto-apply to tables created afterward.
-- =============================================================================
CREATE TRIGGER dbo.trg_meta_table_registry_row_version_guard
ON dbo.meta_table_registry
AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.meta_table_registry (bypass write rejected by trg_meta_table_registry_row_version_guard)', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1 FROM inserted i
        INNER JOIN deleted d ON i.meta_table_registry_id = d.meta_table_registry_id
        WHERE i.row_version <= d.row_version
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.meta_table_registry (stale or reused version rejected by trg_meta_table_registry_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO

CREATE TRIGGER dbo.trg_meta_table_dependency_row_version_guard
ON dbo.meta_table_dependency
AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.meta_table_dependency (bypass write rejected by trg_meta_table_dependency_row_version_guard)', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1 FROM inserted i
        INNER JOIN deleted d ON i.meta_table_dependency_id = d.meta_table_dependency_id
        WHERE i.row_version <= d.row_version
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.meta_table_dependency (stale or reused version rejected by trg_meta_table_dependency_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO

-- =============================================================================
-- 4. Populate meta_table_registry from master_data_table_registry, scoped to
--    data_category IN ('MASTER_CONFIG', 'MASTER_DATA').
-- =============================================================================
INSERT INTO dbo.meta_table_registry
    (table_schema, table_name, table_category, data_domain, source_type, mutability, master_data_registry_id, is_enabled, notes, created_by, updated_by)
SELECT
    'dbo',
    mdtr.table_name,
    'REFERENCE',
    CASE
        WHEN mdtr.table_name = 'master_data_table_registry' OR mdtr.module_group IN ('Master Data Table Registry', 'System Config', 'SYSTEM')
            THEN 'governance'
        WHEN mdtr.module_group LIKE 'Trade%' OR mdtr.module_group = 'trade'
            THEN 'trade'
        WHEN mdtr.module_group LIKE '%Position%' OR mdtr.module_group LIKE '%Book%' OR mdtr.module_group = 'book'
            THEN 'position'
        WHEN mdtr.module_group LIKE '%Pricing%' OR mdtr.module_group LIKE '%Price%' OR mdtr.module_group LIKE 'Formula%'
             OR mdtr.module_group IN ('Rate Fixing', 'Missing Fixing Rule', 'Settlement Price')
            THEN 'pricing'
        WHEN mdtr.module_group LIKE '%Credit%' OR mdtr.module_group LIKE '%Collateral%' OR mdtr.module_group LIKE '%Margin%'
             OR mdtr.module_group LIKE '%Guarantee%' OR mdtr.module_group LIKE '%Letter Of Credit%' OR mdtr.module_group LIKE '%Insurance%'
             OR mdtr.module_group = 'collateral'
            THEN 'credit_risk'
        WHEN mdtr.module_group LIKE '%Counterparty%' OR mdtr.module_group LIKE '%Legal Entity%' OR mdtr.module_group LIKE '%Broker%'
             OR mdtr.module_group LIKE '%Contact%' OR mdtr.module_group LIKE '%Gtc%' OR mdtr.module_group LIKE '%Contract%'
             OR mdtr.module_group IN ('Address', 'Entity Address', 'Entity Contact', 'Tax Registration', 'Counterparties & Agreements')
             OR mdtr.module_group IN ('address', 'broker', 'contact', 'counterparty')
            THEN 'counterparty_legal'
        WHEN mdtr.module_group LIKE '%Freight%' OR mdtr.module_group LIKE '%Vessel%' OR mdtr.module_group LIKE '%Voyage%'
             OR mdtr.module_group LIKE '%Charter%' OR mdtr.module_group LIKE '%Laytime%' OR mdtr.module_group LIKE '%Bunker%'
             OR mdtr.module_group LIKE '%Railcar%' OR mdtr.module_group LIKE '%Truck%' OR mdtr.module_group LIKE '%Container%'
             OR mdtr.module_group LIKE '%Nomination%' OR mdtr.module_group LIKE '%Delivery Instruction%' OR mdtr.module_group LIKE '%Port Activity%'
             OR mdtr.module_group IN ('Inspection', 'Logistics & Delivery', 'vessel', 'voyage', 'railcar', 'truck', 'container', 'nomination', 'inspection')
            THEN 'logistics_freight'
        WHEN mdtr.module_group LIKE '%Pipeline%' OR mdtr.module_group LIKE '%Tank%' OR mdtr.module_group = 'Storage Facility'
             OR mdtr.module_group IN ('Transport Route', 'pipeline', 'tank')
            THEN 'pipeline_transport'
        WHEN mdtr.module_group LIKE '%Product%' OR mdtr.module_group LIKE '%Commodity%' OR mdtr.module_group LIKE '%Spec%'
             OR mdtr.module_group LIKE '%Uom%' OR mdtr.module_group LIKE '%Blend%' OR mdtr.module_group = 'Unit Of Measure'
             OR mdtr.module_group IN ('Products & Markets', 'product', 'commodity')
            THEN 'product_reference'
        WHEN mdtr.module_group LIKE '%Rin%' OR mdtr.module_group LIKE '%Emission%' OR mdtr.module_group LIKE '%Carbon%'
             OR mdtr.module_group LIKE '%Environmental%' OR mdtr.module_group = 'Regulatory Obligation'
            THEN 'environmental_compliance'
        WHEN mdtr.module_group LIKE '%Power%'
            THEN 'power_energy'
        WHEN mdtr.module_group IN ('Country', 'Currency', 'Exchange', 'Incoterm', 'Payment Term', 'Gl Account', 'Interest Rate')
             OR mdtr.module_group LIKE '%Holiday%' OR mdtr.module_group LIKE '%Calendar%' OR mdtr.module_group LIKE '%Period%'
             OR mdtr.module_group IN ('country', 'currency', 'exchange', 'holiday', 'incoterm', 'period')
            THEN 'reference_data'
        WHEN mdtr.module_group LIKE '%User%' OR mdtr.module_group LIKE '%Role%' OR mdtr.module_group LIKE '%Function%'
             OR mdtr.module_group IN ('Trader', 'App Module', 'Screen Field Registry', 'Custom Field Definition', 'Object Lock Rule', 'External System Mapping')
             OR mdtr.module_group LIKE '%Field Permission%' OR mdtr.module_group = 'Organization & Users'
             OR mdtr.module_group IN ('trader')
            THEN 'organization_security'
        ELSE 'reference_data'
    END,
    'JAVA_SERVICE_ADMIN_UI',
    CASE
        WHEN mdtr.data_category = 'MASTER_CONFIG' THEN 'IMMUTABLE_AFTER_POST'
        WHEN mdtr.table_name LIKE '%\_history' ESCAPE '\' OR mdtr.module_group LIKE '%History%' THEN 'APPEND_ONLY'
        ELSE 'MUTABLE'
    END,
    mdtr.registry_id,
    1,
    'Backfilled from master_data_table_registry (data_category=' + mdtr.data_category + ') by V155.',
    'SYSTEM',
    'SYSTEM'
FROM dbo.master_data_table_registry mdtr
WHERE mdtr.data_category IN ('MASTER_CONFIG', 'MASTER_DATA')
  AND NOT EXISTS (
      SELECT 1 FROM dbo.meta_table_registry existing
      WHERE existing.table_schema = 'dbo' AND existing.table_name = mdtr.table_name
  );
GO

-- Register the meta_* governance tables themselves — the architecture docs
-- are explicit that every new table in the platform belongs in this registry,
-- these four are no exception.
INSERT INTO dbo.meta_table_registry
    (table_schema, table_name, table_category, data_domain, source_type, mutability, master_data_registry_id, is_enabled, notes, created_by, updated_by)
VALUES
    ('dbo', 'meta_table_registry',        'REFERENCE', 'governance', 'DIRECT_SQL', 'MUTABLE', NULL, 1, 'Self-registration — this table describes itself. No admin UI yet; seeded/maintained via migration.', 'SYSTEM', 'SYSTEM'),
    ('dbo', 'meta_table_dependency',      'REFERENCE', 'governance', 'DIRECT_SQL', 'MUTABLE', NULL, 1, 'Self-registration. No admin UI yet; seeded/maintained via migration.', 'SYSTEM', 'SYSTEM');
GO

-- =============================================================================
-- 5. Populate meta_table_dependency from REAL foreign keys between tables
--    both already in scope (i.e. both ends are master data per this migration).
-- =============================================================================
INSERT INTO dbo.meta_table_dependency
    (parent_table_id, child_table_id, dependency_type, fk_constraint_name, cascade_action, notes, created_by, updated_by)
SELECT
    parent_mtr.meta_table_registry_id,
    child_mtr.meta_table_registry_id,
    'FK_REFERENCE',
    fk.name,
    'NONE',    -- cascade_action left as NONE by default; individual edges get promoted to RECALCULATE_DEPENDENTS/INVALIDATE_CACHE as real cascade needs are identified (tracked in tasks/backlog.md), not guessed here
    'Derived from real FK constraint ' + fk.name + ' by V155.',
    'SYSTEM',
    'SYSTEM'
FROM sys.foreign_keys fk
INNER JOIN sys.tables child_t  ON child_t.object_id  = fk.parent_object_id
INNER JOIN sys.tables parent_t ON parent_t.object_id = fk.referenced_object_id
INNER JOIN dbo.meta_table_registry child_mtr  ON child_mtr.table_name  = child_t.name  AND child_mtr.table_schema = 'dbo'
INNER JOIN dbo.meta_table_registry parent_mtr ON parent_mtr.table_name = parent_t.name AND parent_mtr.table_schema = 'dbo'
WHERE parent_mtr.meta_table_registry_id <> child_mtr.meta_table_registry_id
  AND NOT EXISTS (
      SELECT 1 FROM dbo.meta_table_dependency existing
      WHERE existing.parent_table_id = parent_mtr.meta_table_registry_id
        AND existing.child_table_id = child_mtr.meta_table_registry_id
        AND existing.fk_constraint_name = fk.name
  );
GO

PRINT '============================================================';
PRINT 'V155 APPLIED — meta_table_registry + meta_table_dependency (master data scope only).';
GO
