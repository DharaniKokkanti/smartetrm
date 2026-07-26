-- =============================================================================
-- V161 — Fixes for 4 confirmed gaps from docs/masterdata_curve_derivative_asset_gaps_pending_06.md
-- =============================================================================
-- 1. dbo.derivative_contract_specification — reusable option/derivative contract
--    spec master (style, exercise type, contract size/tick, notice/expiry/roll
--    conventions), separate from dbo.trade_option_detail's per-trade economics.
-- 2. dbo.storage_facility — gas-storage-specific physical attributes (working
--    gas capacity, cushion gas, injection/withdrawal rates). Self-flagged as
--    deferred since V103; facility_type already has 'GAS_STORAGE' (V47), only
--    the attribute columns were missing.
-- 3. dbo.physical_asset — additive cross-commodity asset registry/index over
--    storage_facility + generation_asset (portfolio-level "list every physical
--    asset" queries). Nullable back-reference FKs only — no existing PK/FK
--    changes, no Java entity changes required (location already carries the
--    shared country/timezone/lat-long/operator/capacity attributes the
--    original review wanted centralized, so this is deliberately a thin
--    index, not a real parent-owns-the-data remodel).
-- 4. dbo.counterparty — parent_counterparty_id self-reference, mirroring the
--    existing dbo.legal_entity.parent_entity_id pattern (V1), to model
--    external-party group hierarchies the same way internal entities already
--    can.
--
-- row_version: INT on both new tables, confirmed with Dharani — matches the
-- universal existing pattern (200+ tables, V127-V153), same human-edit-
-- frequency profile as every other master-data table here.
-- =============================================================================

-- =============================================================================
-- 1. dbo.derivative_contract_specification
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'derivative_contract_specification')
BEGIN
  CREATE TABLE dbo.derivative_contract_specification (
    contract_spec_id            INT             NOT NULL IDENTITY(1,1),
    spec_code                   VARCHAR(30)     NOT NULL,
    spec_name                   VARCHAR(200)    NOT NULL,
    instrument_type              VARCHAR(20)     NOT NULL
      CONSTRAINT chk_dcs_instrument_type CHECK (instrument_type IN (
        'FUTURE', 'OPTION', 'SWAP', 'SWAPTION', 'SPREAD_OPTION', 'FORWARD'
      )),
    commodity_family_id           INT             NULL,
    product_id                      INT             NULL,
    listing_exchange_id               INT             NULL,
    option_style                        VARCHAR(10)     NULL   -- only meaningful for OPTION/SWAPTION/SPREAD_OPTION
      CONSTRAINT chk_dcs_option_style CHECK (option_style IS NULL OR option_style IN (
        'AMERICAN', 'EUROPEAN', 'ASIAN'
      )),
    exercise_type                          VARCHAR(10)     NULL
      CONSTRAINT chk_dcs_exercise_type CHECK (exercise_type IS NULL OR exercise_type IN (
        'PHYSICAL', 'CASH'
      )),
    contract_size                            DECIMAL(18,6)   NULL,
    contract_size_uom_id                       INT             NULL,
    tick_size                                    DECIMAL(18,8)   NULL,
    tick_value                                     DECIMAL(18,6)   NULL,
    tick_value_currency_id                           INT             NULL,
    notice_date_convention                             VARCHAR(200)    NULL,  -- e.g. "First notice: 3 business days prior to first delivery day"
    expiry_convention                                    VARCHAR(200)    NULL,  -- e.g. "3rd business day prior to the 25th of the contract month"
    settlement_roll_convention                             VARCHAR(30)     NULL
      CONSTRAINT chk_dcs_settlement_roll CHECK (settlement_roll_convention IS NULL OR settlement_roll_convention IN (
        'LAST_TRADING_DAY', 'FIXED_CALENDAR_DAY', 'BUSINESS_DAY_OFFSET', 'OTHER'
      )),
    is_active                                                  BIT             NOT NULL DEFAULT 1,
    notes                                                         VARCHAR(500)    NULL,
    created_at                                                      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                                      VARCHAR(100)    NOT NULL,
    updated_at                                                        DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                                        VARCHAR(100)    NOT NULL,
    row_version                                                         INT             NOT NULL DEFAULT 0,

    CONSTRAINT pk_derivative_contract_specification PRIMARY KEY (contract_spec_id),
    CONSTRAINT uq_dcs_spec_code                     UNIQUE      (spec_code),
    CONSTRAINT fk_dcs_commodity_family              FOREIGN KEY (commodity_family_id)      REFERENCES dbo.commodity_family(commodity_family_id),
    CONSTRAINT fk_dcs_product                       FOREIGN KEY (product_id)               REFERENCES dbo.product(product_id),
    CONSTRAINT fk_dcs_exchange                      FOREIGN KEY (listing_exchange_id)      REFERENCES dbo.exchange(exchange_id),
    CONSTRAINT fk_dcs_contract_size_uom             FOREIGN KEY (contract_size_uom_id)     REFERENCES dbo.unit_of_measure(uom_id),
    CONSTRAINT fk_dcs_tick_value_currency           FOREIGN KEY (tick_value_currency_id)   REFERENCES dbo.currency(currency_id),
    CONSTRAINT chk_dcs_option_fields_scope CHECK (
      instrument_type IN ('OPTION', 'SWAPTION', 'SPREAD_OPTION') OR (option_style IS NULL AND exercise_type IS NULL)
    )
  );
