-- =============================================================================
-- ETRM SYSTEM — FINANCIAL & OPERATIONAL MASTER DATA
-- SQL Server 2022 | Version 1.0 | May 2026
-- =============================================================================
-- TABLES (22 total):
--
-- GROUP A — EVENTS (2 tables)
--   01. event_category
--   02. event_type
--
-- GROUP B — FORMULA (2 tables)
--   03. formula_template
--   04. formula_component
--
-- GROUP C — INTEREST RATES (3 tables)
--   05. interest_rate_index
--   06. interest_rate
--   07. rate_fixing
--
-- GROUP D — INSURANCE (3 tables)
--   08. insurance_provider
--   09. insurance_policy
--   10. insurance_policy_coverage
--
-- GROUP E — CREDIT INSTRUMENTS (4 tables)
--   11. letter_of_credit
--   12. bank_guarantee
--   13. lc_amendment
--   14. bg_amendment
--
-- GROUP F — MARGIN & COLLATERAL (4 tables)
--   15. margin_account
--   16. margin_call
--   17. collateral_type
--   18. collateral
--
-- GROUP G — REGULATORY & COMPLIANCE (4 tables)
--   19. regulatory_report_type
--   20. regulatory_obligation
--   21. trade_repository
--   22. reporting_counterparty
--
-- =============================================================================
-- Run AFTER:
--   etrm_master_data_v2.0.sql
--   etrm_market_source_period_v1.0.sql
--   etrm_product_spec_mot_pipeline_v1.0.sql
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- CLEANUP — reverse FK order
-- =============================================================================
IF OBJECT_ID('dbo.reporting_counterparty',    'U') IS NOT NULL DROP TABLE dbo.reporting_counterparty;
IF OBJECT_ID('dbo.trade_repository',          'U') IS NOT NULL DROP TABLE dbo.trade_repository;
IF OBJECT_ID('dbo.regulatory_obligation',     'U') IS NOT NULL DROP TABLE dbo.regulatory_obligation;
IF OBJECT_ID('dbo.regulatory_report_type',    'U') IS NOT NULL DROP TABLE dbo.regulatory_report_type;
IF OBJECT_ID('dbo.collateral',                'U') IS NOT NULL DROP TABLE dbo.collateral;
IF OBJECT_ID('dbo.collateral_type',           'U') IS NOT NULL DROP TABLE dbo.collateral_type;
IF OBJECT_ID('dbo.margin_call',               'U') IS NOT NULL DROP TABLE dbo.margin_call;
IF OBJECT_ID('dbo.margin_account',            'U') IS NOT NULL DROP TABLE dbo.margin_account;
IF OBJECT_ID('dbo.bg_amendment',              'U') IS NOT NULL DROP TABLE dbo.bg_amendment;
IF OBJECT_ID('dbo.lc_amendment',              'U') IS NOT NULL DROP TABLE dbo.lc_amendment;
IF OBJECT_ID('dbo.bank_guarantee',            'U') IS NOT NULL DROP TABLE dbo.bank_guarantee;
IF OBJECT_ID('dbo.letter_of_credit',          'U') IS NOT NULL DROP TABLE dbo.letter_of_credit;
IF OBJECT_ID('dbo.insurance_policy_coverage', 'U') IS NOT NULL DROP TABLE dbo.insurance_policy_coverage;
IF OBJECT_ID('dbo.insurance_policy',          'U') IS NOT NULL DROP TABLE dbo.insurance_policy;
IF OBJECT_ID('dbo.insurance_provider',        'U') IS NOT NULL DROP TABLE dbo.insurance_provider;
IF OBJECT_ID('dbo.rate_fixing',               'U') IS NOT NULL DROP TABLE dbo.rate_fixing;
IF OBJECT_ID('dbo.interest_rate',             'U') IS NOT NULL DROP TABLE dbo.interest_rate;
IF OBJECT_ID('dbo.interest_rate_index',       'U') IS NOT NULL DROP TABLE dbo.interest_rate_index;
IF OBJECT_ID('dbo.formula_component',         'U') IS NOT NULL DROP TABLE dbo.formula_component;
IF OBJECT_ID('dbo.formula_template',          'U') IS NOT NULL DROP TABLE dbo.formula_template;
IF OBJECT_ID('dbo.event_type',                'U') IS NOT NULL DROP TABLE dbo.event_type;
IF OBJECT_ID('dbo.event_category',            'U') IS NOT NULL DROP TABLE dbo.event_category;
GO


-- =============================================================================
-- GROUP A — EVENTS
-- =============================================================================

-- 01. EVENT_CATEGORY
-- Top-level grouping for all system events.
-- =============================================================================
CREATE TABLE dbo.event_category (
    category_id         INT             NOT NULL IDENTITY(1,1),
    category_code       VARCHAR(30)     NOT NULL,
    category_name       VARCHAR(100)    NOT NULL,
    description         VARCHAR(300)    NULL,
    is_active           BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_event_category        PRIMARY KEY (category_id),
    CONSTRAINT uq_event_category_code   UNIQUE      (category_code)
);
GO


-- 02. EVENT_TYPE
-- All system event types across every workflow and lifecycle.
-- Drives notification engine, workflow triggers, and audit trail.
-- entity_type = which domain object this event belongs to.
-- =============================================================================
CREATE TABLE dbo.event_type (
    event_type_id       INT             NOT NULL IDENTITY(1,1),
    category_id         INT             NOT NULL,
    event_code          VARCHAR(50)     NOT NULL,
    event_name          VARCHAR(200)    NOT NULL,
    entity_type         VARCHAR(30)     NOT NULL
        CONSTRAINT chk_et_entity CHECK (entity_type IN (
            'TRADE',
            'POSITION',
            'DELIVERY',
            'NOMINATION',
            'SETTLEMENT',
            'INVOICE',
            'PAYMENT',
            'RISK',
            'CREDIT',
            'MARGIN',
            'MARKET_DATA',
            'SYSTEM',
            'USER',
            'COUNTERPARTY',
            'VESSEL',
            'PIPELINE',
            'OTHER'
        )),
    -- Severity / priority for notification routing
    severity            VARCHAR(20)     NOT NULL DEFAULT 'INFO'
        CONSTRAINT chk_et_severity CHECK (severity IN (
            'INFO',         -- informational — log only
            'WARNING',      -- needs attention but not urgent
            'ALERT',        -- requires action today
            'CRITICAL',     -- requires immediate action
            'BREACH'        -- limit/regulatory breach — escalate
        )),
    -- Workflow
    requires_action     BIT             NOT NULL DEFAULT 0,
    requires_approval   BIT             NOT NULL DEFAULT 0,
    triggers_notification BIT           NOT NULL DEFAULT 1,
    -- SLA
    sla_minutes         SMALLINT        NULL,   -- expected resolution time
    -- Regulatory
    is_reportable       BIT             NOT NULL DEFAULT 0,
    -- whether this event type triggers regulatory reporting
    is_active           BIT             NOT NULL DEFAULT 1,
    description         VARCHAR(500)    NULL,

    CONSTRAINT pk_event_type        PRIMARY KEY (event_type_id),
    CONSTRAINT uq_event_code        UNIQUE      (event_code),
    CONSTRAINT fk_et_category       FOREIGN KEY (category_id) REFERENCES dbo.event_category(category_id)
);
GO
CREATE INDEX ix_et_entity   ON dbo.event_type (entity_type, severity, is_active);
CREATE INDEX ix_et_category ON dbo.event_type (category_id, is_active);
GO


-- =============================================================================
-- GROUP B — FORMULA
-- =============================================================================

