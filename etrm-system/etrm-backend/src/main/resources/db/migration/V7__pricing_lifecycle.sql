-- =============================================================================
-- ETRM SYSTEM — PRICING LIFECYCLE OPERATIONAL TABLES
-- SQL Server 2022 | Version 1.0 | May 2026
-- =============================================================================
-- TABLES (6 total):
--
--   01. trade_pricing_schedule       — generated fixing schedule per trade
--   02. pricing_event                — individual fixing event per date/index
--   03. pricing_event_staging        — raw feed values before validation
--   04. formula_evaluation_log       — audit of every formula calculation
--   05. pricing_dispute              — disputed fixings and resolution
--   06. missing_fixing_rule          — fallback rules per product/index
--
-- =============================================================================
-- FLOW:
--
--  trade captured
--      ↓
--  trade_pricing_schedule created (one row per trade)
--      ↓
--  pricing_event rows generated (one per fixing date × index)
--      ↓
--  price source feed arrives → pricing_event_staging (raw value)
--      ↓
--  validation step → pricing_event.actual_value populated (confirmed)
--      ↓
--  all fixings received → formula_evaluation_log (calculated price)
--      ↓
--  counterparty confirms or raises → pricing_dispute (if disagreement)
--      ↓
--  final price confirmed → invoice triggered
--
-- =============================================================================
-- Run AFTER:
--   etrm_master_data_v2.0.sql
--   etrm_market_source_period_v1.0.sql
--   etrm_financial_operational_v1.0.sql
--   etrm_pricing_triggers_rules_v1.0.sql
-- NOTE: trade_id FK added later when trade table is built
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- CLEANUP
-- =============================================================================
IF OBJECT_ID('dbo.missing_fixing_rule',       'U') IS NOT NULL DROP TABLE dbo.missing_fixing_rule;
IF OBJECT_ID('dbo.pricing_dispute',           'U') IS NOT NULL DROP TABLE dbo.pricing_dispute;
IF OBJECT_ID('dbo.formula_evaluation_log',    'U') IS NOT NULL DROP TABLE dbo.formula_evaluation_log;
IF OBJECT_ID('dbo.pricing_event_staging',     'U') IS NOT NULL DROP TABLE dbo.pricing_event_staging;
IF OBJECT_ID('dbo.pricing_event',             'U') IS NOT NULL DROP TABLE dbo.pricing_event;
IF OBJECT_ID('dbo.trade_pricing_schedule',    'U') IS NOT NULL DROP TABLE dbo.trade_pricing_schedule;
GO


