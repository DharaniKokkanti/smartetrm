-- =============================================================================
-- V94 — Convert location_code / uom_code natural-key FKs to surrogate-key
-- (location_id / uom_id) FKs, closing the gap flagged in the master-data
-- review: dbo.location and dbo.unit_of_measure both already carry a
-- surrogate IDENTITY PK (location_id / uom_id) alongside their natural code
-- column, but V90/V91/V93 wired the child-table FKs onto the code column
-- instead of the id — the correct pattern already used everywhere else in
-- this schema (e.g. dbo.trade.uom_id, dbo.product.default_uom_id,
-- dbo.trade.location-shaped FKs in 09_trade_schema.sql).
--
-- Scope: every live FK column added by V90 (uom family) and V91/V93
-- (location family). Pattern per column: add the new *_id column nullable,
-- backfill by joining the old code column to the master table, drop the old
-- FK + the old code column, then (for columns that were NOT NULL before)
-- restore NOT NULL on the new id column, then add the real FK on the id.
--
-- Out of scope (deliberately untouched): pipeline_code, route_code — same
-- class of gap, but a separate family, not requested in this pass.
-- =============================================================================
USE ETRM_DB;
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- LOCATION FAMILY (9 columns across 6 tables)
-- ─────────────────────────────────────────────────────────────────────────────

-- dbo.trade_transport_agreement_detail: load_location_code, discharge_location_code
ALTER TABLE dbo.trade_transport_agreement_detail ADD load_location_id INT NULL;
ALTER TABLE dbo.trade_transport_agreement_detail ADD discharge_location_id INT NULL;
GO
UPDATE t SET t.load_location_id = l.location_id
  FROM dbo.trade_transport_agreement_detail t JOIN dbo.location l ON l.location_code = t.load_location_code;
UPDATE t SET t.discharge_location_id = l.location_id
  FROM dbo.trade_transport_agreement_detail t JOIN dbo.location l ON l.location_code = t.discharge_location_code;
GO
ALTER TABLE dbo.trade_transport_agreement_detail DROP CONSTRAINT IF EXISTS fk_ttad_load_location;
ALTER TABLE dbo.trade_transport_agreement_detail DROP CONSTRAINT IF EXISTS fk_ttad_discharge_location;
ALTER TABLE dbo.trade_transport_agreement_detail DROP COLUMN IF EXISTS load_location_code;
ALTER TABLE dbo.trade_transport_agreement_detail DROP COLUMN IF EXISTS discharge_location_code;
GO
ALTER TABLE dbo.trade_transport_agreement_detail ADD CONSTRAINT fk_ttad_load_location FOREIGN KEY (load_location_id) REFERENCES dbo.location(location_id);
ALTER TABLE dbo.trade_transport_agreement_detail ADD CONSTRAINT fk_ttad_discharge_location FOREIGN KEY (discharge_location_id) REFERENCES dbo.location(location_id);
GO

-- dbo.trade_oil_detail / trade_lng_detail / trade_metals_detail: title_transfer_location_code
ALTER TABLE dbo.trade_oil_detail ADD title_transfer_location_id INT NULL;
ALTER TABLE dbo.trade_lng_detail ADD title_transfer_location_id INT NULL;
ALTER TABLE dbo.trade_metals_detail ADD title_transfer_location_id INT NULL;
GO
UPDATE t SET t.title_transfer_location_id = l.location_id
  FROM dbo.trade_oil_detail t JOIN dbo.location l ON l.location_code = t.title_transfer_location_code;
UPDATE t SET t.title_transfer_location_id = l.location_id
  FROM dbo.trade_lng_detail t JOIN dbo.location l ON l.location_code = t.title_transfer_location_code;
UPDATE t SET t.title_transfer_location_id = l.location_id
  FROM dbo.trade_metals_detail t JOIN dbo.location l ON l.location_code = t.title_transfer_location_code;
GO
ALTER TABLE dbo.trade_oil_detail DROP CONSTRAINT IF EXISTS fk_trade_oil_title_transfer_location;
ALTER TABLE dbo.trade_lng_detail DROP CONSTRAINT IF EXISTS fk_trade_lng_title_transfer_location;
ALTER TABLE dbo.trade_metals_detail DROP CONSTRAINT IF EXISTS fk_trade_metals_title_transfer_location;
ALTER TABLE dbo.trade_oil_detail DROP COLUMN IF EXISTS title_transfer_location_code;
ALTER TABLE dbo.trade_lng_detail DROP COLUMN IF EXISTS title_transfer_location_code;
ALTER TABLE dbo.trade_metals_detail DROP COLUMN IF EXISTS title_transfer_location_code;
GO
ALTER TABLE dbo.trade_oil_detail ADD CONSTRAINT fk_trade_oil_title_transfer_location FOREIGN KEY (title_transfer_location_id) REFERENCES dbo.location(location_id);
ALTER TABLE dbo.trade_lng_detail ADD CONSTRAINT fk_trade_lng_title_transfer_location FOREIGN KEY (title_transfer_location_id) REFERENCES dbo.location(location_id);
ALTER TABLE dbo.trade_metals_detail ADD CONSTRAINT fk_trade_metals_title_transfer_location FOREIGN KEY (title_transfer_location_id) REFERENCES dbo.location(location_id);
GO