-- 03. FORMULA_TEMPLATE
-- Reusable pricing formula patterns.
-- e.g. 'OMAN_DUBAI_AVG'    = (Oman + Dubai) / 2
--      'BRENT_DATED_DIFF'  = Dated Brent + differential
--      'PLATTS_AVERAGE'    = Average of index over pricing period
--      'WEIGHTED_BLEND'    = sum of (index_n * weight_n) + differential
-- commodity_type = NULL means usable for any commodity.
-- =============================================================================
CREATE TABLE dbo.formula_template (
    template_id             INT             NOT NULL IDENTITY(1,1),
    commodity_type          VARCHAR(20)     NULL,
    template_code           VARCHAR(30)     NOT NULL,
    template_name           VARCHAR(200)    NOT NULL,
    formula_type            VARCHAR(20)     NOT NULL
        CONSTRAINT chk_ft_type CHECK (formula_type IN (
            'INDEX',            -- single index price
            'DIFFERENTIAL',     -- index + differential
            'AVERAGE',          -- average of index over period
            'WEIGHTED_AVERAGE', -- weighted average of one index
            'BLEND',            -- weighted blend of multiple indices
            'SPREAD',           -- spread between two indices
            'FORMULA'           -- complex multi-component formula
        )),
    -- Formula expression (human-readable, not executed by DB)
    formula_expression      VARCHAR(500)    NULL,
    -- e.g. '(INDEX_A * WEIGHT_A) + (INDEX_B * WEIGHT_B) + DIFFERENTIAL'
    -- Averaging
    averaging_type          VARCHAR(20)     NULL
        CONSTRAINT chk_ft_avg CHECK (averaging_type IN (
            'DAILY',            -- simple average of daily fixings
            'WEIGHTED_DAILY',   -- volume-weighted daily average
            'MONTHLY_AVERAGE',  -- monthly average publication
            'NONE',             NULL
        )),
    averaging_period_type   VARCHAR(20)     NULL
        CONSTRAINT chk_ft_avg_period CHECK (averaging_period_type IN (
            'PRICING_PERIOD',   -- average over the agreed pricing period
            'DELIVERY_MONTH',   -- average over delivery month
            'FIXED_WINDOW',     -- fixed number of days
            'CUSTOM',           NULL
        )),
    -- Currency handling
    fx_conversion_required  BIT             NOT NULL DEFAULT 0,
    fx_fixing_type          VARCHAR(20)     NULL
        CONSTRAINT chk_ft_fx CHECK (fx_fixing_type IN (
            'SPOT',             -- spot rate on pricing date
            'AVERAGE',          -- average rate over pricing period
            'FIXED',            -- fixed rate agreed at trade date
            NULL
        )),
    -- Description
    description             VARCHAR(500)    NULL,
    is_active               BIT             NOT NULL DEFAULT 1,
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_formula_template  PRIMARY KEY (template_id),
    CONSTRAINT uq_ft_code           UNIQUE      (template_code)
);
GO


-- 04. FORMULA_COMPONENT
-- Individual components of a formula template.
-- One row per index/price reference within the formula.
-- =============================================================================
CREATE TABLE dbo.formula_component (
    component_id        INT             NOT NULL IDENTITY(1,1),
    template_id         INT             NOT NULL,
    component_seq       TINYINT         NOT NULL,   -- order within formula
    component_role      VARCHAR(20)     NOT NULL
        CONSTRAINT chk_fc_role CHECK (component_role IN (
            'PRIMARY_INDEX',    -- main pricing index
            'SECONDARY_INDEX',  -- second index in blend/spread
            'DIFFERENTIAL',     -- fixed add/subtract value
            'MULTIPLIER',       -- scaling factor
            'CAP',              -- price cap (ceiling)
            'FLOOR',            -- price floor
            'FX_RATE'           -- FX conversion component
        )),
    -- Index reference (NULL for DIFFERENTIAL / fixed components)
    price_index_id      INT             NULL,
    -- Fixed value (for DIFFERENTIAL, MULTIPLIER, CAP, FLOOR)
    fixed_value         DECIMAL(18,6)   NULL,
    fixed_value_currency_id INT         NULL,
    -- Weight in blend (for BLEND formula type)
    weight              DECIMAL(10,6)   NULL,
    -- Averaging window for this component (overrides template default)
    averaging_days      SMALLINT        NULL,
    -- Lag (pricing period offset from delivery)
    lag_days            SMALLINT        NOT NULL DEFAULT 0,
    -- Description
    description         VARCHAR(200)    NULL,

    CONSTRAINT pk_formula_component     PRIMARY KEY (component_id),
    CONSTRAINT uq_fc_seq                UNIQUE      (template_id, component_seq),
    CONSTRAINT fk_fc_template           FOREIGN KEY (template_id)           REFERENCES dbo.formula_template(template_id),
    CONSTRAINT fk_fc_price_index        FOREIGN KEY (price_index_id)        REFERENCES dbo.price_index(price_index_id),
    CONSTRAINT fk_fc_currency           FOREIGN KEY (fixed_value_currency_id) REFERENCES dbo.currency(currency_id),
    CONSTRAINT chk_fc_weight            CHECK       (weight IS NULL OR (weight > 0 AND weight <= 1))
);
GO
CREATE INDEX ix_fc_template ON dbo.formula_component (template_id, component_seq);
GO


-- =============================================================================
-- GROUP C — INTEREST RATES
-- =============================================================================

-- 05. INTEREST_RATE_INDEX
-- Reference rate definitions — SOFR, EURIBOR, SONIA, Fed Funds etc.
-- =============================================================================
CREATE TABLE dbo.interest_rate_index (
    rate_index_id       INT             NOT NULL IDENTITY(1,1),
    index_code          VARCHAR(20)     NOT NULL,   -- 'SOFR','EURIBOR_3M','SONIA','FEDFUNDS'
    index_name          VARCHAR(200)    NOT NULL,
    currency_id         INT             NOT NULL,
    tenor               VARCHAR(20)     NULL,       -- 'OVERNIGHT','1M','3M','6M','1Y'
    day_count_convention VARCHAR(20)    NOT NULL DEFAULT 'ACT_360'
        CONSTRAINT chk_iri_dcc CHECK (day_count_convention IN (
            'ACT_360',          -- actual/360 (money market)
            'ACT_365',          -- actual/365 (sterling)
            'ACT_ACT',          -- actual/actual (government bonds)
            '30_360',           -- 30/360 (corporate bonds)
            'ACT_365F'          -- actual/365 fixed
        )),
    compounding         VARCHAR(20)     NOT NULL DEFAULT 'SIMPLE'
        CONSTRAINT chk_iri_comp CHECK (compounding IN (
            'SIMPLE','COMPOUNDED','OVERNIGHT_COMPOUNDED'
        )),
    publication_source  VARCHAR(100)    NULL,       -- 'SOFR Admin','ECB','BoE'
    publication_time    TIME            NULL,       -- UTC time published daily
    fixing_lag_days     TINYINT         NOT NULL DEFAULT 0,
    -- LIBOR replacement flag
    is_rfrr             BIT             NOT NULL DEFAULT 0,
    -- Risk Free Reference Rate (SOFR, SONIA, €STR, TONAR)
    replaces_index_id   INT             NULL,       -- if this replaced LIBOR etc.
    is_active           BIT             NOT NULL DEFAULT 1,
    description         VARCHAR(300)    NULL,

    CONSTRAINT pk_iri               PRIMARY KEY (rate_index_id),
    CONSTRAINT uq_iri_code          UNIQUE      (index_code),
    CONSTRAINT fk_iri_currency      FOREIGN KEY (currency_id)       REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_iri_replaces      FOREIGN KEY (replaces_index_id) REFERENCES dbo.interest_rate_index(rate_index_id)
);
GO


