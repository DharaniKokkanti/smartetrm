-- =============================================================================
-- V156 — meta_field_change_rule + meta_field_transition_rule
--
-- Column-level change-significance layer on top of V155's meta_table_registry,
-- scoped to the same master-data-only boundary as V155 (table_id always
-- resolves through meta_table_registry, which only holds master-data rows
-- as of this migration).
--
-- Coverage strategy (deliberate, not exhaustive per-column review):
--   1. A structural default rule for every is_enabled/is_active flag across
--      all in-scope tables: always significant. Deactivating any reference
--      row is exactly the kind of change every consumer downstream needs to
--      know about, so this is a safe, mechanical, correct-by-construction
--      rule to generate for the whole scope at once.
--   2. A structural default rule marking the four audit columns
--      (created_at/created_by/updated_at/updated_by) and row_version as
--      NOT significant on every in-scope table — otherwise every single
--      save would look "significant" purely from touching its own audit
--      trail, which is exactly the noise this framework exists to filter
--      out.
--   3. A curated set of real, hand-reasoned business rules for specific
--      high-value columns identified by inspecting actual table DDL (not
--      invented): uom_conversion.factor, credit_limit's status/amount
--      columns, and the two product-approval tables' approval_status.
--      Full column-by-column coverage of the remaining ~140 master-data
--      tables is NOT attempted here — tracked as a follow-up in
--      tasks/backlog.md, to be filled in as each column's real cascade
--      need is identified, not guessed wholesale in one pass.
--
-- meta_field_transition_rule is seeded only for pipeline_product_approval
-- and mot_asset_product_approval — both share the identical real
-- (APPROVED, CONDITIONAL, SUSPENDED, REJECTED) vocabulary (confirmed from
-- their actual CHECK constraints in V4__product_spec_mot_pipeline.sql), so
-- transitions INTO REJECTED or SUSPENDED are marked as needing a stronger
-- cascade than a routine APPROVED -> CONDITIONAL edit.
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- 1. meta_field_change_rule
-- =============================================================================
CREATE TABLE dbo.meta_field_change_rule (
    meta_field_change_rule_id INT             NOT NULL IDENTITY(1,1),
    table_id                  INT             NOT NULL,
    column_name               VARCHAR(128)    NOT NULL,
    is_significant             BIT            NOT NULL DEFAULT 1,
    cascade_action             VARCHAR(30)    NULL
        CONSTRAINT ck_mfcr_cascade CHECK (cascade_action IS NULL OR cascade_action IN (
            'EMIT_EVENT_ONLY', 'RECALCULATE_DEPENDENTS', 'INVALIDATE_CACHE', 'NONE'
        )),
    significance_reason        VARCHAR(500)   NULL,   -- WHY — favor explicit rule tables over opaque logic (AI-governance principle, see architecture/04-ai-governance.md)
    row_version                INT            NOT NULL DEFAULT 0,
    created_at                 DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                 VARCHAR(100)   NOT NULL,
    updated_at                 DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                 VARCHAR(100)   NOT NULL,

    CONSTRAINT pk_meta_field_change_rule PRIMARY KEY (meta_field_change_rule_id),
    CONSTRAINT uq_mfcr_table_column UNIQUE (table_id, column_name),
    CONSTRAINT fk_mfcr_table FOREIGN KEY (table_id) REFERENCES dbo.meta_table_registry (meta_table_registry_id)
);
GO
CREATE INDEX ix_mfcr_table ON dbo.meta_field_change_rule (table_id, is_significant);
GO

-- =============================================================================
-- 2. meta_field_transition_rule
--    from_value uses the literal '*' sentinel for "any prior value / new row",
--    not NULL — SQL Server's default UNIQUE constraint treats each NULL as
--    distinct, so NULL can't be relied on to prevent duplicate wildcard rows.
-- =============================================================================
CREATE TABLE dbo.meta_field_transition_rule (
    meta_field_transition_rule_id INT         NOT NULL IDENTITY(1,1),
    field_change_rule_id          INT         NOT NULL,
    from_value                    VARCHAR(100) NOT NULL DEFAULT '*',
    to_value                      VARCHAR(100) NOT NULL,
    is_significant                 BIT        NOT NULL DEFAULT 1,
    cascade_action                 VARCHAR(30) NULL
        CONSTRAINT ck_mftr_cascade CHECK (cascade_action IS NULL OR cascade_action IN (
            'EMIT_EVENT_ONLY', 'RECALCULATE_DEPENDENTS', 'INVALIDATE_CACHE', 'NONE'
        )),
    notes                          VARCHAR(500) NULL,
    row_version                    INT        NOT NULL DEFAULT 0,
    created_at                     DATETIME2  NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                     VARCHAR(100) NOT NULL,
    updated_at                     DATETIME2  NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                     VARCHAR(100) NOT NULL,

    CONSTRAINT pk_meta_field_transition_rule PRIMARY KEY (meta_field_transition_rule_id),
    CONSTRAINT uq_mftr_transition UNIQUE (field_change_rule_id, from_value, to_value),
    CONSTRAINT fk_mftr_field_change_rule FOREIGN KEY (field_change_rule_id)
        REFERENCES dbo.meta_field_change_rule (meta_field_change_rule_id)
);
GO

