package com.etrm.system.desk;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/desks. legalEntityId=1 (MTUK) and commodityType=5
 * (AGRICULTURAL) are real seeded rows (dbo.legal_entity / dbo.commodity_type)
 * confirmed via direct SQL before writing this payload.
 */
class DeskControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String code) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("legalEntityId", 1);
        payload.put("deskCode", code);
        payload.put("deskName", "Test Desk " + code);
        payload.put("commodityType", 5);
        payload.put("isActive", true);
        payload.put("notes", "Created by DeskControllerTest");
        return payload;
    }

    @Test
    void create_persists_and_auto_populates_createdBy() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/desks")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.deskCode").value(code.toUpperCase()))
                .andExpect(jsonPath("$.deskId").isNumber())
                .andExpect(jsonPath("$.legalEntityCode").value("MTUK"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void create_duplicate_deskCode_returns_409() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/desks")).content(json(validPayload(code))))
                .andExpect(status().isCreated());
        mockMvc.perform(auth(post("/api/v1/desks")).content(json(validPayload(code))))
                .andExpect(status().isConflict());
    }

    @Test
    void create_missing_legalEntityId_returns_400() throws Exception {
        Map<String, Object> payload = validPayload(unique());
        payload.remove("legalEntityId");
        mockMvc.perform(auth(post("/api/v1/desks")).content(json(payload)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/desks")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_createdBy() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/desks")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("deskId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(code));
        update.put("deskName", "Updated Desk Name " + code);

        mockMvc.perform(auth(put("/api/v1/desks/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deskName").value("Updated Desk Name " + code))
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void get_returns_denormalized_fields() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/desks")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("deskId").asInt();

        mockMvc.perform(auth(get("/api/v1/desks/" + id)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.legalEntityCode").value("MTUK"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/desks")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("deskId").asInt();

        mockMvc.perform(auth(patch("/api/v1/desks/" + id + "/deactivate")))
                .andExpect(status().isNoContent());

        mockMvc.perform(auth(get("/api/v1/desks/" + id)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isActive").value(false));
    }
}
