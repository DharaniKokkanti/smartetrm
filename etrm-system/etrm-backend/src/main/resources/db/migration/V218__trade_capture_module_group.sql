-- V218: master_data_table_registry.module_group data-quality fix -- the 23
-- real Trade Capture tables (trade header/order/item + all commodity-detail
-- and order-support tables) were tagged 'Organization & Users', which is a
-- catch-all bucket (84 rows) they were never meant to sit under. They never
-- got their own module_group when first registered.
--
-- trade_pricing_schedule / trade_pricing_schedule_history stay under
-- 'Pricing & Rates' and trade_repository stays under
-- 'Sanctions & Regulatory Reporting' -- both already correctly tagged.
-- trader / trader_commodity_limit are left under 'Organization & Users' --
-- they describe a person/personnel limit, not trade-transaction data, so
-- that tag is already correct for them.
--
-- Found during the 2026-08-13 registry review while walking Trade Capture's
-- DB tables session-by-session.

USE ETRM_DB;
GO

UPDATE dbo.master_data_table_registry
SET module_group = 'Trade Capture',
    updated_at = SYSUTCDATETIME(),
    updated_by = 'flyway_migration',
    row_version = row_version + 1
WHERE table_name IN (
    'trade',
    'trade_item',
    'trade_order',
    'trade_history',
    'trade_agri_detail',
    'trade_freight_detail',
    'trade_lng_detail',
    'trade_metals_detail',
    'trade_oil_detail',
    'trade_power_detail',
    'trade_option_detail',
    'trade_swap_detail',
    'trade_storage_agreement_detail',
    'trade_transport_agreement_detail',
    'trade_transmission_right_detail',
    'trade_order_assay_result',
    'trade_order_balmo',
    'trade_order_tas',
    'trade_order_cost',
    'trade_order_price_adjustment',
    'trade_order_custom_field_value',
    'trade_cost',
    'trade_custom_field_value'
);
GO
