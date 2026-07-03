-- V49: Credit limit module expansion
-- Adds: commodity scope, direct vs allocated basis with parent-limit hierarchy,
-- counterparty country risk, credit analyst assignment, review cycle governance,
-- collateral offsets, temporary uplifts, tenor caps, alert thresholds & actions,
-- instrument-class sub-limits (line items), and an alert event log.

-- ============================================================
-- 1. Extend dbo.credit_limit
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.credit_limit') AND name = 'commodity_type')
BEGIN
  ALTER TABLE dbo.credit_limit ADD
    -- scope
    commodity_type          VARCHAR(20)    NOT NULL DEFAULT 'ALL',
    limit_basis             VARCHAR(10)    NOT NULL DEFAULT 'DIRECT',
    parent_limit_id         INT            NULL,
    cp_country_code         CHAR(2)        NULL,
    country_risk_rating     VARCHAR(10)    NULL,
    -- amounts
    collateral_offset       DECIMAL(18,2)  NOT NULL DEFAULT 0,
    collateral_ref          NVARCHAR(100)  NULL,
    temp_uplift_amount      DECIMAL(18,2)  NULL,
    temp_uplift_expiry      DATE           NULL,
    tenor_cap_months        INT            NULL,
    -- governance
    credit_analyst_user_id  INT            NULL,
    credit_analyst_name     NVARCHAR(100)  NULL,
    review_frequency_days   INT            NULL,
    last_review_date        DATE           NULL,
    next_review_date        DATE           NULL,
    last_review_outcome     VARCHAR(10)    NULL,
    internal_rating         VARCHAR(10)    NULL,
    external_rating         VARCHAR(10)    NULL,
    -- monitoring & alerts
    warning_threshold_pct   DECIMAL(5,2)   NOT NULL DEFAULT 80,
    critical_threshold_pct  DECIMAL(5,2)   NOT NULL DEFAULT 95,
    breach_action           VARCHAR(20)    NOT NULL DEFAULT 'ALERT_ONLY',
    alert_internal          BIT            NOT NULL DEFAULT 1,
    alert_counterparty      BIT            NOT NULL DEFAULT 0,
    cp_alert_email          NVARCHAR(200)  NULL;
END;
GO

