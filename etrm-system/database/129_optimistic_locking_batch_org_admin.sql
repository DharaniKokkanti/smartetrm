-- =============================================================================
-- V129 — Optimistic locking (row_version), Batch B: Org/Reference/Admin
--
-- Second wave of the rollout started in V127 (legal_entity, counterparty,
-- book, credit_limit, margin_agreement) — same pattern, same rationale, see
-- V127's migration header for the full writeup. This batch covers the
-- org/reference/admin domain: app users, trader records, book-level
-- membership/classification/ownership child tables, field-permission
-- profiles/rules, object lock rules, GTC master agreements + their current
-- version row, and role assignments — all records real users edit directly
-- and where a concurrent stale overwrite would silently lose someone's
-- change today.
--
-- Same shape as V127: plain Hibernate-managed row_version INT, starts at 0,
-- single-statement ADD COLUMN ... NOT NULL DEFAULT.
-- =============================================================================

ALTER TABLE dbo.app_user                     ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.trader                       ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.book_access_grant            ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.book_classification          ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.book_classification_dimension ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.book_eod_status              ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.book_ownership               ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.book_trader                  ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.field_permission_profile     ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.field_permission_rule        ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.object_lock_rule             ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.gtc                          ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.gtc_version                  ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.user_role_assignment         ADD row_version INT NOT NULL DEFAULT 0;
GO

PRINT '============================================================';
PRINT 'V129 APPLIED — row_version added to 14 org/admin domain';
PRINT '  tables (Batch B of the post-V127 rollout). See handoff doc';
PRINT '  for the full batch plan (V128-V132).';
PRINT '============================================================';
GO
