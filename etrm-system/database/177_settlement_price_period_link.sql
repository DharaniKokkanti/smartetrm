-- V177: settlement_price gains period_id — closes the curve-assembly gap.
--
-- Before this, a settlement_price row for an index fixing only carried
-- price_index_id (which index) — it had no way to say which specific
-- delivery period/tenor point the price belongs to. period.price_index_id
-- (added V170) already lets a period point back at the index series that
-- prices it, but nothing on the price row itself pointed the other way, so
-- "NYMEX_WTI forward curve: Mar-27 = X, Apr-27 = Y" couldn't be assembled
-- from stored prices without inferring the period from contract_ticker text.
--
-- Nullable and independent of chk_sp_identity's two-path rule (futures
-- ticker+exchange, or index fixing) — it's supplementary tenor context on
-- whichever identity path is populated, not a third path. A spot/prompt
-- fixing with no fixed forward tenor legitimately leaves it null.

ALTER TABLE dbo.settlement_price ADD period_id BIGINT NULL;
GO

ALTER TABLE dbo.settlement_price ADD CONSTRAINT fk_settlement_price_period
    FOREIGN KEY (period_id) REFERENCES dbo.period (period_id);
GO

CREATE INDEX ix_settlement_price_period ON dbo.settlement_price (period_id);
GO
