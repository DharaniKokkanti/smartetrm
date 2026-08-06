-- V188: dbo.customs_movement_status, dbo.tax_rule, dbo.customs_duty_rule
--
-- Requested 2026-08-06: dbo.tax_code (V142) already holds VAT/tax *rates*
-- (VAT-GB-STD 20%, VAT-NL-STD 21%, ZERO-RATED 0%), but nothing decides WHICH
-- rate applies to a given trade, and nothing books the resulting cost.
-- tax_rule is that resolution layer, matching a trade's dimensions
-- (locations, jurisdiction, legal entity, counterparty, product, direction,
-- customs movement status) to a tax_code, with a flag for whether a match
-- should actually generate a bookable authority-cost line (some matches —
-- e.g. a local intra-jurisdiction transfer — are informational only and
-- must NOT generate a cost). customs_duty_rule is the equivalent for import/
-- export customs duty, a materially different concept from VAT/tax (duty is
-- an origin/destination country PAIR plus a commodity-specific rate, not a
-- single jurisdiction rate) that had zero master data before this migration
-- (pipeline_tariff/road_tariff are transport tariffs, not customs duty;
-- custom_field_definition is the unrelated generic custom-fields system).
--
-- customs_movement_status (T1/T2/T2L/EU/NON_T1) — researched 2026-08-06
-- (general customs-industry knowledge, no vendor names): T1 = non-Community/
-- non-EU goods in transit, duty and import VAT not yet accounted for; T2 =
-- Community/EU goods in free circulation, duty/VAT already accounted for;
-- T2L = proof-of-Community-status document for goods not moving under a
-- transit procedure. This status is the single biggest driver of whether
-- VAT/duty applies at all, so both tax_rule and customs_duty_rule share the
-- same lookup rather than each inventing their own.
--
-- tax_authority_id (from the original field list) deliberately NOT added as
-- a new FK/table this migration — no dbo.tax_authority master table exists
-- yet (tax_registration.issuing_authority is free text) and that decision
-- wasn't confirmed. Both new rule tables get an issuing_authority free-text
-- column instead (same shape as tax_registration), upgradeable to a real FK
-- later without a breaking change if a tax_authority table gets built.
--
-- priority: added beyond the original field list — with this many nullable
-- matching dimensions, more than one rule can legitimately match the same
-- trade (e.g. a country-level rule and a more specific counterparty-level
-- rule); priority (higher wins) is the standard way rule-resolution tables
-- avoid an unresolvable tie, not a speculative extra.

