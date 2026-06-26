package com.etrm.system.referencedata;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Tier 2's generic CRUD goes through raw JdbcTemplate, not JPA — so unlike
 * every hand-mapped entity elsewhere in this codebase (where @Column names
 * handle the conversion), here the snake_case <-> camelCase translation
 * between SQL Server columns and the JSON the frontend expects has to be
 * done explicitly.
 */
final class NameUtils {

    private static final Pattern SNAKE_BOUNDARY = Pattern.compile("_([a-z0-9])");
    private static final Pattern CAMEL_BOUNDARY = Pattern.compile("([a-z0-9])([A-Z])");

    private NameUtils() {}

    static String toCamelCase(String snakeCase) {
        Matcher m = SNAKE_BOUNDARY.matcher(snakeCase);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            m.appendReplacement(sb, m.group(1).toUpperCase());
        }
        m.appendTail(sb);
        return sb.toString();
    }

    static String toSnakeCase(String camelCase) {
        Matcher m = CAMEL_BOUNDARY.matcher(camelCase);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            m.appendReplacement(sb, m.group(1) + "_" + m.group(2).toLowerCase());
        }
        m.appendTail(sb);
        return sb.toString().toLowerCase();
    }

    /** Converts a row map keyed by snake_case SQL column names into one
     *  keyed by camelCase, for JSON serialization. */
    static Map<String, Object> rowToCamelCase(Map<String, Object> row) {
        Map<String, Object> out = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : row.entrySet()) {
            out.put(toCamelCase(entry.getKey()), entry.getValue());
        }
        return out;
    }
}
