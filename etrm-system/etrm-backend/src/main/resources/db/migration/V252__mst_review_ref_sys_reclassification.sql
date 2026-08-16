-- V252: full mst_ review against Dharani's thumb rule -- "if we've any logic
-- defined by these tables, keep them under mst_, else move them under ref_"
-- (mirroring how mst_commodity_sector correctly stays mst_: pages are
-- designed around its specific fixed values, vs. holiday-style generic data
-- that just changes over time with nothing branching on it).
--
-- 28 tables reclassified mst_ -> ref_: confirmed via full backend/frontend
-- audit to be plain generic CRUD / FK-lookup data with zero code branching
-- on specific row values anywhere in the platform.
--
-- 2 tables reclassified mst_ -> sys_ instead of ref_: lookup_category_binding
-- (a table.column -> lookup-category registry, pure GUI plumbing, deliberately
-- excluded from admin browsing per its own V85 migration comment) and
-- physical_asset (a backfilled/derived index table over storage_facility/
-- generation_asset per V161, not something anyone authors directly) -- both
-- are platform self-description/derived infrastructure per CLAUDE.md 4a's
-- sys_ definition, not business-editable reference data.
--
-- mst_pricing_window_rule deliberately excluded from this batch -- Dharani:
-- "keep this as is."
--
-- 11 tables kept mst_ (real logic found, not touched by this migration):
-- mst_pricing_type, mst_uom_type, mst_lc_status_type,
-- mst_credit_limit_status_type, mst_emission_obligation_status,
-- mst_commodity_instrument_type_config, mst_location_type, mst_mot_type,
-- mst_book_type, mst_credit_limit_type, mst_valuation_frequency_type.

USE ETRM_DB;
GO

-- ── mst_ -> ref_ (28 tables) ────────────────────────────────────────────
EXEC sp_rename 'dbo.mst_book_classification_dimension', 'ref_book_classification_dimension';
GO
EXEC sp_rename 'dbo.mst_carbon_registry', 'ref_carbon_registry';
GO
EXEC sp_rename 'dbo.mst_collateral_type', 'ref_collateral_type';
GO
EXEC sp_rename 'dbo.mst_contact_role', 'ref_contact_role';
GO
EXEC sp_rename 'dbo.mst_emission_obligation', 'ref_emission_obligation';
GO
EXEC sp_rename 'dbo.mst_emission_scheme', 'ref_emission_scheme';
GO
EXEC sp_rename 'dbo.mst_emission_scheme_type', 'ref_emission_scheme_type';
GO
EXEC sp_rename 'dbo.mst_environmental_product', 'ref_environmental_product';
GO
EXEC sp_rename 'dbo.mst_environmental_product_type', 'ref_environmental_product_type';
GO
EXEC sp_rename 'dbo.mst_event_category', 'ref_event_category';
GO
EXEC sp_rename 'dbo.mst_event_type', 'ref_event_type';
GO
EXEC sp_rename 'dbo.mst_governing_law_type', 'ref_governing_law_type';
GO
EXEC sp_rename 'dbo.mst_inspection_type', 'ref_inspection_type';
GO
EXEC sp_rename 'dbo.mst_insurance_policy_coverage', 'ref_insurance_policy_coverage';
GO
EXEC sp_rename 'dbo.mst_laytime_exception_type', 'ref_laytime_exception_type';
GO
EXEC sp_rename 'dbo.mst_lc_type', 'ref_lc_type';
GO
EXEC sp_rename 'dbo.mst_legal_entity_type', 'ref_legal_entity_type';
GO
EXEC sp_rename 'dbo.mst_margin_agreement_type', 'ref_margin_agreement_type';
GO
EXEC sp_rename 'dbo.mst_market_holiday_calendar', 'ref_market_holiday_calendar';
GO
EXEC sp_rename 'dbo.mst_pipeline_point_product', 'ref_pipeline_point_product';
GO
EXEC sp_rename 'dbo.mst_pipeline_segment_product', 'ref_pipeline_segment_product';
GO
EXEC sp_rename 'dbo.mst_power_ancillary_service_type', 'ref_power_ancillary_service_type';
GO
EXEC sp_rename 'dbo.mst_power_pnode', 'ref_power_pnode';
GO
EXEC sp_rename 'dbo.mst_power_schedule_cycle', 'ref_power_schedule_cycle';
GO
EXEC sp_rename 'dbo.mst_regulatory_report_type', 'ref_regulatory_report_type';
GO
EXEC sp_rename 'dbo.mst_storage_facility_type', 'ref_storage_facility_type';
GO
EXEC sp_rename 'dbo.mst_tax_type', 'ref_tax_type';
GO
EXEC sp_rename 'dbo.mst_transport_document_type', 'ref_transport_document_type';
GO

-- ── mst_ -> sys_ (2 tables) ─────────────────────────────────────────────
EXEC sp_rename 'dbo.mst_lookup_category_binding', 'sys_lookup_category_binding';
GO
EXEC sp_rename 'dbo.mst_physical_asset', 'sys_physical_asset';
GO

-- ── registry updates ────────────────────────────────────────────────────
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_book_classification_dimension', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_book_classification_dimension';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_carbon_registry', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_carbon_registry';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_collateral_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_collateral_type';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_contact_role', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_contact_role';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_emission_obligation', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_emission_obligation';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_emission_scheme', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_emission_scheme';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_emission_scheme_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_emission_scheme_type';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_environmental_product', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_environmental_product';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_environmental_product_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_environmental_product_type';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_event_category', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_event_category';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_event_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_event_type';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_governing_law_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_governing_law_type';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_inspection_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_inspection_type';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_insurance_policy_coverage', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_insurance_policy_coverage';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_laytime_exception_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_laytime_exception_type';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_lc_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_lc_type';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_legal_entity_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_legal_entity_type';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_margin_agreement_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_margin_agreement_type';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_market_holiday_calendar', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_market_holiday_calendar';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_pipeline_point_product', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_pipeline_point_product';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_pipeline_segment_product', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_pipeline_segment_product';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_power_ancillary_service_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_power_ancillary_service_type';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_power_pnode', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_power_pnode';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_power_schedule_cycle', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_power_schedule_cycle';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_regulatory_report_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_regulatory_report_type';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_storage_facility_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_storage_facility_type';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_tax_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_tax_type';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'ref_transport_document_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_transport_document_type';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'sys_lookup_category_binding', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_lookup_category_binding';
GO
UPDATE dbo.sys_master_data_table_registry SET table_name = 'sys_physical_asset', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'mst_physical_asset';
GO
