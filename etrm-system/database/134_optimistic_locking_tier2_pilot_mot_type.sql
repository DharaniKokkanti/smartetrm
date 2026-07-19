-- =============================================================================
-- V134 — Optimistic locking, Tier2-generic-CRUD pilot: mot_type
--
-- V133's handoff-doc entry found that ~36 remaining unprotected entities
-- (this one included) are managed exclusively through the generic Tier2 CRUD
-- engine (ReferenceDataCrudService), which writes via raw JdbcTemplate SQL
-- and bypasses Hibernate/JPA entirely — so a JPA @Version annotation would
-- never actually be checked. ReferenceDataCrudService.updateRow() was
-- extended (same commit) to run a generic version check whenever a table's
-- metadata (introspected live from SQL Server, not hardcoded) includes a
-- row_version column: SET row_version = row_version + 1 ... WHERE row_version
-- = <client's value>, with 0-rows-affected disambiguated into a 409 (stale
-- version) vs 404 (row genuinely gone).
--
-- This migration is a deliberate single-table pilot — mot_type chosen for
-- being simple and low-traffic — to prove the generic engine's version
-- check end-to-end (schema + engine + live curl) before rolling the same
-- ALTER TABLE out to the remaining ~35 Tier2-managed tables.
-- =============================================================================

ALTER TABLE dbo.mot_type ADD row_version INT NOT NULL DEFAULT 0;
GO

PRINT '============================================================';
PRINT 'V134 APPLIED — row_version added to mot_type (Tier2-generic-';
PRINT '  CRUD pilot). ReferenceDataCrudService.updateRow() now';
PRINT '  enforces optimistic locking on this table generically.';
PRINT '============================================================';
GO