-- =============================================================================
-- 01. TRADE_PRICING_SCHEDULE
-- Generated at trade capture time — one row per trade.
-- Defines the complete pricing setup for this specific trade instance:
-- which rule applies, what the trigger date is (or will be),
-- pricing period start/end, how many fixings expected.
-- This is the master record that pricing_event rows hang off.
-- =============================================================================
CREATE TABLE dbo.trade_pricing_schedule (
    schedule_id             INT             NOT NULL IDENTITY(1,1),

    -- Trade reference
    -- NOTE: trade_id FK added via ALTER after trade table is created
    trade_id                INT             NOT NULL,

    -- Pricing rule applied (snapshotted at trade capture)
    pricing_rule_id         INT             NOT NULL,

    -- Pricing type for this trade (from pricing_rule or overridden at deal)
    pricing_type_id         INT             NOT NULL,

    -- Index and formula
    price_index_id          INT             NULL,
    formula_template_id     INT             NULL,
    differential_value      DECIMAL(18,6)   NULL,
    differential_currency_id INT            NULL,

    -- Trigger event
    primary_trigger_type_id INT             NULL,
    fallback_trigger_type_id INT            NULL,

    -- Trigger dates
    -- primary_trigger_date = actual confirmed date of cargo event
    -- estimated_trigger_date = system-estimated before confirmation
    estimated_trigger_date  DATE            NULL,
    primary_trigger_date    DATE            NULL,   -- set by ops when confirmed
    trigger_confirmed_at    DATETIME2       NULL,
    trigger_confirmed_by    VARCHAR(100)    NULL,

    -- Was fallback applied?
    fallback_applied        BIT             NOT NULL DEFAULT 0,
    fallback_applied_at     DATETIME2       NULL,
    fallback_reason         VARCHAR(200)    NULL,

    -- Pricing period (derived from trigger + window rule)
    pricing_period_start    DATE            NULL,   -- first fixing date
    pricing_period_end      DATE            NULL,   -- last fixing date
    window_rule_id          INT             NULL,

    -- Fixing counts
    expected_fixings        SMALLINT        NULL,   -- total expected based on window
    received_fixings        SMALLINT        NOT NULL DEFAULT 0,
    valid_fixings           SMALLINT        NOT NULL DEFAULT 0,
    missing_fixings         SMALLINT        NOT NULL DEFAULT 0,

    -- Calculated price (populated when all/enough fixings received)
    calculated_price        DECIMAL(18,6)   NULL,
    price_currency_id       INT             NULL,
    price_uom_id            INT             NULL,
    calculation_complete    BIT             NOT NULL DEFAULT 0,
    calculation_date        DATETIME2       NULL,

    -- FX
    fx_rate_applied         DECIMAL(18,8)   NULL,
    fx_rate_date            DATE            NULL,
    fx_index_id             INT             NULL,

    -- Final confirmed price (after any dispute resolution)
    final_price             DECIMAL(18,6)   NULL,
    final_price_currency_id INT             NULL,
    price_confirmed_at      DATETIME2       NULL,
    price_confirmed_by      VARCHAR(100)    NULL,

    -- Invoice trigger
    invoice_trigger_type_id INT             NULL,
    invoice_trigger_date    DATE            NULL,
    invoice_due_date        DATE            NULL,
    invoice_generated       BIT             NOT NULL DEFAULT 0,
    invoice_generated_at    DATETIME2       NULL,

    -- Provisional invoice
    provisional_price       DECIMAL(18,6)   NULL,
    provisional_basis       VARCHAR(50)     NULL,
    provisional_invoice_id  INT             NULL,   -- FK to invoice when built
    requires_true_up        BIT             NOT NULL DEFAULT 0,
    true_up_complete        BIT             NOT NULL DEFAULT 0,

    -- Schedule status
    schedule_status         VARCHAR(20)     NOT NULL DEFAULT 'PENDING'
        CONSTRAINT chk_tps_status CHECK (schedule_status IN (
            'PENDING',          -- awaiting trigger date confirmation
            'TRIGGER_SET',      -- trigger date confirmed, fixings not yet started
            'FIXING_IN_PROGRESS',-- pricing period open, fixings being collected
            'FIXINGS_COMPLETE', -- all fixings received, formula evaluated
            'DISPUTED',         -- counterparty has raised a dispute
            'CONFIRMED',        -- final price agreed by both parties
            'INVOICED',         -- invoice raised against confirmed price
            'CLOSED',           -- fully settled, no further action
            'SUSPENDED',        -- suspended — missing fixings, ops intervention needed
            'CANCELLED'         -- trade cancelled, pricing voided
        )),

    -- Audit
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,
    updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_tps               PRIMARY KEY (schedule_id),
    CONSTRAINT uq_tps_trade         UNIQUE      (trade_id),
    -- One pricing schedule per trade
    CONSTRAINT fk_tps_rule          FOREIGN KEY (pricing_rule_id)           REFERENCES dbo.pricing_rule(pricing_rule_id),
    CONSTRAINT fk_tps_pricing_type  FOREIGN KEY (pricing_type_id)           REFERENCES dbo.pricing_type(pricing_type_id),
    CONSTRAINT fk_tps_index         FOREIGN KEY (price_index_id)            REFERENCES dbo.price_index(price_index_id),
    CONSTRAINT fk_tps_formula       FOREIGN KEY (formula_template_id)       REFERENCES dbo.formula_template(template_id),
    CONSTRAINT fk_tps_prim_trigger  FOREIGN KEY (primary_trigger_type_id)   REFERENCES dbo.pricing_trigger_event_type(trigger_type_id),
    CONSTRAINT fk_tps_fall_trigger  FOREIGN KEY (fallback_trigger_type_id)  REFERENCES dbo.pricing_trigger_event_type(trigger_type_id),
    CONSTRAINT fk_tps_window        FOREIGN KEY (window_rule_id)            REFERENCES dbo.pricing_window_rule(window_rule_id),
    CONSTRAINT fk_tps_price_ccy     FOREIGN KEY (price_currency_id)         REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_tps_price_uom     FOREIGN KEY (price_uom_id)              REFERENCES dbo.unit_of_measure(uom_id),
    CONSTRAINT fk_tps_fx_index      FOREIGN KEY (fx_index_id)               REFERENCES dbo.price_index(price_index_id),
    CONSTRAINT fk_tps_final_ccy     FOREIGN KEY (final_price_currency_id)   REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_tps_inv_trigger   FOREIGN KEY (invoice_trigger_type_id)   REFERENCES dbo.pricing_trigger_event_type(trigger_type_id),
    CONSTRAINT fk_tps_diff_ccy      FOREIGN KEY (differential_currency_id)  REFERENCES dbo.currency(currency_id)
) WITH (DATA_COMPRESSION = ROW);
GO

-- Temporal table — full history of pricing schedule changes
ALTER TABLE dbo.trade_pricing_schedule
    ADD valid_from DATETIME2 GENERATED ALWAYS AS ROW START HIDDEN
            CONSTRAINT df_tps_vf DEFAULT SYSUTCDATETIME(),
        valid_to   DATETIME2 GENERATED ALWAYS AS ROW END   HIDDEN
            CONSTRAINT df_tps_vt DEFAULT CONVERT(DATETIME2,'9999-12-31 23:59:59.9999999'),
        PERIOD FOR SYSTEM_TIME (valid_from, valid_to);
