-- V241: Finance & Settlement module_group (16 tables), same refined
-- classification method as every batch since V235. None temporal; zero
-- native/raw SQL risk confirmed via the standard sweep.
--
-- ref_ (15): cost_center/customs_duty_rule/customs_movement_status/
-- product_hs_code/profit_center/tax_code/tax_rule already allow=1.
-- currency/exchange/gl_account/license_registration/payment_term/
-- tax_registration/unit_of_measure/uom_conversion all have allow=0 but
-- real dedicated pages with working POST/PUT.
--
-- mst_ (1): uom_type -- Tier2-locked, no dedicated page, only feeds
-- unit_of_measure (going ref_), no direct tran_ consumer.
--
-- exchange/payment_term/unit_of_measure are all in ReferenceDataTable.tsx's
-- DEDICATED_ENTITY_FK_TABLES escape hatch -- updated in the same commit as
-- this migration, same as location/storage_facility/transport_route/
-- country in earlier batches.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.cost_center', 'ref_cost_center';
GO
EXEC sp_rename 'dbo.customs_duty_rule', 'ref_customs_duty_rule';
GO
EXEC sp_rename 'dbo.customs_movement_status', 'ref_customs_movement_status';
GO
EXEC sp_rename 'dbo.product_hs_code', 'ref_product_hs_code';
GO
EXEC sp_rename 'dbo.profit_center', 'ref_profit_center';
GO
EXEC sp_rename 'dbo.tax_code', 'ref_tax_code';
GO
EXEC sp_rename 'dbo.tax_rule', 'ref_tax_rule';
GO
EXEC sp_rename 'dbo.currency', 'ref_currency';
GO
EXEC sp_rename 'dbo.exchange', 'ref_exchange';
GO
EXEC sp_rename 'dbo.gl_account', 'ref_gl_account';
GO
EXEC sp_rename 'dbo.license_registration', 'ref_license_registration';
GO
EXEC sp_rename 'dbo.payment_term', 'ref_payment_term';
GO
EXEC sp_rename 'dbo.tax_registration', 'ref_tax_registration';
GO
EXEC sp_rename 'dbo.unit_of_measure', 'ref_unit_of_measure';
GO
EXEC sp_rename 'dbo.uom_conversion', 'ref_uom_conversion';
GO
EXEC sp_rename 'dbo.uom_type', 'mst_uom_type';
GO

UPDATE dbo.master_data_table_registry SET table_name = 'ref_cost_center', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'cost_center';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_customs_duty_rule', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'customs_duty_rule';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_customs_movement_status', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'customs_movement_status';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_product_hs_code', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'product_hs_code';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_profit_center', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'profit_center';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_tax_code', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'tax_code';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_tax_rule', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'tax_rule';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_currency', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'currency';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_exchange', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'exchange';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_gl_account', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'gl_account';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_license_registration', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'license_registration';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_payment_term', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'payment_term';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_tax_registration', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'tax_registration';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_unit_of_measure', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'unit_of_measure';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_uom_conversion', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'uom_conversion';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_uom_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'uom_type';
GO
