package com.etrm.system.insurancepolicy;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/credit/insurance-policies CRUD (dbo.insurance_policy extends
 * AuditableEntity). dbo.insurance_provider has no REST endpoint of its own
 * (read-only, per InsuranceProvider.java's doc comment) and ships with zero
 * seed rows, so each test seeds its own provider row directly via JdbcTemplate
 * — the only way to get a valid provider_id FK for this table.
 */
class InsurancePolicyControllerTest extends ApiTestBase {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private int createProvider() {
        String code = "TP" + unique();
        jdbcTemplate.update(
                "INSERT INTO dbo.insurance_provider (provider_code, provider_name, provider_type, created_by) VALUES (?, ?, 'INSURER', 'test')",
                code, "Test Provider " + code);
        return jdbcTemplate.queryForObject(
                "SELECT provider_id FROM dbo.insurance_provider WHERE provider_code = ?", Integer.class, code);
    }

    private Map<String, Object> validPayload(int providerId, String policyNumber) {
        Map<String, Object> m = new HashMap<>();
        m.put("providerId", providerId);
        m.put("legalEntityId", 1);
        m.put("policyNumber", policyNumber);
        m.put("policyType", "CARGO");
        m.put("currencyId", 1);
        m.put("sumInsured", 500000);
        m.put("deductible", 5000);
        m.put("inceptionDate", "2026-01-01");
        m.put("expiryDate", "2027-01-01");
        m.put("policyStatus", "ACTIVE");
        return m;
    }

    private int createPolicy(int providerId, String policyNumber) throws Exception {
        String body = mockMvc.perform(auth(post("/api/v1/credit/insurance-policies")).content(json(validPayload(providerId, policyNumber))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("policyId").asInt();
    }

    @Test
    void create_persists_and_auto_populates_createdBy() throws Exception {
        int providerId = createProvider();
        mockMvc.perform(auth(post("/api/v1/credit/insurance-policies")).content(json(validPayload(providerId, "POL-" + unique()))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.policyId").isNumber())
                .andExpect(jsonPath("$.providerName").isNotEmpty())
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void create_duplicate_policyNumber_for_same_provider_returns_409() throws Exception {
        int providerId = createProvider();
        String policyNumber = "POL-" + unique();
        createPolicy(providerId, policyNumber);

        mockMvc.perform(auth(post("/api/v1/credit/insurance-policies")).content(json(validPayload(providerId, policyNumber))))
                .andExpect(status().isConflict());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/credit/insurance-policies")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_original_createdBy() throws Exception {
        int providerId = createProvider();
        String policyNumber = "POL-" + unique();
        int id = createPolicy(providerId, policyNumber);

        Map<String, Object> update = new HashMap<>(validPayload(providerId, policyNumber));
        update.put("policyStatus", "SUSPENDED");

        mockMvc.perform(auth(put("/api/v1/credit/insurance-policies/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.policyStatus").value("SUSPENDED"))
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }
}
