-- =============================================================================
-- ETRM SYSTEM — PRICING TRIGGER EVENTS, WINDOW RULES & PRICING RULES
-- SQL Server 2022 | Version 1.0 | May 2026
-- =============================================================================
-- TABLES (4 total):
--
--   01. pricing_trigger_event_type    — BL, NOR, COD, DEEMED, ACTUAL_DATE etc.
--   02. pricing_window_rule           — how pricing period built around trigger
--   03. pricing_trigger_product       — valid triggers per product/market
--   04. pricing_rule                  — complete assembled pricing rule per
--                                       product/market/incoterm combination
--
-- =============================================================================
-- CONCEPTS:
--
-- pricing_trigger_event_type
--   WHAT happened to anchor the pricing date
--   e.g. BL issued, NOR tendered, COD commenced, deemed date applied
--
-- pricing_window_rule
--   HOW MANY DAYS around that anchor are included in the average
--   e.g. BL -1/0/+1 = 3-day symmetric window
--        COD 0/+1/+2/+3/+4 = 5-day forward window
--        Monthly average = all trading days of delivery month
--
-- pricing_trigger_product
--   WHICH triggers are valid for WHICH product on WHICH market
--   e.g. BL valid for Dated Brent on ICE but not for TTF Gas
--
-- pricing_rule
--   THE COMPLETE ASSEMBLED RULE combining:
--     product + market + incoterm + pricing_type
--     + primary trigger + fallback trigger
--     + pricing window
--     + formula template (if applicable)
--     + price index
--     + fallback behaviour
--   This is what gets stamped on a trade at capture time.
--
-- =============================================================================
-- Run AFTER:
--   etrm_master_data_v2.0.sql
--   etrm_market_source_period_v1.0.sql
--   etrm_financial_operational_v1.0.sql
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- CLEANUP
-- =============================================================================
IF OBJECT_ID('dbo.pricing_rule',                   'U') IS NOT NULL DROP TABLE dbo.pricing_rule;
IF OBJECT_ID('dbo.pricing_trigger_product',        'U') IS NOT NULL DROP TABLE dbo.pricing_trigger_product;
IF OBJECT_ID('dbo.pricing_window_rule',            'U') IS NOT NULL DROP TABLE dbo.pricing_window_rule;
IF OBJECT_ID('dbo.pricing_trigger_event_type',     'U') IS NOT NULL DROP TABLE dbo.pricing_trigger_event_type;
GO


-- =============================================================================
-- 01. PRICING_TRIGGER_EVENT_TYPE
-- The real-world event that anchors the pricing date.
-- Reference table — seeded with all standard industry event types.
-- =============================================================================
CREATE TABLE dbo.pricing_trigger_event_type (
    trigger_type_id         INT             NOT NULL IDENTITY(1,1),
    trigger_code            VARCHAR(30)     NOT NULL,
    trigger_name            VARCHAR(200)    NOT NULL,
    trigger_category        VARCHAR(20)     NOT NULL
        CONSTRAINT chk_ptet_cat CHECK (trigger_category IN (
            'DOCUMENTARY',  -- physical document event: BL, NOR, COD etc.
            'DEEMED',       -- contractual fallback date: DEEMED_BL, DEEMED_ARRIVAL
            'TIME_BASED',   -- calendar date: ACTUAL_DATE, PRICING_PERIOD_START
            'SETTLEMENT',   -- settlement event: INVOICE_DATE, PAYMENT_DATE
            'INSPECTION',   -- survey/inspection: INSPECTION_DATE, OUTTURN_DATE
            'EXCHANGE'      -- exchange event: EXPIRY_DATE, FIXING_DATE
        )),
    -- Which MOT types this trigger is applicable to
    -- NULL = applicable to all MOT types
    applicable_mot_codes    VARCHAR(100)    NULL,
    -- CSV e.g. 'VESSEL,BARGE' — BL only applies to sea transport
    -- NULL = all MOT types (e.g. ACTUAL_DATE, CONTRACTUAL_DATE)

    -- Which commodity types this trigger applies to
    -- NULL = all commodities
    applicable_commodities  VARCHAR(100)    NULL,
    -- CSV e.g. 'OIL,GAS'

    -- Operational behaviour
    requires_physical_confirmation BIT      NOT NULL DEFAULT 0,
    -- TRUE  = ops must confirm this event happened before pricing proceeds
    --         e.g. BL date confirmed by operations team / document
    -- FALSE = date determined algorithmically or agreed at trade time
    --         e.g. ACTUAL_DATE, DEEMED_BL, PUBLICATION_DATE

    is_fallback_type        BIT             NOT NULL DEFAULT 0,
    -- TRUE = this is a fallback/deemed event used when primary not available
    -- e.g. DEEMED_BL, DEEMED_ARRIVAL, CONTRACTUAL_DATE

    is_system_generated     BIT             NOT NULL DEFAULT 0,
    -- TRUE = date set automatically by system
    -- e.g. PUBLICATION_DATE, EXPIRY_DATE (from market_product_period)
    -- FALSE = date set by operations

    -- How many days after cargo event the pricing date is typically known
    typical_confirmation_days SMALLINT      NULL,
    -- e.g. BL = 0 (known same day)
    --      NOR = 0
    --      COD = 1 (confirmed day after discharge commences)

    -- Sequencing — in a cargo lifecycle, what order do these events occur?
    -- Used to validate that NOR comes before COL, COL before BL, BL before COD
    lifecycle_sequence      TINYINT         NULL,
    -- 10=NOR, 20=LAYCAN_START, 30=COL, 40=EOL, 50=BL, 60=ETA_DISCHARGE,
    -- 70=NOR_DISCHARGE, 80=COD, 90=EOD_DISCHARGE, 100=OUTTURN

    description             VARCHAR(500)    NULL,
    is_active               BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_ptet              PRIMARY KEY (trigger_type_id),
    CONSTRAINT uq_ptet_code         UNIQUE      (trigger_code)
);
GO
CREATE INDEX ix_ptet_category ON dbo.pricing_trigger_event_type
    (trigger_category, is_active) INCLUDE (trigger_code, trigger_name);
