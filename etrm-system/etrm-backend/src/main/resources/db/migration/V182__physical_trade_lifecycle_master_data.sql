-- V182: physical trade-lifecycle master data for Oil, Power, Agri, Metals —
-- the most commonly traded physical benchmarks in each commodity class, so
-- a real physical trade in any of the 4 classes can actually be booked and
-- priced end-to-end (Product -> Market -> Market Product Link -> Period ->
-- Price Index -> Price Index Source -> Ticker Mapping). Futures/swaps/
-- options instrument coverage is deliberately deferred to a later
-- migration (Dharani's explicit scoping, 2026-07-28) — everything here is
-- physical/OTC-assessment style.
--
-- Idempotent by design: every insert is guarded by IF NOT EXISTS keyed on
-- the natural code (product_code/market_code/index_code/etc.), and each
-- guarded block re-resolves its row's id via SELECT regardless of whether
-- it just inserted or the row already existed. This is deliberate, not
-- defensive boilerplate: OIL's rows (ICE_BRENT/NYMEX_WTI/ICAP_BRENT_OTC
-- markets, DTBRT/WTI-CUSH price_index, and their price_index_source rows)
-- were added directly to THIS dev DB in an earlier segment of this same
-- session, NOT via a migration — this migration codifies those exact same
-- facts (same codes) so they (a) survive a fresh DB rebuild and (b) stop
-- being an ad-hoc, unmigrated gap flagged in the handoff doc. Re-running
-- this migration against a DB that already has them (like this one) is a
-- safe no-op for those rows; a fresh DB gets them created for the first
-- time. New POWER/AGRI/METALS rows follow the identical pattern for
-- consistency, not because they're expected to pre-exist anywhere.
--
-- Reference ids used below (confirmed live against this DB before writing):
-- commodity: OIL=1, POWER=2, GAS=3, AGRI=4, METALS=5
-- currency: USD=1, EUR=2, GBP=3
-- uom: BBL=1, MT=3, MWH=4, BUSHEL=10, TROY_OZ=14
-- exchange: ICE=1, NYMEX=2, CME=3, LME=4, EEX=5, CBOT=6, ICAP=8, TRAD=9
-- price_source: PLATTS=1, ARGUS=2, ICE_DATA=5, NYMEX_DATA=6, LME_DATA=7
-- settlement_type: PHYSICAL=1
-- pricing_type: INDEX=2
-- =============================================================================

SET NOCOUNT ON;

DECLARE @market_id INT, @product_id INT, @mpl_id INT, @period_id BIGINT, @index_id INT, @pis_id INT;

-- =============================================================================
-- OIL — Dated Brent (ICE_BRENT + ICAP_BRENT_OTC listings) and WTI Cushing
-- (NYMEX_WTI listing). Codifies the ad-hoc rows added earlier this session.
-- =============================================================================

IF NOT EXISTS (SELECT 1 FROM dbo.market WHERE market_code = 'ICE_BRENT')
    INSERT INTO dbo.market (exchange_id, commodity_id, market_code, market_name, market_type, settlement_type, currency_id, timezone, is_active, created_at, created_by, updated_at, updated_by, row_version)
    VALUES (1, 1, 'ICE_BRENT', 'ICE Brent Crude', 'EXCHANGE', 'FINANCIAL', 1, 'Europe/London', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.market WHERE market_code = 'NYMEX_WTI')
    INSERT INTO dbo.market (exchange_id, commodity_id, market_code, market_name, market_type, settlement_type, currency_id, timezone, is_active, created_at, created_by, updated_at, updated_by, row_version)
    VALUES (2, 1, 'NYMEX_WTI', 'NYMEX WTI Crude', 'EXCHANGE', 'FINANCIAL', 1, 'America/New_York', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.market WHERE market_code = 'ICAP_BRENT_OTC')
    INSERT INTO dbo.market (exchange_id, commodity_id, market_code, market_name, market_type, settlement_type, currency_id, timezone, is_active, created_at, created_by, updated_at, updated_by, row_version)
    VALUES (8, 1, 'ICAP_BRENT_OTC', 'ICAP Brent OTC Cargo', 'OTC_BILATERAL', 'PHYSICAL', 1, 'Europe/London', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.market_product_link WHERE ticker = 'LCOc1')
