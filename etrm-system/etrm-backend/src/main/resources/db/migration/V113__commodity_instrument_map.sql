-- =============================================================================
-- V113 — commodity_instrument_map
--
-- Backs GET /api/v1/commodity-instrument-map, used by the Trade Blotter
-- (TradeBlotter.tsx) to restrict which instrument types are selectable for
-- a given commodity. This endpoint existed only as an MSW mock
-- (etrmHandlers.ts) with no real backend — against the real backend (this
-- dev environment's default) the call 404'd, so the Trade Blotter's
-- commodity/instrument-type restriction silently did nothing live.
--
-- Read-only from the API's perspective (GET only, matching the mock's own
-- "read-only; only changed via DB migration" comment) — no create/update/
-- delete endpoint, so no Tier2 registry entry either.
-- =============================================================================

IF OBJECT_ID('dbo.commodity_instrument_map', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.commodity_instrument_map (
        map_id             INT          NOT NULL IDENTITY(1,1),
        commodity_type_id  INT          NOT NULL,
        instrument_type    VARCHAR(30)  NOT NULL,
        sort_order         SMALLINT     NOT NULL DEFAULT 0,
        is_active          BIT          NOT NULL DEFAULT 1,

        CONSTRAINT pk_cim               PRIMARY KEY (map_id),
        CONSTRAINT uq_cim_type_instr     UNIQUE      (commodity_type_id, instrument_type),
        CONSTRAINT fk_cim_commodity_type FOREIGN KEY (commodity_type_id) REFERENCES dbo.commodity_type(commodity_type_id),
        CONSTRAINT chk_cim_instrument CHECK (instrument_type IN (
            'PHYSICAL', 'CERTIFICATE_TRANSFER', 'FUTURES', 'FORWARD',
            'SWAP_FIXED_FLOAT', 'SWAP_FLOAT_FLOAT',
            'OPTION_LISTED', 'OPTION_OTC_AMERICAN', 'OPTION_OTC_ASIAN', 'OPTION_OTC_EUROPEAN',
            'STORAGE_AGREEMENT', 'TRANSPORT_AGREEMENT'
        ))
    );
END
GO

-- Seed — mirrors the MSW mock's data exactly (etrmHandlers.ts). Commodity
-- types with no rows here (MULTI, OTHER) allow every instrument type — the
-- frontend already falls back to the full INSTRUMENT_TYPES list when a
-- commodity has no entry in the map.
IF NOT EXISTS (SELECT 1 FROM dbo.commodity_instrument_map)
BEGIN
    INSERT INTO dbo.commodity_instrument_map (commodity_type_id, instrument_type, sort_order)
    SELECT ct.commodity_type_id, v.instrument_type, v.sort_order
    FROM dbo.commodity_type ct
    CROSS APPLY (VALUES
        ('OIL',          'PHYSICAL',             10), ('OIL',          'FUTURES',              20), ('OIL',          'FORWARD',              30),
        ('OIL',          'SWAP_FIXED_FLOAT',      40), ('OIL',          'SWAP_FLOAT_FLOAT',     50), ('OIL',          'OPTION_LISTED',        60),
        ('OIL',          'OPTION_OTC_AMERICAN',   70), ('OIL',          'OPTION_OTC_ASIAN',     80), ('OIL',          'OPTION_OTC_EUROPEAN',  90),
        ('OIL',          'STORAGE_AGREEMENT',    100), ('OIL',          'TRANSPORT_AGREEMENT', 110),

        ('GAS',          'PHYSICAL',              10), ('GAS',          'FUTURES',              20), ('GAS',          'FORWARD',              30),
        ('GAS',          'SWAP_FIXED_FLOAT',      40), ('GAS',          'SWAP_FLOAT_FLOAT',     50), ('GAS',          'OPTION_LISTED',        60),
        ('GAS',          'OPTION_OTC_AMERICAN',   70), ('GAS',          'OPTION_OTC_ASIAN',     80), ('GAS',          'OPTION_OTC_EUROPEAN',  90),
        ('GAS',          'STORAGE_AGREEMENT',    100), ('GAS',          'TRANSPORT_AGREEMENT', 110),

        ('POWER',        'PHYSICAL',              10), ('POWER',        'FUTURES',              20), ('POWER',        'FORWARD',              30),
        ('POWER',        'SWAP_FIXED_FLOAT',      40), ('POWER',        'SWAP_FLOAT_FLOAT',     50), ('POWER',        'OPTION_LISTED',        60),
        ('POWER',        'OPTION_OTC_AMERICAN',   70), ('POWER',        'OPTION_OTC_EUROPEAN',  80), ('POWER',        'STORAGE_AGREEMENT',    90),

        ('LNG',          'PHYSICAL',              10), ('LNG',          'FUTURES',              20), ('LNG',          'FORWARD',              30),
        ('LNG',          'SWAP_FIXED_FLOAT',      40), ('LNG',          'SWAP_FLOAT_FLOAT',     50), ('LNG',          'OPTION_LISTED',        60),
        ('LNG',          'OPTION_OTC_AMERICAN',   70), ('LNG',          'OPTION_OTC_ASIAN',     80), ('LNG',          'OPTION_OTC_EUROPEAN',  90),
        ('LNG',          'STORAGE_AGREEMENT',    100), ('LNG',          'TRANSPORT_AGREEMENT', 110),

        ('AGRICULTURAL', 'PHYSICAL',              10), ('AGRICULTURAL', 'FUTURES',              20), ('AGRICULTURAL', 'FORWARD',              30),
        ('AGRICULTURAL', 'SWAP_FIXED_FLOAT',      40), ('AGRICULTURAL', 'OPTION_LISTED',        50), ('AGRICULTURAL', 'OPTION_OTC_AMERICAN',  60),
        ('AGRICULTURAL', 'OPTION_OTC_EUROPEAN',   70), ('AGRICULTURAL', 'STORAGE_AGREEMENT',    80), ('AGRICULTURAL', 'TRANSPORT_AGREEMENT',  90),

        ('METALS',       'PHYSICAL',              10), ('METALS',       'FUTURES',              20), ('METALS',       'FORWARD',              30),
        ('METALS',       'SWAP_FIXED_FLOAT',      40), ('METALS',       'SWAP_FLOAT_FLOAT',     50), ('METALS',       'OPTION_LISTED',        60),
        ('METALS',       'OPTION_OTC_AMERICAN',   70), ('METALS',       'OPTION_OTC_ASIAN',     80), ('METALS',       'OPTION_OTC_EUROPEAN',  90),
        ('METALS',       'STORAGE_AGREEMENT',    100), ('METALS',       'TRANSPORT_AGREEMENT', 110),

        ('FREIGHT',      'PHYSICAL',              10), ('FREIGHT',      'FORWARD',              20), ('FREIGHT',      'SWAP_FIXED_FLOAT',      30),
        ('FREIGHT',      'TRANSPORT_AGREEMENT',   40), ('FREIGHT',      'OPTION_OTC_EUROPEAN',  50),

        ('RINS',         'CERTIFICATE_TRANSFER',  10), ('RINS',         'FUTURES',              20), ('RINS',         'FORWARD',              30),
        ('RINS',         'OPTION_LISTED',         40), ('RINS',         'OPTION_OTC_EUROPEAN',  50),

        ('ENVIRONMENTAL','CERTIFICATE_TRANSFER',  10), ('ENVIRONMENTAL','FUTURES',              20), ('ENVIRONMENTAL','FORWARD',              30),
        ('ENVIRONMENTAL','OPTION_LISTED',         40), ('ENVIRONMENTAL','OPTION_OTC_EUROPEAN',  50)
    ) AS v(type_code, instrument_type, sort_order)
    WHERE ct.type_code = v.type_code;
END
GO