-- Register these two tables in meta_table_registry too (self-registration, same as V155's).
INSERT INTO dbo.meta_table_registry
    (table_schema, table_name, table_category, data_domain, source_type, mutability, master_data_registry_id, is_enabled, notes, created_by, updated_by)
VALUES
    ('dbo', 'meta_field_change_rule',     'REFERENCE', 'governance', 'DIRECT_SQL', 'MUTABLE', NULL, 1, 'Self-registration. No admin UI yet; seeded/maintained via migration.', 'SYSTEM', 'SYSTEM'),
    ('dbo', 'meta_field_transition_rule', 'REFERENCE', 'governance', 'DIRECT_SQL', 'MUTABLE', NULL, 1, 'Self-registration. No admin UI yet; seeded/maintained via migration.', 'SYSTEM', 'SYSTEM');
GO

-- =============================================================================
-- 3. row_version guard triggers (same pattern as V153/V155).
-- =============================================================================
CREATE TRIGGER dbo.trg_meta_field_change_rule_row_version_guard
ON dbo.meta_field_change_rule
AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.meta_field_change_rule (bypass write rejected by trg_meta_field_change_rule_row_version_guard)', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1 FROM inserted i
        INNER JOIN deleted d ON i.meta_field_change_rule_id = d.meta_field_change_rule_id
        WHERE i.row_version <= d.row_version
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.meta_field_change_rule (stale or reused version rejected by trg_meta_field_change_rule_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO

CREATE TRIGGER dbo.trg_meta_field_transition_rule_row_version_guard
ON dbo.meta_field_transition_rule
AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.meta_field_transition_rule (bypass write rejected by trg_meta_field_transition_rule_row_version_guard)', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1 FROM inserted i
        INNER JOIN deleted d ON i.meta_field_transition_rule_id = d.meta_field_transition_rule_id
        WHERE i.row_version <= d.row_version
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.meta_field_transition_rule (stale or reused version rejected by trg_meta_field_transition_rule_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO

-- =============================================================================
-- 4. Structural default rules — is_enabled/is_active always significant.
-- =============================================================================
INSERT INTO dbo.meta_field_change_rule (table_id, column_name, is_significant, cascade_action, significance_reason, created_by, updated_by)
SELECT
    mtr.meta_table_registry_id,
    c.name,
    1,
    'EMIT_EVENT_ONLY',
    'Structural default: deactivation/reactivation flags are always significant — every downstream consumer of this reference data needs to know when a row stops (or resumes) being valid.',
    'SYSTEM', 'SYSTEM'
FROM dbo.meta_table_registry mtr
INNER JOIN sys.tables t ON t.name = mtr.table_name AND SCHEMA_NAME(t.schema_id) = mtr.table_schema
INNER JOIN sys.columns c ON c.object_id = t.object_id
WHERE c.name IN ('is_enabled', 'is_active')
  AND NOT EXISTS (
      SELECT 1 FROM dbo.meta_field_change_rule existing
      WHERE existing.table_id = mtr.meta_table_registry_id AND existing.column_name = c.name
  );
GO

-- =============================================================================
-- 5. Structural default rules — audit/version columns never significant.
-- =============================================================================
INSERT INTO dbo.meta_field_change_rule (table_id, column_name, is_significant, cascade_action, significance_reason, created_by, updated_by)
SELECT
    mtr.meta_table_registry_id,
    c.name,
    0,
    'NONE',
    'Structural default: audit/version bookkeeping columns change on every save by construction — treating them as significant would make every write look like a business-relevant change and drown out real signal.',
    'SYSTEM', 'SYSTEM'
FROM dbo.meta_table_registry mtr
INNER JOIN sys.tables t ON t.name = mtr.table_name AND SCHEMA_NAME(t.schema_id) = mtr.table_schema
INNER JOIN sys.columns c ON c.object_id = t.object_id
WHERE c.name IN ('created_at', 'created_by', 'updated_at', 'updated_by', 'row_version')
  AND NOT EXISTS (
      SELECT 1 FROM dbo.meta_field_change_rule existing
      WHERE existing.table_id = mtr.meta_table_registry_id AND existing.column_name = c.name
  );
GO

-- =============================================================================
-- 6. Curated business rules — real columns, hand-reasoned significance.
-- =============================================================================
INSERT INTO dbo.meta_field_change_rule (table_id, column_name, is_significant, cascade_action, significance_reason, created_by, updated_by)
SELECT mtr.meta_table_registry_id, v.column_name, v.is_significant, v.cascade_action, v.reason, 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('uom_conversion',              'factor',          1, 'RECALCULATE_DEPENDENTS', 'The from_uom/to_uom conversion factor feeds every quantity conversion built on this pair — a change must recalculate anything already computed using the old factor, not just be logged.'),
    ('credit_limit',                'status',          1, 'RECALCULATE_DEPENDENTS', 'Limit status (ACTIVE/EXPIRED/SUSPENDED/CANCELLED) directly gates whether trade capture/credit checks can use this limit at all — see meta_field_transition_rule for the from/to-specific overrides once this table is in scope for one (currently not seeded, its own status vocabulary differs from the two approval tables below).'),
    ('credit_limit',                'limit_amount',    1, 'RECALCULATE_DEPENDENTS', 'Changing the limit amount changes available headroom for every open exposure against this counterparty — utilisation checks depend on this value.'),
    ('credit_limit',                'used_amount',     1, 'EMIT_EVENT_ONLY',        'Utilisation tracking value; consumers watching exposure need to see movement, but it does not itself require recalculating other tables the way limit_amount does.'),
    ('pipeline_product_approval',   'approval_status', 1, 'RECALCULATE_DEPENDENTS', 'Gates whether a product may physically flow through this pipeline — a status change can invalidate nominations/schedules already built against the old approval state.'),
    ('mot_asset_product_approval',  'approval_status', 1, 'RECALCULATE_DEPENDENTS', 'Gates whether a product may be carried on this vessel/truck/railcar/container/tank — same reasoning as pipeline_product_approval.'),
    ('field_permission_profile',    'screen_code',     1, 'INVALIDATE_CACHE',       'Re-pointing a permission profile to a different screen changes which field_permission_rule rows apply — any cached per-screen permission resolution for this profile is now stale.')
) AS v(table_name, column_name, is_significant, cascade_action, reason)
INNER JOIN dbo.meta_table_registry mtr ON mtr.table_name = v.table_name AND mtr.table_schema = 'dbo'
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.meta_field_change_rule existing
    WHERE existing.table_id = mtr.meta_table_registry_id AND existing.column_name = v.column_name
);
GO

-- =============================================================================
-- 7. meta_field_transition_rule — real, shared approval-status vocabulary.
-- =============================================================================
INSERT INTO dbo.meta_field_transition_rule (field_change_rule_id, from_value, to_value, is_significant, cascade_action, notes, created_by, updated_by)
SELECT mfcr.meta_field_change_rule_id, v.from_value, v.to_value, v.is_significant, v.cascade_action, v.notes, 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('pipeline_product_approval',  '*',           'REJECTED',    1, 'RECALCULATE_DEPENDENTS', 'Any transition into REJECTED must immediately invalidate in-flight nominations/schedules relying on this pipeline/product pairing — stronger than a routine status edit.'),
    ('pipeline_product_approval',  '*',           'SUSPENDED',   1, 'RECALCULATE_DEPENDENTS', 'SUSPENDED blocks new flow the same way REJECTED does but is expected to be temporary; still needs the same downstream recalculation.'),
    ('pipeline_product_approval',  'APPROVED',    'CONDITIONAL', 1, 'EMIT_EVENT_ONLY',        'Narrowing to conditional approval is worth notifying on but does not by itself invalidate existing flow the way REJECTED/SUSPENDED do.'),
    ('mot_asset_product_approval', '*',           'REJECTED',    1, 'RECALCULATE_DEPENDENTS', 'Same reasoning as pipeline_product_approval: invalidate in-flight movements planned against this asset/product pairing.'),
    ('mot_asset_product_approval', '*',           'SUSPENDED',   1, 'RECALCULATE_DEPENDENTS', 'Same reasoning as pipeline_product_approval SUSPENDED.'),
    ('mot_asset_product_approval', 'APPROVED',    'CONDITIONAL', 1, 'EMIT_EVENT_ONLY',        'Same reasoning as pipeline_product_approval APPROVED -> CONDITIONAL.')
) AS v(table_name, from_value, to_value, is_significant, cascade_action, notes)
INNER JOIN dbo.meta_table_registry mtr ON mtr.table_name = v.table_name AND mtr.table_schema = 'dbo'
INNER JOIN dbo.meta_field_change_rule mfcr ON mfcr.table_id = mtr.meta_table_registry_id AND mfcr.column_name = 'approval_status'
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.meta_field_transition_rule existing
    WHERE existing.field_change_rule_id = mfcr.meta_field_change_rule_id
      AND existing.from_value = v.from_value AND existing.to_value = v.to_value
);
GO

PRINT '============================================================';
PRINT 'V156 APPLIED — meta_field_change_rule + meta_field_transition_rule (master data scope only).';
GO
