package com.etrm.system.audit;

import com.etrm.system.common.SourceSystemDefaults;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Writes to dbo.user_audit_log (migration 01, renamed from audit_log in
 * V217) via raw JDBC rather than a JPA entity — its primary key is the
 * composite (audit_id, audit_date) used for date-based partitioning, which
 * doesn't map cleanly onto a single IDENTITY-backed @Id. Both audit_date and
 * audit_timestamp default to SYSUTCDATETIME() in the DB, so neither is set
 * here.
 *
 * created_src_id/updated_src_id are NOT NULL with no DB default — the
 * V194-198 governance sweep added them here along with virtually every
 * other table in the schema, even though this table had no writer at the
 * time. Discovered live (first real INSERT into this table ever executed)
 * as a 500 on login: "Cannot insert the value NULL into column
 * 'updated_src_id'". No row_version/created_at/created_by/updated_at/
 * updated_by columns exist here — this table's own audit_timestamp/username
 * already serve that role, so the sweep only added the two src_id columns.
 */
@Service
public class AuditLogService {

    private final JdbcTemplate jdbc;

    public AuditLogService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void record(String action, String entityType, String entityId, Integer userId, String username, String ipAddress) {
        short srcId = SourceSystemDefaults.tier1ApplicationScreen();
        jdbc.update(
                "INSERT INTO dbo.user_audit_log (entity_type, entity_id, action, user_id, username, ip_address, created_src_id, updated_src_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                entityType, entityId, action, userId, username, ipAddress, srcId, srcId);
    }
}
