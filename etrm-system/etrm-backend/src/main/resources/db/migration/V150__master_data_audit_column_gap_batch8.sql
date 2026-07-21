-- V150 — governance-column gap fixes, batch 8 of the 80-table sweep
-- (see V137's doc comment for the original audit; this batch covers 10 more
-- dedicated/registry tables found with a partial or total governance-column
-- gap). Only the columns actually missing per table are added; row_version
-- is added fresh only where noted.

-- regulatory_obligation: created_at/created_by already present; missing updated_at/updated_by.
ALTER TABLE dbo.regulatory_obligation ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- reporting_counterparty: created_at/created_by already present; missing updated_at/updated_by AND row_version.
ALTER TABLE dbo.reporting_counterparty ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', row_version INT NOT NULL DEFAULT 0;
GO

-- rin_account: created_at/updated_at already present; missing created_by/updated_by.
ALTER TABLE dbo.rin_account ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- rin_fuel_category: created_at/updated_at already present; missing created_by/updated_by.
ALTER TABLE dbo.rin_fuel_category ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- rin_obligation: created_at/updated_at already present; missing created_by/updated_by.
ALTER TABLE dbo.rin_obligation ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- role_field_profile: row_version already present (V135); all 4 audit columns missing.
ALTER TABLE dbo.role_field_profile ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- role_function: row_version already present (V135); all 4 audit columns missing.
ALTER TABLE dbo.role_function ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- screen_field_registry: row_version already present (V135); all 4 audit columns missing.
ALTER TABLE dbo.screen_field_registry ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- settlement_price: created_at/updated_at already present; missing created_by/updated_by.
ALTER TABLE dbo.settlement_price ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- spec_override: created_at/created_by already present; missing updated_at/updated_by AND row_version.
ALTER TABLE dbo.spec_override ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', row_version INT NOT NULL DEFAULT 0;
GO
