-- V189: incoterm_id on tax_rule/customs_duty_rule, dbo.product_hs_code
--
-- Two gaps raised 2026-08-06 reviewing V188:
--
-- 1. Incoterm was missing. Researched externally (general trade-compliance
--    knowledge, no vendor names): Incoterm directly decides who is liable
--    for import duty/VAT (DDP = seller is the importer of record and pays;
--    every other Incoterm = buyer pays) and whether freight/insurance are
--    included in the customs value base used to calculate duty. That's
--    load-bearing for rule matching, not a cosmetic field. dbo.incoterm
--    already exists (V-era table, 11 real standard codes EXW/FCA/CPT/CIP/
--    DAP/DPU/DDP/FAS/FOB/CFR/CIF) — both dbo.tax_rule and
--    dbo.customs_duty_rule gain a nullable incoterm_id FK to it.
--
-- 2. customs_duty_rule.hs_code was free text glued directly to product_id.
--    Wrong shape: a single ETRM product (e.g. "Copper") maps to MANY real
--    HS/CN classifications (ore, concentrate, cathode, wire rod), each
--    dutied differently — cramming that into the rule row means duplicating
--    every other matching dimension (origin/destination/counterparty/
--    movement status) just to vary the HS code, and free text can drift out
--    of sync with product_id with nothing to stop it. Fixed by extracting a
--    proper dbo.product_hs_code classification table (product_id + hs_code
--    + description, one product -> many HS rows) and pointing
--    customs_duty_rule at product_hs_code_id instead of a raw hs_code
--    string. product_id stays on customs_duty_rule too (nullable, broader —
--    "any HS classification of this product") alongside the narrower
--    optional product_hs_code_id, same broad-vs-narrow pattern tax_rule
--    already uses for country_id vs. more specific dimensions.
--
-- Both dbo.tax_rule and dbo.customs_duty_rule have 0 real rows as of this
-- migration (built same session, no live rules entered yet) -- safe to
-- alter/drop the free-text column directly rather than migrate data.

-- =============================================================================
-- 1. incoterm_id on tax_rule + customs_duty_rule
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.tax_rule') AND name = 'incoterm_id')
BEGIN
    ALTER TABLE dbo.tax_rule ADD incoterm_id INT NULL;
    ALTER TABLE dbo.tax_rule ADD CONSTRAINT fk_tax_rule_incoterm FOREIGN KEY (incoterm_id) REFERENCES dbo.incoterm(incoterm_id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.customs_duty_rule') AND name = 'incoterm_id')
BEGIN
    ALTER TABLE dbo.customs_duty_rule ADD incoterm_id INT NULL;
    ALTER TABLE dbo.customs_duty_rule ADD CONSTRAINT fk_cdr_incoterm FOREIGN KEY (incoterm_id) REFERENCES dbo.incoterm(incoterm_id);
END
GO

-- =============================================================================
-- 2. product_hs_code -- one product, many real-world HS/CN classifications
-- =============================================================================
IF OBJECT_ID('dbo.product_hs_code', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.product_hs_code (
        product_hs_code_id  INT             NOT NULL IDENTITY(1,1),
        product_id           INT             NOT NULL,
        hs_code               VARCHAR(20)     NOT NULL,
        hs_description         VARCHAR(200)    NULL,
        is_default              BIT             NOT NULL DEFAULT 0,
        is_active               BIT             NOT NULL DEFAULT 1,
        row_version             INT             NOT NULL DEFAULT 0,
        created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by              VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',
        updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_by              VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',

        CONSTRAINT pk_product_hs_code       PRIMARY KEY (product_hs_code_id),
        CONSTRAINT uq_product_hs_code       UNIQUE      (product_id, hs_code),
        CONSTRAINT fk_product_hs_code_product FOREIGN KEY (product_id) REFERENCES dbo.product(product_id)
    );
END
GO

-- =============================================================================
-- 3. customs_duty_rule: drop free-text hs_code, add product_hs_code_id FK
-- =============================================================================
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.customs_duty_rule') AND name = 'hs_code')
BEGIN
    ALTER TABLE dbo.customs_duty_rule DROP COLUMN hs_code;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.customs_duty_rule') AND name = 'product_hs_code_id')
BEGIN
    ALTER TABLE dbo.customs_duty_rule ADD product_hs_code_id INT NULL;
    ALTER TABLE dbo.customs_duty_rule ADD CONSTRAINT fk_cdr_product_hs_code FOREIGN KEY (product_hs_code_id) REFERENCES dbo.product_hs_code(product_hs_code_id);
END
GO

-- =============================================================================
-- 4. master_data_table_registry catalog entry
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'product_hs_code')
BEGIN
    INSERT INTO dbo.master_data_table_registry
        (table_name, display_name, module_group, sub_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
    VALUES
        ('product_hs_code', 'Product HS Codes', 'Finance & Settlement', 'Tax & Duty Rules', 1, 1, 0, 0, 13, 'SYSTEM', 'SYSTEM');
END
GO
