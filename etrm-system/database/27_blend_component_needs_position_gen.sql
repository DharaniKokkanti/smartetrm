-- =============================================================================
-- V27 — Add needs_position_gen to product_blend_component
--
-- When TRUE  : position engine generates individual positions for this component
--              (e.g. you want a separate ULSD position AND a blended B3 position)
-- When FALSE : component is tracked only as part of the parent blended product
--              (e.g. minor additive whose volume is immaterial for a separate book)
-- =============================================================================

ALTER TABLE dbo.product_blend_component
    ADD needs_position_gen BIT NOT NULL DEFAULT 1;
GO

-- Backfill existing rows: default to TRUE (generate positions for all current components)
UPDATE dbo.product_blend_component
    SET needs_position_gen = 1
WHERE needs_position_gen IS NULL;
GO

PRINT 'V27 APPLIED: needs_position_gen added to product_blend_component';
PRINT '  - All existing components defaulted to TRUE (generate positions)';