GO


-- =============================================================================
-- 02. PRICING_WINDOW_RULE
-- Defines how the pricing period is constructed around a trigger event.
-- Named rules — reusable across multiple products.
-- e.g. '3DAY_SYMMETRIC'    = trigger -1 / trigger / trigger +1
--      '5DAY_FORWARD'      = trigger / trigger+1 / trigger+2 / trigger+3 / trigger+4
--      'DELIVERY_MONTH'    = all trading days of delivery month
--      'SINGLE_DAY'        = trigger date only
--      'CUSTOM_WINDOW'     = bespoke window defined at trade level
-- =============================================================================
CREATE TABLE dbo.pricing_window_rule (
    window_rule_id          INT             NOT NULL IDENTITY(1,1),
    commodity_type          VARCHAR(20)     NULL,   -- NULL = all commodities
    rule_code               VARCHAR(30)     NOT NULL,
    rule_name               VARCHAR(200)    NOT NULL,

    -- Window type
    window_type             VARCHAR(30)     NOT NULL
        CONSTRAINT chk_pwr_type CHECK (window_type IN (
            'SINGLE_DAY',       -- trigger date only
            'SYMMETRIC',        -- N days before and after trigger
            'FORWARD',          -- N days starting from trigger
            'BACKWARD',         -- N days ending at trigger
            'DELIVERY_MONTH',   -- all qualifying days of delivery month
            'DELIVERY_PERIOD',  -- all qualifying days of delivery period
            'FIXED_DATES',      -- specific dates agreed at trade time
            'CUSTOM'            -- defined at trade level
        )),

    -- Window size
    days_before             SMALLINT        NOT NULL DEFAULT 0,
    -- number of days BEFORE trigger date included
    days_after              SMALLINT        NOT NULL DEFAULT 0,
    -- number of days AFTER trigger date included
    -- total fixings = days_before + 1 (trigger) + days_after
    -- for DELIVERY_MONTH/PERIOD: days_before/after ignored

    -- Which days count as valid fixing days
    day_count_type          VARCHAR(20)     NOT NULL DEFAULT 'BUSINESS'
        CONSTRAINT chk_pwr_daytype CHECK (day_count_type IN (
            'CALENDAR',         -- every calendar day
            'BUSINESS',         -- business days per calendar_id
            'TRADING',          -- exchange trading days per market
            'PUBLICATION'       -- days the price source publishes
        )),
    calendar_id             INT             NULL,   -- holiday calendar for BUSINESS days
    market_id               INT             NULL,   -- market for TRADING days

    -- Minimum fixings required to calculate valid average
    min_fixings_required    SMALLINT        NOT NULL DEFAULT 1,
    -- if fewer valid fixings than this → trigger missing_fixing_rule

    -- What to do when a fixing is missing / not published
    missing_fixing_rule     VARCHAR(20)     NOT NULL DEFAULT 'PRIOR_DAY'
        CONSTRAINT chk_pwr_missing CHECK (missing_fixing_rule IN (
            'PRIOR_DAY',        -- use most recent prior valid fixing
            'NEXT_DAY',         -- use next available fixing
            'BACKUP_SOURCE',    -- use backup price source
            'INTERPOLATE',      -- linear interpolation between adjacent fixings
            'EXCLUDE',          -- exclude that day from average (reduce denominator)
            'SUSPEND',          -- suspend pricing — alert ops, do not calculate
            'ZERO'              -- treat as zero (rare — only for specific products)
        )),
    backup_source_id        INT             NULL,   -- FK price_source if BACKUP_SOURCE

    -- Averaging method
    averaging_method        VARCHAR(20)     NOT NULL DEFAULT 'SIMPLE'
        CONSTRAINT chk_pwr_avg CHECK (averaging_method IN (
            'SIMPLE',           -- equal weight to all days
            'VOLUME_WEIGHTED',  -- weight by daily traded volume
            'CUSTOM_WEIGHTED'   -- bespoke weights defined at trade level
        )),

    -- Rounding
    price_rounding_dp       TINYINT         NOT NULL DEFAULT 2,
    -- decimal places to round final averaged price to

    -- Description
    description             VARCHAR(500)    NULL,
    is_active               BIT             NOT NULL DEFAULT 1,
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_pwr               PRIMARY KEY (window_rule_id),
    CONSTRAINT uq_pwr_code          UNIQUE      (rule_code),
    CONSTRAINT fk_pwr_calendar      FOREIGN KEY (calendar_id)       REFERENCES dbo.holiday_calendar(calendar_id),
    CONSTRAINT fk_pwr_market        FOREIGN KEY (market_id)         REFERENCES dbo.market(market_id),
    CONSTRAINT fk_pwr_backup        FOREIGN KEY (backup_source_id)  REFERENCES dbo.price_source(price_source_id),
    CONSTRAINT chk_pwr_days         CHECK       (days_before >= 0 AND days_after >= 0),
    CONSTRAINT chk_pwr_min_fix      CHECK       (min_fixings_required >= 1)
);
GO
CREATE INDEX ix_pwr_commodity ON dbo.pricing_window_rule (commodity_type, is_active);
GO