-- 06. INTEREST_RATE
-- Daily rate values per index.
-- Used for financing cost calculations, late payment interest,
-- credit exposure discounting.
-- =============================================================================
CREATE TABLE dbo.interest_rate (
    rate_id             INT             NOT NULL IDENTITY(1,1),
    rate_index_id       INT             NOT NULL,
    rate_date           DATE            NOT NULL,
    rate_value          DECIMAL(12,8)   NOT NULL,   -- e.g. 0.05250000 = 5.25%
    rate_type           VARCHAR(20)     NOT NULL DEFAULT 'FIXING'
        CONSTRAINT chk_ir_type CHECK (rate_type IN (
            'FIXING',           -- official daily fixing
            'EOD',              -- end of day rate
            'INDICATIVE',       -- indicative / not official
            'MANUAL'            -- manually entered
        )),
    source              VARCHAR(50)     NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_interest_rate     PRIMARY KEY (rate_id),
    CONSTRAINT uq_ir_date           UNIQUE      (rate_index_id, rate_date, rate_type),
    CONSTRAINT fk_ir_index          FOREIGN KEY (rate_index_id) REFERENCES dbo.interest_rate_index(rate_index_id)
) WITH (DATA_COMPRESSION = PAGE);
GO
CREATE INDEX ix_ir_date ON dbo.interest_rate (rate_date, rate_index_id, rate_type);
GO


-- 07. RATE_FIXING
-- Official fixing values — distinct from daily curve values.
-- Used for specific contract settlement calculations
-- e.g. ISDA fallback fixings, ECB reference rates.
-- =============================================================================
CREATE TABLE dbo.rate_fixing (
    fixing_id           INT             NOT NULL IDENTITY(1,1),
    rate_index_id       INT             NOT NULL,
    fixing_date         DATE            NOT NULL,
    fixing_value        DECIMAL(12,8)   NOT NULL,
    fixing_time         TIME            NULL,
    issuing_body        VARCHAR(100)    NULL,
    screen_page         VARCHAR(100)    NULL,   -- e.g. 'EURIBOR01','SOFR' (Bloomberg)
    is_official         BIT             NOT NULL DEFAULT 1,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_rate_fixing       PRIMARY KEY (fixing_id),
    CONSTRAINT uq_rf_date           UNIQUE      (rate_index_id, fixing_date),
    CONSTRAINT fk_rf_index          FOREIGN KEY (rate_index_id) REFERENCES dbo.interest_rate_index(rate_index_id)
) WITH (DATA_COMPRESSION = PAGE);
GO
CREATE INDEX ix_rf_date ON dbo.rate_fixing (fixing_date, rate_index_id);
GO


-- =============================================================================
-- GROUP D — INSURANCE
-- =============================================================================

-- 08. INSURANCE_PROVIDER
-- Insurance companies, P&I clubs, Lloyd's syndicates.
-- =============================================================================
CREATE TABLE dbo.insurance_provider (
    provider_id         INT             NOT NULL IDENTITY(1,1),
    provider_code       VARCHAR(20)     NOT NULL,
    provider_name       VARCHAR(200)    NOT NULL,
    provider_type       VARCHAR(20)     NOT NULL
        CONSTRAINT chk_ip_type CHECK (provider_type IN (
            'PI_CLUB',          -- P&I club (vessel liability)
            'UNDERWRITER',      -- Lloyd's / commercial underwriter
            'INSURER',          -- direct insurance company
            'BROKER',           -- insurance broker
            'REINSURER'         -- reinsurance company
        )),
    country_code        CHAR(2)         NULL,
    credit_rating_id    INT             NULL,
    counterparty_id     INT             NULL,   -- FK if also a trading counterparty
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(300)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_insurance_provider    PRIMARY KEY (provider_id),
    CONSTRAINT uq_ip_code               UNIQUE      (provider_code),
    CONSTRAINT fk_ip_rating             FOREIGN KEY (credit_rating_id) REFERENCES dbo.credit_rating(credit_rating_id),
    CONSTRAINT fk_ip_cp                 FOREIGN KEY (counterparty_id)  REFERENCES dbo.counterparty(counterparty_id)
);
GO


-- 09. INSURANCE_POLICY
-- Insurance policies covering vessels, cargoes, trades, or counterparty credit.
-- Polymorphic: entity_type identifies what is insured.
-- =============================================================================
CREATE TABLE dbo.insurance_policy (
    policy_id           INT             NOT NULL IDENTITY(1,1),
    provider_id         INT             NOT NULL,
    legal_entity_id     INT             NOT NULL,   -- our entity holding the policy
    policy_number       VARCHAR(100)    NOT NULL,
    policy_type         VARCHAR(30)     NOT NULL
        CONSTRAINT chk_ipol_type CHECK (policy_type IN (
            'PI',               -- P&I liability (vessel)
            'HULL',             -- hull and machinery (vessel)
            'CARGO',            -- cargo/goods in transit
            'TRADE_CREDIT',     -- trade credit insurance (counterparty default)
            'POLITICAL_RISK',   -- political risk / expropriation
            'STORAGE',          -- storage facility insurance
            'OTHER'
        )),
    -- What is insured
    insured_entity_type VARCHAR(30)     NULL
        CONSTRAINT chk_ipol_entity CHECK (insured_entity_type IN (
            'VESSEL','CARGO','COUNTERPARTY','STORAGE_FACILITY',
            'LEGAL_ENTITY','OTHER',NULL
        )),
    insured_entity_id   INT             NULL,
    -- Policy terms
    currency_id         INT             NOT NULL,
    sum_insured         DECIMAL(18,2)   NOT NULL,
    deductible          DECIMAL(18,2)   NOT NULL DEFAULT 0,
    premium_amount      DECIMAL(18,2)   NULL,
    premium_currency_id INT             NULL,
    premium_frequency   VARCHAR(20)     NULL
        CONSTRAINT chk_ipol_freq CHECK (premium_frequency IN (
            'ANNUAL','QUARTERLY','MONTHLY','PER_VOYAGE','PER_CARGO',NULL
        )),
    -- Validity
    inception_date      DATE            NOT NULL,
    expiry_date         DATE            NOT NULL,
    -- Status
    policy_status       VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE'
        CONSTRAINT chk_ipol_status CHECK (policy_status IN (
            'ACTIVE','EXPIRED','CANCELLED','SUSPENDED','CLAIM_IN_PROGRESS'
        )),
    -- Documents
    document_store_id   INT             NULL,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_insurance_policy  PRIMARY KEY (policy_id),
    CONSTRAINT uq_policy_number     UNIQUE      (provider_id, policy_number),
    CONSTRAINT fk_ipol_provider     FOREIGN KEY (provider_id)       REFERENCES dbo.insurance_provider(provider_id),
    CONSTRAINT fk_ipol_entity       FOREIGN KEY (legal_entity_id)   REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_ipol_currency     FOREIGN KEY (currency_id)       REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_ipol_prem_ccy     FOREIGN KEY (premium_currency_id) REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_ipol_doc          FOREIGN KEY (document_store_id) REFERENCES dbo.document_store(document_id),
    CONSTRAINT chk_ipol_dates       CHECK       (expiry_date > inception_date)
);
GO
CREATE INDEX ix_ipol_entity  ON dbo.insurance_policy (legal_entity_id, policy_type, policy_status);
CREATE INDEX ix_ipol_expiry  ON dbo.insurance_policy (expiry_date, policy_status)
    WHERE expiry_date IS NOT NULL;
GO


-- 10. INSURANCE_POLICY_COVERAGE
-- Specific coverage clauses or endorsements within a policy.
-- =============================================================================
CREATE TABLE dbo.insurance_policy_coverage (
    coverage_id         INT             NOT NULL IDENTITY(1,1),
    policy_id           INT             NOT NULL,
    coverage_type       VARCHAR(50)     NOT NULL,   -- 'WAR_RISKS','STRIKES','POLLUTION' etc.
    coverage_limit      DECIMAL(18,2)   NULL,
    deductible          DECIMAL(18,2)   NULL,
    exclusions          VARCHAR(500)    NULL,
    conditions          VARCHAR(500)    NULL,
    is_active           BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_ipc               PRIMARY KEY (coverage_id),
    CONSTRAINT fk_ipc_policy        FOREIGN KEY (policy_id) REFERENCES dbo.insurance_policy(policy_id)
);
GO