BEGIN
    SELECT @market_id = market_id FROM dbo.market WHERE market_code = 'ICE_BRENT';
    IF @market_id IS NOT NULL
        INSERT INTO dbo.market_product_link (market_id, product_id, ticker, is_active, created_at, created_by, updated_at, updated_by, row_version)
        SELECT @market_id, product_id, 'LCOc1', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0 FROM dbo.product WHERE product_code = 'BRENT-CRUDE';
END

IF NOT EXISTS (SELECT 1 FROM dbo.market_product_link WHERE ticker = 'CLc1')
BEGIN
    SELECT @market_id = market_id FROM dbo.market WHERE market_code = 'NYMEX_WTI';
    IF @market_id IS NOT NULL
        INSERT INTO dbo.market_product_link (market_id, product_id, ticker, is_active, created_at, created_by, updated_at, updated_by, row_version)
        SELECT @market_id, product_id, 'CLc1', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0 FROM dbo.product WHERE product_code = 'WTI-CRUDE';
END

IF NOT EXISTS (SELECT 1 FROM dbo.market_product_link WHERE ticker = 'BRT-OTC-CARGO')
BEGIN
    SELECT @market_id = market_id FROM dbo.market WHERE market_code = 'ICAP_BRENT_OTC';
    IF @market_id IS NOT NULL
        INSERT INTO dbo.market_product_link (market_id, product_id, ticker, is_active, created_at, created_by, updated_at, updated_by, row_version)
        SELECT @market_id, product_id, 'BRT-OTC-CARGO', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0 FROM dbo.product WHERE product_code = 'BRENT-CRUDE';
END

IF NOT EXISTS (SELECT 1 FROM dbo.price_index WHERE index_code = 'DTBRT')
    INSERT INTO dbo.price_index (index_code, index_name, currency_id, uom_id, publication_source, fixing_time, fixing_timezone, is_active, publication_frequency, created_at, created_by, updated_at, updated_by, row_version)
    VALUES ('DTBRT', 'Dated Brent', 1, 1, 'PLATTS', '16:30', 'Europe/London', 1, 'DAILY', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.price_index WHERE index_code = 'WTI-CUSH')
    INSERT INTO dbo.price_index (index_code, index_name, currency_id, uom_id, publication_source, fixing_time, fixing_timezone, is_active, publication_frequency, created_at, created_by, updated_at, updated_by, row_version)
    VALUES ('WTI-CUSH', 'WTI Cushing Settlement', 1, 1, 'NYMEX_DATA', '14:30', 'America/New_York', 1, 'DAILY', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.price_index_source pis JOIN dbo.price_index pi ON pi.price_index_id = pis.price_index_id WHERE pi.index_code = 'DTBRT' AND pis.price_source_id = 1)
BEGIN
    SELECT @index_id = price_index_id FROM dbo.price_index WHERE index_code = 'DTBRT';
    SELECT @mpl_id = mpl.market_product_link_id FROM dbo.market_product_link mpl WHERE mpl.ticker = 'LCOc1';
    IF @index_id IS NOT NULL AND @mpl_id IS NOT NULL
        INSERT INTO dbo.price_index_source (price_index_id, market_product_link_id, price_source_id, source_role, source_field_code, price_multiplier, price_offset, calculation_sequence, effective_from, is_active, created_at, created_by, updated_at, updated_by, row_version)
        VALUES (@index_id, @mpl_id, 1, 'PRIMARY_MTM', 'PCAAS00', 1, 0, 1, '2020-01-01', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);
END

IF NOT EXISTS (SELECT 1 FROM dbo.price_index_source pis JOIN dbo.price_index pi ON pi.price_index_id = pis.price_index_id WHERE pi.index_code = 'WTI-CUSH' AND pis.price_source_id = 6)
BEGIN
    SELECT @index_id = price_index_id FROM dbo.price_index WHERE index_code = 'WTI-CUSH';
    SELECT @mpl_id = mpl.market_product_link_id FROM dbo.market_product_link mpl WHERE mpl.ticker = 'CLc1';
    IF @index_id IS NOT NULL AND @mpl_id IS NOT NULL
        INSERT INTO dbo.price_index_source (price_index_id, market_product_link_id, price_source_id, source_role, source_field_code, price_multiplier, price_offset, calculation_sequence, effective_from, is_active, created_at, created_by, updated_at, updated_by, row_version)
        VALUES (@index_id, @mpl_id, 6, 'PRIMARY_MTM', 'CL_SETTLE', 1, 0, 1, '2020-01-01', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);
END
GO

