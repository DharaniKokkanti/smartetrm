USE ETRM_DB;
GO

-- contract_uom_id's only purpose was describing contract_size ("UOM for
-- contract size"), which V165 already dropped as redundant with
-- market_product_link.lot_size (scoped per listing) / derivative_contract_specification
-- (scoped per instrument). Left orphaned by that migration -- dropping now.
ALTER TABLE dbo.market DROP CONSTRAINT fk_mkt_uom;
GO
ALTER TABLE dbo.market DROP COLUMN contract_uom_id;
GO
