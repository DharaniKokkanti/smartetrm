package com.etrm.system.gtc;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/counterparties/gtc-agreements CRUD.
 *
 * Regression coverage for two real bugs found while writing this test:
 *
 * 1. dbo.cp_gtc_agreement has a NOT NULL created_by column that
 *    CpGtcAgreement never mapped, so every POST here failed with a
 *    constraint violation (same shape as the documented Period bug). Fixed
 *    by mapping created_at/created_by with @CreatedDate/@CreatedBy
 *    JPA-auditing annotations.
 * 2. CpGtcAgreement.gtcVersionId carried @NotNull, but that field is only
 *    ever populated server-side (from the client-supplied gtcId) after Bean
 *    Validation already ran — so every POST/PUT 100% failed with "gtcVersionId
 *    must not be null" before the controller method ever executed. Fixed by
 *    removing the misplaced @NotNull, matching the convention every sibling
 *    entity (Period.commodityTypeId, MarginAgreement.agreementTypeId, ...)
 *    already follows for server-resolved FK id fields.
 *
 * create_persists_and_auto_populates_createdBy below is the regression
 * check for both.
 *
 * dbo.cp_gtc_agreement is unique on (counterparty_id, legal_entity_id,
 * gtc_version_id) — each test creates its own fresh counterparty (via
 * /api/v1/counterparties) rather than reusing a small set of hardcoded ids,
 * so repeated `mvn test` runs against the same live DB can't collide on
 * that composite key.
 */
class CpGtcAgreementControllerTest extends ApiTestBase {

    private int createCounterparty(String code) throws Exception {
        Map<String, Object> m = Map.of(
                "cpCode", code, "legalName", "GTC Test CP " + code, "shortName", code + "-short",
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
        m.put("gtcId", 1);
        m.put("effectiveDate", "2026-01-01");
        m.put("isActive", true);
        return m;
    }

    private int createAgreement(int counterpartyId) throws Exception {
        String body = mockMvc.perform(auth(post("/api/v1/counterparties/gtc-agreements")).content(json(validPayload(counterpartyId))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("cpGtcId").asInt();
    }

    @Test
    void create_persists_and_auto_populates_createdBy() throws Exception {
        int counterpartyId = createCounterparty(unique());
        mockMvc.perform(auth(post("/api/v1/counterparties/gtc-agreements")).content(json(validPayload(counterpartyId))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cpGtcId").isNumber())
                .andExpect(jsonPath("$.gtcName").isNotEmpty())
                .andExpect(jsonPath("$.gtcVersion").isNotEmpty())
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void create_duplicate_scope_returns_409() throws Exception {
        int counterpartyId = createCounterparty(unique());
        createAgreement(counterpartyId);
        mockMvc.perform(auth(post("/api/v1/counterparties/gtc-agreements")).content(json(validPayload(counterpartyId))))
                .andExpect(status().isConflict());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/counterparties/gtc-agreements")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_original_createdBy() throws Exception {
        int counterpartyId = createCounterparty(unique());
        int id = createAgreement(counterpartyId);

        Map<String, Object> update = new HashMap<>(validPayload(counterpartyId));
        update.put("notes", "Renewed");

        mockMvc.perform(auth(put("/api/v1/counterparties/gtc-agreements/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes").value("Renewed"))
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        int counterpartyId = createCounterparty(unique());
        int id = createAgreement(counterpartyId);
        mockMvc.perform(auth(patch("/api/v1/counterparties/gtc-agreements/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
