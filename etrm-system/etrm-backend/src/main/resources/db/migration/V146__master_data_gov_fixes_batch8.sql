-- =============================================================================
-- V146 — master-data audit-column / row_version gap, batch of 10 tables
--
-- Continues the V127-V145 governance-column rollout (row_version optimistic
-- locking + created_at/created_by/updated_at/updated_by audit columns) for
-- this batch of 10 dedicated (non-Tier2) master-data tables, confirmed live
-- against sys.columns / master_data_table_registry:
--
--   - environmental_product: has created_at/updated_at/row_version, missing
--     created_by/updated_by.
--   - field_permission_rule: has row_version only, missing all 4 audit cols.
--   - formula_component: has NONE of the 5 (also needs row_version added
--     fresh). No Java entity exists for this table (it's an orphan child
--     table of formula_template with no backend wiring yet) — schema-only.
--   - formula_template: has created_at/created_by/row_version, missing
--     updated_at/updated_by.
--   - gtc: has created_at/created_by/row_version, missing updated_at/
--     updated_by.
--   - gtc_version: has created_at/created_by/row_version, missing
--     updated_at/updated_by.
--   - holiday: has NONE of the 5 (also needs row_version added fresh). No
--     Java entity exists for this table — dbo.calendar_holiday (V100) is
--     the actual entity backing HolidayCalendarService's holiday CRUD;
--     dbo.holiday (V1) is an orphan predecessor table. Schema-only.
--   - holiday_calendar: has created_at/row_version, missing created_by/
--     updated_at/updated_by.
--   - insurance_policy_coverage: has NONE of the 5 (also needs row_version
--     added fresh). No Java entity exists for this table — orphan.
--     Schema-only.
--   - interest_rate: has row_version missing too, plus all 4 audit columns
--     missing. No Java entity exists for this table — orphan. Schema-only.
--
-- Same shape as V137/V127-V136: created_at/updated_at DATETIME2 NOT NULL
-- DEFAULT SYSUTCDATETIME(), created_by/updated_by VARCHAR(100) NOT NULL
-- DEFAULT 'SYSTEM', row_version INT NOT NULL DEFAULT 0 where new. None of
-- these are temporal tables, so plain ADD COLUMN NOT NULL DEFAULT is safe.
-- =============================================================================

-- environmental_product: add created_by/updated_by only.
ALTER TABLE dbo.environmental_product ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- field_permission_rule: add all 4 audit columns (row_version already present).
ALTER TABLE dbo.field_permission_rule ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- formula_component: add all 4 audit columns + row_version fresh.
ALTER TABLE dbo.formula_component ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', row_version INT NOT NULL DEFAULT 0;
GO

-- formula_template: add updated_at/updated_by only.
ALTER TABLE dbo.formula_template ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- gtc: add updated_at/updated_by only.
ALTER TABLE dbo.gtc ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- gtc_version: add updated_at/updated_by only.
ALTER TABLE dbo.gtc_version ADD updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- holiday: add all 4 audit columns + row_version fresh.
ALTER TABLE dbo.holiday ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', row_version INT NOT NULL DEFAULT 0;
GO

-- holiday_calendar: add created_by/updated_at/updated_by.
ALTER TABLE dbo.holiday_calendar ADD created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM';
GO

-- insurance_policy_coverage: add all 4 audit columns + row_version fresh.
ALTER TABLE dbo.insurance_policy_coverage ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', row_version INT NOT NULL DEFAULT 0;
GO

-- interest_rate: add all 4 audit columns + row_version fresh.
ALTER TABLE dbo.interest_rate ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), created_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM', row_version INT NOT NULL DEFAULT 0;
GO
