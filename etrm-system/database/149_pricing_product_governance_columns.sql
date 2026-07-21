-- =============================================================================
-- V149 — governance-column gap (created_at/created_by/updated_at/updated_by,
-- and row_version where missing), 10 pricing/product/logistics tables
--
-- Part of the 80-table dedicated-entity governance-column sweep (see V137/
-- V127-V136 for the earlier registry-wide and row_version rollouts). This
-- batch covers price_index, price_index_source, pricing_trigger_event_type,
-- pricing_trigger_product, pricing_window_rule, product_blend_component,
-- product_price_index, product_spec_value, railcar, rate_fixing.
--
-- pricing_trigger_event_type, pricing_trigger_product, and rate_fixing have
-- no backend Java entity/service/controller at all (schema-only — see
-- master_data_table_registry rows added by V143, is_enabled=0). This
-- migration only adds the missing columns for them; no Java changes apply.
-- =============================================================================

-- ── created_at exists; add created_by/updated_at/updated_by (row_version already present) ──
ALTER TABLE dbo.price_index ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- ── created_at/created_by exist; add updated_at/updated_by (row_version already present) ──
ALTER TABLE dbo.price_index_source ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.product_blend_component ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.railcar ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- ── all 4 audit columns missing; row_version already present ──
ALTER TABLE dbo.product_price_index ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.product_spec_value ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- ── all 4 audit columns missing, plus row_version added fresh (no Java entity) ──
ALTER TABLE dbo.pricing_trigger_event_type ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.pricing_trigger_product ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', row_version INT NOT NULL DEFAULT 0;
GO

-- ── created_at/created_by exist; add updated_at/updated_by, plus row_version added fresh (no Java entity) ──
ALTER TABLE dbo.pricing_window_rule ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', row_version INT NOT NULL DEFAULT 0;
GO

-- ── created_at exists; add created_by/updated_at/updated_by, plus row_version added fresh (no Java entity) ──
ALTER TABLE dbo.rate_fixing ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', row_version INT NOT NULL DEFAULT 0;
GO

PRINT '============================================================';
PRINT 'V149 APPLIED — governance columns backfilled across 10 pricing/';
PRINT '  product/logistics tables (price_index, price_index_source,';
PRINT '  pricing_trigger_event_type, pricing_trigger_product,';
PRINT '  pricing_window_rule, product_blend_component,';
PRINT '  product_price_index, product_spec_value, railcar, rate_fixing).';
PRINT '============================================================';
GO
