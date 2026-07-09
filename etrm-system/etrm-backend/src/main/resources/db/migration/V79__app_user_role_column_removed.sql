-- =============================================================================
-- V79 — dbo.app_user: drop the vestigial flat `role` column
-- =============================================================================
-- V21 bolted `role VARCHAR(30)` directly onto app_user, right after V20 had
-- already built the real RBAC tables (user_role / role_function /
-- user_role_assignment) — a second, disconnected role concept with no FK, no
-- CHECK constraint, and no relationship to user_role_assignment at all.
-- SystemUserController read/wrote it directly, completely bypassing
-- role_function grants and the assignment approval workflow. Found while
-- fixing the identical bug in the frontend mock (SystemUser.role /
-- USER_ROLES, fixed the same session) and checking whether the real backend
-- had the same problem — it did.
--
-- Not a live security hole today: AuthController never reads app_user.role
-- for authorization (every login gets a flat ROLE_USER; see its own comment
-- that real RBAC "waits on the separate role table"). But it's a second
-- source of truth for the same concept, so it goes.
--
-- A user's real role(s) live entirely in user_role_assignment — and a user
-- can hold more than one (its uniqueness constraint is (user_id, role_id),
-- not user_id alone).
-- =============================================================================

-- Backfill: any existing app_user row carrying the old free-text role='ADMIN'
-- (the only value V21 ever actually seeded) gets a real ACTIVE
-- user_role_assignment for the ADMIN system role, if it doesn't already have
-- one — migrate the data forward before dropping its old home.
INSERT INTO dbo.user_role_assignment (user_id, role_id, status, assigned_by, approved_by, approved_at, valid_from)
SELECT u.user_id, r.role_id, 'ACTIVE', 'SYSTEM', 'SYSTEM', SYSDATETIME(), CAST(SYSDATETIME() AS DATE)
FROM dbo.app_user u
JOIN dbo.user_role r ON r.role_code = 'ADMIN'
WHERE u.role = 'ADMIN'
  AND NOT EXISTS (
      SELECT 1 FROM dbo.user_role_assignment a
      WHERE a.user_id = u.user_id AND a.role_id = r.role_id
  );
GO

ALTER TABLE dbo.app_user DROP COLUMN role;
GO
