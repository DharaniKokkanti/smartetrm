-- =============================================================================
-- V74 — pipeline_cycle: add nullable product_id scope
-- =============================================================================
-- User flagged that pipeline_cycle applying identically to every product
-- moving through a pipeline isn't right for every pipeline — a multi-product
-- pipeline can run different batch/cycle rules per product family (e.g. a
-- refined-products pipeline's gasoline cycle vs. its distillate cycle).
-- Researched real practice (FERC tariff filings — Colonial Pipeline,
-- Explorer Pipeline): cycle deadlines are defined per pipeline/segment and
-- shared across whichever product batch is nominated into that cycle slot —
-- there is no per-product deadline variance within a single cycle. So this is
-- NOT a case for cycles having different deadlines per product; it's the
-- same optional-scope shape already used by pipeline_tariff.product_id
-- (NULL = applies to all products, non-NULL = this cycle is specific to one
-- product) — added here for the same reason: a pipeline may run a cycle that
-- is only ever used for one product (e.g. a dedicated crude cycle on an
-- otherwise multi-product pipeline), while most cycles remain product-agnostic.
-- =============================================================================

USE ETRM_DB;
GO

ALTER TABLE dbo.pipeline_cycle ADD product_id INT NULL;   -- NULL = all products
GO
ALTER TABLE dbo.pipeline_cycle
    ADD CONSTRAINT fk_pc_product FOREIGN KEY (product_id) REFERENCES dbo.product(product_id);
GO
CREATE INDEX ix_pc_product ON dbo.pipeline_cycle (product_id);
GO

PRINT '============================================================';
PRINT 'V74 — PIPELINE_CYCLE PRODUCT SCOPE ADDED';
PRINT '  pipeline_cycle.product_id — NEW nullable FK to dbo.product.';
PRINT '  NULL = cycle applies to all products on the pipeline (default,';
PRINT '  matches most real cycles); set = cycle is specific to one product,';
PRINT '  same optional-scope convention as pipeline_tariff.product_id.';
PRINT '============================================================';
GO
