-- V215: license_registration's master_data_table_registry description was
-- stale -- said "Needs a dedicated Tier 1 controller... is_enabled=0 until
-- that UI is built", but LicenseRegistrationController (full CRUD) and a
-- real hand-built page (features/credit/licenses/LicensesDirectoryPage.tsx)
-- both already exist. Found during the 2026-08-09 whole-platform master-data
-- audit (registry-vs-code cross-reference pass).

USE ETRM_DB;
GO

UPDATE dbo.master_data_table_registry
SET description = 'Regulatory and trading licenses per legal entity and counterparty -- broker licenses, market participant registrations, import/export licenses, environmental permits. Has a dedicated Tier 1 controller (LicenseRegistrationController) and hand-built page at /credit/licenses, not generic Tier2 CRUD -- is_enabled=0 for that reason, not because it is unbuilt.',
    updated_at = SYSUTCDATETIME(),
    updated_by = 'flyway_migration',
    row_version = row_version + 1
WHERE table_name = 'license_registration';
GO