-- =============================================================================
-- POWER — EEX German Baseload (OTC) and N2EX-style UK Baseload (OTC).
-- Nothing existed for POWER before this migration.
-- =============================================================================

DECLARE @market_id INT, @mpl_id INT, @index_id INT;

IF NOT EXISTS (SELECT 1 FROM dbo.product WHERE product_code = 'POWER-DE-BASE')
    INSERT INTO dbo.product (commodity_id, product_code, product_name, default_pricing_type_id, default_uom_id, default_currency_id, settlement_type, is_exchange_traded, is_otc, is_blend, is_active, created_at, created_by, updated_at, updated_by, row_version)
    VALUES (2, 'POWER-DE-BASE', 'German Power Baseload', 2, 4, 2, 1, 0, 1, 0, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.product WHERE product_code = 'POWER-UK-BASE')
    INSERT INTO dbo.product (commodity_id, product_code, product_name, default_pricing_type_id, default_uom_id, default_currency_id, settlement_type, is_exchange_traded, is_otc, is_blend, is_active, created_at, created_by, updated_at, updated_by, row_version)
    VALUES (2, 'POWER-UK-BASE', 'UK Power Baseload', 2, 4, 3, 1, 0, 1, 0, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.market WHERE market_code = 'EEX_POWER_PHY')
    INSERT INTO dbo.market (exchange_id, commodity_id, market_code, market_name, market_type, settlement_type, currency_id, timezone, is_active, created_at, created_by, updated_at, updated_by, row_version)
    VALUES (5, 2, 'EEX_POWER_PHY', 'EEX German Power OTC/Physical', 'OTC_BILATERAL', 'PHYSICAL', 2, 'Europe/Berlin', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.market WHERE market_code = 'UK_POWER_PHY')
    INSERT INTO dbo.market (exchange_id, commodity_id, market_code, market_name, market_type, settlement_type, currency_id, timezone, is_active, created_at, created_by, updated_at, updated_by, row_version)
    VALUES (9, 2, 'UK_POWER_PHY', 'UK Power OTC/Physical (Broker)', 'OTC_BILATERAL', 'PHYSICAL', 3, 'Europe/London', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.market_product_link WHERE ticker = 'DEBASE')
BEGIN
    SELECT @market_id = market_id FROM dbo.market WHERE market_code = 'EEX_POWER_PHY';
    IF @market_id IS NOT NULL
        INSERT INTO dbo.market_product_link (market_id, product_id, ticker, is_active, created_at, created_by, updated_at, updated_by, row_version)
        SELECT @market_id, product_id, 'DEBASE', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0 FROM dbo.product WHERE product_code = 'POWER-DE-BASE';
END

IF NOT EXISTS (SELECT 1 FROM dbo.market_product_link WHERE ticker = 'UKBASE')
BEGIN
    SELECT @market_id = market_id FROM dbo.market WHERE market_code = 'UK_POWER_PHY';
    IF @market_id IS NOT NULL
        INSERT INTO dbo.market_product_link (market_id, product_id, ticker, is_active, created_at, created_by, updated_at, updated_by, row_version)
        SELECT @market_id, product_id, 'UKBASE', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0 FROM dbo.product WHERE product_code = 'POWER-UK-BASE';
END

IF NOT EXISTS (SELECT 1 FROM dbo.price_index WHERE index_code = 'EEX-DE-BASE')
    INSERT INTO dbo.price_index (index_code, index_name, currency_id, uom_id, publication_source, fixing_time, fixing_timezone, is_active, publication_frequency, created_at, created_by, updated_at, updated_by, row_version)
    VALUES ('EEX-DE-BASE', 'EEX German Power Baseload', 2, 4, 'EEX_DATA', '18:00', 'Europe/Berlin', 1, 'DAILY', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.price_index WHERE index_code = 'N2EX-UK-BASE')
    INSERT INTO dbo.price_index (index_code, index_name, currency_id, uom_id, publication_source, fixing_time, fixing_timezone, is_active, publication_frequency, created_at, created_by, updated_at, updated_by, row_version)
    VALUES ('N2EX-UK-BASE', 'N2EX UK Power Baseload', 3, 4, 'ICE_DATA', '17:00', 'Europe/London', 1, 'DAILY', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.price_index_source pis JOIN dbo.price_index pi ON pi.price_index_id = pis.price_index_id WHERE pi.index_code = 'EEX-DE-BASE' AND pis.price_source_id = 8)