-- dbo.bolmo_agreement / trade_order: delivery_location_code
ALTER TABLE dbo.bolmo_agreement ADD delivery_location_id INT NULL;
ALTER TABLE dbo.trade_order ADD delivery_location_id INT NULL;
GO
UPDATE t SET t.delivery_location_id = l.location_id
  FROM dbo.bolmo_agreement t JOIN dbo.location l ON l.location_code = t.delivery_location_code;
UPDATE t SET t.delivery_location_id = l.location_id
  FROM dbo.trade_order t JOIN dbo.location l ON l.location_code = t.delivery_location_code;
GO
ALTER TABLE dbo.bolmo_agreement DROP CONSTRAINT IF EXISTS fk_bolmo_delivery_location;
ALTER TABLE dbo.trade_order DROP CONSTRAINT IF EXISTS fk_trade_order_delivery_location;
ALTER TABLE dbo.bolmo_agreement DROP COLUMN IF EXISTS delivery_location_code;
ALTER TABLE dbo.trade_order DROP COLUMN IF EXISTS delivery_location_code;
GO
ALTER TABLE dbo.bolmo_agreement ADD CONSTRAINT fk_bolmo_delivery_location FOREIGN KEY (delivery_location_id) REFERENCES dbo.location(location_id);
ALTER TABLE dbo.trade_order ADD CONSTRAINT fk_trade_order_delivery_location FOREIGN KEY (delivery_location_id) REFERENCES dbo.location(location_id);
GO

-- dbo.nomination / delivery_instruction: location_code (V93, brand new — no legacy data)
ALTER TABLE dbo.nomination ADD location_id INT NULL;
ALTER TABLE dbo.delivery_instruction ADD location_id INT NULL;
GO
UPDATE t SET t.location_id = l.location_id
  FROM dbo.nomination t JOIN dbo.location l ON l.location_code = t.location_code;
UPDATE t SET t.location_id = l.location_id
  FROM dbo.delivery_instruction t JOIN dbo.location l ON l.location_code = t.location_code;
GO
ALTER TABLE dbo.nomination DROP CONSTRAINT IF EXISTS fk_nomination_location;
ALTER TABLE dbo.delivery_instruction DROP CONSTRAINT IF EXISTS fk_di_location;
ALTER TABLE dbo.nomination DROP COLUMN IF EXISTS location_code;
ALTER TABLE dbo.delivery_instruction DROP COLUMN IF EXISTS location_code;
GO
ALTER TABLE dbo.nomination ADD CONSTRAINT fk_nomination_location FOREIGN KEY (location_id) REFERENCES dbo.location(location_id);
ALTER TABLE dbo.delivery_instruction ADD CONSTRAINT fk_di_location FOREIGN KEY (location_id) REFERENCES dbo.location(location_id);
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- UOM FAMILY (~17 columns across ~13 tables)
-- ─────────────────────────────────────────────────────────────────────────────

