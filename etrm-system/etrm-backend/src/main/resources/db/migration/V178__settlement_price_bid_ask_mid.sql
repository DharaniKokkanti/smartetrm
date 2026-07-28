-- V178: settlement_price gains bid_price/ask_price/mid_price — OTC/broker
-- quote support, alongside the existing settle/open/high/low/avg/prompt
-- fields (V174/V175). Exchange-cleared settle prices don't have a bid/ask
-- (one official settle value per day); OTC/broker-quoted marks often do, and
-- until now there was nowhere to store one on this row.
--
-- All three nullable on the same row — same "additive context, not a
-- separate kind axis" pattern as V174 (price_kind was deliberately dropped
-- in V170 as a redundant discriminator; this doesn't reintroduce it).

ALTER TABLE dbo.settlement_price ADD
    bid_price  DECIMAL(18,6) NULL,
    ask_price  DECIMAL(18,6) NULL,
    mid_price  DECIMAL(18,6) NULL;
GO

ALTER TABLE dbo.settlement_price ADD CONSTRAINT chk_sp_bid_ask_range
    CHECK (bid_price IS NULL OR ask_price IS NULL OR ask_price >= bid_price);
GO