BEGIN
    SELECT @index_id = price_index_id FROM dbo.price_index WHERE index_code = 'EEX-DE-BASE';
    SELECT @mpl_id = market_product_link_id FROM dbo.market_product_link WHERE ticker = 'DEBASE';
    IF @index_id IS NOT NULL AND @mpl_id IS NOT NULL
        INSERT INTO dbo.price_index_source (price_index_id, market_product_link_id, price_source_id, source_role, source_field_code, price_multiplier, price_offset, calculation_sequence, effective_from, is_active, created_at, created_by, updated_at, updated_by, row_version)
        VALUES (@index_id, @mpl_id, 8, 'PRIMARY_MTM', 'PHELIX_DE_BASE', 1, 0, 1, '2020-01-01', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);
END

IF NOT EXISTS (SELECT 1 FROM dbo.price_index_source pis JOIN dbo.price_index pi ON pi.price_index_id = pis.price_index_id WHERE pi.index_code = 'N2EX-UK-BASE' AND pis.price_source_id = 5)
BEGIN
    SELECT @index_id = price_index_id FROM dbo.price_index WHERE index_code = 'N2EX-UK-BASE';
    SELECT @mpl_id = market_product_link_id FROM dbo.market_product_link WHERE ticker = 'UKBASE';
    IF @index_id IS NOT NULL AND @mpl_id IS NOT NULL
        INSERT INTO dbo.price_index_source (price_index_id, market_product_link_id, price_source_id, source_role, source_field_code, price_multiplier, price_offset, calculation_sequence, effective_from, is_active, created_at, created_by, updated_at, updated_by, row_version)
        VALUES (@index_id, @mpl_id, 5, 'PRIMARY_MTM', 'N2EX_UK_BASE', 1, 0, 1, '2020-01-01', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);
END
GO

-- =============================================================================
-- AGRI — CBOT Corn (links the existing CBOT-CORN product, which had no
-- market/listing at all before this), CBOT Soybean, CBOT Wheat (SRW).
-- =============================================================================

DECLARE @market_id INT, @mpl_id INT, @index_id INT;

IF NOT EXISTS (SELECT 1 FROM dbo.product WHERE product_code = 'SOYBEAN')
    INSERT INTO dbo.product (commodity_id, product_code, product_name, default_pricing_type_id, default_uom_id, default_currency_id, settlement_type, is_exchange_traded, is_otc, is_blend, is_active, created_at, created_by, updated_at, updated_by, row_version)
    VALUES (4, 'SOYBEAN', 'CBOT Soybeans', 2, 10, 1, 1, 1, 0, 0, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.product WHERE product_code = 'WHEAT-SRW')
    INSERT INTO dbo.product (commodity_id, product_code, product_name, default_pricing_type_id, default_uom_id, default_currency_id, settlement_type, is_exchange_traded, is_otc, is_blend, is_active, created_at, created_by, updated_at, updated_by, row_version)
    VALUES (4, 'WHEAT-SRW', 'CBOT Soft Red Winter Wheat', 2, 10, 1, 1, 1, 0, 0, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.market WHERE market_code = 'CBOT_GRAINS')
    INSERT INTO dbo.market (exchange_id, commodity_id, market_code, market_name, market_type, settlement_type, currency_id, timezone, is_active, created_at, created_by, updated_at, updated_by, row_version)
    VALUES (6, 4, 'CBOT_GRAINS', 'CBOT Grains & Oilseeds', 'EXCHANGE', 'PHYSICAL', 1, 'America/Chicago', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.market_product_link WHERE ticker = 'C')
BEGIN
    SELECT @market_id = market_id FROM dbo.market WHERE market_code = 'CBOT_GRAINS';
    IF @market_id IS NOT NULL
        INSERT INTO dbo.market_product_link (market_id, product_id, ticker, is_active, created_at, created_by, updated_at, updated_by, row_version)
        SELECT @market_id, product_id, 'C', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0 FROM dbo.product WHERE product_code = 'CBOT-CORN';
END

IF NOT EXISTS (SELECT 1 FROM dbo.market_product_link WHERE ticker = 'S')
BEGIN
    SELECT @market_id = market_id FROM dbo.market WHERE market_code = 'CBOT_GRAINS';
    IF @market_id IS NOT NULL
        INSERT INTO dbo.market_product_link (market_id, product_id, ticker, is_active, created_at, created_by, updated_at, updated_by, row_version)
        SELECT @market_id, product_id, 'S', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0 FROM dbo.product WHERE product_code = 'SOYBEAN';
