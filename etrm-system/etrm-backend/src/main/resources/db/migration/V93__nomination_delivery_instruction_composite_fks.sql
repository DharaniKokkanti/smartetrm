-- =============================================================================
-- V93 — Physical Operations: dbo.nomination + dbo.delivery_instruction (new
-- tables, closes the two genuinely-missing master data entities flagged in the
-- V90/V91 backlog), plus the deferred composite-key FKs for
-- trade_order.period_code -> period(period_code, commodity_type) and
-- trade_order.incoterm_code -> incoterm(code, version_year).
-- =============================================================================
-- Both period and incoterm use a composite unique key, but trade_order only
-- ever stored the single code column, so a plain single-column FK could never
-- be added (V91 deferred this for exactly that reason). Fixed by adding the
-- missing second column to trade_order and FKing on the full composite pair,
-- matching the pattern already used elsewhere in this schema (e.g.
-- product_reporting_group denormalizing classification_type_id from
-- reporting_group).
--
-- Caveat, documented rather than hidden: SQL Server multi-column FKs use
-- MATCH SIMPLE semantics — if trade_order.commodity_type or
-- incoterm_version_year is NULL, the FK does not validate period_code /
-- incoterm_code at all for that row. This only matters for FREIGHT trade
-- orders (trade.commodity_type allows 'FREIGHT', period.commodity_type's
-- CHECK does not, so a freight leg's period must resolve against a
-- commodity-agnostic NULL-commodity_type period row, or none) and for legs
-- whose incoterm version can't be resolved to a single active row. Neither
-- case is a correctness regression versus today's total absence of a
-- constraint.
-- =============================================================================
USE ETRM_DB;
GO

-- ── dbo.nomination ───────────────────────────────────────────────────────────
-- Physical scheduling nomination against a trade order leg — pipeline batch,
-- vessel loading/discharge window, terminal slot, rail/truck lifting. One
-- order can carry several nominations (e.g. a term contract nominated month
-- by month).
IF OBJECT_ID('dbo.nomination', 'U') IS NULL
BEGIN
CREATE TABLE dbo.nomination (
    nomination_id           INT             NOT NULL IDENTITY(1,1),
    order_id                INT             NOT NULL,
    nomination_reference    VARCHAR(50)     NOT NULL,
    nomination_type         VARCHAR(20)     NOT NULL
        CONSTRAINT chk_nomination_type CHECK (nomination_type IN (
            'PIPELINE','VESSEL','TERMINAL','RAIL','TRUCK','STORAGE'
        )),
    status                  VARCHAR(20)     NOT NULL DEFAULT 'DRAFT'
        CONSTRAINT chk_nomination_status CHECK (status IN (
            'DRAFT','SUBMITTED','ACCEPTED','REJECTED','AMENDED','CANCELLED','COMPLETED'
        )),
    nominated_quantity      DECIMAL(18,4)   NOT NULL,
    uom_code                VARCHAR(20)     NOT NULL,
    nomination_window_start DATE            NOT NULL,
    nomination_window_end   DATE            NOT NULL,
    deadline_datetime       DATETIME2       NULL,       -- nomination cutoff per pipeline/terminal rules
    location_code           VARCHAR(30)     NULL,       -- terminal / pipeline point
    pipeline_code           VARCHAR(30)     NULL,
    vessel_id               INT             NULL,
    counterparty_id         INT             NULL,        -- nominated to/from (receiving/delivering party)
    submitted_by_user_id    INT             NULL,
    submitted_at             DATETIME2       NULL,
    accepted_at              DATETIME2       NULL,
    rejection_reason         NVARCHAR(500)   NULL,
    notes                    NVARCHAR(2000)  NULL,
    created_at               DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_at               DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT pk_nomination            PRIMARY KEY (nomination_id),
    CONSTRAINT uq_nomination_reference  UNIQUE      (nomination_reference),
    CONSTRAINT chk_nomination_window    CHECK (nomination_window_end >= nomination_window_start),
    CONSTRAINT fk_nomination_order        FOREIGN KEY (order_id)             REFERENCES dbo.trade_order(order_id),
    CONSTRAINT fk_nomination_uom          FOREIGN KEY (uom_code)             REFERENCES dbo.unit_of_measure(uom_code),
    CONSTRAINT fk_nomination_location     FOREIGN KEY (location_code)        REFERENCES dbo.location(location_code),
    CONSTRAINT fk_nomination_pipeline     FOREIGN KEY (pipeline_code)        REFERENCES dbo.pipeline(pipeline_code),
    CONSTRAINT fk_nomination_vessel       FOREIGN KEY (vessel_id)            REFERENCES dbo.vessel(vessel_id),
    CONSTRAINT fk_nomination_counterparty FOREIGN KEY (counterparty_id)      REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT fk_nomination_submitted_by FOREIGN KEY (submitted_by_user_id) REFERENCES dbo.app_user(user_id)
);
CREATE INDEX ix_nomination_order  ON dbo.nomination (order_id, status);
CREATE INDEX ix_nomination_window ON dbo.nomination (nomination_window_start, nomination_window_end);
END
GO