-- =============================================================================
-- 03. PRICING_TRIGGER_PRODUCT
-- Which pricing trigger event types are valid for which product on which market.
-- Also links the default pricing window rule for that combination.
-- Prevents traders selecting BL as trigger for a gas pipeline trade.
-- =============================================================================
CREATE TABLE dbo.pricing_trigger_product (
    ptp_id                  INT             NOT NULL IDENTITY(1,1),
    product_id              INT             NOT NULL,
    market_id               INT             NULL,       -- NULL = valid on all markets
    trigger_type_id         INT             NOT NULL,
    -- Default window rule for this product/trigger combination
    -- Can be overridden at trade level
    default_window_rule_id  INT             NULL,
    -- Is this the default trigger for this product/market?
    is_default_trigger      BIT             NOT NULL DEFAULT 0,
    -- Is this a fallback trigger (used when primary not available)?
    is_fallback_trigger     BIT             NOT NULL DEFAULT 0,
    -- Which trigger does this fall back from?
    fallback_for_trigger_id INT             NULL,
    -- Fallback deadline — how many days after cargo event before
    -- fallback trigger is applied automatically
    fallback_deadline_days  SMALLINT        NULL,
    -- Pricing type this combination is valid for
    -- NULL = valid for all pricing types
    pricing_type_id         INT             NULL,
    effective_from          DATE            NOT NULL DEFAULT '2020-01-01',
    effective_to            DATE            NULL,
    is_active               BIT             NOT NULL DEFAULT 1,
    notes                   VARCHAR(300)    NULL,

    CONSTRAINT pk_ptp               PRIMARY KEY (ptp_id),
    CONSTRAINT uq_ptp               UNIQUE      (product_id, market_id, trigger_type_id,
                                                 effective_from),
    CONSTRAINT fk_ptp_product       FOREIGN KEY (product_id)            REFERENCES dbo.product(product_id),
    CONSTRAINT fk_ptp_market        FOREIGN KEY (market_id)             REFERENCES dbo.market(market_id),
    CONSTRAINT fk_ptp_trigger       FOREIGN KEY (trigger_type_id)       REFERENCES dbo.pricing_trigger_event_type(trigger_type_id),
    CONSTRAINT fk_ptp_window        FOREIGN KEY (default_window_rule_id) REFERENCES dbo.pricing_window_rule(window_rule_id),
    CONSTRAINT fk_ptp_fallback_for  FOREIGN KEY (fallback_for_trigger_id) REFERENCES dbo.pricing_trigger_event_type(trigger_type_id),
    CONSTRAINT fk_ptp_pricing_type  FOREIGN KEY (pricing_type_id)       REFERENCES dbo.pricing_type(pricing_type_id)
);
GO
CREATE INDEX ix_ptp_product  ON dbo.pricing_trigger_product (product_id, is_active, is_default_trigger);
CREATE INDEX ix_ptp_market   ON dbo.pricing_trigger_product (market_id,  is_active) WHERE market_id IS NOT NULL;
CREATE INDEX ix_ptp_trigger  ON dbo.pricing_trigger_product (trigger_type_id, is_active);
GO


