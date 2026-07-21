-- =============================================================================
-- V148 — master-data governance-column gap, batch (10 tables)
--
-- Continuation of the V127-V137/V142-style governance-column rollout,
-- confirmed live against sys.columns / master_data_table_registry:
--
--   - mot_asset_product_approval: has created_at/created_by, missing
--     updated_at/updated_by. row_version already present (V130).
--   - netting_agreement: has created_at/created_by, missing updated_at/
--     updated_by. row_version already present (V128).
--   - object_lock_rule: missing all 4 audit columns. row_version already
--     present (V129).
--   - payment_term: has created_at only, missing created_by/updated_at/
--     updated_by. row_version already present (V133).
--   - period: has created_at/created_by, missing updated_at/updated_by.
--     row_version already present (V133).
--   - pipeline_cycle: has created_at/created_by, missing updated_at/
--     updated_by. row_version already present (V130).
--   - pipeline_operator_agreement: has created_at/created_by, missing
--     updated_at/updated_by AND row_version (no JPA entity exists for this
--     table yet — DB-only fix, matching V4's raw schema).
--   - pipeline_point: missing all 4 audit columns. row_version already
--     present (V130).
--   - pipeline_segment: missing all 4 audit columns. row_version already
--     present (V130).
--   - pipeline_tariff: has created_at/created_by, missing updated_at/
--     updated_by. row_version already present (V130).
--
-- None of these are temporal tables, so the plain ADD COLUMN NOT NULL
-- DEFAULT form is safe throughout, matching V137's exact column shape
-- (created_at/updated_at default SYSUTCDATETIME(), created_by/updated_by
-- default 'SYSTEM', row_version default 0 where newly added).
-- =============================================================================

ALTER TABLE dbo.mot_asset_product_approval ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

ALTER TABLE dbo.netting_agreement ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

ALTER TABLE dbo.object_lock_rule ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

ALTER TABLE dbo.payment_term ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

ALTER TABLE dbo.period ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

ALTER TABLE dbo.pipeline_cycle ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

ALTER TABLE dbo.pipeline_operator_agreement ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', row_version INT NOT NULL DEFAULT 0;
GO

ALTER TABLE dbo.pipeline_point ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

ALTER TABLE dbo.pipeline_segment ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

ALTER TABLE dbo.pipeline_tariff ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
