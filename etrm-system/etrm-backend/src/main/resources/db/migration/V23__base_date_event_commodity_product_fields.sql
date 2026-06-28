-- =============================================================================
-- V23 — Base Date Event / BDC lookup tables + Commodity + Product field additions
--
-- 1. CREATE base_date_event_type    — parent lookup for payment date anchors
-- 2. CREATE business_day_convention_type — parent lookup for BD rolling rules
-- 3. ALTER commodity  — add commodity_subtype, default_uom_id, default_currency_id
-- 4. ALTER product    — add grade_code, product_family, bloomberg_ticker,
--                       reuters_ric, platts_code, is_exchange_traded, is_otc
-- =============================================================================

-- =============================================================================
-- 1. BASE_DATE_EVENT_TYPE
-- The anchor event from which a payment date is calculated.
-- Used as a lookup by the payment_term.base_date_event column (VARCHAR).
-- The lookup table drives the UI dropdown; the CHECK constraint (added in V22)
-- enforces data integrity in the database.
-- =============================================================================
IF OBJECT_ID('dbo.base_date_event_type', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.base_date_event_type (
        base_date_event_type_id INT          NOT NULL IDENTITY(1,1),
        type_code               VARCHAR(30)  NOT NULL,   -- must match payment_term.base_date_event CHECKs
        type_name               VARCHAR(100) NOT NULL,
        description             VARCHAR(500) NULL,
        applicable_commodity    VARCHAR(200) NULL,       -- comma-separated hints for UX
        sort_order              SMALLINT     NOT NULL DEFAULT 0,
        is_active               BIT          NOT NULL DEFAULT 1,

        CONSTRAINT pk_bde_type      PRIMARY KEY (base_date_event_type_id),
        CONSTRAINT uq_bde_type_code UNIQUE      (type_code)
    );
END
GO

INSERT INTO dbo.base_date_event_type
    (type_code, type_name, description, applicable_commodity, sort_order)
VALUES
('INVOICE_DATE',            'Invoice Date',
 'Payment date calculated from the date the invoice is issued. Standard for most commercial trades.',
 'All commodities', 10),

('TRADE_DATE',              'Trade Date',
 'Payment date anchored to the date the trade was executed. Common for financial instruments and short-dated settlements.',
 'Financial, Metals', 20),

('DELIVERY_DATE',           'Delivery Date',
 'Payment date calculated from the date of physical delivery or transfer of title.',
 'Oil, Agricultural, Metals', 30),

('END_OF_DELIVERY_MONTH',   'End of Delivery Month',
 'Payment date anchored to the last calendar day of the delivery period month. Standard for pipeline gas and power contracts (e.g. M+20 or M+1 DOM 20).',
 'Gas, Power', 40),

('BL_DATE',                 'Bill of Lading Date',
 'Payment date anchored to the date the Bill of Lading is issued — typically the date cargo loading is completed. Dominant for crude oil and LNG cargo trades.',
 'Crude Oil, LNG, Refined Products', 50),

('NOR_TENDERED',            'NOR Tendered',
 'Payment date anchored to the date/time the vessel tenders Notice of Readiness at the discharge port. Used for tanker demurrage and outturn claims.',
 'Crude Oil, LNG, Tanker', 60),

('COMPLETION_OF_DISCHARGE', 'Completion of Discharge',
 'Payment date anchored to the date cargo offloading is fully completed at the discharge terminal.',
 'Crude Oil, LNG, Product Tankers', 70),

('OUTTURN_DATE',            'Outturn Date',
 'Payment date anchored to the pipeline outturn confirmation date — when measured volume is certified.',
 'Pipeline Gas, Crude Oil', 80),

('PRICING_DATE',            'Pricing / Prompt Date',
 'Payment date anchored to the pricing or LME prompt date. Standard for exchange-traded metals (LME T+2 business days).',
 'Metals, Exchange-Traded', 90),

('METER_READ_DATE',         'Meter Read Date',
 'Payment date anchored to the date of metered quantity confirmation. Used in regulated gas and power supply contracts.',
 'Gas, Power, Utilities', 100),

('SETTLEMENT_DATE',         'Settlement Date',
 'Payment date anchored to the financial settlement date of the underlying instrument. Used for cleared swaps and futures.',
 'Financial Swaps, Futures, Cleared', 110);
GO

-- =============================================================================
-- 2. BUSINESS_DAY_CONVENTION_TYPE
-- How to roll a calculated payment date when it falls on a non-business day.
-- Used as a lookup by payment_term.business_day_convention (VARCHAR).
-- =============================================================================
IF OBJECT_ID('dbo.business_day_convention_type', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.business_day_convention_type (
        bdc_type_id  INT          NOT NULL IDENTITY(1,1),
        type_code    VARCHAR(20)  NOT NULL,
        type_name    VARCHAR(100) NOT NULL,
        description  VARCHAR(500) NULL,
        sort_order   SMALLINT     NOT NULL DEFAULT 0,
        is_active    BIT          NOT NULL DEFAULT 1,

        CONSTRAINT pk_bdc_type      PRIMARY KEY (bdc_type_id),
        CONSTRAINT uq_bdc_type_code UNIQUE      (type_code)
    );
END
GO

INSERT INTO dbo.business_day_convention_type (type_code, type_name, description, sort_order)
VALUES
('UNADJUSTED',    'Unadjusted',
 'No adjustment — payment falls on the calculated date even if it is a holiday or weekend. Rare in practice.',
 10),
('FOLLOWING',     'Following',
 'If the calculated date is a non-business day, roll forward to the next business day. May cross into the next calendar month.',
 20),
('MOD_FOLLOWING', 'Modified Following',
 'Roll forward to the next business day unless it would cross into the next calendar month, in which case roll backward. The most common convention in commodity trading.',
 30),
('PRECEDING',     'Preceding',
 'If the calculated date is a non-business day, roll backward to the previous business day.',
 40),
('MOD_PRECEDING', 'Modified Preceding',
 'Roll backward to the previous business day unless it would cross into the prior calendar month, in which case roll forward.',
 50);
GO

-- =============================================================================
-- 3. ALTER COMMODITY — add subtype, default UoM and currency
-- =============================================================================
ALTER TABLE dbo.commodity
    ADD commodity_subtype    VARCHAR(30)  NULL,   -- e.g. CRUDE | REFINED | NGL for OIL
        default_uom_id       INT          NULL,
        default_currency_id  INT          NULL;
GO

ALTER TABLE dbo.commodity
    ADD CONSTRAINT chk_commodity_subtype CHECK (commodity_subtype IN (
            -- Oil subtypes
            'CRUDE', 'REFINED', 'NGL', 'CONDENSATE', 'PETROCHEMICAL',
            -- Gas subtypes
            'PIPELINE_GAS', 'LNG', 'LPG', 'NGL_GAS', 'BIOGAS',
            -- Power subtypes
            'ELECTRICITY', 'RENEWABLE', 'NUCLEAR',
            -- Agricultural subtypes
            'GRAINS', 'OILSEEDS', 'SOFTS', 'LIVESTOCK', 'DAIRY',
            -- Metals subtypes
            'BASE_METAL', 'PRECIOUS_METAL', 'FERROUS', 'MINOR_METAL',
            -- Generic
            'OTHER'
        )),
        CONSTRAINT fk_commodity_default_uom FOREIGN KEY (default_uom_id)
            REFERENCES dbo.unit_of_measure(uom_id),
        CONSTRAINT fk_commodity_default_ccy FOREIGN KEY (default_currency_id)
            REFERENCES dbo.currency(currency_id);
GO

-- Update existing commodity rows with sensible subtypes and defaults
UPDATE dbo.commodity SET commodity_subtype = 'CRUDE'        WHERE commodity_code = 'OIL';
UPDATE dbo.commodity SET commodity_subtype = 'ELECTRICITY'  WHERE commodity_code = 'POWER';
UPDATE dbo.commodity SET commodity_subtype = 'PIPELINE_GAS' WHERE commodity_code = 'GAS';
UPDATE dbo.commodity SET commodity_subtype = 'GRAINS'       WHERE commodity_code = 'AGRI';
UPDATE dbo.commodity SET commodity_subtype = 'BASE_METAL'   WHERE commodity_code = 'METALS';
GO

-- =============================================================================
-- 4. ALTER PRODUCT — add grade, product family, vendor identifiers, flags
-- =============================================================================
ALTER TABLE dbo.product
    ADD grade_code           VARCHAR(30)  NULL,   -- e.g. LIGHT_SWEET, HEAVY_SOUR, GRADE_A
        product_family       VARCHAR(50)  NULL,   -- e.g. CRUDE_OIL, REFINED_PRODUCTS, BASE_METALS
        bloomberg_ticker     VARCHAR(50)  NULL,   -- e.g. CO1 Comdty, CL1 Comdty
        reuters_ric          VARCHAR(50)  NULL,   -- e.g. LCOc1, CLc1, MCUCASH=
        platts_code          VARCHAR(50)  NULL,   -- e.g. AAWLD00 (Platts page/code)
        is_exchange_traded   BIT          NOT NULL DEFAULT 0,
        is_otc               BIT          NOT NULL DEFAULT 1,
        updated_at           DATETIME2    NULL    DEFAULT SYSUTCDATETIME(),
        updated_by           VARCHAR(100) NULL;
GO

-- Backfill existing product rows with known vendor identifiers
UPDATE dbo.product SET
    product_family     = 'CRUDE_OIL',
    grade_code         = 'LIGHT_SWEET',
    bloomberg_ticker   = 'CO1 Comdty',
    reuters_ric        = 'LCOc1',
    platts_code        = 'AAWLD00',
    is_exchange_traded = 0, is_otc = 1
WHERE product_code = 'BRENT-CRUDE';

UPDATE dbo.product SET
    product_family     = 'CRUDE_OIL',
    grade_code         = 'LIGHT_SWEET',
    bloomberg_ticker   = 'CL1 Comdty',
    reuters_ric        = 'CLc1',
    platts_code        = 'PCAAS00',
    is_exchange_traded = 0, is_otc = 1
WHERE product_code = 'WTI-CRUDE';

UPDATE dbo.product SET
    product_family     = 'CRUDE_OIL',
    bloomberg_ticker   = 'CO1 Comdty',
    reuters_ric        = 'LCOc1',
    is_exchange_traded = 1, is_otc = 0
WHERE product_code = 'BRENT-FUTURES';

UPDATE dbo.product SET
    product_family     = 'NATURAL_GAS',
    bloomberg_ticker   = 'TTF1 Comdty',
    reuters_ric        = 'TTFc1',
    is_exchange_traded = 1, is_otc = 1
WHERE product_code = 'TTF-GAS';

UPDATE dbo.product SET
    product_family     = 'NATURAL_GAS',
    bloomberg_ticker   = 'NBPG1 Comdty',
    reuters_ric        = 'NGBOc1',
    is_exchange_traded = 0, is_otc = 1
WHERE product_code = 'NBP-GAS';

UPDATE dbo.product SET
    product_family     = 'BASE_METALS',
    grade_code         = 'GRADE_A',
    bloomberg_ticker   = 'LMCADS03 Comdty',
    reuters_ric        = 'MCUCASH=',
    is_exchange_traded = 1, is_otc = 0
WHERE product_code = 'LME-COPPER';

UPDATE dbo.product SET
    product_family     = 'BASE_METALS',
    grade_code         = 'P1020A',
    bloomberg_ticker   = 'LMALDS03 Comdty',
    reuters_ric        = 'MALCASH=',
    is_exchange_traded = 1, is_otc = 0
WHERE product_code = 'LME-ALUMINIUM';

UPDATE dbo.product SET
    product_family     = 'POWER',
    bloomberg_ticker   = 'PSDE1 Comdty',
    is_exchange_traded = 1, is_otc = 1
WHERE product_code = 'EEX-DE-POWER';
GO
