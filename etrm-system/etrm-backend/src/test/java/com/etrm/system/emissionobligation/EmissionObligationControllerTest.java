package com.etrm.system.emissionobligation;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/emission-obligations: create, list, update, unauthenticated
 * access. No deactivate endpoint — frontend api.ts only has
 * list/create/update.
 *
 * Regression coverage for a real bug found while first writing this suite:
 * EmissionObligation.status (the raw int FK) carried @NotNull directly on
 * the field, but its getter/setter are @JsonIgnore — only the denormalized
 * statusCode string (aliased to the same JSON key) is reachable from JSON.
 * Bean Validation ran on the deserialized entity BEFORE
 * EmissionObligationService.resolveForeignKeys() populated the int field,
 * so every real POST/PUT 400'd unconditionally. Fixed by dropping @NotNull
 * from status (enforcement belongs in resolveForeignKeys/the DB's own NOT
 * NULL, not Bean Validation on a field JSON can never set).
 */
class EmissionObligationControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbc;

    private Map<String, Object> validPayload() {
        Integer legalEntityId = jdbc.queryForObject("SELECT TOP 1 legal_entity_id FROM dbo.legal_entity", Integer.class);
        Integer schemeTypeId = jdbc.queryForObject(
                "SELECT emission_scheme_type_id FROM dbo.emission_scheme_type WHERE type_code = 'COMPLIANCE'", Integer.class);
        String schemeCode = unique();
        jdbc.update("""
                INSERT INTO dbo.emission_scheme
                    (scheme_code, scheme_name, scheme_type, is_active, created_at, updated_at)
                VALUES (?, ?, ?, 1, SYSUTCDATETIME(), SYSUTCDATETIME())
                """, schemeCode, "Test Scheme " + schemeCode, schemeTypeId);
        Integer schemeId = jdbc.queryForObject("SELECT scheme_id FROM dbo.emission_scheme WHERE scheme_code = ?", Integer.class, schemeCode);

        Map<String, Object> payload = new HashMap<>();
        payload.put("legalEntityId", legalEntityId);
        payload.put("schemeId", schemeId);
        payload.put("obligationYear", 2026);
        payload.put("verifiedEmissions", new BigDecimal("1000.00"));
        payload.put("allowancesHeld", new BigDecimal("800.00"));
        payload.put("surrenderDeadline", "2026-12-31");
        payload.put("status", "OPEN");
        payload.put("notes", "Test notes");
        return payload;
    }

    @Test
    void create_persists_and_resolves_status_code() throws Exception {
        mockMvc.perform(auth(post("/api/v1/emission-obligations")).content(json(validPayload())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.obligationId").isNumber())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.entityName").isNotEmpty())
                .andExpect(jsonPath("$.schemeName").isNotEmpty());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/emission-obligations")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        String createBody = mockMvc.perform(auth(post("/api/v1/emission-obligations")).content(json(validPayload())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("obligationId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload());
        update.put("status", "SURRENDERED");
        // V133 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/emission-obligations/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SURRENDERED"));
    }

    @Test
    void update_nonexistent_id_returns_404() throws Exception {
        mockMvc.perform(auth(put("/api/v1/emission-obligations/999999999")).content(json(validPayload())))
                .andExpect(status().isNotFound());
    }

    @Test
    void requests_without_a_token_are_rejected() throws Exception {
        mockMvc.perform(get("/api/v1/emission-obligations"))
                .andExpect(status().isForbidden());
    }
}
