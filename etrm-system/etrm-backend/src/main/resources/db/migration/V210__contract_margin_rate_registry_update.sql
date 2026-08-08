-- V210: contract_margin_rate (V204) now has a real hand-built page at
-- /credit/contract-margin-rates (ContractMarginRateController + Contract
-- Margin Rates page) — update its master_data_table_registry description,
-- which still said "Schema-only, no backend CRUD yet" from V207.

USE ETRM_DB;
GO

UPDATE dbo.master_data_table_registry
SET description = 'Exchange-published initial/maintenance margin rate per derivative contract spec, effective-dated. Hand-built page at /credit/contract-margin-rates, not generic Tier2 CRUD.',
    updated_at = SYSUTCDATETIME(),
    updated_by = 'flyway_migration',
    row_version = row_version + 1
WHERE table_name = 'contract_margin_rate';
GO
