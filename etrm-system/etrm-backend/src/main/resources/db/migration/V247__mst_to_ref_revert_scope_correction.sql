-- V247: scope correction on V246. Dharani confirmed only commodity/
-- commodity_type were the real mst_ correction he meant -- "that's not
-- correct so let's revert all except commodity and commodity type."
-- market_product_source, pipeline_point, reporting_group, spec_parameter
-- revert to ref_, same as V234 correcting V233's over-scoped usr_ sweep:
-- one real, confirmed correction doesn't license extrapolating a whole
-- audit's findings without checking each one first.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.mst_market_product_source', 'ref_market_product_source';
GO
EXEC sp_rename 'dbo.mst_pipeline_point', 'ref_pipeline_point';
GO
EXEC sp_rename 'dbo.mst_reporting_group', 'ref_reporting_group';
GO
EXEC sp_rename 'dbo.mst_spec_parameter', 'ref_spec_parameter';
GO

UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_market_product_source', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_market_product_source';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_pipeline_point', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_pipeline_point';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_reporting_group', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_reporting_group';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_spec_parameter', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_spec_parameter';
GO
