-- V253: ref_deal_type and ref_kyc_status reclassified ref_ -> mst_ per
-- direct instruction. No Java entity or branching logic found for either
-- (both are generic FK-lookup dropdowns via configLookups.ts) -- doesn't
-- meet the "real logic" bar from V252's thumb rule, but named explicitly
-- rather than found by audit, so executed as asked.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.ref_deal_type', 'mst_deal_type';
GO
EXEC sp_rename 'dbo.ref_kyc_status', 'mst_kyc_status';
GO

UPDATE dbo.sys_master_data_table_registry SET table_name = 'mst_deal_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'ref_deal_type';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'mst_kyc_status', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'ref_kyc_status';
GO
