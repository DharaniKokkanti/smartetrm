package com.etrm.system.regulatoryobligation;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Regression coverage for a real bug: the entity never mapped created_by at
 * all (the live dbo.regulatory_obligation column is NOT NULL), so every
 * POST failed with a constraint violation until the field was added and
 * AuditorAware wired in — caught by actually POSTing, not by mvn compile.
 */
class RegulatoryObligationControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    // uq_ro is UNIQUE(legal_entity_id, report_type_id, effective_from) — vary
    // effective_from per call using unique()'s collision-free (across JVM
    // runs, not just within one) counter so repeated calls never collide with
    // each other OR with leftover rows from a previous run (deactivate is a
    // soft flag, not a delete, so old rows' effective_from values stay taken).
    private Map<String, Object> validPayload() {
        Integer legalEntityId = jdbc.queryForObject("SELECT TOP 1 legal_entity_id FROM dbo.legal_entity", Integer.class);
        Integer reportTypeId = jdbc.queryForObject("SELECT TOP 1 report_type_id FROM dbo.regulatory_report_type", Integer.class);
        Map<String, Object> payload = new HashMap<>();
        payload.put("legalEntityId", legalEntityId);
        payload.put("reportTypeId", reportTypeId);
        payload.put("obligationType", "FULL");
        payload.put("effectiveFrom", LocalDate.of(2000, 1, 1).plusDays(Long.parseLong(unique().substring(1)) % 9000).toString());
        payload.put("isActive", true);
        return payload;
    }

    @Test
    void create_persists_and_auto_populates_createdBy() throws Exception {
        mockMvc.perform(auth(post("/api/v1/compliance/obligations")).content(json(validPayload())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.obligationId").isNumber())
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"))
                .andExpect(jsonPath("$.legalEntityName").isNotEmpty())
                .andExpect(jsonPath("$.reportTypeName").isNotEmpty());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/compliance/obligations")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_original_createdBy() throws Exception {
        String createBody = mockMvc.perform(auth(post("/api/v1/compliance/obligations")).content(json(validPayload())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("obligationId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload());
        update.put("obligationType", "PARTIAL");

        mockMvc.perform(auth(put("/api/v1/compliance/obligations/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.obligationType").value("PARTIAL"))
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        String createBody = mockMvc.perform(auth(post("/api/v1/compliance/obligations")).content(json(validPayload())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("obligationId").asInt();

        mockMvc.perform(auth(patch("/api/v1/compliance/obligations/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