-- =============================================================================
-- 04. PRICING_RULE
-- The complete assembled pricing rule for a product/market/incoterm combination.
-- This is the master record that gets stamped on a trade at capture time.
-- It combines:
--   — which product and market
--   — which incoterm (FOB/CIF/DDP etc. determines which cargo event is relevant)
--   — which pricing type (FLAT/INDEX/DIFFERENTIAL/FORMULA/FLOATING)
--   — which price index (Dated Brent, WTI, TTF etc.)
--   — which formula template (if FORMULA/FLOATING/BLEND)
--   — which primary trigger event (BL, NOR, COD etc.)
--   — which fallback trigger (DEEMED_BL etc.)
--   — which pricing window rule (3-day symmetric, monthly average etc.)
--   — FX handling
--   — rounding and precision
--   — late pricing handling
-- =============================================================================
CREATE TABLE dbo.pricing_rule (
    pricing_rule_id         INT             NOT NULL IDENTITY(1,1),

    -- ── Applicability ─────────────────────────────────────────────────────────
    product_id              INT             NOT NULL,
    market_id               INT             NULL,       -- NULL = all markets
    incoterm_id             INT             NULL,       -- NULL = all incoterms
    -- Different incoterms use different trigger events:
    -- FOB → BL is typical trigger
    -- CIF → COD or NOR at discharge port
    -- DDP → delivery confirmation at buyer's premises

    pricing_type_id         INT             NOT NULL,
    -- FLAT / INDEX / DIFFERENTIAL / FORMULA / FLOATING / TBN

    -- ── Index & formula ───────────────────────────────────────────────────────
    price_index_id          INT             NULL,
    -- Primary price index reference
    -- NULL only if pricing_type = FLAT or TBN

    formula_template_id     INT             NULL,
    -- NULL if pricing_type = FLAT, INDEX, or TBN
    -- Required if pricing_type = FORMULA, FLOATING, or DIFFERENTIAL

    differential_value      DECIMAL(18,6)   NULL,
    -- Fixed differential for DIFFERENTIAL pricing
    -- e.g. -0.50 = Dated Brent minus 50 cents/bbl
    -- Positive = premium, Negative = discount

    differential_currency_id INT            NULL,
    -- Currency of the differential (may differ from trade currency)

    -- ── Pricing trigger ───────────────────────────────────────────────────────
    primary_trigger_id      INT             NULL,
    -- The main pricing trigger event type
    -- NULL only if pricing_type = FLAT (no trigger needed)

    fallback_trigger_id     INT             NULL,
    -- Trigger used if primary not available by fallback_deadline_days
    -- e.g. DEEMED_BL if actual BL not received within 5 days of loading

    fallback_deadline_days  SMALLINT        NULL,
    -- Number of calendar days after estimated primary trigger
    -- before fallback trigger is automatically applied
    -- e.g. 5 = if BL not received within 5 days → apply DEEMED_BL

    fallback_deadline_basis VARCHAR(20)     NULL
        CONSTRAINT chk_pr_fb_basis CHECK (fallback_deadline_basis IN (
            'CALENDAR',     -- calendar days
            'BUSINESS',     -- business days
            'INVOICE_DATE', -- by invoice issue date
            NULL
        )),

    -- ── Pricing window ────────────────────────────────────────────────────────
    window_rule_id          INT             NULL,
    -- How the pricing period is built around the trigger
    -- NULL if pricing_type = FLAT or TBN

    -- ── FX handling ───────────────────────────────────────────────────────────
    index_currency_id       INT             NULL,
    -- Currency the index publishes in
    -- e.g. Dated Brent publishes in USD

    trade_currency_id       INT             NULL,
    -- Currency the trade is denominated in
    -- If different from index_currency → FX conversion required

    fx_conversion_required  BIT             NOT NULL DEFAULT 0,

    fx_fixing_type          VARCHAR(20)     NULL
        CONSTRAINT chk_pr_fx CHECK (fx_fixing_type IN (
            'SPOT',         -- spot rate on pricing date
            'AVERAGE',      -- average rate over pricing period
            'FIXED',        -- fixed rate agreed at trade date
            'ECB_FIXING',   -- ECB official daily fixing
            NULL
        )),

    fx_index_id             INT             NULL,
    -- FK to price_index if FX rate comes from a published fixing
    -- e.g. ECB EUR/USD fixing

    -- ── Late pricing ──────────────────────────────────────────────────────────
    late_pricing_rule       VARCHAR(20)     NULL
        CONSTRAINT chk_pr_late CHECK (late_pricing_rule IN (
            'SUSPEND_INVOICE',  -- hold invoice until pricing complete
            'PROVISIONAL',      -- issue provisional invoice, true-up later
            'ESTIMATED',        -- use estimated price, adjust on actual
            'ESCALATE',         NULL
        )),

    provisional_basis       VARCHAR(20)     NULL
        CONSTRAINT chk_pr_prov CHECK (provisional_basis IN (
            'PRIOR_MONTH_AVG',  -- prior month average of index
            'LAST_KNOWN_FIXING',-- most recent available fixing
            'BUDGET_PRICE',     -- internally agreed budget price
            'AGREED_ESTIMATE',  -- bilaterally agreed estimate
            NULL
        )),

    -- ── Rounding & precision ──────────────────────────────────────────────────
    price_decimal_places    TINYINT         NOT NULL DEFAULT 2,
    quantity_decimal_places TINYINT         NOT NULL DEFAULT 3,
    value_decimal_places    TINYINT         NOT NULL DEFAULT 2,

    rounding_convention     VARCHAR(20)     NOT NULL DEFAULT 'STANDARD'
        CONSTRAINT chk_pr_round CHECK (rounding_convention IN (
            'STANDARD',         -- round half up (standard commercial)
            'BANKER',           -- round half to even (statistical)
            'TRUNCATE',         -- truncate without rounding
            'UP',               -- always round up
            'DOWN'              -- always round down
        )),

    -- ── Invoice timing ────────────────────────────────────────────────────────
    invoice_trigger_id      INT             NULL,
    -- Which event triggers invoice generation
    -- Often different from pricing trigger
    -- e.g. invoice triggered by COD, but pricing based on BL

    invoice_timing_days     SMALLINT        NOT NULL DEFAULT 0,
    -- Days after invoice_trigger that invoice should be issued
    -- 0 = same day as trigger

    invoice_timing_basis    VARCHAR(10)     NOT NULL DEFAULT 'BUSINESS'
        CONSTRAINT chk_pr_inv_basis CHECK (invoice_timing_basis IN (
            'CALENDAR','BUSINESS'
        )),

    invoice_calendar_id     INT             NULL,
    -- Holiday calendar for invoice timing calculation

    -- ── True-up / final invoice ───────────────────────────────────────────────
    requires_final_invoice  BIT             NOT NULL DEFAULT 0,
    -- TRUE if provisional invoice issued first, then true-up invoice
    -- after actual pricing confirmed

    final_invoice_trigger_id INT            NULL,
    -- Event that triggers the final/true-up invoice
    -- e.g. OUTTURN_DATE for metals, last fixing date for average pricing

    -- ── Validity ──────────────────────────────────────────────────────────────
    rule_name               VARCHAR(200)    NOT NULL,
    rule_code               VARCHAR(30)     NOT NULL,
    -- Descriptive name — shown in trade capture UI
    -- e.g. 'Dated Brent FOB 3-day BL Average'
    --      'TTF Monthly Average'
    --      'LME Copper Cash Settlement'

    is_default              BIT             NOT NULL DEFAULT 0,
    -- If TRUE = this is the default rule for this product/market/incoterm
    -- combination — pre-filled in trade capture UI

    effective_from          DATE            NOT NULL DEFAULT '2020-01-01',
    effective_to            DATE            NULL,
    is_active               BIT             NOT NULL DEFAULT 1,
    notes                   VARCHAR(500)    NULL,
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,
    updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_pricing_rule          PRIMARY KEY (pricing_rule_id),
    CONSTRAINT uq_pr_code               UNIQUE      (rule_code),
    CONSTRAINT fk_pr_product            FOREIGN KEY (product_id)            REFERENCES dbo.product(product_id),
    CONSTRAINT fk_pr_market             FOREIGN KEY (market_id)             REFERENCES dbo.market(market_id),
    CONSTRAINT fk_pr_incoterm           FOREIGN KEY (incoterm_id)           REFERENCES dbo.incoterm(incoterm_id),
    CONSTRAINT fk_pr_pricing_type       FOREIGN KEY (pricing_type_id)       REFERENCES dbo.pricing_type(pricing_type_id),
    CONSTRAINT fk_pr_index              FOREIGN KEY (price_index_id)        REFERENCES dbo.price_index(price_index_id),
    CONSTRAINT fk_pr_formula            FOREIGN KEY (formula_template_id)   REFERENCES dbo.formula_template(template_id),
    CONSTRAINT fk_pr_primary_trigger    FOREIGN KEY (primary_trigger_id)    REFERENCES dbo.pricing_trigger_event_type(trigger_type_id),
    CONSTRAINT fk_pr_fallback_trigger   FOREIGN KEY (fallback_trigger_id)   REFERENCES dbo.pricing_trigger_event_type(trigger_type_id),
    CONSTRAINT fk_pr_window             FOREIGN KEY (window_rule_id)        REFERENCES dbo.pricing_window_rule(window_rule_id),
    CONSTRAINT fk_pr_index_ccy         FOREIGN KEY (index_currency_id)     REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_pr_trade_ccy         FOREIGN KEY (trade_currency_id)     REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_pr_fx_index          FOREIGN KEY (fx_index_id)           REFERENCES dbo.price_index(price_index_id),
    CONSTRAINT fk_pr_inv_trigger        FOREIGN KEY (invoice_trigger_id)    REFERENCES dbo.pricing_trigger_event_type(trigger_type_id),
    CONSTRAINT fk_pr_final_trigger      FOREIGN KEY (final_invoice_trigger_id) REFERENCES dbo.pricing_trigger_event_type(trigger_type_id),
    CONSTRAINT fk_pr_inv_calendar       FOREIGN KEY (invoice_calendar_id)   REFERENCES dbo.holiday_calendar(calendar_id),
    CONSTRAINT fk_pr_diff_ccy          FOREIGN KEY (differential_currency_id) REFERENCES dbo.currency(currency_id)
) WITH (DATA_COMPRESSION = ROW);
GO

