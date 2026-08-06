package com.etrm.system.referencedata;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Queries INFORMATION_SCHEMA + sys.check_constraints + sys.foreign_keys
 * directly rather than hand-maintaining metadata per table — this is the
 * mechanism described in the Master Data Entry Technical Design doc,
 * Section 3: adding a Tier 2 table is a registry row, not new code, BECAUSE
 * this service derives the rest from the schema itself.
 *
 * NOTE: this is SQL Server-specific T-SQL (sys.* catalog views) and cannot
 * be exercised against the H2 dev profile — see application-dev.yml.
 */
@Service
public class ReferenceDataMetadataService {

    private final JdbcTemplate jdbc;

    public ReferenceDataMetadataService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public TableMetadata getMetadata(String tableName, String displayName) {
        String primaryKeyColumn = findPrimaryKeyColumn(tableName);
        Map<String, List<String>> enumsByColumn = findCheckEnums(tableName);
        Map<String, String> fkTargetsByColumn = findForeignKeys(tableName);
        boolean isTemporal = isTemporalTable(tableName);

        List<ColumnMetadata> columns = new ArrayList<>();
        List<Map<String, Object>> rawColumns = jdbc.queryForList("""
                SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = ?
                ORDER BY ORDINAL_POSITION
                """, tableName);

        for (Map<String, Object> col : rawColumns) {
            String sqlColumnName = (String) col.get("COLUMN_NAME");
            String camelName = NameUtils.toCamelCase(sqlColumnName);
            String dataType = ((String) col.get("DATA_TYPE")).toLowerCase();
            boolean nullable = "YES".equalsIgnoreCase((String) col.get("IS_NULLABLE"));
            Object maxLenObj = col.get("CHARACTER_MAXIMUM_LENGTH");
            Integer maxLength = maxLenObj == null ? null : ((Number) maxLenObj).intValue();
            boolean isPk = sqlColumnName.equalsIgnoreCase(primaryKeyColumn);

            String kind;
            String numericSubKind = null;
            List<String> enumValues = enumsByColumn.get(sqlColumnName);
            String fkTarget = fkTargetsByColumn.get(sqlColumnName);

            if (fkTarget != null) {
                kind = "foreign_key";
            } else if (enumValues != null && !enumValues.isEmpty()) {
                kind = "enum";
            } else if (dataType.contains("bit")) {
                kind = "boolean";
            } else if (dataType.contains("date") || dataType.contains("time")) {
                kind = "date";
            } else if (isIntegerType(dataType)) {
                kind = "number";
                numericSubKind = "integer";
            } else if (isDecimalType(dataType)) {
                kind = "number";
                numericSubKind = "decimal";
            } else {
                kind = "string";
            }

            columns.add(new ColumnMetadata(
                    camelName,
                    humanizeLabel(sqlColumnName, !isPk),
                    kind,
                    isPk,
                    nullable,
                    maxLength,
                    enumValues,
                    fkTarget,
                    numericSubKind
            ));
        }

        return new TableMetadata(
                tableName,
                displayName,
                NameUtils.toCamelCase(primaryKeyColumn),
                isTemporal,
                columns
        );
    }

    private String findPrimaryKeyColumn(String tableName) {
        List<String> pkColumns = jdbc.queryForList("""
                SELECT ku.COLUMN_NAME
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
                  ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME AND tc.TABLE_SCHEMA = ku.TABLE_SCHEMA
                WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY' AND tc.TABLE_SCHEMA = 'dbo' AND tc.TABLE_NAME = ?
                """, String.class, tableName);
        if (pkColumns.isEmpty()) {
            throw new IllegalStateException("Table \"" + tableName + "\" has no primary key — cannot expose via Tier 2.");
        }
        if (pkColumns.size() > 1) {
            // update()/delete() build their WHERE clause off a single PK
            // column — silently taking pkColumns.get(0) here would use only
            // part of a composite key, matching the wrong row (or several)
            // on update/delete. No currently-registered table has a
            // composite PK, but fail loudly instead of leaving a landmine
            // for whenever one is registered.
            throw new IllegalStateException(
                    "Table \"" + tableName + "\" has a composite primary key (" + pkColumns
                            + ") — not supported by the generic Tier 2 CRUD API.");
        }
        return pkColumns.get(0);
    }

