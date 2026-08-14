-- V229: Contract & Legal module_group. incoterm, payment_method,
-- transport_document_type are SYSTEM-locked (allow=0, ICC/standardized
-- vocab) -> mst_. base_date_event_type, business_day_convention_type are
-- business-editable (allow=1) -> ref_. None temporal.

USE ETRM_DB;
GO

EXEC sp_rename 'dbo.incoterm', 'mst_incoterm';
GO
EXEC sp_rename 'dbo.payment_method', 'mst_payment_method';
GO
EXEC sp_rename 'dbo.transport_document_type', 'mst_transport_document_type';
GO
EXEC sp_rename 'dbo.base_date_event_type', 'ref_base_date_event_type';
GO
EXEC sp_rename 'dbo.business_day_convention_type', 'ref_business_day_convention_type';
GO

UPDATE dbo.master_data_table_registry SET table_name = 'mst_incoterm', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'incoterm';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_payment_method', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'payment_method';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'mst_transport_document_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'transport_document_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_base_date_event_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'base_date_event_type';
GO
UPDATE dbo.master_data_table_registry SET table_name = 'ref_business_day_convention_type', updated_at = SYSUTCDATETIME(), updated_by = 'flyway_migration', row_version = row_version + 1 WHERE table_name = 'business_day_convention_type';
GO
