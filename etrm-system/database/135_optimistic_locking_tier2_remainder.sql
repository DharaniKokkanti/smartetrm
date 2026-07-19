-- =============================================================================
-- V135 — Optimistic locking, Tier2-generic-CRUD remainder (31 tables)
--
-- V134 piloted the generic-engine fix (ReferenceDataCrudService.updateRow())
-- on a single table (mot_type) and verified it end-to-end: live curl proof
-- of both the normal stale-write conflict and the missing-rowVersion guard,
-- plus a zero-regression full JUnit suite run. This migration rolls the
-- same row_version column out to the rest of the entities identified in
-- V133's Group 2 classification — tables with no dedicated JPA
-- Service/Controller, managed exclusively through the generic Tier2 CRUD
-- engine. No further code change needed: ReferenceDataCrudService already
-- checks for this column generically via live-introspected metadata, so
-- each table gets the same protection the moment its column exists.
--
-- Closes the rollout that started with V127: every remaining unprotected
-- master-data entity this session identified now has row_version.
-- =============================================================================

ALTER TABLE dbo.app_function               ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.app_module                 ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.calendar_holiday           ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.carbon_registry_type       ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.charter_party_type         ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.collateral_type            ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.commodity_type             ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.credit_limit_status_type   ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.credit_limit_type          ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.emission_obligation_status ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.emission_scheme_type       ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.environmental_product_type ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.governing_law_type         ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.lc_status_type             ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.lc_type                    ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.location_type              ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.lookup_category            ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.lookup_value               ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.margin_agreement_type      ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.master_data_table_registry ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.off_hire_reason_type       ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.pricing_type               ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.regulatory_report_type     ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.reporting_group            ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.role_field_profile         ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.role_function              ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.screen_field_registry      ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.sof_event_type             ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.storage_facility_type      ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.uom_type                   ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.valuation_frequency_type   ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.vessel_type                ADD row_version INT NOT NULL DEFAULT 0;
GO

PRINT '============================================================';
PRINT 'V135 APPLIED — row_version added to 31 remaining Tier2-';
PRINT '  generic-CRUD tables. Combined with V127-V134, every master';
PRINT '  data entity identified this session now has optimistic';
PRINT '  locking protection.';
PRINT '============================================================';
GO
