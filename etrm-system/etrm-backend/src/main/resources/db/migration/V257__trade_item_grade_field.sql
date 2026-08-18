-- V257: free-text grade field at trade_item level, per Dharani's direct
-- instruction. Not the same as the existing GradeDeliveredSelect mechanism
-- (which picks a ref_product_grade_standard row and auto-fills a price
-- adjustment on tran_trade_order_price_adjustment) -- that stays as-is,
-- unrelated. This is a plain manually-typed field, scoped to trade_item
-- because grade can differ per item within the same leg/order.

USE ETRM_DB;
GO

ALTER TABLE dbo.tran_trade_item
    ADD grade VARCHAR(50) NULL;
GO