ALTER TABLE dbo.pricing_rule
    ADD valid_from_sys DATETIME2 GENERATED ALWAYS AS ROW START HIDDEN
            CONSTRAINT df_pr_vf DEFAULT SYSUTCDATETIME(),
        valid_to_sys   DATETIME2 GENERATED ALWAYS AS ROW END   HIDDEN
            CONSTRAINT df_pr_vt DEFAULT CONVERT(DATETIME2,'9999-12-31 23:59:59.9999999');
GO
ALTER TABLE dbo.pricing_rule
    SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.pricing_rule_history));
GO

CREATE INDEX ix_pr_product   ON dbo.pricing_rule (product_id,  is_active, is_default);
CREATE INDEX ix_pr_market    ON dbo.pricing_rule (market_id,   is_active) WHERE market_id  IS NOT NULL;
CREATE INDEX ix_pr_incoterm  ON dbo.pricing_rule (incoterm_id, is_active) WHERE incoterm_id IS NOT NULL;
CREATE INDEX ix_pr_index     ON dbo.pricing_rule (price_index_id, is_active) WHERE price_index_id IS NOT NULL;
GO


-- =============================================================================
-- REFERENCE DATA SEEDS
-- =============================================================================

-- Pricing trigger event types
INSERT INTO dbo.pricing_trigger_event_type (
    trigger_code, trigger_name, trigger_category,
    applicable_mot_codes, applicable_commodities,
    requires_physical_confirmation, is_fallback_type,
    is_system_generated, typical_confirmation_days,
    lifecycle_sequence, description)
