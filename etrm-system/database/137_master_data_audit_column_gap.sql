-- =============================================================================
-- V137 — master-data audit-column gap (created_at/created_by/updated_at/
-- updated_by), 29 tables
--
-- A direct audit of every dbo.master_data_table_registry table's columns
-- found 29 with a partial or total gap in the standard 4-column audit
-- shape (matching AuditableEntity / the generic Tier2 pattern already used
-- by ~75 other registered tables, e.g. book_type/address_type):
--
--   - 20 tables have NONE of the 4 columns: base_date_event_type,
--     blend_recipe_component, business_day_convention_type, collateral_type,
--     commodity, credit_rating, credit_term, event_category, event_type,
--     incoterm, inspection_type, interest_rate_index, location_type,
--     lookup_value, mot_type, pricing_type, regulatory_report_type,
--     settlement_calendar, trade_repository, transport_document_type.
--   - 2 tables (currency, fx_rate) have only created_at (V98's currency
--     migration deliberately scoped to just that column at the time —
--     closing the rest of the gap now that fx_rate needs the same shape).
--   - 7 tables have created_at/created_by but never got updated_at/
--     updated_by: blend_recipe, insurance_provider, inventory_ownership_type,
--     movement_type, product_interface_rule, road_tariff, throughput_agreement.
--
-- No backend code change needed — ReferenceDataCrudService.createRow()/
-- updateRow() already introspect each table's live metadata and only touch
-- created_by/updated_by/updated_at when the column actually exists (see
-- its own doc comment: "~48 of 154 don't [have them]... only add what the
-- table's real, introspected metadata says exists"); created_at is always
-- DB-DEFAULT-populated, never set explicitly by the app. The frontend's
-- editableColumns filter already excludes all 4 names unconditionally.
-- So exactly like V127-V136's row_version rollout, this is schema-only:
-- the moment the columns exist, both create and update paths populate them
-- correctly with zero additional wiring.
--
-- None of the 29 are temporal tables (checked sys.tables.temporal_type), so
-- the plain ADD COLUMN NOT NULL DEFAULT form is safe throughout. created_at/
-- updated_at default to SYSUTCDATETIME() (matches every existing table with
-- these columns); created_by/updated_by default to 'SYSTEM' to backfill
-- existing rows — the app always supplies its own value explicitly on every
-- real create/update going forward, so the default constraint only ever
-- fires for rows that existed before this migration.
-- =============================================================================

-- ── Group A: all 4 columns missing (20 tables) ──────────────────────────────
ALTER TABLE dbo.base_date_event_type ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.blend_recipe_component ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.business_day_convention_type ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.collateral_type ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.commodity ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.credit_rating ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.credit_term ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.event_category ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.event_type ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.incoterm ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.inspection_type ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.interest_rate_index ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.location_type ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.lookup_value ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.mot_type ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.pricing_type ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.regulatory_report_type ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.settlement_calendar ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.trade_repository ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.transport_document_type ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- ── Group B: created_at exists, created_by/updated_at/updated_by missing (2 tables) ──
ALTER TABLE dbo.currency ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.fx_rate ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- ── Group C: created_at/created_by exist, updated_at/updated_by missing (7 tables) ──
ALTER TABLE dbo.blend_recipe ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.insurance_provider ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.inventory_ownership_type ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.movement_type ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.product_interface_rule ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.road_tariff ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.throughput_agreement ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

PRINT '============================================================';
PRINT 'V137 APPLIED — audit columns (created_at/created_by/updated_at/';
PRINT '  updated_by) backfilled across 29 master-data-registry tables';
PRINT '  (20 fully missing, 2 missing 3 of 4, 7 missing 2 of 4). No';
PRINT '  backend/frontend code change needed — ReferenceDataCrudService';
PRINT '  and the Tier2 grid already introspect these generically.';
PRINT '============================================================';
GO
