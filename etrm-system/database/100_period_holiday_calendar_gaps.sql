-- =============================================================================
-- V100 — Calendar & Periods: closes the frontend-vs-schema gaps found while
-- building PeriodController/HolidayCalendarController (zero backend existed
-- for either table before this — same class of gap as currency/country).
-- =============================================================================
-- dbo.period was missing 5 columns the already-built PeriodsPage.tsx form
-- uses: a physical delivery window distinct from the pricing period (real
-- ETRM concept — e.g. crude prices in month N, delivers in month N+1 on a
-- laytime basis), pricing/settlement calendar links, and an OPEN/CLOSED/
-- LOCKED/ARCHIVED lifecycle status gating whether a period can still be
-- edited/deactivated.
--
-- pricing_calendar_code/settlement_calendar_code FK on holiday_calendar's
-- natural key (calendar_code, already UNIQUE via uq_holiday_cal_code) rather
-- than a surrogate id — deliberate exception to the app's usual id-FK
-- convention, because the frontend already treats these as short reference
-- codes (LON/NYC/LME) and rebuilding that as an id-based <Select> here would
-- be a larger, separate frontend change than this backend-gap fix warrants.
--
-- dbo.holiday_calendar was missing calendar_type (BANKING/COMMODITY/
-- EXCHANGE/CUSTOM — a real, currently-used field; distinct from the
-- existing unused legacy commodity_type VARCHAR column, left alone),
-- currency_id (frontend's currencyCode — added as an id FK to match this
-- app's established surrogate-key convention, e.g. legal_entity.base_currency_id;
-- frontend Currency.countryId already set this precedent), and created_at.
--
-- dbo.calendar_holiday didn't exist at all — the actual list of holiday
-- dates per calendar, which is the entire point of a holiday calendar
-- feature. New child table.
-- =============================================================================

ALTER TABLE dbo.period ADD delivery_start_date DATE NULL;
GO
ALTER TABLE dbo.period ADD delivery_end_date DATE NULL;
GO
ALTER TABLE dbo.period ADD pricing_calendar_code VARCHAR(20) NULL;
GO
ALTER TABLE dbo.period ADD CONSTRAINT fk_period_pricing_cal FOREIGN KEY (pricing_calendar_code) REFERENCES dbo.holiday_calendar(calendar_code);
GO
ALTER TABLE dbo.period ADD settlement_calendar_code VARCHAR(20) NULL;
GO
ALTER TABLE dbo.period ADD CONSTRAINT fk_period_settlement_cal FOREIGN KEY (settlement_calendar_code) REFERENCES dbo.holiday_calendar(calendar_code);
GO
ALTER TABLE dbo.period ADD status_code VARCHAR(20) NOT NULL
    CONSTRAINT df_period_status DEFAULT 'OPEN'
    CONSTRAINT chk_period_status CHECK (status_code IN ('OPEN','CLOSED','LOCKED','ARCHIVED'));
GO

ALTER TABLE dbo.holiday_calendar ADD calendar_type VARCHAR(20) NOT NULL
    CONSTRAINT df_holiday_cal_type DEFAULT 'CUSTOM'
    CONSTRAINT chk_holiday_cal_type CHECK (calendar_type IN ('BANKING','COMMODITY','EXCHANGE','CUSTOM'));
GO
ALTER TABLE dbo.holiday_calendar ADD currency_id INT NULL;
GO
ALTER TABLE dbo.holiday_calendar ADD CONSTRAINT fk_holiday_cal_currency FOREIGN KEY (currency_id) REFERENCES dbo.currency(currency_id);
GO
ALTER TABLE dbo.holiday_calendar ADD created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME();
GO

CREATE TABLE dbo.calendar_holiday (
    holiday_id              INT             NOT NULL IDENTITY(1,1),
    calendar_id             INT             NOT NULL,
    holiday_date            DATE            NOT NULL,
    holiday_name            VARCHAR(200)    NOT NULL,
    is_settlement_holiday   BIT             NOT NULL DEFAULT 1,
    is_trading_holiday      BIT             NOT NULL DEFAULT 1,

    CONSTRAINT pk_calendar_holiday          PRIMARY KEY (holiday_id),
    CONSTRAINT fk_calendar_holiday_calendar FOREIGN KEY (calendar_id) REFERENCES dbo.holiday_calendar(calendar_id),
    CONSTRAINT uq_calendar_holiday_date     UNIQUE (calendar_id, holiday_date)
);
GO

PRINT '============================================================';
PRINT 'V100 — CALENDAR & PERIODS SCHEMA GAPS CLOSED';
PRINT '  dbo.period: +delivery_start/end_date, +pricing/settlement_calendar_code,';
PRINT '  +status_code (OPEN/CLOSED/LOCKED/ARCHIVED).';
PRINT '  dbo.holiday_calendar: +calendar_type, +currency_id, +created_at.';
PRINT '  dbo.calendar_holiday: new table — the actual holiday dates.';
PRINT '============================================================';
GO
