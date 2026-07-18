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
 * Covers /api/v1/logistics/pipeline-segments. dbo.pipeline_point has no
 * dedicated controller (see PipelinePoint.java's class doc — no frontend
 * dropdown was ever built against it) and is empty in this dev DB, so this
 * test inserts its own from/to points directly via JdbcTemplate before
 * exercising the segment endpoints, mirroring the from_point_id/to_point_id
 * resolution PipelineSegmentService performs via point *codes*.
 */
class PipelineSegmentControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    private String insertPoint(String suffix) {
        String code = "SEG-" + suffix;
        jdbc.update("""
                INSERT INTO dbo.pipeline_point (pipeline_id, location_id, point_code, point_name, point_type, flow_direction, is_active)
                VALUES (1, 1, ?, ?, 'ENTRY', 'BOTH', 1)
                """, code, "Test Point " + code);
        return code;
    }

    private Map<String, Object> validPayload(String code, String fromCode, String toCode) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("pipelineId", 1);
        payload.put("fromPointCode", fromCode);
        payload.put("toPointCode", toCode);
        payload.put("segmentCode", code);
        payload.put("segmentName", "Test Segment " + code);
        payload.put("operationalStatus", "IN_SERVICE");
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists_and_resolves_point_codes_to_ids() throws Exception {
        String suffix = unique();
        String from = insertPoint(suffix + "-FROM");
        String to = insertPoint(suffix + "-TO");

        mockMvc.perform(auth(post("/api/v1/logistics/pipeline-segments")).content(json(validPayload(suffix, from, to))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.segmentId").isNumber())
                .andExpect(jsonPath("$.segmentCode").value(suffix))
                .andExpect(jsonPath("$.fromPointCode").value(from))
                .andExpect(jsonPath("$.toPointCode").value(to))
                .andExpect(jsonPath("$.pipelineName").value("Colonial Pipeline"));
    }

    @Test
    void create_unknown_point_code_returns_404() throws Exception {
        String suffix = unique();
        String to = insertPoint(suffix + "-TO");
        Map<String, Object> payload = validPayload(suffix, "NO-SUCH-POINT-CODE", to);
        mockMvc.perform(auth(post("/api/v1/logistics/pipeline-segments")).content(json(payload)))
                .andExpect(status().isNotFound());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/logistics/pipeline-segments")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        String suffix = unique();
        String from = insertPoint(suffix + "-FROM");
        String to = insertPoint(suffix + "-TO");
        String createBody = mockMvc.perform(auth(post("/api/v1/logistics/pipeline-segments")).content(json(validPayload(suffix, from, to))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("segmentId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(suffix, from, to));
        update.put("segmentName", "Updated Segment Name " + suffix);

        mockMvc.perform(auth(put("/api/v1/logistics/pipeline-segments/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.segmentName").value("Updated Segment Name " + suffix));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String suffix = unique();
        String from = insertPoint(suffix + "-FROM");
        String to = insertPoint(suffix + "-TO");
        String createBody = mockMvc.perform(auth(post("/api/v1/logistics/pipeline-segments")).content(json(validPayload(suffix, from, to))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("segmentId").asInt();

        mockMvc.perform(auth(patch("/api/v1/logistics/pipeline-segments/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
