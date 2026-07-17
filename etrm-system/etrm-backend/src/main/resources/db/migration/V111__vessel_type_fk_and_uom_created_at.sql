-- =============================================================================
-- V111 -- vessel.vessel_type: VARCHAR+CHECK -> real FK (matching the
-- book_type/connection_type precedent from V85/V104/V105); small
-- unit_of_measure.created_at and payment_term.created_at gap fixes needed
-- for their new dedicated controllers.
--
-- Follows the exact V94/V95 "add nullable *_id, backfill by join, drop old
-- CHECK+column, restore NOT NULL, add FK" convention.
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- 1. VESSEL_TYPE -- new lookup table, seeded from the 14 existing CHECK values
-- =============================================================================
CREATE TABLE dbo.vessel_type (
    vessel_type_id        INT             NOT NULL IDENTITY(1,1),
    type_code                VARCHAR(30)     NOT NULL,
    type_name                  VARCHAR(150)    NOT NULL,
    description                    VARCHAR(300)    NULL,
    sort_order                       SMALLINT        NOT NULL DEFAULT 0,
    is_active                          BIT             NOT NULL DEFAULT 1,
    created_at                          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                            VARCHAR(100)    NOT NULL,
    updated_at                              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_vessel_type   PRIMARY KEY (vessel_type_id),
    CONSTRAINT uq_vt_code         UNIQUE      (type_code)
);
GO

INSERT INTO dbo.vessel_type (type_code, type_name, sort_order, created_by, updated_by)
VALUES
    ('VLCC',              'Very Large Crude Carrier (200-320k DWT)',  1,  'SYSTEM', 'SYSTEM'),
    ('SUEZMAX',           'Suezmax (120-200k DWT)',                    2,  'SYSTEM', 'SYSTEM'),
    ('AFRAMAX',           'Aframax (80-120k DWT)',                      3,  'SYSTEM', 'SYSTEM'),
    ('PANAMAX',           'Panamax Tanker',                              4,  'SYSTEM', 'SYSTEM'),
    ('HANDYSIZE',         'Handysize Tanker',                             5,  'SYSTEM', 'SYSTEM'),
    ('MR_TANKER',         'Medium Range Product Tanker',                   6,  'SYSTEM', 'SYSTEM'),
    ('LR1_TANKER',        'Long Range 1 Product Tanker',                    7,  'SYSTEM', 'SYSTEM'),
    ('LR2_TANKER',        'Long Range 2 Product Tanker',                     8,  'SYSTEM', 'SYSTEM'),
    ('LNG_CARRIER',       'LNG Carrier',                                      9,  'SYSTEM', 'SYSTEM'),
    ('LPG_CARRIER',       'LPG Carrier',                                       10, 'SYSTEM', 'SYSTEM'),
    ('CHEMICAL_TANKER',   'Chemical / Specialty Tanker',                        11, 'SYSTEM', 'SYSTEM'),
    ('BULK_CARRIER',      'Dry Bulk (Agri, Metals)',                             12, 'SYSTEM', 'SYSTEM'),
    ('BARGE',             'River / Coastal Barge',                                13, 'SYSTEM', 'SYSTEM'),
    ('OTHER',             'Other',                                                  14, 'SYSTEM', 'SYSTEM');
GO

-- =============================================================================
-- 2. VESSEL.VESSEL_TYPE -- convert to FK
-- =============================================================================
ALTER TABLE dbo.vessel ADD vessel_type_id INT NULL;
GO

UPDATE v SET v.vessel_type_id = t.vessel_type_id
FROM dbo.vessel v JOIN dbo.vessel_type t ON t.type_code = v.vessel_type;
GO

ALTER TABLE dbo.vessel DROP CONSTRAINT chk_ves_type;
GO
DROP INDEX ix_vessel_type ON dbo.vessel;
GO
ALTER TABLE dbo.vessel DROP COLUMN vessel_type;
GO
ALTER TABLE dbo.vessel ALTER COLUMN vessel_type_id INT NOT NULL;
GO
ALTER TABLE dbo.vessel ADD CONSTRAINT fk_vessel_type FOREIGN KEY (vessel_type_id) REFERENCES dbo.vessel_type(vessel_type_id);
GO
CREATE INDEX ix_vessel_type_id ON dbo.vessel (vessel_type_id);
GO

-- =============================================================================
-- 3. UNIT_OF_MEASURE -- add created_at (small gap -- new dedicated controller
-- needs it; matches the currency precedent from V98, same class of gap)
-- =============================================================================
ALTER TABLE dbo.unit_of_measure ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME();
GO

-- =============================================================================
-- 3b. PAYMENT_TERM -- add created_at (same class of gap; new dedicated
-- controller needs it, matches the currency/unit_of_measure precedent)
-- =============================================================================
ALTER TABLE dbo.payment_term ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME();
GO

-- =============================================================================
-- 4. MASTER DATA TABLE REGISTRY -- register vessel_type, plus two pre-existing
-- but never-registered lookup tables (base_date_event_type,
-- business_day_convention_type -- both already had seed data, 11 and 5 rows
-- respectively, but were invisible to Static Data AND to the Payment Terms
-- page's own dropdowns, since ReferenceDataController requires registry
-- membership before it will serve a table at all -- a genuine Static Data gap).
-- =============================================================================
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES
    ('vessel_type', 'Vessel Types', 'Logistics & Delivery', 1, 1, 1, 0, 22, 'SYSTEM', 'SYSTEM'),
    ('base_date_event_type', 'Base Date Event Types', 'Contract & Legal', 1, 1, 1, 0, 5, 'SYSTEM', 'SYSTEM'),
    ('business_day_convention_type', 'Business Day Convention Types', 'Contract & Legal', 1, 1, 1, 0, 6, 'SYSTEM', 'SYSTEM');
GO
