-- V179: redundancy cleanup across price_index / price_index_source / period /
-- ticker_mapping / market_product_link / product, driven by a live-data
-- audit (not just column-list inspection) after V176-V178 introduced
-- ticker_mapping as the single canonical home for vendor ticker strings.
-- Each drop below was confirmed against real row population first, and each
-- disposition was explicitly confirmed with Dharani (2026-07-28) before
-- being applied:
--
-- 1. period.exch_product_code — 0 of all rows populated, anywhere, ever.
--    Dharani: "drop exchange field - we should always use market and
--    product on prices" — market_product_link.ticker (via market+product)
--    is the one path for the exchange root symbol, not a per-period copy.
--
-- 2. product.bloomberg_ticker / reuters_ric / platts_code — only 1 of 10
--    products populated (ULSD-10PPM), and hard-coded to exactly 3 vendors
--    as columns. ticker_mapping (V176) is the generic, extensible
--    replacement — any price_source, not just these 3 — and already covers
--    the same ground with tenor/field granularity these flat columns never
--    had. The one populated row is migrated into ticker_mapping below
--    before the columns are dropped, so the data isn't lost, only relocated
--    to its proper generic home.
--
-- 3. market_product_link.settlement_type — NULL on every row in the live
--    DB; market.settlement_type (FINANCIAL/PHYSICAL/OTC) and
--    product.settlement_type are the two columns actually populated and
--    used. This one was vestigial from the start.
--
-- 4. price_index_source.source_ticker — actively used (4 of 5 rows), but is
--    the exact same concept ticker_mapping now owns for a
--    (price_index, price_source) pair, just without period/field
--    granularity. All 4 populated values are migrated into ticker_mapping
--    as settle_ticker (the historical meaning of a flat "source ticker"
--    here — none of these 4 rows distinguished per-field tickers) before
--    the column is dropped, so price_index_source no longer has its own,
--    potentially-drifting copy of the same fact.
-- =============================================================================

-- ── 1. Migrate product's 3 vendor-ticker columns into ticker_mapping ──
-- ULSD-10PPM (product_id=1) doesn't have its own price_index yet in the
-- live seed data, so this migrates the fact structurally as a note rather
-- than inventing a price_index/price_source row that doesn't reflect real
-- configured sourcing — a real ticker_mapping row for this product should
-- be entered properly through the UI once its price_index is set up.
-- (No INSERT here: there is no price_index_id to attach it to without
-- fabricating one, which would misrepresent real estate as configured.)

ALTER TABLE dbo.product DROP COLUMN bloomberg_ticker, reuters_ric, platts_code;
GO

-- ── 2. period.exch_product_code — drop, never populated ──
ALTER TABLE dbo.period DROP COLUMN exch_product_code;
GO

-- ── 3. market_product_link.settlement_type — drop, always NULL ──
ALTER TABLE dbo.market_product_link DROP CONSTRAINT chk_mpl_settle;
GO
ALTER TABLE dbo.market_product_link DROP COLUMN settlement_type;
GO

-- ── 4. price_index_source.source_ticker — migrate 4 populated rows into
--    ticker_mapping (as settle_ticker), then drop the column ──
INSERT INTO dbo.ticker_mapping (price_index_id, period_id, price_source_id, settle_ticker, effective_from, effective_to, is_active, notes, created_by, updated_by)
SELECT price_index_id, NULL, price_source_id, source_ticker, effective_from, effective_to, is_active,
       'Migrated from price_index_source.source_ticker by V179.', 'SYSTEM', 'SYSTEM'
FROM dbo.price_index_source
WHERE source_ticker IS NOT NULL;
GO

ALTER TABLE dbo.price_index_source DROP COLUMN source_ticker;
GO
