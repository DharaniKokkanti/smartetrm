package com.etrm.system.bankguarantee;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Covers /api/v1/credit/bank-guarantees CRUD (dbo.bank_guarantee extends AuditableEntity). */
class BankGuaranteeControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String bgNumber) {
        Map<String, Object> m = new HashMap<>();
        m.put("bgNumber", bgNumber);
        m.put("bgType", "PERFORMANCE");
        m.put("issuingBankId", 1); // counterparty
        m.put("principalEntityId", 1); // legal_entity
        m.put("beneficiaryCpId", 2); // counterparty
        m.put("currencyId", 1);
        m.put("guaranteeAmount", 500000);
        m.put("issueDate", "2026-01-01");
        m.put("expiryDate", "2027-01-01");
        m.put("claimPeriodDays", 30);
        m.put("bgStatus", "DRAFT");
        m.put("amountCalled", 0);
        return m;
    }

    private int createBankGuarantee(String bgNumber) throws Exception {
        String body = mockMvc.perform(auth(post("/api/v1/credit/bank-guarantees")).content(json(validPayload(bgNumber))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("bgId").asInt();
    }

    @Test
    void create_persists_and_auto_populates_createdBy() throws Exception {
        String bgNumber = "BG-" + unique();
        mockMvc.perform(auth(post("/api/v1/credit/bank-guarantees")).content(json(validPayload(bgNumber))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.bgId").isNumber())
                .andExpect(jsonPath("$.bgNumber").value(bgNumber))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void create_duplicate_bgNumber_returns_409() throws Exception {
        String bgNumber = "BG-" + unique();
        createBankGuarantee(bgNumber);
        mockMvc.perform(auth(post("/api/v1/credit/bank-guarantees")).content(json(validPayload(bgNumber))))
                .andExpect(status().isConflict());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/credit/bank-guarantees")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_original_createdBy() throws Exception {
        String bgNumber = "BG-" + unique();
        int id = createBankGuarantee(bgNumber);

        Map<String, Object> update = new HashMap<>(validPayload(bgNumber));
        update.put("bgStatus", "ISSUED");

        mockMvc.perform(auth(put("/api/v1/credit/bank-guarantees/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bgStatus").value("ISSUED"))
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }
}
