-- V202: dbo.clearing_account -- FCM-level clearing relationship master.
--
-- Margin-call-management schema review (2026-08-08): the previously flagged
-- gap on derivative_contract_specification (see handoff doc §12) turned out
-- to need a broader model than two flat columns. This is table 1 of 5
-- (V202-V206): the FCM/clearing-broker-level account a firm holds margin
-- balances under -- distinct from dbo.margin_account (V5), which tracks a
-- per-market balance *under* one of these accounts. One clearing_account can
-- span multiple markets/exchanges (e.g. one FCM relationship covering many
-- CME products), which margin_account's own grain can't express alone.
--
-- legal_entity_id/clearing_broker_id/currency_id are lifted OFF
-- margin_account and onto this table in V203 -- they were redundant at the
-- per-market grain once an account-level owner exists.

USE ETRM_DB;
GO

IF OBJECT_ID('dbo.clearing_account', 'U') IS NOT NULL DROP TABLE dbo.clearing_account;
GO

CREATE TABLE dbo.clearing_account (
    clearing_account_id INT             NOT NULL IDENTITY(1,1),
    account_code         VARCHAR(50)     NOT NULL,   -- e.g. 'FCM_MAREX_EEX_01'
    account_name         VARCHAR(100)    NOT NULL,
    clearing_broker_id   INT             NOT NULL,   -- FK counterparty (the FCM)
    legal_entity_id       INT             NOT NULL,   -- FK legal_entity (our internal book entity)
    base_currency_id      INT             NOT NULL,
    margin_calc_method    VARCHAR(20)     NOT NULL DEFAULT 'SPAN'
        CONSTRAINT chk_ca_margin_calc_method CHECK (margin_calc_method IN (
            'SPAN', 'VAR', 'GRID_FLAT'
        )),
    target_cash_buffer    DECIMAL(18,2)   NOT NULL DEFAULT 0,
    is_active              BIT             NOT NULL DEFAULT 1,
    notes                  VARCHAR(500)    NULL,

    created_at             DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by             VARCHAR(100)    NOT NULL,
    updated_at             DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by             VARCHAR(100)    NOT NULL,
    row_version             INT             NOT NULL DEFAULT 1,
    created_src_id          TINYINT         NOT NULL,
    updated_src_id          TINYINT         NOT NULL,

    CONSTRAINT pk_clearing_account       PRIMARY KEY (clearing_account_id),
    CONSTRAINT uq_ca_account_code        UNIQUE      (account_code),
    CONSTRAINT fk_ca_broker              FOREIGN KEY (clearing_broker_id) REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT fk_ca_entity              FOREIGN KEY (legal_entity_id)    REFERENCES dbo.legal_entity(legal_entity_id),
    CONSTRAINT fk_ca_currency            FOREIGN KEY (base_currency_id)   REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_clearing_account_created_src FOREIGN KEY (created_src_id) REFERENCES dbo.source_system(source_system_id),
    CONSTRAINT fk_clearing_account_updated_src FOREIGN KEY (updated_src_id) REFERENCES dbo.source_system(source_system_id)
);
GO

CREATE INDEX ix_ca_broker ON dbo.clearing_account(clearing_broker_id);
CREATE INDEX ix_ca_entity ON dbo.clearing_account(legal_entity_id);
GO
