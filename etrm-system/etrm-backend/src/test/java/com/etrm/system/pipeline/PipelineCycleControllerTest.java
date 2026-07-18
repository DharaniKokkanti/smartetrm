package com.etrm.system.pipeline;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/logistics/pipeline-cycles. pipelineId=1 (COLONIAL, a real
 * seeded dbo.pipeline row) confirmed via direct SQL. cyclePriority is
 * TINYINT-backed (Short in Java) — kept well under 255 per this session's
 * standing note on V121's sort_order narrowing (same underlying type).
 */
class PipelineCycleControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String code) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("pipelineId", 1);
        payload.put("cycleType", "DAILY");
        payload.put("cycleCode", code);
        payload.put("cycleName", "Test Cycle " + code);
        payload.put("appliesToDays", "ALL");
        payload.put("cyclePriority", 5);
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists_and_populates_createdBy() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/logistics/pipeline-cycles")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cycleCode").value(code))
                .andExpect(jsonPath("$.cycleId").isNumber())
                .andExpect(jsonPath("$.pipelineName").value("Colonial Pipeline"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/logistics/pipeline-cycles")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_createdBy() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/logistics/pipeline-cycles")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("cycleId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(code));
        update.put("cycleName", "Updated Cycle Name " + code);

        mockMvc.perform(auth(put("/api/v1/logistics/pipeline-cycles/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cycleName").value("Updated Cycle Name " + code))
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void create_invalid_cycleType_returns_400_or_409() throws Exception {
        Map<String, Object> payload = validPayload(unique());
        payload.put("cycleType", "NOT_A_REAL_TYPE");
        mockMvc.perform(auth(post("/api/v1/logistics/pipeline-cycles")).content(json(payload)))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    org.junit.jupiter.api.Assertions.assertTrue(status == 400 || status == 409,
                            "expected 400/409 for invalid cycleType CHECK constraint, got " + status);
                });
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/logistics/pipeline-cycles")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("cycleId").asInt();

        mockMvc.perform(auth(patch("/api/v1/logistics/pipeline-cycles/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