END;
GO

-- =============================================================================
-- 2. dbo.storage_facility — gas-storage physical attributes
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.storage_facility') AND name = 'working_gas_capacity')
BEGIN
  ALTER TABLE dbo.storage_facility ADD
    working_gas_capacity        DECIMAL(18,4)   NULL,   -- usable/withdrawable gas volume
    cushion_gas_volume          DECIMAL(18,4)   NULL,    -- permanent base gas required to maintain reservoir pressure
    max_injection_rate_per_day  DECIMAL(18,4)   NULL,
    max_withdrawal_rate_per_day DECIMAL(18,4)   NULL,
    gas_volume_uom_id           INT             NULL;   -- shared UOM for all 4 columns above (e.g. MMBtu, MCF)
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_sf_gas_volume_uom')
  ALTER TABLE dbo.storage_facility ADD CONSTRAINT fk_sf_gas_volume_uom FOREIGN KEY (gas_volume_uom_id) REFERENCES dbo.unit_of_measure(uom_id);
GO

-- =============================================================================
-- 3. dbo.physical_asset — additive cross-commodity registry
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'physical_asset')
BEGIN
  CREATE TABLE dbo.physical_asset (
    asset_id                 INT             NOT NULL IDENTITY(1,1),
    asset_code                  VARCHAR(30)     NOT NULL,
    asset_name                     VARCHAR(200)    NOT NULL,
    asset_class                       VARCHAR(20)     NOT NULL
      CONSTRAINT chk_pa_asset_class CHECK (asset_class IN (
        'STORAGE_FACILITY', 'GENERATION_ASSET'
      )),
    storage_facility_id                    INT             NULL,
    generation_asset_id                      INT             NULL,
    owner_legal_entity_id                      INT             NULL,
    is_active                                    BIT             NOT NULL DEFAULT 1,
    notes                                          VARCHAR(500)    NULL,
    created_at                                       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                       VARCHAR(100)    NOT NULL,
    updated_at                                         DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by                                         VARCHAR(100)    NOT NULL,
    row_version                                          INT             NOT NULL DEFAULT 0,

    CONSTRAINT pk_physical_asset            PRIMARY KEY (asset_id),
    CONSTRAINT uq_pa_asset_code             UNIQUE      (asset_code),
    CONSTRAINT fk_pa_storage_facility       FOREIGN KEY (storage_facility_id)   REFERENCES dbo.storage_facility(facility_id),
    CONSTRAINT fk_pa_generation_asset       FOREIGN KEY (generation_asset_id)   REFERENCES dbo.generation_asset(generation_asset_id),
    CONSTRAINT fk_pa_owner_entity           FOREIGN KEY (owner_legal_entity_id) REFERENCES dbo.legal_entity(legal_entity_id),
    -- exactly one of the two back-references must be set, matching asset_class
    CONSTRAINT chk_pa_one_backref CHECK (
      (asset_class = 'STORAGE_FACILITY' AND storage_facility_id IS NOT NULL AND generation_asset_id IS NULL) OR
      (asset_class = 'GENERATION_ASSET' AND generation_asset_id IS NOT NULL AND storage_facility_id IS NULL)
    )
  );
END;
GO

