-- =============================================================================
-- ETRM SYSTEM — V21 | June 2026
-- Covers four independent gaps left open after V18-V20:
--
--  1. address / contact  — old binding columns made truly nullable (V19 set
--     their values to NULL but left NOT NULL constraints in place via ALTER;
--     this drops them to genuinely nullable so JPA @Column(nullable=true) is correct)
--
--  2. master_data_table_registry — adds sub_group + description columns that
--     the front-end now reads for sidebar grouping and the description panel
--
--  3. app_user — adds profile fields needed by the system-user management UI:
--     role, department, phone, trader_id, preferred_locale, office_location
--
-- NOTE: The entity_address / entity_contact tables were created by V19.
--       The app_module / app_function / user_role / role_function /
--       user_role_assignment tables were created by V20.
--       This migration only patches schema gaps, it does NOT recreate them.
-- =============================================================================

-- ── 1. address — drop NOT NULL from legacy binding columns ────────────────────
-- V19 already set these to NULL for every row; this makes the constraint match.
-- ix_address_entity (V1/V19) includes address_type — drop/recreate around it.
DROP INDEX ix_address_entity ON dbo.address;
GO
ALTER TABLE dbo.address ALTER COLUMN entity_type   VARCHAR(20) NULL;
ALTER TABLE dbo.address ALTER COLUMN entity_id     BIGINT      NULL;
ALTER TABLE dbo.address ALTER COLUMN address_type  VARCHAR(20) NULL;
ALTER TABLE dbo.address ALTER COLUMN is_primary    BIT         NULL;
GO
CREATE INDEX ix_address_entity ON dbo.address (entity_type, entity_id, address_type, is_active);
GO

-- ── 2. contact — drop NOT NULL from legacy binding columns ────────────────────
-- ix_contact_entity (V1/V19) includes contact_role — same drop/recreate dance.
DROP INDEX ix_contact_entity ON dbo.contact;
GO
ALTER TABLE dbo.contact ALTER COLUMN entity_type   VARCHAR(20) NULL;
ALTER TABLE dbo.contact ALTER COLUMN entity_id     BIGINT      NULL;
ALTER TABLE dbo.contact ALTER COLUMN contact_role  VARCHAR(20) NULL;
ALTER TABLE dbo.contact ALTER COLUMN is_primary    BIT         NULL;
GO
CREATE INDEX ix_contact_entity ON dbo.contact (entity_type, entity_id, contact_role, is_active);
GO

-- ── 3. master_data_table_registry — sub_group + description ──────────────────
ALTER TABLE dbo.master_data_table_registry
    ADD sub_group   VARCHAR(100) NULL,
        description VARCHAR(1000) NULL;
GO

-- Update existing rows with the descriptions used in the front-end seed
UPDATE dbo.master_data_table_registry SET
    sub_group   = 'Global Codes',
    description = 'ISO 4217 currency codes used across all monetary fields. The 3-letter alphabetic code (e.g. USD, EUR, GBP) is enforced.'
WHERE table_name = 'currency';

UPDATE dbo.master_data_table_registry SET
    sub_group   = 'Classification',
    description = 'Top-level commodity classification. Drives product group assignment, applicable trade types, and pricing curve linkage.'
WHERE table_name = 'commodity';

UPDATE dbo.master_data_table_registry SET
    sub_group   = 'Classification',
    description = 'Credit rating scales with numeric equivalents. Used to derive credit exposure limits and margin requirements.'
WHERE table_name = 'credit_rating';

UPDATE dbo.master_data_table_registry SET
    sub_group   = 'Global Codes',
    description = 'ICC Incoterms® 2020 rules defining risk and cost transfer from seller to buyer.'
WHERE table_name = 'incoterm';

UPDATE dbo.master_data_table_registry SET
    sub_group   = 'Charter',
    description = 'Types of vessel charter arrangements — Voyage Charter (per tonne) or Time Charter (per day).'
WHERE table_name = 'charter_party_type';

UPDATE dbo.master_data_table_registry SET
    sub_group   = 'Markets',
    description = 'Standard electricity delivery profiles — Baseload (7×24), Peak (5×16), Off-peak, and user-defined shapes.'
WHERE table_name = 'load_shape_template';

UPDATE dbo.master_data_table_registry SET
    sub_group   = 'Markets',
    description = 'Grid operators (ISOs/RTOs) responsible for maintaining real-time supply/demand balance — PJM, ERCOT, CAISO, and others.'
WHERE table_name = 'balancing_authority';

UPDATE dbo.master_data_table_registry SET
    sub_group   = 'Grid',
    description = 'Pricing and scheduling zones within a balancing authority — hubs, load zones, and LMP nodes.'
WHERE table_name = 'transmission_zone';
GO

-- ── 4. app_user — extended user profile columns ───────────────────────────────
-- department already exists on app_user (V1) — not repeated here.
ALTER TABLE dbo.app_user
    ADD role             VARCHAR(30)  NULL,
        phone            VARCHAR(30)  NULL,
        trader_id        BIGINT       NULL,
        preferred_locale VARCHAR(10)  NULL,
        office_location  VARCHAR(100) NULL;
GO

-- Seed the built-in admin user with a default role
UPDATE dbo.app_user SET role = 'ADMIN' WHERE username = 'admin';
GO