-- =============================================================================
-- GROUP E — CREDIT INSTRUMENTS
-- =============================================================================

-- 11. LETTER_OF_CREDIT
-- LC master — issued by bank on behalf of buyer,
-- guarantees payment to seller upon document presentation.
-- =============================================================================
CREATE TABLE dbo.letter_of_credit (
    lc_id               INT             NOT NULL IDENTITY(1,1),
    lc_number           VARCHAR(100)    NOT NULL,
    lc_type             VARCHAR(20)     NOT NULL
        CONSTRAINT chk_lc_type CHECK (lc_type IN (
            'IRREVOCABLE',          -- cannot be changed without all party consent
            'STANDBY',              -- payment of last resort
            'REVOLVING',            -- renews after each drawing
            'TRANSFERABLE',         -- can be transferred to second beneficiary
            'BACK_TO_BACK'          -- secondary LC backed by primary
        )),
    -- Parties
    issuing_bank_id     INT             NOT NULL,   -- FK to counterparty (bank)
    confirming_bank_id  INT             NULL,       -- FK to counterparty (confirming bank)
    applicant_entity_id INT             NOT NULL,   -- our legal entity (buyer)
    beneficiary_cp_id   INT             NOT NULL,   -- counterparty (seller)
    -- Financial terms
    currency_id         INT             NOT NULL,
    lc_amount           DECIMAL(18,2)   NOT NULL,
    tolerance_pct       DECIMAL(5,2)    NOT NULL DEFAULT 0,
    -- e.g. 5% = amount can be 5% above or below
    -- Validity
    issue_date          DATE            NOT NULL,
    expiry_date         DATE            NOT NULL,
    expiry_place        VARCHAR(100)    NULL,   -- 'AT ISSUING BANK COUNTERS'
    -- Presentation period
    presentation_days   SMALLINT        NOT NULL DEFAULT 21,
    -- days after B/L date to present documents
    -- Shipment
    latest_shipment_date DATE           NULL,
    port_of_loading     VARCHAR(200)    NULL,
    port_of_discharge   VARCHAR(200)    NULL,
    partial_shipment    BIT             NOT NULL DEFAULT 0,
    transhipment        BIT             NOT NULL DEFAULT 0,
    -- UCP version
    ucp_version         VARCHAR(20)     NOT NULL DEFAULT 'UCP_600',
    -- Status
    lc_status           VARCHAR(20)     NOT NULL DEFAULT 'ISSUED'
        CONSTRAINT chk_lc_status CHECK (lc_status IN (
            'DRAFT','ISSUED','CONFIRMED','AMENDED',
            'DRAWN','EXPIRED','CANCELLED'
        )),
    amount_drawn        DECIMAL(18,2)   NOT NULL DEFAULT 0,
    amount_available    AS              (lc_amount - amount_drawn),
    -- Link to payment term
    payment_term_id     INT             NULL,
    -- Documents
    document_store_id   INT             NULL,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_lc                PRIMARY KEY (lc_id),
    CONSTRAINT uq_lc_number         UNIQUE      (lc_number),
    CONSTRAINT fk_lc_issuing        FOREIGN KEY (issuing_bank_id)    REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT fk_lc_confirming     FOREIGN KEY (confirming_bank_id) REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT fk_lc_applicant      FOREIGN KEY (applicant_entity_id) REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_lc_beneficiary    FOREIGN KEY (beneficiary_cp_id)  REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT fk_lc_currency       FOREIGN KEY (currency_id)        REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_lc_payment        FOREIGN KEY (payment_term_id)    REFERENCES dbo.payment_term(payment_term_id),
    CONSTRAINT fk_lc_doc            FOREIGN KEY (document_store_id)  REFERENCES dbo.document_store(document_id),
    CONSTRAINT chk_lc_dates         CHECK       (expiry_date > issue_date),
    CONSTRAINT chk_lc_drawn         CHECK       (amount_drawn >= 0 AND amount_drawn <= lc_amount)
) WITH (DATA_COMPRESSION = ROW);
GO
CREATE INDEX ix_lc_status  ON dbo.letter_of_credit (lc_status, expiry_date);
CREATE INDEX ix_lc_entity  ON dbo.letter_of_credit (applicant_entity_id, lc_status);
CREATE INDEX ix_lc_bene    ON dbo.letter_of_credit (beneficiary_cp_id, lc_status);
GO


-- 12. BANK_GUARANTEE
-- Bank guarantee master — bank guarantees payment obligation
-- on behalf of its client.
-- =============================================================================
CREATE TABLE dbo.bank_guarantee (
    bg_id               INT             NOT NULL IDENTITY(1,1),
    bg_number           VARCHAR(100)    NOT NULL,
    bg_type             VARCHAR(20)     NOT NULL
        CONSTRAINT chk_bg_type CHECK (bg_type IN (
            'PERFORMANCE',      -- guarantees performance of contract
            'PAYMENT',          -- guarantees payment
            'ADVANCE_PAYMENT',  -- guarantees return of advance payment
            'BID_BOND',         -- guarantees tender/bid
            'STANDBY_LC'        -- standby letter of credit form
        )),
    -- Parties
    issuing_bank_id     INT             NOT NULL,
    principal_entity_id INT             NOT NULL,   -- our entity (obligor)
    beneficiary_cp_id   INT             NOT NULL,   -- counterparty (beneficiary)
    -- Financial terms
    currency_id         INT             NOT NULL,
    guarantee_amount    DECIMAL(18,2)   NOT NULL,
    -- Validity
    issue_date          DATE            NOT NULL,
    expiry_date         DATE            NOT NULL,
    claim_period_days   SMALLINT        NOT NULL DEFAULT 30,
    -- Status
    bg_status           VARCHAR(20)     NOT NULL DEFAULT 'ISSUED'
        CONSTRAINT chk_bg_status CHECK (bg_status IN (
            'DRAFT','ISSUED','AMENDED','CALLED',
            'EXPIRED','CANCELLED','DISCHARGED'
        )),
    amount_called       DECIMAL(18,2)   NOT NULL DEFAULT 0,
    -- Documents
    document_store_id   INT             NULL,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_bg                PRIMARY KEY (bg_id),
    CONSTRAINT uq_bg_number         UNIQUE      (bg_number),
    CONSTRAINT fk_bg_bank           FOREIGN KEY (issuing_bank_id)    REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT fk_bg_principal      FOREIGN KEY (principal_entity_id) REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_bg_beneficiary    FOREIGN KEY (beneficiary_cp_id)  REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT fk_bg_currency       FOREIGN KEY (currency_id)        REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_bg_doc            FOREIGN KEY (document_store_id)  REFERENCES dbo.document_store(document_id),
    CONSTRAINT chk_bg_dates         CHECK       (expiry_date > issue_date),
    CONSTRAINT chk_bg_called        CHECK       (amount_called >= 0 AND amount_called <= guarantee_amount)
);
GO
CREATE INDEX ix_bg_status  ON dbo.bank_guarantee (bg_status, expiry_date);
CREATE INDEX ix_bg_entity  ON dbo.bank_guarantee (principal_entity_id, bg_status);
GO


-- 13. LC_AMENDMENT
-- Track all amendments to a letter of credit.
-- =============================================================================
CREATE TABLE dbo.lc_amendment (
    amendment_id        INT             NOT NULL IDENTITY(1,1),
    lc_id               INT             NOT NULL,
    amendment_number    TINYINT         NOT NULL,
    amendment_date      DATE            NOT NULL,
    amendment_type      VARCHAR(50)     NOT NULL,
    -- e.g. 'AMOUNT_INCREASE','EXPIRY_EXTENSION','PORT_CHANGE'
    old_value           VARCHAR(500)    NULL,
    new_value           VARCHAR(500)    NULL,
    new_amount          DECIMAL(18,2)   NULL,
    new_expiry_date     DATE            NULL,
    accepted_by         VARCHAR(100)    NULL,
    accepted_date       DATE            NULL,
    document_store_id   INT             NULL,
    notes               VARCHAR(300)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_lc_amendment      PRIMARY KEY (amendment_id),
    CONSTRAINT uq_lc_amendment      UNIQUE      (lc_id, amendment_number),
    CONSTRAINT fk_lca_lc            FOREIGN KEY (lc_id)            REFERENCES dbo.letter_of_credit(lc_id),
    CONSTRAINT fk_lca_doc           FOREIGN KEY (document_store_id) REFERENCES dbo.document_store(document_id)
);
GO


