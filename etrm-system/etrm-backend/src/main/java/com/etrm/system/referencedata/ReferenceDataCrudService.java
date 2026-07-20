package com.etrm.system.referencedata;

import com.etrm.system.common.FieldValidation;
import com.etrm.system.common.NotFoundException;
import org.springframework.data.domain.AuditorAware;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.Statement;
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
    private final AuditorAware<String> auditorAware;

    public ReferenceDataCrudService(JdbcTemplate jdbc, ReferenceDataMetadataService metadataService, AuditorAware<String> auditorAware) {
        this.jdbc = jdbc;
        this.metadataService = metadataService;
        this.auditorAware = auditorAware;
    }

    // This service bypasses JPA entirely (raw JdbcTemplate SQL), so it never
    // gets the @CreatedBy/@LastModifiedBy auditing JpaAuditingConfig wires up
    // for entity-backed tables — reuse the same auditorProvider bean here
    // instead of a hardcoded "SYSTEM" literal, so the generic Tier 2
    // endpoint attributes rows to the real logged-in user just like every
    // other write path in the app.
    private String currentUser() {
        return auditorAware.getCurrentAuditor().orElse("SYSTEM");
    }

    private void assertSafeIdentifier(String identifier, String what) {
        if (!SAFE_IDENTIFIER.matcher(identifier).matches()) {
            throw new IllegalArgumentException("Invalid " + what + ": \"" + identifier + "\".");
        }
    }

    /** Real enforcement of the rules ReferenceDataTable.tsx applies as a UX
     *  nicety, via the shared FieldValidation helpers (common package, not
     *  duplicated here) — an "integer" column rejects a fractional value
     *  outright, and a free-text/code ("string") value can't start with a
     *  spreadsheet-formula-triggering character or contain markup-shaped
     *  characters anywhere. Every generic Tier 2 table's create/update goes
     *  through here, so this one check covers every registered reference
     *  table, not per-table code. */
    private void validateValue(ColumnMetadata col, Object value) {
        if ("integer".equals(col.numericSubKind())) {
            FieldValidation.assertWholeNumber(col.label(), value);
        }
        if ("string".equals(col.kind()) && value instanceof String s) {
            FieldValidation.assertSafeText(col.label(), s);
        }
    }

    /** Code and short-name columns are conventionally uppercase everywhere
     *  in this schema (ISO codes, LEI codes, entity/counterparty codes,
     *  etc.) — normalize server-side so a lowercase value typed into any
     *  client (the generic Tier 2 form, an Excel upload, a direct API call)
     *  always lands uppercase, rather than relying on every UI to enforce
     *  it. Matched by column name convention (snake_case), not per-table
     *  config, so it covers all ~150 registered tables uniformly. */
    private Object normalizeValue(String snakeCaseColumnName, Object value) {
        if (!(value instanceof String s) || s.isEmpty()) return value;
        boolean isCodeOrShortName =
                snakeCaseColumnName.equals("code")
                        || snakeCaseColumnName.equals("short_name")
                        || snakeCaseColumnName.endsWith("_code");
        return isCodeOrShortName ? s.toUpperCase() : value;
    }

    /** created_at/created_by/updated_at/updated_by are server-managed —
     *  never trust a client-supplied value for them, the same way the PK is
     *  never trusted. Without this, a client payload that happens to include
     *  one of these fields (metadata exposes them as regular columns, so
     *  nothing stops a caller from sending them — an Excel upload with an
     *  extra column, a direct API call, or anything scripted against this
     *  generic endpoint) collided with the audit-column SQL this service
     *  adds itself below, producing SQL Server error 264 ("column specified
     *  more than once") on every single create/update. */
    private boolean isAuditColumn(String camelCaseName) {
        return camelCaseName.equals("createdAt") || camelCaseName.equals("createdBy")
                || camelCaseName.equals("updatedAt") || camelCaseName.equals("updatedBy");
    }

    /**
     * Optimistic locking for the generic Tier 2 engine — this service bypasses
     * Hibernate entirely (raw JdbcTemplate SQL), so a table's @Version column
     * (added per V127-V133 for dedicated-JPA entities) does nothing here; a
     * table reachable ONLY through this generic engine needs its own check.
     * Table-metadata-driven, same as everything else in this class: a table
     * with a row_version column (introspected live from SQL Server, not a
     * hardcoded list) gets the check automatically the moment the column
     * exists — no per-table code. Tables without the column are completely
     * unaffected (this returns false, callers skip the check entirely).
     */
    private boolean hasRowVersion(Map<String, ColumnMetadata> columnsByCamelName) {
        return columnsByCamelName.containsKey("rowVersion");
    }

    public List<Map<String, Object>> listRows(String tableName) {
        assertSafeIdentifier(tableName, "table name");
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM dbo." + tableName);
        return rows.stream().map(NameUtils::rowToCamelCase).toList();
    }

    /**
     * Opt-in server-side pagination, additive to {@link #listRows}: existing
     * callers (the Tier2 grid's default fetch, any other caller not passing
     * page/size) are completely unaffected — this is a separate method, not
     * a behavior change to the unpaginated path. Added as part of closing
     * the "zero backend pagination anywhere" gap flagged in an earlier
     * audit; the ~82 dedicated Tier1 controllers' own findAll() call sites
     * are a separate, much larger follow-up (each has its own bespoke
     * frontend consumption pattern to convert) — this covers the ~150
     * Tier2-registered tables in one place, the same "fix once in the
     * generic engine" approach already used for row_version/audit columns.
     * Ordered by the table's own primary key for stable paging.
     */
    public PagedResult listRowsPaged(String tableName, String displayName, int page, int size) {
        assertSafeIdentifier(tableName, "table name");
        int safeSize = Math.min(Math.max(size, 1), 500);
        int safePage = Math.max(page, 0);
        String pkColumn = NameUtils.toSnakeCase(metadataService.getMetadata(tableName, displayName).primaryKeyColumn());

        long totalElements = jdbc.queryForObject("SELECT COUNT(*) FROM dbo." + tableName, Long.class);
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT * FROM dbo." + tableName + " ORDER BY " + pkColumn
                        + " OFFSET ? ROWS FETCH NEXT ? ROWS ONLY",
                safePage * safeSize, safeSize);
        List<Map<String, Object>> content = rows.stream().map(NameUtils::rowToCamelCase).toList();

        int totalPages = (int) Math.ceil(totalElements / (double) safeSize);
        return new PagedResult(content, safePage, safeSize, totalElements, totalPages);
    }

    public record PagedResult(
            List<Map<String, Object>> content,
            int page,
            int size,
            long totalElements,
            int totalPages
    ) {}

    // @Transactional matters here beyond the usual atomicity reasons: the
    // INSERT and the SCOPE_IDENTITY() read that follows it MUST run on the
    // same physical connection (SCOPE_IDENTITY() is connection-scoped) —
    // without a surrounding transaction, JdbcTemplate can pull a different
    // connection from the pool for each call, so SCOPE_IDENTITY() silently
    // returns NULL and the read-back-after-create 0-matches.
    @Transactional
    public Map<String, Object> createRow(String tableName, String displayName, Map<String, Object> camelCaseRow) {
        assertSafeIdentifier(tableName, "table name");
        TableMetadata metadata = metadataService.getMetadata(tableName, displayName);
        Map<String, ColumnMetadata> columnsByCamelName = indexByCamelName(metadata);

        List<String> sqlColumns = new ArrayList<>();
        List<Object> values = new ArrayList<>();
        for (Map.Entry<String, Object> entry : camelCaseRow.entrySet()) {
            ColumnMetadata col = columnsByCamelName.get(entry.getKey());
            // rowVersion is never client-set on create — always start at the
            // column's own DB DEFAULT (0), same as every JPA @Version entity.
            if (col == null || col.isPrimaryKey() || isAuditColumn(entry.getKey()) || "rowVersion".equals(entry.getKey())) continue;
            validateValue(col, entry.getValue());
            String snakeCaseColumn = NameUtils.toSnakeCase(entry.getKey());
            sqlColumns.add(snakeCaseColumn);
            values.add(normalizeValue(snakeCaseColumn, entry.getValue()));
        }
        // created_by / updated_by are NOT NULL on MOST master data tables —
        // populate them here since this path bypasses JPA auditing entirely.
        // Not every registered table has them though (~48 of 154 don't, e.g.
        // incoterm, currency, credit_rating) — blindly adding these columns
        // made every create() 500 on those tables (SQL Server "Invalid
        // column name"), so only add what the table's real, introspected
        // metadata says exists.
        if (columnsByCamelName.containsKey("createdBy")) {
            sqlColumns.add("created_by");
            values.add(currentUser());
        }
        if (columnsByCamelName.containsKey("updatedBy")) {
            sqlColumns.add("updated_by");
            values.add(currentUser());
        }

        String columnList = String.join(", ", sqlColumns);
        String placeholders = String.join(", ", sqlColumns.stream().map(c -> "?").toList());
        String sql = "INSERT INTO dbo." + tableName + " (" + columnList + ") VALUES (" + placeholders + ")";

        // Generated-key retrieval via Statement.RETURN_GENERATED_KEYS — reads
        // the new identity directly off the INSERT's own execution/result
        // set, in the same round trip. A separate `SELECT SCOPE_IDENTITY()`
        // call (the previous approach) came back NULL here even inside a
        // @Transactional method — root cause not fully pinned down (not a
        // simple connection-pooling issue, since the transaction was
        // confirmed active), but this approach sidesteps it entirely rather
        // than depending on any particular connection/scope semantics.
        KeyHolder keyHolder = new GeneratedKeyHolder();
        String finalSql = sql;
        List<Object> finalValues = values;
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(finalSql, Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < finalValues.size(); i++) {
                ps.setObject(i + 1, finalValues.get(i));
            }
            return ps;
        }, keyHolder);
        Long newId = keyHolder.getKey().longValue();
        return getRow(tableName, displayName, newId);
    }

    @Transactional
    public Map<String, Object> updateRow(String tableName, String displayName, Long id, Map<String, Object> camelCaseRow) {
        assertSafeIdentifier(tableName, "table name");
        TableMetadata metadata = metadataService.getMetadata(tableName, displayName);
        Map<String, ColumnMetadata> columnsByCamelName = indexByCamelName(metadata);
        boolean versioned = hasRowVersion(columnsByCamelName);

        Integer clientRowVersion = null;
        if (versioned) {
            Object raw = camelCaseRow.get("rowVersion");
            if (raw == null) {
                // Same failure mode fixed on AppUser/UserRole (V133): a
                // missing version must never be silently treated as "no
                // conflict" — require it explicitly rather than skipping
                // the check.
                throw new ObjectOptimisticLockingFailureException(tableName, id);
            }
            clientRowVersion = raw instanceof Number n ? n.intValue() : Integer.parseInt(raw.toString());
        }

        List<String> setClauses = new ArrayList<>();
        List<Object> values = new ArrayList<>();
        for (Map.Entry<String, Object> entry : camelCaseRow.entrySet()) {
            ColumnMetadata col = columnsByCamelName.get(entry.getKey());
            if (col == null || col.isPrimaryKey() || isAuditColumn(entry.getKey()) || "rowVersion".equals(entry.getKey())) continue;
            validateValue(col, entry.getValue());
            String snakeCaseColumn = NameUtils.toSnakeCase(entry.getKey());
            setClauses.add(snakeCaseColumn + " = ?");
            values.add(normalizeValue(snakeCaseColumn, entry.getValue()));
        }
        if (columnsByCamelName.containsKey("updatedBy")) {
            setClauses.add("updated_by = ?");
            values.add(currentUser());
        }
        if (columnsByCamelName.containsKey("updatedAt")) {
            setClauses.add("updated_at = SYSUTCDATETIME()");
        }
        if (versioned) {
            setClauses.add("row_version = row_version + 1");
        }

        values.add(id);
        String sql = "UPDATE dbo." + tableName + " SET " + String.join(", ", setClauses)
                + " WHERE " + NameUtils.toSnakeCase(metadata.primaryKeyColumn()) + " = ?";
        if (versioned) {
            sql += " AND row_version = ?";
            values.add(clientRowVersion);
        }

        int updated = jdbc.update(sql, values.toArray());
        if (updated == 0) {
            if (versioned) {
                // Disambiguate stale-version from truly-missing — a plain
                // NotFoundException here would mislabel a real conflict as a
                // 404, which the frontend would (wrongly) not show as a
                // reload-and-retry conflict.
                Integer exists = jdbc.queryForObject(
                        "SELECT COUNT(*) FROM dbo." + tableName + " WHERE " + NameUtils.toSnakeCase(metadata.primaryKeyColumn()) + " = ?",
                        Integer.class, id);
                if (exists != null && exists > 0) {
                    throw new ObjectOptimisticLockingFailureException(tableName, id);
                }
            }
            throw new NotFoundException("No row with id " + id + " in \"" + tableName + "\".");
        }
        return getRow(tableName, displayName, id);
    }

    /**
     * Master/reference data is never hard-deleted, only deactivated — a
     * physical DELETE here can orphan foreign keys held by historical trades,
     * orders, and other records that reference a "static data" row long after
     * it's no longer current (e.g. a lookup_value, credit_term, or commodity
     * row used on a trade booked years ago). Every registered Tier 2 table is
     * expected to carry an is_active flag for exactly this reason; tables
     * that don't have one can't be deactivated so deletion is refused
     * outright rather than silently falling back to a hard delete.
     */
    public void deleteRow(String tableName, String displayName, Long id) {
        assertSafeIdentifier(tableName, "table name");
        TableMetadata metadata = metadataService.getMetadata(tableName, displayName);
        Map<String, ColumnMetadata> columnsByCamelName = indexByCamelName(metadata);
        if (!columnsByCamelName.containsKey("isActive")) {
            throw new IllegalStateException(
                    "\"" + tableName + "\" has no active/inactive flag, so rows cannot be deactivated or deleted.");
        }
        String pkColumn = NameUtils.toSnakeCase(metadata.primaryKeyColumn());

        List<String> setClauses = new ArrayList<>();
        setClauses.add("is_active = 0");
        if (columnsByCamelName.containsKey("updatedBy")) {
            setClauses.add("updated_by = ?");
        }
        if (columnsByCamelName.containsKey("updatedAt")) {
            setClauses.add("updated_at = SYSUTCDATETIME()");
        }
        String sql = "UPDATE dbo." + tableName + " SET " + String.join(", ", setClauses)
                + " WHERE " + pkColumn + " = ?";

        List<Object> params = new ArrayList<>();
        if (columnsByCamelName.containsKey("updatedBy")) {
            params.add(currentUser());
        }
        params.add(id);

        int deactivated = jdbc.update(sql, params.toArray());
        if (deactivated == 0) {
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