-- ── dbo.delivery_instruction ─────────────────────────────────────────────────
-- Formal instruction to load/discharge/deliver/receive against a trade order
-- leg, optionally formalizing a prior nomination. Distinct from nomination:
-- a nomination requests/reserves a slot; a delivery instruction is the
-- executed instruction telling a counterparty/terminal/agent exactly what to
-- move, where, and when.
IF OBJECT_ID('dbo.delivery_instruction', 'U') IS NULL
BEGIN
CREATE TABLE dbo.delivery_instruction (
    delivery_instruction_id      INT             NOT NULL IDENTITY(1,1),
    order_id                     INT             NOT NULL,
    nomination_id                INT             NULL,
    instruction_reference        VARCHAR(50)     NOT NULL,
    instruction_type             VARCHAR(20)     NOT NULL
        CONSTRAINT chk_di_type CHECK (instruction_type IN (
            'LOADING','DISCHARGE','RECEIPT','DELIVERY'
        )),
    status                       VARCHAR(20)     NOT NULL DEFAULT 'DRAFT'
        CONSTRAINT chk_di_status CHECK (status IN (
            'DRAFT','ISSUED','ACKNOWLEDGED','IN_PROGRESS','COMPLETED','CANCELLED'
        )),
    quantity                     DECIMAL(18,4)   NOT NULL,
    uom_code                     VARCHAR(20)     NOT NULL,
    location_code                VARCHAR(30)     NULL,
    tank_id                      INT             NULL,
    berth                        VARCHAR(50)     NULL,
    terminal_agent_counterparty_id INT           NULL,   -- shipping/terminal agent executing the instruction
    scheduled_date                DATE            NOT NULL,
    actual_date                   DATE            NULL,
    issued_at                     DATETIME2       NULL,
    acknowledged_at               DATETIME2       NULL,
    notes                         NVARCHAR(2000)  NULL,
    created_at                    DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_at                    DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT pk_delivery_instruction           PRIMARY KEY (delivery_instruction_id),
    CONSTRAINT uq_delivery_instruction_reference UNIQUE      (instruction_reference),
    CONSTRAINT fk_di_order              FOREIGN KEY (order_id)                       REFERENCES dbo.trade_order(order_id),
    CONSTRAINT fk_di_nomination         FOREIGN KEY (nomination_id)                  REFERENCES dbo.nomination(nomination_id),
    CONSTRAINT fk_di_uom                FOREIGN KEY (uom_code)                       REFERENCES dbo.unit_of_measure(uom_code),
    CONSTRAINT fk_di_location           FOREIGN KEY (location_code)                  REFERENCES dbo.location(location_code),
    CONSTRAINT fk_di_tank                FOREIGN KEY (tank_id)                       REFERENCES dbo.tank(tank_id),
    CONSTRAINT fk_di_terminal_agent     FOREIGN KEY (terminal_agent_counterparty_id) REFERENCES dbo.counterparty(counterparty_id)
);
CREATE INDEX ix_delivery_instruction_order ON dbo.delivery_instruction (order_id, status);
CREATE INDEX ix_delivery_instruction_date  ON dbo.delivery_instruction (scheduled_date);
END
GO

-- ── trade_order.period_code -> dbo.period(period_code, commodity_type) ─────────
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trade_order') AND name = 'commodity_type')
  ALTER TABLE dbo.trade_order ADD commodity_type VARCHAR(20) NULL;
GO

UPDATE o
SET o.commodity_type = CASE WHEN t.commodity_type = 'FREIGHT' THEN NULL ELSE t.commodity_type END
FROM dbo.trade_order o
JOIN dbo.trade t ON t.trade_id = o.trade_id
WHERE o.period_code IS NOT NULL AND o.commodity_type IS NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'chk_trade_order_commodity_type')
  ALTER TABLE dbo.trade_order ADD CONSTRAINT chk_trade_order_commodity_type CHECK (commodity_type IN ('OIL','POWER','GAS','AGRICULTURAL','METALS') OR commodity_type IS NULL);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_order_period')
  ALTER TABLE dbo.trade_order ADD CONSTRAINT fk_trade_order_period FOREIGN KEY (period_code, commodity_type) REFERENCES dbo.period(period_code, commodity_type);
GO

-- ── trade_order.incoterm_code -> dbo.incoterm(code, version_year) ──────────────
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trade_order') AND name = 'incoterm_version_year')
  ALTER TABLE dbo.trade_order ADD incoterm_version_year SMALLINT NULL;
GO

UPDATE o
SET o.incoterm_version_year = (
    SELECT MAX(i.version_year) FROM dbo.incoterm i WHERE i.code = o.incoterm_code AND i.is_active = 1
)
FROM dbo.trade_order o
WHERE o.incoterm_code IS NOT NULL AND o.incoterm_version_year IS NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_trade_order_incoterm')
  ALTER TABLE dbo.trade_order ADD CONSTRAINT fk_trade_order_incoterm FOREIGN KEY (incoterm_code, incoterm_version_year) REFERENCES dbo.incoterm(code, version_year);
GO

PRINT 'V93 APPLIED: dbo.nomination + dbo.delivery_instruction created; trade_order.period_code/incoterm_code composite FKs added via new commodity_type/incoterm_version_year columns.';
