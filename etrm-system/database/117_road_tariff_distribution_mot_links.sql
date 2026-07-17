-- =============================================================================
-- V117 — road (truck) tariff + transport-mode links on Supply & Distribution assets
--
-- Prompted by: "generate tariff and freight cost for these distribution as
-- well link to truck or pipeline" — a gap check against V116's new tables.
-- Findings:
--   - Pipeline already fully covered: dbo.pipeline_tariff (rate, currency,
--     UoM, season, effective dates, from/to pipeline_point, product) —
--     nothing missing there, confirmed via live schema inspection.
--   - Vessel/ocean freight already covered: dbo.freight_rate_index,
--     dbo.demurrage_dispatch_rate (a separate domain, unaffected here).
--   - Rail: also has no dedicated tariff table (same gap as truck), but the
--     user only asked for truck/pipeline this pass — flagged, not built.
--   - Truck/road freight: NO tariff table existed at all — the actual gap.
--   - Neither dbo.loading_rack nor dbo.throughput_agreement (both V116) had
--     any way to say which transport mode they serve — added mot_type_id
--     to both so a rack/agreement can be marked TRUCK-only, PIPELINE-only,
--     VESSEL-only, or left NULL (any mode / not mode-specific).
--
-- Changes:
--   1. dbo.road_tariff — new table, mirrors pipeline_tariff's shape,
--      route-based via the existing (MOT-agnostic) dbo.transport_route
--      rather than raw origin/dest columns, so it works for any road route
--      already captured there.
--   2. dbo.loading_rack.mot_type_id (nullable FK -> mot_type)
--   3. dbo.throughput_agreement.mot_type_id (nullable FK -> mot_type)
-- =============================================================================

-- =============================================================================
-- 1. ROAD_TARIFF
-- =============================================================================
CREATE TABLE dbo.road_tariff (
    tariff_id           INT             NOT NULL IDENTITY(1,1),
    route_id             INT             NOT NULL,
    operator_id           INT             NULL,
    product_id             INT             NULL,
    tariff_type             VARCHAR(20)     NOT NULL,
    rate                     DECIMAL(18,6)   NOT NULL,
    currency_id               INT             NOT NULL,
    rate_uom_id                 INT             NULL,
    min_charge                    DECIMAL(18,2)   NULL,
    fuel_surcharge_pct               DECIMAL(5,2)    NULL,
    effective_from                     DATE            NOT NULL,
    effective_to                         DATE            NULL,
    is_active                              BIT             NOT NULL DEFAULT 1,
    notes                                    VARCHAR(500)    NULL,
    created_at                                DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                                  VARCHAR(100)    NOT NULL DEFAULT 'SYSTEM',

    CONSTRAINT pk_road_tariff        PRIMARY KEY (tariff_id),
    CONSTRAINT fk_rt_route            FOREIGN KEY (route_id)      REFERENCES dbo.transport_route(route_id),
    CONSTRAINT fk_rt_operator          FOREIGN KEY (operator_id)   REFERENCES dbo.transport_operator(operator_id),
    CONSTRAINT fk_rt_product            FOREIGN KEY (product_id)    REFERENCES dbo.product(product_id),
    CONSTRAINT fk_rt_currency            FOREIGN KEY (currency_id)   REFERENCES dbo.currency(currency_id),
    CONSTRAINT fk_rt_rate_uom             FOREIGN KEY (rate_uom_id)   REFERENCES dbo.unit_of_measure(uom_id),
    CONSTRAINT chk_rt_tariff_type CHECK (tariff_type IN (
        'FLAT_PER_LOAD', 'PER_KM', 'PER_MT', 'PER_BBL', 'PER_HOUR'
    ))
);
GO

-- =============================================================================
-- 2 & 3. Transport-mode links on the V116 distribution tables
-- =============================================================================
ALTER TABLE dbo.loading_rack
    ADD mot_type_id INT NULL;
GO
ALTER TABLE dbo.loading_rack
    ADD CONSTRAINT fk_lr_mot_type FOREIGN KEY (mot_type_id) REFERENCES dbo.mot_type(mot_type_id);
GO

ALTER TABLE dbo.throughput_agreement
    ADD mot_type_id INT NULL;
GO
ALTER TABLE dbo.throughput_agreement
    ADD CONSTRAINT fk_ta_mot_type FOREIGN KEY (mot_type_id) REFERENCES dbo.mot_type(mot_type_id);
GO

-- =============================================================================
-- 4. Register road_tariff in the Tier2 generic mechanism
-- =============================================================================
INSERT INTO dbo.master_data_table_registry
    (table_name, display_name, module_group, allow_create, allow_edit, allow_delete, allow_excel_upload, display_order, created_by, updated_by)
VALUES
    ('road_tariff', 'Road (Truck) Tariffs', 'Supply & Distribution', 1, 1, 1, 0, 8, 'SYSTEM', 'SYSTEM');
GO