GO
ALTER TABLE dbo.trade_pricing_schedule
    SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.trade_pricing_schedule_history));
GO

CREATE INDEX ix_tps_status      ON dbo.trade_pricing_schedule
    (schedule_status, pricing_period_end)
    INCLUDE (trade_id, expected_fixings, received_fixings);
CREATE INDEX ix_tps_trigger     ON dbo.trade_pricing_schedule
    (primary_trigger_date, schedule_status)
    WHERE primary_trigger_date IS NOT NULL;
CREATE INDEX ix_tps_invoice_due ON dbo.trade_pricing_schedule
    (invoice_due_date, invoice_generated)
    WHERE invoice_due_date IS NOT NULL;
GO


-- =============================================================================
-- 02. PRICING_EVENT
-- One row per fixing date per index per trade pricing schedule.
-- This is the atomic record of each individual price observation.
-- For a 3-day BL average: 3 rows per trade (one per day).
-- For a monthly average with 22 trading days: 22 rows per trade.
-- =============================================================================
CREATE TABLE dbo.pricing_event (
    pricing_event_id        INT             NOT NULL IDENTITY(1,1),
    schedule_id             INT             NOT NULL,
    price_index_id          INT             NOT NULL,

    -- The fixing date
    fixing_date             DATE            NOT NULL,

    -- Was this date generated from the primary window or fallback?
    window_position         VARCHAR(20)     NOT NULL DEFAULT 'IN_WINDOW'
        CONSTRAINT chk_pe_position CHECK (window_position IN (
            'IN_WINDOW',        -- standard fixing date within window
            'FALLBACK_DATE',    -- fallback date applied (deemed/prior day)
            'INTERPOLATED',     -- value interpolated — no actual fixing
            'EXCLUDED'          -- excluded from average (holiday, bad data)
        )),

    -- Day label within the window (for reporting/audit clarity)
    window_day_label        VARCHAR(20)     NULL,
    -- e.g. 'BL-1', 'BL', 'BL+1', 'Day 1 of 22', 'M+1 Day 5'

    -- Source — where this fixing should come from
    price_source_id         INT             NOT NULL,
    -- Primary source as defined in price_index_source

    backup_source_id        INT             NULL,
    -- Populated if backup source needs to be used

    -- Expected vs actual fixing values
    expected_value          DECIMAL(18,6)   NULL,
    -- Pre-populated from prior day or last known (for monitoring)

    raw_value               DECIMAL(18,6)   NULL,
    -- Value received directly from price source feed
    -- before any validation

    actual_value            DECIMAL(18,6)   NULL,
    -- Confirmed value after validation gate
    -- This is what goes into the formula calculation

    fallback_value          DECIMAL(18,6)   NULL,
    -- Value from fallback source or prior day
    -- Used if actual_value not available

    value_used              DECIMAL(18,6)   NULL,
    -- Final value used in formula calculation
    -- = actual_value if available, else fallback_value

    value_currency_id       INT             NULL,
    value_uom_id            INT             NULL,

    -- FX conversion (if index publishes in different currency to trade)
    fx_rate                 DECIMAL(18,8)   NULL,
    fx_rate_date            DATE            NULL,
    converted_value         DECIMAL(18,6)   NULL,
    -- value_used converted to trade currency

    -- Weighting within average
    weight                  DECIMAL(10,8)   NOT NULL DEFAULT 1.0,
    -- 1.0 = equal weight (standard)
    -- Can differ for volume-weighted or custom-weighted averaging

    -- Status of this individual fixing
    fixing_status           VARCHAR(20)     NOT NULL DEFAULT 'PENDING'
        CONSTRAINT chk_pe_status CHECK (fixing_status IN (
            'PENDING',          -- not yet due or not yet received
            'RECEIVED',         -- raw value received from source
            'VALIDATED',        -- validated and confirmed — ready for use
            'MISSING',          -- due but not received — fallback applied
            'DISPUTED',         -- value disputed by counterparty
            'OVERRIDDEN',       -- manually overridden by authorised user
            'EXCLUDED',         -- excluded from average (holiday/bad data)
            'INTERPOLATED'      -- interpolated value used
        )),

    -- Validation
    validated_at            DATETIME2       NULL,
    validated_by            VARCHAR(100)    NULL,
    validation_notes        VARCHAR(200)    NULL,

    -- Override audit (if manually overridden)
    overridden_at           DATETIME2       NULL,
    overridden_by           VARCHAR(100)    NULL,
    override_reason         VARCHAR(300)    NULL,
    original_value          DECIMAL(18,6)   NULL,
    -- stored when value is overridden so original is never lost

    -- Dispute flag
    is_disputed             BIT             NOT NULL DEFAULT 0,

    -- Audit
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_pricing_event     PRIMARY KEY (pricing_event_id),
    CONSTRAINT uq_pe_date_index     UNIQUE      (schedule_id, price_index_id, fixing_date),
    CONSTRAINT fk_pe_schedule       FOREIGN KEY (schedule_id)       REFERENCES dbo.trade_pricing_schedule(schedule_id),
    CONSTRAINT fk_pe_index          FOREIGN KEY (price_index_id)    REFERENCES dbo.price_index(price_index_id),
    CONSTRAINT fk_pe_source         FOREIGN KEY (price_source_id)   REFERENCES dbo.price_source(price_source_id),
    CONSTRAINT fk_pe_backup         FOREIGN KEY (backup_source_id)  REFERENCES dbo.price_source(price_source_id),
    CONSTRAINT fk_pe_currency       FOREIGN KEY (value_currency_id) REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_pe_uom            FOREIGN KEY (value_uom_id)      REFERENCES dbo.unit_of_measure(uom_id),
    CONSTRAINT chk_pe_weight        CHECK       (weight > 0 AND weight <= 1)
) WITH (DATA_COMPRESSION = ROW);
GO