END

IF NOT EXISTS (SELECT 1 FROM dbo.market_product_link WHERE ticker = 'W')
BEGIN
    SELECT @market_id = market_id FROM dbo.market WHERE market_code = 'CBOT_GRAINS';
    IF @market_id IS NOT NULL
        INSERT INTO dbo.market_product_link (market_id, product_id, ticker, is_active, created_at, created_by, updated_at, updated_by, row_version)
        SELECT @market_id, product_id, 'W', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0 FROM dbo.product WHERE product_code = 'WHEAT-SRW';
END

IF NOT EXISTS (SELECT 1 FROM dbo.price_index WHERE index_code = 'CBOT-CORN-IDX')
    INSERT INTO dbo.price_index (index_code, index_name, currency_id, uom_id, publication_source, fixing_time, fixing_timezone, is_active, publication_frequency, created_at, created_by, updated_at, updated_by, row_version)
    VALUES ('CBOT-CORN-IDX', 'CBOT Corn Front Month', 1, 10, 'NYMEX_DATA', '13:20', 'America/Chicago', 1, 'DAILY', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.price_index WHERE index_code = 'CBOT-SOYBEAN-IDX')
    INSERT INTO dbo.price_index (index_code, index_name, currency_id, uom_id, publication_source, fixing_time, fixing_timezone, is_active, publication_frequency, created_at, created_by, updated_at, updated_by, row_version)
    VALUES ('CBOT-SOYBEAN-IDX', 'CBOT Soybean Front Month', 1, 10, 'NYMEX_DATA', '13:20', 'America/Chicago', 1, 'DAILY', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.price_index WHERE index_code = 'CBOT-WHEAT-IDX')
    INSERT INTO dbo.price_index (index_code, index_name, currency_id, uom_id, publication_source, fixing_time, fixing_timezone, is_active, publication_frequency, created_at, created_by, updated_at, updated_by, row_version)
    VALUES ('CBOT-WHEAT-IDX', 'CBOT SRW Wheat Front Month', 1, 10, 'NYMEX_DATA', '13:20', 'America/Chicago', 1, 'DAILY', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.price_index_source pis JOIN dbo.price_index pi ON pi.price_index_id = pis.price_index_id WHERE pi.index_code = 'CBOT-CORN-IDX' AND pis.price_source_id = 6)
BEGIN
    SELECT @index_id = price_index_id FROM dbo.price_index WHERE index_code = 'CBOT-CORN-IDX';
    SELECT @mpl_id = market_product_link_id FROM dbo.market_product_link WHERE ticker = 'C';
    IF @index_id IS NOT NULL AND @mpl_id IS NOT NULL
        INSERT INTO dbo.price_index_source (price_index_id, market_product_link_id, price_source_id, source_role, source_field_code, price_multiplier, price_offset, calculation_sequence, effective_from, is_active, created_at, created_by, updated_at, updated_by, row_version)
        VALUES (@index_id, @mpl_id, 6, 'PRIMARY_MTM', 'ZC_SETTLE', 1, 0, 1, '2020-01-01', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);
END

IF NOT EXISTS (SELECT 1 FROM dbo.price_index_source pis JOIN dbo.price_index pi ON pi.price_index_id = pis.price_index_id WHERE pi.index_code = 'CBOT-SOYBEAN-IDX' AND pis.price_source_id = 6)
BEGIN
    SELECT @index_id = price_index_id FROM dbo.price_index WHERE index_code = 'CBOT-SOYBEAN-IDX';
    SELECT @mpl_id = market_product_link_id FROM dbo.market_product_link WHERE ticker = 'S';
    IF @index_id IS NOT NULL AND @mpl_id IS NOT NULL
        INSERT INTO dbo.price_index_source (price_index_id, market_product_link_id, price_source_id, source_role, source_field_code, price_multiplier, price_offset, calculation_sequence, effective_from, is_active, created_at, created_by, updated_at, updated_by, row_version)
        VALUES (@index_id, @mpl_id, 6, 'PRIMARY_MTM', 'ZS_SETTLE', 1, 0, 1, '2020-01-01', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);
END

