-- =============================================================================
-- V64 — dbo.product_reporting_group: enforce one reporting_group per
-- classification axis per product
-- =============================================================================
-- Bug found: V60's UNIQUE(product_id, reporting_group_id) only stops the same
-- *group* being attached twice — it does nothing to stop a product being
-- assigned two different POSITION groups (or two VAR groups) at once, which
-- is meaningless: a product must sit in exactly one bucket per axis (one
-- Position group, one VaR group, one Settlement group). V60's own comment
-- said the UI "enforces one active selection per axis in practice", but the
-- UI never actually did this — this migration closes the DB-level gap and
-- the frontend fix (ProductsPage.tsx + etrmHandlers.ts mock) closes the UI
-- gap so it's enforced at assignment time, not just documented as intent.
--
-- classification_type_id is denormalized onto product_reporting_group
-- (sourced from reporting_group.classification_type_id, V63) so the
-- uniqueness constraint can reference it directly without a subquery-based
-- check constraint (SQL Server doesn't support those against other tables).
-- =============================================================================

USE ETRM_DB;
GO

ALTER TABLE dbo.product_reporting_group ADD classification_type_id INT NULL;
GO

UPDATE prg
SET    prg.classification_type_id = rg.classification_type_id
FROM   dbo.product_reporting_group prg
JOIN   dbo.reporting_group rg ON rg.reporting_group_id = prg.reporting_group_id;
GO

ALTER TABLE dbo.product_reporting_group ALTER COLUMN classification_type_id INT NOT NULL;
GO
ALTER TABLE dbo.product_reporting_group
    ADD CONSTRAINT fk_prg_classification_type FOREIGN KEY (classification_type_id) REFERENCES dbo.lookup_value(lookup_id);
GO

ALTER TABLE dbo.product_reporting_group
    ADD CONSTRAINT uq_prg_product_classification UNIQUE (product_id, classification_type_id);
GO

PRINT '============================================================';
PRINT 'V64 — PRODUCT_REPORTING_GROUP ONE-PER-CLASSIFICATION APPLIED';
PRINT '  product_reporting_group.classification_type_id — NEW column, backfilled from reporting_group.';
PRINT '  uq_prg_product_classification — NEW constraint: a product can have only one reporting_group per classification axis.';
PRINT '============================================================';
GO
