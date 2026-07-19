-- =============================================================================
-- V127 — Optimistic locking (row_version): legal_entity, counterparty, book,
-- credit_limit, margin_agreement
--
-- Real gap, confirmed by audit: zero entities anywhere in this backend use
-- JPA optimistic locking (@Version) — every update() method does
-- findById() -> overwrite whatever the client sent -> save(), with no check
-- that the record hasn't changed since the client last read it. Two users
-- editing the same record concurrently, each changing a different field,
-- produces a silent last-write-wins lost update — the second save
-- completely overwrites the first user's change with no error, no warning.
--
-- dbo.legal_entity/dbo.book/dbo.counterparty are SQL Server temporal tables
-- (SYSTEM_VERSIONING = ON, V1/V15) — their _history tables give a full
-- point-in-time audit trail of every past state, which is a genuinely
-- different, complementary concern: history answers "what did this look
-- like last Tuesday", not "did someone else change this in the last 10
-- seconds while I was editing it". Confirmed no application code reads
-- _history for conflict purposes today — it's a write-only audit trail.
--
-- This migration adds a plain, Hibernate-managed row_version INT column to
-- the 5 highest-touch master data entities (a deliberately scoped first
-- pass, not a schema-wide rollout — see the handoff doc for the remaining
-- entity list). Each dbo.<table>.row_version starts at 0; Hibernate's
-- @Version annotation increments it on every UPDATE and includes
-- `WHERE row_version = ?` in the SQL, so a stale write (someone else's
-- update already bumped the value) matches zero rows and throws
-- ObjectOptimisticLockingFailureException instead of silently succeeding.
--
-- Deliberately a plain app-managed INT, not SQL Server's native ROWVERSION/
-- TIMESTAMP binary type — a plain incrementing integer is portable,
-- human-readable in API responses/logs, and is the standard, most common
-- Hibernate @Version pattern; the DB-native binary token would need
-- base64/byte[] handling round-tripped through the frontend for no real
-- benefit here.
--
-- Single-statement ADD COLUMN ... NOT NULL DEFAULT — safe on a temporal
-- table (same pattern already used for book.archived_reason/book.book_role
-- in V119/V122, which back-fills _history automatically for this form; a
-- two-step nullable-then-ALTER-NOT-NULL would fail on a temporal table
-- once _history holds NULLs, per that session's own documented gotcha —
-- not applicable here since we go straight to NOT NULL DEFAULT in one shot).
-- =============================================================================

ALTER TABLE dbo.legal_entity     ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.counterparty     ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.book             ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.credit_limit     ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.margin_agreement ADD row_version INT NOT NULL DEFAULT 0;
GO

PRINT '============================================================';
PRINT 'V127 APPLIED — row_version added to legal_entity, counterparty,';
PRINT '  book, credit_limit, margin_agreement. Optimistic locking is';
PRINT '  now enforced on these 5 entities — a concurrent stale update';
PRINT '  returns 409 instead of silently overwriting another user''s';
PRINT '  change. Remaining ~148 master data entities are unprotected;';
PRINT '  see the handoff doc for the planned rollout order.';
PRINT '============================================================';
GO
