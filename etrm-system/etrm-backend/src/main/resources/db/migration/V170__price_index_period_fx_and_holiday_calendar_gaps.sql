-- =============================================================================
-- V170 — four corrections from design review of V168/V169:
--
-- 1. dbo.settlement_price: DROP price_kind. It was a redundant discriminator
--    — fully derivable from which identity path is populated (contract_ticker
--    non-null = futures/option, price_index_id non-null = index fixing).
--    Storing "what kind of price is this" as free text next to two columns
--    that already say it structurally invited drift. chk_sp_identity now
--    checks the same rule without the redundant column.
--
-- 2. dbo.period: +price_index_id, +fx_index_id (both nullable FK to
--    price_index). Corrects a real gap: a published curve (Platts, Argus,
--    ICE) very often has a SEPARATE value per listed period — "TTF Month+1"
--    and "TTF Month+2" are different index series, not one flat "TTF"
--    number — so each period needs its own price_index_id, not a single
--    index shared across every period of a market_product_link. fx_index_id
--    mirrors dbo.trade_pricing_schedule's existing fx_index_id (the FX
--    conversion series for cross-currency pricing) at the period level, so
--    a default FX source can resolve per period instead of needing a
--    trade-level override every time.
--
-- 3. dbo.price_source: +calendar_id (nullable FK to holiday_calendar) — so
--    an ingestion/loader job can check "is today a valid publication day
--    for this source" and skip expecting a value on the source's holidays,
--    instead of flagging every holiday as a missing/late fixing.
--
-- 4. dbo.price_index.settlement_interval_type RENAMED to
--    publication_frequency and broadened. It previously only covered the
--    power sub-hourly cases (DAILY/HOURLY/FIFTEEN_MIN/FIVE_MIN); this is
--    the general "how often does this index actually publish a new value"
--    concept for every index, power or not (weekly gas contract
--    assessments, business-day-only physical assessments, quarterly
--    reference prices, etc.) — one field instead of a power-only one plus
--    a separate non-power one.
-- =============================================================================

ALTER TABLE dbo.settlement_price DROP CONSTRAINT chk_sp_identity;
GO
ALTER TABLE dbo.settlement_price DROP CONSTRAINT chk_sp_price_kind;
GO
ALTER TABLE dbo.settlement_price DROP CONSTRAINT df_sp_price_kind;
GO
ALTER TABLE dbo.settlement_price DROP COLUMN price_kind;
GO
ALTER TABLE dbo.settlement_price ADD CONSTRAINT chk_sp_identity CHECK (
    (contract_ticker IS NOT NULL AND exchange IS NOT NULL AND price_index_id IS NULL)
    OR
    (price_index_id IS NOT NULL AND contract_ticker IS NULL AND exchange IS NULL)
);
GO

ALTER TABLE dbo.period ADD price_index_id INT NULL;
GO
ALTER TABLE dbo.period ADD CONSTRAINT fk_period_price_index FOREIGN KEY (price_index_id) REFERENCES dbo.price_index(price_index_id);
GO
ALTER TABLE dbo.period ADD fx_index_id INT NULL;
GO
ALTER TABLE dbo.period ADD CONSTRAINT fk_period_fx_index FOREIGN KEY (fx_index_id) REFERENCES dbo.price_index(price_index_id);
GO

ALTER TABLE dbo.price_source ADD calendar_id INT NULL;
GO
ALTER TABLE dbo.price_source ADD CONSTRAINT fk_ps_calendar FOREIGN KEY (calendar_id) REFERENCES dbo.holiday_calendar(calendar_id);
GO

ALTER TABLE dbo.price_index DROP CONSTRAINT chk_pi_settlement_interval;
GO
ALTER TABLE dbo.price_index DROP CONSTRAINT df_pi_settlement_interval;
GO
EXEC sp_rename 'dbo.price_index.settlement_interval_type', 'publication_frequency', 'COLUMN';
GO
ALTER TABLE dbo.price_index ADD CONSTRAINT df_pi_publication_frequency DEFAULT 'DAILY' FOR publication_frequency;
GO
ALTER TABLE dbo.price_index ADD CONSTRAINT chk_pi_publication_frequency CHECK (publication_frequency IN (
    'DAILY',        -- new value every calendar day (most physical/OTC indices)
    'BUSINESS_DAY', -- new value only on business days (many exchange/vendor assessments)
    'WEEKLY',       -- weekly assessment (some gas/freight indices)
    'MONTHLY',      -- monthly reference price
    'QUARTERLY',    -- quarterly reference price
    'HOURLY',       -- day-ahead power (PJM/MISO/ERCOT hourly nodes)
    'FIFTEEN_MIN',  -- real-time power settlement (ERCOT, PJM, MISO, SPP)
    'FIVE_MIN'      -- real-time power settlement (CAISO)
));
GO

PRINT '============================================================';
PRINT 'V170 — settlement_price: price_kind dropped (derivable);';
PRINT '       period: +price_index_id, +fx_index_id;';
PRINT '       price_source: +calendar_id;';
PRINT '       price_index.settlement_interval_type renamed to';
PRINT '       publication_frequency, broadened beyond power-only values.';
PRINT '============================================================';
GO
