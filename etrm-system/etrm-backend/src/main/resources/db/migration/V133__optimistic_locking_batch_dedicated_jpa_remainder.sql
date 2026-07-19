-- =============================================================================
-- V133 — Optimistic locking (row_version), Batch F: remaining entities with a
-- real dedicated JPA update() path
--
-- Third wave of the rollout started in V127 and continued in V128-V132.
-- While completing the remaining ~61 unprotected entities, a real
-- architectural split was found: some entities are written through a
-- dedicated Service/Controller doing a genuine Hibernate save() (where
-- @Version works exactly like the prior 91 entities) — this batch. The
-- other ~36 remaining entities are managed exclusively through the generic
-- Tier2 CRUD engine (ReferenceDataCrudService), which builds and executes
-- raw `UPDATE dbo.<table> SET ...` SQL via JdbcTemplate — completely
-- bypassing Hibernate/JPA. Adding row_version + @Version to THOSE entities'
-- read-only projection classes would be pure theater: the column would never
-- be checked or incremented, since the real write path never touches
-- Hibernate at all. That set needs a different, engine-level fix (a generic
-- version check added to ReferenceDataCrudService.updateRow() itself,
-- protecting all Tier2-managed tables in one change) — tracked separately,
-- not done in this migration. See the handoff doc for the full breakdown.
--
-- Same shape as V127-V132: plain Hibernate-managed row_version INT, starts
-- at 0, single-statement ADD COLUMN ... NOT NULL DEFAULT.
-- =============================================================================

ALTER TABLE dbo.bank_account            ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.carbon_registry         ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.country                 ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.currency                ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.emission_obligation     ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.emission_scheme         ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.environmental_product   ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.gl_account              ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.holiday_calendar        ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.incoterm                ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.legal_entity_ownership  ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.payment_method          ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.payment_term            ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.period                  ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.product_reporting_group ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.regulatory_obligation   ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.rin_account             ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.rin_fuel_category       ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.rin_obligation          ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.rin_transaction         ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.tax_registration        ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.unit_of_measure         ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.uom_conversion          ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.address                 ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.contact                 ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.entity_address          ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.entity_contact          ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.user_role               ADD row_version INT NOT NULL DEFAULT 0;
GO

PRINT '============================================================';
PRINT 'V133 APPLIED — row_version added to 28 dedicated-JPA-update';
PRINT '  entities (Batch F). ~36 more entities remain, all managed';
PRINT '  by the generic Tier2 CRUD engine and needing a different,';
PRINT '  engine-level fix — see handoff doc.';
PRINT '============================================================';
GO
