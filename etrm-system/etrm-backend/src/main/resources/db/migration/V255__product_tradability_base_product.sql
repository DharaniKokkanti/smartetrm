-- V255: product setup for trade-creation cascade (base product -> grade ->
-- blend). Design spec gathered over several exchanges with Dharani, see
-- ETRM_Project_Handoff_v1_0.md section 0 (2026-08-15/16 entries) for the
-- full reasoning trail.
--
-- 1. ref_product gets a tradability rule: (is_otc OR is_exchange_traded)
--    AND today BETWEEN trading_start_date AND trading_end_date. Both dates
--    nullable -- a non-blend product with no trading window restriction
--    just has NULL/NULL (never restricted by date).
-- 2. ref_product.base_product_id -- self-referencing FK, the base/carrier
--    component of a blend (e.g. GAS97-E3's base is ULSD). Mandatory when
--    is_blend = 1, enforced via CHECK (same-row rule, no trigger needed).
-- 3. ref_product_blend_component.is_base_component -- marks which
--    component row is the base (mirrors ref_product.base_product_id).
--    Exactly one true row per parent_product_id is an app-layer rule
--    (SQL Server can't CHECK across sibling rows without a trigger).

USE ETRM_DB;
GO

ALTER TABLE dbo.ref_product
    ADD trading_start_date DATE NULL,
        trading_end_date   DATE NULL,
        base_product_id    INT  NULL;
GO

ALTER TABLE dbo.ref_product
    ADD CONSTRAINT fk_product_base_product FOREIGN KEY (base_product_id) REFERENCES dbo.ref_product(product_id);
GO

ALTER TABLE dbo.ref_product_blend_component
    ADD is_base_component BIT NOT NULL CONSTRAINT df_pbc_is_base_component DEFAULT 0;
GO

-- Backfill the one pre-existing blend product (GAS97-BLEND, product_id 3)
-- before the mandatory-base CHECK goes on: its 97% component (component 1,
-- product_id 1) is the base, its 3% component (component 2) is the additive.
UPDATE dbo.ref_product_blend_component SET is_base_component = 1, updated_at = SYSUTCDATETIME(), row_version = row_version + 1 WHERE blend_component_id = 1;
GO
UPDATE dbo.ref_product SET base_product_id = 1, updated_at = SYSUTCDATETIME(), row_version = row_version + 1 WHERE product_id = 3;
GO

ALTER TABLE dbo.ref_product
    ADD CONSTRAINT chk_product_base_required_for_blend CHECK (is_blend = 0 OR base_product_id IS NOT NULL);
GO
