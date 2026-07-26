-- =============================================================================
-- ETRM SYSTEM — PERIOD REDESIGN: MARKET_PRODUCT AS THE KEY, LIFECYCLE DATES
-- =============================================================================
-- Design review record: etrm-system/docs/period_fx_fold_product_link_pending_07.md
-- Decided over that review, in order:
--   1. fx_period stays separate — NOT folded in (FX has no product concept).
--   2. period.market_product_id (FK -> dbo.market_product) replaces
--      commodity_type — market_product already pairs market_id + product_id,
--      so one FK encodes "which market AND which product" instead of two
--      loose columns. Every exchange-listed contract month has its own
--      last-trade/expiry/notice/settlement dates that differ by market as
--      well as by product (e.g. the same underlying product listed OTC vs.
--      on an exchange has different conventions) — commodity_type alone
--      could never express that.
--   3. market_product_id is NOT NULL — a period row that isn't tied to what
--      it's actually pricing isn't a meaningful row (confirmed against real
--      exchange/PRA practice: every contract month and even spot assessments
--      are always product/grade-specific in the real world).
--   4. New lifecycle date columns added directly to period (not routed
--      through market_product_period, which already has a near-identical
--      resolved-date column set from an earlier design — explicit decision
--      by Dharani to keep the dates on period itself; market_product_period
--      is left exactly as-is, dormant, not retired, flagged for a later
--      review rather than reconciled now).
--   5. period_id -> BIGINT (was INT): LME-style metals prompt-date curves
--      (WEEK/DAY period_type, already in the enum) project a much higher
--      row volume per market_product than monthly-contract commodities.
--   6. row_version stays INT (confirmed — this is reference data, low write
--      frequency, no BIGINT justification for the optimistic-lock column).
--
-- Live-verified against the dev DB before writing this file (2026-07-26):
--   period = 209 rows, all rolling templates, commodity_type mostly NULL,
--   never linked to a real market_product (market_product table itself has
--   ZERO rows — dbo.market has zero rows too, so no market_product row can
--   exist yet). Every table with a period FK is at 0 populated rows
--   (market_product_period, period_mapping, position, position_eod_snapshot,
--   trade, trade_transmission_right_detail, trade_order). Net: there is no
--   way to backfill market_product_id onto the existing 209 rows (nothing
--   real to link them to), and nothing anywhere depends on their survival —
--   so this migration truncates and rebuilds dbo.period rather than altering
--   it in place. Real periods get populated going forward via the new
--   bulk-create/Excel-import and auto-generate features once real
--   market/market_product master data exists.
-- =============================================================================

USE ETRM_DB;
GO

-- =============================================================================
-- STEP 1 — drop everything that references dbo.period, in dependency order
-- =============================================================================
IF OBJECT_ID('dbo.fk_pos_period', 'F') IS NOT NULL ALTER TABLE dbo.position DROP CONSTRAINT fk_pos_period;
IF OBJECT_ID('dbo.fk_ttrd_period', 'F') IS NOT NULL ALTER TABLE dbo.trade_transmission_right_detail DROP CONSTRAINT fk_ttrd_period;
IF OBJECT_ID('dbo.fk_pes_period', 'F') IS NOT NULL ALTER TABLE dbo.position_eod_snapshot DROP CONSTRAINT fk_pes_period;
IF OBJECT_ID('dbo.fk_trade_period', 'F') IS NOT NULL ALTER TABLE dbo.trade DROP CONSTRAINT fk_trade_period;
IF OBJECT_ID('dbo.fk_mpp_period', 'F') IS NOT NULL ALTER TABLE dbo.market_product_period DROP CONSTRAINT fk_mpp_period;
IF OBJECT_ID('dbo.fk_pm_parent', 'F') IS NOT NULL ALTER TABLE dbo.period_mapping DROP CONSTRAINT fk_pm_parent;
IF OBJECT_ID('dbo.fk_pm_child', 'F') IS NOT NULL ALTER TABLE dbo.period_mapping DROP CONSTRAINT fk_pm_child;
-- trade_order's FK was a composite natural-key FK onto
-- uq_period_code_comm(period_code, commodity_type) — both are going away.
-- trade_order.period_code/commodity_type are not mapped by any JPA entity
-- (Trade Management has no real backend yet, confirmed) and trade_order is
-- at 0 rows, so the columns are left in place (out of scope for this
-- migration) but the constraint tying them to period cannot survive.
IF OBJECT_ID('dbo.fk_trade_order_period', 'F') IS NOT NULL ALTER TABLE dbo.trade_order DROP CONSTRAINT fk_trade_order_period;
GO

