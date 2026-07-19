package com.etrm.system.marginagreement;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Covers /api/v1/credit/margin-agreements CRUD (dbo.margin_agreement only has created_at/updated_at). */
class MarginAgreementControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload(String agreementCode) {
        Map<String, Object> m = new HashMap<>();
        m.put("agreementCode", agreementCode);
        m.put("agreementType", "CSA_BILATERAL");
        m.put("counterpartyId", 1);
        m.put("thresholdAmount", 100000);
        m.put("thresholdCurrencyId", 1);
        m.put("cpThresholdAmount", 100000);
        m.put("cpThresholdCurrencyId", 1);
        m.put("mtaAmount", 5000);
        m.put("mtaCurrencyId", 1);
        m.put("valuationFrequency", "DAILY");
        m.put("govLaw", "ENGLISH");
        m.put("effectiveDate", "2026-01-01");
        m.put("isActive", true);
        return m;
    }

    private int createAgreement(String agreementCode) throws Exception {
        String body = mockMvc.perform(auth(post("/api/v1/credit/margin-agreements")).content(json(validPayload(agreementCode))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("marginAgreementId").asInt();
    }

    @Test
    void create_persists_and_resolves_lookup_codes() throws Exception {
        String code = "MA-" + unique();
        mockMvc.perform(auth(post("/api/v1/credit/margin-agreements")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.marginAgreementId").isNumber())
                .andExpect(jsonPath("$.agreementType").value("CSA_BILATERAL"))
                .andExpect(jsonPath("$.valuationFrequency").value("DAILY"))
                .andExpect(jsonPath("$.govLaw").value("ENGLISH"))
                .andExpect(jsonPath("$.counterpartyName").isNotEmpty());
    }

    @Test
    void create_duplicate_agreementCode_returns_409() throws Exception {
        String code = "MA-" + unique();
        createAgreement(code);
        mockMvc.perform(auth(post("/api/v1/credit/margin-agreements")).content(json(validPayload(code))))
                .andExpect(status().isConflict());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/credit/margin-agreements")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        // No GET /{id} endpoint exists on this controller (list + update
        // only) — read the version from the create response instead.
        String code = "MA-" + unique();
        String createBody = mockMvc.perform(auth(post("/api/v1/credit/margin-agreements")).content(json(validPayload(code))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("marginAgreementId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload(code));
        update.put("thresholdAmount", 250000);
        // V127 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/credit/margin-agreements/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.thresholdAmount").value(250000));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        int id = createAgreement("MA-" + unique());
        mockMvc.perform(auth(patch("/api/v1/credit/margin-agreements/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