-- CHECK constraints (added separately so the ADD COLUMN batch stays clean)
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'ck_cl_commodity_type')
  ALTER TABLE dbo.credit_limit ADD CONSTRAINT ck_cl_commodity_type CHECK (commodity_type IN (
    'ALL','OIL','GAS','POWER','LNG','AGRICULTURAL','METALS','FREIGHT','RINS','ENVIRONMENTAL','MULTI','OTHER'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'ck_cl_limit_basis')
  ALTER TABLE dbo.credit_limit ADD CONSTRAINT ck_cl_limit_basis CHECK (limit_basis IN ('DIRECT','ALLOCATED'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'ck_cl_country_risk')
  ALTER TABLE dbo.credit_limit ADD CONSTRAINT ck_cl_country_risk CHECK (country_risk_rating IS NULL OR country_risk_rating IN ('LOW','MEDIUM','HIGH','SEVERE'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'ck_cl_review_outcome')
  ALTER TABLE dbo.credit_limit ADD CONSTRAINT ck_cl_review_outcome CHECK (last_review_outcome IS NULL OR last_review_outcome IN ('MAINTAIN','INCREASE','DECREASE','SUSPEND','ESCALATE'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'ck_cl_breach_action')
  ALTER TABLE dbo.credit_limit ADD CONSTRAINT ck_cl_breach_action CHECK (breach_action IN ('ALERT_ONLY','BLOCK_NEW_TRADES','BLOCK_ALL'));
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_cl_parent_limit')
  ALTER TABLE dbo.credit_limit ADD CONSTRAINT fk_cl_parent_limit FOREIGN KEY (parent_limit_id) REFERENCES dbo.credit_limit(credit_limit_id);
GO

-- limit_type gains TOTAL_AGGREGATE; status gains UNDER_REVIEW
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_credit_limit_type')
  ALTER TABLE dbo.credit_limit DROP CONSTRAINT chk_credit_limit_type;
ALTER TABLE dbo.credit_limit ADD CONSTRAINT chk_credit_limit_type CHECK (limit_type IN (
  'SETTLEMENT', 'PRE_SETTLEMENT', 'DELIVERY', 'MARK_TO_MARKET', 'TOTAL_AGGREGATE'));
GO
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_credit_limit_status')
  ALTER TABLE dbo.credit_limit DROP CONSTRAINT chk_credit_limit_status;
ALTER TABLE dbo.credit_limit ADD CONSTRAINT chk_credit_limit_status CHECK (status IN (
  'ACTIVE', 'UNDER_REVIEW', 'EXPIRED', 'SUSPENDED', 'CANCELLED'));
GO

-- ============================================================
-- 2. Sub-limits: instrument-class carve-outs under a master limit
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'credit_limit_line_item')
BEGIN
  CREATE TABLE dbo.credit_limit_line_item (
    line_item_id      INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    credit_limit_id   INT            NOT NULL,
    instrument_class  VARCHAR(20)    NOT NULL
      CONSTRAINT ck_clli_class CHECK (instrument_class IN (
        'PHYSICAL','FUTURES','FORWARDS','SWAPS','OPTIONS','STORAGE_TRANSPORT')),
    sub_limit_amount  DECIMAL(18,2)  NOT NULL,
    used_amount       DECIMAL(18,2)  NOT NULL DEFAULT 0,
    tenor_cap_months  INT            NULL,
    sort_order        TINYINT        NOT NULL DEFAULT 0,
    notes             NVARCHAR(500)  NULL,
    created_at        DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at        DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_clli_limit FOREIGN KEY (credit_limit_id)
      REFERENCES dbo.credit_limit(credit_limit_id) ON DELETE CASCADE,
    CONSTRAINT uq_clli_limit_class UNIQUE (credit_limit_id, instrument_class)
  );
  CREATE INDEX ix_clli_limit ON dbo.credit_limit_line_item (credit_limit_id);
END;
GO

-- ============================================================
-- 3. Alert event log
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'credit_limit_alert')
BEGIN
  CREATE TABLE dbo.credit_limit_alert (
    alert_id         INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    credit_limit_id  INT            NOT NULL,
    alert_type       VARCHAR(25)    NOT NULL
      CONSTRAINT ck_cla_type CHECK (alert_type IN (
        'WARNING_THRESHOLD','CRITICAL_THRESHOLD','BREACH',
        'REVIEW_DUE','EXPIRY_APPROACHING','STATUS_CHANGE')),
    recipients       VARCHAR(15)    NOT NULL DEFAULT 'INTERNAL'
      CONSTRAINT ck_cla_recipients CHECK (recipients IN ('INTERNAL','COUNTERPARTY','BOTH')),
    message          NVARCHAR(500)  NOT NULL,
    sent_at          DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    acknowledged_by  NVARCHAR(100)  NULL,
    acknowledged_at  DATETIME2      NULL,
    CONSTRAINT fk_cla_limit FOREIGN KEY (credit_limit_id)
      REFERENCES dbo.credit_limit(credit_limit_id) ON DELETE CASCADE
  );
  CREATE INDEX ix_cla_limit ON dbo.credit_limit_alert (credit_limit_id, sent_at DESC);
END;
GO

-- ============================================================
-- 4. Lookup seeds (dbo.lookup_value: category / code / display_name / notes)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM dbo.lookup_value WHERE category = 'limit_basis')
  INSERT INTO dbo.lookup_value (category, code, display_name, notes, sort_order, is_active) VALUES
    ('limit_basis','DIRECT',    'Direct',    'Limit granted directly on the counterparty''s own credit standing.', 10, 1),
    ('limit_basis','ALLOCATED', 'Allocated', 'Carved out of a parent / group limit.',                              20, 1);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.lookup_value WHERE category = 'instrument_class')
  INSERT INTO dbo.lookup_value (category, code, display_name, notes, sort_order, is_active) VALUES
    ('instrument_class','PHYSICAL',          'Physical',            'Physical delivery deals.',                                  10, 1),
    ('instrument_class','FUTURES',           'Futures',             'Exchange-traded futures — margined, lower risk weight.',    20, 1),
    ('instrument_class','FORWARDS',          'Forwards',            'OTC forwards.',                                             30, 1),
    ('instrument_class','SWAPS',             'Swaps',               'Fixed/float and basis swaps.',                              40, 1),
    ('instrument_class','OPTIONS',           'Options',             'Listed and OTC options.',                                   50, 1),
    ('instrument_class','STORAGE_TRANSPORT', 'Storage & Transport', 'Storage and transport agreement deals.',                    60, 1);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.lookup_value WHERE category = 'breach_action')
  INSERT INTO dbo.lookup_value (category, code, display_name, notes, sort_order, is_active) VALUES
    ('breach_action','ALERT_ONLY',       'Alert Only',       'Notify credit and desk; trading continues.',                        10, 1),
    ('breach_action','BLOCK_NEW_TRADES', 'Block New Trades', 'Existing book stands; new deals with this counterparty blocked.',   20, 1),
    ('breach_action','BLOCK_ALL',        'Block All',        'Full trading halt pending credit committee decision.',              30, 1);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.lookup_value WHERE category = 'review_outcome')
  INSERT INTO dbo.lookup_value (category, code, display_name, notes, sort_order, is_active) VALUES
    ('review_outcome','MAINTAIN', 'Maintain', 'Limit confirmed at current level.',            10, 1),
    ('review_outcome','INCREASE', 'Increase', 'Limit raised following review.',               20, 1),
    ('review_outcome','DECREASE', 'Decrease', 'Limit reduced following review.',              30, 1),
    ('review_outcome','SUSPEND',  'Suspend',  'Limit suspended pending further information.', 40, 1),
    ('review_outcome','ESCALATE', 'Escalate', 'Escalated to credit committee.',               50, 1);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.lookup_value WHERE category = 'credit_alert_type')
  INSERT INTO dbo.lookup_value (category, code, display_name, notes, sort_order, is_active) VALUES
    ('credit_alert_type','WARNING_THRESHOLD',  'Warning Threshold',  'Utilisation crossed the warning percentage.',          10, 1),
    ('credit_alert_type','CRITICAL_THRESHOLD', 'Critical Threshold', 'Utilisation crossed the critical percentage.',         20, 1),
    ('credit_alert_type','BREACH',             'Breach',             'Utilisation at or above 100 percent of the limit.',    30, 1),
    ('credit_alert_type','REVIEW_DUE',         'Review Due',         'Scheduled credit review date reached.',                40, 1),
    ('credit_alert_type','EXPIRY_APPROACHING', 'Expiry Approaching', 'Limit expiry within the notice window.',               50, 1),
    ('credit_alert_type','STATUS_CHANGE',      'Status Change',      'Limit suspended, reinstated or cancelled.',            60, 1);
