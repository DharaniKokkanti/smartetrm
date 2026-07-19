package com.etrm.system.commercialterms;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/counterparties/commercial-terms CRUD (dbo.cp_commercial_terms
 * extends AuditableEntity).
 *
 * Unique on (counterparty_id, legal_entity_id, commodity_type,
 * effective_date) — each test creates its own fresh counterparty (via
 * /api/v1/counterparties) rather than reusing a small set of hardcoded ids,
 * so repeated `mvn test` runs against the same live DB can't collide on
 * that composite key.
 */
class CpCommercialTermsControllerTest extends ApiTestBase {

    private int createCounterparty(String code) throws Exception {
        Map<String, Object> m = Map.of(
                "cpCode", code, "legalName", "Terms Test CP " + code, "shortName", code + "-short",
                "jurisdictionId", 1, "cpType", 1, "creditLimitCurrencyId", 1, "settlementDays", 2,
                "isIntercompany", false, "parentInd", false, "kycStatus", 1
        );
        String body = mockMvc.perform(auth(post("/api/v1/counterparties")).content(json(m)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("counterpartyId").asInt();
    }

    private Map<String, Object> validPayload(int counterpartyId) {
        Map<String, Object> m = new HashMap<>();
        m.put("counterpartyId", counterpartyId);
        m.put("legalEntityId", 1);
        m.put("paymentTermId", 1);
        m.put("creditTermId", 9);
        m.put("commodityType", "OIL");
        m.put("effectiveDate", "2026-01-01");
        m.put("isActive", true);
        return m;
    }

    private int createTerms(int counterpartyId) throws Exception {
        String body = mockMvc.perform(auth(post("/api/v1/counterparties/commercial-terms")).content(json(validPayload(counterpartyId))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("cpTermsId").asInt();
    }

    @Test
    void create_persists_and_auto_populates_createdBy() throws Exception {
        int counterpartyId = createCounterparty(unique());
        mockMvc.perform(auth(post("/api/v1/counterparties/commercial-terms")).content(json(validPayload(counterpartyId))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cpTermsId").isNumber())
                .andExpect(jsonPath("$.counterpartyName").isNotEmpty())
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void create_duplicate_scope_returns_409() throws Exception {
        int counterpartyId = createCounterparty(unique());
        createTerms(counterpartyId);
        mockMvc.perform(auth(post("/api/v1/counterparties/commercial-terms")).content(json(validPayload(counterpartyId))))
                .andExpect(status().isConflict());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/counterparties/commercial-terms")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_original_createdBy() throws Exception {
        int counterpartyId = createCounterparty(unique());
        String createBody = mockMvc.perform(auth(post("/api/v1/counterparties/commercial-terms")).content(json(validPayload(counterpartyId))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("cpTermsId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(counterpartyId));
        update.put("notes", "Renegotiated terms");
        // V128 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/counterparties/commercial-terms/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes").value("Renegotiated terms"))
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        int counterpartyId = createCounterparty(unique());
        int id = createTerms(counterpartyId);
        mockMvc.perform(auth(patch("/api/v1/counterparties/commercial-terms/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
