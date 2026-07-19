-- =============================================================================
-- V132 — Optimistic locking (row_version): Batch E — Voyage-Ops/Maritime
--
-- Continuation of the V127 optimistic-locking rollout (see that migration's
-- header for the full rationale — every update() method does findById() ->
-- overwrite whatever the client sent -> save(), with no check that the
-- record hasn't changed since the client last read it, producing a silent
-- last-write-wins lost update under concurrent edits). This batch adds the
-- same plain, Hibernate-managed row_version INT column to the voyage
-- chartering/maritime operations entities: BOLMO agreements, charter
-- parties and their off-hire events/templates, laytime calculations and
-- templates, port activity templates and their steps, vessels and their
-- fleet/cargo-tank/certificate/performance-curve/bunker-ROB-ledger detail
-- tables, and voyages with their cargo parcels and SOF (statement of facts)
-- events.
--
-- As with V127, this is a plain app-managed INT (not SQL Server's native
-- ROWVERSION/TIMESTAMP binary type) — Hibernate's @Version annotation
-- increments it on every UPDATE and includes `WHERE row_version = ?` in the
-- SQL, so a stale write matches zero rows and throws
-- ObjectOptimisticLockingFailureException (-> 409, GlobalExceptionHandler)
-- instead of silently succeeding.
--
-- Single-statement ADD COLUMN ... NOT NULL DEFAULT, same as V127.
--
-- Note: charter_party_template, fleet, laytime_term_template, and
-- port_activity_template are also registered generic Tier 2 reference-data
-- tables (ReferenceDataCrudService, raw JdbcTemplate SQL, not JPA) — the
-- row_version column added here is honored by the JPA-backed reader
-- entities used elsewhere in the app for id -> code/name resolution, but is
-- NOT enforced by the generic Tier 2 admin CRUD path for these four tables,
-- since that path never goes through Hibernate's save(). See the handoff
-- doc for that known gap.
-- =============================================================================

ALTER TABLE dbo.bolmo_agreement            ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.bolmo_leg                  ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.charter_off_hire_event     ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.charter_party              ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.charter_party_template     ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.fleet                      ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.laytime_calculation        ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.laytime_term_template      ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.port_activity_template     ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.port_activity_template_step ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.vessel                     ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.vessel_bunker_rob_ledger   ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.vessel_cargo_tank          ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.vessel_certificate         ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.vessel_performance_curve   ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.voyage                     ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.voyage_cargo_parcel        ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.voyage_sof_event           ADD row_version INT NOT NULL DEFAULT 0;
GO

PRINT '============================================================';
PRINT 'V132 APPLIED — row_version added to 18 voyage-ops/maritime';
PRINT '  entities (Batch E): bolmo_agreement, bolmo_leg,';
PRINT '  charter_off_hire_event, charter_party,';
PRINT '  charter_party_template, fleet, laytime_calculation,';
PRINT '  laytime_term_template, port_activity_template,';
PRINT '  port_activity_template_step, vessel,';
PRINT '  vessel_bunker_rob_ledger, vessel_cargo_tank,';
PRINT '  vessel_certificate, vessel_performance_curve, voyage,';
PRINT '  voyage_cargo_parcel, voyage_sof_event. Optimistic locking is';
PRINT '  now enforced on these entities'' JPA-backed update paths — a';
PRINT '  concurrent stale update returns 409 instead of silently';
PRINT '  overwriting another user''s change.';
PRINT '============================================================';
GO
