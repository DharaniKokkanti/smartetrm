-- V180: option pricing / volatility surface foundation.
--
-- Everything before this migration in the pricing schema (price_index,
-- price_index_source, ticker_mapping, settlement_price) covers linear
-- instruments — futures, swaps, physical forward curves priced directly off
-- a forward/spot value. Options need one more dimension: an option cannot be
-- marked from a forward price alone, it needs an implied volatility surface
-- (parameterized by expiry/tenor and strike or delta/moneyness) plus a
-- pricing model to turn (forward, vol, strike, tenor) into a value.
--
-- option_index_link — one row per option index, pointing at:
--   - its own identity (option_price_index_id, a normal dbo.price_index row
--     — an option series is still "an index" in this schema's terms, it
--     just gets an extra linkage row here rather than a special type)
--   - the underlying linear index the pricing model reads the forward price
--     from (underlying_price_index_id — e.g. an option index's forward
--     comes from the corresponding futures/swap index already in
--     price_index)
--   - which model prices it (pricing_model) — needed because the model
--     varies by market: BLACK_76 for standard commodity futures options,
--     GARMAN_KOHLHAGEN for FX-style options, SABR/SHIFTED_LOGNORMAL where
--     negative underlying prices are possible (power, some gas markets).
--
-- volatility_point — one implied-vol quote: which option index
-- (option_index_link_id), which expiry/tenor (period_id), which
-- strike/moneyness point, on which date, from which source. moneyness_label
-- carries either a delta-style bucket (ATM, 25D_PUT, 25D_CALL) or a literal
-- strike label; strike_price is only populated when the point is
-- strike-based rather than delta-based (both aren't required — a market
-- quotes one or the other, not always both).
--
-- row_version is INT on both (Dharani confirmed 2026-07-28) — small
-- human-edited reference table for option_index_link; volatility_point is
-- higher-volume but INT was still the confirmed choice for now.
-- =============================================================================

CREATE TABLE dbo.option_index_link (
    option_index_link_id     INT IDENTITY(1,1) NOT NULL,
    option_price_index_id     INT            NOT NULL,
    underlying_price_index_id INT            NOT NULL,
    pricing_model             VARCHAR(30)    NOT NULL,
    is_active                 BIT            NOT NULL CONSTRAINT df_option_index_link_is_active DEFAULT (1),
    notes                     VARCHAR(300)   NULL,
    row_version               INT            NOT NULL CONSTRAINT df_option_index_link_row_version DEFAULT (1),
    created_at                DATETIME2      NOT NULL CONSTRAINT df_option_index_link_created_at DEFAULT (SYSUTCDATETIME()),
    created_by                VARCHAR(100)   NOT NULL CONSTRAINT df_option_index_link_created_by DEFAULT (SYSTEM_USER),
    updated_at                DATETIME2      NOT NULL CONSTRAINT df_option_index_link_updated_at DEFAULT (SYSUTCDATETIME()),
    updated_by                VARCHAR(100)   NOT NULL CONSTRAINT df_option_index_link_updated_by DEFAULT (SYSTEM_USER),
    CONSTRAINT pk_option_index_link PRIMARY KEY (option_index_link_id),
    CONSTRAINT fk_option_index_link_option_index FOREIGN KEY (option_price_index_id) REFERENCES dbo.price_index (price_index_id),
    CONSTRAINT fk_option_index_link_underlying_index FOREIGN KEY (underlying_price_index_id) REFERENCES dbo.price_index (price_index_id),
    CONSTRAINT chk_option_index_link_distinct CHECK (option_price_index_id <> underlying_price_index_id),
    CONSTRAINT chk_option_index_link_model CHECK (pricing_model IN ('BLACK_76', 'GARMAN_KOHLHAGEN', 'SABR', 'BACHELIER', 'SHIFTED_LOGNORMAL')),
    CONSTRAINT uq_option_index_link UNIQUE (option_price_index_id)
);
GO

