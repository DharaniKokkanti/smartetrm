-- V254: two separate changes from the product-grade review.
--
-- 1. ref_commodity_grade_standard -> ref_product_grade_standard. Dharani
--    confirmed this table is genuinely needed (it's the mechanism behind
--    tran_trade_order_price_adjustment.grade_standard_id and
--    ref_agri_moisture_discount_scale, not redundant with
--    ref_product.grade_code's flat label) but its own name was wrong --
--    it's FK'd by product_id, not commodity-level, and its own registry
--    description already said "Scoped per product, not per commodity
--    family." Renamed to match its real grain.
--
-- 2. Dropped ref_blend_recipe + ref_blend_recipe_component. Confirmed
--    these are dead weight: no Java entity, no live frontend feature, only
--    ever surfaced generically via the Static Data catalog. The real,
--    live blending mechanism is ref_product_blend_component (dedicated
--    entity/controller/repository/service, wired directly into
--    ProductsPage.tsx) -- keeping two parallel mechanisms for the same
--    concept (one recipe-centric, one product-centric) wasn't a deliberate
--    design choice, just drift.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.ref_commodity_grade_standard', 'ref_product_grade_standard';
GO

UPDATE dbo.sys_master_data_table_registry
SET table_name = 'ref_product_grade_standard', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1
WHERE table_name = 'ref_commodity_grade_standard';
GO

DROP TABLE dbo.ref_blend_recipe_component;
GO
DROP TABLE dbo.ref_blend_recipe;
GO

-- meta_table_registry stores these under their pre-prefix legacy names
-- (blend_recipe / blend_recipe_component, backfilled by V155) -- a real
-- table dropped here means its meta_table_dependency and
-- meta_field_change_rule rows (and any meta_field_transition_rule rows
-- hanging off those, none found for these two) describing behavior that no
-- longer exists need to go too, unlike V244's repair case where the
-- underlying data was still valid.
DELETE FROM dbo.meta_field_transition_rule
WHERE field_change_rule_id IN (
    SELECT meta_field_change_rule_id FROM dbo.meta_field_change_rule
    WHERE table_id IN (SELECT meta_table_registry_id FROM dbo.meta_table_registry WHERE table_name IN ('blend_recipe', 'blend_recipe_component'))
);
GO

DELETE FROM dbo.meta_field_change_rule
WHERE table_id IN (SELECT meta_table_registry_id FROM dbo.meta_table_registry WHERE table_name IN ('blend_recipe', 'blend_recipe_component'));
GO

DELETE FROM dbo.meta_table_dependency
WHERE parent_table_id IN (SELECT meta_table_registry_id FROM dbo.meta_table_registry WHERE table_name IN ('blend_recipe', 'blend_recipe_component'))
   OR child_table_id IN (SELECT meta_table_registry_id FROM dbo.meta_table_registry WHERE table_name IN ('blend_recipe', 'blend_recipe_component'));
GO

DELETE FROM dbo.meta_table_registry WHERE table_name IN ('blend_recipe', 'blend_recipe_component');
GO

DELETE FROM dbo.sys_master_data_table_registry WHERE table_name IN ('ref_blend_recipe', 'ref_blend_recipe_component');
GO
