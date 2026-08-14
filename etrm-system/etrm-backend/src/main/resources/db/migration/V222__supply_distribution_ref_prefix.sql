-- V222: first batch of the platform-wide mst_/ref_/tran_ naming convention
-- (Dharani, 2026-08-14) applied to real table data, not just the tran_
-- Trade Capture pass (V221). Batch chosen via the existing
-- master_data_table_registry module_group/is_enabled/allow_create signal --
-- "Supply & Distribution" is the cleanest possible starting point: all 8
-- tables are generic Tier2 (is_enabled=1), user-manageable via the Static
-- Data screens (allow_create=1, allow_edit=1) -- i.e. exactly "reference
-- data tables ... users input the data" -- with zero hand-built/dedicated
-- pages in the group, so there is no classification ambiguity here.
--
-- None of these 8 have a live JPA entity (confirmed: pure Tier2-generic,
-- served entirely through ReferenceDataCrudService off the registry
-- table_name column) -- so this is DB + registry only, no Java changes
-- needed. Frontend blast radius confirmed narrow before starting: only
-- MasterDataHub.tsx (catalog literals) and mocks/referenceData.ts (MSW seed
-- keys) hardcode these table names; the live ReferenceDataTable.tsx/
-- Tier2HomePage.tsx data-fetch path is fully registry-driven and needs zero
-- changes.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.loading_rack', 'ref_loading_rack', 'OBJECT';
GO
EXEC sp_rename 'dbo.movement_type', 'ref_movement_type', 'OBJECT';
GO
EXEC sp_rename 'dbo.inventory_ownership_type', 'ref_inventory_ownership_type', 'OBJECT';
GO
EXEC sp_rename 'dbo.blend_recipe', 'ref_blend_recipe', 'OBJECT';
GO
EXEC sp_rename 'dbo.blend_recipe_component', 'ref_blend_recipe_component', 'OBJECT';
GO
EXEC sp_rename 'dbo.throughput_agreement', 'ref_throughput_agreement', 'OBJECT';
GO
EXEC sp_rename 'dbo.product_interface_rule', 'ref_product_interface_rule', 'OBJECT';
GO
EXEC sp_rename 'dbo.road_tariff', 'ref_road_tariff', 'OBJECT';
GO

UPDATE dbo.master_data_table_registry
SET table_name = 'ref_' + table_name,
    updated_at = SYSUTCDATETIME(),
    updated_by = 'flyway_migration',
    row_version = row_version + 1
WHERE table_name IN (
    'loading_rack', 'movement_type', 'inventory_ownership_type',
    'blend_recipe', 'blend_recipe_component', 'throughput_agreement',
    'product_interface_rule', 'road_tariff'
);
GO