-- 14. BG_AMENDMENT
-- Track all amendments to a bank guarantee.
-- =============================================================================
CREATE TABLE dbo.bg_amendment (
    amendment_id        INT             NOT NULL IDENTITY(1,1),
    bg_id               INT             NOT NULL,
    amendment_number    TINYINT         NOT NULL,
    amendment_date      DATE            NOT NULL,
    amendment_type      VARCHAR(50)     NOT NULL,
    old_value           VARCHAR(500)    NULL,
    new_value           VARCHAR(500)    NULL,
    new_amount          DECIMAL(18,2)   NULL,
    new_expiry_date     DATE            NULL,
    accepted_by         VARCHAR(100)    NULL,
    accepted_date       DATE            NULL,
    document_store_id   INT             NULL,
    notes               VARCHAR(300)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_bg_amendment      PRIMARY KEY (amendment_id),
    CONSTRAINT uq_bg_amendment      UNIQUE      (bg_id, amendment_number),
    CONSTRAINT fk_bga_bg            FOREIGN KEY (bg_id)            REFERENCES dbo.bank_guarantee(bg_id),
    CONSTRAINT fk_bga_doc           FOREIGN KEY (document_store_id) REFERENCES dbo.document_store(document_id)
);
GO


-- =============================================================================
-- GROUP F — MARGIN & COLLATERAL
-- =============================================================================

-- 15. MARGIN_ACCOUNT
-- Exchange margin accounts per legal entity per market.
-- Tracks initial margin requirements and variation margin balance.
-- =============================================================================
CREATE TABLE dbo.margin_account (
    margin_account_id   INT             NOT NULL IDENTITY(1,1),
    legal_entity_id     INT             NOT NULL,
    market_id           INT             NOT NULL,
    account_ref         VARCHAR(100)    NOT NULL,   -- broker/exchange account reference
    account_type        VARCHAR(20)     NOT NULL DEFAULT 'HOUSE'
        CONSTRAINT chk_ma_acct_type CHECK (account_type IN (
            'HOUSE',        -- proprietary trading account
            'CLIENT',       -- client segregated account
            'OMNIBUS'       -- omnibus client account
        )),
    clearing_broker_id  INT             NULL,       -- FK counterparty (clearing broker)
    currency_id         INT             NOT NULL,
    -- Current balances (updated daily by EOD batch)
    initial_margin      DECIMAL(18,2)   NOT NULL DEFAULT 0,
    variation_margin    DECIMAL(18,2)   NOT NULL DEFAULT 0,
    excess_margin       DECIMAL(18,2)   NOT NULL DEFAULT 0,
    -- Limits
    margin_limit        DECIMAL(18,2)   NULL,
    -- Status
    is_active           BIT             NOT NULL DEFAULT 1,
    last_updated        DATETIME2       NULL,
    notes               VARCHAR(300)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_margin_account    PRIMARY KEY (margin_account_id),
    CONSTRAINT uq_ma                UNIQUE      (legal_entity_id, market_id, account_type),
    CONSTRAINT fk_ma_entity         FOREIGN KEY (legal_entity_id)  REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_ma_market         FOREIGN KEY (market_id)        REFERENCES dbo.market(market_id),
    CONSTRAINT fk_ma_broker         FOREIGN KEY (clearing_broker_id) REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT fk_ma_currency       FOREIGN KEY (currency_id)      REFERENCES dbo.currency(currency_id)
);
GO


-- 16. MARGIN_CALL
-- Individual margin calls issued or received.
-- =============================================================================
CREATE TABLE dbo.margin_call (
    call_id             INT             NOT NULL IDENTITY(1,1),
    margin_account_id   INT             NOT NULL,
    call_date           DATE            NOT NULL,
    call_type           VARCHAR(20)     NOT NULL
        CONSTRAINT chk_mc_type CHECK (call_type IN (
            'INITIAL',          -- initial margin requirement
            'VARIATION',        -- daily variation margin
            'INTRADAY',         -- intraday call
            'EXCESS_RETURN'     -- return of excess margin
        )),
    call_direction      VARCHAR(10)     NOT NULL
        CONSTRAINT chk_mc_dir CHECK (call_direction IN ('PAY','RECEIVE')),
    currency_id         INT             NOT NULL,
    call_amount         DECIMAL(18,2)   NOT NULL,
    due_date            DATE            NOT NULL,
    status              VARCHAR(20)     NOT NULL DEFAULT 'PENDING'
        CONSTRAINT chk_mc_status CHECK (status IN (
            'PENDING','PAID','RECEIVED','DISPUTED','OVERDUE','WAIVED'
        )),
    paid_amount         DECIMAL(18,2)   NULL,
    paid_date           DATE            NULL,
    notes               VARCHAR(300)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_margin_call       PRIMARY KEY (call_id),
    CONSTRAINT fk_mc_account        FOREIGN KEY (margin_account_id) REFERENCES dbo.margin_account(margin_account_id),
    CONSTRAINT fk_mc_currency       FOREIGN KEY (currency_id)       REFERENCES dbo.currency(currency_id)
);
GO
CREATE INDEX ix_mc_account ON dbo.margin_call (margin_account_id, call_date DESC, status);
CREATE INDEX ix_mc_due     ON dbo.margin_call (due_date, status) WHERE status IN ('PENDING','OVERDUE');
GO


-- 17. COLLATERAL_TYPE
-- Reference table for collateral instrument types.
-- =============================================================================
CREATE TABLE dbo.collateral_type (
    collateral_type_id  INT             NOT NULL IDENTITY(1,1),
    type_code           VARCHAR(30)     NOT NULL,
    type_name           VARCHAR(100)    NOT NULL,
    asset_class         VARCHAR(20)     NOT NULL
        CONSTRAINT chk_ct_class CHECK (asset_class IN (
            'CASH',
            'GOVERNMENT_BOND',
            'CORPORATE_BOND',
            'EQUITY',
            'LETTER_OF_CREDIT',
            'BANK_GUARANTEE',
            'COMMODITY',
            'OTHER'
        )),
    -- Haircut = discount applied to market value for margin purposes
    standard_haircut_pct DECIMAL(5,2)  NOT NULL DEFAULT 0,
    is_active           BIT             NOT NULL DEFAULT 1,
    description         VARCHAR(300)    NULL,

    CONSTRAINT pk_collateral_type   PRIMARY KEY (collateral_type_id),
    CONSTRAINT uq_ct_code           UNIQUE      (type_code)
);
GO


