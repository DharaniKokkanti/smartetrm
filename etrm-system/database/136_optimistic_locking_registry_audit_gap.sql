-- =============================================================================
-- V136 — Optimistic locking, master-data-registry audit gap (65 tables)
--
-- V127-V135 declared the master-data row_version rollout "complete" at
-- 152/152 entities, but that count came from a manual code-driven audit
-- (grep-classifying controllers/services), not from the registry itself.
-- Cross-checking dbo.master_data_table_registry directly against
-- sys.columns found 65 tables that are registered, is_enabled=1,
-- allow_edit=1 (live and editable through the Tier2 CRUD UI today) with
-- no row_version column at all — missed by that session's audit, not
-- newly added since (all predate V127, created V11-V96). None of these
-- have a dedicated JPA entity/service (confirmed via grep for the table
-- name in main/java) — they're managed exclusively through the generic
-- Tier2 CRUD engine, same as V135's batch. No code change needed:
-- ReferenceDataCrudService.updateRow() already checks for this column
-- generically via live-introspected metadata, so each table gets the
-- same protection the moment its column exists.
--
-- None of the 65 are system-versioned (temporal) tables, so a plain
-- ADD COLUMN NOT NULL DEFAULT is safe for all of them (same as V133-135).
-- =============================================================================

ALTER TABLE dbo.address_type                 ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.agri_crop_year_lifecycle     ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.agri_moisture_discount_scale ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.balancing_authority          ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.bank_account_type            ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.base_date_event_type         ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.blend_recipe                 ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.blend_recipe_component       ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.book_level_type              ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.book_type                    ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.business_day_convention_type ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.commodity_family             ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.commodity_grade_standard     ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.connection_type              ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.contact_role                 ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.counterparty_type            ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.credit_rating                ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.deal_type                    ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.delay_reason_type            ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.demurrage_dispatch_rate      ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.emission_factor              ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.energy_footprint             ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.energy_footprint_site        ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.event_category               ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.event_type                   ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.external_system              ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.fleet_group                  ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.freight_rate_index           ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.fx_period                    ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.fx_rate                      ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.generation_asset             ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.inspection_type              ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.intercompany_transfer_rule   ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.interconnector               ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.interest_rate_index          ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.inventory_ownership_type     ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.kyc_status                   ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.laytime_exception_type       ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.legal_entity_type            ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.lng_boil_off_rule            ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.lng_terminal_detail          ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.load_shape_component         ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.load_shape_interval          ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.load_shape_template           ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.loading_rack                 ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.metal_assay_component_rule   ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.metal_brand                  ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.metal_shape                  ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.metal_warrant                ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.movement_type                ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.netting_agreement_type       ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.payment_calendar_assignment  ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.power_ancillary_service_type ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.power_pnode                  ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.power_product_detail         ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.product_interface_rule       ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.road_tariff                  ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.settlement_calendar          ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.settlement_type              ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.tax_type                     ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.throughput_agreement         ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.trade_repository             ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.transmission_right_type      ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.transmission_zone            ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.transport_document_type      ADD row_version INT NOT NULL DEFAULT 0;
GO
ALTER TABLE dbo.vessel_operational_status_type ADD row_version INT NOT NULL DEFAULT 0;
GO

PRINT '============================================================';
PRINT 'V136 APPLIED — row_version added to 65 master-data-registry';
PRINT '  tables missed by the V127-V135 audit. Registry-vs-schema';
PRINT '  cross-check now shows every is_enabled/allow_edit table';
PRINT '  with a row_version column protected by the generic Tier2';
PRINT '  engine check.';
PRINT '============================================================';
GO