-- NOT NULL columns: trade_order.uom_code, trade_item.uom_code,
-- bolmo_agreement.uom_code, bolmo_leg.uom_code, balmo_product.uom_code,
-- settlement_price.uom_code — add nullable, backfill, drop old, restore
-- NOT NULL, then FK.
ALTER TABLE dbo.trade_order ADD uom_id INT NULL;
ALTER TABLE dbo.trade_item ADD uom_id INT NULL;
ALTER TABLE dbo.bolmo_agreement ADD uom_id INT NULL;
ALTER TABLE dbo.bolmo_leg ADD uom_id INT NULL;
ALTER TABLE dbo.balmo_product ADD uom_id INT NULL;
ALTER TABLE dbo.settlement_price ADD uom_id INT NULL;
GO
UPDATE t SET t.uom_id = u.uom_id FROM dbo.trade_order t JOIN dbo.unit_of_measure u ON u.uom_code = t.uom_code;
UPDATE t SET t.uom_id = u.uom_id FROM dbo.trade_item t JOIN dbo.unit_of_measure u ON u.uom_code = t.uom_code;
UPDATE t SET t.uom_id = u.uom_id FROM dbo.bolmo_agreement t JOIN dbo.unit_of_measure u ON u.uom_code = t.uom_code;
UPDATE t SET t.uom_id = u.uom_id FROM dbo.bolmo_leg t JOIN dbo.unit_of_measure u ON u.uom_code = t.uom_code;
UPDATE t SET t.uom_id = u.uom_id FROM dbo.balmo_product t JOIN dbo.unit_of_measure u ON u.uom_code = t.uom_code;
UPDATE t SET t.uom_id = u.uom_id FROM dbo.settlement_price t JOIN dbo.unit_of_measure u ON u.uom_code = t.uom_code;
GO
ALTER TABLE dbo.trade_order DROP CONSTRAINT IF EXISTS fk_trade_order_uom;
ALTER TABLE dbo.trade_item DROP CONSTRAINT IF EXISTS fk_trade_item_uom;
ALTER TABLE dbo.bolmo_agreement DROP CONSTRAINT IF EXISTS fk_bolmo_agreement_uom;
ALTER TABLE dbo.bolmo_leg DROP CONSTRAINT IF EXISTS fk_bolmo_leg_uom;
ALTER TABLE dbo.balmo_product DROP CONSTRAINT IF EXISTS fk_balmo_product_uom;
ALTER TABLE dbo.settlement_price DROP CONSTRAINT IF EXISTS fk_settlement_price_uom;
ALTER TABLE dbo.trade_order DROP COLUMN IF EXISTS uom_code;
ALTER TABLE dbo.trade_item DROP COLUMN IF EXISTS uom_code;
ALTER TABLE dbo.bolmo_agreement DROP COLUMN IF EXISTS uom_code;
ALTER TABLE dbo.bolmo_leg DROP COLUMN IF EXISTS uom_code;
ALTER TABLE dbo.balmo_product DROP COLUMN IF EXISTS uom_code;
ALTER TABLE dbo.settlement_price DROP COLUMN IF EXISTS uom_code;
GO
ALTER TABLE dbo.trade_order ALTER COLUMN uom_id INT NOT NULL;
ALTER TABLE dbo.trade_item ALTER COLUMN uom_id INT NOT NULL;
ALTER TABLE dbo.bolmo_agreement ALTER COLUMN uom_id INT NOT NULL;
ALTER TABLE dbo.bolmo_leg ALTER COLUMN uom_id INT NOT NULL;
ALTER TABLE dbo.balmo_product ALTER COLUMN uom_id INT NOT NULL;
ALTER TABLE dbo.settlement_price ALTER COLUMN uom_id INT NOT NULL;
GO
ALTER TABLE dbo.trade_order ADD CONSTRAINT fk_trade_order_uom FOREIGN KEY (uom_id) REFERENCES dbo.unit_of_measure(uom_id);
ALTER TABLE dbo.trade_item ADD CONSTRAINT fk_trade_item_uom FOREIGN KEY (uom_id) REFERENCES dbo.unit_of_measure(uom_id);
ALTER TABLE dbo.bolmo_agreement ADD CONSTRAINT fk_bolmo_agreement_uom FOREIGN KEY (uom_id) REFERENCES dbo.unit_of_measure(uom_id);
ALTER TABLE dbo.bolmo_leg ADD CONSTRAINT fk_bolmo_leg_uom FOREIGN KEY (uom_id) REFERENCES dbo.unit_of_measure(uom_id);
ALTER TABLE dbo.balmo_product ADD CONSTRAINT fk_balmo_product_uom FOREIGN KEY (uom_id) REFERENCES dbo.unit_of_measure(uom_id);
ALTER TABLE dbo.settlement_price ADD CONSTRAINT fk_settlement_price_uom FOREIGN KEY (uom_id) REFERENCES dbo.unit_of_measure(uom_id);
GO