CREATE INDEX ix_pe_schedule     ON dbo.pricing_event
    (schedule_id, fixing_date, fixing_status)
    INCLUDE (actual_value, value_used, weight);
CREATE INDEX ix_pe_date_index   ON dbo.pricing_event
    (fixing_date, price_index_id, fixing_status)
    INCLUDE (actual_value, raw_value);
CREATE INDEX ix_pe_pending      ON dbo.pricing_event
    (fixing_date, fixing_status)
    WHERE fixing_status IN ('PENDING','MISSING');
CREATE INDEX ix_pe_disputed     ON dbo.pricing_event
    (is_disputed, fixing_status)
    WHERE is_disputed = 1;
GO


-- =============================================================================
-- 03. PRICING_EVENT_STAGING
-- Raw price values received from external feed before validation.
-- Option B design: two-step — feed populates staging first,
-- validation gate confirms into pricing_event.actual_value.
-- Gives clean audit trail: raw feed value vs confirmed value.
-- High-volume append-only table — compressed, minimal indexes.
-- =============================================================================
CREATE TABLE dbo.pricing_event_staging (
    staging_id              BIGINT          NOT NULL IDENTITY(1,1),
    price_index_id          INT             NOT NULL,
    price_source_id         INT             NOT NULL,
    fixing_date             DATE            NOT NULL,

    -- Raw value exactly as received from feed
    raw_value               DECIMAL(18,6)   NOT NULL,
    raw_currency_code       CHAR(3)         NULL,
    raw_uom_code            VARCHAR(20)     NULL,

    -- Feed metadata
    feed_timestamp          DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    feed_message_id         VARCHAR(100)    NULL,   -- source message/batch ID
    feed_sequence           INT             NULL,   -- sequence within batch

    -- Validation outcome
    validation_status       VARCHAR(20)     NOT NULL DEFAULT 'UNVALIDATED'
        CONSTRAINT chk_pes_vstatus CHECK (validation_status IN (
            'UNVALIDATED',      -- received, not yet checked
            'VALID',            -- passed all validation checks
            'INVALID',          -- failed validation — do not use
            'SUSPECT',          -- passed but flagged for review
            'DUPLICATE',        -- duplicate of already received value
            'SUPERSEDED'        -- later value received for same date/index
        )),

    -- Validation checks performed
    check_spike_detected    BIT             NULL,
    -- TRUE if value deviates >N% from prior day (configurable threshold)
    check_stale_detected    BIT             NULL,
    -- TRUE if identical to prior day value (possible stale data)
    check_source_confirmed  BIT             NULL,
    -- TRUE if cross-checked against second source
    cross_check_value       DECIMAL(18,6)   NULL,
    -- Value from second source for comparison
    cross_check_source_id   INT             NULL,
    cross_check_deviation_pct DECIMAL(8,4)  NULL,
    -- % deviation between primary and cross-check source

    -- Validation action
    validated_at            DATETIME2       NULL,
    validated_by            VARCHAR(100)    NULL,
    -- 'SYSTEM' for auto-validation, username for manual
    validation_notes        VARCHAR(300)    NULL,
    rejection_reason        VARCHAR(200)    NULL,

    -- Link to confirmed pricing event (set after validation passes)
    pricing_event_id        INT             NULL,
    promoted_at             DATETIME2       NULL,
    -- timestamp when value was promoted to pricing_event.actual_value

    CONSTRAINT pk_pes               PRIMARY KEY (staging_id),
    CONSTRAINT fk_pes_index         FOREIGN KEY (price_index_id)  REFERENCES dbo.price_index(price_index_id),
    CONSTRAINT fk_pes_source        FOREIGN KEY (price_source_id) REFERENCES dbo.price_source(price_source_id),
    CONSTRAINT fk_pes_event         FOREIGN KEY (pricing_event_id) REFERENCES dbo.pricing_event(pricing_event_id),
    CONSTRAINT fk_pes_xcheck        FOREIGN KEY (cross_check_source_id) REFERENCES dbo.price_source(price_source_id)
) WITH (DATA_COMPRESSION = PAGE);
GO