GO
IF NOT EXISTS (SELECT 1 FROM dbo.lookup_value WHERE category = 'country_risk_rating')
  INSERT INTO dbo.lookup_value (category, code, display_name, notes, sort_order, is_active) VALUES
    ('country_risk_rating','LOW',    'Low',    'OECD stable — full limit capacity.',                    10, 1),
    ('country_risk_rating','MEDIUM', 'Medium', 'Emerging market — standard monitoring.',                20, 1),
    ('country_risk_rating','HIGH',   'High',   'Elevated sovereign / transfer risk — reduced tenor.',   30, 1),
    ('country_risk_rating','SEVERE', 'Severe', 'Sanctions exposure or acute distress — case by case.',  40, 1);
GO

-- ============================================================
-- 5. Seed enrichment for existing demo limits
-- ============================================================
UPDATE dbo.credit_limit SET
  commodity_type = 'ALL', limit_basis = 'DIRECT', cp_country_code = 'GB', country_risk_rating = 'LOW',
  credit_analyst_name = 'Sarah Chen', review_frequency_days = 365,
  last_review_date = '2025-12-10', next_review_date = '2026-12-10', last_review_outcome = 'MAINTAIN',
  external_rating = 'AA-', internal_rating = 'IR-2'
WHERE credit_limit_id IN (1, 2) AND credit_analyst_name IS NULL;

UPDATE dbo.credit_limit SET
  commodity_type = 'OIL', limit_basis = 'DIRECT', cp_country_code = 'GB', country_risk_rating = 'LOW',
  credit_analyst_name = 'Sarah Chen', review_frequency_days = 180,
  last_review_date = '2025-11-20', next_review_date = '2026-05-19', last_review_outcome = 'DECREASE',
  external_rating = 'A-', internal_rating = 'IR-3'
WHERE credit_limit_id = 3 AND credit_analyst_name IS NULL;
GO
