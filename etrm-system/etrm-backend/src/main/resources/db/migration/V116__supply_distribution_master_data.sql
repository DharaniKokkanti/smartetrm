-- =============================================================================
-- V116 — Supply & Distribution master data (flagged in §11a of the handoff
-- doc, not yet built as of the previous session — "genuinely missing, not
-- yet designed in any detail"). All six items registered as Tier2-generic
-- reference tables (simple CRUD via the existing ReferenceDataController) —
-- no dedicated backend/frontend needed, matching the user's own framing
-- ("ref data").
--
-- 1. loading_rack             — custody-transfer measurement points at a terminal
-- 2. movement_type            — RECEIPT/DELIVERY/INTERNAL_TRANSFER/BLEND/LOSS_GAIN
-- 3. inventory_ownership_type — company-owned / consignment / exchange borrow-loan / third-party
-- 4. blend_recipe (+ blend_recipe_component) — terminal splash-blending recipes
-- 5. throughput_agreement     — third-party storage/throughput rights (storage-side analogue of pipeline_tariff)
-- 6. product_interface_rule   — line-changeover / flush-volume rules between products
-- =============================================================================

-- =============================================================================
-- 1. LOADING_RACK
-- =============================================================================
CREATE TABLE dbo.loading_rack (
    rack_id                 INT             NOT NULL IDENTITY(1,1),
    facility_id             INT             NOT NULL,
    rack_number             VARCHAR(30)     NOT NULL,
    meter_type              VARCHAR(30)     NOT NULL,
    prover_type             VARCHAR(30)     NULL,
    prover_cert_number      VARCHAR(50)     NULL,
    last_calibration_date   DATE            NULL,
    next_calibration_date   DATE            NULL,
    max_flow_rate_m3h       DECIMAL(10,2)   NULL,
    product_id              INT             NULL,
    is_active               BIT             NOT NULL DEFAULT 1,
    notes                   VARCHAR(500)    NULL,
    created_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',
    updated_at              DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_by              VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',

    CONSTRAINT pk_loading_rack          PRIMARY KEY (rack_id),
    CONSTRAINT uq_loading_rack_number   UNIQUE      (facility_id, rack_number),
    CONSTRAINT fk_lr_facility           FOREIGN KEY (facility_id) REFERENCES dbo.storage_facility(facility_id),
    CONSTRAINT fk_lr_product            FOREIGN KEY (product_id)  REFERENCES dbo.product(product_id),
    CONSTRAINT chk_lr_meter_type CHECK (meter_type IN (
        'POSITIVE_DISPLACEMENT', 'TURBINE', 'CORIOLIS', 'ULTRASONIC', 'OTHER'
    )),
    CONSTRAINT chk_lr_prover_type CHECK (prover_type IS NULL OR prover_type IN (
        'SMALL_VOLUME_PROVER', 'PIPE_PROVER', 'MASTER_METER', 'TANK_PROVER'
    ))
);
GO

-- =============================================================================
-- 2. MOVEMENT_TYPE
-- =============================================================================
CREATE TABLE dbo.movement_type (
    movement_type_id  INT             NOT NULL IDENTITY(1,1),
    type_code         VARCHAR(30)     NOT NULL,
    type_name         VARCHAR(100)    NOT NULL,
    description       VARCHAR(500)    NULL,
    sort_order        SMALLINT        NOT NULL DEFAULT 0,
    is_active         BIT             NOT NULL DEFAULT 1,
    created_at        DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by        VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',

    CONSTRAINT pk_movement_type      PRIMARY KEY (movement_type_id),
    CONSTRAINT uq_movement_type_code UNIQUE      (type_code),
    CONSTRAINT chk_mt_code CHECK (type_code IN (
        'RECEIPT', 'DELIVERY', 'INTERNAL_TRANSFER', 'BLEND', 'LOSS_GAIN'
    ))
);
GO

INSERT INTO dbo.movement_type (type_code, type_name, description, sort_order) VALUES
('RECEIPT',           'Receipt',            'Product received into a tank/facility from an inbound vessel, pipeline, truck, or rail movement.', 10),
('DELIVERY',          'Delivery',           'Product delivered out of a tank/facility to an outbound vessel, pipeline, truck, or rail movement.', 20),
('INTERNAL_TRANSFER', 'Internal Transfer',  'Product moved between tanks within the same facility — no title change.',                            30),
('BLEND',             'Blend',              'Component products combined per a blend recipe to produce a finished blended product.',              40),
('LOSS_GAIN',         'Loss / Gain',        'Inventory reconciliation adjustment — measured variance between book and physical/gauged volume.',    50);
GO

-- =============================================================================
-- 3. INVENTORY_OWNERSHIP_TYPE
-- =============================================================================
CREATE TABLE dbo.inventory_ownership_type (
    ownership_type_id  INT             NOT NULL IDENTITY(1,1),
    type_code          VARCHAR(30)     NOT NULL,
    type_name          VARCHAR(100)    NOT NULL,
    description        VARCHAR(500)    NULL,
    sort_order         SMALLINT        NOT NULL DEFAULT 0,
    is_active          BIT             NOT NULL DEFAULT 1,
    created_at         DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by         VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',

    CONSTRAINT pk_inventory_ownership_type      PRIMARY KEY (ownership_type_id),
    CONSTRAINT uq_inventory_ownership_type_code UNIQUE      (type_code),
    CONSTRAINT chk_iot_code CHECK (type_code IN (
        'COMPANY_OWNED', 'CONSIGNMENT', 'EXCHANGE_BORROW', 'EXCHANGE_LOAN', 'THIRD_PARTY_HELD'
    ))
);
GO

INSERT INTO dbo.inventory_ownership_type (type_code, type_name, description, sort_order) VALUES
('COMPANY_OWNED',    'Company-Owned',     'Stock owned outright by the trading entity — both physical and title reconciliation apply normally.',        10),
('CONSIGNMENT',      'Consignment',       'Stock physically held on our books but title remains with the supplying counterparty until drawn/sold.',       20),
('EXCHANGE_BORROW',  'Exchange Borrow',   'Stock borrowed from a counterparty under an exchange agreement — a repayment-in-kind obligation exists.',       30),
('EXCHANGE_LOAN',    'Exchange Loan',     'Stock loaned to a counterparty under an exchange agreement — a receivable-in-kind exists.',                     40),
('THIRD_PARTY_HELD', 'Third-Party Held',  'Stock owned by us but physically held at a facility we do not operate, under a throughput/storage agreement.',  50);
GO

-- =============================================================================
-- 4. BLEND_RECIPE + BLEND_RECIPE_COMPONENT
-- =============================================================================
CREATE TABLE dbo.blend_recipe (
    blend_recipe_id  INT             NOT NULL IDENTITY(1,1),
    recipe_code      VARCHAR(30)     NOT NULL,
    recipe_name      VARCHAR(200)    NOT NULL,
    target_product_id INT            NOT NULL,
    commodity_type   VARCHAR(20)     NULL,
    tolerance_pct    DECIMAL(5,2)    NULL,
    description      VARCHAR(500)    NULL,
    is_active        BIT             NOT NULL DEFAULT 1,
    created_at       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by       VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',

    CONSTRAINT pk_blend_recipe        PRIMARY KEY (blend_recipe_id),
    CONSTRAINT uq_blend_recipe_code   UNIQUE      (recipe_code),
    CONSTRAINT fk_br_target_product   FOREIGN KEY (target_product_id) REFERENCES dbo.product(product_id)
);
GO

CREATE TABLE dbo.blend_recipe_component (
    component_id         INT             NOT NULL IDENTITY(1,1),
    blend_recipe_id       INT             NOT NULL,
    component_product_id INT             NOT NULL,
    target_pct            DECIMAL(5,2)    NOT NULL,
    min_pct                DECIMAL(5,2)    NULL,
    max_pct                DECIMAL(5,2)    NULL,
    sort_order             SMALLINT        NOT NULL DEFAULT 0,

    CONSTRAINT pk_blend_recipe_component  PRIMARY KEY (component_id),
    CONSTRAINT uq_brc_recipe_component    UNIQUE      (blend_recipe_id, component_product_id),
    CONSTRAINT fk_brc_recipe               FOREIGN KEY (blend_recipe_id) REFERENCES dbo.blend_recipe(blend_recipe_id) ON DELETE CASCADE,
    CONSTRAINT fk_brc_component_product    FOREIGN KEY (component_product_id) REFERENCES dbo.product(product_id)
);
GO

-- =============================================================================
-- 5. THROUGHPUT_AGREEMENT
-- =============================================================================
CREATE TABLE dbo.throughput_agreement (
    agreement_id        INT             NOT NULL IDENTITY(1,1),
    agreement_code       VARCHAR(30)     NOT NULL,
    counterparty_id      INT             NOT NULL,
    facility_id          INT             NOT NULL,
    agreement_type       VARCHAR(20)     NOT NULL,
    contracted_capacity  DECIMAL(18,4)   NOT NULL,
    capacity_uom_id      INT             NOT NULL,
    tariff_rate          DECIMAL(18,6)   NULL,
    tariff_currency_id   INT             NULL,
    tariff_uom_id        INT             NULL,
    effective_from       DATE            NOT NULL,
    effective_to         DATE            NULL,
    is_active            BIT             NOT NULL DEFAULT 1,
    notes                VARCHAR(500)    NULL,
    created_at           DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by           VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',

    CONSTRAINT pk_throughput_agreement      PRIMARY KEY (agreement_id),
    CONSTRAINT uq_throughput_agreement_code UNIQUE      (agreement_code),
    CONSTRAINT fk_ta_counterparty            FOREIGN KEY (counterparty_id)    REFERENCES dbo.counterparty(counterparty_id),
    CONSTRAINT fk_ta_facility                FOREIGN KEY (facility_id)        REFERENCES dbo.storage_facility(facility_id),
    CONSTRAINT fk_ta_capacity_uom            FOREIGN KEY (capacity_uom_id)    REFERENCES dbo.unit_of_measure(uom_id),
    CONSTRAINT fk_ta_tariff_currency         FOREIGN KEY (tariff_currency_id) REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_ta_tariff_uom              FOREIGN KEY (tariff_uom_id)      REFERENCES dbo.unit_of_measure(uom_id),
    CONSTRAINT chk_ta_type CHECK (agreement_type IN ('STORAGE', 'THROUGHPUT', 'BOTH'))
);
GO

-- =============================================================================
-- 6. PRODUCT_INTERFACE_RULE
-- =============================================================================
CREATE TABLE dbo.product_interface_rule (
    rule_id                INT             NOT NULL IDENTITY(1,1),
    from_product_id        INT             NOT NULL,
    to_product_id           INT             NOT NULL,
    min_flush_volume_m3     DECIMAL(10,2)   NULL,
    is_compatible           BIT             NOT NULL DEFAULT 0,
    downgrade_product_id    INT             NULL,
    notes                   VARCHAR(500)    NULL,
    is_active                BIT             NOT NULL DEFAULT 1,
    created_at               DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',

    CONSTRAINT pk_product_interface_rule    PRIMARY KEY (rule_id),
    CONSTRAINT uq_pir_from_to                UNIQUE      (from_product_id, to_product_id),
    CONSTRAINT fk_pir_from_product            FOREIGN KEY (from_product_id)     REFERENCES dbo.product(product_id),
    CONSTRAINT fk_pir_to_product              FOREIGN KEY (to_product_id)       REFERENCES dbo.product(product_id),
    CONSTRAINT fk_pir_downgrade_product       FOREIGN KEY (downgrade_product_id) REFERENCES dbo.product(product_id)
);
GO

-- =============================================================================
-- 7. Register all 6 tables in the Tier2 generic mechanism
-- =============================================================================
INSERT INTO dbo.master_data_table_registry
    (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES
    ('loading_rack',             'Loading Racks',              'Supply & Distribution', 1, 1, 1, 0, 1, 'SYSTEM', 'SYSTEM'),
    ('movement_type',            'Movement Types',             'Supply & Distribution', 1, 1, 1, 0, 2, 'SYSTEM', 'SYSTEM'),
    ('inventory_ownership_type', 'Inventory Ownership Types',  'Supply & Distribution', 1, 1, 1, 0, 3, 'SYSTEM', 'SYSTEM'),
    ('blend_recipe',             'Blend Recipes',              'Supply & Distribution', 1, 1, 1, 0, 4, 'SYSTEM', 'SYSTEM'),
    ('blend_recipe_component',   'Blend Recipe Components',    'Supply & Distribution', 1, 1, 1, 0, 5, 'SYSTEM', 'SYSTEM'),
    ('throughput_agreement',     'Throughput Agreements',      'Supply & Distribution', 1, 1, 1, 0, 6, 'SYSTEM', 'SYSTEM'),
    ('product_interface_rule',   'Product Interface Rules',    'Supply & Distribution', 1, 1, 1, 0, 7, 'SYSTEM', 'SYSTEM');
GO
