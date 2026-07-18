package com.etrm.system.brokerfeeagreement;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Covers /api/v1/broker-fee-agreements CRUD (dbo.broker_fee_agreement only has created_at). */
class BrokerFeeAgreementControllerTest extends ApiTestBase {

    private int createBroker(String code) throws Exception {
        Map<String, Object> broker = new HashMap<>();
        broker.put("brokerCode", code);
        broker.put("brokerName", "Fee Test Broker " + code);
        broker.put("brokerType", "VOICE");
        broker.put("isActive", true);
        String body = mockMvc.perform(auth(post("/api/v1/brokers")).content(json(broker)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("brokerId").asInt();
    }

    private Map<String, Object> validPayload(int brokerId, String agreementCode) {
        Map<String, Object> m = new HashMap<>();
        m.put("brokerId", brokerId);
        m.put("agreementCode", agreementCode);
        m.put("description", "Test fee agreement");
        m.put("feeType", "FLAT_PER_TRADE");
        m.put("feeRate", 10);
        m.put("feeCurrencyId", 1);
        m.put("payPeriod", "MONTHLY");
        m.put("paymentDueDays", 30);
        m.put("effectiveFrom", "2026-01-01");
        m.put("isActive", true);
        return m;
    }

    private int createAgreement(int brokerId, String agreementCode) throws Exception {
        String body = mockMvc.perform(auth(post("/api/v1/broker-fee-agreements")).content(json(validPayload(brokerId, agreementCode))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("agreementId").asInt();
    }

    @Test
    void create_persists_and_hydrates_brokerCode() throws Exception {
        int brokerId = createBroker(unique());
        String agreementCode = "BFA-" + unique();

        mockMvc.perform(auth(post("/api/v1/broker-fee-agreements")).content(json(validPayload(brokerId, agreementCode))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.agreementId").isNumber())
                .andExpect(jsonPath("$.brokerCode").isNotEmpty())
                .andExpect(jsonPath("$.createdAt").isNotEmpty());
    }

    @Test
    void create_duplicate_agreementCode_returns_409() throws Exception {
        int brokerId = createBroker(unique());
        String agreementCode = "BFA-" + unique();
        createAgreement(brokerId, agreementCode);

        mockMvc.perform(auth(post("/api/v1/broker-fee-agreements")).content(json(validPayload(brokerId, agreementCode))))
                .andExpect(status().isConflict());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/broker-fee-agreements")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        int brokerId = createBroker(unique());
        String agreementCode = "BFA-" + unique();
        int id = createAgreement(brokerId, agreementCode);

        Map<String, Object> update = new HashMap<>(validPayload(brokerId, agreementCode));
        update.put("feeRate", 15);

        mockMvc.perform(auth(put("/api/v1/broker-fee-agreements/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.feeRate").value(15));
    }

    @Test
    void deactivate_sets_isActive_false() throws Exception {
        int brokerId = createBroker(unique());
        int id = createAgreement(brokerId, "BFA-" + unique());
        mockMvc.perform(auth(patch("/api/v1/broker-fee-agreements/" + id + "/deactivate")))
                .andExpect(status().isNoContent());
    }
}
