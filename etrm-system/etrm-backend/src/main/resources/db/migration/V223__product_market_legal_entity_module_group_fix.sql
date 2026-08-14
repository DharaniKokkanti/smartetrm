-- V223: product/market/legal_entity were mistagged module_group='Organization
-- & Users' (the same catch-all-bucket bug already fixed for the 23 Trade
-- Capture tables in V218) -- found while scoping the Counterparties &
-- Agreements / Products & Markets ref_ rename (Dharani, 2026-08-14).
-- product/market belong under Products & Markets; legal_entity belongs
-- under Counterparties & Agreements. Registry-only, no DB table touched.

USE ETRM_DB;
GO

UPDATE dbo.master_data_table_registry
SET module_group = 'Products & Markets',
    updated_at = SYSUTCDATETIME(),
    updated_by = 'flyway_migration',
    row_version = row_version + 1
WHERE table_name IN ('product', 'market');
GO

UPDATE dbo.master_data_table_registry
SET module_group = 'Counterparties & Agreements',
    updated_at = SYSUTCDATETIME(),
    updated_by = 'flyway_migration',
    row_version = row_version + 1
WHERE table_name = 'legal_entity';
GO
