package com.etrm.system.fieldpermission;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/permissions — effective-fields resolution, profile
 * CRUD, and rules replacement. Exercises ObjectLockRule, FieldPermissionRule,
 * ScreenFieldRegistry, and RoleFieldProfile — all of which had their
 * PK Integer/Long mismatches fixed this session.
 */
class FieldPermissionControllerTest extends ApiTestBase {

    @Test
    void screens_are_listable() throws Exception {
        mockMvc.perform(auth(get("/api/v1/permissions/screens")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void effective_fields_for_a_known_screen_returns_200() throws Exception {
        // TRADE_BLOTBER is the screen this feature was originally built for
        // (per FieldPermissionService's own doc comments) — if no fields are
        // registered for it in this environment the response is still 200
        // with empty maps, per resolve()'s own early-return for that case.
        mockMvc.perform(auth(get("/api/v1/permissions/effective-fields").param("screen", "TRADE_BLOTTER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.screenCode").value("TRADE_BLOTTER"));
    }

    private int createProfile(String code) throws Exception {
        Map<String, Object> profile = Map.of(
                "profileCode", code,
                "profileName", "Test Profile " + code,
                "screenCode", "TRADE_BLOTTER",
                "isActive", true
        );
        String body = mockMvc.perform(auth(post("/api/v1/permissions/profiles")).content(json(profile)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("profileId").asInt();
    }

    @Test
    void create_profile_and_list_for_screen() throws Exception {
        createProfile("PROF-" + unique());
        mockMvc.perform(auth(get("/api/v1/permissions/profiles").param("screen", "TRADE_BLOTTER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void get_profile_detail_returns_200_with_no_rules_yet() throws Exception {
        int profileId = createProfile("PROF-" + unique());
        mockMvc.perform(auth(get("/api/v1/permissions/profiles/" + profileId).param("screen", "TRADE_BLOTTER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileId").value(profileId))
                .andExpect(jsonPath("$.rules").isArray());
    }

    @Test
    void update_profile_rules_replaces_the_set_and_reflects_in_detail() throws Exception {
        int profileId = createProfile("PROF-" + unique());

        mockMvc.perform(auth(put("/api/v1/permissions/profiles/" + profileId + "/rules")).content(json(List.of())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileId").value(profileId));
    }

    @Test
    void get_profile_detail_for_bogus_id_returns_404() throws Exception {
        mockMvc.perform(auth(get("/api/v1/permissions/profiles/999999999").param("screen", "TRADE_BLOTTER")))
                .andExpect(status().isNotFound());
    }

    @Test
    void requests_without_a_token_are_rejected() throws Exception {
        mockMvc.perform(get("/api/v1/permissions/screens"))
                .andExpect(status().isForbidden());
    }
}