CREATE INDEX ix_pes_date_index  ON dbo.pricing_event_staging
    (fixing_date, price_index_id, validation_status)
    INCLUDE (raw_value, feed_timestamp);
CREATE INDEX ix_pes_unvalidated ON dbo.pricing_event_staging
    (fixing_date, validation_status)
    WHERE validation_status = 'UNVALIDATED';
GO


-- =============================================================================
-- 04. FORMULA_EVALUATION_LOG
-- Immutable audit trail of every formula calculation.
-- One row per calculation run per trade pricing schedule.
-- Multiple rows exist if recalculated (e.g. after dispute resolution,
-- after late fixing received, after manual override).
-- =============================================================================
CREATE TABLE dbo.formula_evaluation_log (
    evaluation_id           INT             NOT NULL IDENTITY(1,1),
    schedule_id             INT             NOT NULL,
    formula_template_id     INT             NULL,
    pricing_type_id         INT             NOT NULL,

    -- Evaluation context
    evaluation_type         VARCHAR(20)     NOT NULL
        CONSTRAINT chk_fel_type CHECK (evaluation_type IN (
            'PROVISIONAL',      -- preliminary calc before all fixings received
            'INTERIM',          -- recalc triggered by late fixing
            'FINAL',            -- all fixings received and validated
            'POST_DISPUTE',     -- recalc after dispute resolved
            'MANUAL_OVERRIDE',  -- authorised manual recalculation
            'SYSTEM_CORRECTION' -- system-triggered correction run
        )),

    -- Input snapshot — complete record of all inputs used
    -- Stored as JSON so formula can always be fully reconstructed
    component_values        NVARCHAR(MAX)   NOT NULL,
    -- JSON: array of {component_seq, role, index_code,
    --                 fixing_date, raw_value, actual_value,
    --                 weight, source_code}
    -- Example:
    -- [{"seq":1,"role":"PRIMARY_INDEX","index":"DATED_BRENT",
    --   "date":"2026-01-15","value":75.42,"weight":0.333,...},
    --  {"seq":1,"role":"PRIMARY_INDEX","index":"DATED_BRENT",
    --   "date":"2026-01-16","value":75.85,"weight":0.333,...},
    --  {"seq":2,"role":"DIFFERENTIAL","value":-0.50,"weight":1.0}]

    fixings_used            SMALLINT        NOT NULL,
    fixings_expected        SMALLINT        NULL,
    fixings_missing         SMALLINT        NOT NULL DEFAULT 0,

    -- Intermediate calculation steps
    raw_average             DECIMAL(18,6)   NULL,
    -- simple average of index fixings before differential

    differential_applied    DECIMAL(18,6)   NULL,
    -- differential value applied (positive = premium, negative = discount)

    pre_fx_price            DECIMAL(18,6)   NULL,
    -- price in index currency before FX conversion

    fx_rate_applied         DECIMAL(18,8)   NULL,
    fx_rate_source          VARCHAR(100)    NULL,
    fx_rate_date            DATE            NULL,

    -- Final result
    calculated_price        DECIMAL(18,6)   NOT NULL,
    price_currency_id       INT             NOT NULL,
    price_uom_id            INT             NOT NULL,
    -- Price before rounding
    pre_rounding_price      DECIMAL(18,8)   NULL,
    rounding_applied        VARCHAR(20)     NULL,
    decimal_places_applied  TINYINT         NULL,

    -- Is this the current active calculation for this schedule?
    is_current              BIT             NOT NULL DEFAULT 1,
    superseded_by           INT             NULL,
    -- FK to later evaluation_id that replaced this one

    -- Who/what triggered this evaluation
    triggered_by            VARCHAR(20)     NOT NULL DEFAULT 'SYSTEM'
        CONSTRAINT chk_fel_triggered CHECK (triggered_by IN (
            'SYSTEM',           -- automated EOD/intraday run
            'MANUAL',           -- manually triggered by user
            'FEED_UPDATE',      -- triggered by new/corrected fixing arriving
            'DISPUTE_RESOLVED', -- triggered by dispute resolution
            'FALLBACK_APPLIED'  -- triggered by fallback rule firing
        )),
    triggered_by_user       VARCHAR(100)    NULL,
    evaluation_notes        VARCHAR(500)    NULL,

    -- Timestamp
    evaluated_at            DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT pk_fel               PRIMARY KEY (evaluation_id),
    CONSTRAINT fk_fel_schedule      FOREIGN KEY (schedule_id)       REFERENCES dbo.trade_pricing_schedule(schedule_id),
    CONSTRAINT fk_fel_formula       FOREIGN KEY (formula_template_id) REFERENCES dbo.formula_template(template_id),
    CONSTRAINT fk_fel_pricing_type  FOREIGN KEY (pricing_type_id)   REFERENCES dbo.pricing_type(pricing_type_id),
    CONSTRAINT fk_fel_currency      FOREIGN KEY (price_currency_id) REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_fel_uom           FOREIGN KEY (price_uom_id)      REFERENCES dbo.unit_of_measure(uom_id),
    CONSTRAINT fk_fel_superseded    FOREIGN KEY (superseded_by)     REFERENCES dbo.formula_evaluation_log(evaluation_id)
) WITH (DATA_COMPRESSION = PAGE);
GO

