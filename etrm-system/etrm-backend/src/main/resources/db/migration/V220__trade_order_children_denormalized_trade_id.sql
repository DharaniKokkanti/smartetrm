-- V220: every table one level under trade_order only carried order_id, not
-- trade_id -- forcing a two-hop join (child -> trade_order -> trade) for any
-- trade-level query (cancel/amend, audit, regulatory reporting, risk/P&L
-- aggregation). Real ETRM systems denormalize the top-level deal/trade key
-- down through every leaf table for exactly this reason -- flagged by
-- Dharani while reviewing trade_item 2026-08-13.
--
-- trade_id is set once at insert (an order/item never moves to a different
-- trade after creation) and never updated after -- order_id/order_sequence
-- remain the real parent link and still drive item_sequence numbering; this
-- is additive, not a replacement of that hierarchy.
--
-- All 7 tables have 0 rows, so trade_id is added and flipped to NOT NULL in
-- the same migration, no backfill needed.

USE ETRM_DB;
GO

ALTER TABLE dbo.trade_item ADD trade_id INT NULL;
GO
ALTER TABLE dbo.trade_order_cost ADD trade_id INT NULL;
GO
ALTER TABLE dbo.trade_order_price_adjustment ADD trade_id INT NULL;
GO
ALTER TABLE dbo.trade_order_assay_result ADD trade_id INT NULL;
GO
ALTER TABLE dbo.trade_order_balmo ADD trade_id INT NULL;
GO
ALTER TABLE dbo.trade_order_tas ADD trade_id INT NULL;
GO
ALTER TABLE dbo.trade_order_custom_field_value ADD trade_id INT NULL;
GO

ALTER TABLE dbo.trade_item WITH CHECK ADD CONSTRAINT fk_trade_item_trade FOREIGN KEY (trade_id) REFERENCES dbo.trade(trade_id);
GO
ALTER TABLE dbo.trade_order_cost WITH CHECK ADD CONSTRAINT fk_trade_order_cost_trade FOREIGN KEY (trade_id) REFERENCES dbo.trade(trade_id);
GO
ALTER TABLE dbo.trade_order_price_adjustment WITH CHECK ADD CONSTRAINT fk_trade_order_price_adjustment_trade FOREIGN KEY (trade_id) REFERENCES dbo.trade(trade_id);
GO
ALTER TABLE dbo.trade_order_assay_result WITH CHECK ADD CONSTRAINT fk_trade_order_assay_result_trade FOREIGN KEY (trade_id) REFERENCES dbo.trade(trade_id);
GO
ALTER TABLE dbo.trade_order_balmo WITH CHECK ADD CONSTRAINT fk_trade_order_balmo_trade FOREIGN KEY (trade_id) REFERENCES dbo.trade(trade_id);
GO
ALTER TABLE dbo.trade_order_tas WITH CHECK ADD CONSTRAINT fk_trade_order_tas_trade FOREIGN KEY (trade_id) REFERENCES dbo.trade(trade_id);
GO
ALTER TABLE dbo.trade_order_custom_field_value WITH CHECK ADD CONSTRAINT fk_trade_order_custom_field_value_trade FOREIGN KEY (trade_id) REFERENCES dbo.trade(trade_id);
GO

-- SQL Server rejects ALTER COLUMN on a column a non-clustered index depends
-- on, so the NOT NULL flip must happen before the index is created, not after.

ALTER TABLE dbo.trade_item ALTER COLUMN trade_id INT NOT NULL;
GO
ALTER TABLE dbo.trade_order_cost ALTER COLUMN trade_id INT NOT NULL;
GO
ALTER TABLE dbo.trade_order_price_adjustment ALTER COLUMN trade_id INT NOT NULL;
GO
ALTER TABLE dbo.trade_order_assay_result ALTER COLUMN trade_id INT NOT NULL;
GO
ALTER TABLE dbo.trade_order_balmo ALTER COLUMN trade_id INT NOT NULL;
GO
ALTER TABLE dbo.trade_order_tas ALTER COLUMN trade_id INT NOT NULL;
GO
ALTER TABLE dbo.trade_order_custom_field_value ALTER COLUMN trade_id INT NOT NULL;
GO

CREATE INDEX ix_trade_item_trade_id ON dbo.trade_item(trade_id);
GO
CREATE INDEX ix_trade_order_cost_trade_id ON dbo.trade_order_cost(trade_id);
GO
CREATE INDEX ix_trade_order_price_adjustment_trade_id ON dbo.trade_order_price_adjustment(trade_id);
GO
CREATE INDEX ix_trade_order_assay_result_trade_id ON dbo.trade_order_assay_result(trade_id);
GO
CREATE INDEX ix_trade_order_balmo_trade_id ON dbo.trade_order_balmo(trade_id);
GO
CREATE INDEX ix_trade_order_tas_trade_id ON dbo.trade_order_tas(trade_id);
GO
CREATE INDEX ix_trade_order_custom_field_value_trade_id ON dbo.trade_order_custom_field_value(trade_id);
GO
