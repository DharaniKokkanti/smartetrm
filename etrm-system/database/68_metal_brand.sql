-- =============================================================================
-- V68 — dbo.metal_brand: LME-style approved brand register
-- =============================================================================
-- Part of a review of LNG/Power/Agri/Metals master data against real
-- industry structure. Metals purity/brand data existed only as a boolean
-- spec_parameter flag (LME_BRAND, V4) plus a purity percentage on `product`
-- (V25) — neither models the real mechanism that determines what physical
-- metal is actually deliverable: the LME's (and equivalent exchanges')
-- Approved Brand list, keyed by producer + metal form (cathode, ingot, wire
-- rod, etc.), each with its own approval/delisting date. Only brands on
-- this list may be placed on warrant and delivered against an exchange
-- contract — a genuinely missing master-data concept, not a duplicate of
-- the existing purity/spec fields.
--
-- Linked from commodity_family (BASE_METAL/PRECIOUS_METAL family_type),
-- same scoping pattern as V67's commodity_grade_standard.
-- =============================================================================

USE ETRM_DB;
GO

IF OBJECT_ID('dbo.metal_brand', 'U') IS NOT NULL DROP TABLE dbo.metal_brand;
GO

CREATE TABLE dbo.metal_brand (
    metal_brand_id         INT             NOT NULL IDENTITY(1,1),
    commodity_family_id        INT             NOT NULL,
    brand_code                    VARCHAR(30)     NOT NULL,
    brand_name                       VARCHAR(150)    NOT NULL,
    producer_name                       VARCHAR(200)    NULL,
    metal_form                             VARCHAR(30)     NOT NULL
        CONSTRAINT chk_mb_form CHECK (metal_form IN (
            'CATHODE','CATHODE_FULL_PLATE','INGOT','WIRE_ROD','PIG','BAR','GRANULES','BRIQUETTE','SLAB','OTHER'
        )),
    country_of_origin                          CHAR(2)         NULL,
    approval_date                                 DATE            NULL,
    delisting_date                                   DATE            NULL,
    is_active                                           BIT             NOT NULL DEFAULT 1,
    notes                                                  VARCHAR(500)    NULL,
    created_at                                                DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                                VARCHAR(100)    NOT NULL,
    updated_at                                                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                                  VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_metal_brand      PRIMARY KEY (metal_brand_id),
    CONSTRAINT uq_mb_code              UNIQUE      (commodity_family_id, brand_code),
    CONSTRAINT fk_mb_commodity_family      FOREIGN KEY (commodity_family_id) REFERENCES dbo.commodity_family(commodity_family_id),
    CONSTRAINT chk_mb_delisting                CHECK (delisting_date IS NULL OR approval_date IS NULL OR delisting_date >= approval_date)
);
GO
CREATE INDEX ix_mb_family ON dbo.metal_brand (commodity_family_id, is_active);
GO

-- =============================================================================
-- Seed: real LME-approved copper cathode brands (BASE_METALS/base metals
-- family), matching the existing LME_CU_GRADE_A product_spec_template (V24)
-- and LME-COPPER product (99.9935% purity, V25).
-- =============================================================================
INSERT INTO dbo.metal_brand (commodity_family_id, brand_code, brand_name, producer_name, metal_form, country_of_origin, approval_date, is_active, created_by, updated_by)
SELECT cf.commodity_family_id, v.brand_code, v.brand_name, v.producer_name, v.metal_form, v.country_of_origin, v.approval_date, 1, 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('CODELCO-CU',  'Codelco Grade A Cathode',      'Corporación Nacional del Cobre de Chile', 'CATHODE_FULL_PLATE', 'CL', '1990-01-01'),
    ('KGHM-CU',     'KGHM Grade A Cathode',         'KGHM Polska Miedz S.A.',                   'CATHODE',             'PL', '1995-06-01'),
    ('ASARCO-CU',   'Asarco Grade A Cathode',       'ASARCO LLC',                                'CATHODE',             'US', '1988-03-01')
) AS v(brand_code, brand_name, producer_name, metal_form, country_of_origin, approval_date)
JOIN dbo.commodity_family cf ON cf.family_code = 'BASE_METALS';
GO

-- =============================================================================
-- Register in master data registry (Static Data page).
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'metal_brand')
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES ('metal_brand', 'Metal Brand Register', 'Products & Markets', 1, 1, 1, 0, 7, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'V68 — METAL_BRAND APPLIED';
PRINT '  metal_brand — NEW table, 3 LME-approved copper cathode brands seeded.';
PRINT '============================================================';
GO