IF OBJECT_ID('dbo.trg_period_row_version_guard', 'TR') IS NOT NULL DROP TRIGGER dbo.trg_period_row_version_guard;
GO

-- SQL Server also refuses ALTER COLUMN on any column still referenced by an
-- index/unique/check constraint, even after the FK itself is gone — every
-- such object on the columns being widened to BIGINT has to come off first,
-- then get recreated in STEP 3 alongside the re-attached FKs.
IF OBJECT_ID('dbo.uq_mpp', 'UQ') IS NOT NULL ALTER TABLE dbo.market_product_period DROP CONSTRAINT uq_mpp;
DROP INDEX IF EXISTS ix_mpp_period ON dbo.market_product_period;
-- V3's date-range indexes carry period_id as an INCLUDE column — that also
-- blocks ALTER COLUMN, not just key-column membership.
DROP INDEX IF EXISTS ix_mpp_ltd ON dbo.market_product_period;
DROP INDEX IF EXISTS ix_mpp_expiry ON dbo.market_product_period;
DROP INDEX IF EXISTS ix_mpp_delivery ON dbo.market_product_period;

IF OBJECT_ID('dbo.uq_period_mapping', 'UQ') IS NOT NULL ALTER TABLE dbo.period_mapping DROP CONSTRAINT uq_period_mapping;
IF OBJECT_ID('dbo.chk_pm_no_self_ref', 'C') IS NOT NULL ALTER TABLE dbo.period_mapping DROP CONSTRAINT chk_pm_no_self_ref;
DROP INDEX IF EXISTS ix_pm_parent ON dbo.period_mapping;
DROP INDEX IF EXISTS ix_pm_child ON dbo.period_mapping;

IF OBJECT_ID('dbo.uq_position_bucket', 'UQ') IS NOT NULL ALTER TABLE dbo.position DROP CONSTRAINT uq_position_bucket;
DROP INDEX IF EXISTS ix_position_period ON dbo.position;
DROP INDEX IF EXISTS ix_position_product ON dbo.position;

IF OBJECT_ID('dbo.uq_position_snapshot_bucket', 'UQ') IS NOT NULL ALTER TABLE dbo.position_eod_snapshot DROP CONSTRAINT uq_position_snapshot_bucket;
DROP INDEX IF EXISTS ix_pes_product_date ON dbo.position_eod_snapshot;

DROP INDEX IF EXISTS ix_ttrd_path ON dbo.trade_transmission_right_detail;
GO

IF OBJECT_ID('dbo.period', 'U') IS NOT NULL DROP TABLE dbo.period;
GO

