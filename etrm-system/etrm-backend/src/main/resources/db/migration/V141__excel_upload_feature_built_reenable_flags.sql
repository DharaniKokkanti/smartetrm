-- =============================================================================
-- V141 — Excel bulk-upload built for the generic Tier2 grid (ReferenceDataTable
-- + new ExcelUploadModal/excelUpload.ts): download-template / parse-and-
-- validate / import-valid-rows-via-the-existing-create-endpoint, driven
-- entirely by a table's own live column metadata (no per-table code).
--
-- V140 flipped allow_excel_upload to 0 for currency/fx_period/fx_rate because
-- no such feature existed yet — correcting metadata to match reality at the
-- time. Now that the feature is real, restore the flag for those three.
-- =============================================================================

UPDATE dbo.master_data_table_registry
SET allow_excel_upload = 1
WHERE table_name IN ('currency', 'fx_period', 'fx_rate');
GO

PRINT '============================================================';
PRINT 'V141 APPLIED — allow_excel_upload restored for currency/';
PRINT '  fx_period/fx_rate now that a real generic bulk-upload';
PRINT '  feature exists in the Tier2 grid.';
PRINT '============================================================';
GO
