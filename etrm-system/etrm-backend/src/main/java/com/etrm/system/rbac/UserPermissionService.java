package com.etrm.system.rbac;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Loads a user's real, effective permission set for request authorization —
 * the piece SecurityConfig's long-standing doc comment said was deferred
 * until the role table existed. It exists now (role_function/
 * user_role_assignment, built for the RBAC admin UI), so this aggregates it
 * into Spring Security {@link GrantedAuthority} values JwtAuthenticationFilter
 * attaches to every request's Authentication.
 *
 * Authority shape, per granted (function_code, access_level) row:
 *   - "PERM_<function_code>"        — granted at all (READ or READ_WRITE);
 *                                      gates GET/view endpoints.
 *   - "PERM_<function_code>_WRITE"  — granted at READ_WRITE specifically;
 *                                      gates POST/PUT/PATCH/DELETE endpoints.
 * A READ-only grant on a create/edit/delete-type function code (e.g.
 * Compliance's MD_CREATE at READ) intentionally produces no _WRITE
 * authority — matches the RBAC admin UI's own semantics, where READ on a
 * mutating function means "visible, not actionable."
 */
@Service
public class UserPermissionService {

    private final JdbcTemplate jdbc;

    public UserPermissionService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<GrantedAuthority> loadAuthorities(Long userId) {
        if (userId == null) return List.of();

        List<GrantedAuthority> authorities = new java.util.ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

        jdbc.query(
                """
                SELECT f.function_code, rf.access_level
                FROM dbo.user_role_assignment ura
                JOIN dbo.user_role ur ON ur.role_id = ura.role_id
                JOIN dbo.role_function rf ON rf.role_id = ur.role_id
                JOIN dbo.app_function f ON f.function_id = rf.function_id
                WHERE ura.user_id = ?
                  AND ura.is_active = 1 AND ura.status = 'ACTIVE'
                  AND ur.is_active = 1 AND ur.status = 'APPROVED'
                  AND f.is_active = 1
                  AND (ura.valid_to IS NULL OR ura.valid_to >= CAST(SYSUTCDATETIME() AS DATE))
                """,
                (rs, rowNum) -> {
                    String code = rs.getString("function_code");
                    String accessLevel = rs.getString("access_level");
                    authorities.add(new SimpleGrantedAuthority("PERM_" + code));
                    if ("READ_WRITE".equals(accessLevel)) {
                        authorities.add(new SimpleGrantedAuthority("PERM_" + code + "_WRITE"));
                    }
                    return null;
                },
                userId
        );
        return authorities;
    }
}
