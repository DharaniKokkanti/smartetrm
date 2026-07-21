-- =============================================================================
-- V145 — master-data audit-column / row_version gap, batch 8 (10 tables)
--
-- Continuation of the V137/V136 governance-column rollout for dedicated
-- (non-Tier2) entities that fell outside those sweeps. Verified live
-- against sys.columns before writing this migration.
--
--   - carbon_registry: had created_at/updated_at/row_version, missing
--     created_by/updated_by.
--   - container: had created_at/created_by/row_version, missing
--     updated_at/updated_by.
--   - country: had only row_version, missing all 4 audit columns
--     (dbo.country, added by V86, deliberately had none at the time).
--   - cp_gtc_agreement: had created_at/created_by/row_version, missing
--     updated_at/updated_by.
--   - credit_limit: had created_at/updated_at/row_version, missing
--     created_by/updated_by.
--   - credit_limit_line_item: had created_at/updated_at/row_version,
--     missing created_by/updated_by.
--   - custom_field_definition: had created_at/updated_at, missing
--     created_by/updated_by/row_version. No JPA entity exists for this
--     table (DB-only, populated via raw SQL/tooling) — schema-only change.
--   - document_store: had none of the 4 audit columns and no row_version.
--     No JPA entity exists for this table either — schema-only change.
--   - emission_obligation: had created_at/updated_at/row_version, missing
--     created_by/updated_by.
--   - emission_scheme: had created_at/updated_at/row_version, missing
--     created_by/updated_by.
--
-- Same conventions as V137/V136: created_at/updated_at default to
-- SYSUTCDATETIME(), created_by/updated_by default to 'SYSTEM' (backfill for
-- pre-existing rows only — real create/update calls always supply their own
-- value going forward), row_version defaults to 0. None of these 10 are
-- temporal tables, so the plain ADD COLUMN NOT NULL DEFAULT form is safe.
-- =============================================================================

ALTER TABLE dbo.carbon_registry ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.container ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.country ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.cp_gtc_agreement ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.credit_limit ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.credit_limit_line_item ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.custom_field_definition ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.document_store ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.emission_obligation ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.emission_scheme ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
