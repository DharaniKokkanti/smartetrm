-- V208: dbo.clearing_account_margin_rate -- the broker's house margin rate
-- per clearing_account per contract spec, layered on top of the
-- exchange-published dbo.contract_margin_rate (V204). FCMs routinely charge
-- a markup over the exchange minimum, and that markup varies per client
-- account and per contract -- flagged live 2026-08-08, missed in the
-- original V202-V207 pass because the proposal that started this work never
-- modeled account-specific rates, only one generic exchange-wide table.
--
-- Deliberately a separate table, not new columns on contract_margin_rate:
-- contract_margin_rate stays the exchange baseline (applies to everyone),
-- this table is the account-specific override on top of it. Same
-- tenor_bucket/margin_unit_type shape as contract_margin_rate for
-- consistency, since a house rate can be tiered the same way the exchange
-- rate is.

USE ETRM_DB;
GO

IF OBJECT_ID('dbo.clearing_account_margin_rate', 'U') IS NOT NULL DROP TABLE dbo.clearing_account_margin_rate;
GO

CREATE TABLE dbo.clearing_account_margin_rate (
    clearing_account_margin_rate_id INT             NOT NULL IDENTITY(1,1),
    clearing_account_id               INT             NOT NULL,
    contract_spec_id                    INT             NOT NULL,
    tenor_bucket                          VARCHAR(20)     NOT NULL DEFAULT 'ALL'
        CONSTRAINT chk_camr_tenor_bucket CHECK (tenor_bucket IN (
            'ALL', 'FRONT_MONTH', 'BACK_MONTH'
        )),
    margin_unit_type                      VARCHAR(20)     NOT NULL DEFAULT 'PER_LOT'
        CONSTRAINT chk_camr_unit_type CHECK (margin_unit_type IN (
            'PER_LOT', 'PER_MWH', 'PER_MMBTU', 'PERCENT_MTM'
        )),
    house_initial_margin_rate               DECIMAL(18,6)   NOT NULL,
    house_maintenance_margin_rate            DECIMAL(18,6)   NOT NULL,
    margin_currency_id                        INT             NOT NULL,
    effective_from                              DATE            NOT NULL,
    effective_to                                DATE            NULL,
    is_current                                   BIT             NOT NULL DEFAULT 1,
    is_active                                     BIT             NOT NULL DEFAULT 1,
    notes                                          VARCHAR(500)    NULL,

    created_at                                      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                      VARCHAR(100)    NOT NULL,
    updated_at                                      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                      VARCHAR(100)    NOT NULL,
    row_version                                      INT             NOT NULL DEFAULT 1,
    created_src_id                                   TINYINT         NOT NULL,
    updated_src_id                                   TINYINT         NOT NULL,

    CONSTRAINT pk_clearing_account_margin_rate PRIMARY KEY (clearing_account_margin_rate_id),
    CONSTRAINT uq_camr_account_spec_tenor_eff  UNIQUE      (clearing_account_id, contract_spec_id, tenor_bucket, effective_from),
    CONSTRAINT fk_camr_clearing_account        FOREIGN KEY (clearing_account_id) REFERENCES dbo.clearing_account(clearing_account_id),
    CONSTRAINT fk_camr_contract_spec           FOREIGN KEY (contract_spec_id)    REFERENCES dbo.derivative_contract_specification(contract_spec_id),
    CONSTRAINT fk_camr_currency                FOREIGN KEY (margin_currency_id) REFERENCES dbo.currency(currency_id),
    CONSTRAINT chk_camr_dates                  CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT chk_camr_rates_nonneg           CHECK (house_initial_margin_rate >= 0 AND house_maintenance_margin_rate >= 0),
    CONSTRAINT fk_clearing_account_margin_rate_created_src FOREIGN KEY (created_src_id) REFERENCES dbo.source_system(source_system_id),
    CONSTRAINT fk_clearing_account_margin_rate_updated_src FOREIGN KEY (updated_src_id) REFERENCES dbo.source_system(source_system_id)
);
GO

CREATE INDEX ix_camr_clearing_account ON dbo.clearing_account_margin_rate(clearing_account_id);
CREATE INDEX ix_camr_contract_spec ON dbo.clearing_account_margin_rate(contract_spec_id);
GO

DECLARE @src TINYINT = (SELECT source_system_id FROM dbo.source_system WHERE source_code = 'TIER1_APPLICATION_SCREEN');
DECLARE @now DATETIME2 = SYSUTCDATETIME();
DECLARE @by VARCHAR(100) = 'flyway_migration';

INSERT INTO dbo.master_data_table_registry
    (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload,
     is_enabled, display_order, sub_group, description, data_category,
     created_at, created_by, updated_at, updated_by, created_src_id, updated_src_id)
VALUES
    ('clearing_account_margin_rate', 'Clearing Account Margin Rate', 'Credit & Collateral', 0, 0, 0, 0,
     0, 911, NULL, 'FCM house margin rate (markup over the exchange-published rate) per clearing account per contract spec. Managed inline as a tab on the Clearing Account page, not a standalone Tier2 screen.', 'MASTER_DATA',
     @now, @by, @now, @by, @src, @src);
GO
