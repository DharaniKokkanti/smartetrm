-- V236: Power & Energy module_group. 11 business-editable (allow=1, or
-- reclassified: balancing_authority/transmission_right_type are Tier2-
-- locked allow=0 today but directly FK'd by tran_trade_power_detail/
-- tran_trade_transmission_right_detail -- real trade-capture screens need
-- to be able to create these) -> ref_. 3 remaining Tier2-locked tables
-- with no live transaction-screen consumer found -> mst_. None temporal.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.energy_footprint', 'ref_energy_footprint';
GO
EXEC sp_rename 'dbo.energy_footprint_site', 'ref_energy_footprint_site';
GO
EXEC sp_rename 'dbo.generation_asset', 'ref_generation_asset';
GO
EXEC sp_rename 'dbo.interconnector', 'ref_interconnector';
GO
EXEC sp_rename 'dbo.load_shape_component', 'ref_load_shape_component';
GO
EXEC sp_rename 'dbo.load_shape_interval', 'ref_load_shape_interval';
GO
EXEC sp_rename 'dbo.load_shape_template', 'ref_load_shape_template';
GO
EXEC sp_rename 'dbo.power_product_detail', 'ref_power_product_detail';
GO
EXEC sp_rename 'dbo.transmission_zone', 'ref_transmission_zone';
GO
EXEC sp_rename 'dbo.balancing_authority', 'ref_balancing_authority';
GO
EXEC sp_rename 'dbo.transmission_right_type', 'ref_transmission_right_type';
GO
EXEC sp_rename 'dbo.power_ancillary_service_type', 'mst_power_ancillary_service_type';
GO
EXEC sp_rename 'dbo.power_pnode', 'mst_power_pnode';
GO
EXEC sp_rename 'dbo.power_schedule_cycle', 'mst_power_schedule_cycle';
GO

UPDATE dbo.master_data_table_registry SET table_name = 'ref_energy_footprint', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'energy_footprint';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_energy_footprint_site', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'energy_footprint_site';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_generation_asset', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'generation_asset';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_interconnector', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'interconnector';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_load_shape_component', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'load_shape_component';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_load_shape_interval', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'load_shape_interval';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_load_shape_template', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'load_shape_template';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_power_product_detail', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'power_product_detail';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_transmission_zone', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'transmission_zone';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_balancing_authority', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'balancing_authority';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_transmission_right_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'transmission_right_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_power_ancillary_service_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'power_ancillary_service_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_power_pnode', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'power_pnode';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_power_schedule_cycle', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'power_schedule_cycle';
GO
