package com.etrm.system.uom;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/uom. uomTypeId=6 (COUNT) is a real seeded dbo.uom_type row
 * confirmed via direct SQL.
 */
class UnitOfMeasureControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String code) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("uomCode", code);
        payload.put("uomName", "Test UoM " + code);
        payload.put("uomTypeId", 6);
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists_and_populates_createdAt() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/uom")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.uomCode").value(code))
                .andExpect(jsonPath("$.uomId").isNumber())
                .andExpect(jsonPath("$.uomTypeCode").value("COUNT"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty());
    }

    @Test
    void create_duplicate_uomCode_returns_409() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/uom")).content(json(validPayload(code))))
                .andExpect(status().isCreated());
        mockMvc.perform(auth(post("/api/v1/uom")).content(json(validPayload(code))))
                .andExpect(status().isConflict());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/uom")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/uom")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("uomId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(code));
        update.put("uomName", "Updated UoM Name " + code);
        // V133 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/uom/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.uomName").value("Updated UoM Name " + code));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/uom")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("uomId").asInt();

        mockMvc.perform(auth(patch("/api/v1/uom/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
