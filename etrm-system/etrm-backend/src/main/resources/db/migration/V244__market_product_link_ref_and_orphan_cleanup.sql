-- V244: closes the `market_product` orphaned-registry-row gap found in
-- V237. Confirmed twice (sys.tables direct query, live at migration time)
-- that no physical `market_product` table exists -- only `market_product_link`
-- does, with 12 real rows and a dedicated Tier1 controller with working
-- POST/PUT (/api/v1/markets/{marketId}/product-links). The registry row's
-- own note ("has a dedicated Tier 1 controller, not Tier2-generic CRUD")
-- confirms it was always meant to represent market_product_link's entity,
-- just recorded under the wrong table_name at some point before this
-- session.
--
-- Originally planned as delete-and-recreate, changed to repair-in-place
-- after discovering meta_table_registry (V155, backfilled from
-- master_data_table_registry -- exists despite root CLAUDE.md still saying
-- "planned, not built" as of V151, that claim is stale) has its own
-- mirrored row, and meta_table_dependency has 5 rows of REAL FK-derived
-- relationship data hanging off it (fk_mp_currency/fk_mp_market/
-- fk_mp_product/fk_mp_uom/fk_mps_mktprod -- V155's whole-schema FK scan
-- output, not garbage). Deleting would have destroyed that. Repairing the
-- table_name in place on both registry rows keeps all of it intact.
--
-- market_product_link is real business data -- links a market to a
-- tradeable product, heavily FK-referenced (price_index/price_index_source/
-- margin_offset_rule/period/derivative_contract_specification all point
-- into it) -- renamed to ref_market_product_link. Not temporal; the one
-- raw-SQL reference (MarginOffsetRuleService) fixed in the same commit.
--
-- market_product_link is also a bare literal in ReferenceDataTable.tsx's
-- DEDICATED_ENTITY_FK_TABLES escape hatch + dedicatedEntityFkOptions map --
-- updated to ref_market_product_link in the same commit.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.market_product_link', 'ref_market_product_link';
GO

UPDATE dbo.sys_master_data_table_registry
SET table_name = 'ref_market_product_link',
    description = 'Links a market to a tradeable product -- the target of FK columns on price_index, price_index_source, margin_offset_rule, period, and derivative_contract_specification. Has a dedicated Tier 1 controller (own market-scoped CRUD, /api/v1/markets/{marketId}/product-links), not Tier2-generic CRUD -- is_enabled=0 so it never shows as a standalone Static Data page. table_name corrected 2026-08-15 (was recorded as ''market_product'', a drift bug -- no such physical table ever existed).',
    updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1
WHERE table_name = 'market_product';
GO

UPDATE dbo.meta_table_registry
SET table_name = 'ref_market_product_link',
    notes = notes + ' table_name corrected 2026-08-15 (was ''market_product'', a drift bug carried over from the V155 backfill).',
    updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1
WHERE table_name = 'market_product';
GO
