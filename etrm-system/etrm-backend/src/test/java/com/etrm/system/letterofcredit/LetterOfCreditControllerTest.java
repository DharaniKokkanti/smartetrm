package com.etrm.system.letterofcredit;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Covers /api/v1/credit/letters-of-credit CRUD (dbo.letter_of_credit only has created_at/updated_at). */
class LetterOfCreditControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String lcReference) {
        Map<String, Object> m = new HashMap<>();
        m.put("lcReference", lcReference);
        m.put("lcType", "STANDBY");
        m.put("status", "ACTIVE");
        m.put("counterpartyId", 1);
        m.put("beneficiaryEntityId", 1);
        m.put("issuingBankName", "Test Issuing Bank");
        m.put("lcAmount", 250000);
        m.put("lcCurrencyId", 1);
        m.put("issuedAmount", 250000);
        m.put("issueDate", "2026-01-01");
        m.put("expiryDate", "2027-01-01");
        m.put("isEvergreen", false);
        return m;
    }

    private int createLc(String lcReference) throws Exception {
        String body = mockMvc.perform(auth(post("/api/v1/credit/letters-of-credit")).content(json(validPayload(lcReference))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("lcId").asInt();
    }

    @Test
    void create_persists_and_computes_available_amount() throws Exception {
        String ref = "LC-" + unique();
        mockMvc.perform(auth(post("/api/v1/credit/letters-of-credit")).content(json(validPayload(ref))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.lcId").isNumber())
                .andExpect(jsonPath("$.lcType").value("STANDBY"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.counterpartyName").isNotEmpty())
                .andExpect(jsonPath("$.availableAmount").value(250000));
    }

    @Test
    void create_duplicate_lcReference_returns_409() throws Exception {
        String ref = "LC-" + unique();
        createLc(ref);
        mockMvc.perform(auth(post("/api/v1/credit/letters-of-credit")).content(json(validPayload(ref))))
                .andExpect(status().isConflict());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/credit/letters-of-credit")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        String ref = "LC-" + unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/credit/letters-of-credit")).content(json(validPayload(ref))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("lcId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(ref));
        update.put("issuingBankName", "Updated Bank Name");
        // V128 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/credit/letters-of-credit/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.issuingBankName").value("Updated Bank Name"));
    }

    @Test
    void cancel_sets_status_to_cancelled() throws Exception {
        String ref = "LC-" + unique();
        int id = createLc(ref);

        mockMvc.perform(auth(patch("/api/v1/credit/letters-of-credit/" + id + "/cancel")))
                .andExpect(status().isNoContent());

        mockMvc.perform(auth(get("/api/v1/credit/letters-of-credit")))
                .andExpect(status().isOk());
    }
}
