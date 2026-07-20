-- =============================================================================
-- V140 — two smaller master-data governance fixes flagged in the same
-- 2026-07-20 audit as V136-V139:
--
-- 1. 6 registered tables had allow_delete=1 in master_data_table_registry
--    but no is_active column, so the Delete/Deactivate button the Static
--    Data grid shows for them always failed with a 403 (confirmed live:
--    "\"fx_rate\" has no active/inactive flag, so rows cannot be
--    deactivated or deleted."). Fixed the real way — add the column,
--    matching every other reference table's shape — rather than just
--    hiding the button by flipping allow_delete to 0.
-- 2. currency/fx_period/fx_rate had allow_excel_upload=1 in the registry
--    but the generic Tier2 grid (ReferenceDataTable.tsx) has no Excel
--    upload feature at all — confirmed via grep, zero references to that
--    flag anywhere in the frontend. That's a registry metadata promise
--    the code never delivers on (same class of gap as the previously-
--    documented PaymentMethod/Incoterm create()-500 bug). Correcting the
--    metadata to match reality — building a real generic bulk-upload
--    feature for the Tier2 grid is separate, larger future work, out of
--    scope for a governance-audit fix.
-- =============================================================================

ALTER TABLE dbo.blend_recipe_component ADD is_active BIT NOT NULL DEFAULT 1;
GO
ALTER TABLE dbo.fx_rate                ADD is_active BIT NOT NULL DEFAULT 1;
GO
ALTER TABLE dbo.lng_terminal_detail    ADD is_active BIT NOT NULL DEFAULT 1;
GO
ALTER TABLE dbo.load_shape_component   ADD is_active BIT NOT NULL DEFAULT 1;
GO
ALTER TABLE dbo.load_shape_interval    ADD is_active BIT NOT NULL DEFAULT 1;
GO
ALTER TABLE dbo.power_product_detail   ADD is_active BIT NOT NULL DEFAULT 1;
GO

UPDATE dbo.master_data_table_registry
SET allow_excel_upload = 0
WHERE table_name IN ('currency', 'fx_period', 'fx_rate');
GO

PRINT '============================================================';
PRINT 'V140 APPLIED — is_active added to 6 tables whose registry';
PRINT '  allow_delete=1 flag had no column to back it; allow_excel_';
PRINT '  upload corrected to 0 for 3 tables where no such feature';
PRINT '  actually exists in the frontend.';
PRINT '============================================================';
GO