-- 18. COLLATERAL
-- Collateral posted or received against credit or margin exposure.
-- Polymorphic: can be against a counterparty credit line or a margin account.
-- =============================================================================
CREATE TABLE dbo.collateral (
    collateral_id       INT             NOT NULL IDENTITY(1,1),
    collateral_type_id  INT             NOT NULL,
    -- Direction
    direction           VARCHAR(10)     NOT NULL
        CONSTRAINT chk_coll_dir CHECK (direction IN (
            'POSTED',       -- we posted collateral to counterparty/exchange
            'RECEIVED'      -- we received collateral from counterparty
        )),
    -- What it secures (polymorphic)
    secured_entity_type VARCHAR(20)     NOT NULL
        CONSTRAINT chk_coll_entity CHECK (secured_entity_type IN (
            'COUNTERPARTY',     -- secures credit exposure to a counterparty
            'MARGIN_ACCOUNT',   -- secures exchange margin account
            'LC',               -- collateral backing an LC
            'OTHER'
        )),
    secured_entity_id   INT             NOT NULL,
    -- Our legal entity
    legal_entity_id     INT             NOT NULL,
    -- Counterparty (who we posted to / received from)
    counterparty_id     INT             NULL,
    -- Collateral details
    currency_id         INT             NOT NULL,
    face_value          DECIMAL(18,2)   NOT NULL,
    market_value        DECIMAL(18,2)   NULL,       -- updated by EOD valuation
    haircut_pct         DECIMAL(5,2)    NOT NULL DEFAULT 0,
    eligible_value      AS              (market_value * (1 - haircut_pct / 100)),
    -- Instrument reference (if bond/equity)
    instrument_isin     VARCHAR(12)     NULL,
    instrument_desc     VARCHAR(200)    NULL,
    -- LC/BG reference if collateral_type = LC or BG
    lc_id               INT             NULL,
    bg_id               INT             NULL,
    -- Validity
    posting_date        DATE            NOT NULL,
    maturity_date       DATE            NULL,
    return_date         DATE            NULL,       -- actual date returned
    status              VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE'
        CONSTRAINT chk_coll_status CHECK (status IN (
            'ACTIVE','RETURNED','CALLED','DEFAULTED','SUBSTITUTED'
        )),
    document_store_id   INT             NULL,
    notes               VARCHAR(300)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,
    updated_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_collateral        PRIMARY KEY (collateral_id),
    CONSTRAINT fk_coll_type         FOREIGN KEY (collateral_type_id)  REFERENCES dbo.collateral_type(collateral_type_id),
    CONSTRAINT fk_coll_entity       FOREIGN KEY (legal_entity_id)     REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_coll_cp           FOREIGN KEY (counterparty_id)     REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT fk_coll_currency     FOREIGN KEY (currency_id)         REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_coll_lc           FOREIGN KEY (lc_id)               REFERENCES dbo.letter_of_credit(lc_id),
    CONSTRAINT fk_coll_bg           FOREIGN KEY (bg_id)               REFERENCES dbo.bank_guarantee(bg_id),
    CONSTRAINT fk_coll_doc          FOREIGN KEY (document_store_id)   REFERENCES dbo.document_store(document_id)
) WITH (DATA_COMPRESSION = ROW);
GO
CREATE INDEX ix_coll_entity  ON dbo.collateral (legal_entity_id, direction, status);
CREATE INDEX ix_coll_secured ON dbo.collateral (secured_entity_type, secured_entity_id, status);
CREATE INDEX ix_coll_expiry  ON dbo.collateral (maturity_date, status)
    WHERE maturity_date IS NOT NULL;
GO


-- =============================================================================
-- GROUP G — REGULATORY & COMPLIANCE
-- =============================================================================

-- 19. REGULATORY_REPORT_TYPE
-- All regulatory report types across all jurisdictions.
-- =============================================================================
CREATE TABLE dbo.regulatory_report_type (
    report_type_id      INT             NOT NULL IDENTITY(1,1),
    report_code         VARCHAR(30)     NOT NULL,
    report_name         VARCHAR(200)    NOT NULL,
    regulation          VARCHAR(50)     NOT NULL
        CONSTRAINT chk_rrt_reg CHECK (regulation IN (
            'EMIR',         -- European Market Infrastructure Regulation
            'REMIT',        -- Regulation on Energy Market Integrity and Transparency
            'CFTC',         -- US CFTC reporting
            'DODD_FRANK',   -- US Dodd-Frank Act
            'MIFID2',       -- Markets in Financial Instruments Directive II
            'SFTR',         -- Securities Financing Transactions Regulation
            'UK_EMIR',      -- UK post-Brexit EMIR equivalent
            'ASIC',         -- Australian Securities and Investments Commission
            'MAS',          -- Monetary Authority of Singapore
            'INTERNAL',     -- Internal management reporting
            'OTHER'
        )),
    jurisdiction        CHAR(2)         NULL,       -- ISO country/region code
    submission_target   VARCHAR(100)    NULL,       -- regulatory body or trade repository
    reporting_deadline  VARCHAR(100)    NULL,       -- e.g. 'T+1 business day'
    report_format       VARCHAR(20)     NULL,       -- 'XML','CSV','FpML','ISO20022'
    is_mandatory        BIT             NOT NULL DEFAULT 1,
    description         VARCHAR(500)    NULL,
    is_active           BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_rrt               PRIMARY KEY (report_type_id),
    CONSTRAINT uq_rrt_code          UNIQUE      (report_code)
);
GO


-- 20. REGULATORY_OBLIGATION
-- Which legal entities are obligated to report under which regulation.
-- Effective-dated so obligations can change when thresholds change.
-- =============================================================================
CREATE TABLE dbo.regulatory_obligation (
    obligation_id       INT             NOT NULL IDENTITY(1,1),
    legal_entity_id     INT             NOT NULL,
    report_type_id      INT             NOT NULL,
    -- Obligation details
    obligation_type     VARCHAR(20)     NOT NULL DEFAULT 'FULL'
        CONSTRAINT chk_ro_type CHECK (obligation_type IN (
            'FULL',         -- full reporting obligation
            'DELEGATED',    -- reporting delegated to counterparty
            'EXEMPT',       -- exempt from reporting
            'PARTIAL'       -- partial obligation (certain product types only)
        )),
    applicable_commodities VARCHAR(200) NULL,   -- CSV, NULL = all
    reporting_entity_id INT             NULL,   -- if DELEGATED: who reports on our behalf
    -- Registration details
    registration_ref    VARCHAR(100)    NULL,   -- LEI or regulatory registration ID
    registered_date     DATE            NULL,
    -- Validity
    effective_from      DATE            NOT NULL,
    effective_to        DATE            NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(500)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_reg_obligation    PRIMARY KEY (obligation_id),
    CONSTRAINT uq_ro                UNIQUE      (legal_entity_id, report_type_id, effective_from),
    CONSTRAINT fk_ro_entity         FOREIGN KEY (legal_entity_id)   REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_ro_report_type    FOREIGN KEY (report_type_id)    REFERENCES dbo.regulatory_report_type(report_type_id),
    CONSTRAINT fk_ro_rep_entity     FOREIGN KEY (reporting_entity_id) REFERENCES dbo.legal_entity(legal_entity_id)
);
GO
CREATE INDEX ix_ro_entity ON dbo.regulatory_obligation (legal_entity_id, is_active);
GO


-- 21. TRADE_REPOSITORY
-- Approved trade repositories for regulatory reporting submission.
-- =============================================================================
CREATE TABLE dbo.trade_repository (
    repository_id       INT             NOT NULL IDENTITY(1,1),
    repository_code     VARCHAR(20)     NOT NULL,
    repository_name     VARCHAR(200)    NOT NULL,
    regulation          VARCHAR(50)     NOT NULL,   -- same values as regulatory_report_type
    jurisdiction        CHAR(2)         NULL,
    operator_cp_id      INT             NULL,       -- FK counterparty (TR operator)
    submission_url      VARCHAR(300)    NULL,
    submission_format   VARCHAR(20)     NULL,       -- 'XML','REST','SFTP'
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(300)    NULL,

    CONSTRAINT pk_trade_repository  PRIMARY KEY (repository_id),
    CONSTRAINT uq_tr_code           UNIQUE      (repository_code),
    CONSTRAINT fk_tr_cp             FOREIGN KEY (operator_cp_id) REFERENCES dbo.counterparty(counterparty_id)
);
GO