CREATE INDEX ix_fel_schedule    ON dbo.formula_evaluation_log
    (schedule_id, evaluation_type, is_current, evaluated_at DESC);
CREATE INDEX ix_fel_current     ON dbo.formula_evaluation_log
    (schedule_id, is_current)
    WHERE is_current = 1;
GO


-- =============================================================================
-- 05. PRICING_DISPUTE
-- Raised when counterparty disagrees with a fixing value or formula result.
-- Linked to specific pricing_event(s) or to the overall formula result.
-- =============================================================================
CREATE TABLE dbo.pricing_dispute (
    dispute_id              INT             NOT NULL IDENTITY(1,1),
    schedule_id             INT             NOT NULL,

    -- What is disputed
    dispute_level           VARCHAR(20)     NOT NULL
        CONSTRAINT chk_pd_level CHECK (dispute_level IN (
            'SINGLE_FIXING',    -- one specific fixing date value disputed
            'MULTIPLE_FIXINGS', -- several fixings disputed
            'FORMULA_RESULT',   -- the overall calculated price disputed
            'TRIGGER_DATE',     -- the trigger date itself is disputed
            'WINDOW_DEFINITION' -- the pricing window/period is disputed
        )),

    -- Disputed pricing event (for SINGLE_FIXING)
    pricing_event_id        INT             NULL,

    -- Dispute details
    dispute_reference       VARCHAR(50)     NOT NULL,
    -- Internal dispute reference number

    raised_by               VARCHAR(20)     NOT NULL DEFAULT 'COUNTERPARTY'
        CONSTRAINT chk_pd_raised CHECK (raised_by IN (
            'COUNTERPARTY',     -- counterparty raised the dispute
            'INTERNAL'          -- we raised the dispute
        )),

    raised_date             DATE            NOT NULL DEFAULT CAST(SYSUTCDATETIME() AS DATE),
    raised_by_user          VARCHAR(100)    NOT NULL,

    -- Our position vs their position
    our_value               DECIMAL(18,6)   NULL,
    their_value             DECIMAL(18,6)   NULL,
    value_currency_id       INT             NULL,
    value_difference        AS              (our_value - their_value),
    -- Computed column — difference between our and their value

    -- Which source they claim to have used
    their_source            VARCHAR(200)    NULL,
    their_source_page       VARCHAR(100)    NULL,

    -- Resolution
    dispute_status          VARCHAR(20)     NOT NULL DEFAULT 'OPEN'
        CONSTRAINT chk_pd_status CHECK (dispute_status IN (
            'OPEN',             -- raised, under investigation
            'UNDER_REVIEW',     -- being investigated
            'AGREED',           -- both parties agreed on value
            'FALLBACK_APPLIED', -- fallback/contractual mechanism applied
            'ESCALATED',        -- escalated to legal/management
            'ARBITRATION',      -- referred to arbitration
            'CLOSED_OUR_VALUE', -- closed in our favour
            'CLOSED_THEIR_VALUE',-- closed in counterparty's favour
            'WITHDRAWN'         -- dispute withdrawn by raising party
        )),

    resolution_method       VARCHAR(20)     NULL
        CONSTRAINT chk_pd_resolution CHECK (resolution_method IN (
            'AGREED_VALUE',     -- bilateral agreement on value
            'FALLBACK_SOURCE',  -- agreed to use alternative source
            'CONTRACT_TERMS',   -- applied strict contract terms
            'SPLIT_DIFFERENCE', -- agreed midpoint between values
            'ARBITRATION',      -- arbitrator's ruling
            'OUR_ORIGINAL',     -- our original value upheld
            'THEIR_VALUE',      -- accepted their value
            NULL
        )),

    agreed_value            DECIMAL(18,6)   NULL,
    -- Final agreed value (may differ from both original positions)

    resolved_date           DATE            NULL,
    resolved_by             VARCHAR(100)    NULL,
    resolution_notes        VARCHAR(1000)   NULL,

    -- Impact
    recalculation_required  BIT             NOT NULL DEFAULT 0,
    recalculation_done      BIT             NOT NULL DEFAULT 0,

    -- Documents
    document_store_id       INT             NULL,

    -- Audit
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_pricing_dispute   PRIMARY KEY (dispute_id),
    CONSTRAINT uq_pd_reference      UNIQUE      (dispute_reference),
    CONSTRAINT fk_pd_schedule       FOREIGN KEY (schedule_id)       REFERENCES dbo.trade_pricing_schedule(schedule_id),
    CONSTRAINT fk_pd_event          FOREIGN KEY (pricing_event_id)  REFERENCES dbo.pricing_event(pricing_event_id),
    CONSTRAINT fk_pd_currency       FOREIGN KEY (value_currency_id) REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_pd_doc            FOREIGN KEY (document_store_id) REFERENCES dbo.document_store(document_id)
);
GO

