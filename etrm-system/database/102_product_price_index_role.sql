-- =============================================================================
-- V102 — dbo.product_price_index: add role
-- =============================================================================
-- Found while building the Product price-index sub-resource. The frontend's
-- ProductPriceIndex type already has a `role` field (PRIMARY_MTM/
-- SETTLEMENT/BACKUP/REFERENCE — mirrors market_product_source.source_role's
-- existing convention), but dbo.product_price_index never had a column for
-- it — only product_index_id/product_id/price_index_id/is_primary/is_active.
-- Small, well-justified addition per this session's standing rule.
-- =============================================================================

ALTER TABLE dbo.product_price_index ADD role VARCHAR(20) NOT NULL
    CONSTRAINT df_ppi_role DEFAULT 'REFERENCE'
    CONSTRAINT chk_ppi_role CHECK (role IN ('PRIMARY_MTM','SETTLEMENT','BACKUP','REFERENCE'));
GO

PRINT '============================================================';
PRINT 'V102 — PRODUCT_PRICE_INDEX: +role';
PRINT '============================================================';
GO