-- NULL-able columns: broker.commission_uom_code, broker_fee_agreement.uom_code,
-- trade_option_detail.strike_uom_code, trade_storage_agreement_detail
-- (capacity_uom_code, tariff_uom_code), trade_swap_detail (fixed_uom_code,
-- notional_uom_code), trade_transport_agreement_detail.capacity_uom_code,
-- trade_order_price_adjustment.adjustment_uom_code,
-- commodity_grade_standard.adjustment_uom_code — no NOT NULL restore needed.
ALTER TABLE dbo.broker ADD commission_uom_id INT NULL;
ALTER TABLE dbo.broker_fee_agreement ADD uom_id INT NULL;
ALTER TABLE dbo.trade_option_detail ADD strike_uom_id INT NULL;
ALTER TABLE dbo.trade_storage_agreement_detail ADD capacity_uom_id INT NULL;
ALTER TABLE dbo.trade_storage_agreement_detail ADD tariff_uom_id INT NULL;
ALTER TABLE dbo.trade_swap_detail ADD fixed_uom_id INT NULL;
ALTER TABLE dbo.trade_swap_detail ADD notional_uom_id INT NULL;
ALTER TABLE dbo.trade_transport_agreement_detail ADD capacity_uom_id INT NULL;
ALTER TABLE dbo.trade_order_price_adjustment ADD adjustment_uom_id INT NULL;
ALTER TABLE dbo.commodity_grade_standard ADD adjustment_uom_id INT NULL;
GO
UPDATE t SET t.commission_uom_id = u.uom_id FROM dbo.broker t JOIN dbo.unit_of_measure u ON u.uom_code = t.commission_uom_code;
UPDATE t SET t.uom_id = u.uom_id FROM dbo.broker_fee_agreement t JOIN dbo.unit_of_measure u ON u.uom_code = t.uom_code;
UPDATE t SET t.strike_uom_id = u.uom_id FROM dbo.trade_option_detail t JOIN dbo.unit_of_measure u ON u.uom_code = t.strike_uom_code;
UPDATE t SET t.capacity_uom_id = u.uom_id FROM dbo.trade_storage_agreement_detail t JOIN dbo.unit_of_measure u ON u.uom_code = t.capacity_uom_code;
UPDATE t SET t.tariff_uom_id = u.uom_id FROM dbo.trade_storage_agreement_detail t JOIN dbo.unit_of_measure u ON u.uom_code = t.tariff_uom_code;
UPDATE t SET t.fixed_uom_id = u.uom_id FROM dbo.trade_swap_detail t JOIN dbo.unit_of_measure u ON u.uom_code = t.fixed_uom_code;
UPDATE t SET t.notional_uom_id = u.uom_id FROM dbo.trade_swap_detail t JOIN dbo.unit_of_measure u ON u.uom_code = t.notional_uom_code;
UPDATE t SET t.capacity_uom_id = u.uom_id FROM dbo.trade_transport_agreement_detail t JOIN dbo.unit_of_measure u ON u.uom_code = t.capacity_uom_code;
UPDATE t SET t.adjustment_uom_id = u.uom_id FROM dbo.trade_order_price_adjustment t JOIN dbo.unit_of_measure u ON u.uom_code = t.adjustment_uom_code;
UPDATE t SET t.adjustment_uom_id = u.uom_id FROM dbo.commodity_grade_standard t JOIN dbo.unit_of_measure u ON u.uom_code = t.adjustment_uom_code;
GO
ALTER TABLE dbo.broker DROP CONSTRAINT IF EXISTS fk_broker_commission_uom;
ALTER TABLE dbo.broker_fee_agreement DROP CONSTRAINT IF EXISTS fk_broker_fee_agreement_uom;
ALTER TABLE dbo.trade_option_detail DROP CONSTRAINT IF EXISTS fk_trade_option_strike_uom;
ALTER TABLE dbo.trade_storage_agreement_detail DROP CONSTRAINT IF EXISTS fk_trade_storage_capacity_uom;
ALTER TABLE dbo.trade_storage_agreement_detail DROP CONSTRAINT IF EXISTS fk_trade_storage_tariff_uom;
ALTER TABLE dbo.trade_swap_detail DROP CONSTRAINT IF EXISTS fk_trade_swap_fixed_uom;
ALTER TABLE dbo.trade_swap_detail DROP CONSTRAINT IF EXISTS fk_trade_swap_notional_uom;
ALTER TABLE dbo.trade_transport_agreement_detail DROP CONSTRAINT IF EXISTS fk_trade_transport_capacity_uom;
ALTER TABLE dbo.trade_order_price_adjustment DROP CONSTRAINT IF EXISTS fk_price_adjustment_uom;
ALTER TABLE dbo.commodity_grade_standard DROP CONSTRAINT IF EXISTS fk_grade_standard_uom;
ALTER TABLE dbo.broker DROP COLUMN IF EXISTS commission_uom_code;
ALTER TABLE dbo.broker_fee_agreement DROP COLUMN IF EXISTS uom_code;
ALTER TABLE dbo.trade_option_detail DROP COLUMN IF EXISTS strike_uom_code;
ALTER TABLE dbo.trade_storage_agreement_detail DROP COLUMN IF EXISTS capacity_uom_code;
ALTER TABLE dbo.trade_storage_agreement_detail DROP COLUMN IF EXISTS tariff_uom_code;
ALTER TABLE dbo.trade_swap_detail DROP COLUMN IF EXISTS fixed_uom_code;
ALTER TABLE dbo.trade_swap_detail DROP COLUMN IF EXISTS notional_uom_code;
ALTER TABLE dbo.trade_transport_agreement_detail DROP COLUMN IF EXISTS capacity_uom_code;
ALTER TABLE dbo.trade_order_price_adjustment DROP COLUMN IF EXISTS adjustment_uom_code;
ALTER TABLE dbo.commodity_grade_standard DROP COLUMN IF EXISTS adjustment_uom_code;
GO
ALTER TABLE dbo.broker ADD CONSTRAINT fk_broker_commission_uom FOREIGN KEY (commission_uom_id) REFERENCES dbo.unit_of_measure(uom_id);
ALTER TABLE dbo.broker_fee_agreement ADD CONSTRAINT fk_broker_fee_agreement_uom FOREIGN KEY (uom_id) REFERENCES dbo.unit_of_measure(uom_id);
ALTER TABLE dbo.trade_option_detail ADD CONSTRAINT fk_trade_option_strike_uom FOREIGN KEY (strike_uom_id) REFERENCES dbo.unit_of_measure(uom_id);
ALTER TABLE dbo.trade_storage_agreement_detail ADD CONSTRAINT fk_trade_storage_capacity_uom FOREIGN KEY (capacity_uom_id) REFERENCES dbo.unit_of_measure(uom_id);
ALTER TABLE dbo.trade_storage_agreement_detail ADD CONSTRAINT fk_trade_storage_tariff_uom FOREIGN KEY (tariff_uom_id) REFERENCES dbo.unit_of_measure(uom_id);
ALTER TABLE dbo.trade_swap_detail ADD CONSTRAINT fk_trade_swap_fixed_uom FOREIGN KEY (fixed_uom_id) REFERENCES dbo.unit_of_measure(uom_id);
ALTER TABLE dbo.trade_swap_detail ADD CONSTRAINT fk_trade_swap_notional_uom FOREIGN KEY (notional_uom_id) REFERENCES dbo.unit_of_measure(uom_id);
ALTER TABLE dbo.trade_transport_agreement_detail ADD CONSTRAINT fk_trade_transport_capacity_uom FOREIGN KEY (capacity_uom_id) REFERENCES dbo.unit_of_measure(uom_id);
ALTER TABLE dbo.trade_order_price_adjustment ADD CONSTRAINT fk_price_adjustment_uom FOREIGN KEY (adjustment_uom_id) REFERENCES dbo.unit_of_measure(uom_id);
ALTER TABLE dbo.commodity_grade_standard ADD CONSTRAINT fk_grade_standard_uom FOREIGN KEY (adjustment_uom_id) REFERENCES dbo.unit_of_measure(uom_id);
GO

