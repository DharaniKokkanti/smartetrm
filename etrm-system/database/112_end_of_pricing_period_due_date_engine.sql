-- =============================================================================
-- V112 — END_OF_PRICING_PERIOD base date event + payment due-date calc engine
--
-- Customer ask (SPOT deals): invoice due 3 calendar days after the last day
-- of the pricing period, not after BL date / invoice date. payment_term
-- already has the full date-calculation column set (V22/V23) but had no
-- event anchored to trade_pricing_schedule.pricing_period_end, and no
-- calculation engine actually consumed the columns (schema-only until now —
-- see PaymentDueDateCalculator.java for the engine).
--
-- Changes:
--   1. Add 'END_OF_PRICING_PERIOD' to base_date_event_type lookup (drives UI dropdown)
--   2. Widen payment_term.chk_pt_base_event CHECK to allow the new value
--   3. Seed a representative SPOT payment term using it
-- =============================================================================

-- 1. Lookup row (UI dropdown source — PaymentTermsPage.tsx reads this table)
IF NOT EXISTS (SELECT 1 FROM dbo.base_date_event_type WHERE type_code = 'END_OF_PRICING_PERIOD')
BEGIN
    INSERT INTO dbo.base_date_event_type
        (type_code, type_name, description, applicable_commodity, sort_order)
    VALUES
    ('END_OF_PRICING_PERIOD', 'End of Pricing Period',
     'Payment date anchored to the last fixing date of the trade''s pricing period (trade_pricing_schedule.pricing_period_end) — not the BL/delivery date. Used for SPOT deals priced over an averaging window.',
     'Oil, Metals, SPOT', 55);
END
GO

-- 2. CHECK constraint — drop and recreate with the new value
ALTER TABLE dbo.payment_term DROP CONSTRAINT chk_pt_base_event;
GO

ALTER TABLE dbo.payment_term
    ADD CONSTRAINT chk_pt_base_event CHECK (base_date_event IN (
            'INVOICE_DATE',
            'TRADE_DATE',
            'DELIVERY_DATE',
            'END_OF_DELIVERY_MONTH',
            'BL_DATE',
            'NOR_TENDERED',
            'COMPLETION_OF_DISCHARGE',
            'OUTTURN_DATE',
            'PRICING_DATE',
            'END_OF_PRICING_PERIOD',
            'METER_READ_DATE',
            'SETTLEMENT_DATE'
        ));
GO

-- 3. Seed row — SPOT deal, 3 calendar days after last day of pricing period
IF NOT EXISTS (SELECT 1 FROM dbo.payment_term WHERE term_code = 'PRICING_END_PLUS_3')
BEGIN
    INSERT INTO dbo.payment_term
        (term_code, term_name,
         base_date_event,        month_offset, offset_days, fixed_day_of_month,
         days_basis, business_day_convention, calendar_id,
         discount_days, discount_pct, payment_method, invoice_lead_days,
         is_default, description)
    SELECT
        'PRICING_END_PLUS_3', 'Pricing Period End +3 Calendar Days',
        'END_OF_PRICING_PERIOD', 0, 3, NULL,
        'CALENDAR', 'MOD_FOLLOWING', NULL,
        NULL, NULL, pm.payment_method_id, 0,
        0, 'SPOT — payment due 3 calendar days after the last day of the pricing period (pricing_period_end), not BL/delivery date.'
    FROM dbo.payment_method pm
    WHERE pm.type_code = 'WIRE';
END
GO
