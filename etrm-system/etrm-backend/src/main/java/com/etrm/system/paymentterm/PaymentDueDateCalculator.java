package com.etrm.system.paymentterm;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Set;

/**
 * The date-calculation engine the V22 migration comment promised but never shipped —
 * payment_term was previously CRUD-only master data with nothing consuming
 * base_date_event/offset_days/business_day_convention.
 *
 * Order of operations (matches the formula shown in PaymentTermsPage.tsx's tooltip):
 *   1. Start from the resolved base date (caller resolves which event → which date,
 *      e.g. END_OF_PRICING_PERIOD → trade_pricing_schedule.pricing_period_end).
 *   2. Add monthOffset whole months.
 *   3. Either snap to fixedDayOfMonth, or add offsetDays (calendar or business days).
 *   4. Roll the result per businessDayConvention if it lands on a holiday/weekend.
 */
public final class PaymentDueDateCalculator {

    private PaymentDueDateCalculator() {
    }

    public static LocalDate calculate(PaymentTerm term, LocalDate baseDate, Set<LocalDate> holidays) {
        if (baseDate == null) {
            throw new IllegalArgumentException("baseDate is required to calculate a payment due date.");
        }

        LocalDate date = baseDate.plusMonths(term.getMonthOffset());

        if (term.getFixedDayOfMonth() != null) {
            YearMonth ym = YearMonth.from(date);
            int day = Math.min(term.getFixedDayOfMonth(), ym.lengthOfMonth());
            date = ym.atDay(day);
        } else {
            int offset = term.getOffsetDays();
            date = "BUSINESS".equals(term.getDaysBasis())
                    ? addBusinessDays(date, offset, holidays)
                    : date.plusDays(offset);
        }

        return applyBusinessDayConvention(date, term.getBusinessDayConvention(), holidays);
    }

    private static LocalDate addBusinessDays(LocalDate date, int days, Set<LocalDate> holidays) {
        int step = days >= 0 ? 1 : -1;
        int remaining = Math.abs(days);
        LocalDate result = date;
        while (remaining > 0) {
            result = result.plusDays(step);
            if (isBusinessDay(result, holidays)) {
                remaining--;
            }
        }
        return result;
    }

    private static LocalDate applyBusinessDayConvention(LocalDate date, String convention, Set<LocalDate> holidays) {
        if ("UNADJUSTED".equals(convention) || isBusinessDay(date, holidays)) {
            return date;
        }
        return switch (convention) {
            case "FOLLOWING" -> nextBusinessDay(date, holidays);
            case "PRECEDING" -> previousBusinessDay(date, holidays);
            case "MOD_FOLLOWING" -> {
                LocalDate rolled = nextBusinessDay(date, holidays);
                yield rolled.getMonthValue() == date.getMonthValue()
                        ? rolled : previousBusinessDay(date, holidays);
            }
            case "MOD_PRECEDING" -> {
                LocalDate rolled = previousBusinessDay(date, holidays);
                yield rolled.getMonthValue() == date.getMonthValue()
                        ? rolled : nextBusinessDay(date, holidays);
            }
            default -> date;
        };
    }

    private static LocalDate nextBusinessDay(LocalDate date, Set<LocalDate> holidays) {
        LocalDate d = date;
        do {
            d = d.plusDays(1);
        } while (!isBusinessDay(d, holidays));
        return d;
    }

    private static LocalDate previousBusinessDay(LocalDate date, Set<LocalDate> holidays) {
        LocalDate d = date;
        do {
            d = d.minusDays(1);
        } while (!isBusinessDay(d, holidays));
        return d;
    }

    private static boolean isBusinessDay(LocalDate date, Set<LocalDate> holidays) {
        DayOfWeek dow = date.getDayOfWeek();
        return dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY && !holidays.contains(date);
    }
}
