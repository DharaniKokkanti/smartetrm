-- price_index.commodity_id was classification/reporting only, never part of the
-- real resolution chain (period -> market_product_link -> price_index_source -> price_index).
-- Dharani's correction: market_product_link is the master scope for a source mapping,
-- since the same price_index can be fed a different vendor ticker per listing. That
-- belongs on price_index_source, not on price_index itself.
ALTER TABLE dbo.price_index DROP CONSTRAINT fk_pi_commodity;
GO
ALTER TABLE dbo.price_index DROP COLUMN commodity_id;
GO

ALTER TABLE dbo.price_index_source ADD market_product_link_id INT NOT NULL;
GO
ALTER TABLE dbo.price_index_source ADD CONSTRAINT fk_pis_market_product_link
    FOREIGN KEY (market_product_link_id) REFERENCES dbo.market_product_link(market_product_link_id);
GO
