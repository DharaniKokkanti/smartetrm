-- V238: Logistics & Delivery module_group (25 tables). Same refined
-- method as V235/V236: a stale allow_create/edit=0 flag isn't sufficient
-- evidence for mst_ on its own -- checked for a real dedicated Tier1 page
-- with working create/edit first, and direct FK consumption by a tran_*
-- transaction-capture table second.
--
-- ref_ (18): fleet/fleet_group/transport_operator/vessel_type already
-- allow=1. container/location/pipeline/pipeline_segment/pipeline_tariff/
-- pipeline_cycle/railcar/storage_facility/tank/transport_route/truck all
-- have real dedicated pages with working POST/PUT despite allow=0.
-- pipeline_point has no own controller but is directly FK'd by
-- tran_trade_oil_detail. pipeline_operator_agreement is a real business
-- agreement (matches throughput_agreement, already ref_). tank_calibration
-- is real operational strapping-table data alongside tank.
--
-- tran_ (1): tank_status, data_category=TRANSACTIONAL.
--
-- mst_ (6): location_type/mot_type/storage_facility_type/inspection_type
-- (Tier2-locked, no dedicated page, no direct tran_ consumption -- fixed
-- real-world vocab). pipeline_point_product/pipeline_segment_product
-- (DERIVED + allow=0, same criterion that put market_holiday_calendar/
-- period_mapping in mst_ in V231, confirmed by Dharani).
--
-- None temporal; zero native/raw SQL risk confirmed via the standard sweep.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.fleet', 'ref_fleet';
GO
EXEC sp_rename 'dbo.fleet_group', 'ref_fleet_group';
GO
EXEC sp_rename 'dbo.transport_operator', 'ref_transport_operator';
GO
EXEC sp_rename 'dbo.vessel_type', 'ref_vessel_type';
GO
EXEC sp_rename 'dbo.container', 'ref_container';
GO
EXEC sp_rename 'dbo.location', 'ref_location';
GO
EXEC sp_rename 'dbo.pipeline', 'ref_pipeline';
GO
EXEC sp_rename 'dbo.pipeline_segment', 'ref_pipeline_segment';
GO
EXEC sp_rename 'dbo.pipeline_tariff', 'ref_pipeline_tariff';
GO
EXEC sp_rename 'dbo.pipeline_cycle', 'ref_pipeline_cycle';
GO
EXEC sp_rename 'dbo.railcar', 'ref_railcar';
GO
EXEC sp_rename 'dbo.storage_facility', 'ref_storage_facility';
GO
EXEC sp_rename 'dbo.tank', 'ref_tank';
GO
EXEC sp_rename 'dbo.transport_route', 'ref_transport_route';
GO
EXEC sp_rename 'dbo.truck', 'ref_truck';
GO
EXEC sp_rename 'dbo.pipeline_point', 'ref_pipeline_point';
GO
EXEC sp_rename 'dbo.pipeline_operator_agreement', 'ref_pipeline_operator_agreement';
GO
EXEC sp_rename 'dbo.tank_calibration', 'ref_tank_calibration';
GO
EXEC sp_rename 'dbo.tank_status', 'tran_tank_status';
GO
EXEC sp_rename 'dbo.location_type', 'mst_location_type';
GO
EXEC sp_rename 'dbo.mot_type', 'mst_mot_type';
GO
EXEC sp_rename 'dbo.storage_facility_type', 'mst_storage_facility_type';
GO
EXEC sp_rename 'dbo.inspection_type', 'mst_inspection_type';
GO
EXEC sp_rename 'dbo.pipeline_point_product', 'mst_pipeline_point_product';
GO
EXEC sp_rename 'dbo.pipeline_segment_product', 'mst_pipeline_segment_product';
GO

UPDATE dbo.master_data_table_registry SET table_name = 'ref_fleet', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'fleet';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_fleet_group', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'fleet_group';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_transport_operator', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'transport_operator';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_vessel_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'vessel_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_container', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'container';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_location', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'location';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_pipeline', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'pipeline';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_pipeline_segment', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'pipeline_segment';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_pipeline_tariff', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'pipeline_tariff';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_pipeline_cycle', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'pipeline_cycle';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_railcar', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'railcar';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_storage_facility', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'storage_facility';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_tank', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'tank';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_transport_route', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'transport_route';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_truck', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'truck';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_pipeline_point', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'pipeline_point';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_pipeline_operator_agreement', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'pipeline_operator_agreement';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_tank_calibration', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'tank_calibration';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'tran_tank_status', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'tank_status';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_location_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'location_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_mot_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mot_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_storage_facility_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'storage_facility_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_inspection_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'inspection_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_pipeline_point_product', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'pipeline_point_product';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_pipeline_segment_product', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'pipeline_segment_product';
GO
