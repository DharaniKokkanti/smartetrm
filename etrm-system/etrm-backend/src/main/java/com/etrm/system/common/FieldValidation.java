package com.etrm.system.common;

import java.util.regex.Pattern;

/**
 * Shared input-validation building blocks for every write path in the app —
 * used by {@code ReferenceDataCrudService} (the generic Tier 2 reference-data
 * write path, covering every registered table) and intended for every
 * bespoke feature controller/service too (Products, Trades, Counterparties,
 * etc.) — a new endpoint that accepts a free-text or numeric field should
 * call {@link #assertSafeText} / {@link #assertWholeNumber} here rather than
 * writing its own regex.
 * <p>
 * This is the real gate — the frontend equivalent
 * ({@code components/smart/fieldValidation.ts}, used by both
 * {@code ReferenceDataTable.tsx} and bespoke feature forms) is a UX nicety
 * only. A client calling the API directly (Postman, a script, a future
 * non-browser integration) never passes through the frontend at all, so the
 * server-side check here is what actually stops a bad value reaching the
 * database.
 */
public final class FieldValidation {

    private FieldValidation() {}

    // A leading -/=/+/@ turns a text value into an executable formula the
    // moment it's opened in Excel/Sheets — a real risk since most reference
    // tables and several feature pages support CSV/Excel import/export.
    // `< > `` ` are blocked anywhere in the value, not just leading, since
    // they're how stored text turns into markup/code if ever rendered
    // unescaped or interpolated somewhere down the line. Everything else —
    // apostrophes, ampersands, accented characters, currency symbols,
    // ordinary punctuation — stays allowed; counterparty/product names and
    // free-text notes legitimately use them.
    private static final Pattern UNSAFE_LEADING = Pattern.compile("^[-=+@]");
    private static final Pattern UNSAFE_ANYWHERE = Pattern.compile("[<>`]");
    private static final Pattern INTEGER_STRING = Pattern.compile("^-?\\d+$");

    /** Throws IllegalArgumentException (mapped to 400 Bad Request by
     *  GlobalExceptionHandler) if the value starts with a spreadsheet-formula
     *  trigger character or contains a markup-shaped character. Blank/null
     *  values pass — pair with a separate not-null/required check. */
    public static void assertSafeText(String fieldLabel, String value) {
        if (value == null || value.isBlank()) return;
        if (UNSAFE_LEADING.matcher(value).find()) {
            throw new IllegalArgumentException(fieldLabel
                    + " can't start with -, =, +, or @ (blocked to prevent spreadsheet formula injection on export).");
        }
        if (UNSAFE_ANYWHERE.matcher(value).find()) {
            throw new IllegalArgumentException(fieldLabel + " can't contain the characters < > or `.");
        }
    }

    /** Throws IllegalArgumentException if the value isn't a whole number —
     *  accepts a Number (rejects a fractional double/float) or a numeric
     *  String. Null passes — pair with a separate not-null/required check. */
    public static void assertWholeNumber(String fieldLabel, Object value) {
        if (value == null) return;
        if (value instanceof Number n) {
            double d = n.doubleValue();
            if (Double.isNaN(d) || Double.isInfinite(d) || d != Math.floor(d)) {
                throw new IllegalArgumentException(fieldLabel + " must be a whole number.");
            }
        } else if (value instanceof String s && !s.isBlank() && !INTEGER_STRING.matcher(s).matches()) {
            throw new IllegalArgumentException(fieldLabel + " must be a whole number.");
        }
    }
}
