-- =============================================================================
-- V92 — credit_term / holiday_calendar seed data parity with the live frontend
-- =============================================================================
-- V91 added trade.credit_term_code -> credit_term.term_code and
-- trade.payment_calendar_code -> holiday_calendar.calendar_code FKs, which
-- surfaced a pre-existing, three-way data-parity gap: the backend seed codes,
-- the frontend's live Static Data "Credit Terms" CRUD page
-- (referenceData.ts's credit_term mock, path /static-data/credit_term), and
-- the Trade Blotter's own creditTermCode dropdown/mock trade seed data
-- (NET_30, NET_14, ...) all used different, non-overlapping code vocabularies.
--
-- credit_term: the backend's old 8 rows (OPEN_30, SECURED_LC, NETTING_ISDA,
-- ...) are replaced with the union of what the Trade Blotter dropdown
-- (NET_7..NET_90, PREPAY, CASH_ON_DELIVERY) and the Static Data page
-- (LC_BACKED, PARENT_GUAR, ISDA_CSA_STD) actually offer — the Trade Blotter
-- and its mock trade seed data (which already used NET_30/NET_14) needed no
-- changes; only the backend and the Static Data page's own mock needed to
-- converge onto this superset. No FK/seed data referenced the old
-- credit_term_id values (checked), so DELETE + re-INSERT is safe.
--
-- holiday_calendar: no rename needed here (backend's codes were already
-- correct/richer) — this migration only adds ECB_TARGET, a real, legitimately
-- missing EUR TARGET2 calendar the frontend's dedicated Holiday Calendars
-- page (holidayCalendarsStore) already referenced but the backend never had.
-- The frontend's own LON/NYC/NYMEX/LME/ECB/ICE-EU codes are being renamed
-- (in the same frontend change as this migration) to match these backend
-- codes, not the other way around.
-- =============================================================================
USE ETRM_DB;
GO

-- ── credit_term: replace with the reconciled superset ──────────────────────────
DELETE FROM dbo.credit_term WHERE term_code IN (
  'OPEN_30','OPEN_45','OPEN_60','SECURED_LC','SECURED_BG','PREPAID','NETTING_ISDA','NETTING_EFET'
);
GO

INSERT INTO dbo.credit_term (term_code, term_name, credit_period_days, collateral_type, margin_call_threshold, margin_call_currency, netting_eligible, requires_isda, description, is_active)
VALUES
    ('NET_7',           'Net 7 Days',                    7,  'NONE',              NULL,     'USD', 0, 0, 'Open unsecured credit, due 7 days from invoice.',                                   1),
    ('NET_14',          'Net 14 Days',                   14, 'NONE',              NULL,     'USD', 0, 0, 'Open unsecured credit, due 14 days from invoice.',                                  1),
    ('NET_30',          'Net 30 Days',                   30, 'NONE',              NULL,     'USD', 0, 0, 'Open unsecured credit, due 30 days from invoice.',                                  1),
    ('NET_45',          'Net 45 Days',                   45, 'NONE',              NULL,     'USD', 0, 0, 'Open unsecured credit, due 45 days from invoice.',                                  1),
    ('NET_60',          'Net 60 Days',                   60, 'NONE',              NULL,     'USD', 0, 0, 'Open unsecured credit, due 60 days from invoice.',                                  1),
    ('NET_90',          'Net 90 Days',                   90, 'NONE',              NULL,     'USD', 0, 0, 'Open unsecured credit, due 90 days from invoice.',                                  1),
    ('PREPAY',          'Prepaid — No Credit',           0,  'CASH',              NULL,     'USD', 0, 0, 'Full payment required before delivery/execution — no open credit exposure.',       1),
    ('CASH_ON_DELIVERY','Cash on Delivery',              0,  'CASH',              NULL,     'USD', 0, 0, 'Payment due concurrent with delivery — no open credit exposure.',                  1),
    ('LC_BACKED',       'Letter of Credit Backed',       0,  'LETTER_OF_CREDIT',  NULL,     'USD', 0, 0, 'Fully secured by a standby or documentary LC — no open credit exposure.',          1),
    ('PARENT_GUAR',     'Parent Guarantee Backed',       30, 'PARENT_GUARANTEE',  NULL,     'USD', 0, 0, 'Credit period extended on the strength of a parent company guarantee.',            1),
    ('ISDA_CSA_STD',    'ISDA/CSA Standard Margined',    2,  'CASH',              250000.00,'USD', 1, 1, 'Daily-margined facility under an ISDA Master Agreement + CSA.',                    1);
GO

-- ── holiday_calendar: add the EUR TARGET2 calendar the frontend already refs ───
IF NOT EXISTS (SELECT 1 FROM dbo.holiday_calendar WHERE calendar_code = 'ECB_TARGET')
  INSERT INTO dbo.holiday_calendar (calendar_code, calendar_name, country_code, commodity_type)
  VALUES ('ECB_TARGET', 'ECB TARGET2 Payment System Holidays', NULL, NULL);
GO

PRINT 'V92 APPLIED: credit_term reconciled to an 11-row superset (was 8 mismatched rows); holiday_calendar gained ECB_TARGET.';
