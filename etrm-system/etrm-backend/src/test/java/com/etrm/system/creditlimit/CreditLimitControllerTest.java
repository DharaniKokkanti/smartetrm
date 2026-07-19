package com.etrm.system.creditlimit;

import com.etrm.system.support.ApiTestBase;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Covers /api/v1/credit/limits CRUD (dbo.credit_limit only has created_at/updated_at). */
class CreditLimitControllerTest extends ApiTestBase {

    private Map<String, Object> validPayload() {
        Map<String, Object> m = new HashMap<>();
        m.put("counterpartyId", 1);
        m.put("limitType", "PRE_SETTLEMENT");
        m.put("limitBasis", "DIRECT");
        m.put("commodityType", "ALL");
        m.put("limitAmount", 1000000);
        m.put("limitCurrencyId", 1);
        m.put("effectiveDate", "2026-01-01");
        m.put("breachAction", "ALERT_ONLY");
        m.put("status", "ACTIVE");
        m.put("isActive", true);
        return m;
    }

    private int createCreditLimit() throws Exception {
        String body = mockMvc.perform(auth(post("/api/v1/credit/limits")).content(json(validPayload())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("creditLimitId").asInt();
    }

    @Test
    void create_persists_and_computes_available_amount() throws Exception {
        mockMvc.perform(auth(post("/api/v1/credit/limits")).content(json(validPayload())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.creditLimitId").isNumber())
                .andExpect(jsonPath("$.counterpartyName").isNotEmpty())
                .andExpect(jsonPath("$.availableAmount").value(1000000))
                .andExpect(jsonPath("$.limitIndicator").value("OK"));
    }

    @Test
    void create_missing_required_counterpartyId_returns_400() throws Exception {
        Map<String, Object> payload = validPayload();
        payload.remove("counterpartyId");
        mockMvc.perform(auth(post("/api/v1/credit/limits")).content(json(payload)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void list_returns_200_and_an_array() throws Exception {
        mockMvc.perform(auth(get("/api/v1/credit/limits")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void update_persists_changes() throws Exception {
        // No GET /{id} endpoint exists on this controller (list + update
        // only) — read the version from the create response instead.
        String createBody = mockMvc.perform(auth(post("/api/v1/credit/limits")).content(json(validPayload())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var createJson = objectMapper.readTree(createBody);
        int id = createJson.get("creditLimitId").asInt();

        Map<String, Object> update = new HashMap<>(validPayload());
        update.put("limitAmount", 2000000);
        // V127 — echo back the version just read, same as a real client would.
        update.put("rowVersion", createJson.get("rowVersion").asInt());

        mockMvc.perform(auth(put("/api/v1/credit/limits/" + id)).content(json(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.limitAmount").value(2000000));
    }

    @Test
    void suspend_then_reinstate_round_trips_status() throws Exception {
        int id = createCreditLimit();

        mockMvc.perform(auth(patch("/api/v1/credit/limits/" + id + "/suspend")))
                .andExpect(status().isNoContent());

        mockMvc.perform(auth(get("/api/v1/credit/limits")))
                .andExpect(status().isOk());

        mockMvc.perform(auth(patch("/api/v1/credit/limits/" + id + "/reinstate")))
                .andExpect(status().isNoContent());
    }
}