    private boolean isTemporalTable(String tableName) {
        List<Integer> result = jdbc.queryForList("""
                SELECT temporal_type FROM sys.tables WHERE name = ? AND temporal_type = 2
                """, Integer.class, tableName);
        return !result.isEmpty();
    }

    /**
     * CHECK constraint enum values, per column. Handles both column-level
     * constraints (parent_column_id populated directly) and table-level
     * constraints (parent_column_id = 0, the column name has to be parsed
     * out of the constraint's definition text instead) — the same two
     * shapes the documentation-generation Python script had to handle when
     * parsing these same CHECK constraints out of the raw SQL files.
     *
     * SQL Server always normalizes `CHECK (col IN (...))` into an OR-chain
     * (`[col]='A' OR [col]='B' OR ...`, optionally wrapped with
     * `[col] IS NULL OR (...)` when the column is nullable) in
     * sys.check_constraints.definition, regardless of how the constraint was
     * originally declared — so inListPattern below never actually matches
     * live SQL Server output; it's kept only in case a future definition
     * shape reintroduces a literal IN(...). orChainPattern handles the real
     * shape: it collects every `[col]=literal` / `[col] IS NULL` comparison
     * in the definition, then requires the entire definition to be built
     * from just those comparisons (joined only by OR/parens) referencing a
     * single column before treating it as an enum — this rejects
     * multi-column or AND-joined constraints (e.g. chk_dcs_option_fields_scope)
     * that happen to share the same token shape but aren't a simple enum.
     */
    private Map<String, List<String>> findCheckEnums(String tableName) {
        Map<String, List<String>> result = new HashMap<>();
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT col.name AS column_name, cc.definition AS definition
                FROM sys.check_constraints cc
                JOIN sys.tables t ON cc.parent_object_id = t.object_id
                LEFT JOIN sys.columns col
                  ON cc.parent_column_id = col.column_id AND col.object_id = t.object_id
                WHERE t.name = ?
                """, tableName);

        Pattern inListPattern = Pattern.compile(
                "\\[?(\\w+)\\]?\\s+IN\\s*\\(([^()]*(?:\\([^()]*\\)[^()]*)*)\\)",
                Pattern.CASE_INSENSITIVE
        );
        Pattern literalPattern = Pattern.compile("'([^']*)'");
        Pattern orChainToken = Pattern.compile(
                "\\[(\\w+)\\]\\s*(?:=\\s*'([^']*)'|=\\s*NULL|IS\\s+NULL)",
                Pattern.CASE_INSENSITIVE
        );

        for (Map<String, Object> row : rows) {
            String columnName = (String) row.get("column_name");
            String definition = (String) row.get("definition");
            if (definition == null) continue;

            List<String> values = null;
            String resolvedColumn = null;

            Matcher inListMatcher = inListPattern.matcher(definition);
            if (inListMatcher.find()) {
                String valueList = inListMatcher.group(2);
                List<String> inListValues = new ArrayList<>();
                Matcher litMatcher = literalPattern.matcher(valueList);
                while (litMatcher.find()) {
                    inListValues.add(litMatcher.group(1));
                }
                if (!inListValues.isEmpty()) {
                    resolvedColumn = columnName != null ? columnName : inListMatcher.group(1);
                    values = inListValues;
                }
            }

            if (values == null) {
                Set<String> columnsSeen = new HashSet<>();
                List<String> chainValues = new ArrayList<>();
                Matcher tokenMatcher = orChainToken.matcher(definition);
                while (tokenMatcher.find()) {
                    columnsSeen.add(tokenMatcher.group(1));
                    if (tokenMatcher.group(2) != null) {
                        chainValues.add(tokenMatcher.group(2));
                    }
                }
                String residual = orChainToken.matcher(definition).replaceAll("")
                        .replaceAll("(?i)\\bor\\b", "")
                        .replaceAll("[()\\s]", "");
                if (!chainValues.isEmpty() && columnsSeen.size() == 1 && residual.isEmpty()) {
                    resolvedColumn = columnName != null ? columnName : columnsSeen.iterator().next();
                    values = chainValues;
                }
            }

            if (values != null && !values.isEmpty()) {
                result.put(resolvedColumn, values);
            }
        }
        return result;
    }

    private Map<String, String> findForeignKeys(String tableName) {
        Map<String, String> result = new HashMap<>();
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT pc.name AS column_name, rt.name AS ref_table
                FROM sys.foreign_keys fk
                JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
                JOIN sys.tables t ON fk.parent_object_id = t.object_id
                JOIN sys.columns pc ON fkc.parent_column_id = pc.column_id AND pc.object_id = t.object_id
                JOIN sys.tables rt ON fk.referenced_object_id = rt.object_id
                WHERE t.name = ?
                """, tableName);
        for (Map<String, Object> row : rows) {
            result.put((String) row.get("column_name"), (String) row.get("ref_table"));
        }
        return result;
    }

    /** INT-family SQL types — int, bigint, smallint, tinyint all contain "int". */
    private boolean isIntegerType(String dataType) {
        return dataType.contains("int");
    }

    /** Fractional-value SQL types — decimal/numeric/float/real/money all take a
     *  decimal point; "int" is checked first in the caller so this never
     *  double-matches an integer type. */
    private boolean isDecimalType(String dataType) {
        return dataType.contains("decimal") || dataType.contains("numeric")
                || dataType.contains("float") || dataType.contains("real")
                || dataType.contains("money");
    }

    /**
     * Abbreviations used throughout this schema that a plain snake_case
     * split/title-case can't expand on its own (e.g. "disch_location_id"
     * would otherwise render as "Disch Location Id"). Keys are matched
     * case-insensitively against each underscore-delimited token.
     */
    private static final Map<String, String> ABBREVIATIONS = Map.ofEntries(
            Map.entry("disch", "Discharge"),
            Map.entry("cp", "Counterparty"),
            Map.entry("pct", "Percent"),
            Map.entry("amt", "Amount"),
            Map.entry("qty", "Quantity"),
            Map.entry("num", "Number"),
            Map.entry("desc", "Description"),
            Map.entry("addr", "Address"),
            Map.entry("curr", "Currency"),
            Map.entry("loc", "Location")
    );

    /** Trailing tokens stripped from a label because the field's rendering
     *  already conveys them without saying so — a picker for "id" (resolves
     *  to the referenced/owning entity's name), a Yes/No tag or switch for
     *  "ind" (this schema's boolean-flag naming convention, e.g.
     *  "cost_applicable_ind", "parent_ind"). */
    private static final Set<String> REDUNDANT_TRAILING_TOKENS = Set.of("id", "ind");

    /**
     * @param dropTrailingId drops a trailing "id"/"ind" token from the label.
     *                       True for every non-PK column (PK columns are
     *                       filtered out of the UI entirely, so their label
     *                       is never rendered — see ReferenceDataTable.tsx's
     *                       editableColumns filter). For an FK column the
     *                       field renders as a picker resolving to the
     *                       referenced entity's name, so "Id" is redundant
     *                       (e.g. "disch_location_id" -> "Discharge Location").
     *                       For a non-FK "*_id" column (polymorphic keys like
     *                       "entity_id", or history-table snapshots that lost
     *                       their live FK constraint like "counterparty_id"
     *                       on trade_history), the same reasoning still
     *                       applies — "Id" adds nothing "Entity"/"Counterparty"
     *                       don't already say. "*_ind" boolean columns are the
     *                       same class of redundancy for the same reason.
     */
    private String humanizeLabel(String snakeCaseColumn, boolean dropTrailingId) {
        String[] parts = snakeCaseColumn.split("_");
        int lastIndex = parts.length - 1;
        if (dropTrailingId && lastIndex >= 0 && REDUNDANT_TRAILING_TOKENS.contains(parts[lastIndex].toLowerCase())) {
            lastIndex--;
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i <= lastIndex; i++) {
            String part = parts[i];
            if (part.isEmpty()) continue;
            String expanded = ABBREVIATIONS.getOrDefault(part.toLowerCase(), part);
            if (!sb.isEmpty()) sb.append(' ');
            sb.append(Character.toUpperCase(expanded.charAt(0))).append(expanded.substring(1));
        }
        return sb.toString();
    }
}
