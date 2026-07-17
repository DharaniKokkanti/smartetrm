package com.etrm.system.rinobligation;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/rin-obligations: create, list, update. No deactivate
 * endpoint — frontend api.ts only has list/create/update.
 *
 * Regression coverage for a real bug found while first writing this suite:
 * same root cause as CarbonRegistryControllerTest — RinObligation.status
 * (raw int FK into lookup_value) carried @NotNull on the field but its
 * getter/setter are @JsonIgnore; only the denormalized statusCode string
 * (aliased to the same JSON key) is reachable from JSON. Bean Validation ran
 * before RinObligationService.resolveForeignKeys() populated the int field,
 * so every real POST/PUT 400'd unconditionally. Fixed by dropping @NotNull
 * from status.
 */
class RinObligationControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    // uq_rin_obligation is UNIQUE(legal_entity_id, compliance_year, d_code) —
    // vary compliance_year per call using unique()'s collision-free (across
    // JVM runs, not just within one) counter, so repeated calls never
    // collide with each other OR with leftover rows from a previous run.
    private Map<String, Object> validPayload() {
        Integer legalEntityId = jdbc.queryForObject("SELECT TOP 1 legal_entity_id FROM dbo.legal_entity", Integer.class);
        String dCode = jdbc.queryForObject("SELECT TOP 1 d_code FROM dbo.rin_fuel_category", String.class);

        Map<String, Object> payload = new HashMap<>();
        payload.put("legalEntityId", legalEntityId);
        payload.put("complianceYear", 1000 + (int) (Long.parseLong(unique().substring(1)) % 9000));
        payload.put("dCode", dCode);
        payload.put("requiredQuantity", 10000);
        payload.put("retiredQuantity", 4000);
        payload.put("deadline", "2027-02-28");
        payload.put("status", "OPEN");
        payload.put("notes", "Test notes");
        return payload;
    }

    @Test
    void create_persists_and_resolves_status_code() throws Exception {
        mockMvc.perform(auth(post("/api/v1/rin-obligations")).content(json(validPayload())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.obligationId").isNumber())
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    void update_persists_changes() throws Exception {
        String createBody = mockMvc.perform(auth(post("/api/v1/rin-obligations")).content(json(validPayload())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int id = objectMapper.readTree(createBody).get("obligationId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload());
        update.put("notes", "Updated notes");

        mockMvc.perform(auth(put("/api/v1/rin-obligations/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes").value("Updated notes"));
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/rin-obligations")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void requests_without_a_token_are_rejected() throws Exception {
        mockMvc.perform(get("/api/v1/rin-obligations"))
                .andExpect(status().isForbidden());
    }
}
