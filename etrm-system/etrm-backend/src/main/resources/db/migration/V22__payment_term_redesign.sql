-- =============================================================================
-- V22 — Payment Term redesign
--
-- Replaces the naive net-days model with a full date-calculation engine
-- that covers: crude oil (BL-date), gas/power (end-of-month), metals
-- (pricing date + N business days), agricultural (invoice date) and
-- prepayment / letter-of-credit structures.
--
-- Changes:
--   1. Rename payment_days → offset_days
--   2. Add base_date_event, month_offset, fixed_day_of_month,
--      business_day_convention, discount_days, discount_pct,
--      is_default, invoice_lead_days
--   3. Re-seed with commodity-representative rows
-- =============================================================================

-- 1. Rename the existing column
EXEC sp_rename 'dbo.payment_term.payment_days', 'offset_days', 'COLUMN';
GO

-- 2. New columns
ALTER TABLE dbo.payment_term
    ADD base_date_event         VARCHAR(30)     NOT NULL DEFAULT 'INVOICE_DATE',
        month_offset            SMALLINT        NOT NULL DEFAULT 0,
        fixed_day_of_month      SMALLINT        NULL,
        business_day_convention VARCHAR(20)     NOT NULL DEFAULT 'MOD_FOLLOWING',
        discount_days           SMALLINT        NULL,
        discount_pct            DECIMAL(7,4)    NULL,   -- e.g. 0.0200 = 2 %
        is_default              BIT             NOT NULL DEFAULT 0,
        invoice_lead_days       SMALLINT        NULL    DEFAULT 0;
GO

-- 3. CHECK constraints
ALTER TABLE dbo.payment_term
    ADD CONSTRAINT chk_pt_base_event CHECK (base_date_event IN (
            'INVOICE_DATE',             -- generic / commercial
            'TRADE_DATE',               -- financial instruments
            'DELIVERY_DATE',            -- spot physical
            'END_OF_DELIVERY_MONTH',    -- pipeline gas / power (EDM)
            'BL_DATE',                  -- crude oil / LNG cargo (Bill of Lading)
            'NOR_TENDERED',             -- tankers (Notice of Readiness)
            'COMPLETION_OF_DISCHARGE',  -- product offloading complete
            'OUTTURN_DATE',             -- pipeline nomination
            'PRICING_DATE',             -- floating-price settlement (LME prompt etc.)
            'METER_READ_DATE',          -- gas / power metering
            'SETTLEMENT_DATE'           -- financial swaps / cleared instruments
        )),
        CONSTRAINT chk_pt_bdc CHECK (business_day_convention IN (
            'UNADJUSTED',               -- no adjustment
            'FOLLOWING',                -- next business day
            'MOD_FOLLOWING',            -- next BD unless crosses month-end → preceding
            'PRECEDING',                -- previous business day
            'MOD_PRECEDING'             -- previous BD unless crosses month-start → following
        ));
GO

-- 4. Update existing seed rows so they satisfy new NOT NULL columns
--    (all old rows were INVOICE_DATE + calendar days)
UPDATE dbo.payment_term
SET    base_date_event         = 'INVOICE_DATE',
       month_offset            = 0,
       business_day_convention = 'MOD_FOLLOWING',
       is_default              = 0;
GO

-- 5. Re-seed: clear the old generic rows and insert commodity-representative terms
DELETE FROM dbo.payment_term;
GO

-- Reseed IDENTITY so IDs start from 1
DBCC CHECKIDENT ('dbo.payment_term', RESEED, 0);
GO

-- term_code | term_name | base_date_event | month_offset | offset_days | fixed_dom |
-- days_basis | bdc | calendar_id | disc_days | disc_pct | pay_method | inv_lead | is_default | description
INSERT INTO dbo.payment_term
    (term_code, term_name,
     base_date_event,  month_offset, offset_days, fixed_day_of_month,
     days_basis, business_day_convention, calendar_id,
     discount_days, discount_pct, payment_method, invoice_lead_days,
     is_default, description)
VALUES
-- ── Generic / Commercial ─────────────────────────────────────────────────────
('NET_30',          'Net 30 Calendar Days',
 'INVOICE_DATE',    0, 30, NULL,
 'CALENDAR', 'MOD_FOLLOWING', NULL,
 NULL, NULL, 'WIRE', 0,
 1,   'Payment due 30 calendar days from invoice date. System default.'),

('NET_45',          'Net 45 Calendar Days',
 'INVOICE_DATE',    0, 45, NULL,
 'CALENDAR', 'MOD_FOLLOWING', NULL,
 NULL, NULL, 'WIRE', 0,
 0,   'Payment due 45 calendar days from invoice date.'),

('NET_60',          'Net 60 Calendar Days',
 'INVOICE_DATE',    0, 60, NULL,
 'CALENDAR', 'MOD_FOLLOWING', NULL,
 NULL, NULL, 'WIRE', 0,
 0,   'Extended payment terms — agricultural bulk and long-haul trades.'),

('NET_5_BIZ',       'Net 5 Business Days',
 'INVOICE_DATE',    0, 5, NULL,
 'BUSINESS', 'MOD_FOLLOWING', NULL,
 NULL, NULL, 'WIRE', 0,
 0,   'Payment 5 business days from invoice date.'),

('NET_10_BIZ',      'Net 10 Business Days',
 'INVOICE_DATE',    0, 10, NULL,
 'BUSINESS', 'MOD_FOLLOWING', NULL,
 NULL, NULL, 'WIRE', 0,
 0,   'Payment 10 business days from invoice date.'),