IF NOT EXISTS (SELECT 1 FROM dbo.price_index_source pis JOIN dbo.price_index pi ON pi.price_index_id = pis.price_index_id WHERE pi.index_code = 'CBOT-WHEAT-IDX' AND pis.price_source_id = 6)
BEGIN
    SELECT @index_id = price_index_id FROM dbo.price_index WHERE index_code = 'CBOT-WHEAT-IDX';
    SELECT @mpl_id = market_product_link_id FROM dbo.market_product_link WHERE ticker = 'W';
    IF @index_id IS NOT NULL AND @mpl_id IS NOT NULL
        INSERT INTO dbo.price_index_source (price_index_id, market_product_link_id, price_source_id, source_role, source_field_code, price_multiplier, price_offset, calculation_sequence, effective_from, is_active, created_at, created_by, updated_at, updated_by, row_version)
        VALUES (@index_id, @mpl_id, 6, 'PRIMARY_MTM', 'ZW_SETTLE', 1, 0, 1, '2020-01-01', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);
END
GO

-- =============================================================================
-- METALS — LME Copper (links the existing LME-COPPER product, which had no
-- market/listing at all before this), LME Aluminium, LBMA Gold (physical).
-- =============================================================================

DECLARE @market_id INT, @mpl_id INT, @index_id INT;

IF NOT EXISTS (SELECT 1 FROM dbo.product WHERE product_code = 'ALUMINIUM')
    INSERT INTO dbo.product (commodity_id, product_code, product_name, default_pricing_type_id, default_uom_id, default_currency_id, settlement_type, grade_code, is_exchange_traded, is_otc, is_blend, is_active, created_at, created_by, updated_at, updated_by, row_version)
    VALUES (5, 'ALUMINIUM', 'LME Primary Aluminium', 2, 3, 1, 1, 'P1020', 1, 1, 0, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.product WHERE product_code = 'GOLD')
    INSERT INTO dbo.product (commodity_id, product_code, product_name, default_pricing_type_id, default_uom_id, default_currency_id, settlement_type, grade_code, is_exchange_traded, is_otc, is_blend, is_active, created_at, created_by, updated_at, updated_by, row_version)
    VALUES (5, 'GOLD', 'LBMA Gold (London Good Delivery)', 2, 14, 1, 1, 'LGD', 0, 1, 0, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.market WHERE market_code = 'LME_METALS')
    INSERT INTO dbo.market (exchange_id, commodity_id, market_code, market_name, market_type, settlement_type, currency_id, timezone, is_active, created_at, created_by, updated_at, updated_by, row_version)
    VALUES (4, 5, 'LME_METALS', 'London Metal Exchange', 'EXCHANGE', 'PHYSICAL', 1, 'Europe/London', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.market WHERE market_code = 'LBMA_PHYSICAL')
    INSERT INTO dbo.market (exchange_id, commodity_id, market_code, market_name, market_type, settlement_type, currency_id, timezone, is_active, created_at, created_by, updated_at, updated_by, row_version)
    VALUES (NULL, 5, 'LBMA_PHYSICAL', 'LBMA Gold Physical (OTC)', 'OTC_BILATERAL', 'PHYSICAL', 1, 'Europe/London', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.market_product_link WHERE ticker = 'CA')
BEGIN
    SELECT @market_id = market_id FROM dbo.market WHERE market_code = 'LME_METALS';
    IF @market_id IS NOT NULL
        INSERT INTO dbo.market_product_link (market_id, product_id, ticker, is_active, created_at, created_by, updated_at, updated_by, row_version)
        SELECT @market_id, product_id, 'CA', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0 FROM dbo.product WHERE product_code = 'LME-COPPER';
END

IF NOT EXISTS (SELECT 1 FROM dbo.market_product_link WHERE ticker = 'AH')
BEGIN
    SELECT @market_id = market_id FROM dbo.market WHERE market_code = 'LME_METALS';
    IF @market_id IS NOT NULL
        INSERT INTO dbo.market_product_link (market_id, product_id, ticker, is_active, created_at, created_by, updated_at, updated_by, row_version)
        SELECT @market_id, product_id, 'AH', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0 FROM dbo.product WHERE product_code = 'ALUMINIUM';
END

IF NOT EXISTS (SELECT 1 FROM dbo.market_product_link WHERE ticker = 'XAU')
BEGIN
    SELECT @market_id = market_id FROM dbo.market WHERE market_code = 'LBMA_PHYSICAL';
    IF @market_id IS NOT NULL
        INSERT INTO dbo.market_product_link (market_id, product_id, ticker, is_active, created_at, created_by, updated_at, updated_by, row_version)
        SELECT @market_id, product_id, 'XAU', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0 FROM dbo.product WHERE product_code = 'GOLD';
