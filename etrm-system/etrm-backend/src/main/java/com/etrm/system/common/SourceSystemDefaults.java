package com.etrm.system.common;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Resolves dbo.source_system ids for JPA entity provenance stamping
 * (created_src_id/updated_src_id, V194/V195) — a plain
 * {@code @MappedSuperclass} lifecycle callback (see AuditableEntity) can't
 * receive Spring-injected beans directly, so this component caches the
 * resolved id in a static field on startup instead, the standard escape
 * hatch for exactly this problem. Resolved once — dbo.source_system rows
 * are effectively immutable reference data, not worth a query per entity
 * save.
 */
@Component
public class SourceSystemDefaults {

    private static volatile int tier1ApplicationScreenId = -1;

    public SourceSystemDefaults(JdbcTemplate jdbc) {
        tier1ApplicationScreenId = jdbc.queryForObject(
                "SELECT source_system_id FROM dbo.source_system WHERE source_code = ?",
                Integer.class, "TIER1_APPLICATION_SCREEN");
    }

    /** Returns {@code short} not {@code int} — dbo.source_system.source_system_id
     *  is TINYINT (V197), and entity fields mapping it must be Short for
     *  Hibernate's strict ddl-auto:validate type check to pass (found this
     *  the hard way: an Integer-typed field fails validation against a
     *  TINYINT column even though the value always fits). */
    public static short tier1ApplicationScreen() {
        if (tier1ApplicationScreenId < 0) {
            throw new IllegalStateException("SourceSystemDefaults not yet initialized — accessed before Spring context startup completed.");
        }
        return (short) tier1ApplicationScreenId;
    }
}
