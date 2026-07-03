-- V44: Instrument types, deal detail tables, MOT/agreement type lookup extensions
-- Adds instrument_type to dbo.trade and four optional detail tables for swaps,
-- options, storage agreements, and transport agreements.

-- ============================================================
-- 1. Add instrument_type column to dbo.trade
-- ============================================================
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.trade') AND name = 'instrument_type'
)
BEGIN
  ALTER TABLE dbo.trade
    ADD instrument_type VARCHAR(30) NULL
    CONSTRAINT ck_trade_instrument_type CHECK (instrument_type IN (
      'PHYSICAL', 'CERTIFICATE_TRANSFER', 'FUTURES', 'FORWARD',
      'SWAP_FIXED_FLOAT', 'SWAP_FLOAT_FLOAT',
      'OPTION_LISTED', 'OPTION_OTC_AMERICAN', 'OPTION_OTC_ASIAN', 'OPTION_OTC_EUROPEAN',
      'STORAGE_AGREEMENT', 'TRANSPORT_AGREEMENT'
    ));
END;
GO

-- ============================================================
-- 2. Extend mot_type CHECK constraint to include CERTIFICATE
--    (RINs and environmental certificates have no physical transport)
-- ============================================================
IF EXISTS (
  SELECT 1 FROM sys.check_constraints
  WHERE name = 'ck_trade_order_mot_type'
)
BEGIN
  ALTER TABLE dbo.trade_order DROP CONSTRAINT ck_trade_order_mot_type;
END;
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.trade_order') AND name = 'mot_type')
BEGIN
  ALTER TABLE dbo.trade_order
    ADD CONSTRAINT ck_trade_order_mot_type CHECK (mot_type IN (
      'TANKER', 'PIPELINE', 'BARGE', 'TRUCK', 'RAIL', 'ISO_TANK', 'SHIP', 'CERTIFICATE'
    ));
END;
GO

-- ============================================================
-- 3. Lookup table extensions
-- ============================================================

-- instrument_type lookup (for UI dropdowns / reference data)
IF NOT EXISTS (SELECT 1 FROM dbo.lookup_value WHERE category = 'instrument_type')
BEGIN
  INSERT INTO dbo.lookup_value (category, code, display_name, sort_order, is_active)
  VALUES
    ('instrument_type', 'PHYSICAL',              'Physical Delivery',              1,  1),
    ('instrument_type', 'CERTIFICATE_TRANSFER',  'Certificate Transfer (Spot)',   2,  1),
    ('instrument_type', 'FORWARD',               'Forward (OTC)',                 3,  1),
    ('instrument_type', 'FUTURES',               'Futures (Exchange)',            4,  1),
    ('instrument_type', 'SWAP_FIXED_FLOAT',      'Swap — Fixed / Float',          5,  1),
    ('instrument_type', 'SWAP_FLOAT_FLOAT',      'Swap — Float / Float (Basis)',  6,  1),
    ('instrument_type', 'OPTION_LISTED',         'Option — Listed (Exchange)',    7,  1),
    ('instrument_type', 'OPTION_OTC_AMERICAN',   'Option — OTC American',         8,  1),
    ('instrument_type', 'OPTION_OTC_ASIAN',      'Option — OTC Asian (APO)',      9,  1),
    ('instrument_type', 'OPTION_OTC_EUROPEAN',   'Option — OTC European',        10,  1),
    ('instrument_type', 'STORAGE_AGREEMENT',     'Storage Agreement',            11,  1),
    ('instrument_type', 'TRANSPORT_AGREEMENT',   'Transport Agreement',          12,  1);
END;
GO

-- storage_agreement_type lookup
IF NOT EXISTS (SELECT 1 FROM dbo.lookup_value WHERE category = 'storage_agreement_type')
BEGIN
  INSERT INTO dbo.lookup_value (category, code, display_name, sort_order, is_active)
  VALUES
    ('storage_agreement_type', 'TANK_LEASE',       'Tank Lease',                1, 1),
    ('storage_agreement_type', 'THROUGHPUT',        'Throughput Agreement',      2, 1),
    ('storage_agreement_type', 'TERMINALLING',      'Terminalling Agreement',    3, 1),
    ('storage_agreement_type', 'WORKING_GAS',       'Working Gas Storage',       4, 1),
    ('storage_agreement_type', 'CUSHION_GAS',       'Cushion Gas',               5, 1),
    ('storage_agreement_type', 'LNG_SLOT',          'LNG Tank Slot',             6, 1),
    ('storage_agreement_type', 'REGASIFICATION',    'Regasification Slot',       7, 1);
END;
GO

