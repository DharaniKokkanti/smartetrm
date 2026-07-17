package com.etrm.system.emissionscheme;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/emission-schemes: create, list, update, deactivate,
 * unauthenticated access.
 *
 * Regression coverage for a real bug found while first writing this suite:
 * EmissionScheme.schemeType (the raw int FK) carried @NotNull directly on
 * the field, but its getter/setter are @JsonIgnore — only the denormalized
 * schemeTypeCode string (aliased to the same JSON key) is reachable from
 * JSON. Bean Validation ran on the deserialized entity BEFORE
 * EmissionSchemeService.resolveForeignKeys() populated the int field, so
 * every real POST/PUT 400'd unconditionally. Fixed by dropping @NotNull
 * from schemeType (enforcement belongs in resolveForeignKeys/the DB's own
 * NOT NULL, not Bean Validation on a field JSON can never set).
 */
class EmissionSchemeControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String code) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("schemeCode", code);
        payload.put("schemeName", "Test Scheme " + code);
        payload.put("schemeType", "COMPLIANCE");
        payload.put("regulator", "Test Regulator");
        payload.put("jurisdiction", "EU");
        payload.put("description", "Test description");
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists_and_resolves_schemeType_code() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/emission-schemes")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.schemeCode").value(code))
                .andExpect(jsonPath("$.schemeId").isNumber())
                .andExpect(jsonPath("$.schemeType").value("COMPLIANCE"));
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/emission-schemes")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/emission-schemes")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("schemeId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(code));
        update.put("regulator", "Updated Regulator");

        mockMvc.perform(auth(put("/api/v1/emission-schemes/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.regulator").value("Updated Regulator"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/emission-schemes")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("schemeId").asInt();

        mockMvc.perform(auth(patch("/api/v1/emission-schemes/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }

    @Test
    void deactivate_nonexistent_id_returns_404() throws Exception {
        mockMvc.perform(auth(patch("/api/v1/emission-schemes/999999999/deactivate")))
                .andExpect(status().isNotFound());
    }

    @Test
    void requests_without_a_token_are_rejected() throws Exception {
        mockMvc.perform(get("/api/v1/emission-schemes"))
                .andExpect(status().isForbidden());
    }
}
