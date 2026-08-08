-- V205: dbo.margin_offset_rule -- inter-commodity margin offset/netting
-- rules (spark spread, dark spread, crack spread IM discounts). Legs
-- reference market_product_link_id (the listed contract), not a free-text
-- commodity code -- exchange offset programs are published per listed
-- contract pair, and this keeps the rule tied to the same normalized
-- product/market data as everything else rather than a second, driftable
-- copy of commodity classification.

USE ETRM_DB;
GO

IF OBJECT_ID('dbo.margin_offset_rule', 'U') IS NOT NULL DROP TABLE dbo.margin_offset_rule;
GO

CREATE TABLE dbo.margin_offset_rule (
    margin_offset_rule_id       INT             NOT NULL IDENTITY(1,1),
    exchange_id                   INT             NOT NULL,
    leg1_market_product_link_id    INT             NOT NULL,
    leg2_market_product_link_id    INT             NOT NULL,
    offset_ratio_leg1               DECIMAL(10,4)   NOT NULL,
    offset_ratio_leg2               DECIMAL(10,4)   NOT NULL,
    im_reduction_pct                 DECIMAL(5,2)    NOT NULL,
    effective_from                    DATE            NOT NULL,
    effective_to                      DATE            NULL,
    is_active                          BIT             NOT NULL DEFAULT 1,
    notes                                VARCHAR(500)    NULL,

    created_at                           DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                           VARCHAR(100)    NOT NULL,
    updated_at                           DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                           VARCHAR(100)    NOT NULL,
    row_version                           INT             NOT NULL DEFAULT 1,
    created_src_id                        TINYINT         NOT NULL,
    updated_src_id                        TINYINT         NOT NULL,

    CONSTRAINT pk_margin_offset_rule    PRIMARY KEY (margin_offset_rule_id),
    CONSTRAINT fk_mor_exchange          FOREIGN KEY (exchange_id)                REFERENCES dbo.exchange(exchange_id),
    CONSTRAINT fk_mor_leg1              FOREIGN KEY (leg1_market_product_link_id) REFERENCES dbo.market_product_link(market_product_link_id),
    CONSTRAINT fk_mor_leg2              FOREIGN KEY (leg2_market_product_link_id) REFERENCES dbo.market_product_link(market_product_link_id),
    CONSTRAINT chk_mor_legs_differ      CHECK (leg1_market_product_link_id <> leg2_market_product_link_id),
    CONSTRAINT chk_mor_dates            CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT chk_mor_reduction_pct    CHECK (im_reduction_pct >= 0 AND im_reduction_pct <= 100),
    CONSTRAINT uq_mor_legs_effective    UNIQUE (leg1_market_product_link_id, leg2_market_product_link_id, effective_from),
    CONSTRAINT fk_margin_offset_rule_created_src FOREIGN KEY (created_src_id) REFERENCES dbo.source_system(source_system_id),
    CONSTRAINT fk_margin_offset_rule_updated_src FOREIGN KEY (updated_src_id) REFERENCES dbo.source_system(source_system_id)
);
GO

CREATE INDEX ix_mor_exchange ON dbo.margin_offset_rule(exchange_id);
GO