END

IF NOT EXISTS (SELECT 1 FROM dbo.price_index WHERE index_code = 'LME-CU-CASH')
    INSERT INTO dbo.price_index (index_code, index_name, currency_id, uom_id, publication_source, fixing_time, fixing_timezone, is_active, publication_frequency, created_at, created_by, updated_at, updated_by, row_version)
    VALUES ('LME-CU-CASH', 'LME Copper Cash Official', 1, 3, 'LME_DATA', '13:00', 'Europe/London', 1, 'DAILY', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.price_index WHERE index_code = 'LME-AL-CASH')
    INSERT INTO dbo.price_index (index_code, index_name, currency_id, uom_id, publication_source, fixing_time, fixing_timezone, is_active, publication_frequency, created_at, created_by, updated_at, updated_by, row_version)
    VALUES ('LME-AL-CASH', 'LME Aluminium Cash Official', 1, 3, 'LME_DATA', '13:00', 'Europe/London', 1, 'DAILY', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.price_index WHERE index_code = 'LBMA-GOLD-AM')
    INSERT INTO dbo.price_index (index_code, index_name, currency_id, uom_id, publication_source, fixing_time, fixing_timezone, is_active, publication_frequency, created_at, created_by, updated_at, updated_by, row_version)
    VALUES ('LBMA-GOLD-AM', 'LBMA Gold Price AM', 1, 14, 'ICE_DATA', '10:30', 'Europe/London', 1, 'DAILY', SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);

IF NOT EXISTS (SELECT 1 FROM dbo.price_index_source pis JOIN dbo.price_index pi ON pi.price_index_id = pis.price_index_id WHERE pi.index_code = 'LME-CU-CASH' AND pis.price_source_id = 7)
BEGIN
    SELECT @index_id = price_index_id FROM dbo.price_index WHERE index_code = 'LME-CU-CASH';
    SELECT @mpl_id = market_product_link_id FROM dbo.market_product_link WHERE ticker = 'CA';
    IF @index_id IS NOT NULL AND @mpl_id IS NOT NULL
        INSERT INTO dbo.price_index_source (price_index_id, market_product_link_id, price_source_id, source_role, source_field_code, price_multiplier, price_offset, calculation_sequence, effective_from, is_active, created_at, created_by, updated_at, updated_by, row_version)
        VALUES (@index_id, @mpl_id, 7, 'PRIMARY_MTM', 'CU_OFFICIAL', 1, 0, 1, '2020-01-01', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);
END

IF NOT EXISTS (SELECT 1 FROM dbo.price_index_source pis JOIN dbo.price_index pi ON pi.price_index_id = pis.price_index_id WHERE pi.index_code = 'LME-AL-CASH' AND pis.price_source_id = 7)
BEGIN
    SELECT @index_id = price_index_id FROM dbo.price_index WHERE index_code = 'LME-AL-CASH';
    SELECT @mpl_id = market_product_link_id FROM dbo.market_product_link WHERE ticker = 'AH';
    IF @index_id IS NOT NULL AND @mpl_id IS NOT NULL
        INSERT INTO dbo.price_index_source (price_index_id, market_product_link_id, price_source_id, source_role, source_field_code, price_multiplier, price_offset, calculation_sequence, effective_from, is_active, created_at, created_by, updated_at, updated_by, row_version)
        VALUES (@index_id, @mpl_id, 7, 'PRIMARY_MTM', 'AL_OFFICIAL', 1, 0, 1, '2020-01-01', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);
END

IF NOT EXISTS (SELECT 1 FROM dbo.price_index_source pis JOIN dbo.price_index pi ON pi.price_index_id = pis.price_index_id WHERE pi.index_code = 'LBMA-GOLD-AM' AND pis.price_source_id = 5)
BEGIN
    SELECT @index_id = price_index_id FROM dbo.price_index WHERE index_code = 'LBMA-GOLD-AM';
    SELECT @mpl_id = market_product_link_id FROM dbo.market_product_link WHERE ticker = 'XAU';
    IF @index_id IS NOT NULL AND @mpl_id IS NOT NULL
        INSERT INTO dbo.price_index_source (price_index_id, market_product_link_id, price_source_id, source_role, source_field_code, price_multiplier, price_offset, calculation_sequence, effective_from, is_active, created_at, created_by, updated_at, updated_by, row_version)
        VALUES (@index_id, @mpl_id, 5, 'PRIMARY_MTM', 'LBMA_GOLD_AM', 1, 0, 1, '2020-01-01', 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 0);
