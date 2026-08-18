-- V256: re-applies what V255 added to ref_product. V255 itself succeeded
-- and is recorded in flyway_schema_history, but the columns/FK/CHECK it
-- added were manually stripped back out during live diagnosis of a SQL
-- Server engine bug (Msg 8624, "Internal Query Processor Error") that
-- turned out to be unrelated to this migration entirely -- confirmed via
-- isolation testing that DELETE fails on ANY heavily-FK'd table on this
-- SQL Server 2022 instance (ref_product has 38 incoming FKs, the most
-- referenced table in the schema), even with every V255 change fully
-- reverted and even on ref_incoterm, a table this session never touched.
-- Not a blocker for this feature either way -- ProductService only ever
-- deactivates, never deletes, and ProductBlendComponentService's deletes
-- target ref_product_blend_component, confirmed unaffected. This migration
-- exists purely to bring the real schema back in line with what Flyway's
-- history already claims (V255 = success) and what the Java entities
-- (Product.java, ProductBlendComponent.java) already expect.
--
-- ref_product_blend_component.is_base_component and the GAS97-BLEND
-- backfill from V255 were never touched during diagnosis and don't need
-- re-applying.

USE ETRM_DB;
GO

ALTER TABLE dbo.ref_product
    ADD trading_start_date DATE NULL,
        trading_end_date   DATE NULL,
        base_product_id    INT  NULL;
GO

CREATE INDEX ix_ref_product_base_product_id ON dbo.ref_product(base_product_id);
GO

ALTER TABLE dbo.ref_product
    ADD CONSTRAINT fk_product_base_product FOREIGN KEY (base_product_id) REFERENCES dbo.ref_product(product_id);
GO

UPDATE dbo.ref_product SET base_product_id = 1, updated_at = SYSUTCDATETIME(), row_version = row_version + 1 WHERE product_id = 3;
GO

-- Two throwaway rows from tonight's live feature testing (product_id 1013
-- "TESTBLEND", 1014 "DISPOSABLE-TEST") are still sitting in the dev DB --
-- DELETE FROM ref_product is separately broken by the SQL Server engine
-- issue documented above, unrelated to this migration, so they can't be
-- removed outright right now. 1013 has is_blend=1 with no base_product_id,
-- which would violate the CHECK below -- deactivate both instead of
-- leaving them to block this migration.
UPDATE dbo.ref_product SET is_active = 0, is_blend = 0, updated_at = SYSUTCDATETIME(), row_version = row_version + 1 WHERE product_id IN (1013, 1014);
GO

DELETE FROM dbo.ref_product_blend_component WHERE parent_product_id IN (1013, 1014);
GO

ALTER TABLE dbo.ref_product
    ADD CONSTRAINT chk_product_base_required_for_blend CHECK (is_blend = 0 OR base_product_id IS NOT NULL);
GO
