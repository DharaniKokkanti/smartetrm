-- V242: Voyage & Charter Ops module_group (23 tables), the last of the 7
-- module_groups from today's session. Same refined method as every batch
-- since V235, applied without a confirmation round per direct instruction.
-- None temporal; zero native/raw SQL risk confirmed via the standard sweep.
--
-- tran_ (8): bolmo_agreement/bolmo_leg/bunker_stem/charter_off_hire_event/
-- charter_party/laytime_calculation/voyage_cargo_parcel/voyage_sof_event --
-- all data_category=TRANSACTIONAL, consistent with every prior batch
-- (pricing_dispute/margin_call/etc.): TRANSACTIONAL always maps to tran_
-- regardless of whether a real controller/write path exists.
--
-- ref_ (14): bunker_fuel_grade/charter_party_template/delay_reason_type/
-- emission_factor/off_hire_reason_type/port_activity_template/
-- sof_event_type/vessel_operational_status_type already allow=1.
-- port_activity_template_step/vessel/vessel_cargo_tank/vessel_certificate/
-- vessel_performance_curve/voyage have allow=0 but real dedicated pages
-- with working POST/PUT.
--
-- Left unprefixed (1): vessel_bunker_rob_ledger -- DERIVED, no dedicated
-- controller (checked directly, GET-only), zero incoming FK consumers --
-- a computed running-balance bunker-fuel ledger, same shape as
-- position/position_eod_snapshot/position_valuation (computed output, not
-- reference data), not a lookup any screen creates from.
--
-- `vessel` is in ReferenceDataTable.tsx's DEDICATED_ENTITY_FK_TABLES escape
-- hatch (as the bare literal 'vessel') -- updated to 'ref_vessel' in the
-- same commit, same as location/storage_facility/transport_route/country/
-- exchange/payment_term/unit_of_measure in earlier batches.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.bolmo_agreement', 'tran_bolmo_agreement';
GO
EXEC sp_rename 'dbo.bolmo_leg', 'tran_bolmo_leg';
GO
EXEC sp_rename 'dbo.bunker_stem', 'tran_bunker_stem';
GO
EXEC sp_rename 'dbo.charter_off_hire_event', 'tran_charter_off_hire_event';
GO
EXEC sp_rename 'dbo.charter_party', 'tran_charter_party';
GO
EXEC sp_rename 'dbo.laytime_calculation', 'tran_laytime_calculation';
GO
EXEC sp_rename 'dbo.voyage_cargo_parcel', 'tran_voyage_cargo_parcel';
GO
EXEC sp_rename 'dbo.voyage_sof_event', 'tran_voyage_sof_event';
GO
EXEC sp_rename 'dbo.bunker_fuel_grade', 'ref_bunker_fuel_grade';
GO
EXEC sp_rename 'dbo.charter_party_template', 'ref_charter_party_template';
GO
EXEC sp_rename 'dbo.delay_reason_type', 'ref_delay_reason_type';
GO
EXEC sp_rename 'dbo.emission_factor', 'ref_emission_factor';
GO
EXEC sp_rename 'dbo.off_hire_reason_type', 'ref_off_hire_reason_type';
GO
EXEC sp_rename 'dbo.port_activity_template', 'ref_port_activity_template';
GO
EXEC sp_rename 'dbo.sof_event_type', 'ref_sof_event_type';
GO
EXEC sp_rename 'dbo.vessel_operational_status_type', 'ref_vessel_operational_status_type';
GO
EXEC sp_rename 'dbo.port_activity_template_step', 'ref_port_activity_template_step';
GO
EXEC sp_rename 'dbo.vessel', 'ref_vessel';
GO
EXEC sp_rename 'dbo.vessel_cargo_tank', 'ref_vessel_cargo_tank';
GO
EXEC sp_rename 'dbo.vessel_certificate', 'ref_vessel_certificate';
GO
EXEC sp_rename 'dbo.vessel_performance_curve', 'ref_vessel_performance_curve';
GO
EXEC sp_rename 'dbo.voyage', 'ref_voyage';
GO

UPDATE dbo.master_data_table_registry SET table_name = 'tran_bolmo_agreement', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'bolmo_agreement';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'tran_bolmo_leg', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'bolmo_leg';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'tran_bunker_stem', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'bunker_stem';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'tran_charter_off_hire_event', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'charter_off_hire_event';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'tran_charter_party', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'charter_party';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'tran_laytime_calculation', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'laytime_calculation';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'tran_voyage_cargo_parcel', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'voyage_cargo_parcel';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'tran_voyage_sof_event', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'voyage_sof_event';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_bunker_fuel_grade', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'bunker_fuel_grade';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_charter_party_template', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'charter_party_template';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_delay_reason_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'delay_reason_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_emission_factor', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'emission_factor';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_off_hire_reason_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'off_hire_reason_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_port_activity_template', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'port_activity_template';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_sof_event_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'sof_event_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_vessel_operational_status_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'vessel_operational_status_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_port_activity_template_step', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'port_activity_template_step';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_vessel', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'vessel';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_vessel_cargo_tank', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'vessel_cargo_tank';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_vessel_certificate', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'vessel_certificate';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_vessel_performance_curve', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'vessel_performance_curve';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_voyage', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'voyage';
GO
