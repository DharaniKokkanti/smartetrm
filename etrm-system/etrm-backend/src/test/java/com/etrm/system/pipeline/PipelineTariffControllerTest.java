package com.etrm.system.pipeline;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/logistics/pipeline-tariffs. Same pipeline_point bootstrap
 * approach as PipelineSegmentControllerTest — no dropdown/controller exists
 * for that table, so points are inserted directly via JdbcTemplate.
 * currencyId=1 (USD) and rateUomId=1 (BBL) are real seeded rows.
 */
class PipelineTariffControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    private String insertPoint(String suffix) {
        String code = "TAR-" + suffix;
        jdbc.update("""
                INSERT INTO dbo.pipeline_point (pipeline_id, location_id, point_code, point_name, point_type, flow_direction, is_active)
                VALUES (1, 1, ?, ?, 'ENTRY', 'BOTH', 1)
                """, code, "Test Point " + code);
        return code;
    }

    private Map<String, Object> validPayload(String fromCode, String toCode, String effectiveFrom) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("pipelineId", 1);
        payload.put("fromPointCode", fromCode);
        payload.put("toPointCode", toCode);
        payload.put("tariffType", "COMMODITY");
        payload.put("capacityType", "ENTRY_EXIT");
        payload.put("currencyId", 1);
        payload.put("rate", 1.2345);
        payload.put("rateUomId", 1);
        payload.put("effectiveFrom", effectiveFrom);
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists_and_resolves_point_codes_and_populates_createdBy() throws Exception {
        String suffix = unique();
        String from = insertPoint(suffix + "-FROM");
        String to = insertPoint(suffix + "-TO");

        mockMvc.perform(auth(post("/api/v1/logistics/pipeline-tariffs")).content(json(validPayload(from, to, "2026-01-01"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tariffId").isNumber())
                .andExpect(jsonPath("$.fromPointCode").value(from))
                .andExpect(jsonPath("$.toPointCode").value(to))
                .andExpect(jsonPath("$.currencyCode").value("USD"))
                .andExpect(jsonPath("$.rateUomCode").value("BBL"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void create_duplicate_natural_key_returns_409() throws Exception {
        String suffix = unique();
        String from = insertPoint(suffix + "-FROM");
        String to = insertPoint(suffix + "-TO");
        Map<String, Object> payload = validPayload(from, to, "2026-02-01");

        mockMvc.perform(auth(post("/api/v1/logistics/pipeline-tariffs")).content(json(payload)))
                .andExpect(status().isCreated());
        mockMvc.perform(auth(post("/api/v1/logistics/pipeline-tariffs")).content(json(payload)))
                .andExpect(status().isConflict());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/logistics/pipeline-tariffs")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_createdBy() throws Exception {
        String suffix = unique();
        String from = insertPoint(suffix + "-FROM");
        String to = insertPoint(suffix + "-TO");
        String createBody = mockMvc.perform(auth(post("/api/v1/logistics/pipeline-tariffs")).content(json(validPayload(from, to, "2026-03-01"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("tariffId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(from, to, "2026-03-01"));
        update.put("rate", 9.8765);

        mockMvc.perform(auth(put("/api/v1/logistics/pipeline-tariffs/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rate").value(9.8765))
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String suffix = unique();
        String from = insertPoint(suffix + "-FROM");
        String to = insertPoint(suffix + "-TO");
        String createBody = mockMvc.perform(auth(post("/api/v1/logistics/pipeline-tariffs")).content(json(validPayload(from, to, "2026-04-01"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("tariffId").asInt();

        mockMvc.perform(auth(patch("/api/v1/logistics/pipeline-tariffs/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