CREATE INDEX ix_pd_schedule ON dbo.pricing_dispute (schedule_id, dispute_status);
CREATE INDEX ix_pd_open     ON dbo.pricing_dispute (dispute_status, raised_date)
    WHERE dispute_status IN ('OPEN','UNDER_REVIEW','ESCALATED');
GO


-- =============================================================================
-- 06. MISSING_FIXING_RULE
-- Product and index-specific fallback rules when a fixing doesn't publish.
-- Overrides the generic window_rule.missing_fixing_rule for specific cases.
-- e.g. Platts Dated Brent: use prior business day
--      LME Copper: suspend pricing — never interpolate
--      TTF gas: use ICE backup source
-- =============================================================================
CREATE TABLE dbo.missing_fixing_rule (
    rule_id                 INT             NOT NULL IDENTITY(1,1),

    -- What this rule applies to
    price_index_id          INT             NOT NULL,
    price_source_id         INT             NULL,
    -- NULL = applies regardless of which source is used
    product_id              INT             NULL,
    -- NULL = applies for all products using this index

    -- Fallback action
    missing_fixing_action   VARCHAR(20)     NOT NULL
        CONSTRAINT chk_mfr_action CHECK (missing_fixing_action IN (
            'PRIOR_DAY',        -- use most recent prior valid fixing
            'NEXT_DAY',         -- use next available fixing
            'BACKUP_SOURCE',    -- use designated backup source
            'INTERPOLATE',      -- linear interpolation
            'EXCLUDE',          -- exclude from average
            'SUSPEND',          -- halt pricing, alert ops
            'USE_ESTIMATE'      -- use internally estimated value
        )),

    backup_source_id        INT             NULL,
    -- populated if action = BACKUP_SOURCE

    -- How many consecutive missing days before escalation
    max_consecutive_missing TINYINT         NOT NULL DEFAULT 1,
    -- e.g. 1 = after 1 missing day, escalate
    --      3 = tolerate up to 3 consecutive missing days

    escalation_action       VARCHAR(20)     NULL
        CONSTRAINT chk_mfr_esc CHECK (escalation_action IN (
            'SUSPEND',          -- suspend pricing if max_consecutive exceeded
            'ALERT_OPS',        -- alert ops team only
            'ALERT_RISK',       -- alert risk team
            'APPLY_DEEMED',     -- apply deemed date/value
            NULL
        )),

    -- Validity
    effective_from          DATE            NOT NULL DEFAULT '2020-01-01',
    effective_to            DATE            NULL,
    is_active               BIT             NOT NULL DEFAULT 1,
    notes                   VARCHAR(300)    NULL,
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL,

    CONSTRAINT pk_mfr               PRIMARY KEY (rule_id),
    CONSTRAINT uq_mfr               UNIQUE      (price_index_id, price_source_id,
                                                  product_id, effective_from),
    CONSTRAINT fk_mfr_index         FOREIGN KEY (price_index_id)    REFERENCES dbo.price_index(price_index_id),
    CONSTRAINT fk_mfr_source        FOREIGN KEY (price_source_id)   REFERENCES dbo.price_source(price_source_id),
    CONSTRAINT fk_mfr_backup        FOREIGN KEY (backup_source_id)  REFERENCES dbo.price_source(price_source_id),
    CONSTRAINT fk_mfr_product       FOREIGN KEY (product_id)        REFERENCES dbo.product(product_id)
);
GO
CREATE INDEX ix_mfr_index ON dbo.missing_fixing_rule (price_index_id, is_active);
GO