-- dbo.nomination / delivery_instruction: uom_code (V93, brand new — NOT NULL)
ALTER TABLE dbo.nomination ADD uom_id INT NULL;
ALTER TABLE dbo.delivery_instruction ADD uom_id INT NULL;
GO
UPDATE t SET t.uom_id = u.uom_id FROM dbo.nomination t JOIN dbo.unit_of_measure u ON u.uom_code = t.uom_code;
UPDATE t SET t.uom_id = u.uom_id FROM dbo.delivery_instruction t JOIN dbo.unit_of_measure u ON u.uom_code = t.uom_code;
GO
ALTER TABLE dbo.nomination DROP CONSTRAINT IF EXISTS fk_nomination_uom;
ALTER TABLE dbo.delivery_instruction DROP CONSTRAINT IF EXISTS fk_di_uom;
ALTER TABLE dbo.nomination DROP COLUMN IF EXISTS uom_code;
ALTER TABLE dbo.delivery_instruction DROP COLUMN IF EXISTS uom_code;
GO
ALTER TABLE dbo.nomination ALTER COLUMN uom_id INT NOT NULL;
ALTER TABLE dbo.delivery_instruction ALTER COLUMN uom_id INT NOT NULL;
GO
ALTER TABLE dbo.nomination ADD CONSTRAINT fk_nomination_uom FOREIGN KEY (uom_id) REFERENCES dbo.unit_of_measure(uom_id);
ALTER TABLE dbo.delivery_instruction ADD CONSTRAINT fk_di_uom FOREIGN KEY (uom_id) REFERENCES dbo.unit_of_measure(uom_id);
GO

PRINT 'V94 APPLIED: location_code -> location_id (9 columns/6 tables) and uom_code -> uom_id (~19 columns/13 tables) converted to surrogate-key FKs.';
