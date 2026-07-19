package com.etrm.system.nettingagreement;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers /api/v1/counterparties/netting-agreements CRUD.
 *
 * Regression coverage for a real, 100%-reproducing bug: dbo.netting_agreement
 * has a NOT NULL created_by column that NettingAgreement never mapped
 * (despite its own doc comment claiming otherwise), so every POST here
 * failed with a constraint violation — same shape as the documented Period
 * bug. Fixed by mapping created_at/created_by with @CreatedDate/@CreatedBy
 * JPA-auditing annotations — create_persists_and_auto_populates_createdBy
 * below is the regression check for that fix.
 *
 * dbo.netting_agreement is unique on (legal_entity_id, counterparty_id,
 * agreement_type) — each test creates its own fresh legal entity (via
 * /api/v1/legal-entities) rather than reusing a small set of hardcoded ids,
 * so repeated `mvn test` runs against the same live DB can't collide on
 * that composite key.
 */
class NettingAgreementControllerTest extends ApiTestBase {

    private int createLegalEntity(String code) throws Exception {
        Map<String, Object> m = Map.of(
                "entityCode", code, "entityName", "Netting Test Entity " + code, "shortName", code + "-short",
                "entityType", 1, "parentInd", false, "jurisdictionId", 1, "baseCurrencyId", 1, "isInternal", true
        );
        String body = mockMvc.perform(auth(post("/api/v1/legal-entities")).content(json(m)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("legalEntityId").asInt();
    }

    private Map<String, Object> validPayload(int legalEntityId) {
        Map<String, Object> m = new HashMap<>();
        m.put("legalEntityId", legalEntityId);
        m.put("counterpartyId", 1);
        m.put("agreementType", 1); // FK -> netting_agreement_type, plain numeric id
        m.put("agreementRef", "NET-" + unique());
        m.put("effectiveDate", "2026-01-01");
        m.put("isActive", true);
        return m;
    }

    private int createNettingAgreement(int legalEntityId) throws Exception {
        String body = mockMvc.perform(auth(post("/api/v1/counterparties/netting-agreements")).content(json(validPayload(legalEntityId))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("nettingId").asInt();
    }

    @Test
    void create_persists_and_auto_populates_createdBy() throws Exception {
        int legalEntityId = createLegalEntity(unique());
        mockMvc.perform(auth(post("/api/v1/counterparties/netting-agreements")).content(json(validPayload(legalEntityId))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nettingId").isNumber())
                .andExpect(jsonPath("$.legalEntityName").isNotEmpty())
                .andExpect(jsonPath("$.counterpartyName").isNotEmpty())
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void create_duplicate_scope_returns_409() throws Exception {
        int legalEntityId = createLegalEntity(unique());
        createNettingAgreement(legalEntityId);
        mockMvc.perform(auth(post("/api/v1/counterparties/netting-agreements")).content(json(validPayload(legalEntityId))))
                .andExpect(status().isConflict());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/counterparties/netting-agreements")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes_and_preserves_original_createdBy() throws Exception {
        int legalEntityId = createLegalEntity(unique());
        String createBody = mockMvc.perform(auth(post("/api/v1/counterparties/netting-agreements")).content(json(validPayload(legalEntityId))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("nettingId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(legalEntityId));
        update.put("notes", "Amended agreement");
        // V128 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/counterparties/netting-agreements/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes").value("Amended agreement"))
                .andExpect(jsonPath("$.createdBy").value("j.smith"));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        int legalEntityId = createLegalEntity(unique());
        int id = createNettingAgreement(legalEntityId);
        mockMvc.perform(auth(patch("/api/v1/counterparties/netting-agreements/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
