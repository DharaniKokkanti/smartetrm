-- =============================================================================
-- V124 — register dbo.book_level_type in master_data_table_registry
-- =============================================================================
-- V123 added dbo.book_level_type (DESK/STRATEGY/TRADING_BOOK) as a
-- dedicated lookup table, same shape as dbo.book_type (V17) — but never
-- registered it in the Tier 2 generic admin screen the way book_type was.
-- That was a real gap: book_level_type is explicitly meant to be
-- admin-extensible (a real ETRM org's hierarchy is never just three fixed
-- levels — some desks nest a Location or Region above them, some go
-- straight from Desk to Trading Book with no Strategy layer in between).
-- Without this row, growing that set required a direct SQL insert; with it,
-- an admin can add e.g. LOCATION or REGION from /static-data like any other
-- reference table — no schema or code change needed for that part, per the
-- registry's own design note (dbo.master_data_table_registry, V14).
-- =============================================================================

USE ETRM_DB;
GO

INSERT INTO dbo.master_data_table_registry
    (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES
    ('book_level_type', 'Book Level Types', 'Organization & Users', 1, 1, 0, 0, 14, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'V124 APPLIED — dbo.book_level_type registered in';
PRINT '  master_data_table_registry (Organization & Users, order 14).';
PRINT '  Admins can now add/rename hierarchy levels (e.g. LOCATION,';
PRINT '  REGION) from /static-data without a migration.';
PRINT '============================================================';
GO