END
GO

-- =============================================================================
-- PERIODS — one near-term MONTH period per new/newly-linked listing across
-- all 4 commodity classes, set-based (all listings share the Sep-2026
-- period, which is all that's needed to prove pricing end-to-end; use
-- Period auto-generate, built earlier this session, to roll these forward
-- from here — that's exactly what it's for).
-- =============================================================================

INSERT INTO dbo.period (market_product_link_id, period_code, period_name, period_type, period_start, period_end, delivery_start_date, delivery_end_date, curve_label, status_code, is_trading_period, is_risk_period, is_settlement_period, is_active, created_at, created_by, updated_at, updated_by, row_version)
SELECT mpl.market_product_link_id, 'M2026-09', 'September 2026', 'MONTH', '2026-09-01', '2026-09-30', '2026-09-01', '2026-09-30', 'M2026-09', 'OPEN', 1, 1, 0, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM', 1
FROM dbo.market_product_link mpl
WHERE mpl.ticker IN ('LCOc1', 'CLc1', 'BRT-OTC-CARGO', 'DEBASE', 'UKBASE', 'C', 'S', 'W', 'CA', 'AH', 'XAU')
  AND NOT EXISTS (SELECT 1 FROM dbo.period p WHERE p.market_product_link_id = mpl.market_product_link_id AND p.period_code = 'M2026-09');
GO

-- =============================================================================
-- TICKER MAPPINGS — one settle_ticker per new price_index+source pair, set-
-- based via a driving VALUES table. Continuous/cash reference indices
-- (Platts Dated Brent, LME cash officials, LBMA Gold AM) deliberately use a
-- NULL period_id — they're not tied to one fixed contract month; the
-- tenor-coded futures/forward indices (WTI, power baseload, grains) use the
-- Sep-2026 period just created, so the ticker auto-generate feature (built
-- earlier this session) has a real anchor to roll forward from.
-- =============================================================================

;WITH tm_seed AS (
    SELECT * FROM (VALUES
        ('DTBRT',            'LCOc1',        1, 'PCAAS00',   0),
        ('WTI-CUSH',         'CLc1',         6, 'CLU26',     1),
        ('EEX-DE-BASE',      'DEBASE',       8, 'DEBASEU26', 1),
        ('N2EX-UK-BASE',     'UKBASE',       5, 'UKBASEU26', 1),
        ('CBOT-CORN-IDX',    'C',            6, 'CU26',      1),
        ('CBOT-SOYBEAN-IDX', 'S',            6, 'SU26',      1),
        ('CBOT-WHEAT-IDX',   'W',            6, 'WU26',      1),
        ('LME-CU-CASH',      'CA',           7, 'LMCADS03',  0),
        ('LME-AL-CASH',      'AH',           7, 'LMAHDS03',  0),
        ('LBMA-GOLD-AM',     'XAU',          5, 'GOLDLNPM',  0)
    ) AS v (index_code, mpl_ticker, price_source_id, settle_ticker, use_period)
)
INSERT INTO dbo.ticker_mapping (price_index_id, period_id, price_source_id, settle_ticker, effective_from, is_active, row_version, created_at, created_by, updated_at, updated_by)
SELECT pi.price_index_id,
       CASE WHEN s.use_period = 1 THEN per.period_id ELSE NULL END,
       s.price_source_id, s.settle_ticker, '2026-01-01', 1, 1, SYSUTCDATETIME(), 'SYSTEM', SYSUTCDATETIME(), 'SYSTEM'
FROM tm_seed s
JOIN dbo.price_index pi ON pi.index_code = s.index_code
JOIN dbo.market_product_link mpl ON mpl.ticker = s.mpl_ticker
LEFT JOIN dbo.period per ON per.market_product_link_id = mpl.market_product_link_id AND per.period_code = 'M2026-09'
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.ticker_mapping tm2
    WHERE tm2.price_index_id = pi.price_index_id AND tm2.price_source_id = s.price_source_id
      AND ((s.use_period = 1 AND tm2.period_id = per.period_id) OR (s.use_period = 0 AND tm2.period_id IS NULL))
);
GO
