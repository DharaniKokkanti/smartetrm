-- =============================================================================
-- V147 — dedicated (non-Tier2) master-data entity audit-column gap, batch 8
-- of the 80-table sweep started by V137 (Tier2/registry tables) and
-- continued for dedicated entities (V138+): legal_entity_ownership,
-- letter_of_credit, location, margin_account, margin_agreement,
-- market_hours, market_product, market_product_period,
-- market_product_source, missing_fixing_rule.
--
-- Column shape matches V137 exactly: created_at/updated_at DATETIME2 NOT
-- NULL DEFAULT SYSUTCDATETIME(); created_by/updated_by VARCHAR(100) NOT
-- NULL DEFAULT 'SYSTEM' (backfills existing rows; every real create/update
-- going forward supplies its own value explicitly via JPA auditing).
--
-- market_hours and missing_fixing_rule have no dedicated Java entity (both
-- Tier2-generic, managed by ReferenceDataCrudService via live metadata
-- introspection) — schema-only for those two, same as V137. market_hours
-- additionally never had row_version at all; added fresh here.
-- missing_fixing_rule already has row_version (per JPA @Version note in the
-- batch spec it does NOT — added fresh here too).
--
-- The other 8 (legal_entity_ownership/letter_of_credit/location/
-- margin_account/margin_agreement/market_product/market_product_period/
-- market_product_source) are dedicated entities; their Java changes (added
-- @CreatedDate/@CreatedBy/@LastModifiedDate/@LastModifiedBy annotations,
-- @EntityListeners(AuditingEntityListener.class), service update() copying
-- created_at/created_by from the existing row) are in the same commit as
-- this migration. market_product_period gets row_version-free treatment
-- (already has row_version); all 4 audit columns are new for it.
-- =============================================================================

-- ── legal_entity_ownership: created_at/created_by exist, updated_at/updated_by missing ──
ALTER TABLE dbo.legal_entity_ownership ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- ── letter_of_credit: created_at/updated_at exist, created_by/updated_by missing ──
ALTER TABLE dbo.letter_of_credit ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- ── location: created_at/created_by exist, updated_at/updated_by missing ──
ALTER TABLE dbo.location ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- ── margin_account: created_at/created_by exist, updated_at/updated_by missing ──
ALTER TABLE dbo.margin_account ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- ── margin_agreement: created_at/updated_at exist, created_by/updated_by missing ──
ALTER TABLE dbo.margin_agreement ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- ── market_hours: all 4 audit columns AND row_version missing (Tier2-generic, no Java entity) ──
ALTER TABLE dbo.market_hours ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', row_version INT NOT NULL DEFAULT 0;
GO

-- ── market_product: created_at/created_by exist, updated_at/updated_by missing ──
ALTER TABLE dbo.market_product ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- ── market_product_period: all 4 audit columns missing (row_version already present) ──
ALTER TABLE dbo.market_product_period ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- ── market_product_source: created_at/created_by exist, updated_at/updated_by missing ──
ALTER TABLE dbo.market_product_source ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- ── missing_fixing_rule: created_at/created_by exist, updated_at/updated_by/row_version missing (Tier2-generic, no Java entity) ──
ALTER TABLE dbo.missing_fixing_rule ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', row_version INT NOT NULL DEFAULT 0;
GO

PRINT '============================================================';
PRINT 'V147 APPLIED — audit-column gap closed for 10 tables (batch 8):';
PRINT '  legal_entity_ownership, letter_of_credit, location,';
PRINT '  margin_account, margin_agreement, market_hours, market_product,';
PRINT '  market_product_period, market_product_source,';
PRINT '  missing_fixing_rule. market_hours + missing_fixing_rule also';
PRINT '  gained row_version (Tier2-generic tables, no Java entity change';
PRINT '  needed). The other 8 dedicated entities got matching JPA';
PRINT '  auditing annotations in this commit.';
PRINT '============================================================';
GO
