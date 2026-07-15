-- =============================================================================
-- V106 -- Drop external_system_type: no longer required, per explicit
-- product direction. connection_type (V105) stays as the one FK-backed
-- classification on external_system; system_type reverts to just not
-- existing as a field at all (it wasn't required, per V105, and isn't
-- needed even as an optional one).
--
-- Reverses the external_system_type_id half of V104: drop the FK, drop the
-- column off external_system, drop the now-unused external_system_type
-- table, and remove its master_data_table_registry row so it disappears
-- from the Static Data screen.
-- =============================================================================
USE ETRM_DB;
GO

ALTER TABLE dbo.external_system DROP CONSTRAINT IF EXISTS fk_es_type;
GO
ALTER TABLE dbo.external_system DROP COLUMN IF EXISTS external_system_type_id;
GO
DROP TABLE IF EXISTS dbo.external_system_type;
GO

DELETE FROM dbo.master_data_table_registry WHERE table_name = 'external_system_type';
GO

PRINT '============================================================';
PRINT 'V106 -- EXTERNAL_SYSTEM_TYPE DROPPED';
PRINT '  external_system.external_system_type_id column, its FK, and';
PRINT '  the dbo.external_system_type table are all removed.';
PRINT '============================================================';
GO
