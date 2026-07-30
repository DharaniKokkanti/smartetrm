-- V186: Drop dbo.product_price_index
--
-- Reviewed 2026-07-30. product_price_index links product -> price_index
-- directly (a product-level "which indices are valid for this product,
-- with one marked primary" concept), predating this session's V172-V185
-- redesign of the listing-level chain (market_product_link ->
-- price_index_source -> price_index, plus V185's price_index.
-- market_product_link_id). It was never reconciled with that redesign --
-- two unrelated "which index applies here" mechanisms ended up coexisting.
--
-- Facts: 0 rows in the real DB, no other table has an FK to it, and the
-- platform's own 2026-07-21 governance sweep (V143) already flagged it
-- is_enabled=0 -- "never a Static Data page ... exists only so governance
-- sweeps can query by data_category." Effectively dead on arrival even
-- before this review.
--
-- Dharani confirmed: drop it. Superseded by the V172-V185 listing-level
-- chain; no product-level default-index concept is needed.

IF OBJECT_ID('dbo.product_price_index', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.product_price_index;
END

-- meta_table_registry dependency graph (same shape hit at V183) --
-- clear child rows before the registry row itself.
DECLARE @mtr_id INT = (SELECT meta_table_registry_id FROM dbo.meta_table_registry WHERE table_name = 'product_price_index');
IF @mtr_id IS NOT NULL
BEGIN
    DELETE ftr FROM dbo.meta_field_transition_rule ftr
        JOIN dbo.meta_field_change_rule fcr ON fcr.meta_field_change_rule_id = ftr.field_change_rule_id
        WHERE fcr.table_id = @mtr_id;
    DELETE FROM dbo.meta_field_change_rule WHERE table_id = @mtr_id;
    DELETE FROM dbo.meta_table_dependency WHERE parent_table_id = @mtr_id OR child_table_id = @mtr_id;
    DELETE FROM dbo.meta_table_registry WHERE meta_table_registry_id = @mtr_id;
END

DELETE FROM dbo.master_data_table_registry WHERE table_name = 'product_price_index';

PRINT 'V186: dropped dbo.product_price_index (was unpopulated, superseded by V172-V185 listing-level chain).';