VALUES
    -- Documentary — vessel/barge events
    ('NOR',             'Notice of Readiness',
     'DOCUMENTARY', 'VESSEL,BARGE', 'OIL,GAS,AGRICULTURAL,METALS',
     1, 0, 0, 0, 10,
     'Vessel tenders NOR at load or discharge port. Master declares vessel ready to load/discharge.'),

    ('LAYCAN_START',    'Start of Laycan Window',
     'DOCUMENTARY', 'VESSEL,BARGE', 'OIL,GAS,AGRICULTURAL,METALS',
     0, 0, 0, 0, 20,
     'Start of the agreed laycan (laydays cancelling) window. Vessel must arrive within this window.'),

    ('COL',             'Commencement of Loading',
     'DOCUMENTARY', 'VESSEL,BARGE', 'OIL,GAS,AGRICULTURAL,METALS',
     1, 0, 0, 0, 30,
     'First molecule/unit flows into vessel at load port. Time logged by terminal.'),

    ('EOL',             'End of Loading',
     'DOCUMENTARY', 'VESSEL,BARGE', 'OIL,GAS,AGRICULTURAL,METALS',
     1, 0, 0, 0, 40,
     'Last molecule/unit loaded. Hoses disconnected. Used for laytime calculation.'),

    ('BL',              'Bill of Lading Date',
     'DOCUMENTARY', 'VESSEL,BARGE', 'OIL,GAS,AGRICULTURAL,METALS',
     1, 0, 0, 0, 50,
     'Date on the Bill of Lading. Title transfer date for FOB cargoes. Most common oil pricing trigger.'),

    ('COD',             'Commencement of Discharge',
     'DOCUMENTARY', 'VESSEL,BARGE', 'OIL,GAS,AGRICULTURAL,METALS',
     1, 0, 0, 1, 80,
     'First molecule/unit flows out of vessel at discharge port. Common CIF/DES pricing trigger.'),

    ('EOD_DISCHARGE',   'End of Discharge',
     'DOCUMENTARY', 'VESSEL,BARGE', 'OIL,GAS,AGRICULTURAL,METALS',
     1, 0, 0, 1, 90,
     'Last molecule/unit discharged. Hoses disconnected at discharge port.'),

    ('OUTTURN',         'Outturn / Final Measurement',
     'INSPECTION',  NULL, 'OIL,METALS,AGRICULTURAL',
     1, 0, 0, 2, 100,
     'Final independent measurement of quantity and quality after discharge. Used for metals warrant outturn and tank outturn.'),

    -- Documentary — pipeline events
    ('PIPELINE_ENTRY',  'Pipeline Entry / Injection',
     'DOCUMENTARY', 'PIPELINE', 'OIL,GAS',
     1, 0, 0, 0, 30,
     'Commodity injected into pipeline at entry point. Title may transfer here for pipeline trades.'),

    ('PIPELINE_EXIT',   'Pipeline Exit / Offtake',
     'DOCUMENTARY', 'PIPELINE', 'OIL,GAS',
     1, 0, 0, 0, 80,
     'Commodity offtaken from pipeline at exit point.'),

    -- Documentary — land transport
    ('TRUCK_LOADING',   'Truck Loading Complete',
     'DOCUMENTARY', 'TRUCK', 'OIL,AGRICULTURAL',
     1, 0, 0, 0, 40,
     'Truck tanker or dry bulk truck loading confirmed complete at terminal/facility.'),

    ('TRUCK_DELIVERY',  'Truck Delivery Confirmed',
     'DOCUMENTARY', 'TRUCK', 'OIL,AGRICULTURAL',
     1, 0, 0, 0, 80,
     'Delivery confirmed at buyer premises by signed delivery note.'),

    ('RAIL_DEPARTURE',  'Railcar Departure',
     'DOCUMENTARY', 'RAILCAR', 'OIL,AGRICULTURAL,METALS',
     1, 0, 0, 0, 40,
     'Railcar/consist departs origin siding. Waybill issued.'),

    ('RAIL_ARRIVAL',    'Railcar Arrival',
     'DOCUMENTARY', 'RAILCAR', 'OIL,AGRICULTURAL,METALS',
     1, 0, 0, 1, 80,
     'Railcar/consist arrives at destination siding.'),

    -- Deemed / fallback events
    ('DEEMED_BL',       'Deemed Bill of Lading Date',
     'DEEMED',      'VESSEL,BARGE', 'OIL,GAS,AGRICULTURAL,METALS',
     0, 1, 0, 0, NULL,
     'Contractual fallback date used when actual BL is not received by deadline. Date agreed in contract (e.g. mid-month, or estimated loading date).'),

    ('DEEMED_ARRIVAL',  'Deemed Arrival Date',
     'DEEMED',      'VESSEL,BARGE', 'OIL,GAS',
     0, 1, 0, 0, NULL,
     'Fallback arrival date used when NOR not tendered within agreed window.'),

    ('DEEMED_DELIVERY', 'Deemed Delivery Date',
     'DEEMED',      NULL, NULL,
     0, 1, 0, 0, NULL,
     'Contractual fallback delivery date. Used across all MOT types when actual delivery date cannot be confirmed in time.'),

    ('CONTRACTUAL_DATE','Contractual Fixed Date',
     'DEEMED',      NULL, NULL,
     0, 1, 0, 0, NULL,
     'A specific date explicitly stated in the contract. Does not depend on any physical event.'),

    -- Time-based events
    ('ACTUAL_DATE',     'Actual Agreed Date',
     'TIME_BASED',  NULL, NULL,
     0, 0, 0, 0, NULL,
     'A specific calendar date agreed between buyer and seller at trade time. Most common for financial/paper trades.'),

    ('PRICING_PERIOD_START','Start of Pricing Period',
     'TIME_BASED',  NULL, NULL,
     0, 0, 1, 0, NULL,
     'First day of the agreed pricing period. System-generated from delivery period.'),

    ('PRICING_PERIOD_END',  'End of Pricing Period',
     'TIME_BASED',  NULL, NULL,
     0, 0, 1, 0, NULL,
     'Last day of the agreed pricing period. System-generated from delivery period.'),

    ('DELIVERY_MONTH_START','First Day of Delivery Month',
     'TIME_BASED',  NULL, NULL,
     0, 0, 1, 0, NULL,
     'First calendar day of the delivery month. Used for monthly average pricing.'),

    ('DELIVERY_MONTH_END',  'Last Day of Delivery Month',
     'TIME_BASED',  NULL, NULL,
     0, 0, 1, 0, NULL,
     'Last calendar day of the delivery month.'),

    -- Exchange events
    ('EXPIRY_DATE',     'Contract Expiry Date',
     'EXCHANGE',    NULL, NULL,
     0, 0, 1, 0, NULL,
     'Exchange contract expiry date. From market_product_period.expiry_date. Used for exchange-traded futures/options.'),

    ('FIXING_DATE',     'Official Price Fixing Date',
     'EXCHANGE',    NULL, 'METALS',
     0, 0, 1, 0, NULL,
     'Official exchange price fixing date. LME: official cash settlement price. Used for metals pricing.'),

    ('LME_CASH',        'LME Cash / Prompt Date',
     'EXCHANGE',    NULL, 'METALS',
     0, 0, 1, 0, NULL,
     'LME cash price — two business days forward from trade date. Standard for LME base metals.'),

    ('LME_3MONTH',      'LME 3-Month Price',
     'EXCHANGE',    NULL, 'METALS',
     0, 0, 1, 0, NULL,
     'LME 3-month forward price. Used for LME hedging and some physical trades.'),

    ('PUBLICATION_DATE','Index Publication Date',
     'EXCHANGE',    NULL, NULL,
     0, 0, 1, 0, NULL,
     'Date the price index is officially published. Used for financial gas/power trades and paper oil.'),

    -- Settlement events
    ('INVOICE_DATE',    'Invoice Issue Date',
     'SETTLEMENT',  NULL, NULL,
     0, 0, 0, 0, NULL,
     'Date the invoice is issued. Rarely used as pricing trigger but exists in some legacy contracts.'),

    ('INSPECTION_DATE', 'Independent Inspection Date',
     'INSPECTION',  NULL, 'AGRICULTURAL,METALS',
     1, 0, 0, 1, NULL,
     'Date of independent quality/quantity inspection. Used in agricultural and metals trades where quality determines final price.');