-- =============================================================================
-- USEFUL QUERIES (comments only)
-- =============================================================================
/*
-- Q1: All trades pending pricing trigger confirmation (ops dashboard)
SELECT
    tps.trade_id,
    tps.schedule_status,
    pet.trigger_code            AS primary_trigger,
    tps.estimated_trigger_date,
    tps.primary_trigger_date,
    pi.index_code               AS price_index,
    pwr.rule_code               AS window_rule
FROM dbo.trade_pricing_schedule tps
JOIN dbo.pricing_trigger_event_type pet
    ON pet.trigger_type_id = tps.primary_trigger_type_id
JOIN dbo.price_index pi
    ON pi.price_index_id   = tps.price_index_id
JOIN dbo.pricing_window_rule pwr
    ON pwr.window_rule_id  = tps.window_rule_id
WHERE tps.schedule_status = 'PENDING'
ORDER BY tps.estimated_trigger_date;

-- Q2: All missing fixings for today (market data ops alert)
SELECT
    pe.fixing_date,
    pi.index_code,
    ps.source_code,
    tps.trade_id,
    pet.trigger_code            AS trigger_event
FROM dbo.pricing_event pe
JOIN dbo.price_index pi
    ON pi.price_index_id   = pe.price_index_id
JOIN dbo.price_source ps
    ON ps.price_source_id  = pe.price_source_id
JOIN dbo.trade_pricing_schedule tps
    ON tps.schedule_id     = pe.schedule_id
JOIN dbo.pricing_trigger_event_type pet
    ON pet.trigger_type_id = tps.primary_trigger_type_id
WHERE pe.fixing_date = CAST(GETUTCDATE() AS DATE)
AND   pe.fixing_status = 'MISSING'
ORDER BY pi.index_code, pe.fixing_date;

-- Q3: Current calculated price per trade (latest evaluation)
SELECT
    tps.trade_id,
    tps.schedule_status,
    fel.evaluation_type,
    fel.fixings_used,
    fel.fixings_expected,
    fel.raw_average,
    fel.differential_applied,
    fel.fx_rate_applied,
    fel.calculated_price,
    c.currency_code,
    u.uom_code,
    fel.evaluated_at
FROM dbo.formula_evaluation_log fel
JOIN dbo.trade_pricing_schedule tps
    ON tps.schedule_id    = fel.schedule_id
JOIN dbo.currency c
    ON c.currency_id      = fel.price_currency_id
JOIN dbo.unit_of_measure u
    ON u.uom_id           = fel.price_uom_id
WHERE fel.is_current = 1
ORDER BY tps.trade_id;

-- Q4: All open pricing disputes (risk/ops escalation view)
SELECT
    pd.dispute_reference,
    pd.schedule_id,
    tps.trade_id,
    pd.dispute_level,
    pd.raised_by,
    pd.raised_date,
    pd.our_value,
    pd.their_value,
    pd.value_difference,
    pd.dispute_status,
    c.currency_code
FROM dbo.pricing_dispute pd
JOIN dbo.trade_pricing_schedule tps
    ON tps.schedule_id   = pd.schedule_id
JOIN dbo.currency c
    ON c.currency_id     = pd.value_currency_id
WHERE pd.dispute_status IN ('OPEN','UNDER_REVIEW','ESCALATED')
ORDER BY pd.raised_date DESC;

-- Q5: Pricing event staging — values awaiting validation
SELECT
    pes.fixing_date,
    pi.index_code,
    ps.source_code,
    pes.raw_value,
    pes.feed_timestamp,
    pes.check_spike_detected,
    pes.cross_check_deviation_pct,
    pes.validation_status
FROM dbo.pricing_event_staging pes
JOIN dbo.price_index pi   ON pi.price_index_id  = pes.price_index_id
JOIN dbo.price_source ps  ON ps.price_source_id = pes.price_source_id
WHERE pes.validation_status = 'UNVALIDATED'
ORDER BY pes.price_index_id, pes.fixing_date;
*/


PRINT '============================================================';
PRINT 'PRICING LIFECYCLE OPERATIONAL TABLES v1.0 APPLIED';
PRINT '';
PRINT '  01. trade_pricing_schedule    — master pricing setup per trade';
PRINT '      Temporal table: full history of all pricing changes';
PRINT '      Status flow: PENDING → TRIGGER_SET → FIXING_IN_PROGRESS';
PRINT '                → FIXINGS_COMPLETE → CONFIRMED → INVOICED → CLOSED';
PRINT '';
PRINT '  02. pricing_event             — one row per fixing date per index';
PRINT '      Tracks: expected / raw / actual / fallback / value_used';
PRINT '      Status: PENDING → RECEIVED → VALIDATED (or MISSING/DISPUTED)';
PRINT '';
PRINT '  03. pricing_event_staging     — raw feed values before validation';
PRINT '      Option B two-step: feed → staging → validation → pricing_event';
PRINT '      Includes spike detection, cross-source validation fields';
PRINT '';
PRINT '  04. formula_evaluation_log    — immutable audit of every calculation';
PRINT '      JSON component_values: full input snapshot per evaluation';
PRINT '      Types: PROVISIONAL / INTERIM / FINAL / POST_DISPUTE';
PRINT '';
PRINT '  05. pricing_dispute           — disputed fixings and resolution';
PRINT '      Levels: SINGLE_FIXING / MULTIPLE / FORMULA_RESULT / TRIGGER_DATE';
PRINT '      Resolution: AGREED / FALLBACK / ARBITRATION / SPLIT';
PRINT '';
PRINT '  06. missing_fixing_rule       — per-index fallback rules';
PRINT '      Actions: PRIOR_DAY / BACKUP_SOURCE / INTERPOLATE / SUSPEND';
PRINT '      Escalation threshold: max_consecutive_missing days';
PRINT '';
PRINT '  NOTE: trade_id FK on trade_pricing_schedule added via ALTER';
PRINT '        after trade table is created in next script.';
PRINT '============================================================';
GO
