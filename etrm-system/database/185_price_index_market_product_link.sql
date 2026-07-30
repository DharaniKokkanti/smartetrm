-- V185: dbo.price_index gains a direct market_product_link_id FK
--
-- Reviewed 2026-07-29/30 as part of closing the open design question from
-- V172/V173 (should price_index carry a direct listing FK, or stay
-- listing-agnostic). Live evidence: of 14 real price_index rows, only
-- DTBRT (Dated Brent) is fed from more than one listing (ICE_BRENT
-- PRIMARY_MTM/BACKUP/REFERENCE, plus ICAP_BRENT_OTC REFERENCE) — a single
-- edge case, not a load-bearing reuse requirement.
--
-- Dharani's call: link it anyway. The point of price_index is to be
-- directly pickable for index price / differential price / formula setup
-- without a detour through price_index_source — that usability need
-- outweighs the one dual-sourced edge case. Nullable, not required:
--   - populated from each index's PRIMARY_MTM (or, absent that, its only)
--     price_index_source listing
--   - for DTBRT specifically: set to its PRIMARY_MTM listing (ICE_BRENT);
--     the secondary ICAP_BRENT_OTC/REFERENCE listing stays fully
--     represented in price_index_source, nothing is lost
--   - indices with no listing yet (e.g. the CAISO test rows) stay NULL
-- price_index_source remains the authoritative multi-vendor/multi-listing
-- sourcing map; this FK is an additive quick-pick convenience, not a
-- replacement.

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.price_index') AND name = 'market_product_link_id')
BEGIN
    ALTER TABLE dbo.price_index ADD market_product_link_id INT NULL;
    ALTER TABLE dbo.price_index ADD CONSTRAINT fk_price_index_mpl
        FOREIGN KEY (market_product_link_id) REFERENCES dbo.market_product_link(market_product_link_id);
    CREATE INDEX ix_price_index_mpl ON dbo.price_index (market_product_link_id);
END
GO

;WITH primary_listing AS (
    SELECT pis.price_index_id, pis.market_product_link_id,
           ROW_NUMBER() OVER (
               PARTITION BY pis.price_index_id
               ORDER BY CASE pis.source_role WHEN 'PRIMARY_MTM' THEN 0 ELSE 1 END, pis.pis_id
           ) AS rn
    FROM dbo.price_index_source pis
)
UPDATE pi
    SET pi.market_product_link_id = pl.market_product_link_id,
        pi.row_version = pi.row_version + 1
FROM dbo.price_index pi
JOIN primary_listing pl ON pl.price_index_id = pi.price_index_id AND pl.rn = 1
WHERE pi.market_product_link_id IS NULL;

PRINT 'V185: price_index.market_product_link_id added, backfilled from each index''s primary listing.';