-- transport_agreement_type lookup
IF NOT EXISTS (SELECT 1 FROM dbo.lookup_value WHERE category = 'transport_agreement_type')
BEGIN
  INSERT INTO dbo.lookup_value (category, code, display_name, sort_order, is_active)
  VALUES
    ('transport_agreement_type', 'VOYAGE_CHARTER',        'Voyage Charter',           1, 1),
    ('transport_agreement_type', 'TIME_CHARTER',          'Time Charter',             2, 1),
    ('transport_agreement_type', 'BAREBOAT_CHARTER',      'Bareboat Charter',         3, 1),
    ('transport_agreement_type', 'COA',                   'Contract of Affreightment',4, 1),
    ('transport_agreement_type', 'PIPELINE_FIRM',         'Pipeline Firm Capacity',   5, 1),
    ('transport_agreement_type', 'PIPELINE_INTERRUPTIBLE','Pipeline Interruptible',   6, 1),
    ('transport_agreement_type', 'TRUCK_SPOT',            'Truck Spot',               7, 1),
    ('transport_agreement_type', 'RAIL_SPOT',             'Rail Spot',                8, 1),
    ('transport_agreement_type', 'BARGE_SPOT',            'Barge Spot',               9, 1),
    ('transport_agreement_type', 'LNG_SLOT_CHARTER',      'LNG Slot Charter',        10, 1);
END;
GO

-- ============================================================
-- 4. Swap detail table — mirrors TS SwapDetail (one row per leg)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'trade_swap_detail')
BEGIN
  CREATE TABLE dbo.trade_swap_detail (
    swap_detail_id        INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    order_id              INT            NOT NULL,        -- detail lives on the leg (TradeOrder)
    fixed_rate            DECIMAL(18,6)  NULL,            -- fixed leg rate (SWAP_FIXED_FLOAT)
    fixed_currency_code   CHAR(3)        NULL,
    fixed_uom_code        VARCHAR(10)    NULL,
    floating_index_code   NVARCHAR(100)  NULL,            -- primary floating leg price index
    floating_index2_code  NVARCHAR(100)  NULL,            -- second floating leg (SWAP_FLOAT_FLOAT only)
    reset_frequency       VARCHAR(20)    NULL
      CONSTRAINT ck_swap_reset_freq CHECK (reset_frequency IS NULL OR reset_frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL')),
    payment_frequency     VARCHAR(20)    NULL
      CONSTRAINT ck_swap_pay_freq CHECK (payment_frequency IS NULL OR payment_frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL')),
    notional_quantity     DECIMAL(18,6)  NULL,
    notional_uom_code     VARCHAR(10)    NULL,
    averaging_method      VARCHAR(15)    NULL
      CONSTRAINT ck_swap_avg_method CHECK (averaging_method IS NULL OR averaging_method IN ('ARITHMETIC', 'WEIGHTED')),
    created_at            DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at            DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_swap_detail_order FOREIGN KEY (order_id) REFERENCES dbo.trade_order(order_id) ON DELETE CASCADE
  );
  CREATE INDEX ix_swap_detail_order ON dbo.trade_swap_detail (order_id);
END;
GO

-- ============================================================
-- 5. Option detail table — mirrors TS OptionDetail (one row per leg)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'trade_option_detail')
BEGIN
  CREATE TABLE dbo.trade_option_detail (
    option_detail_id         INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    order_id                 INT            NOT NULL,
    put_call                 CHAR(4)        NULL
      CONSTRAINT ck_option_put_call CHECK (put_call IS NULL OR put_call IN ('PUT', 'CALL')),
    strike_price             DECIMAL(18,6)  NULL,
    strike_currency_code     CHAR(3)        NULL,
    strike_uom_code          VARCHAR(10)    NULL,
    expiry_date              DATE           NULL,
    exercise_date            DATE           NULL,          -- last exercise date (= expiry for European)
    premium_amount           DECIMAL(18,6)  NULL,
    premium_currency_code    CHAR(3)        NULL,
    premium_pay_date         DATE           NULL,
    underlying_product_code  VARCHAR(50)    NULL,
    underlying_contract_code VARCHAR(50)    NULL,          -- e.g. CLZ26 for listed options
    lot_size                 DECIMAL(18,6)  NULL,
    number_of_lots           INT            NULL,
    is_exercised             BIT            NOT NULL DEFAULT 0,
    exercised_price          DECIMAL(18,6)  NULL,
    created_at               DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at               DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_option_detail_order FOREIGN KEY (order_id) REFERENCES dbo.trade_order(order_id) ON DELETE CASCADE
  );
  CREATE INDEX ix_option_detail_order ON dbo.trade_option_detail (order_id);
END;
GO

-- ============================================================
-- 6. Storage agreement detail table — mirrors TS StorageAgreementDetail
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'trade_storage_agreement_detail')
BEGIN
  CREATE TABLE dbo.trade_storage_agreement_detail (
    storage_agreement_detail_id  INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    order_id                     INT           NOT NULL,
    storage_agreement_type       VARCHAR(30)   NULL
      CONSTRAINT ck_storage_agr_type CHECK (storage_agreement_type IS NULL OR storage_agreement_type IN (
        'TANK_LEASE', 'THROUGHPUT', 'TERMINALLING', 'WORKING_GAS',
        'CUSHION_GAS', 'LNG_SLOT', 'REGASIFICATION'
      )),
    storage_facility_code        VARCHAR(30)   NULL,       -- code ref to dbo.storage_facility.facility_code
    storage_country_code         CHAR(2)       NULL,
    capacity_reserved            DECIMAL(18,6) NULL,
    capacity_uom_code            VARCHAR(10)   NULL,
    injection_rate_per_day       DECIMAL(18,6) NULL,
    withdrawal_rate_per_day      DECIMAL(18,6) NULL,
    storage_start_date           DATE          NULL,
    storage_end_date             DATE          NULL,
    tariff_rate                  DECIMAL(18,6) NULL,
    tariff_currency_code         CHAR(3)       NULL,
    tariff_uom_code              VARCHAR(10)   NULL,       -- per BBL, per MT, per MWH, or FLAT_MONTHLY
    minimum_throughput           DECIMAL(18,6) NULL,       -- take-or-pay floor
    created_at                   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at                   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_storage_agr_order FOREIGN KEY (order_id) REFERENCES dbo.trade_order(order_id) ON DELETE CASCADE
  );
  CREATE INDEX ix_storage_agr_order ON dbo.trade_storage_agreement_detail (order_id);
