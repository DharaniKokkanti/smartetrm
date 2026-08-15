-- V246: corrects 6 tables misclassified ref_ instead of mst_ by the early
-- V224 batch (Counterparties & Agreements + Products & Markets), the
-- mirror-image error of V245's mst_->ref_ corrections. Found after Dharani
-- caught `ref_commodity` should be `mst_` -- a full sweep of every `ref_`
-- table with allow_create/edit/delete=0 (131 tables) confirmed these 6
-- have a dedicated JPA entity but genuinely ZERO write path anywhere:
-- no own controller, no controller-with-POST/PUT in the same package, and
-- (checked directly) zero `new ClassName()` construction anywhere in the
-- whole backend -- meaning these rows can only ever be seeded via direct
-- SQL/migration, never through the application itself. Same shape as
-- every other mst_ table: the only write path is the generic Tier2
-- mechanism's ROLE_ADMIN override, identical to mst_pricing_type.
--
-- ref_commodity, ref_commodity_type -- the commodity taxonomy (Crude Oil/
-- Natural Gas/Metals/Agriculturals) is vendor-defined at build time, not
-- populated as the business onboards, unlike product/market/counterparty.
-- ref_reporting_group, ref_spec_parameter, ref_market_product_source,
-- ref_pipeline_point -- all confirmed no write path; pipeline_point in
-- particular was reclassified ref_ in V238 on the reasoning "trades need
-- it creatable" -- wrong: trades need it to exist and be selectable via
-- FK, not creatable by a trader. Physical pipeline delivery points are
-- engineering-fixed, seeded once by the vendor, same as any other mst_
-- vocabulary.
--
-- Excluded from this batch after individual verification: ref_gtc_version
-- (GtcService.java does `new GtcVersion()` as a real nested-create side
-- effect of Gtc's own create/update flow -- genuine write path, stays
-- ref_), ref_credit_limit_line_item and ref_trader_commodity_limit
-- (already confirmed in V239/V240 to have real nested-save write paths
-- via CreditLimitService.saveLineItems/TraderService.saveCommodityLimits
-- -- also stay ref_).
--
-- None temporal; zero native/raw SQL risk confirmed via the standard sweep.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.ref_commodity', 'mst_commodity';
GO
EXEC sp_rename 'dbo.ref_commodity_type', 'mst_commodity_type';
GO
EXEC sp_rename 'dbo.ref_market_product_source', 'mst_market_product_source';
GO
EXEC sp_rename 'dbo.ref_pipeline_point', 'mst_pipeline_point';
GO
EXEC sp_rename 'dbo.ref_reporting_group', 'mst_reporting_group';
GO
EXEC sp_rename 'dbo.ref_spec_parameter', 'mst_spec_parameter';
GO

UPDATE dbo.sys_master_data_table_registry SET table_name = 'mst_commodity', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'ref_commodity';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'mst_commodity_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'ref_commodity_type';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'mst_market_product_source', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'ref_market_product_source';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'mst_pipeline_point', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'ref_pipeline_point';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'mst_reporting_group', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'ref_reporting_group';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'mst_spec_parameter', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'ref_spec_parameter';
GO
