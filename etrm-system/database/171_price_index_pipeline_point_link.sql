-- =============================================================================
-- V171 — dbo.price_index +pipeline_point_id, the gas-side counterpart to
-- +pnode_id (V168). Gas daily/monthly index prices (e.g. a "Gas Daily"
-- assessment or an Inside FERC index) are frequently location-specific —
-- tied to a named pipeline receipt/delivery point (Henry Hub, Waha, AECO) —
-- the same relationship power indices have to a settlement node. The
-- location reference already existed (dbo.pipeline_point, from the pipeline
-- schema) but nothing on price_index pointed at it. Nullable — only
-- location-specific gas indices populate this; a flat national/regional
-- index (e.g. Henry Hub itself if modeled without a physical point) leaves
-- it null, same as pnode_id is null for non-power indices.
-- =============================================================================

ALTER TABLE dbo.price_index ADD pipeline_point_id INT NULL;
GO
ALTER TABLE dbo.price_index ADD CONSTRAINT fk_pi_pipeline_point FOREIGN KEY (pipeline_point_id) REFERENCES dbo.pipeline_point(point_id);
GO

PRINT '============================================================';
PRINT 'V171 — price_index: +pipeline_point_id (FK to pipeline_point),';
PRINT '       gas-location counterpart to pnode_id.';
PRINT '============================================================';
GO