-- =============================================================================
-- STEP 2 — rebuild dbo.period
-- =============================================================================
CREATE TABLE dbo.period (
    period_id                  BIGINT          NOT NULL IDENTITY(1,1),

    market_product_id          INT             NOT NULL,   -- FK -> market_product; encodes market AND product as the key

    period_code                VARCHAR(30)     NOT NULL,   -- 'M+1','JAN-27','Q1-2027','CAL-2027'
    period_name                VARCHAR(200)    NOT NULL,
    exch_product_code          VARCHAR(20)     NULL,       -- contract-month-specific exchange code, e.g. 'CLF27' (distinct from market_product.ticker, the root symbol)

    period_type                VARCHAR(20)     NOT NULL
        CONSTRAINT chk_period_type CHECK (period_type IN (
            'SPOT','INTRADAY','DAY','WEEK','MONTH','QUARTER','SEASON',
            'HALF_YEAR','YEAR','CROP_YEAR','CUSTOM'
        )),

    -- Rolling vs concrete
    is_rolling                 BIT             NOT NULL DEFAULT 0,
    roll_offset                SMALLINT        NULL,
    roll_unit                  VARCHAR(10)     NULL
        CONSTRAINT chk_period_roll_unit CHECK (roll_unit IN ('DAY','WEEK','MONTH','QUARTER','YEAR', NULL)),

    -- Template/calendar-bucket dates (NULL for rolling — resolved at runtime)
    period_start                DATE           NULL,
    period_end                  DATE           NULL,
    delivery_start_date         DATE           NULL,
    delivery_end_date           DATE           NULL,

    curve_label                 VARCHAR(30)    NULL,

    -- Contract lifecycle dates — concrete, per market_product-scoped instance
    first_trade_date            DATE           NULL,   -- when this contract month was first listed
    expiry_date                 DATE           NULL,
    last_trade_date             DATE           NULL,
    option_exp_date             DATE           NULL,   -- options-on-this-future expiry; NOT assumed equal to last_trade_date
    settlement_date              DATE          NULL,
    first_notice_date           DATE           NULL,
    last_notice_date            DATE           NULL,

    pricing_calendar_code       VARCHAR(20)    NULL,
    settlement_calendar_code    VARCHAR(20)    NULL,

    load_type_lookup_id         INT            NULL,   -- FK -> lookup_value, category='load_type'
    gas_day_type_lookup_id      INT            NULL,   -- FK -> lookup_value, category='gas_day_type'

    start_time_utc              TIME           NULL,
    end_time_utc                TIME           NULL,

    crop_year_offset_months     TINYINT        NULL,

    status_code                 VARCHAR(20)    NOT NULL DEFAULT 'OPEN'
        CONSTRAINT chk_period_status CHECK (status_code IN ('OPEN','CLOSED','LOCKED','ARCHIVED')),

    is_trading_period            BIT           NOT NULL DEFAULT 1,
    is_risk_period                BIT          NOT NULL DEFAULT 1,
    is_settlement_period          BIT          NOT NULL DEFAULT 0,
    is_active                     BIT          NOT NULL DEFAULT 1,
    notes                        VARCHAR(300)  NULL,

    created_at                  DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                  VARCHAR(100)   NOT NULL,
    updated_at                  DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                  VARCHAR(100)   NOT NULL,
    row_version                 INT            NOT NULL DEFAULT 1,

    CONSTRAINT pk_period                 PRIMARY KEY (period_id),
    CONSTRAINT uq_period_code_mp         UNIQUE      (period_code, market_product_id),
    CONSTRAINT fk_period_market_product  FOREIGN KEY (market_product_id) REFERENCES dbo.market_product(market_product_id),
    CONSTRAINT fk_period_load_type       FOREIGN KEY (load_type_lookup_id) REFERENCES dbo.lookup_value(lookup_id),
    CONSTRAINT fk_period_gas_day_type    FOREIGN KEY (gas_day_type_lookup_id) REFERENCES dbo.lookup_value(lookup_id),
    CONSTRAINT fk_period_pricing_cal     FOREIGN KEY (pricing_calendar_code) REFERENCES dbo.holiday_calendar(calendar_code),
    CONSTRAINT fk_period_settlement_cal  FOREIGN KEY (settlement_calendar_code) REFERENCES dbo.holiday_calendar(calendar_code),
    CONSTRAINT chk_period_rolling        CHECK (
        is_rolling = 0
        OR (is_rolling = 1 AND roll_offset IS NOT NULL AND roll_unit IS NOT NULL)
    ),
    CONSTRAINT chk_period_dates          CHECK (
        (period_start IS NULL AND period_end IS NULL)
        OR (period_start IS NOT NULL AND period_end IS NOT NULL)
    ),
    CONSTRAINT chk_period_date_order     CHECK (
        period_start IS NULL OR period_end IS NULL OR period_end >= period_start
    )
);
GO

CREATE INDEX ix_period_market_product ON dbo.period (market_product_id, period_type, is_active);
CREATE INDEX ix_period_dates          ON dbo.period (period_start, period_end, market_product_id)
    WHERE period_start IS NOT NULL;
CREATE INDEX ix_period_rolling        ON dbo.period (is_rolling, market_product_id, is_active)
    WHERE is_rolling = 1;
CREATE INDEX ix_period_trading        ON dbo.period (is_trading_period, market_product_id, is_active)
    WHERE is_trading_period = 1;
CREATE INDEX ix_period_risk           ON dbo.period (is_risk_period, market_product_id, is_active)
    WHERE is_risk_period = 1;
GO

