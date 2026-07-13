package com.etrm.system.rbac;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/app-modules, /app-functions, /roles, and /role-assignments
 * — including the full DRAFT -> PENDING_APPROVAL -> APPROVED role lifecycle
 * and assigning an approved role to a user.
 *
 * RbacController has no hard-delete endpoint for roles (matching
 * SystemUserController's pattern — see its own test class for the same
 * note), so this cleans up directly via JDBC in @AfterEach. Without this,
 * every test run left permanent junk rows in dbo.user_role on the real dev
 * DB (caught after the fact: 28 "ROLE-T..." rows accumulated from earlier
 * runs before this existed).
 */
class RbacControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    private final List<Integer> createdRoleIds = new ArrayList<>();

    @AfterEach
    void cleanUpCreatedRoles() {
        for (Integer roleId : createdRoleIds) {
            jdbc.update("DELETE FROM dbo.user_role_assignment WHERE role_id = ?", roleId);
            jdbc.update("DELETE FROM dbo.role_function WHERE role_id = ?", roleId);
            jdbc.update("DELETE FROM dbo.user_role WHERE role_id = ?", roleId);
        }
        createdRoleIds.clear();
    }

    @Test
    void app_modules_and_functions_are_listable() throws Exception {
        mockMvc.perform(auth(get("/api/v1/app-modules")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
        mockMvc.perform(auth(get("/api/v1/app-functions")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    private int createRole(String code) throws Exception {
        Map<String, Object> request = Map.of(
                "roleCode", code,
                "roleName", "Test Role " + code,
                "description", "created by RbacControllerTest",
                "functions", List.of()
        );
        String body = mockMvc.perform(auth(post("/api/v1/roles")).content(json(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roleCode").value(code.toUpperCase())) // uppercase normalization
                .andReturn().getResponse().getContentAsString();
        int roleId = objectMapper.readTree(body).get("roleId").asInt();
        createdRoleIds.add(roleId);
        return roleId;
    }

    @Test
    void create_role_uppercases_roleCode_and_is_listed() throws Exception {
        createRole(("role-" + unique()).toLowerCase());
        mockMvc.perform(auth(get("/api/v1/roles")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void create_duplicate_roleCode_returns_409() throws Exception {
        String code = "ROLE-" + unique();
        createRole(code);
        Map<String, Object> request = Map.of("roleCode", code, "roleName", "dup", "functions", List.of());
        mockMvc.perform(auth(post("/api/v1/roles")).content(json(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void get_role_by_id_includes_function_detail() throws Exception {
        int roleId = createRole("ROLE-" + unique());
        mockMvc.perform(auth(get("/api/v1/roles/" + roleId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role.roleId").value(roleId))
                .andExpect(jsonPath("$.functions").isArray());
    }

    @Test
    void get_role_by_bogus_id_returns_404() throws Exception {
        mockMvc.perform(auth(get("/api/v1/roles/999999999")))
                .andExpect(status().isNotFound());
    }

    @Test
    void update_role_persists_name_change() throws Exception {
        int roleId = createRole("ROLE-" + unique());
        Map<String, Object> update = Map.of(
                "roleCode", "IGNORED", "roleName", "Renamed", "description", "d", "functions", List.of()
        );
        mockMvc.perform(auth(put("/api/v1/roles/" + roleId)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roleName").value("Renamed"));
    }

    @Test
    void full_role_lifecycle_submit_approve_assign_and_revoke() throws Exception {
        int roleId = createRole("ROLE-" + unique());

        mockMvc.perform(auth(patch("/api/v1/roles/" + roleId + "/submit")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_APPROVAL"));

        mockMvc.perform(auth(patch("/api/v1/roles/" + roleId + "/approve")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        Map<String, Object> assignRequest = Map.of("roleId", roleId);
        String assignBody = mockMvc.perform(auth(post("/api/v1/users/1/role-assignments")).content(json(assignRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING_APPROVAL"))
                .andReturn().getResponse().getContentAsString();
        int assignmentId = objectMapper.readTree(assignBody).get("assignmentId").asInt();

        mockMvc.perform(auth(get("/api/v1/users/1/role-assignments")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(auth(patch("/api/v1/role-assignments/" + assignmentId + "/approve")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        mockMvc.perform(auth(delete("/api/v1/users/1/role-assignments/" + assignmentId)))
                .andExpect(status().isNoContent());
    }

    @Test
    void reject_role_sets_status_rejected() throws Exception {
        int roleId = createRole("ROLE-" + unique());
        mockMvc.perform(auth(patch("/api/v1/roles/" + roleId + "/reject")).content(json(Map.of("reason", "test"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionReason").value("test"));
    }

    @Test
    void assign_unapproved_role_returns_409() throws Exception {
        int roleId = createRole("ROLE-" + unique()); // still DRAFT, never submitted/approved
        mockMvc.perform(auth(post("/api/v1/users/1/role-assignments")).content(json(Map.of("roleId", roleId))))
                .andExpect(status().isConflict());
    }

    @Test
    void requests_without_a_token_are_rejected() throws Exception {
        mockMvc.perform(get("/api/v1/roles"))
                .andExpect(status().isForbidden());
    }
}
