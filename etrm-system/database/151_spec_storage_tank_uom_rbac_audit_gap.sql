-- =============================================================================
-- V151 — governance-column gap batch (created_at/created_by/updated_at/
-- updated_by, and row_version where missing), 10 dedicated (non-Tier2)
-- master-data entities.
--
-- Per-table status verified live against sys.columns before this migration
-- (1 = column already exists, 0 = missing):
--   spec_parameter          (0,0,0,0,1) — row_version already present
--   storage_facility        (0,0,0,0,1) — row_version already present; the
--                            best-first-candidate table, zero audit columns
--                            at all (StorageFacilityController/StoragePage.tsx)
--   tank_calibration        (0,0,0,0,0) — no audit columns AND no row_version;
--                            also has no backing Java entity/service/
--                            controller at all today (verified via repo-wide
--                            grep) — schema-only fix, nothing to wire up yet
--   trader_commodity_limit  (0,0,0,0,1) — row_version already present
--   transport_route         (1,1,0,0,1) — created_at/created_by already exist
--                            (as plain, non-auditing columns); only
--                            updated_at/updated_by added here
--   truck                   (1,1,0,0,1) — same shape as transport_route
--   unit_of_measure         (1,0,0,0,1) — created_at exists (V111); created_by/
--                            updated_at/updated_by added here
--   uom_conversion           (0,0,0,0,1) — row_version already present
--   user_role_assignment     (0,0,0,0,1) — row_version already present
--   vessel_certificate       (1,1,0,0,1) — same shape as transport_route/truck
--
-- Same rationale as V137/V127-V136: created_at/updated_at default to
-- SYSUTCDATETIME(); created_by/updated_by default to 'SYSTEM' to backfill
-- existing rows only — every real create/update path supplies its own value
-- going forward. row_version (only new for tank_calibration) defaults to 0,
-- matching every other optimistic-locking rollout in this series. None of
-- these 10 are temporal tables, so the plain ADD COLUMN NOT NULL DEFAULT
-- form is safe throughout.
-- =============================================================================

-- ── row_version already present, only the 4 audit columns are added ────────
ALTER TABLE dbo.spec_parameter ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.storage_facility ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.trader_commodity_limit ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.uom_conversion ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.user_role_assignment ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- ── created_at/created_by already exist, only updated_at/updated_by are added ──
ALTER TABLE dbo.transport_route ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.truck ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.vessel_certificate ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- ── created_at only exists, created_by/updated_at/updated_by are added ─────
ALTER TABLE dbo.unit_of_measure ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- ── nothing present at all: all 4 audit columns AND row_version are added ──
ALTER TABLE dbo.tank_calibration ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', row_version INT NOT NULL DEFAULT 0;
GO

PRINT '============================================================';
PRINT 'V151 APPLIED — governance-column gap closed across 10 tables';
PRINT '  (spec_parameter, storage_facility, tank_calibration,';
PRINT '  trader_commodity_limit, transport_route, truck, unit_of_measure,';
PRINT '  uom_conversion, user_role_assignment, vessel_certificate).';
PRINT '  tank_calibration also got row_version added fresh (no Java';
PRINT '  entity exists for it yet).';
PRINT '============================================================';
GO
