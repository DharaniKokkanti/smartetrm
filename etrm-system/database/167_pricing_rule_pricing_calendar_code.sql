-- =============================================================================
-- V167 — dbo.pricing_rule was missing pricing_calendar_code, a field
-- PricingRulesPage.tsx has always had a form/grid slot for but which the
-- backend entity mapped as @Transient (always null, silently dropped on
-- save) — same class of gap as V100's period.pricing_calendar_code.
--
-- Same deliberate exception as V100: FK on holiday_calendar's natural key
-- (calendar_code) rather than a surrogate id, since the frontend already
-- treats this as a short reference code and the dropdown was just wired to
-- source options from holiday_calendar.calendar_code.
-- =============================================================================

ALTER TABLE dbo.pricing_rule ADD pricing_calendar_code VARCHAR(20) NULL;
GO
ALTER TABLE dbo.pricing_rule ADD CONSTRAINT fk_pricing_rule_pricing_cal FOREIGN KEY (pricing_calendar_code) REFERENCES dbo.holiday_calendar(calendar_code);
GO

PRINT '============================================================';
PRINT 'V167 — dbo.pricing_rule: +pricing_calendar_code (FK to holiday_calendar.calendar_code).';
PRINT '============================================================';
GO
