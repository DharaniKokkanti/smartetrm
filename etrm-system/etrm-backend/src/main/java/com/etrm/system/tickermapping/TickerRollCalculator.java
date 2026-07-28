package com.etrm.system.tickermapping;

import java.time.LocalDate;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Rolls a single ticker string forward to a target period's contract month,
 * for the auto-generate feature. Only tickers that follow the standard
 * root-symbol + month-code + 2-digit-year convention (e.g. CLG26) can be
 * mechanically rolled — a Platts assessment code (PCAAS00) or a Bloomberg
 * continuous ticker (CL1 Comdty) doesn't have a month/year to advance, so
 * roll() returns null for those rather than guessing.
 */
final class TickerRollCalculator {

    private TickerRollCalculator() {
    }

    private static final Map<Integer, Character> MONTH_CODES = Map.ofEntries(
            Map.entry(1, 'F'), Map.entry(2, 'G'), Map.entry(3, 'H'), Map.entry(4, 'J'),
            Map.entry(5, 'K'), Map.entry(6, 'M'), Map.entry(7, 'N'), Map.entry(8, 'Q'),
            Map.entry(9, 'U'), Map.entry(10, 'V'), Map.entry(11, 'X'), Map.entry(12, 'Z'));

    private static final Pattern TENOR_SUFFIX = Pattern.compile("^(.*?)([FGHJKMNQUVXZ])(\\d{2})$");

    /** Returns the rolled ticker for targetPeriodStart's month/year, or null if anchorTicker doesn't follow the root+month-code+year convention. */
    static String roll(String anchorTicker, LocalDate targetPeriodStart) {
        if (anchorTicker == null || targetPeriodStart == null) {
            return null;
        }
        Matcher m = TENOR_SUFFIX.matcher(anchorTicker.trim());
        if (!m.matches()) {
            return null;
        }
        String root = m.group(1);
        char code = MONTH_CODES.get(targetPeriodStart.getMonthValue());
        String yy = String.format("%02d", targetPeriodStart.getYear() % 100);
        return root + code + yy;
    }
}
