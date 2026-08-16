-- V250: mst_commodity_type and mst_commodity look confusingly similar by
-- name alone despite representing different things -- mst_commodity is the
-- 5-row tradable-commodity classification product/market FK against;
-- mst_commodity_type is the broader 11-row sector tag (includes FREIGHT/
-- RINS/ENVIRONMENTAL/MULTI/OTHER, which mst_commodity has no equivalent
-- for) used across location/GL/freight/laytime/port-activity/trader-limit/
-- UOM/voyage tables. Dharani weighed merging the two vs. just renaming for
-- clarity (merging would require rewriting real service logic in
-- VoyageCargoParcelService/TraderService, not just a DDL change) and chose
-- the low-risk option: rename mst_commodity_type -> mst_commodity_sector so
-- the two are unambiguous by name alone. Pure rename, no FK/data changes --
-- all 11 existing FK constraints stay intact and are unaffected by
-- sp_rename.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.mst_commodity_type', 'mst_commodity_sector';
GO

UPDATE dbo.sys_master_data_table_registry
SET table_name = 'mst_commodity_sector', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1
WHERE table_name = 'mst_commodity_type';
GO
