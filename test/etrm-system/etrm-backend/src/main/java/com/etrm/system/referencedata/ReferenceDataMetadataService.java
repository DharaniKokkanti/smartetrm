package com.etrm.system.referencedata;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
            } else if (dataType.contains("int") || dataType.contains("decimal")
                    || dataType.contains("numeric") || dataType.contains("float")) {
                kind = "number";
            } else {
                kind = "string";
            }

            columns.add(new ColumnMetadata(
                    camelName,
                    humanizeLabel(sqlColumnName),
                    kind,
                    isPk,
                    nullable,
                    maxLength,
                    enumValues,
                    fkTarget
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

        for (Map<String, Object> row : rows) {
            String columnName = (String) row.get("column_name");
            String definition = (String) row.get("definition");
            if (definition == null) continue;

            Matcher inListMatcher = inListPattern.matcher(definition);
            if (!inListMatcher.find()) continue;

            String resolvedColumn = columnName != null ? columnName : inListMatcher.group(1);
            String valueList = inListMatcher.group(2);

            List<String> values = new ArrayList<>();
            Matcher litMatcher = literalPattern.matcher(valueList);
            while (litMatcher.find()) {
                values.add(litMatcher.group(1));
            }
            if (!values.isEmpty()) {
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

    private String humanizeLabel(String snakeCaseColumn) {
        String[] parts = snakeCaseColumn.split("_");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (part.isEmpty()) continue;
            if (!sb.isEmpty()) sb.append(' ');
            sb.append(Character.toUpperCase(part.charAt(0))).append(part.substring(1));
        }
        return sb.toString();
    }
}
