-- =============================================================================
-- V130 — Optimistic locking (row_version), Batch C: Logistics
--
-- Continuation of V127's optimistic-locking rollout (see that migration's
-- comment for the full rationale: every update() method in this backend does
-- findById() -> overwrite whatever the client sent -> save(), with no check
-- that the record hasn't changed since the client last read it — a silent
-- last-write-wins lost update for two concurrent editors). V127 covered the
-- first 5 highest-touch master data entities; this migration is Batch C of a
-- 5-batch parallel rollout extending the same pattern to the remaining
-- entities, scoped here to the logistics domain: bunker/vessel-adjacent
-- reference data, containers, delivery/nomination workflow tables, location,
-- the full pipeline family, railcar (+ its shared product-approval table),
-- storage facility/tank, and road/rail/transport-operator/route tables.
--
-- Same mechanics as V127: a plain, Hibernate-managed row_version INT column
-- (not SQL Server's native ROWVERSION/TIMESTAMP binary type) starting at 0 on
-- every existing row. Hibernate's @Version annotation increments it on every
-- UPDATE and includes `WHERE row_version = ?` in the SQL, so a stale write
-- matches zero rows and throws ObjectOptimisticLockingFailureException
-- (-> 409 OPTIMISTIC_LOCK_CONFLICT via GlobalExceptionHandler) instead of
-- silently succeeding.
--
-- Note: dbo.mot_asset_product_approval is a shared polymorphic table
-- (asset_type discriminator) — RailcarProductApproval is only the first entity
-- built against it, but the row_version column benefits any future asset
-- type wired up against the same table, not just railcar.
-- =============================================================================

ALTER TABLE dbo.bunker_fuel_grade         ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.bunker_stem               ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.container                 ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.delivery_instruction      ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.location                  ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.nomination                ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.pipeline                  ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.pipeline_cycle            ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.pipeline_point            ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.pipeline_segment          ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.pipeline_tariff           ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.railcar                   ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.mot_asset_product_approval ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.storage_facility          ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.tank                      ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.transport_operator        ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.transport_route           ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.truck                     ADD row_version INT NOT NULL DEFAULT 0;
GO

PRINT '============================================================';
PRINT 'V130 APPLIED — row_version added to 18 logistics-domain';
PRINT '  entities (Batch C): bunker_fuel_grade, bunker_stem,';
PRINT '  container, delivery_instruction, location, nomination,';
PRINT '  pipeline, pipeline_cycle, pipeline_point, pipeline_segment,';
PRINT '  pipeline_tariff, railcar, mot_asset_product_approval,';
PRINT '  storage_facility, tank, transport_operator, transport_route,';
PRINT '  truck. Optimistic locking is now enforced on these tables —';
PRINT '  a concurrent stale update returns 409 instead of silently';
PRINT '  overwriting another user''s change. See V127/V130 comments';
PRINT '  and the handoff doc for the full batch rollout plan.';
PRINT '============================================================';
GO
