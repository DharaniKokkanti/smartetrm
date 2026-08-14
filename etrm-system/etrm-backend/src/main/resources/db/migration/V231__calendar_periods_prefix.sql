-- V231: Calendar & Periods module_group. calendar_holiday, holiday,
-- holiday_calendar, market_holiday_calendar, period, period_mapping are
-- SYSTEM-locked (allow=0) -> mst_. payment_calendar_assignment,
-- settlement_calendar are business-editable (allow=1) -> ref_. None
-- temporal. holiday_calendar and period are the most heavily FK-referenced
-- tables in this batch (25 incoming FKs combined) -- sp_rename is safe
-- since FKs bind by object_id, and ReferenceDataMetadataService resolves
-- FK targets dynamically via sys.foreign_keys, so no other backend code
-- changes are needed for the referencing tables.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.calendar_holiday', 'mst_calendar_holiday';
GO
EXEC sp_rename 'dbo.holiday', 'mst_holiday';
GO
EXEC sp_rename 'dbo.holiday_calendar', 'mst_holiday_calendar';
GO
EXEC sp_rename 'dbo.market_holiday_calendar', 'mst_market_holiday_calendar';
GO
EXEC sp_rename 'dbo.period', 'mst_period';
GO
EXEC sp_rename 'dbo.period_mapping', 'mst_period_mapping';
GO
EXEC sp_rename 'dbo.payment_calendar_assignment', 'ref_payment_calendar_assignment';
GO
EXEC sp_rename 'dbo.settlement_calendar', 'ref_settlement_calendar';
GO

UPDATE dbo.master_data_table_registry SET table_name = 'mst_calendar_holiday', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'calendar_holiday';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_holiday', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'holiday';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_holiday_calendar', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'holiday_calendar';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_market_holiday_calendar', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'market_holiday_calendar';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_period', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'period';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_period_mapping', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'period_mapping';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_payment_calendar_assignment', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'payment_calendar_assignment';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_settlement_calendar', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'settlement_calendar';
GO
