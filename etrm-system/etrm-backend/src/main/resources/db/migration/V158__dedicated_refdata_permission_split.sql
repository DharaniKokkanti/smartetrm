-- =============================================================================
-- V158 — split dedicated reference-data write permission off the broad
-- MD_CREATE / MD_EDIT / MD_DELETE grant
--
-- exchange, holiday_calendar, payment_term, country, and unit_of_measure are
-- each served by their own dedicated Tier 1 controller (ExchangeController,
-- HolidayCalendarController, PaymentTermController, CountryController,
-- UnitOfMeasureController), not the generic Tier 2 ReferenceDataController —
-- so V157's master_data_table_registry lock-down never reached them (that
-- flag only governs the generic grid). Until now their writes were gated by
-- the same broad PERM_MD_CREATE_WRITE / PERM_MD_EDIT_WRITE /
-- PERM_MD_DELETE_WRITE authorities used for legal entities, books, vessels,
-- etc. — anyone with that broad grant (ADMIN and OPERATIONS today) could
-- rename/mutate seeded reference rows like 'NYMEX_WTI' or ISO country codes.
--
-- Adds three new function codes under the existing MASTER_DATA module,
-- mirroring MD_CREATE/MD_EDIT/MD_DELETE's per-verb split rather than one
-- combined code, and grants them to ADMIN only (confirmed with user
-- 2026-07-25) — OPERATIONS keeps write on every other master-data table via
-- its existing MD_CREATE/MD_EDIT/MD_DELETE grant, but loses write on these 5
-- structural/reference tables specifically. View is unaffected — these 5
-- stay on the existing PERM_MD_VIEW authority.
--
-- SecurityConfig.java is updated in the same change to route these 5
-- controllers' POST/PUT/PATCH/DELETE paths onto the new authorities instead
-- of the broad PERM_MD_*_WRITE ones. See docs/masterdata_pending_project_01.md.
-- =============================================================================

USE ETRM_DB;
GO

DECLARE @md INT = (SELECT module_id FROM dbo.app_module WHERE module_code = 'MASTER_DATA');

INSERT INTO dbo.app_function (module_id, function_code, function_name, description, sort_order, is_active)
VALUES
    (@md, 'MD_REFDATA_CREATE', 'Create Reference Data', 'Create rows in dedicated structural/reference tables (exchange, holiday_calendar, payment_term, country, unit_of_measure)', 10, 1),
    (@md, 'MD_REFDATA_EDIT',   'Edit Reference Data',   'Edit rows in dedicated structural/reference tables (exchange, holiday_calendar, payment_term, country, unit_of_measure)', 11, 1),
    (@md, 'MD_REFDATA_DELETE', 'Delete Reference Data', 'Delete rows in dedicated structural/reference tables (exchange, holiday_calendar, payment_term, country, unit_of_measure)', 12, 1);
GO

INSERT INTO dbo.role_function (role_id, function_id, access_level)
SELECT r.role_id, f.function_id, 'READ_WRITE'
FROM dbo.user_role r
CROSS JOIN dbo.app_function f
WHERE r.role_code = 'ADMIN'
  AND f.function_code IN ('MD_REFDATA_CREATE', 'MD_REFDATA_EDIT', 'MD_REFDATA_DELETE');
GO

PRINT '============================================================';
PRINT 'V158 APPLIED — added MD_REFDATA_CREATE/EDIT/DELETE function';
PRINT '  codes, granted to ADMIN only. OPERATIONS no longer has';
PRINT '  write access to exchange/holiday_calendar/payment_term/';
PRINT '  country/unit_of_measure once SecurityConfig.java is updated.';
PRINT '============================================================';
GO
