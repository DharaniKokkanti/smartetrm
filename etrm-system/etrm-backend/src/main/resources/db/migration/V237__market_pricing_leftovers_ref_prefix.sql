-- V237: 4 of the 5 confirmed market/pricing leftovers -- `market_product`
-- dropped from this migration after it failed on first run: the registry
-- row exists (module_group 'Organization & Users', is_enabled=0) but the
-- physical table does not (confirmed via sys.tables -- only
-- `market_product_link` exists). A dead/orphaned registry row, is_enabled=0
-- so not live in any UI; pre-existing drift unrelated to today's renames,
-- left untouched pending a real decision (fix the row to point at
-- market_product_link, or delete it) rather than guessed here.
--
-- The remaining 4 were still mistagged under "Organization & Users"
-- (module_group drift, same bug class this whole initiative started by
-- finding) -- confirmed by Dharani as ref_. All allow_create/edit/delete=0
-- in the registry today, but that's the same kind of stale flag already
-- found and worked around this session (pricing_rule et al. in V235) --
-- these are real business-managed reference data (market trading hours,
-- price index definitions and their source/vendor catalogs), not
-- vendor-locked vocabulary. None temporal.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.market_hours', 'ref_market_hours';
GO
EXEC sp_rename 'dbo.price_index', 'ref_price_index';
GO
EXEC sp_rename 'dbo.price_index_source', 'ref_price_index_source';
GO
EXEC sp_rename 'dbo.price_source', 'ref_price_source';
GO

UPDATE dbo.master_data_table_registry SET table_name = 'ref_market_hours', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'market_hours';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_price_index', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'price_index';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_price_index_source', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'price_index_source';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_price_source', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'price_source';
GO