GO


-- Pricing window rules — standard industry windows
INSERT INTO dbo.pricing_window_rule (
    commodity_type, rule_code, rule_name, window_type,
    days_before, days_after, day_count_type,
    min_fixings_required, missing_fixing_rule,
    averaging_method, price_rounding_dp,
    description, created_by)
VALUES
    -- Single day windows
    (NULL,      'SINGLE_DAY',           'Single Day (Trigger Date Only)',
     'SINGLE_DAY',      0,  0, 'PUBLICATION', 1, 'PRIOR_DAY',  'SIMPLE', 2,
     'Price = index fixing on trigger date only. No averaging.',           'SYSTEM'),

    -- Symmetric windows (oil)
    ('OIL',     '3DAY_SYMMETRIC',       '3-Day Symmetric (BL -1/0/+1)',
     'SYMMETRIC',       1,  1, 'PUBLICATION', 2, 'PRIOR_DAY',  'SIMPLE', 2,
     'Average of: day before, trigger day, day after. Most common for Dated Brent FOB.',  'SYSTEM'),

    ('OIL',     '5DAY_SYMMETRIC',       '5-Day Symmetric (-2/0/+2)',
     'SYMMETRIC',       2,  2, 'PUBLICATION', 3, 'PRIOR_DAY',  'SIMPLE', 2,
     'Average over 5-day window centred on trigger date.',                 'SYSTEM'),

    -- Forward windows (oil CIF/DES)
    ('OIL',     '5DAY_FORWARD_COD',     '5-Day Forward from COD',
     'FORWARD',         0,  4, 'PUBLICATION', 3, 'PRIOR_DAY',  'SIMPLE', 2,
     'Average of COD date through COD+4. Common for CIF discharge pricing.','SYSTEM'),

    ('OIL',     '3DAY_FORWARD_NOR',     '3-Day Forward from NOR',
     'FORWARD',         0,  2, 'PUBLICATION', 2, 'PRIOR_DAY',  'SIMPLE', 2,
     'Average of NOR date through NOR+2.',                                 'SYSTEM'),

    -- Backward windows
    ('OIL',     '5DAY_BACKWARD_BL',     '5-Day Backward to BL (-4/0)',
     'BACKWARD',        4,  0, 'PUBLICATION', 3, 'PRIOR_DAY',  'SIMPLE', 2,
     'Average of 4 days before BL through BL date.',                       'SYSTEM'),

    -- Monthly average windows
    (NULL,      'MONTHLY_AVG_ALL',      'Monthly Average — All Publication Days',
     'DELIVERY_MONTH',  0,  0, 'PUBLICATION', 15,'EXCLUDE',    'SIMPLE', 2,
     'Average of all index publication days in delivery month. Standard for monthly gas/power.','SYSTEM'),

    ('GAS',     'GAS_MONTHLY_BIZ',      'Gas Monthly Average — Business Days',
     'DELIVERY_MONTH',  0,  0, 'BUSINESS',    15,'PRIOR_DAY',  'SIMPLE', 3,
     'Average of all business days in gas delivery month. NBP/TTF standard.','SYSTEM'),

    ('POWER',   'POWER_MONTHLY_PEAK',   'Power Monthly Average — Peak Hours',
     'DELIVERY_MONTH',  0,  0, 'TRADING',     15,'EXCLUDE',    'SIMPLE', 2,
     'Average over peak trading hours of delivery month.',                  'SYSTEM'),

    -- Metals — LME specific
    ('METALS',  'LME_CASH_SINGLE',      'LME Cash Single Day Fix',
     'SINGLE_DAY',      0,  0, 'TRADING',      1,'SUSPEND',    'SIMPLE', 2,
     'LME official cash price on fixing date. No averaging — single official fixing.','SYSTEM'),

    ('METALS',  'LME_QP_MONTHLY',       'LME Quotational Period Monthly Avg',
     'DELIVERY_MONTH',  0,  0, 'TRADING',     15,'EXCLUDE',    'SIMPLE', 2,
     'Average of all LME trading days in quotational period. Standard concentrate contracts.','SYSTEM'),

    -- Agricultural
    ('AGRICULTURAL','CBOT_SINGLE',      'CBOT Single Settlement Price',
     'SINGLE_DAY',      0,  0, 'TRADING',      1,'SUSPEND',    'SIMPLE', 4,
     'CBOT official settlement price on expiry/notice day.',                'SYSTEM'),

    ('AGRICULTURAL','AGRI_5DAY_BL',     'Agricultural 5-Day Around BL',
     'SYMMETRIC',       2,  2, 'TRADING',      3,'PRIOR_DAY',  'SIMPLE', 2,
     '5-day average centred on BL date. Common for grain FOB trades.',      'SYSTEM'),

    -- Delivery period windows
    (NULL,      'FULL_DELIVERY_PERIOD', 'Full Delivery Period Average',
     'DELIVERY_PERIOD', 0,  0, 'PUBLICATION', 10,'EXCLUDE',    'SIMPLE', 2,
     'Average over all publication days of the full delivery period.',      'SYSTEM');
