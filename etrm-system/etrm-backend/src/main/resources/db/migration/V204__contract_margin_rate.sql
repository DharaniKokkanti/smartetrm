-- V204: dbo.contract_margin_rate -- exchange-published initial/maintenance
-- margin rate per derivative contract spec, effective-dated (rates change
-- on an exchange schedule, sometimes tiered by tenor bucket) -- this is the
-- fuller replacement for the two flat columns originally flagged for
-- derivative_contract_specification in the handoff doc §12 on 2026-08-08.
--
-- Deliberately does NOT repeat exchange_id/commodity_code/commodity_type --
-- all derivable via contract_spec_id -> derivative_contract_specification.
-- market_product_link_id -> market_product_link.market_id/product_id ->
-- market.exchange_id / product.commodity_id. Storing them again here would
-- let this table's classification drift out of sync with product/market.
--
-- Only applies to derivative contracts by construction -- it hangs off
-- derivative_contract_specification, which physical (non-derivative)
-- market_product_link rows never have a row in.

USE ETRM_DB;
GO

IF OBJECT_ID('dbo.contract_margin_rate', 'U') IS NOT NULL DROP TABLE dbo.contract_margin_rate;
GO

CREATE TABLE dbo.contract_margin_rate (
    contract_margin_rate_id INT             NOT NULL IDENTITY(1,1),
    contract_spec_id         INT             NOT NULL,
    tenor_bucket               VARCHAR(20)     NOT NULL DEFAULT 'ALL'
        CONSTRAINT chk_cmr_tenor_bucket CHECK (tenor_bucket IN (
            'ALL', 'FRONT_MONTH', 'BACK_MONTH'
        )),
    margin_unit_type           VARCHAR(20)     NOT NULL DEFAULT 'PER_LOT'
        CONSTRAINT chk_cmr_unit_type CHECK (margin_unit_type IN (
            'PER_LOT', 'PER_MWH', 'PER_MMBTU', 'PERCENT_MTM'
        )),
    initial_margin_rate         DECIMAL(18,6)   NOT NULL,
    maintenance_margin_rate     DECIMAL(18,6)   NOT NULL,
    margin_currency_id           INT             NOT NULL,
    effective_from                DATE            NOT NULL,
    effective_to                  DATE            NULL,
    is_current                     BIT             NOT NULL DEFAULT 1,
    is_active                       BIT             NOT NULL DEFAULT 1,
    notes                            VARCHAR(500)    NULL,

    created_at                       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                       VARCHAR(100)    NOT NULL,
    updated_at                       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                       VARCHAR(100)    NOT NULL,
    row_version                       INT             NOT NULL DEFAULT 1,
    created_src_id                    TINYINT         NOT NULL,
    updated_src_id                    TINYINT         NOT NULL,

    CONSTRAINT pk_contract_margin_rate     PRIMARY KEY (contract_margin_rate_id),
    CONSTRAINT uq_cmr_spec_tenor_effective UNIQUE      (contract_spec_id, tenor_bucket, effective_from),
    CONSTRAINT fk_cmr_contract_spec        FOREIGN KEY (contract_spec_id)  REFERENCES dbo.derivative_contract_specification(contract_spec_id),
    CONSTRAINT fk_cmr_currency             FOREIGN KEY (margin_currency_id) REFERENCES dbo.currency(currency_id),
    CONSTRAINT chk_cmr_dates               CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT chk_cmr_rates_nonneg        CHECK (initial_margin_rate >= 0 AND maintenance_margin_rate >= 0),
    CONSTRAINT fk_contract_margin_rate_created_src FOREIGN KEY (created_src_id) REFERENCES dbo.source_system(source_system_id),
    CONSTRAINT fk_contract_margin_rate_updated_src FOREIGN KEY (updated_src_id) REFERENCES dbo.source_system(source_system_id)
);
GO

CREATE INDEX ix_cmr_contract_spec ON dbo.contract_margin_rate(contract_spec_id);
GO
