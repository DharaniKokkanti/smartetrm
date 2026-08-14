-- V226: ref_legal_entity_history was still tagged module_group='Organization
-- & Users' -- V223 fixed legal_entity itself but missed its temporal history
-- table. Found while documenting the 2026-08-14 naming-convention session.
-- Registry-only, no DB table touched.

USE ETRM_DB;
GO

UPDATE dbo.master_data_table_registry
SET module_group = 'Counterparties & Agreements',
    updated_at = SYSUTCDATETIME(),
    updated_by = 'flyway_migration',
    row_version = row_version + 1
WHERE table_name = 'ref_legal_entity_history';
GO
