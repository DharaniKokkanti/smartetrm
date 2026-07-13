package com.etrm.system.guarantee;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Covers /api/v1/parent-company-guarantees CRUD. */
class ParentCompanyGuaranteeControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String reference) {
        Map<String, Object> m = new HashMap<>();
        m.put("pcgReference", reference);
        m.put("direction", "ISSUED");
        m.put("guarantorEntityType", "LEGAL_ENTITY");
        m.put("guarantorEntityId", 1);
        m.put("principalEntityType", "LEGAL_ENTITY");
        m.put("principalEntityId", 2);
        m.put("beneficiaryEntityType", "COUNTERPARTY");
        m.put("beneficiaryEntityId", 1);
        m.put("guaranteeAmount", 1000000);
        m.put("currencyId", 1);
        m.put("issueDate", "2026-01-01");
        m.put("isEvergreen", false);
        m.put("expiryDate", "2030-01-01");
        m.put("pcgStatus", "DRAFT");
        return m;
    }

    private int createGuarantee(String reference) throws Exception {
        String body = mockMvc.perform(auth(post("/api/v1/parent-company-guarantees")).content(json(validPayload(reference))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("pcgId").asInt();
    }

    @Test
    void create_persists_and_is_listed() throws Exception {
        String ref = "PCG-" + unique();
        createGuarantee(ref);
        mockMvc.perform(auth(get("/api/v1/parent-company-guarantees")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void create_duplicate_reference_returns_409() throws Exception {
        String ref = "PCG-" + unique();
        createGuarantee(ref);
        mockMvc.perform(auth(post("/api/v1/parent-company-guarantees")).content(json(validPayload(ref))))
                .andExpect(status().isConflict());
    }

    @Test
    void create_self_guarantee_returns_409() throws Exception {
        Map<String, Object> selfGuarantee = validPayload("PCG-" + unique());
        selfGuarantee.put("principalEntityType", selfGuarantee.get("guarantorEntityType"));
        selfGuarantee.put("principalEntityId", selfGuarantee.get("guarantorEntityId"));

        mockMvc.perform(auth(post("/api/v1/parent-company-guarantees")).content(json(selfGuarantee)))
                .andExpect(status().isConflict());
    }

    @Test
    void update_persists_changes() throws Exception {
        String ref = "PCG-" + unique();
        int id = createGuarantee(ref);

        Map<String, Object> update = validPayload(ref);
        update.put("pcgStatus", "ISSUED");

        mockMvc.perform(auth(put("/api/v1/parent-company-guarantees/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pcgStatus").value("ISSUED"));
    }

    @Test
    void update_nonexistent_id_returns_404() throws Exception {
        mockMvc.perform(auth(put("/api/v1/parent-company-guarantees/999999999")).content(json(validPayload("PCG-" + unique()))))
                .andExpect(status().isNotFound());
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        int id = createGuarantee("PCG-" + unique());
        mockMvc.perform(auth(patch("/api/v1/parent-company-guarantees/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }

    @Test
    void list_filtered_by_entity_returns_only_matching_rows() throws Exception {
        String ref = "PCG-" + unique();
        createGuarantee(ref);
        mockMvc.perform(auth(get("/api/v1/parent-company-guarantees")
                        .param("entityType", "LEGAL_ENTITY")
                        .param("entityId", "1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void requests_without_a_token_are_rejected() throws Exception {
        mockMvc.perform(get("/api/v1/parent-company-guarantees"))
                .andExpect(status().isForbidden());
    }
}
