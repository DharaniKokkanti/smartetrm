package com.etrm.system.legalentity;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers every /api/v1/legal-entities endpoint's CRUD path: create, read
 * (list + by id + 404), update (incl. entity_code immutability), deactivate,
 * bulk create, uppercase normalization, and unauthenticated access.
 */
class LegalEntityControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String code) {
        return Map.of(
                "entityCode", code,
                "entityName", "Test Entity " + code,
                "shortName", code + "-short",
                "entityType", 1,
                "parentInd", false,
                "jurisdictionId", 1,
                "baseCurrencyId", 1,
                "isInternal", true
        );
    }

    @Test
    void create_persists_and_uppercases_code_and_shortName() throws Exception {
        String code = unique().toLowerCase(); // lowercase on purpose — proves server-side normalization
        mockMvc.perform(auth(post("/api/v1/legal-entities")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.entityCode").value(code.toUpperCase()))
                .andExpect(jsonPath("$.shortName").value((code + "-short").toUpperCase()))
                .andExpect(jsonPath("$.legalEntityId").isNumber())
                .andExpect(jsonPath("$.isActive").value(true));
    }

    @Test
    void create_duplicate_entityCode_returns_409() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/legal-entities")).content(json(validPayload(code))))
                .andExpect(status().isCreated());
        mockMvc.perform(auth(post("/api/v1/legal-entities")).content(json(validPayload(code))))
                .andExpect(status().isConflict());
    }

    @Test
    void get_by_id_after_create_returns_200_then_404_for_bogus_id() throws Exception {
        String code = unique();
        String body = mockMvc.perform(auth(post("/api/v1/legal-entities")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(body).get("legalEntityId").asInt();

        mockMvc.perform(auth(get("/api/v1/legal-entities/" + id)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.entityCode").value(code.toUpperCase()));

        mockMvc.perform(auth(get("/api/v1/legal-entities/999999999")))
                .andExpect(status().isNotFound());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/legal-entities")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_but_entityCode_stays_immutable() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/legal-entities")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("legalEntityId").asInt();

        var update = new java.util.HashMap<>(validPayload(code.toLowerCase() + "x")); // within entity_code VARCHAR(20)
        update.put("shortName", "updated-" + code);
        // V127 — echo back the version just read from the create response,
        // same as a real client would; a missing/stale value now correctly
        // 409s instead of the update silently succeeding.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/legal-entities/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.entityCode").value(code.toUpperCase())) // unchanged despite the attempted change
                .andExpect(jsonPath("$.shortName").value(("updated-" + code).toUpperCase()));
    }

    @Test
    void update_nonexistent_id_returns_404() throws Exception {
        mockMvc.perform(auth(put("/api/v1/legal-entities/999999999")).content(json(validPayload(unique()))))
                .andExpect(status().isNotFound());
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/legal-entities")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("legalEntityId").asInt();

        mockMvc.perform(auth(patch("/api/v1/legal-entities/" + id + "/deactivate")))
                .andExpect(status().isNoContent());

        mockMvc.perform(auth(get("/api/v1/legal-entities/" + id)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isActive").value(false));
    }

    @Test
    void bulkCreate_rejects_duplicate_within_batch_but_commits_the_rest() throws Exception {
        String codeA = unique();
        String codeB = unique();
        var request = Map.of("entities", java.util.List.of(
                validPayload(codeA),
                validPayload(codeA), // duplicate of the first — should be rejected, not abort the batch
                validPayload(codeB)
        ));

        mockMvc.perform(auth(post("/api/v1/legal-entities/bulk")).content(json(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.created.length()").value(2))
                .andExpect(jsonPath("$.rejected.length()").value(1));
    }

    @Test
    void requests_without_a_token_are_rejected() throws Exception {
        // 403, not 401 — this app has no custom AuthenticationEntryPoint, so
        // Spring Security's default AuthorizationFilter denial applies.
        mockMvc.perform(get("/api/v1/legal-entities"))
                .andExpect(status().isForbidden());
    }
}
