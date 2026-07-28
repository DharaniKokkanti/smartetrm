-- V173: price_index_source sourcing model cleanup
--
-- 1) uq_pis was (price_index_id, price_source_id, source_role) - missing
--    market_product_link_id. That meant the same vendor+role could only feed
--    a given index ONCE globally, blocking the legitimate case of e.g. Platts
--    PRIMARY_MTM feeding Dated Brent at both an ICE futures listing and a
--    separate OTC listing with a different ticker. Widen to include the
--    listing so the same vendor+role can be reused per listing.
--
-- 2) market_product_link.alt_price_source_id / mtm_price_source_id (added
--    V164) predate price_index_source.market_product_link_id (V172) and
--    duplicate the same "what prices this listing" question with none of
--    price_index_source's richness (ticker, multiplier, offset, effective
--    dates, failover ordering via calculation_sequence). Dropped in favor of
--    price_index_source as the single sourcing mechanism.

ALTER TABLE dbo.price_index_source DROP CONSTRAINT uq_pis;
GO
ALTER TABLE dbo.price_index_source ADD CONSTRAINT uq_pis
    UNIQUE (price_index_id, market_product_link_id, price_source_id, source_role);
GO

ALTER TABLE dbo.market_product_link DROP CONSTRAINT fk_mpl_alt_price_source;
GO
ALTER TABLE dbo.market_product_link DROP CONSTRAINT fk_mpl_mtm_price_source;
GO
ALTER TABLE dbo.market_product_link DROP COLUMN alt_price_source_id, mtm_price_source_id;
GO
