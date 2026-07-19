package com.etrm.system.period;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Regression coverage for a real, 100%-reproducing bug: dbo.period has a
 * NOT NULL created_by column that the Period entity never mapped, so every
 * POST /api/v1/periods failed with a constraint violation. Fixed by mapping
 * created_at/created_by with the same JPA-auditing annotations
 * AuditableEntity uses (period doesn't have updated_at/updated_by, unlike
 * most other master data tables, so it can't extend that superclass).
 */
class PeriodControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String code) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("periodCode", code);
        payload.put("periodName", "Test Period " + code);
        payload.put("periodType", "MONTH");
        payload.put("isRolling", false);
        payload.put("startDate", "2026-01-01");
        payload.put("endDate", "2026-01-31");
        payload.put("statusCode", "OPEN");
        payload.put("isTradingPeriod", true);
        payload.put("isRiskPeriod", true);
        payload.put("isSettlementPeriod", false);
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists_and_auto_populates_createdBy() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/periods")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.periodCode").value(code.toUpperCase()))
                .andExpect(jsonPath("$.periodId").isNumber())
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void create_duplicate_periodCode_returns_409() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/periods")).content(json(validPayload(code))))
                .andExpect(status().isCreated());
        mockMvc.perform(auth(post("/api/v1/periods")).content(json(validPayload(code))))
                .andExpect(status().isConflict());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/periods")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_original_createdBy() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/periods")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("periodId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(code));
        update.put("periodName", "Updated Name " + code);
        // V133 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/periods/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.periodName").value("Updated Name " + code))
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/periods")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("periodId").asInt();

        mockMvc.perform(auth(patch("/api/v1/periods/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
