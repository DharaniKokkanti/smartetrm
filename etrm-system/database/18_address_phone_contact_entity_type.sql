-- =============================================================================
-- ETRM SYSTEM — ADDRESS PHONE + ENTITY TYPE EXTENSION
-- SQL Server 2022 | V18 | June 2026
-- =============================================================================
-- Run AFTER: 17_parent_lookup_tables.sql
-- Mirror of V18__address_phone_contact_entity_type.sql
-- =============================================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.address') AND name = 'phone_number'
)
BEGIN
    ALTER TABLE dbo.address
    ADD phone_number VARCHAR(30) NULL;
END
GO

IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID('dbo.address')
      AND name = 'chk_address_entity_type'
)
    ALTER TABLE dbo.address DROP CONSTRAINT chk_address_entity_type;
GO

ALTER TABLE dbo.address
    ADD CONSTRAINT chk_address_entity_type
    CHECK (entity_type IN ('LEGAL_ENTITY', 'COUNTERPARTY', 'BROKER'));
GO

IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID('dbo.contact')
      AND name = 'chk_contact_entity_type'
)
    ALTER TABLE dbo.contact DROP CONSTRAINT chk_contact_entity_type;
GO

ALTER TABLE dbo.contact
    ADD CONSTRAINT chk_contact_entity_type
    CHECK (entity_type IN ('LEGAL_ENTITY', 'COUNTERPARTY', 'BROKER'));
GO