GO


-- =============================================================================
-- USAGE EXAMPLES (comments only)
-- =============================================================================
/*
EXAMPLE 1: Dated Brent FOB Cargo — standard North Sea oil trade
─────────────────────────────────────────────────────────────────
pricing_rule row:
    rule_code               = 'DATED_BRENT_FOB_3DAY_BL'
    rule_name               = 'Dated Brent FOB 3-Day BL Average'
    product_id              = <North Sea Crude product>
    incoterm_id             = <FOB>
    pricing_type_id         = <FLOATING>
    price_index_id          = <DATED_BRENT>
    primary_trigger_id      = <BL>           -- BL date anchors the window
    fallback_trigger_id     = <DEEMED_BL>    -- if BL not received in 5 days
    fallback_deadline_days  = 5
    window_rule_id          = <3DAY_SYMMETRIC> -- BL-1 / BL / BL+1
    invoice_trigger_id      = <BL>           -- invoice issued on BL date
    invoice_timing_days     = 0
    late_pricing_rule       = 'PROVISIONAL'
    provisional_basis       = 'LAST_KNOWN_FIXING'

EXAMPLE 2: WTI CIF US Gulf Coast
─────────────────────────────────
    rule_code               = 'WTI_CIF_5DAY_COD'
    rule_name               = 'WTI CIF 5-Day COD Average'
    price_index_id          = <WTI>
    primary_trigger_id      = <COD>          -- commencement of discharge
    fallback_trigger_id     = <DEEMED_DELIVERY>
    window_rule_id          = <5DAY_FORWARD_COD> -- COD / COD+1 / ... / COD+4
    invoice_trigger_id      = <EOD_DISCHARGE>
    invoice_timing_days     = 2

EXAMPLE 3: TTF Natural Gas Monthly Average
──────────────────────────────────────────
    rule_code               = 'TTF_MONTHLY_AVG'
    rule_name               = 'TTF Monthly Average'
    price_index_id          = <TTF>
    primary_trigger_id      = <DELIVERY_MONTH_START> -- window = whole month
    window_rule_id          = <GAS_MONTHLY_BIZ>
    invoice_trigger_id      = <DELIVERY_MONTH_END>
    invoice_timing_days     = 5              -- invoice 5 biz days after month end

EXAMPLE 4: LME Copper Concentrate — Quotational Period
───────────────────────────────────────────────────────
    rule_code               = 'LME_CU_QP_MONTHLY'
    rule_name               = 'LME Copper Monthly QP Average'
    price_index_id          = <LME_COPPER_CASH>
    primary_trigger_id      = <BL>           -- QP = month of BL
    window_rule_id          = <LME_QP_MONTHLY> -- all LME trading days of BL month
    invoice_trigger_id      = <OUTTURN>
    requires_final_invoice  = 1              -- provisional on BL, final on outturn
    final_invoice_trigger_id = <OUTTURN>

EXAMPLE 5: CBOT Corn Futures — Flat Price
─────────────────────────────────────────
    rule_code               = 'CBOT_CORN_FLAT'
    rule_name               = 'CBOT Corn Flat Price'
    pricing_type_id         = <FLAT>         -- no trigger, no window
    price_index_id          = <CBOT_CORN_NEARBY>
    primary_trigger_id      = NULL           -- flat price agreed at trade time
    window_rule_id          = NULL
*/

PRINT '============================================================';
PRINT 'PRICING TRIGGER EVENTS, WINDOW RULES & PRICING RULES v1.0';
PRINT '  01. pricing_trigger_event_type  — 30 trigger types seeded';
PRINT '      BL, NOR, COD, EOL, COL, EOD_DISCHARGE, OUTTURN,';
PRINT '      PIPELINE_ENTRY/EXIT, TRUCK, RAIL,';
PRINT '      DEEMED_BL, DEEMED_ARRIVAL, DEEMED_DELIVERY,';
PRINT '      CONTRACTUAL_DATE, ACTUAL_DATE,';
PRINT '      DELIVERY_MONTH_START/END, PRICING_PERIOD_START/END,';
PRINT '      EXPIRY_DATE, FIXING_DATE, LME_CASH, LME_3MONTH,';
PRINT '      PUBLICATION_DATE, INVOICE_DATE, INSPECTION_DATE';
PRINT '  02. pricing_window_rule         — 14 standard windows seeded';
PRINT '      SINGLE_DAY, 3/5-DAY SYMMETRIC, FORWARD/BACKWARD,';
PRINT '      MONTHLY AVERAGES (gas, power, metals QP, agri)';
PRINT '  03. pricing_trigger_product     — links triggers to products';
PRINT '  04. pricing_rule                — complete assembled pricing rule';
PRINT '      temporal table — full history of all rule changes';
PRINT '============================================================';
GO