-- 22. REPORTING_COUNTERPARTY
-- Maps which trade repository each legal entity uses for each regulation.
-- Includes our reporting credentials (reference only — no secrets stored).
-- =============================================================================
CREATE TABLE dbo.reporting_counterparty (
    rc_id               INT             NOT NULL IDENTITY(1,1),
    legal_entity_id     INT             NOT NULL,
    repository_id       INT             NOT NULL,
    report_type_id      INT             NOT NULL,
    -- Our identifier at this trade repository
    reporter_lei        VARCHAR(20)     NOT NULL,   -- our LEI used for submissions
    reporter_id         VARCHAR(100)    NULL,       -- repository-assigned reporter ID
    credentials_ref     VARCHAR(100)    NULL,       -- vault key for API credentials
    -- Submission details
    submission_method   VARCHAR(20)     NULL
        CONSTRAINT chk_rc_method CHECK (submission_method IN (
            'API','SFTP','WEB_PORTAL','DELEGATED',NULL
        )),
    test_mode           BIT             NOT NULL DEFAULT 0,
    effective_from      DATE            NOT NULL,
    effective_to        DATE            NULL,
    is_active           BIT             NOT NULL DEFAULT 1,
    notes               VARCHAR(300)    NULL,
    created_at          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_rc                PRIMARY KEY (rc_id),
    CONSTRAINT uq_rc                UNIQUE      (legal_entity_id, repository_id, report_type_id),
    CONSTRAINT fk_rc_entity         FOREIGN KEY (legal_entity_id) REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_rc_repository     FOREIGN KEY (repository_id)   REFERENCES dbo.trade_repository(repository_id),
    CONSTRAINT fk_rc_report_type    FOREIGN KEY (report_type_id)  REFERENCES dbo.regulatory_report_type(report_type_id)
);
GO


-- =============================================================================
-- REFERENCE DATA SEEDS
-- =============================================================================

-- Event categories
INSERT INTO dbo.event_category (category_code, category_name, description)
VALUES
    ('TRADE',       'Trade Lifecycle',      'Events related to trade creation and lifecycle'),
    ('DELIVERY',    'Delivery & Logistics', 'Physical delivery and logistics events'),
    ('SETTLEMENT',  'Settlement & Payment', 'Settlement, invoicing, and payment events'),
    ('RISK',        'Risk Management',      'Risk limit, VaR, and exposure events'),
    ('CREDIT',      'Credit & Collateral',  'Credit limit, margin call, and collateral events'),
    ('MARKET_DATA', 'Market Data',          'Curve loading, fixing, and data quality events'),
    ('REGULATORY',  'Regulatory',           'Regulatory reporting and compliance events'),
    ('SYSTEM',      'System',               'System operational events'),
    ('USER',        'User Activity',        'User authentication and access events');
GO

-- Event types
INSERT INTO dbo.event_type (category_id, event_code, event_name, entity_type, severity, requires_action, requires_approval, triggers_notification, is_reportable)
SELECT c.category_id, e.event_code, e.event_name, e.entity_type, e.severity,
       e.requires_action, e.requires_approval, e.triggers_notification, e.is_reportable
FROM (VALUES
    -- Trade events
    ('TRADE','TRADE_CREATED',           'Trade Created',                    'TRADE',    'INFO',     0,0,1,1),
    ('TRADE','TRADE_AMENDED',           'Trade Amended',                    'TRADE',    'INFO',     0,1,1,1),
    ('TRADE','TRADE_CANCELLED',         'Trade Cancelled',                  'TRADE',    'WARNING',  0,1,1,1),
    ('TRADE','TRADE_CONFIRMED',         'Trade Confirmed by Counterparty',  'TRADE',    'INFO',     0,0,1,0),
    ('TRADE','TRADE_EXPIRED',           'Trade Expired',                    'TRADE',    'INFO',     0,0,1,0),
    ('TRADE','TRADE_PENDING_APPROVAL',  'Trade Pending Approval',           'TRADE',    'ALERT',    1,1,1,0),
    ('TRADE','TRADE_APPROVED',          'Trade Approved',                   'TRADE',    'INFO',     0,0,1,0),
    ('TRADE','TRADE_REJECTED',          'Trade Rejected',                   'TRADE',    'WARNING',  1,0,1,0),
    -- Delivery events
    ('DELIVERY','DELIVERY_SCHEDULED',   'Delivery Scheduled',               'DELIVERY', 'INFO',     0,0,1,0),
    ('DELIVERY','VESSEL_NOMINATED',     'Vessel Nominated',                 'DELIVERY', 'INFO',     0,0,1,0),
    ('DELIVERY','NOR_TENDERED',         'Notice of Readiness Tendered',     'DELIVERY', 'ALERT',    1,0,1,0),
    ('DELIVERY','LOADING_COMMENCED',    'Loading Commenced',                'DELIVERY', 'INFO',     0,0,1,0),
    ('DELIVERY','LOADING_COMPLETED',    'Loading Completed',                'DELIVERY', 'INFO',     0,0,1,0),
    ('DELIVERY','DELIVERY_COMPLETED',   'Delivery Completed',               'DELIVERY', 'INFO',     0,0,1,0),
    ('DELIVERY','DELIVERY_FAILED',      'Delivery Failed',                  'DELIVERY', 'CRITICAL', 1,0,1,0),
    -- Settlement events
    ('SETTLEMENT','INVOICE_GENERATED',  'Invoice Generated',                'INVOICE',  'INFO',     0,0,1,0),
    ('SETTLEMENT','INVOICE_APPROVED',   'Invoice Approved',                 'INVOICE',  'INFO',     0,0,1,0),
    ('SETTLEMENT','PAYMENT_DUE',        'Payment Due Today',                'PAYMENT',  'ALERT',    1,0,1,0),
    ('SETTLEMENT','PAYMENT_OVERDUE',    'Payment Overdue',                  'PAYMENT',  'CRITICAL', 1,0,1,0),
    ('SETTLEMENT','PAYMENT_RECEIVED',   'Payment Received',                 'PAYMENT',  'INFO',     0,0,1,0),
    -- Risk events
    ('RISK','POSITION_LIMIT_WARNING',   'Position Limit Warning (80%)',     'POSITION', 'WARNING',  1,0,1,0),
    ('RISK','POSITION_LIMIT_BREACH',    'Position Limit Breached',          'POSITION', 'BREACH',   1,1,1,0),
    ('RISK','PNL_STOP_LOSS',            'P&L Stop Loss Triggered',          'POSITION', 'BREACH',   1,1,1,0),
    ('RISK','VAR_LIMIT_BREACH',         'VaR Limit Breached',               'RISK',     'BREACH',   1,1,1,0),
    ('RISK','TRADER_LIMIT_BREACH',      'Trader Limit Breached',            'TRADE',    'BREACH',   1,1,1,0),
    -- Credit events
    ('CREDIT','CREDIT_LIMIT_WARNING',   'Credit Limit Warning (80%)',       'CREDIT',   'WARNING',  1,0,1,0),
    ('CREDIT','CREDIT_LIMIT_BREACH',    'Credit Limit Breached',            'CREDIT',   'BREACH',   1,1,1,0),
    ('CREDIT','MARGIN_CALL_ISSUED',     'Margin Call Issued',               'MARGIN',   'ALERT',    1,0,1,0),
    ('CREDIT','MARGIN_CALL_OVERDUE',    'Margin Call Overdue',              'MARGIN',   'CRITICAL', 1,1,1,0),
    ('CREDIT','LC_EXPIRY_WARNING',      'LC Expiring in 30 Days',           'CREDIT',   'WARNING',  1,0,1,0),
    ('CREDIT','KYC_EXPIRY_WARNING',     'KYC Expiring in 30 Days',          'COUNTERPARTY','WARNING',1,0,1,0),
    -- Market data events
    ('MARKET_DATA','CURVE_LOADED',      'Price Curve Loaded',               'MARKET_DATA','INFO',   0,0,0,0),
    ('MARKET_DATA','CURVE_MISSING',     'Price Curve Missing at EOD',       'MARKET_DATA','ALERT',  1,0,1,0),
    ('MARKET_DATA','CURVE_STALE',       'Price Curve Stale (prior day)',    'MARKET_DATA','WARNING',1,0,1,0),
    ('MARKET_DATA','FIXING_PUBLISHED',  'Rate/Price Fixing Published',      'MARKET_DATA','INFO',   0,0,0,0),
    -- System events
    ('SYSTEM','EOD_STARTED',            'End of Day Batch Started',         'SYSTEM',   'INFO',     0,0,0,0),
    ('SYSTEM','EOD_COMPLETED',          'End of Day Batch Completed',       'SYSTEM',   'INFO',     0,0,1,0),
    ('SYSTEM','EOD_FAILED',             'End of Day Batch Failed',          'SYSTEM',   'CRITICAL', 1,0,1,0),
    ('SYSTEM','MTM_RUN_COMPLETED',      'MTM Valuation Run Completed',      'SYSTEM',   'INFO',     0,0,0,0),
    -- Regulatory events
    ('REGULATORY','REPORT_SUBMITTED',   'Regulatory Report Submitted',      'SYSTEM',   'INFO',     0,0,0,0),
    ('REGULATORY','REPORT_REJECTED',    'Regulatory Report Rejected',       'SYSTEM',   'CRITICAL', 1,0,1,0),
    ('REGULATORY','REPORT_OVERDUE',     'Regulatory Report Overdue',        'SYSTEM',   'BREACH',   1,1,1,0)
) AS e(cat_code, event_code, event_name, entity_type, severity,
       requires_action, requires_approval, triggers_notification, is_reportable)