END;
GO

-- ============================================================
-- 7. Transport agreement detail table — mirrors TS TransportAgreementDetail
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'trade_transport_agreement_detail')
BEGIN
  CREATE TABLE dbo.trade_transport_agreement_detail (
    transport_agreement_detail_id INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    order_id                      INT           NOT NULL,
    transport_agreement_type      VARCHAR(30)   NULL
      CONSTRAINT ck_transport_agr_type CHECK (transport_agreement_type IS NULL OR transport_agreement_type IN (
        'VOYAGE_CHARTER', 'TIME_CHARTER', 'BAREBOAT_CHARTER', 'COA',
        'PIPELINE_FIRM', 'PIPELINE_INTERRUPTIBLE',
        'TRUCK_SPOT', 'RAIL_SPOT', 'BARGE_SPOT', 'LNG_SLOT_CHARTER'
      )),
    carrier_name                  NVARCHAR(200) NULL,      -- shipping company, TSO, haulier
    vessel_name                   NVARCHAR(200) NULL,
    vessel_imo_number             VARCHAR(20)   NULL,
    pipeline_code                 VARCHAR(30)   NULL,      -- code ref to dbo.pipeline
    load_location_code            VARCHAR(50)   NULL,
    discharge_location_code       VARCHAR(50)   NULL,
    route_code                    VARCHAR(20)   NULL,      -- TD3C, TC2, C3 worldscale routes
    capacity_per_lift             DECIMAL(18,6) NULL,
    capacity_uom_code             VARCHAR(10)   NULL,
    laycan_start                  DATE          NULL,
    laycan_end                    DATE          NULL,
    agreement_start_date          DATE          NULL,
    agreement_end_date            DATE          NULL,
    number_of_lifts               INT           NULL,      -- total contracted voyages for COA
    freight_rate                  DECIMAL(18,6) NULL,
    freight_rate_type             VARCHAR(20)   NULL,      -- WORLDSCALE, LUMPSUM, PER_MT, PER_DAY
    freight_currency_code         CHAR(3)       NULL,
    created_at                    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at                    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_transport_agr_order FOREIGN KEY (order_id) REFERENCES dbo.trade_order(order_id) ON DELETE CASCADE
  );
  CREATE INDEX ix_transport_agr_order ON dbo.trade_transport_agreement_detail (order_id);
END;
GO

-- ============================================================
-- 8. Seed instrument_type onto existing trades
-- ============================================================
UPDATE dbo.trade SET instrument_type = 'PHYSICAL'             WHERE trade_id IN (1, 3, 4, 6, 7, 8) AND instrument_type IS NULL;
UPDATE dbo.trade SET instrument_type = 'SWAP_FIXED_FLOAT'     WHERE trade_id IN (2, 5)              AND instrument_type IS NULL;
UPDATE dbo.trade SET instrument_type = 'TRANSPORT_AGREEMENT'  WHERE trade_id = 9                    AND instrument_type IS NULL;
UPDATE dbo.trade SET instrument_type = 'FUTURES'              WHERE trade_id IN (10, 11, 12, 13, 15) AND instrument_type IS NULL;
UPDATE dbo.trade SET instrument_type = 'CERTIFICATE_TRANSFER' WHERE trade_id = 14                   AND instrument_type IS NULL;
GO
