-- V195: dbo.source_system gets an eighth row, TIER1_APPLICATION_SCREEN --
-- the interim default for JPA-backed Tier1 dedicated modules (counterparty,
-- legal_entity, broker, bank_guarantee, etc.), same role STATIC_DATA_ADMIN
-- (V192) plays for the generic Tier2 engine.
--
-- Urgent context: V194's Tier2 rollout added created_source_system_id/
-- updated_source_system_id (NOT NULL, no default) to every registered
-- table, including the ~155 that are also backed by a real JPA entity, not
-- just the ~140 pure-Tier2 ones. Those entities don't map the new columns,
-- so Hibernate's generated INSERT/UPDATE omits them entirely -- every
-- create/update through a Tier1 dedicated endpoint started failing with a
-- NOT NULL violation the moment V194 landed (confirmed live 2026-08-07,
-- POST /api/v1/brokers -> 409 "created_source_system_id is required").
-- This row is step 1 of the fix; step 2 is mapping the columns in Java
-- (AuditableEntity covers ~42 entities that extend it in one shot; the
-- remaining ~113 non-AuditableEntity entities need the same treatment
-- individually -- see the handoff doc's Phase 2 Tier1 rollout plan).

USE ETRM_DB;
GO

-- dbo.source_system is itself registered in master_data_table_registry, so
-- V194's Tier2 rollout already added created_source_system_id/
-- updated_source_system_id (NOT NULL) to it too -- this INSERT must supply
-- them explicitly (self-referencing to SYSTEM_MIGRATION, same as V192's
-- original 7 rows were backfilled to after the fact) or it 515s (hit live
-- 2026-08-07).
INSERT INTO dbo.source_system (source_code, source_name, category, description, sort_order, created_source_system_id, updated_source_system_id, created_by, updated_by)
SELECT 'TIER1_APPLICATION_SCREEN', 'Tier1 Application Screen', 'UI_SCREEN',
       'Interim bucket for JPA-backed dedicated module screens (counterparty, legal_entity, broker, bank_guarantee, etc.) until each module gets its own dedicated source row -- same role STATIC_DATA_ADMIN plays for the generic Tier2 engine.',
       8, ss.source_system_id, ss.source_system_id, 'SYSTEM', 'SYSTEM'
FROM dbo.source_system ss
WHERE ss.source_code = 'SYSTEM_MIGRATION'
  AND NOT EXISTS (SELECT 1 FROM dbo.source_system WHERE source_code = 'TIER1_APPLICATION_SCREEN');
GO