JOIN dbo.event_category c ON c.category_code = e.cat_code;
GO

-- Interest rate indices
INSERT INTO dbo.interest_rate_index (index_code, index_name, currency_id, tenor,
    day_count_convention, compounding, publication_source, is_rfrr)
SELECT i.index_code, i.index_name, c.currency_id, i.tenor,
       i.dcc, i.comp, i.source, i.rfrr
FROM (VALUES
    ('SOFR',        'Secured Overnight Financing Rate',           'USD','OVERNIGHT','ACT_360','OVERNIGHT_COMPOUNDED','NY Fed',         1),
    ('SOFR_1M',     'SOFR Term 1 Month',                          'USD','1M',       'ACT_360','SIMPLE',             'CME Group',      1),
    ('SOFR_3M',     'SOFR Term 3 Month',                          'USD','3M',       'ACT_360','SIMPLE',             'CME Group',      1),
    ('EURIBOR_1M',  'Euro Interbank Offered Rate 1 Month',        'EUR','1M',       'ACT_360','SIMPLE',             'EMMI',           0),
    ('EURIBOR_3M',  'Euro Interbank Offered Rate 3 Month',        'EUR','3M',       'ACT_360','SIMPLE',             'EMMI',           0),
    ('EURIBOR_6M',  'Euro Interbank Offered Rate 6 Month',        'EUR','6M',       'ACT_360','SIMPLE',             'EMMI',           0),
    ('ESTR',        'Euro Short-Term Rate',                       'EUR','OVERNIGHT','ACT_360','OVERNIGHT_COMPOUNDED','ECB',           1),
    ('SONIA',       'Sterling Overnight Index Average',           'GBP','OVERNIGHT','ACT_365','OVERNIGHT_COMPOUNDED','BoE',           1),
    ('SONIA_3M',    'SONIA Compounded 3 Month',                   'GBP','3M',       'ACT_365','COMPOUNDED',         'BoE',            1),
    ('TONAR',       'Tokyo Overnight Average Rate',               'JPY','OVERNIGHT','ACT_365','OVERNIGHT_COMPOUNDED','BoJ',           1),
    ('FEDFUNDS',    'US Federal Funds Rate',                      'USD','OVERNIGHT','ACT_360','SIMPLE',             'Federal Reserve',0),
    ('PRIME_USD',   'US Prime Rate',                              'USD','OVERNIGHT','ACT_360','SIMPLE',             'WSJ',            0)
) AS i(index_code, index_name, ccy, tenor, dcc, comp, source, rfrr)
JOIN dbo.currency c ON c.currency_code = i.ccy;
GO

-- Collateral types
INSERT INTO dbo.collateral_type (type_code, type_name, asset_class, standard_haircut_pct, description)
VALUES
    ('CASH_USD',    'Cash USD',                     'CASH',             0.0,  'USD cash collateral'),
    ('CASH_EUR',    'Cash EUR',                     'CASH',             0.0,  'EUR cash collateral'),
    ('CASH_GBP',    'Cash GBP',                     'CASH',             0.0,  'GBP cash collateral'),
    ('GOV_US',      'US Treasury Bonds',            'GOVERNMENT_BOND',  2.0,  'US Government securities'),
    ('GOV_UK',      'UK Gilts',                     'GOVERNMENT_BOND',  2.0,  'UK Government securities'),
    ('GOV_DE',      'German Bunds',                 'GOVERNMENT_BOND',  2.0,  'German Government securities'),
    ('CORP_IG',     'Investment Grade Corp Bonds',  'CORPORATE_BOND',  10.0,  'BBB- or above rated corporate bonds'),
    ('LC',          'Letter of Credit',             'LETTER_OF_CREDIT', 0.0,  'Bank-issued letter of credit'),
    ('BG',          'Bank Guarantee',               'BANK_GUARANTEE',   0.0,  'Bank-issued guarantee');
GO

-- Regulatory report types
INSERT INTO dbo.regulatory_report_type (report_code, report_name, regulation, jurisdiction,
    submission_target, reporting_deadline, report_format, is_mandatory)
VALUES
    ('EMIR_TRADE',      'EMIR Trade Report',                'EMIR',      'EU', 'Trade Repository',         'T+1 business day', 'XML',    1),
    ('EMIR_POSITION',   'EMIR Position Report',             'EMIR',      'EU', 'Trade Repository',         'T+1 business day', 'XML',    1),
    ('REMIT_TABLE1',    'REMIT Table 1 — Standard Contract','REMIT',     'EU', 'ACER ARIS',                'T+1 business day', 'XML',    1),
    ('REMIT_TABLE2',    'REMIT Table 2 — Non-Standard',     'REMIT',     'EU', 'ACER ARIS',                'T+1 business day', 'XML',    1),
    ('UK_EMIR_TRADE',   'UK EMIR Trade Report',             'UK_EMIR',   'GB', 'UK Trade Repository',      'T+1 business day', 'XML',    1),
    ('CFTC_SWAP',       'CFTC Swap Data Report',            'CFTC',      'US', 'DTCC SDR',                 'T+1 business day', 'XML',    1),
    ('MIFID2_TRANS',    'MiFID II Transaction Report',      'MIFID2',    'EU', 'National Competent Auth',  'T+1 business day', 'XML',    1),
    ('INTERNAL_DAILY',  'Internal Daily Trading Report',    'INTERNAL',  NULL, 'Management',               'EOD',              'CSV',    0),
    ('INTERNAL_RISK',   'Internal Daily Risk Report',       'INTERNAL',  NULL, 'Risk Committee',           'EOD',              'PDF',    0);
GO

PRINT '============================================================';
PRINT 'FINANCIAL & OPERATIONAL MASTER DATA v1.0 APPLIED';
PRINT '  Group A — Events          : event_category, event_type (42 seeded)';
PRINT '  Group B — Formula         : formula_template, formula_component';
PRINT '  Group C — Interest Rates  : interest_rate_index (12 seeded),';
PRINT '                              interest_rate, rate_fixing';
PRINT '  Group D — Insurance       : insurance_provider, insurance_policy,';
PRINT '                              insurance_policy_coverage';
PRINT '  Group E — Credit Instrmts : letter_of_credit, bank_guarantee,';
PRINT '                              lc_amendment, bg_amendment';
PRINT '  Group F — Margin/Collat   : margin_account, margin_call,';
PRINT '                              collateral_type (9 seeded), collateral';
PRINT '  Group G — Regulatory      : regulatory_report_type (9 seeded),';
PRINT '                              regulatory_obligation,';
PRINT '                              trade_repository, reporting_counterparty';
PRINT '============================================================';
GO
