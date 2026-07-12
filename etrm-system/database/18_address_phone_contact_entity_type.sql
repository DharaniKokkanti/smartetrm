-- =============================================================================
-- ETRM SYSTEM — ADDRESS PHONE + ENTITY TYPE EXTENSION
-- SQL Server 2022 | V18 | June 2026
-- =============================================================================
-- Run AFTER: V17__parent_lookup_tables.sql
-- =============================================================================
-- CHANGES:
--   1. address.phone_number  — direct phone for an address (office line, port desk, etc.)
--   2. EntityType enum extended to BROKER (used in address / contact polymorphic
--      association; brokers are counterparties with cp_type='BROKER' but we expose
--      the enum value so the API layer can filter cleanly)
-- =============================================================================

-- ── 1. Add phone_number to address ──────────────────────────────────────────

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.address') AND name = 'phone_number'
)
BEGIN
    ALTER TABLE dbo.address
    ADD phone_number VARCHAR(30) NULL;
END
GO

-- ── 2. Refresh CHECK constraint on entity_type ───────────────────────────────
-- SQL Server stores CHECK constraints by name; we drop and recreate so the
-- allowed list grows without a table rebuild.

-- address table
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

-- contact table
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
