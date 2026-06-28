-- =============================================================================
-- ETRM SYSTEM — ADDRESS / CONTACT AS SHARED POOL WITH LINK TABLES
-- SQL Server 2022 | V19 | June 2026
-- =============================================================================
-- Run AFTER: V18__address_phone_contact_entity_type.sql
-- =============================================================================
-- MOTIVATION
--   A physical office address (e.g., "Shell Centre, York Road, London") is
--   shared by the Legal Entity AND multiple Counterparties registered at the
--   same location. The same applies to contacts (e.g., a broker contact who
--   covers multiple entities). Previously each address/contact row was owned
--   by one entity (entity_type + entity_id on the row itself).
--
-- NEW DESIGN
--   - address / contact become pure POOL tables (no entity binding)
--   - entity_address / entity_contact are M:M link tables
--   - entity_type + entity_id on address/contact are made nullable and
--     deprecated; they are preserved for backward-compat until V20 cleanup
-- =============================================================================

-- ── Step 1: make old FK columns nullable on address ─────────────────────────
IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID('dbo.address')
      AND name = 'chk_address_entity_type'
)
    ALTER TABLE dbo.address DROP CONSTRAINT chk_address_entity_type;
GO

ALTER TABLE dbo.address ALTER COLUMN entity_type VARCHAR(20) NULL;
GO
ALTER TABLE dbo.address ALTER COLUMN entity_id   BIGINT      NULL;
GO

-- ── Step 2: make old FK columns nullable on contact ─────────────────────────
IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID('dbo.contact')
      AND name = 'chk_contact_entity_type'
)
    ALTER TABLE dbo.contact DROP CONSTRAINT chk_contact_entity_type;
GO

ALTER TABLE dbo.contact ALTER COLUMN entity_type VARCHAR(20) NULL;
GO
ALTER TABLE dbo.contact ALTER COLUMN entity_id   BIGINT      NULL;
GO
-- Also drop the old contact_role column that was on the pool record —
-- role is now per-assignment on entity_contact.
-- (We keep it nullable for now so existing rows still compile.)
ALTER TABLE dbo.contact ALTER COLUMN contact_role VARCHAR(30) NULL;
GO

-- ── Step 3: create entity_address link table ─────────────────────────────────
IF OBJECT_ID('dbo.entity_address', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.entity_address (
        entity_address_id   INT             IDENTITY(1,1)   NOT NULL,
        entity_type         VARCHAR(20)     NOT NULL,
        entity_id           BIGINT          NOT NULL,
        address_id          INT             NOT NULL,
        address_type        VARCHAR(30)     NOT NULL    DEFAULT 'REGISTERED',
        is_primary          BIT             NOT NULL    DEFAULT 0,
        is_active           BIT             NOT NULL    DEFAULT 1,
        notes               VARCHAR(500)    NULL,
        created_at          DATETIME2       NOT NULL    DEFAULT SYSDATETIME(),
        created_by          VARCHAR(100)    NOT NULL    DEFAULT 'SYSTEM',
        updated_at          DATETIME2       NOT NULL    DEFAULT SYSDATETIME(),
        updated_by          VARCHAR(100)    NOT NULL    DEFAULT 'SYSTEM',
        CONSTRAINT pk_entity_address PRIMARY KEY (entity_address_id),
        CONSTRAINT fk_ea_address     FOREIGN KEY (address_id) REFERENCES dbo.address(address_id),
        CONSTRAINT chk_ea_entity_type CHECK (entity_type IN ('LEGAL_ENTITY','COUNTERPARTY','BROKER'))
    );
END
GO

-- ── Step 4: create entity_contact link table ─────────────────────────────────
IF OBJECT_ID('dbo.entity_contact', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.entity_contact (
        entity_contact_id   INT             IDENTITY(1,1)   NOT NULL,
        entity_type         VARCHAR(20)     NOT NULL,
        entity_id           BIGINT          NOT NULL,
        contact_id          INT             NOT NULL,
        contact_role        VARCHAR(30)     NOT NULL    DEFAULT 'PRIMARY',
        is_primary          BIT             NOT NULL    DEFAULT 0,
        is_active           BIT             NOT NULL    DEFAULT 1,
        notes               VARCHAR(500)    NULL,
        created_at          DATETIME2       NOT NULL    DEFAULT SYSDATETIME(),
        created_by          VARCHAR(100)    NOT NULL    DEFAULT 'SYSTEM',
        updated_at          DATETIME2       NOT NULL    DEFAULT SYSDATETIME(),
        updated_by          VARCHAR(100)    NOT NULL    DEFAULT 'SYSTEM',
        CONSTRAINT pk_entity_contact PRIMARY KEY (entity_contact_id),
        CONSTRAINT fk_ec_contact     FOREIGN KEY (contact_id) REFERENCES dbo.contact(contact_id),
        CONSTRAINT chk_ec_entity_type CHECK (entity_type IN ('LEGAL_ENTITY','COUNTERPARTY','BROKER'))
    );
END
GO

-- ── Step 5: migrate existing address rows → entity_address ──────────────────
INSERT INTO dbo.entity_address
    (entity_type, entity_id, address_id, address_type, is_primary, is_active, created_by, updated_by)
SELECT
    entity_type,
    entity_id,
    address_id,
    ISNULL(address_type, 'REGISTERED'),
    ISNULL(is_primary, 0),
    ISNULL(is_active, 1),
    ISNULL(created_by, 'SYSTEM'),
    ISNULL(updated_by, 'SYSTEM')
FROM dbo.address
WHERE entity_type IS NOT NULL AND entity_id IS NOT NULL;
GO

-- ── Step 6: migrate existing contact rows → entity_contact ──────────────────
INSERT INTO dbo.entity_contact
    (entity_type, entity_id, contact_id, contact_role, is_primary, is_active, created_by, updated_by)
SELECT
    entity_type,
    entity_id,
    contact_id,
    ISNULL(contact_role, 'PRIMARY'),
    ISNULL(is_primary, 0),
    ISNULL(is_active, 1),
    ISNULL(created_by, 'SYSTEM'),
    ISNULL(updated_by, 'SYSTEM')
FROM dbo.contact
WHERE entity_type IS NOT NULL AND entity_id IS NOT NULL;
GO

-- ── Step 7: null out the now-redundant columns on address + contact ──────────
UPDATE dbo.address SET entity_type = NULL, entity_id = NULL, address_type = NULL, is_primary = NULL;
GO
UPDATE dbo.contact SET entity_type = NULL, entity_id = NULL, contact_role = NULL, is_primary = NULL;
GO
