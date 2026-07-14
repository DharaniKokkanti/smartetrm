package com.etrm.system.common;

import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Every error response across the API uses Spring's built-in ProblemDetail
 * (RFC 7807) — this is what the frontend's `ProblemDetail` TypeScript
 * interface (services/api.ts) is shaped to consume directly, with no
 * translation layer needed on either side.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final JdbcTemplate jdbc;

    public GlobalExceptionHandler(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(NotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setTitle("Not Found");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(pd);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ProblemDetail> handleConflict(ConflictException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        pd.setTitle("Conflict");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(pd);
    }

    private static final Pattern UNIQUE_VIOLATION = Pattern.compile(
            "Violation of UNIQUE KEY constraint '(.+?)'\\. Cannot insert duplicate key in object '(.+?)'\\.(?: The duplicate key value is \\((.+?)\\)\\.)?");
    private static final Pattern PK_VIOLATION = Pattern.compile(
            "Violation of PRIMARY KEY constraint '(.+?)'\\. Cannot insert duplicate key in object '(.+?)'\\.(?: The duplicate key value is \\((.+?)\\)\\.)?");
    private static final Pattern FK_VIOLATION = Pattern.compile(
            "The \\w+ statement conflicted with the (?:FOREIGN KEY|REFERENCE) constraint \"(.+?)\"\\. The conflict occurred in database \"(.+?)\", table \"(.+?)\", column '(.+?)'\\.");
    private static final Pattern NULL_VIOLATION = Pattern.compile(
            "Cannot insert the value NULL into column '(.+?)', table '(.+?)'; column does not allow nulls\\.");
    private static final Pattern CHECK_VIOLATION = Pattern.compile(
            "The \\w+ statement conflicted with the CHECK constraint \"(.+?)\"\\.");

    /**
     * Turns the SQL Server driver's own (already single-line, non-stack-trace)
     * message into something a user can act on — which column/constraint,
     * not just "a constraint was violated". Falls back to the old generic
     * message if the driver message doesn't match one of the constraint
     * violation shapes above (new SQL Server version, different phrasing,
     * etc.) — never surfaces the raw driver message unparsed, since that
     * can leak table/schema internals not meant for the client.
     */
    private String describeConstraintViolation(String driverMessage) {
        if (driverMessage == null) return null;
        Matcher m = UNIQUE_VIOLATION.matcher(driverMessage);
        if (m.find()) {
            String value = m.group(3);
            String fieldLabel = describeConstraintFields(m.group(1));
            return "A record with this value already exists"
                    + (value != null ? " (" + value + ")" : "") + " — " + fieldLabel + " must be unique.";
        }
        m = PK_VIOLATION.matcher(driverMessage);
        if (m.find()) {
            return "A record with this identifier already exists.";
        }
        m = FK_VIOLATION.matcher(driverMessage);
        if (m.find()) {
            return "\"" + m.group(4) + "\" references a row that doesn't exist in the related table.";
        }
        m = NULL_VIOLATION.matcher(driverMessage);
        if (m.find()) {
            return "\"" + m.group(1) + "\" is required and cannot be left blank.";
        }
        m = CHECK_VIOLATION.matcher(driverMessage);
        if (m.find()) {
            return "The value provided isn't valid for this field (violates rule \"" + m.group(1) + "\").";
        }
        return null;
    }

    /**
     * Unique/PK constraint names in this schema follow no single naming
     * convention (some are `uq_<table>_<column>`, others are abbreviated
     * like `uq_mb_code` or `uq_ltd_facility`) — so the constraint name alone
     * can't be turned into a field label by parsing it. Instead this looks
     * up the real column(s) backing the constraint via SQL Server's own
     * catalog views (every UNIQUE/PRIMARY KEY constraint is backed by an
     * index of the same name) and humanizes those column names the same way
     * ReferenceDataMetadataService.humanizeLabel does for Tier 2 forms, so
     * the message matches what the user actually sees on screen. Falls back
     * to the raw constraint name if the lookup fails (e.g. against the H2
     * dev profile, which doesn't have SQL Server's sys.* catalog views) —
     * still better than a raw driver message, never worse.
     */
    private String describeConstraintFields(String constraintName) {
        try {
            List<String> columns = jdbc.queryForList("""
                    SELECT c.name AS column_name
                    FROM sys.indexes i
                    JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
                    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
                    WHERE i.name = ?
                    ORDER BY ic.key_ordinal
                    """, String.class, constraintName);
            if (columns.isEmpty()) return constraintName;
            return columns.stream().map(this::humanizeColumn)
                    .reduce((a, b) -> a + " + " + b).orElse(constraintName);
        } catch (Exception e) {
            log.debug("Could not resolve columns for constraint \"{}\": {}", constraintName, e.getMessage());
            return constraintName;
        }
    }

    private String humanizeColumn(String snakeCaseColumn) {
        String[] parts = snakeCaseColumn.split("_");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (part.isEmpty()) continue;
            if (!sb.isEmpty()) sb.append(' ');
            sb.append(Character.toUpperCase(part.charAt(0))).append(part.substring(1));
        }
        return sb.toString();
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ProblemDetail> handleDataIntegrity(DataIntegrityViolationException ex) {
        // Catches DB-level CHECK/FK/UNIQUE constraint violations that slip
        // past application-level validation — the DB is always the final
        // backstop, per the schema's design philosophy, so this should
        // rarely fire in practice but must never surface a raw SQL stack
        // trace to the client when it does.
        log.warn("Data integrity violation: {}", ex.getMessage());
        Throwable root = ex.getMostSpecificCause();
        String detail = describeConstraintViolation(root != null ? root.getMessage() : null);
        if (detail == null) {
            detail = "The request violates a database constraint (duplicate value, invalid reference, or invalid value).";
        }
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, detail);
        pd.setTitle("Constraint Violation");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(pd);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, List<String>> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(fe ->
                errors.computeIfAbsent(fe.getField(), k -> new java.util.ArrayList<>())
                        .add(fe.getDefaultMessage())
        );
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failed.");
        pd.setTitle("Bad Request");
        pd.setProperty("errors", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(pd);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ProblemDetail> handleIllegalArgument(IllegalArgumentException ex) {
        // Field-level input validation (e.g. ReferenceDataCrudService rejecting
        // a decimal value for an integer column, or an unsafe character in a
        // text field) throws this — without an explicit handler it fell
        // through to the generic 500 handler below, hiding a real 400-shaped
        // client error behind "An unexpected error occurred."
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        pd.setTitle("Bad Request");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(pd);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ProblemDetail> handleConstraintViolation(ConstraintViolationException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        pd.setTitle("Bad Request");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(pd);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ProblemDetail> handleIllegalState(IllegalStateException ex) {
        // ReferenceDataController throws this for a registry-level
        // allow_create/allow_edit/allow_delete denial — a legitimate "you're
        // not allowed to do that" business rule, not a server bug. Without
        // this handler it fell through to the generic 500 handler, which
        // both mislabels a 403-shaped response and (now that 500s are
        // logged) would spam the server log with a stack trace for
        // completely expected, working-as-designed denials.
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        pd.setTitle("Forbidden");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(pd);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpected(Exception ex) {
        // Was previously swallowed silently — a genuinely unexpected
        // exception must never disappear with zero trace in the server log,
        // or every 500 becomes undebuggable from the outside.
        log.error("Unhandled exception", ex);
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred."
        );
        pd.setTitle("Internal Server Error");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(pd);
    }
}