CREATE TRIGGER dbo.trg_option_index_link_row_version_guard
    ON dbo.option_index_link
    AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.option_index_link (bypass write rejected by trg_option_index_link_row_version_guard)', 16, 1);
        RETURN;
    END
    IF EXISTS (SELECT 1 FROM inserted i INNER JOIN deleted d ON i.option_index_link_id = d.option_index_link_id WHERE i.row_version <= d.row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.option_index_link (stale or reused version rejected by trg_option_index_link_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO

CREATE TABLE dbo.volatility_point (
    volatility_point_id  INT IDENTITY(1,1) NOT NULL,
    option_index_link_id  INT            NOT NULL,
    period_id             BIGINT         NOT NULL,
    moneyness_label       VARCHAR(20)    NOT NULL,
    strike_price          DECIMAL(18,6)  NULL,
    quote_date            DATE           NOT NULL,
    implied_volatility    DECIMAL(9,6)   NOT NULL,
    price_source_id       INT            NOT NULL,
    is_confirmed          BIT            NOT NULL CONSTRAINT df_volatility_point_is_confirmed DEFAULT (0),
    notes                 VARCHAR(300)   NULL,
    row_version           INT            NOT NULL CONSTRAINT df_volatility_point_row_version DEFAULT (1),
    created_at             DATETIME2      NOT NULL CONSTRAINT df_volatility_point_created_at DEFAULT (SYSUTCDATETIME()),
    created_by             VARCHAR(100)   NOT NULL CONSTRAINT df_volatility_point_created_by DEFAULT (SYSTEM_USER),
    updated_at             DATETIME2      NOT NULL CONSTRAINT df_volatility_point_updated_at DEFAULT (SYSUTCDATETIME()),
    updated_by             VARCHAR(100)   NOT NULL CONSTRAINT df_volatility_point_updated_by DEFAULT (SYSTEM_USER),
    CONSTRAINT pk_volatility_point PRIMARY KEY (volatility_point_id),
    CONSTRAINT fk_volatility_point_option_index_link FOREIGN KEY (option_index_link_id) REFERENCES dbo.option_index_link (option_index_link_id),
    CONSTRAINT fk_volatility_point_period FOREIGN KEY (period_id) REFERENCES dbo.period (period_id),
    CONSTRAINT fk_volatility_point_price_source FOREIGN KEY (price_source_id) REFERENCES dbo.price_source (price_source_id),
    CONSTRAINT chk_volatility_point_iv_non_negative CHECK (implied_volatility >= 0),
    CONSTRAINT uq_volatility_point UNIQUE (option_index_link_id, period_id, moneyness_label, quote_date, price_source_id)
);
GO

CREATE INDEX ix_volatility_point_option_index_link ON dbo.volatility_point (option_index_link_id);
GO
CREATE INDEX ix_volatility_point_period ON dbo.volatility_point (period_id);
GO

CREATE TRIGGER dbo.trg_volatility_point_row_version_guard
    ON dbo.volatility_point
    AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.volatility_point (bypass write rejected by trg_volatility_point_row_version_guard)', 16, 1);
        RETURN;
    END
    IF EXISTS (SELECT 1 FROM inserted i INNER JOIN deleted d ON i.volatility_point_id = d.volatility_point_id WHERE i.row_version <= d.row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.volatility_point (stale or reused version rejected by trg_volatility_point_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO

INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, data_category, allow_create, allow_edit, allow_delete, allow_excel_upload, is_enabled, display_order, description, created_by, updated_by)
VALUES
    ('option_index_link', 'Option Index Link', 'Pricing & Rates', 'MASTER_DATA', 0, 0, 0, 0, 0, 943,
     'Catalog-only row -- has a dedicated Tier 1 controller (OptionIndexLinkController), not Tier2-generic CRUD. is_enabled=0 (never a Static Data page); exists only so governance sweeps can query by data_category.',
     'SYSTEM', 'SYSTEM'),
    ('volatility_point', 'Volatility Point', 'Pricing & Rates', 'MASTER_DATA', 0, 0, 0, 0, 0, 944,
     'Catalog-only row -- has a dedicated Tier 1 controller (VolatilityPointController), not Tier2-generic CRUD. is_enabled=0 (never a Static Data page); exists only so governance sweeps can query by data_category.',
     'SYSTEM', 'SYSTEM');
GO