-- Filtered unique indexes, not UNIQUE constraints: SQL Server treats multiple
-- NULLs as duplicates under a plain UNIQUE constraint (unlike most other
-- engines), which would reject every second row of the majority-NULL
-- backfill below. WHERE ... IS NOT NULL keeps the one-asset-per-source-row
-- guarantee without that trap.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'uq_pa_storage_facility')
  CREATE UNIQUE INDEX uq_pa_storage_facility ON dbo.physical_asset(storage_facility_id) WHERE storage_facility_id IS NOT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'uq_pa_generation_asset')
  CREATE UNIQUE INDEX uq_pa_generation_asset ON dbo.physical_asset(generation_asset_id) WHERE generation_asset_id IS NOT NULL;
GO

-- Backfill: one physical_asset row per existing storage_facility / generation_asset row
INSERT INTO dbo.physical_asset (asset_code, asset_name, asset_class, storage_facility_id, created_by, updated_by)
SELECT 'SF-' + CAST(sf.facility_id AS VARCHAR(10)), sf.facility_name, 'STORAGE_FACILITY', sf.facility_id, 'SYSTEM', 'SYSTEM'
FROM dbo.storage_facility sf
WHERE NOT EXISTS (SELECT 1 FROM dbo.physical_asset pa WHERE pa.storage_facility_id = sf.facility_id);
GO

INSERT INTO dbo.physical_asset (asset_code, asset_name, asset_class, generation_asset_id, owner_legal_entity_id, created_by, updated_by)
SELECT 'GA-' + CAST(ga.generation_asset_id AS VARCHAR(10)), ga.asset_name, 'GENERATION_ASSET', ga.generation_asset_id, NULL, 'SYSTEM', 'SYSTEM'
FROM dbo.generation_asset ga
WHERE NOT EXISTS (SELECT 1 FROM dbo.physical_asset pa WHERE pa.generation_asset_id = ga.generation_asset_id);
GO

-- =============================================================================
-- 4. dbo.counterparty — self-referencing group hierarchy (mirrors legal_entity)
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.counterparty') AND name = 'parent_counterparty_id')
  ALTER TABLE dbo.counterparty ADD parent_counterparty_id INT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_cp_parent')
  ALTER TABLE dbo.counterparty ADD CONSTRAINT fk_cp_parent FOREIGN KEY (parent_counterparty_id) REFERENCES dbo.counterparty(counterparty_id);
GO

-- =============================================================================
-- 5. Tier2 registry rows — rides the generic ReferenceDataController, no Java
--    entity needed (same pattern as dbo.metal_assay_component_rule, V96).
--    dbo.physical_asset is catalog-only for now (is_enabled=0): it's a
--    backfilled index table, not something an end user should hand-edit
--    through the generic grid — new rows get created by the backfill/future
--    create flows on storage_facility/generation_asset themselves, not here.
-- =============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'derivative_contract_specification')
  INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, data_category, allow_create, allow_edit, allow_delete, allow_excel_upload, is_enabled, display_order, notes, created_by, updated_by)
  VALUES ('derivative_contract_specification', 'Derivative Contract Specifications', 'Products & Markets', 'MASTER_DATA', 1, 1, 1, 0, 1, 22, 'V161 — reusable option/derivative contract spec master (style, exercise type, tick value, notice/expiry/roll conventions), separate from trade_option_detail per-trade capture.', 'SYSTEM', 'SYSTEM');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.master_data_table_registry WHERE table_name = 'physical_asset')
  INSERT INTO dbo.master_data_table_registry (table_name, display_name, module_group, data_category, allow_create, allow_edit, allow_delete, allow_excel_upload, is_enabled, display_order, notes, created_by, updated_by)
  VALUES ('physical_asset', 'Physical Asset Registry', 'Reference', 'MASTER_DATA', 0, 0, 0, 0, 0, 950, 'V161 — catalog-only cross-commodity index over storage_facility/generation_asset for portfolio-level queries. Not user-editable through the generic grid; rows are backfilled/derived from the two source tables.', 'SYSTEM', 'SYSTEM');
GO

PRINT '============================================================';
PRINT 'V161 — derivative_contract_specification created + registered;';
PRINT '       storage_facility gas-storage columns added;';
PRINT '       physical_asset created, backfilled, and registered (catalog-only);';
PRINT '       counterparty.parent_counterparty_id self-reference added.';
PRINT '============================================================';
GO
