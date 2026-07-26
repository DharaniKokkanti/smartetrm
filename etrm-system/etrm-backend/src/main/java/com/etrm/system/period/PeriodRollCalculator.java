package com.etrm.system.period;

import com.etrm.system.common.ConflictException;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.time.temporal.IsoFields;
import java.time.temporal.TemporalAdjusters;
import java.util.Locale;

/**
 * Calendar-aware "roll one step forward" logic for the auto-generate
 * feature. Only period_types with an unambiguous calendar-label convention
 * are supported — SPOT/INTRADAY/SEASON/CROP_YEAR/CUSTOM don't have one, so
 * callers should reject those rather than call in here.
 */
final class PeriodRollCalculator {

    private PeriodRollCalculator() {
    }

    record RolledStep(String periodCode, String periodName, LocalDate periodStart, LocalDate periodEnd) {}

    static RolledStep next(String periodType, LocalDate fromStart) {
        return switch (periodType) {
            case "MONTH" -> {
                LocalDate start = fromStart.plusMonths(1).withDayOfMonth(1);
                LocalDate end = start.with(TemporalAdjusters.lastDayOfMonth());
                String mon = start.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH).toUpperCase(Locale.ENGLISH);
                String yy = String.format("%02d", start.getYear() % 100);
                yield new RolledStep(mon + "-" + yy, start.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " " + start.getYear(), start, end);
            }
            case "QUARTER" -> {
                LocalDate start = fromStart.plusMonths(3).with(IsoFields.DAY_OF_QUARTER, 1);
                LocalDate end = start.plusMonths(3).minusDays(1);
                int q = start.get(IsoFields.QUARTER_OF_YEAR);
                yield new RolledStep("Q" + q + "-" + start.getYear(), "Q" + q + " " + start.getYear(), start, end);
            }
            case "HALF_YEAR" -> {
                LocalDate start = fromStart.plusMonths(6).withDayOfMonth(1);
                start = start.getMonthValue() <= 6 ? start.withMonth(1) : start.withMonth(7);
                LocalDate end = start.plusMonths(6).minusDays(1);
                String half = start.getMonthValue() == 1 ? "H1" : "H2";
                yield new RolledStep(half + "-" + start.getYear(), half + " " + start.getYear(), start, end);
            }
            case "YEAR" -> {
                LocalDate start = fromStart.plusYears(1).withDayOfYear(1);
                LocalDate end = start.plusYears(1).minusDays(1);
                yield new RolledStep("CAL-" + start.getYear(), "Cal " + start.getYear(), start, end);
            }
            case "WEEK" -> {
                LocalDate start = fromStart.plusWeeks(1).with(java.time.DayOfWeek.MONDAY);
                LocalDate end = start.plusDays(6);
                int isoWeek = start.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
                yield new RolledStep("WK" + String.format("%02d", isoWeek) + "-" + start.getYear(), "Week " + isoWeek + " " + start.getYear(), start, end);
            }
            case "DAY" -> {
                LocalDate start = fromStart.plusDays(1);
                yield new RolledStep(start.toString(), start.toString(), start, start);
            }
            default -> throw new ConflictException(
                    "Auto-generate is not supported for period_type \"" + periodType
                            + "\" — no unambiguous calendar-label convention (use bulk create/Excel import instead).");
        };
    }
}
