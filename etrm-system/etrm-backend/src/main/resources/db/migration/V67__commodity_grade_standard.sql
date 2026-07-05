-- =============================================================================
-- V67 — dbo.commodity_grade_standard: named grade tiers with a discount/
-- premium schedule vs. the contract "par" grade
-- =============================================================================
-- Part of a review of LNG/Power/Agri/Metals master data against real
-- industry structure. Agricultural quality was already well covered
-- generically via product_spec_template/spec_parameter (falling number,
-- gluten %, moisture, protein, etc. — V24/V25), but that system only models
-- loose parameter values, not a genuine GRADE concept: real grain markets
-- (USDA Grades and Standards; CBOT/Euronext delivery specs) trade against a
-- named par grade (e.g. "US No. 2 Yellow Corn") with a published discount or
-- premium schedule for delivering an alternate grade of the same commodity
-- (e.g. US No. 3 Yellow Corn delivers at a fixed cents/bushel discount to
-- the No. 2 par contract).
--
-- Deliberately NOT a per-parameter discount schedule (that would duplicate
-- product_spec_value) — this is the commercial layer: named grade, whether
-- it's the contract par grade, and the flat price adjustment vs. par. The
-- parameter-level detail behind why a grade is what it is stays in
-- product_spec_template/spec_parameter, unchanged.
--
-- Linked from commodity_family (not product) since a grade standard is a
-- market/commodity-level convention that can apply across every product
-- sharing that family, same scoping as commodity_family itself.
-- =============================================================================

USE ETRM_DB;
GO

IF OBJECT_ID('dbo.commodity_grade_standard', 'U') IS NOT NULL DROP TABLE dbo.commodity_grade_standard;
GO

CREATE TABLE dbo.commodity_grade_standard (
    grade_standard_id       INT             NOT NULL IDENTITY(1,1),
    commodity_family_id        INT             NOT NULL,
    issuing_body                  VARCHAR(50)     NOT NULL,   -- 'USDA','CBOT','EURONEXT','ICE', etc.
    grade_code                       VARCHAR(30)     NOT NULL,
    grade_name                          VARCHAR(150)    NOT NULL,
    is_par_grade                          BIT             NOT NULL DEFAULT 0,   -- the grade the futures/benchmark contract settles at; exactly one TRUE per commodity_family in practice, not DB-enforced
    price_adjustment_per_uom                 DECIMAL(10,4)   NOT NULL DEFAULT 0,   -- vs. the par grade; negative = discount, positive = premium, 0 for the par grade itself
    adjustment_currency_code                    CHAR(3)         NULL,
    adjustment_uom_code                            VARCHAR(20)     NULL,   -- e.g. 'BUSHEL','MT' — the unit the adjustment is quoted per
    description                                       VARCHAR(500)    NULL,
    is_active                                            BIT             NOT NULL DEFAULT 1,
    created_at                                              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                              VARCHAR(100)    NOT NULL,
    updated_at                                                DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                                  VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_commodity_grade_standard   PRIMARY KEY (grade_standard_id),
    CONSTRAINT uq_cgs_code                       UNIQUE      (commodity_family_id, grade_code),
    CONSTRAINT fk_cgs_commodity_family              FOREIGN KEY (commodity_family_id) REFERENCES dbo.commodity_family(commodity_family_id)
);
GO
CREATE INDEX ix_cgs_family ON dbo.commodity_grade_standard (commodity_family_id, is_active);
GO

-- =============================================================================
-- Seed: CBOT No. 2 Yellow Corn (par) + No. 3 discount, matching the existing
-- CBOT-CORN product's gradeCode = 'US_GRADE_2_YELLOW' (V59 commodity_family
-- seed: family_code = 'GRAINS', under the AGRI commodity).
-- =============================================================================
INSERT INTO dbo.commodity_grade_standard (commodity_family_id, issuing_body, grade_code, grade_name, is_par_grade, price_adjustment_per_uom, adjustment_currency_code, adjustment_uom_code, description, created_by, updated_by)
SELECT cf.commodity_family_id, v.issuing_body, v.grade_code, v.grade_name, v.is_par, v.adj, v.ccy, v.uom, v.description, 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('USDA', 'US_NO_2_YELLOW_CORN', 'US No. 2 Yellow Corn',     1, 0.00,  'USD', 'BUSHEL', 'CBOT contract par grade — max 5% damaged kernels, 3% foreign material, 15.5% moisture, test weight 54 lb/bu minimum.'),
    ('USDA', 'US_NO_3_YELLOW_CORN', 'US No. 3 Yellow Corn',     0, -0.04, 'USD', 'BUSHEL', 'Deliverable at a fixed discount to par — max 7% damaged kernels, test weight 52 lb/bu minimum.'),
    ('USDA', 'US_NO_1_YELLOW_CORN', 'US No. 1 Yellow Corn',     0, 0.02,  'USD', 'BUSHEL', 'Deliverable at a premium to par — max 3% damaged kernels, test weight 56 lb/bu minimum.')
) AS v(issuing_body, grade_code, grade_name, is_par, adj, ccy, uom, description)
JOIN dbo.commodity_family cf ON cf.family_code = 'GRAINS';
GO

-- =============================================================================
-- Register in master data registry (Static Data page).
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'commodity_grade_standard')
INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES ('commodity_grade_standard', 'Commodity Grade Standards', 'Products & Markets', 1, 1, 1, 0, 6, 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'V67 — COMMODITY_GRADE_STANDARD APPLIED';
PRINT '  commodity_grade_standard — NEW table, 3 rows seeded under AGRI_GRAINS (USDA corn grades).';
PRINT '============================================================';
GO
