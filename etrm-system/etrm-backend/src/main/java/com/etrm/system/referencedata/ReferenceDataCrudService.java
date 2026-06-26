package com.etrm.system.referencedata;

import com.etrm.system.common.NotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * SAFETY NOTE: every table name handled here arrives already validated
 * against master_data_table_registry by the controller (only a registered,
 * enabled table name can reach these methods at all), and every column name
 * is cross-checked against that table's own metadata (derived from SQL
 * Server's system catalogs, not user input) before being interpolated into
 * a query string. JDBC parameterizes VALUES via `?` placeholders
 * everywhere — it never parameterizes identifiers (table/column names),
 * which is exactly why this extra validation layer exists instead of
 * trusting the caller.
 */
@Service
public class ReferenceDataCrudService {

    private static final Pattern SAFE_IDENTIFIER = Pattern.compile("^[a-zA-Z_][a-zA-Z0-9_]*$");

    private final JdbcTemplate jdbc;
    private final ReferenceDataMetadataService metadataService;

    public ReferenceDataCrudService(JdbcTemplate jdbc, ReferenceDataMetadataService metadataService) {
        this.jdbc = jdbc;
        this.metadataService = metadataService;
    }

    private void assertSafeIdentifier(String identifier, String what) {
        if (!SAFE_IDENTIFIER.matcher(identifier).matches()) {
            throw new IllegalArgumentException("Invalid " + what + ": \"" + identifier + "\".");
        }
    }

    public List<Map<String, Object>> listRows(String tableName) {
        assertSafeIdentifier(tableName, "table name");
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM dbo." + tableName);
        return rows.stream().map(NameUtils::rowToCamelCase).toList();
    }

    public Map<String, Object> createRow(String tableName, String displayName, Map<String, Object> camelCaseRow) {
        assertSafeIdentifier(tableName, "table name");
        TableMetadata metadata = metadataService.getMetadata(tableName, displayName);
        Map<String, ColumnMetadata> columnsByCamelName = indexByCamelName(metadata);

        List<String> sqlColumns = new ArrayList<>();
        List<Object> values = new ArrayList<>();
        for (Map.Entry<String, Object> entry : camelCaseRow.entrySet()) {
            ColumnMetadata col = columnsByCamelName.get(entry.getKey());
            if (col == null || col.isPrimaryKey()) continue; // PK is identity-generated, never client-supplied
            sqlColumns.add(NameUtils.toSnakeCase(entry.getKey()));
            values.add(entry.getValue());
        }
        // created_by / updated_by are NOT NULL on every master data table —
        // populate them here since this path bypasses JPA auditing entirely.
        sqlColumns.add("created_by");
        values.add("SYSTEM");
        sqlColumns.add("updated_by");
        values.add("SYSTEM");

        String columnList = String.join(", ", sqlColumns);
        String placeholders = String.join(", ", sqlColumns.stream().map(c -> "?").toList());
        String sql = "INSERT INTO dbo." + tableName + " (" + columnList + ") VALUES (" + placeholders + ")";

        jdbc.update(sql, values.toArray());

        // SQL Server identity retrieval — SCOPE_IDENTITY() is connection/scope-safe
        Long newId = jdbc.queryForObject("SELECT CAST(SCOPE_IDENTITY() AS BIGINT)", Long.class);
        return getRow(tableName, displayName, newId);
    }

    public Map<String, Object> updateRow(String tableName, String displayName, Long id, Map<String, Object> camelCaseRow) {
        assertSafeIdentifier(tableName, "table name");
        TableMetadata metadata = metadataService.getMetadata(tableName, displayName);
        Map<String, ColumnMetadata> columnsByCamelName = indexByCamelName(metadata);

        List<String> setClauses = new ArrayList<>();
        List<Object> values = new ArrayList<>();
        for (Map.Entry<String, Object> entry : camelCaseRow.entrySet()) {
            ColumnMetadata col = columnsByCamelName.get(entry.getKey());
            if (col == null || col.isPrimaryKey()) continue;
            setClauses.add(NameUtils.toSnakeCase(entry.getKey()) + " = ?");
            values.add(entry.getValue());
        }
        setClauses.add("updated_by = ?");
        values.add("SYSTEM");
        setClauses.add("updated_at = SYSUTCDATETIME()");

        values.add(id);
        String sql = "UPDATE dbo." + tableName + " SET " + String.join(", ", setClauses)
                + " WHERE " + NameUtils.toSnakeCase(metadata.primaryKeyColumn()) + " = ?";

        int updated = jdbc.update(sql, values.toArray());
        if (updated == 0) {
            throw new NotFoundException("No row with id " + id + " in \"" + tableName + "\".");
        }
        return getRow(tableName, displayName, id);
    }

    public void deleteRow(String tableName, String displayName, Long id) {
        assertSafeIdentifier(tableName, "table name");
        TableMetadata metadata = metadataService.getMetadata(tableName, displayName);
        String pkColumn = NameUtils.toSnakeCase(metadata.primaryKeyColumn());
        int deleted = jdbc.update("DELETE FROM dbo." + tableName + " WHERE " + pkColumn + " = ?", id);
        if (deleted == 0) {
            throw new NotFoundException("No row with id " + id + " in \"" + tableName + "\".");
        }
    }

    private Map<String, Object> getRow(String tableName, String displayName, Long id) {
        TableMetadata metadata = metadataService.getMetadata(tableName, displayName);
        String pkColumn = NameUtils.toSnakeCase(metadata.primaryKeyColumn());
        Map<String, Object> row = jdbc.queryForMap(
                "SELECT * FROM dbo." + tableName + " WHERE " + pkColumn + " = ?", id
        );
        return NameUtils.rowToCamelCase(row);
    }

    private Map<String, ColumnMetadata> indexByCamelName(TableMetadata metadata) {
        Map<String, ColumnMetadata> map = new LinkedHashMap<>();
        for (ColumnMetadata col : metadata.columns()) {
            map.put(col.name(), col);
        }
        return map;
    }
}
