-- V181: settlement_price.mid_price dropped — it's fully determined by
-- bid_price/ask_price (mid = (bid + ask) / 2), so storing it as its own
-- column risked the two disagreeing on one row with no constraint to catch
-- it. Dharani's call (2026-07-28), after reviewing which of the V178
-- bid/ask/mid fields were genuinely independent data vs. derivable: bid and
-- ask are real, independently-sourced quotes (LME official bid/offer,
-- OTC/broker quotes); mid is arithmetic on the other two and belongs
-- computed on read, not persisted. See SettlementPrice.java's getMidPrice()
-- for the computed replacement.

ALTER TABLE dbo.settlement_price DROP COLUMN mid_price;
GO
