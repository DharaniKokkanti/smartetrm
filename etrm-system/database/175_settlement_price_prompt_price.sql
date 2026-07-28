-- V175: settlement_price gains prompt_price — some vendors publish a
-- distinct "prompt" price (e.g. UK NBP within-day/day-ahead prompt gas)
-- separate from the settle/open/high/low/avg values added in V174. Kept as
-- its own nullable column rather than folded into any of those, since it's
-- a genuinely different published number, not a synonym for one of them.

ALTER TABLE dbo.settlement_price ADD
    prompt_price DECIMAL(18,6) NULL;
GO
