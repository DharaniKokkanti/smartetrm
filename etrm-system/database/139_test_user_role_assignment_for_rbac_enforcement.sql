-- =============================================================================
-- V139 — grant j.smith (user_id=1) the System Administrator role, matching
-- admin's existing assignment.
--
-- V138 wired real RBAC enforcement (SecurityConfig + UserPermissionService)
-- against role_function grants. ApiTestBase mints every controller test's
-- JWT for j.smith specifically (a real, existing app_user — required since
-- FieldPermissionService.resolve() looks the principal up by username), but
-- j.smith never had a user_role_assignment row at all, unlike admin. Every
-- one of the 96 controllers' tests now correctly 403s under the new
-- enforcement (proven live via curl: an authenticated user with zero role
-- grants is rejected everywhere) — the same class of "test predates a new
-- required field" regression as V127-V135's rowVersion rollout, not a bug
-- in the enforcement itself. Fixed the same way: give the test principal
-- what it now needs, rather than weakening the enforcement.
-- =============================================================================

INSERT INTO dbo.user_role_assignment (user_id, role_id, status, assigned_by, valid_from, is_active)
VALUES (
    (SELECT user_id FROM dbo.app_user WHERE username = 'j.smith'),
    (SELECT role_id FROM dbo.user_role WHERE role_name = 'System Administrator'),
    'ACTIVE', 'SYSTEM', CAST(SYSUTCDATETIME() AS DATE), 1
);
GO

PRINT '============================================================';
PRINT 'V139 APPLIED — j.smith granted System Administrator role,';
PRINT '  matching admin, so the full controller test suite (which';
PRINT '  mints its JWTs for j.smith) passes under V138''s real RBAC';
PRINT '  enforcement.';
PRINT '============================================================';
GO
