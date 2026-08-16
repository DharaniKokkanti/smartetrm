-- V251: drop mst_commodity.commodity_subtype (Dharani: "not needed"). Added
-- in V23 with a broad CHECK-constrained value list, but only 5 of ~19
-- allowed values were ever actually populated (CRUDE, ELECTRICITY,
-- PIPELINE_GAS, GRAINS, BASE_METAL — one per existing commodity row) and
-- the concept was never wired into any Java entity or live frontend field;
-- the frontend's own mock metadata already treated it as removed back in
-- V58/V59 ("these were never real SQL columns... frontend-only mock
-- additions" -- that comment was wrong about the real schema, but right
-- that nothing reads this column today).

USE ETRM_DB;
GO

ALTER TABLE dbo.mst_commodity DROP CONSTRAINT chk_commodity_subtype;
GO

ALTER TABLE dbo.mst_commodity DROP COLUMN commodity_subtype;
GO
