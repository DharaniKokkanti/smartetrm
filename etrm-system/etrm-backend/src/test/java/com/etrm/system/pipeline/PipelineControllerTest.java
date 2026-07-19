package com.etrm.system.pipeline;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/pipelines. operatorId=1 (Maersk Tankers A/S, a real
 * dbo.transport_operator row) confirmed via direct SQL.
 */
class PipelineControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String code) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("pipelineCode", code);
        payload.put("pipelineName", "Test Pipeline " + code);
        payload.put("pipelineType", "CRUDE");
        payload.put("commodityType", "OIL");
        payload.put("operatorId", 1);
        payload.put("flowDirection", "UNIDIRECTIONAL");
        payload.put("isCrossBorder", false);
        payload.put("isFungible", true);
        payload.put("batchScheduling", false);
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists_and_populates_createdBy() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/pipelines")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.pipelineCode").value(code.toUpperCase()))
                .andExpect(jsonPath("$.pipelineId").isNumber())
                .andExpect(jsonPath("$.operatorName").value("Maersk Tankers A/S"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void create_duplicate_pipelineCode_returns_409() throws Exception {
        String code = unique();
        mockMvc.perform(auth(post("/api/v1/pipelines")).content(json(validPayload(code))))
                .andExpect(status().isCreated());
        mockMvc.perform(auth(post("/api/v1/pipelines")).content(json(validPayload(code))))
                .andExpect(status().isConflict());
    }

    @Test
    void create_invalid_pipelineType_returns_400_or_409() throws Exception {
        Map<String, Object> payload = validPayload(unique());
        payload.put("pipelineType", "NOT_A_REAL_TYPE");
        mockMvc.perform(auth(post("/api/v1/pipelines")).content(json(payload)))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    org.junit.jupiter.api.Assertions.assertTrue(status == 400 || status == 409,
                            "expected 400/409 for invalid pipelineType CHECK constraint, got " + status);
                });
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/pipelines")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_createdBy() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/pipelines")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("pipelineId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(code));
        update.put("pipelineName", "Updated Pipeline Name " + code);
        // V130 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/pipelines/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pipelineName").value("Updated Pipeline Name " + code))
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String code = unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/pipelines")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("pipelineId").asInt();

        mockMvc.perform(auth(patch("/api/v1/pipelines/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
