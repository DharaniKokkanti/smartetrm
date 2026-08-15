-- V245: corrects 8 tables misclassified mst_ instead of ref_ by the early
-- batches (V227-V232, before the "check for a real dedicated page with
-- working create/edit" refinement was adopted from V235 onward). Found by
-- a full audit of every mst_ table's Java entity/controller, prompted
-- directly by Dharani questioning the mst_currency example used to
-- explain the vendor-only enforcement gap ("any other tables like this?").
--
-- All 8 have real, working POST/PUT (or nested-create) endpoints despite
-- the registry's allow_create/edit/delete=0 flag:
--   mst_holiday_calendar -> HolidayCalendarController (/api/v1/holiday-calendars)
--   mst_calendar_holiday -> nested under the same controller
--     (POST /{calendarId}/holidays, POST /{calendarId}/holidays/bulk)
--   mst_incoterm -> IncotermController (/api/v1/incoterms-ref)
--   mst_payment_method -> PaymentMethodController (/api/v1/payment-methods)
--   mst_period -> PeriodController (/api/v1/periods)
--   mst_rin_account -> RinAccountController (/api/v1/rin-accounts)
--   mst_rin_fuel_category -> RinFuelCategoryController (/api/v1/rin-fuel-categories)
--   mst_rin_obligation -> RinObligationController (/api/v1/rin-obligations)
--
-- None temporal; zero native/raw SQL risk confirmed via the standard sweep.
-- mst_holiday_calendar is also in ReferenceDataTable.tsx's
-- DEDICATED_ENTITY_FK_TABLES escape hatch -- updated to
-- ref_holiday_calendar in the same commit.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.mst_calendar_holiday', 'ref_calendar_holiday';
GO
EXEC sp_rename 'dbo.mst_holiday_calendar', 'ref_holiday_calendar';
GO
EXEC sp_rename 'dbo.mst_incoterm', 'ref_incoterm';
GO
EXEC sp_rename 'dbo.mst_payment_method', 'ref_payment_method';
GO
EXEC sp_rename 'dbo.mst_period', 'ref_period';
GO
EXEC sp_rename 'dbo.mst_rin_account', 'ref_rin_account';
GO
EXEC sp_rename 'dbo.mst_rin_fuel_category', 'ref_rin_fuel_category';
GO
EXEC sp_rename 'dbo.mst_rin_obligation', 'ref_rin_obligation';
GO

UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_calendar_holiday', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_calendar_holiday';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_holiday_calendar', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_holiday_calendar';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_incoterm', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_incoterm';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_payment_method', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_payment_method';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_period', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_period';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_rin_account', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_rin_account';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_rin_fuel_category', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_rin_fuel_category';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_rin_obligation', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_rin_obligation';
GO