-- =============================================================================
-- 1. customs_movement_status -- lookup, shared by tax_rule + customs_duty_rule
-- =============================================================================
IF OBJECT_ID('dbo.customs_movement_status', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.customs_movement_status (
        customs_movement_status_id INT             NOT NULL IDENTITY(1,1),
        status_code                 VARCHAR(20)     NOT NULL,
        status_name                 VARCHAR(100)    NOT NULL,
        description                 VARCHAR(500)    NULL,
        sort_order                  TINYINT         NOT NULL DEFAULT 0,
        is_active                   BIT             NOT NULL DEFAULT 1,
        row_version                 INT             NOT NULL DEFAULT 0,
        created_at                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by                  VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',
        updated_at                  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_by                  VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',

        CONSTRAINT pk_customs_movement_status  PRIMARY KEY (customs_movement_status_id),
        CONSTRAINT uq_customs_movement_status  UNIQUE      (status_code)
    );
END
GO

INSERT INTO dbo.customs_movement_status (status_code, status_name, description, sort_order, created_by, updated_by)
SELECT v.status_code, v.status_name, v.description, v.sort_order, 'SYSTEM', 'SYSTEM'
FROM (VALUES
    ('T1',      'T1 - Non-Union Transit',    'Non-Community/non-EU goods in transit; duty and import VAT not yet accounted for', 1),
    ('T2',      'T2 - Union Goods',          'Community/EU goods in free circulation; duty and VAT already accounted for',       2),
    ('T2L',     'T2L - Proof of Union Status','Proof-of-Community-status document for goods not moving under a transit procedure',3),
    ('EU',      'EU / Intra-Community',      'Intra-EU movement, no import formalities',                                         4),
    ('NON_T1',  'Non-T1 (Domestic/Cleared)', 'Goods already cleared/domestic; not subject to T1 transit control',               5)
) AS v(status_code, status_name, description, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM dbo.customs_movement_status s WHERE s.status_code = v.status_code);
GO

-- =============================================================================
-- 2. tax_rule -- resolves which tax_code applies to a trade, and whether it
--    should actually generate a bookable authority-cost line
-- =============================================================================
IF OBJECT_ID('dbo.tax_rule', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tax_rule (
        tax_rule_id                 INT             NOT NULL IDENTITY(1,1),
        rule_name                   VARCHAR(200)    NOT NULL,
        load_location_id            INT             NULL,
        disch_location_id           INT             NULL,
        country_id                  INT             NULL,
        legal_entity_id              INT             NULL,
        counterparty_id              INT             NULL,
        product_id                   INT             NULL,
        direction                    VARCHAR(10)     NOT NULL DEFAULT 'BOTH'
            CONSTRAINT chk_tax_rule_direction CHECK (direction IN ('BUY','SELL','BOTH')),
        customs_movement_status_id   INT             NULL,
        tax_code_id                  INT             NOT NULL,
        -- False for a rule that matches but must NOT generate a bookable
        -- authority cost (e.g. a local same-jurisdiction transfer).
        cost_applicable_ind          BIT             NOT NULL DEFAULT 1,
        issuing_authority             VARCHAR(100)    NULL,
        priority                      SMALLINT        NOT NULL DEFAULT 0,
        valid_from                    DATE            NULL,
        valid_to                      DATE            NULL,
        is_active                     BIT             NOT NULL DEFAULT 1,
        notes                         VARCHAR(500)    NULL,
        row_version                   INT             NOT NULL DEFAULT 0,
        created_at                    DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by                    VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',
        updated_at                    DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_by                    VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',

        CONSTRAINT pk_tax_rule                  PRIMARY KEY (tax_rule_id),
        CONSTRAINT fk_tax_rule_load_loc          FOREIGN KEY (load_location_id)          REFERENCES dbo.location(location_id),
        CONSTRAINT fk_tax_rule_disch_loc         FOREIGN KEY (disch_location_id)         REFERENCES dbo.location(location_id),
        CONSTRAINT fk_tax_rule_country           FOREIGN KEY (country_id)                REFERENCES dbo.country(country_id),
        CONSTRAINT fk_tax_rule_legal_entity      FOREIGN KEY (legal_entity_id)           REFERENCES dbo.legal_entity(legal_entity_id),
        CONSTRAINT fk_tax_rule_counterparty      FOREIGN KEY (counterparty_id)           REFERENCES dbo.counterparty(counterparty_id),
        CONSTRAINT fk_tax_rule_product           FOREIGN KEY (product_id)                REFERENCES dbo.product(product_id),
        CONSTRAINT fk_tax_rule_movement_status   FOREIGN KEY (customs_movement_status_id) REFERENCES dbo.customs_movement_status(customs_movement_status_id),
        CONSTRAINT fk_tax_rule_tax_code          FOREIGN KEY (tax_code_id)               REFERENCES dbo.tax_code(tax_code_id)
    );

    CREATE INDEX ix_tax_rule_matching ON dbo.tax_rule (country_id, legal_entity_id, counterparty_id, product_id, is_active);
END
GO

-- =============================================================================
-- 3. customs_duty_rule -- import/export duty, keyed by origin/destination
--    country PAIR + commodity, a materially different shape from tax_rule
-- =============================================================================
IF OBJECT_ID('dbo.customs_duty_rule', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.customs_duty_rule (
        customs_duty_rule_id        INT             NOT NULL IDENTITY(1,1),
        rule_name                    VARCHAR(200)    NOT NULL,
        origin_country_id             INT             NULL,
        destination_country_id        INT             NULL,
        load_location_id              INT             NULL,
        disch_location_id             INT             NULL,
        product_id                    INT             NULL,
        legal_entity_id                INT             NULL,
        counterparty_id                INT             NULL,
        direction                      VARCHAR(10)     NOT NULL DEFAULT 'BOTH'
            CONSTRAINT chk_customs_duty_rule_direction CHECK (direction IN ('BUY','SELL','BOTH')),
        customs_movement_status_id     INT             NULL,
        -- Ad valorem OR flat-per-unit duty -- real customs schedules use both
        -- depending on commodity; a rule populates one or the other, not both.
        duty_rate_percent               DECIMAL(6,3)    NULL,
        duty_flat_amount                 DECIMAL(18,4)   NULL,
        duty_flat_currency_id             INT             NULL,
        -- Harmonized System / Combined Nomenclature code -- free text, no HS
        -- code master table exists in this schema.
        hs_code                          VARCHAR(20)     NULL,
        cost_applicable_ind               BIT             NOT NULL DEFAULT 1,
        issuing_authority                  VARCHAR(100)    NULL,
        priority                           SMALLINT        NOT NULL DEFAULT 0,
        valid_from                         DATE            NULL,
        valid_to                           DATE            NULL,
        is_active                          BIT             NOT NULL DEFAULT 1,
        notes                               VARCHAR(500)    NULL,
        row_version                         INT             NOT NULL DEFAULT 0,
        created_at                          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        created_by                          VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',
        updated_at                          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_by                          VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',

        CONSTRAINT pk_customs_duty_rule              PRIMARY KEY (customs_duty_rule_id),
        CONSTRAINT fk_cdr_origin_country              FOREIGN KEY (origin_country_id)          REFERENCES dbo.country(country_id),
        CONSTRAINT fk_cdr_destination_country         FOREIGN KEY (destination_country_id)     REFERENCES dbo.country(country_id),
        CONSTRAINT fk_cdr_load_loc                    FOREIGN KEY (load_location_id)           REFERENCES dbo.location(location_id),
        CONSTRAINT fk_cdr_disch_loc                   FOREIGN KEY (disch_location_id)          REFERENCES dbo.location(location_id),
        CONSTRAINT fk_cdr_product                     FOREIGN KEY (product_id)                 REFERENCES dbo.product(product_id),
        CONSTRAINT fk_cdr_legal_entity                FOREIGN KEY (legal_entity_id)            REFERENCES dbo.legal_entity(legal_entity_id),
        CONSTRAINT fk_cdr_counterparty                FOREIGN KEY (counterparty_id)            REFERENCES dbo.counterparty(counterparty_id),
        CONSTRAINT fk_cdr_movement_status              FOREIGN KEY (customs_movement_status_id) REFERENCES dbo.customs_movement_status(customs_movement_status_id),
        CONSTRAINT fk_cdr_flat_currency                FOREIGN KEY (duty_flat_currency_id)      REFERENCES dbo.currency(currency_id),
        CONSTRAINT chk_cdr_rate_shape CHECK (
            (duty_rate_percent IS NOT NULL AND duty_flat_amount IS NULL)
            OR (duty_rate_percent IS NULL AND duty_flat_amount IS NOT NULL)
            OR (duty_rate_percent IS NULL AND duty_flat_amount IS NULL)
        )
    );

    CREATE INDEX ix_customs_duty_rule_matching ON dbo.customs_duty_rule (origin_country_id, destination_country_id, product_id, is_active);
END
GO

-- =============================================================================
-- 4. master_data_table_registry catalog entries
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'customs_movement_status')
BEGIN
    INSERT INTO dbo.master_data_table_registry
        (table_name, display_name, module_group, sub_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
    VALUES
        ('customs_movement_status', 'Customs Movement Status', 'Finance & Settlement', 'Tax & Duty Rules', 1, 1, 0, 0, 10, 'SYSTEM', 'SYSTEM');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'tax_rule')
BEGIN
    INSERT INTO dbo.master_data_table_registry
        (table_name, display_name, module_group, sub_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
    VALUES
        ('tax_rule', 'Tax Rules', 'Finance & Settlement', 'Tax & Duty Rules', 1, 1, 0, 0, 11, 'SYSTEM', 'SYSTEM');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'customs_duty_rule')
BEGIN
    INSERT INTO dbo.master_data_table_registry
        (table_name, display_name, module_group, sub_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
    VALUES
        ('customs_duty_rule', 'Customs Duty Rules', 'Finance & Settlement', 'Tax & Duty Rules', 1, 1, 0, 0, 12, 'SYSTEM', 'SYSTEM');
END
GO