-- Row-version guard, same shape as V153's original — REJECTS bypass writes
-- rather than silently bumping. Re-created here (not carried over from the
-- dropped table) because it's table-scoped.
CREATE TRIGGER dbo.trg_period_row_version_guard ON dbo.period AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.period (bypass write rejected by trg_period_row_version_guard)', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN deleted d ON i.[period_id] = d.[period_id]
        WHERE i.row_version <= d.row_version
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.period (stale or reused version rejected by trg_period_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO

-- =============================================================================
-- STEP 3 — widen every dependent FK column to BIGINT and re-attach
-- =============================================================================
ALTER TABLE dbo.market_product_period ALTER COLUMN period_id BIGINT NOT NULL;
ALTER TABLE dbo.market_product_period ADD CONSTRAINT fk_mpp_period FOREIGN KEY (period_id) REFERENCES dbo.period(period_id);
ALTER TABLE dbo.market_product_period ADD CONSTRAINT uq_mpp UNIQUE (market_product_id, period_id);
CREATE INDEX ix_mpp_period ON dbo.market_product_period (period_id, is_active);
CREATE INDEX ix_mpp_ltd
    ON dbo.market_product_period (last_trading_date, is_active)
    INCLUDE (market_product_id, period_id, first_notice_date, expiry_date)
    WHERE last_trading_date IS NOT NULL;
CREATE INDEX ix_mpp_expiry
    ON dbo.market_product_period (expiry_date, is_active)
    INCLUDE (market_product_id, period_id, last_trading_date)
    WHERE expiry_date IS NOT NULL;
CREATE INDEX ix_mpp_delivery
    ON dbo.market_product_period (delivery_start_date, delivery_end_date, is_active)
    INCLUDE (market_product_id, period_id)
    WHERE delivery_start_date IS NOT NULL;
GO

ALTER TABLE dbo.period_mapping ALTER COLUMN parent_period_id BIGINT NOT NULL;
ALTER TABLE dbo.period_mapping ALTER COLUMN child_period_id BIGINT NOT NULL;
ALTER TABLE dbo.period_mapping ADD CONSTRAINT fk_pm_parent FOREIGN KEY (parent_period_id) REFERENCES dbo.period(period_id);
ALTER TABLE dbo.period_mapping ADD CONSTRAINT fk_pm_child FOREIGN KEY (child_period_id) REFERENCES dbo.period(period_id);
ALTER TABLE dbo.period_mapping ADD CONSTRAINT chk_pm_no_self_ref CHECK (parent_period_id <> child_period_id);
ALTER TABLE dbo.period_mapping ADD CONSTRAINT uq_period_mapping UNIQUE (parent_period_id, child_period_id, commodity_type, effective_from);
CREATE INDEX ix_pm_parent ON dbo.period_mapping (parent_period_id, is_active, commodity_type);
CREATE INDEX ix_pm_child  ON dbo.period_mapping (child_period_id,  is_active);
GO

ALTER TABLE dbo.position ALTER COLUMN period_id BIGINT NULL;
ALTER TABLE dbo.position ADD CONSTRAINT fk_pos_period FOREIGN KEY (period_id) REFERENCES dbo.period(period_id);
ALTER TABLE dbo.position ADD CONSTRAINT uq_position_bucket UNIQUE
    (position_type, book_id, commodity_type, product_id, period_id, vessel_type, route_id, charter_party_type_id, currency_id);
CREATE INDEX ix_position_period  ON dbo.position (period_id) WHERE period_id IS NOT NULL;
CREATE INDEX ix_position_product ON dbo.position (product_id, period_id) WHERE product_id IS NOT NULL;
GO

ALTER TABLE dbo.position_eod_snapshot ALTER COLUMN period_id BIGINT NULL;
ALTER TABLE dbo.position_eod_snapshot ADD CONSTRAINT fk_pes_period FOREIGN KEY (period_id) REFERENCES dbo.period(period_id);
ALTER TABLE dbo.position_eod_snapshot ADD CONSTRAINT uq_position_snapshot_bucket UNIQUE
    (snapshot_date, position_type, book_id, commodity_type, product_id, period_id, vessel_type, route_id, charter_party_type_id, currency_id);
CREATE INDEX ix_pes_product_date ON dbo.position_eod_snapshot (product_id, period_id, snapshot_date) WHERE product_id IS NOT NULL;
GO

ALTER TABLE dbo.trade ALTER COLUMN period_id BIGINT NULL;
ALTER TABLE dbo.trade ADD CONSTRAINT fk_trade_period FOREIGN KEY (period_id) REFERENCES dbo.period(period_id);
GO

ALTER TABLE dbo.trade_transmission_right_detail ALTER COLUMN delivery_period_id BIGINT NULL;
ALTER TABLE dbo.trade_transmission_right_detail ADD CONSTRAINT fk_ttrd_period FOREIGN KEY (delivery_period_id) REFERENCES dbo.period(period_id);
CREATE INDEX ix_ttrd_path ON dbo.trade_transmission_right_detail (source_zone_id, sink_zone_id, delivery_period_id);
GO
