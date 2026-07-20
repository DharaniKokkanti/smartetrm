-- =============================================================================
-- V138 — RBAC enforcement rollout: add the missing ROLE_VIEW function code.
--
-- Wiring real authorization enforcement against the existing app_function/
-- role_function/user_role_assignment tables (see SecurityConfig.java) found
-- one real gap in the function catalog itself: every module has a "_VIEW"
-- code except Administration's role-management functions (ROLE_CREATE/
-- ROLE_EDIT/ROLE_APPROVE/ROLE_ASSIGN exist, but nothing gates a plain read
-- of /roles, /role-assignments, /app-modules, /app-functions, /permissions).
-- Adding ROLE_VIEW closes that gap the same way USER_VIEW already covers
-- GET /admin/users. Granted to System Administrator only, matching that
-- role's existing full grant on every other ROLE_* function — no other
-- seeded role has any ROLE_* grant at all today, so nobody else is affected.
-- =============================================================================

INSERT INTO dbo.app_function (module_id, function_code, function_name, sort_order, is_active)
VALUES (
    (SELECT module_id FROM dbo.app_module WHERE module_name = 'Administration'),
    'ROLE_VIEW', 'View Roles', 0, 1
);
GO

INSERT INTO dbo.role_function (role_id, function_id, access_level)
VALUES (
    (SELECT role_id FROM dbo.user_role WHERE role_name = 'System Administrator'),
    (SELECT function_id FROM dbo.app_function WHERE function_code = 'ROLE_VIEW'),
    'READ_WRITE'
);
GO

PRINT '============================================================';
PRINT 'V138 APPLIED — added ROLE_VIEW function code (Administration';
PRINT '  module), granted to System Administrator. Closes the last';
PRINT '  gap in the function catalog needed for full RBAC enforcement.';
PRINT '============================================================';
GO
