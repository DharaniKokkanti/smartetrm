-- V176: ticker_mapping — the missing "set up a ticker before loading prices"
-- master table.
--
-- Gap this closes: today a vendor ticker string exists in three disconnected,
-- free-text places with no governing master — market_product_link.ticker
-- (exchange root symbol only, e.g. CL), price_index_source.source_ticker
-- (one flat ticker per index+source+listing, no tenor), and
-- settlement_price.contract_ticker (pure free text typed on the price row
-- itself, at load time). None of these let you define, ahead of a price
-- load, "vendor ticker CLH27 maps to price_index NYMEX_WTI, period Mar-27"
-- — a loader has to infer that by parsing the string.
--
-- ticker_mapping is that master: one row per index+period+source
-- combination, pointing at the price_index it feeds and the specific
-- period/tenor it represents (nullable — a continuous/rolling front-month
-- ticker like Bloomberg's CL1 isn't tied to one fixed period). A price-load
-- process resolves an incoming ticker string against this table instead of
-- parsing exchange month-code conventions.
--
-- Per-price-field ticker columns (Dharani's explicit design decision,
-- 2026-07-28): the same underlying vendor feed publishes a DIFFERENT ticker
-- string per price field — e.g. a settle ticker, a separate high ticker, a
-- separate low ticker. Rather than a single vendor_ticker column, one
-- column per settlement_price price field is kept here, so a formula/loader
-- can resolve exactly the right ticker for exactly the field it needs. Every
-- column is nullable — a given mapping row only populates the fields the
-- vendor actually publishes for that index/period/source.
--
-- Deliberately separate from price_index_source: that table governs "which
-- sources feed this index at this listing, in what priority/role"
-- (calculation_sequence, source_role, multiplier/offset) — a sourcing
-- policy. ticker_mapping is the concrete "these exact strings, from this
-- vendor, resolve to this index+tenor, one per price field" fact a loader
-- looks up per incoming row. Different questions, different tables.
--
-- row_version stays INT (Dharani confirmed 2026-07-28) — this is a small,
-- human-edited reference table, not a high-frequency automated-write target.

CREATE TABLE dbo.ticker_mapping (
    ticker_mapping_id   INT IDENTITY(1,1) NOT NULL,
    price_index_id      INT             NOT NULL,
    period_id           BIGINT          NULL,
    price_source_id     INT             NOT NULL,
    settle_ticker        VARCHAR(50)    NULL,
    open_ticker          VARCHAR(50)    NULL,
    high_ticker          VARCHAR(50)    NULL,
    low_ticker           VARCHAR(50)    NULL,
    avg_ticker           VARCHAR(50)    NULL,
    prompt_ticker        VARCHAR(50)    NULL,
    bid_ticker           VARCHAR(50)    NULL,
    ask_ticker           VARCHAR(50)    NULL,
    mid_ticker           VARCHAR(50)    NULL,
    effective_from       DATE            NOT NULL,
    effective_to         DATE            NULL,
    is_active            BIT             NOT NULL CONSTRAINT df_ticker_mapping_is_active DEFAULT (1),
    notes                VARCHAR(300)   NULL,
    row_version          INT            NOT NULL CONSTRAINT df_ticker_mapping_row_version DEFAULT (1),
    created_at           DATETIME2      NOT NULL CONSTRAINT df_ticker_mapping_created_at DEFAULT (SYSUTCDATETIME()),
    created_by           VARCHAR(100)   NOT NULL CONSTRAINT df_ticker_mapping_created_by DEFAULT (SYSTEM_USER),
    updated_at           DATETIME2      NOT NULL CONSTRAINT df_ticker_mapping_updated_at DEFAULT (SYSUTCDATETIME()),
    updated_by           VARCHAR(100)   NOT NULL CONSTRAINT df_ticker_mapping_updated_by DEFAULT (SYSTEM_USER),
    CONSTRAINT pk_ticker_mapping PRIMARY KEY (ticker_mapping_id),
    CONSTRAINT fk_ticker_mapping_price_index FOREIGN KEY (price_index_id) REFERENCES dbo.price_index (price_index_id),
    CONSTRAINT fk_ticker_mapping_period FOREIGN KEY (period_id) REFERENCES dbo.period (period_id),
    CONSTRAINT fk_ticker_mapping_price_source FOREIGN KEY (price_source_id) REFERENCES dbo.price_source (price_source_id),
    CONSTRAINT chk_ticker_mapping_effective_range CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT chk_ticker_mapping_at_least_one_field CHECK (
        settle_ticker IS NOT NULL OR open_ticker IS NOT NULL OR high_ticker IS NOT NULL OR low_ticker IS NOT NULL
        OR avg_ticker IS NOT NULL OR prompt_ticker IS NOT NULL OR bid_ticker IS NOT NULL OR ask_ticker IS NOT NULL OR mid_ticker IS NOT NULL
    ),
    CONSTRAINT uq_ticker_mapping UNIQUE (price_index_id, period_id, price_source_id, effective_from)
);
GO

CREATE INDEX ix_ticker_mapping_price_index ON dbo.ticker_mapping (price_index_id);
GO
CREATE INDEX ix_ticker_mapping_period ON dbo.ticker_mapping (period_id);
GO

-- V153's row_version guard trigger — added by hand per that migration's own
-- documented policy, same shape as V159/V162's precedent.
CREATE TRIGGER dbo.trg_ticker_mapping_row_version_guard
    ON dbo.ticker_mapping
    AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT UPDATE(row_version)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must be explicitly set on every UPDATE to dbo.ticker_mapping (bypass write rejected by trg_ticker_mapping_row_version_guard)', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN deleted d ON i.ticker_mapping_id = d.ticker_mapping_id
        WHERE i.row_version <= d.row_version
    )
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('row_version must strictly increase on every UPDATE to dbo.ticker_mapping (stale or reused version rejected by trg_ticker_mapping_row_version_guard)', 16, 1);
        RETURN;
    END
END;
GO

INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, data_category, allow_create, allow_edit, allow_delete, allow_excel_upload, is_enabled, display_order, description, created_by, updated_by)
VALUES ('ticker_mapping', 'Ticker Mapping', 'Pricing & Rates', 'MASTER_DATA', 0, 0, 0, 0, 0, 942,
        'Catalog-only row -- has a dedicated Tier 1 controller (TickerMappingController), not Tier2-generic CRUD. is_enabled=0 (never a Static Data page); exists only so governance sweeps can query by data_category.',
        'SYSTEM', 'SYSTEM');
GO
