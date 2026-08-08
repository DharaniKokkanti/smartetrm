-- V206: dbo.margin_valuation -- the daily/intraday EOD margin computation
-- and FCM-statement-reconciliation run, per clearing_account. This is
-- distinct from dbo.margin_call (V5, already exists, schema-only/disabled
-- registry row, zero code): margin_call is a per-margin_account (i.e.
-- per-market) call/demand ledger entry (call_type/call_direction/
-- status/paid_amount) -- an individual pay-or-receive demand. This table is
-- the account-wide calculation that produces the numbers a call gets issued
-- from: gross/net IM, spread offset discount, VM P&L, FCM ledger balances,
-- and reconciliation status against the FCM's own statement. "margin_call"
-- was already taken by the existing table, hence "margin_valuation" here.
--
-- Also adds a nullable lineage FK from margin_call back to the valuation
-- run that triggered it -- optional (margin_call's grain is per
-- margin_account/market, this table's is per clearing_account/FCM, so it's
-- not a strict 1:1), but worth the traceability since both tables are
-- currently empty and unused by any code.

USE ETRM_DB;
GO

IF OBJECT_ID('dbo.margin_valuation', 'U') IS NOT NULL DROP TABLE dbo.margin_valuation;
GO

CREATE TABLE dbo.margin_valuation (
    margin_valuation_id       BIGINT          NOT NULL IDENTITY(1,1),
    clearing_account_id         INT             NOT NULL,
    valuation_date                DATE            NOT NULL,
    run_type                        VARCHAR(20)     NOT NULL DEFAULT 'EOD'
        CONSTRAINT chk_mv_run_type CHECK (run_type IN (
            'EOD', 'INTRADAY_1', 'INTRADAY_2'
        )),

    total_open_lots                  DECIMAL(18,4)   NOT NULL,
    total_open_volume                 DECIMAL(18,4)   NULL,
    volume_uom_id                       INT             NULL,

    gross_initial_margin                 DECIMAL(18,2)   NOT NULL,
    spread_offset_discount                DECIMAL(18,2)   NOT NULL DEFAULT 0,
    net_required_im                        DECIMAL(18,2)   NOT NULL,

    variation_margin_pnl                    DECIMAL(18,2)   NOT NULL,
    option_premium_amount                    DECIMAL(18,2)   NOT NULL DEFAULT 0,

    fcm_cash_balance                          DECIMAL(18,2)   NOT NULL,
    fcm_collateral_noncash                     DECIMAL(18,2)   NOT NULL,
    fx_rate_to_account_base                     DECIMAL(12,6)   NOT NULL DEFAULT 1,

    net_margin_call_amount                       DECIMAL(18,2)   NOT NULL,
    discrepancy_with_fcm                          DECIMAL(18,2)   NOT NULL DEFAULT 0,
    reconciliation_status                          VARCHAR(20)     NOT NULL DEFAULT 'CALCULATED'
        CONSTRAINT chk_mv_reconciliation_status CHECK (reconciliation_status IN (
            'CALCULATED', 'MATCHED_FCM', 'DISPUTED', 'SETTLED'
        )),
    notes                                            VARCHAR(500)    NULL,

    created_at                                        DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                        VARCHAR(100)    NOT NULL,
    updated_at                                        DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                        VARCHAR(100)    NOT NULL,
    row_version                                        INT             NOT NULL DEFAULT 1,
    created_src_id                                     TINYINT         NOT NULL,
    updated_src_id                                     TINYINT         NOT NULL,

    CONSTRAINT pk_margin_valuation      PRIMARY KEY (margin_valuation_id),
    CONSTRAINT uq_mv_account_date_run   UNIQUE      (clearing_account_id, valuation_date, run_type),
    CONSTRAINT fk_mv_clearing_account   FOREIGN KEY (clearing_account_id) REFERENCES dbo.clearing_account(clearing_account_id),
    CONSTRAINT fk_mv_volume_uom         FOREIGN KEY (volume_uom_id)       REFERENCES dbo.unit_of_measure(uom_id),
    CONSTRAINT fk_margin_valuation_created_src FOREIGN KEY (created_src_id) REFERENCES dbo.source_system(source_system_id),
    CONSTRAINT fk_margin_valuation_updated_src FOREIGN KEY (updated_src_id) REFERENCES dbo.source_system(source_system_id)
);
GO

CREATE INDEX ix_mv_clearing_account ON dbo.margin_valuation(clearing_account_id);
GO

ALTER TABLE dbo.margin_call ADD margin_valuation_id BIGINT NULL
    CONSTRAINT fk_mc_valuation REFERENCES dbo.margin_valuation(margin_valuation_id);
GO

CREATE INDEX ix_mc_valuation ON dbo.margin_call(margin_valuation_id);
GO
