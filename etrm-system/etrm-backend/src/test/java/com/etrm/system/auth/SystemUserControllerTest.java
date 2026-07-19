package com.etrm.system.auth;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/admin/users CRUD.
 *
 * SystemUserController has no hard-delete endpoint (only deactivate/
 * activate, by design — see its own doc comment on why), so unlike every
 * other test class in this suite this one can't clean up its created rows
 * through the API. Track every username this class creates and delete them
 * directly via JDBC in @AfterEach instead — otherwise every test run left
 * permanent junk rows in dbo.app_user on the real dev DB (caught after the
 * fact: 15 "tT..." rows accumulated from earlier runs before this existed).
 */
class SystemUserControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    private final List<String> createdUsernames = new ArrayList<>();

    @AfterEach
    void cleanUpCreatedUsers() {
        for (String username : createdUsernames) {
            jdbc.update("DELETE FROM dbo.app_user WHERE username = ?", username);
        }
        createdUsernames.clear();
    }

    private Map<String, Object> validPayload(String username) {
        Map<String, Object> m = new HashMap<>();
        m.put("username", username);
        m.put("email", username + "@example.com");
        m.put("fullName", "Test User " + username);
        m.put("password", "DevTest123!");
        m.put("legalEntityId", 1);
        return m;
    }

    private int createUser(String username) throws Exception {
        createdUsernames.add(username);
        String body = mockMvc.perform(auth(post("/api/v1/admin/users")).content(json(validPayload(username))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("userId").asInt();
    }

    @Test
    void create_persists_and_is_listed() throws Exception {
        createUser("t" + unique());
        mockMvc.perform(auth(get("/api/v1/admin/users")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void create_without_password_returns_400() throws Exception {
        Map<String, Object> payload = validPayload("t" + unique());
        payload.remove("password");
        mockMvc.perform(auth(post("/api/v1/admin/users")).content(json(payload)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void create_duplicate_username_returns_409() throws Exception {
        String username = "t" + unique();
        createUser(username);
        mockMvc.perform(auth(post("/api/v1/admin/users")).content(json(validPayload(username))))
                .andExpect(status().isConflict());
    }

    @Test
    void get_by_id_returns_200_then_404_for_bogus_id() throws Exception {
        int id = createUser("t" + unique());
        mockMvc.perform(auth(get("/api/v1/admin/users/" + id)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(id));
        mockMvc.perform(auth(get("/api/v1/admin/users/999999999")))
                .andExpect(status().isNotFound());
    }

    @Test
    void update_persists_changes() throws Exception {
        String username = "t" + unique();
        int id = createUser(username);
        String getBody = mockMvc.perform(auth(get("/api/v1/admin/users/" + id)))
                .andReturn().getResponse().getContentAsString();
        Map<String, Object> update = validPayload(username);
        update.put("fullName", "Renamed User");
        update.remove("password");
        // V129 — echo back the version just read, same as a real client would.
        update.put("rowVersion", objectMapper.readTree(getBody).get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/admin/users/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Renamed User"));
    }

    @Test
    void deactivate_then_activate_cycle() throws Exception {
        int id = createUser("t" + unique());

        mockMvc.perform(auth(patch("/api/v1/admin/users/" + id + "/deactivate")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isActive").value(false));

        mockMvc.perform(auth(patch("/api/v1/admin/users/" + id + "/activate")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isActive").value(true));
    }

    @Test
    void requests_without_a_token_are_rejected() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isForbidden());
    }
}
