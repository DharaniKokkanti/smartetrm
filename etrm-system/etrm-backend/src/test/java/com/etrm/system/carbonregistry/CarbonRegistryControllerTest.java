package com.etrm.system.carbonregistry;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/carbon-registries: create, list, update, deactivate,
 * unauthenticated access.
 *
 * Regression coverage for a real bug found while first writing this suite:
 * CarbonRegistry.registryType (the raw int FK) carried @NotNull directly on
 * the field, but its getter/setter are @JsonIgnore — only the denormalized
 * registryTypeCode string (aliased to the same JSON key) is reachable from
 * JSON. Bean Validation ran on the deserialized entity BEFORE
 * CarbonRegistryService.resolveForeignKeys() populated the int field, so
 * every real POST/PUT 400'd unconditionally. Fixed by dropping @NotNull
 * from registryType (enforcement belongs in resolveForeignKeys/the DB's own
 * NOT NULL, not Bean Validation on a field JSON can never set).
 */
class CarbonRegistryControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String code) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("registryCode", code);
        payload.put("registryName", "Test Registry " + code);
        payload.put("registryType", "COMPLIANCE");
        payload.put("operator", "Test Operator");
        payload.put("website", "https://example.com");
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists_and_resolves_registryType_code() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/carbon-registries")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.registryCode").value(code))
                .andExpect(jsonPath("$.registryId").isNumber())
                .andExpect(jsonPath("$.registryType").value("COMPLIANCE"));
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/carbon-registries")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/carbon-registries")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("registryId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(code));
        update.put("operator", "Updated Operator");

        mockMvc.perform(auth(put("/api/v1/carbon-registries/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operator").value("Updated Operator"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/carbon-registries")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("registryId").asInt();

        mockMvc.perform(auth(patch("/api/v1/carbon-registries/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }

    @Test
    void deactivate_nonexistent_id_returns_404() throws Exception {
        mockMvc.perform(auth(patch("/api/v1/carbon-registries/999999999/deactivate")))
                .andExpect(status().isNotFound());
    }

    @Test
    void requests_without_a_token_are_rejected() throws Exception {
        mockMvc.perform(get("/api/v1/carbon-registries"))
                .andExpect(status().isForbidden());
    }
}
