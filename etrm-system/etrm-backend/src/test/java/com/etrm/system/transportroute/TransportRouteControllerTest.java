package com.etrm.system.transportroute;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Regression coverage for a real bug: create() never set created_by (the
 * live dbo.transport_route column is NOT NULL), so every POST failed with a
 * constraint violation until AuditorAware was wired in — same class of bug
 * as PeriodControllerTest's, caught by actually POSTing, not by mvn compile.
 */
class TransportRouteControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    private Map<String, Object> validPayload(String code) {
        List<Integer> locationIds = jdbc.queryForList("SELECT TOP 2 location_id FROM dbo.location ORDER BY location_id", Integer.class);
        Map<String, Object> payload = new HashMap<>();
        payload.put("motTypeId", 4); // TRUCK, seeded and stable
        payload.put("routeCode", code);
        payload.put("routeName", "Test Route " + code);
        payload.put("originLocationId", locationIds.get(0));
        payload.put("destLocationId", locationIds.get(1));
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists_and_auto_populates_createdBy() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/freight/routes")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.routeCode").value(code))
                .andExpect(jsonPath("$.routeId").isNumber())
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"))
                .andExpect(jsonPath("$.motTypeName").isNotEmpty())
                .andExpect(jsonPath("$.originLocationName").isNotEmpty())
                .andExpect(jsonPath("$.destLocationName").isNotEmpty());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/freight/routes")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_original_createdBy() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/freight/routes")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("routeId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(code));
        update.put("routeName", "Updated Name " + code);

        mockMvc.perform(auth(put("/api/v1/freight/routes/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.routeName").value("Updated Name " + code))
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }
}
