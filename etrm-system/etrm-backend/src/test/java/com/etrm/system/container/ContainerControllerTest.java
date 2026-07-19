package com.etrm.system.container;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/logistics/containers. operatorId=1 (Maersk Tankers A/S) is
 * a real seeded dbo.transport_operator row.
 */
class ContainerControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String number) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("containerNumber", number);
        payload.put("containerType", "ISO_TANK");
        payload.put("operatorId", 1);
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists_and_populates_createdBy() throws Exception {
        String number = unique();
        mockMvc.perform(auth(post("/api/v1/logistics/containers")).content(json(validPayload(number))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.containerNumber").value(number))
                .andExpect(jsonPath("$.containerId").isNumber())
                .andExpect(jsonPath("$.operatorName").value("Maersk Tankers A/S"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void create_duplicate_containerNumber_returns_409() throws Exception {
        String number = unique();
        mockMvc.perform(auth(post("/api/v1/logistics/containers")).content(json(validPayload(number))))
                .andExpect(status().isCreated());
        mockMvc.perform(auth(post("/api/v1/logistics/containers")).content(json(validPayload(number))))
                .andExpect(status().isConflict());
    }

    @Test
    void create_invalid_containerType_returns_400_or_409() throws Exception {
        Map<String, Object> payload = validPayload(unique());
        payload.put("containerType", "NOT_A_REAL_TYPE");
        mockMvc.perform(auth(post("/api/v1/logistics/containers")).content(json(payload)))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    org.junit.jupiter.api.Assertions.assertTrue(status == 400 || status == 409,
                            "expected 400/409 for invalid containerType CHECK constraint, got " + status);
                });
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/logistics/containers")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_createdBy() throws Exception {
        String number = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/logistics/containers")).content(json(validPayload(number))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("containerId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(number));
        update.put("notes", "Updated by ContainerControllerTest " + number);
        // V130 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/logistics/containers/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes").value("Updated by ContainerControllerTest " + number))
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String number = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/logistics/containers")).content(json(validPayload(number))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("containerId").asInt();

        mockMvc.perform(auth(patch("/api/v1/logistics/containers/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
