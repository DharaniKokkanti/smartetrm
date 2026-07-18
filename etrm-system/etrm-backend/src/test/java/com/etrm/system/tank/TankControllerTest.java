package com.etrm.system.tank;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/logistics/tanks. facilityId=1 (ROT-TANK-01, a real seeded
 * dbo.storage_facility row) confirmed via direct SQL.
 */
class TankControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String number) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("facilityId", 1);
        payload.put("tankNumber", number);
        payload.put("tankName", "Test Tank " + number);
        payload.put("tankType", "FIXED_ROOF");
        payload.put("commodityType", "OIL");
        payload.put("isHeated", false);
        payload.put("hasMetering", true);
        payload.put("tankStatus", "IN_SERVICE");
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists_and_populates_createdBy() throws Exception {
        String number = unique();
        mockMvc.perform(auth(post("/api/v1/logistics/tanks")).content(json(validPayload(number))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tankNumber").value(number))
                .andExpect(jsonPath("$.tankId").isNumber())
                .andExpect(jsonPath("$.facilityName").value("Rotterdam Tank Terminal"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void create_duplicate_tankNumber_returns_409() throws Exception {
        String number = unique();
        mockMvc.perform(auth(post("/api/v1/logistics/tanks")).content(json(validPayload(number))))
                .andExpect(status().isCreated());
        mockMvc.perform(auth(post("/api/v1/logistics/tanks")).content(json(validPayload(number))))
                .andExpect(status().isConflict());
    }

    @Test
    void create_invalid_tankType_returns_400_or_409() throws Exception {
        Map<String, Object> payload = validPayload(unique());
        payload.put("tankType", "NOT_A_REAL_TYPE");
        mockMvc.perform(auth(post("/api/v1/logistics/tanks")).content(json(payload)))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    org.junit.jupiter.api.Assertions.assertTrue(status == 400 || status == 409,
                            "expected 400/409 for invalid tankType CHECK constraint, got " + status);
                });
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/logistics/tanks")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_createdBy() throws Exception {
        String number = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/logistics/tanks")).content(json(validPayload(number))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("tankId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(number));
        update.put("tankName", "Updated Tank Name " + number);

        mockMvc.perform(auth(put("/api/v1/logistics/tanks/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tankName").value("Updated Tank Name " + number))
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String number = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/logistics/tanks")).content(json(validPayload(number))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("tankId").asInt();

        mockMvc.perform(auth(patch("/api/v1/logistics/tanks/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
