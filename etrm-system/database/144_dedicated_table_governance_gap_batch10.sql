-- =============================================================================
-- V144 — dedicated (non-Tier2) master-data governance-column gap, batch of 10
--
-- Continues the V137 audit-column rollout (created_at/created_by/updated_at/
-- updated_by) and the V127-V136 row_version rollout, this time for 10
-- dedicated entities that fell outside the master_data_table_registry-driven
-- V137 sweep. Verified live against sys.columns/master_data_table_registry:
--
--   - app_function, app_module, book_access_grant: row_version already
--     present; all 4 audit columns missing.
--   - balmo_product: created_at/updated_at already present; created_by/
--     updated_by/row_version all missing (also has no backing Java entity —
--     schema-only fix, see migration note in the batch report).
--   - book_classification, book_ownership, book_trader: created_at/
--     created_by/row_version already present; updated_at/updated_by missing.
--   - broker, broker_fee_agreement: created_at/row_version already present;
--     created_by/updated_at/updated_by missing.
--   - calendar_holiday: nothing present — all 4 audit columns AND
--     row_version added fresh.
-- =============================================================================

-- ── Group A: row_version present, all 4 audit columns missing (3 tables) ───
ALTER TABLE dbo.app_function ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.app_module ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.book_access_grant ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- ── Group B: created_at/updated_at present, created_by/updated_by/row_version missing (1 table) ──
ALTER TABLE dbo.balmo_product ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', row_version INT NOT NULL DEFAULT 0;
GO

-- ── Group C: created_at/created_by/row_version present, updated_at/updated_by missing (3 tables) ──
ALTER TABLE dbo.book_classification ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.book_ownership ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.book_trader ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- ── Group D: created_at/row_version present, created_by/updated_at/updated_by missing (2 tables) ──
ALTER TABLE dbo.broker ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO
ALTER TABLE dbo.broker_fee_agreement ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- ── Group E: nothing present — all 4 audit columns + row_version added fresh (1 table) ──
ALTER TABLE dbo.calendar_holiday ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', row_version INT NOT NULL DEFAULT 0;
GO

PRINT '============================================================';
PRINT 'V144 APPLIED — governance-column gap closed across 10 dedicated';
PRINT '  tables: app_function, app_module, balmo_product,';
PRINT '  book_access_grant, book_classification, book_ownership,';
PRINT '  book_trader, broker, broker_fee_agreement, calendar_holiday.';
PRINT '============================================================';
GO
