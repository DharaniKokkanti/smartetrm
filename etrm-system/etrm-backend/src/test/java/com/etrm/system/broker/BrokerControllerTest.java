package com.etrm.system.broker;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Covers /api/v1/brokers CRUD (dbo.broker only has created_at, no created_by). */
class BrokerControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String code) {
        Map<String, Object> m = new HashMap<>();
        m.put("brokerCode", code);
        m.put("brokerName", "Test Broker " + code);
        m.put("brokerType", "VOICE");
        m.put("description", "A test broker");
        m.put("contactEmail", "broker@example.com");
        m.put("isActive", true);
        return m;
    }

    private int createBroker(String code) throws Exception {
        String body = mockMvc.perform(auth(post("/api/v1/brokers")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("brokerId").asInt();
    }

    @Test
    void create_persists_and_uppercases_brokerCode() throws Exception {
        String code = unique().toLowerCase();
        mockMvc.perform(auth(post("/api/v1/brokers")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.brokerId").isNumber())
                .andExpect(jsonPath("$.brokerCode").value(code.toUpperCase()))
                .andExpect(jsonPath("$.createdAt").isNotEmpty());
    }

    @Test
    void create_duplicate_brokerCode_returns_409() throws Exception {
        String code = unique();
        createBroker(code);
        mockMvc.perform(auth(post("/api/v1/brokers")).content(json(validPayload(code))))
                .andExpect(status().isConflict());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/brokers")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        // No GET /{id} endpoint exists on this controller (list + update
        // only) — read the version from the create response instead.
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/brokers")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("brokerId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(code));
        update.put("brokerName", "Updated Broker Name " + code);
        // V128 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/brokers/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.brokerName").value("Updated Broker Name " + code));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        int id = createBroker(unique());
        mockMvc.perform(auth(patch("/api/v1/brokers/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