('2_10_NET_30',     '2% / 10 Net 30',
 'INVOICE_DATE',    0, 30, NULL,
 'CALENDAR', 'MOD_FOLLOWING', NULL,
 10, 0.0200, 'WIRE', 0,
 0,   '2 % early payment discount if settled within 10 days; otherwise net 30.'),

-- ── Crude Oil & LNG (BL date base) ───────────────────────────────────────────
('BL_PLUS_30',      'BL Date +30 Calendar Days',
 'BL_DATE',         0, 30, NULL,
 'CALENDAR', 'MOD_FOLLOWING', NULL,
 NULL, NULL, 'WIRE', 0,
 0,   'Crude oil standard — 30 calendar days from Bill of Lading date.'),

('BL_PLUS_45',      'BL Date +45 Calendar Days',
 'BL_DATE',         0, 45, NULL,
 'CALENDAR', 'MOD_FOLLOWING', NULL,
 NULL, NULL, 'WIRE', 0,
 0,   'LNG cargo standard — 45 calendar days from Bill of Lading date.'),

('BL_PLUS_5_BIZ',   'BL Date +5 Business Days',
 'BL_DATE',         0, 5, NULL,
 'BUSINESS', 'MOD_FOLLOWING', NULL,
 NULL, NULL, 'WIRE', 0,
 0,   'Product cargoes — 5 business days from B/L date.'),

('NOR_PLUS_7_BIZ',  'NOR Tendered +7 Business Days',
 'NOR_TENDERED',    0, 7, NULL,
 'BUSINESS', 'MOD_FOLLOWING', NULL,
 NULL, NULL, 'WIRE', 0,
 0,   'Tanker demurrage / outturn — 7 business days from Notice of Readiness.'),

-- ── Natural Gas / Power (End-of-Delivery-Month base) ─────────────────────────
('M_PLUS_20',       'EDM +20 Calendar Days',
 'END_OF_DELIVERY_MONTH', 0, 20, NULL,
 'CALENDAR', 'MOD_FOLLOWING', NULL,
 NULL, NULL, 'WIRE', 0,
 0,   'Gas pipeline — 20 calendar days after end of delivery month.'),

('M1_DOM_20',       '20th of Month Following Delivery',
 'END_OF_DELIVERY_MONTH', 1, 0, 20,
 'CALENDAR', 'MOD_FOLLOWING', NULL,
 NULL, NULL, 'WIRE', 0,
 0,   'Power — fixed 20th of the month following the delivery month.'),

('M1_DOM_25',       '25th of Month Following Delivery',
 'END_OF_DELIVERY_MONTH', 1, 0, 25,
 'CALENDAR', 'MOD_FOLLOWING', NULL,
 NULL, NULL, 'WIRE', 0,
 0,   'Gas — fixed 25th of the month following the delivery month.'),

('NETTING_EFET',    'EFET Monthly Netting',
 'END_OF_DELIVERY_MONTH', 1, 0, NULL,
 'BUSINESS', 'MOD_FOLLOWING', NULL,
 NULL, NULL, 'NETTING', 0,
 0,   'EFET bilateral netting — net position settled at start of following month.'),

-- ── Metals (LME / COMEX pricing-date base) ───────────────────────────────────
('LME_2_BIZ',       'LME Prompt +2 Business Days',
 'PRICING_DATE',    0, 2, NULL,
 'BUSINESS', 'MOD_FOLLOWING', 4,  -- LME calendar
 NULL, NULL, 'WIRE', 0,
 0,   'LME standard — payment 2 business days after the pricing / prompt date.'),

('COMEX_1_BIZ',     'COMEX Settlement +1 Business Day',
 'SETTLEMENT_DATE', 0, 1, NULL,
 'BUSINESS', 'MOD_FOLLOWING', 3,  -- NYMEX calendar
 NULL, NULL, 'WIRE', 0,
 0,   'COMEX / NYMEX cleared metals — T+1 business day settlement.'),

-- ── Prepayment & Letters of Credit ───────────────────────────────────────────
('PREPAY_3D',       'Prepayment 3 Days Prior',
 'DELIVERY_DATE',   0, -3, NULL,
 'CALENDAR', 'MOD_PRECEDING', NULL,
 NULL, NULL, 'WIRE', -3,
 0,   'Payment required 3 calendar days before delivery — high-risk counterparties.'),

('LC_AT_SIGHT',     'Letter of Credit at Sight',
 'BL_DATE',         0, 7, NULL,
 'BUSINESS', 'MOD_FOLLOWING', NULL,
 NULL, NULL, 'LETTER_OF_CREDIT', 0,
 0,   'Documentary LC payable at sight — typically 5-7 banking days after presentation.'),

('LC_90',           'Letter of Credit 90 Days Usance',
 'BL_DATE',         0, 90, NULL,
 'CALENDAR', 'MOD_FOLLOWING', NULL,
 NULL, NULL, 'LETTER_OF_CREDIT', 0,
 0,   '90-day usance LC — deferred payment letter of credit from B/L date.'),

('BG_30',           'Bank Guarantee 30 Days',
 'DELIVERY_DATE',   0, 30, NULL,
 'CALENDAR', 'MOD_FOLLOWING', NULL,
 NULL, NULL, 'BANK_GUARANTEE', 0,
 0,   'Payment backed by bank guarantee, due 30 calendar days from delivery.');
GO
